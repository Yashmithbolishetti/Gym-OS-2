import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import crypto from "crypto";

dotenv.config();

// -------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION & ENVS
// -------------------------------------------------------------
const rawSupabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
const rawSupabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim().replace(/^["']|["']$/g, "");

let cleanSupabaseUrl = rawSupabaseUrl;
if (cleanSupabaseUrl.endsWith("/")) {
  cleanSupabaseUrl = cleanSupabaseUrl.slice(0, -1);
}
if (cleanSupabaseUrl.endsWith("/rest/v1")) {
  cleanSupabaseUrl = cleanSupabaseUrl.slice(0, -8);
} else if (cleanSupabaseUrl.endsWith("/rest")) {
  cleanSupabaseUrl = cleanSupabaseUrl.slice(0, -5);
}

const SUPABASE_URL = cleanSupabaseUrl || "https://xgrfduzmhnwvknuugtjv.supabase.co";
const SUPABASE_ANON_KEY = rawSupabaseKey || "sb_publishable_bVS2SHqxP0t9AxLwhGbj7w_DIcYdZ2e";

console.log("[GymOS Supabase] URL resolved to:", SUPABASE_URL);
console.log("[GymOS Supabase] KEY length:", SUPABASE_ANON_KEY.length);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------------------------------------------------
// REMOVE DATABASE.JSON AS PRIMARY DATASTORE
// -------------------------------------------------------------
try {
  const localDbPaths = [
    path.join(process.cwd(), "backend", "database.json"),
    path.join(process.cwd(), "database.json")
  ];
  localDbPaths.forEach((p) => {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`[GymOS Database] Permanently deleted legacy local datastore file: ${p}`);
    }
  });
} catch (unlinkErr: any) {
  console.warn("[GymOS Database] Could not clean up legacy database.json:", unlinkErr.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS for decoupled frontend-backend architecture
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Real-Time clients list
let sseClients: any[] = [];

function notifySseClients() {
  sseClients.forEach((client) => {
    try {
      client.write("data: update\n\n");
    } catch (err) {
      // client connection closed or broken
    }
  });
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Helper: member classification helper (dynamic status tagging)
function computeMemberState(m: any) {
  if (m.status === 'suspended') {
    return { ...m, label: 'Suspended', color: 'orange', expiry_group: 'suspended', diffDays: 0 };
  }
  if (!m.expiry_date) {
    return { ...m, status: 'active', label: 'Active', color: 'green', expiry_group: 'active', diffDays: 999 };
  }
  const expiry = new Date(m.expiry_date);
  const today = new Date();
  
  expiry.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { ...m, status: 'expired', label: 'Expired', color: 'red', expiry_group: 'expired', diffDays };
  } else if (diffDays <= 3) {
    return { ...m, status: 'expiring_soon', label: 'Expiring In 3 Days', color: 'red', expiry_group: 'expiring_3', diffDays };
  } else if (diffDays <= 7) {
    return { ...m, status: 'expiring_soon', label: 'Expiring In 7 Days', color: 'orange', expiry_group: 'expiring_7', diffDays };
  } else if (diffDays <= 30) {
    return { ...m, status: 'expiring_soon', label: 'Expiring In 30 Days', color: 'orange', expiry_group: 'expiring_30', diffDays };
  } else {
    return { ...m, status: 'active', label: 'Active', color: 'green', expiry_group: 'active', diffDays };
  }
}

// Lazy Initialize Gemini API Client to prevent crashes during container configurations
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// -------------------------------------------------------------
// DIRECT SUPABASE DATA ACCESS LAYER (ASYNC HELPERS)
// -------------------------------------------------------------
async function getGyms(): Promise<any[]> {
  const { data, error } = await supabase.from("gyms").select("*");
  if (error) {
    console.error("[GymOS Supabase] Error fetching gyms:", error.message);
    return [];
  }
  
  const gyms = data || [];
  // Evaluate subscription expirations dynamically in-place
  for (const g of gyms) {
    if (g.subscription_end_date) {
      const isPast = new Date(g.subscription_end_date) < new Date();
      if (isPast && g.subscription_status !== "expired") {
        g.subscription_status = "expired";
        await supabase.from("gyms").update({ subscription_status: "expired" }).eq("id", g.id);
      } else if (!isPast && g.subscription_status === "expired") {
        g.subscription_status = "active";
        await supabase.from("gyms").update({ subscription_status: "active" }).eq("id", g.id);
      }
    }
  }
  return gyms;
}

async function getGymById(id: string): Promise<any | null> {
  const gyms = await getGyms();
  return gyms.find((g: any) => g.id === id) || null;
}

async function addGym(gym: any): Promise<any> {
  const { data, error } = await supabase.from("gyms").insert(gym).select().single();
  if (error) throw error;
  notifySseClients();
  return data;
}

async function updateGym(id: string, updates: any): Promise<any> {
  const { data, error } = await supabase.from("gyms").update(updates).eq("id", id).select().single();
  if (error) throw error;
  notifySseClients();
  return data;
}

async function getGymNameById(gymId: string): Promise<string> {
  const gym = await getGymById(gymId);
  return gym ? gym.name : "Elite Fitness Studios";
}

async function getUserProfiles(): Promise<any[]> {
  const { data, error } = await supabase.from("user_profiles").select("*");
  if (error) {
    console.error("[GymOS Supabase] Error fetching user_profiles:", error.message);
    return [];
  }
  return data || [];
}

async function addUserProfile(profile: any): Promise<any> {
  const { data, error } = await supabase.from("user_profiles").insert(profile).select().single();
  if (error) throw error;
  return data;
}

async function updateUserProfile(id: string, updates: any): Promise<any> {
  const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

async function getMembers(includeArchived: boolean = false): Promise<any[]> {
  let query = supabase.from("members").select("*");
  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[GymOS Supabase] Error fetching members:", error.message);
    return [];
  }
  return data || [];
}

async function getMemberById(id: string): Promise<any | null> {
  const { data, error } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[GymOS Supabase] Error fetching member by id:", error.message);
    return null;
  }
  return data;
}

async function addMember(member: any): Promise<any> {
  const gymName = await getGymNameById(member.gym_id);
  const payload = { ...member, gym_name: gymName };
  const { data, error } = await supabase.from("members").insert(payload).select().single();
  if (error) throw error;
  notifySseClients();
  return data;
}

async function updateMember(id: string, updates: any): Promise<any> {
  const { data, error } = await supabase.from("members").update(updates).eq("id", id).select().single();
  if (error) throw error;
  notifySseClients();
  return data;
}

async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
  notifySseClients();
}

async function getPayments(): Promise<any[]> {
  const { data, error } = await supabase.from("payments").select("*");
  if (error) {
    console.error("[GymOS Supabase] Error fetching payments:", error.message);
    return [];
  }
  return data || [];
}

async function getPaymentById(id: string): Promise<any | null> {
  const { data, error } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[GymOS Supabase] Error fetching payment by id:", error.message);
    return null;
  }
  return data;
}

async function addPayment(payment: any): Promise<any> {
  const { data, error } = await supabase.from("payments").insert(payment).select().single();
  if (error) throw error;
  notifySseClients();
  return data;
}

async function updatePayment(id: string, updates: any): Promise<any> {
  const { data, error } = await supabase.from("payments").update(updates).eq("id", id).select().single();
  if (error) throw error;
  notifySseClients();
  return data;
}

async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
  notifySseClients();
}

async function getActivities(): Promise<any[]> {
  const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[GymOS Supabase] Error fetching activities:", error.message);
    return [];
  }
  return data || [];
}

async function logAction(gymId: string, action: string, description: string): Promise<void> {
  const log = {
    id: "act-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
    gym_id: gymId || "gym-1",
    action,
    description,
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from("activities").insert(log);
  if (error) {
    console.warn("[GymOS Supabase] Failed to write activity log:", error.message);
  }
  notifySseClients();
}

async function getSettings(): Promise<any> {
  const { data, error } = await supabase.from("settings").select("*").eq("id", "global").maybeSingle();
  if (error) {
    console.error("[GymOS Supabase] Error fetching settings:", error.message);
  }
  if (data) return data;

  // If settings not found, initialize it
  const defaultSettings = {
    id: "global",
    whatsapp_template_30: "Your GymOS membership expires in 30 days. Don't lose your gym streak!",
    whatsapp_template_7: "Your GymOS membership expires in 7 days. Ensure to renew to avoid interruption.",
    whatsapp_template_3: "Your membership expires in 3 days. Prepare your sports gear, renewal is quick!",
    whatsapp_template_0: "Your GymOS membership expires today. Renew now to stay on your fitness path!",
    whatsapp_template_expired: "Your membership has expired. Renew your registration today to resume workouts!",
    supabase_url: "",
    supabase_anon_key: ""
  };
  try {
    const { data: inserted } = await supabase.from("settings").insert(defaultSettings).select().single();
    if (inserted) return inserted;
  } catch (err: any) {
    console.warn("[GymOS Supabase] Failed to insert default settings:", err.message);
  }
  return defaultSettings;
}

async function updateSettings(updates: any): Promise<any> {
  const { data, error } = await supabase.from("settings").upsert({ id: "global", ...updates }).select().single();
  if (error) throw error;
  notifySseClients();
  return data;
}

async function getReminders(): Promise<any[]> {
  const { data, error } = await supabase.from("reminders").select("*").order("sent_at", { ascending: false });
  if (error) {
    console.error("[GymOS Supabase] Error fetching reminders:", error.message);
    return [];
  }
  return data || [];
}

async function addReminder(reminder: any): Promise<any> {
  const { data, error } = await supabase.from("reminders").insert(reminder).select().single();
  if (error) throw error;
  notifySseClients();
  return data;
}

// -------------------------------------------------------------
// DYNAMIC SEEDING ON BOOT
// -------------------------------------------------------------
async function seedSupabaseDatabase() {
  console.log("[GymOS Seeder] Checking Supabase database tables state...");
  const subDaysStr = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const addDaysStr = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Gyms Table
    const gymsCheck = await supabase.from("gyms").select("id", { count: "exact", head: true });
    if (!gymsCheck.error && gymsCheck.count === 0) {
      console.log("[GymOS Seeder] Seeding initial 'gyms'...");
      const initialGyms = [
        {
          id: "gym-1",
          name: "Elite Fitness Studios",
          owner_id: "owner-1",
          owner_name: "Demo Owner",
          email: "demo@gymos.com",
          password_hash: hashPassword("demo123"),
          status: "approved",
          created_at: subDaysStr(365),
          subscription_status: "active",
          subscription_end_date: addDaysStr(180),
          country: "United States",
          currency: "USD",
          password_plain: "demo123"
        },
        {
          id: "gym-2",
          name: "Spartan Heavy Lifters",
          owner_id: "owner-2",
          owner_name: "Leonidas Spartan",
          email: "spartan@gymos.com",
          password_hash: hashPassword("spartan123"),
          status: "pending",
          created_at: subDaysStr(1),
          subscription_status: "active",
          subscription_end_date: addDaysStr(30),
          country: "United States",
          currency: "USD",
          password_plain: "spartan123"
        },
        {
          id: "gym-3",
          name: "Iron Sanctuary",
          owner_id: "owner-3",
          owner_name: "Tony Stark",
          email: "iron@gymos.com",
          password_hash: hashPassword("iron123"),
          status: "pending",
          created_at: new Date().toISOString(),
          subscription_status: "active",
          subscription_end_date: addDaysStr(30),
          country: "United States",
          currency: "USD",
          password_plain: "iron123"
        }
      ];
      await supabase.from("gyms").insert(initialGyms);
    }

    // 2. User Profiles Table
    const profilesCheck = await supabase.from("user_profiles").select("id", { count: "exact", head: true });
    if (!profilesCheck.error && profilesCheck.count === 0) {
      console.log("[GymOS Seeder] Seeding initial 'user_profiles'...");
      const initialProfiles = [
        {
          id: "owner-1",
          email: "demo@gymos.com",
          password: "demo123",
          password_hash: hashPassword("demo123"),
          password_plain: "demo123",
          role: "gym_owner",
          gym_id: "gym-1",
          status: "approved",
          name: "Demo Owner",
          phone: "+1 555-0101",
          created_at: "2025-06-19T17:27:03.416Z"
        },
        {
          id: "owner-2",
          email: "spartan@gymos.com",
          password: "spartan123",
          password_hash: hashPassword("spartan123"),
          password_plain: "spartan123",
          role: "gym_owner",
          gym_id: "gym-2",
          status: "pending",
          name: "Leonidas Spartan",
          phone: "+1 555-0102",
          created_at: "2026-06-18T17:27:03.416Z"
        },
        {
          id: "owner-3",
          email: "iron@gymos.com",
          password: "iron123",
          password_hash: hashPassword("iron123"),
          password_plain: "iron123",
          role: "gym_owner",
          gym_id: "gym-3",
          status: "pending",
          name: "Tony Stark",
          phone: "+1 555-0103",
          created_at: "2026-06-19T17:27:03.416Z"
        }
      ];
      await supabase.from("user_profiles").insert(initialProfiles);
    }

    // 3. Members Table
    const membersCheck = await supabase.from("members").select("id", { count: "exact", head: true });
    if (!membersCheck.error && membersCheck.count === 0) {
      console.log("[GymOS Seeder] Seeding initial 'members'...");
      const initialMembers = [
        {
          id: "mem-1",
          gym_id: "gym-1",
          gym_name: "Elite Fitness Studios",
          name: "Marcus Johnson",
          email: "marcus.j@example.com",
          phone: "+1 555-0101",
          age: 28,
          gender: "Male",
          height: 180,
          weight: 85,
          joining_date: subDaysStr(120),
          membership_plan: "monthly",
          membership_price: 99,
          expiry_date: addDaysStr(20),
          status: "active",
          notes: "Powerlifter focused on squating strength.",
          is_archived: false,
          profile_photo_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=120&auto=format&fit=crop"
        },
        {
          id: "mem-2",
          gym_id: "gym-1",
          gym_name: "Elite Fitness Studios",
          name: "Sarah Williams",
          email: "sarah.w@example.com",
          phone: "+1 555-0102",
          age: 32,
          gender: "Female",
          height: 165,
          weight: 62,
          joining_date: subDaysStr(300),
          membership_plan: "yearly",
          membership_price: 990,
          expiry_date: addDaysStr(3),
          status: "expiring_soon",
          notes: "Enjoys cardio classes and yoga sessions.",
          is_archived: false,
          profile_photo_url: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=120&auto=format&fit=crop"
        },
        {
          id: "mem-3",
          gym_id: "gym-1",
          gym_name: "Elite Fitness Studios",
          name: "Michael Chen",
          email: "michael.c@example.com",
          phone: "+1 555-0103",
          age: 45,
          gender: "Male",
          height: 175,
          weight: 78,
          joining_date: subDaysStr(60),
          membership_plan: "quarterly",
          membership_price: 250,
          expiry_date: subDaysStr(2),
          status: "expired",
          notes: "Prefers morning workouts before office hours.",
          is_archived: false,
          profile_photo_url: ""
        },
        {
          id: "mem-4",
          gym_id: "gym-1",
          gym_name: "Elite Fitness Studios",
          name: "Emma Davis",
          email: "emma.d@example.com",
          phone: "+1 555-0104",
          age: 24,
          gender: "Female",
          height: 170,
          weight: 65,
          joining_date: subDaysStr(15),
          membership_plan: "monthly",
          membership_price: 99,
          expiry_date: addDaysStr(15),
          status: "active",
          notes: "Needs help with nutritional guide.",
          is_archived: false,
          profile_photo_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop"
        },
        {
          id: "mem-5",
          gym_id: "gym-1",
          gym_name: "Elite Fitness Studios",
          name: "David Smith",
          email: "david.s@example.com",
          phone: "+1 555-0105",
          age: 36,
          gender: "Male",
          height: 185,
          weight: 92,
          joining_date: subDaysStr(180),
          membership_plan: "quarterly",
          membership_price: 250,
          expiry_date: addDaysStr(5),
          status: "expiring_soon",
          notes: "Strict keto diet, heavy compound lifts.",
          is_archived: false,
          profile_photo_url: ""
        },
        {
          id: "mem-6",
          gym_id: "gym-1",
          gym_name: "Elite Fitness Studios",
          name: "Robert Taylor",
          email: "robert.t@example.com",
          phone: "+1 555-0106",
          age: 35,
          gender: "Male",
          height: 190,
          weight: 105,
          joining_date: subDaysStr(90),
          membership_plan: "monthly",
          membership_price: 99,
          expiry_date: subDaysStr(10),
          status: "expired",
          notes: "Over 90kg category, focused on hypertrophy and fat loss.",
          is_archived: false,
          profile_photo_url: ""
        },
        {
          id: "mem-7",
          gym_id: "gym-1",
          gym_name: "Elite Fitness Studios",
          name: "Lily Evans",
          email: "lily.e@example.com",
          phone: "+1 555-0107",
          age: 22,
          gender: "Female",
          height: 160,
          weight: 54,
          joining_date: subDaysStr(30),
          membership_plan: "yearly",
          membership_price: 990,
          expiry_date: addDaysStr(335),
          status: "active",
          notes: "Under 60kg category, collegiate athlete.",
          is_archived: false,
          profile_photo_url: ""
        }
      ];
      await supabase.from("members").insert(initialMembers);
    }

    // 4. Payments Table
    const paymentsCheck = await supabase.from("payments").select("id", { count: "exact", head: true });
    if (!paymentsCheck.error && paymentsCheck.count === 0) {
      console.log("[GymOS Seeder] Seeding initial 'payments'...");
      const initialPayments = [
        {
          id: "pay-1",
          gym_id: "gym-1",
          member_id: "mem-1",
          amount: 99,
          payment_method: "card",
          date: subDaysStr(10)
        },
        {
          id: "pay-2",
          gym_id: "gym-1",
          member_id: "mem-2",
          amount: 990,
          payment_method: "bank_transfer",
          date: subDaysStr(362)
        },
        {
          id: "pay-3",
          gym_id: "gym-1",
          member_id: "mem-5",
          amount: 250,
          payment_method: "upi",
          date: subDaysStr(85)
        },
        {
          id: "pay-4",
          gym_id: "gym-1",
          member_id: "mem-4",
          amount: 99,
          payment_method: "upi",
          date: subDaysStr(15)
        },
        {
          id: "pay-5",
          gym_id: "gym-1",
          member_id: "mem-7",
          amount: 990,
          payment_method: "cash",
          date: subDaysStr(30)
        }
      ];
      await supabase.from("payments").insert(initialPayments);
    }

    // 5. Activities Table
    const activitiesCheck = await supabase.from("activities").select("id", { count: "exact", head: true });
    if (!activitiesCheck.error && activitiesCheck.count === 0) {
      console.log("[GymOS Seeder] Seeding initial 'activities'...");
      const initialActivities = [
        {
          id: "act-1",
          gym_id: "gym-1",
          action: "Member Added",
          description: "Lily Evans joined the gym on Yearly Plan",
          created_at: subDaysStr(30)
        },
        {
          id: "act-2",
          gym_id: "gym-1",
          action: "Payment Recorded",
          description: "Payment of $990 received from Lily Evans via Cash",
          created_at: subDaysStr(30)
        },
        {
          id: "act-3",
          gym_id: "gym-1",
          action: "Member Updated",
          description: "David Smith's training notes updated",
          created_at: subDaysStr(2)
        }
      ];
      await supabase.from("activities").insert(initialActivities);
    }

    // 6. Settings Table
    const settingsCheck = await supabase.from("settings").select("id", { count: "exact", head: true });
    if (!settingsCheck.error && settingsCheck.count === 0) {
      console.log("[GymOS Seeder] Seeding initial 'settings'...");
      await getSettings(); // getSettings automatically creates default settings row
    }

    // 7. Reminders Table
    const remindersCheck = await supabase.from("reminders").select("id", { count: "exact", head: true });
    if (!remindersCheck.error && remindersCheck.count === 0) {
      console.log("[GymOS Seeder] Seeding initial 'reminders'...");
      const initialReminders = [
        {
          id: "rem-1",
          member_id: "mem-2",
          member_name: "Sarah Williams",
          expiry_days: 3,
          status: "delivered",
          sent_at: subDaysStr(1),
          message: "Your membership expires in 3 days. Prepare your sports gear, renewal is quick!"
        }
      ];
      await supabase.from("reminders").insert(initialReminders);
    }

    console.log("[GymOS Seeder] Seeding validation check complete.");
  } catch (seedErr: any) {
    console.error("[GymOS Seeder] Non-blocking seeding warning:", seedErr.message || seedErr);
  }
}

seedSupabaseDatabase();

/* ==================== ENDPOINTS ==================== */

// Health & Status Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/auth/sign-up", async (req, res) => {
  try {
    const { email, password, options } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const profiles = await getUserProfiles();
    const existing = profiles.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const { gymName, name, phone, country, currency } = options?.data || {};
    const gymId = "gym-" + Date.now();
    const ownerId = "owner-" + Date.now();

    const newGym = {
      id: gymId,
      name: gymName || "Unnamed Gym",
      owner_id: ownerId,
      owner_name: name || "Gym Owner",
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      password_plain: password,
      status: "pending",
      created_at: new Date().toISOString(),
      subscription_status: "active",
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      country: country || "United States",
      currency: currency || "USD"
    };

    const newProfile = {
      id: ownerId,
      email: email.toLowerCase(),
      password: hashPassword(password),
      password_hash: hashPassword(password),
      password_plain: password,
      role: "gym_owner",
      gym_id: gymId,
      status: "pending",
      name: name || "Gym Owner",
      phone: phone || "",
      created_at: new Date().toISOString()
    };

    const addedGym = await addGym(newGym);
    const addedProfile = await addUserProfile(newProfile);

    await logAction(gymId, "Gym Registered", `New partner gym registered: ${addedGym.name}. Awaiting approval.`);

    res.json({
      session: {
        user: {
          id: addedProfile.id,
          email: addedProfile.email,
          role: addedProfile.role,
          gym_id: addedProfile.gym_id,
          status: addedProfile.status,
          name: addedProfile.name,
          phone: addedProfile.phone,
          created_at: addedProfile.created_at
        },
        gym: addedGym
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@gymos.com";
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123";

    if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      return res.json({
        session: {
          user: {
            id: "admin-1",
            email: adminEmail,
            role: "super_admin",
            created_at: new Date().toISOString()
          },
          gym: null
        }
      });
    }

    const profiles = await getUserProfiles();
    const userProfile = profiles.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    const hashedPassword = hashPassword(password);
    const isValidPassword = userProfile && (
      userProfile.password === password || 
      userProfile.password === hashedPassword || 
      userProfile.password_hash === hashedPassword
    );

    if (!userProfile || !isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const gyms = await getGyms();
    const gymRecord = gyms.find((g: any) => g.id === userProfile.gym_id);

    res.json({
      session: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
          gym_id: userProfile.gym_id,
          status: userProfile.status || "pending",
          name: userProfile.name,
          phone: userProfile.phone,
          created_at: userProfile.created_at
        },
        gym: gymRecord || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/demo-login", async (req, res) => {
  try {
    const { role, status } = req.body;

    if (role === 'super_admin') {
      const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@gymos.com";
      return res.json({
        session: {
          user: {
            id: "admin-1",
            email: adminEmail,
            role: "super_admin",
            created_at: new Date().toISOString()
          },
          gym: null
        }
      });
    }

    const email = status === 'approved' ? 'demo@gymos.com' : status === 'pending' ? 'spartan@gymos.com' : 'iron@gymos.com';
    const profiles = await getUserProfiles();
    const userProfile = profiles.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!userProfile) {
      return res.status(404).json({ error: "Demo user profile not found for status: " + status });
    }

    const gyms = await getGyms();
    const gymRecord = gyms.find((g: any) => g.id === userProfile.gym_id);
    res.json({
      session: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
          gym_id: userProfile.gym_id,
          status: userProfile.status || "pending",
          name: userProfile.name,
          phone: userProfile.phone,
          created_at: userProfile.created_at
        },
        gym: gymRecord || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/sign-out", (req, res) => {
  res.json({ success: true });
});

app.get("/api/auth/user-status", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const profiles = await getUserProfiles();
    const profile = profiles.find((u: any) => u.id === userId);
    if (!profile) return res.status(404).json({ error: "User not found" });

    const gyms = await getGyms();
    const gym = gyms.find((g: any) => g.id === profile.gym_id);
    res.json({
      status: profile.status || "pending",
      gymStatus: gym ? gym.status : "pending",
      gym: gym || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SSE Live Real-Time Subscription Route
app.get("/api/realtime", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.write("data: connected\n\n");
  sseClients.push(res);
  req.on("close", () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// MEMBERS API
app.get("/api/members", async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const members = await getMembers(includeArchived);
    const processed = members.map(computeMemberState);
    res.json(processed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/members", async (req, res) => {
  try {
    const gymId = req.body.gym_id || "gym-1";
    const newMember = {
      id: "mem-" + Date.now(),
      gym_id: gymId,
      name: req.body.name,
      phone: req.body.phone || "",
      email: req.body.email || "",
      age: Number(req.body.age) || 25,
      gender: req.body.gender || "Other",
      height: Number(req.body.height) || 170,
      weight: Number(req.body.weight) || 70,
      joining_date: req.body.joining_date || new Date().toISOString(),
      membership_plan: req.body.membership_plan || "monthly",
      membership_price: Number(req.body.membership_price) || 99,
      expiry_date: req.body.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: req.body.notes || "",
      profile_photo_url: req.body.profile_photo_url || "",
      status: req.body.status || "active",
      is_archived: false,
      emergency_contact: req.body.emergency_contact || "",
      address: req.body.address || "",
      medical_notes: req.body.medical_notes || "",
      additional_notes: req.body.additional_notes || ""
    };

    const added = await addMember(newMember);
    await logAction(gymId, "Member Added", `${added.name} added as a member on ${added.membership_plan} plan.`);
    res.json(computeMemberState(added));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/members/:id", async (req, res) => {
  try {
    const member = await getMemberById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }
    const updatedFields = {
      ...req.body,
      id: member.id,
      gym_id: member.gym_id,
    };
    const updated = await updateMember(req.params.id, updatedFields);
    await logAction(updated.gym_id, "Member Updated", `Profile details updated for ${updated.name}.`);
    res.json(computeMemberState(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Member special actions: suspend / reactivate / archive / restore
app.post("/api/members/:id/suspend", async (req, res) => {
  try {
    const member = await getMemberById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    const updated = await updateMember(req.params.id, { status: "suspended" });
    await logAction(updated.gym_id, "Member Suspended", `${updated.name} has been suspended.`);
    res.json(computeMemberState(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/members/:id/reactivate", async (req, res) => {
  try {
    const member = await getMemberById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    const updated = await updateMember(req.params.id, { status: "active" });
    await logAction(updated.gym_id, "Member Reactivated", `${updated.name}'s suspension has been lifted.`);
    res.json(computeMemberState(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/members/:id/archive", async (req, res) => {
  try {
    const member = await getMemberById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    const updated = await updateMember(req.params.id, { is_archived: true });
    await logAction(updated.gym_id, "Member Archived", `${updated.name} was moved to archives.`);
    res.json(computeMemberState(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/members/:id/restore", async (req, res) => {
  try {
    const member = await getMemberById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    const updated = await updateMember(req.params.id, { is_archived: false });
    await logAction(updated.gym_id, "Member Restored", `${updated.name} restored from archives.`);
    res.json(computeMemberState(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/members/:id", async (req, res) => {
  try {
    const member = await getMemberById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    await deleteMember(req.params.id);
    await logAction(member.gym_id, "Member Deleted", `${member.name}'s record was permanently deleted.`);
    res.json({ success: true, message: `Member ${member.name} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync-all no-op because Supabase is single source of truth
app.post("/api/supabase/sync-all", (req, res) => {
  res.json({
    success: true,
    syncedCount: 0,
    message: "Database is already fully synchronized as Supabase is the single source of truth."
  });
});

// PAYMENTS API
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await getPayments();
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/payments", async (req, res) => {
  try {
    const gymId = req.body.gym_id || "gym-1";
    const newPayment = {
      id: "pay-" + Date.now(),
      gym_id: gymId,
      member_id: req.body.member_id,
      amount: Number(req.body.amount),
      payment_method: req.body.payment_method || "upi",
      date: req.body.date || new Date().toISOString(),
    };

    const added = await addPayment(newPayment);
    const member = await getMemberById(newPayment.member_id);
    let detailMsg = `Payment of $${newPayment.amount} received via ${newPayment.payment_method.toUpperCase()}.`;
    let updatedMember = null;

    if (member) {
      detailMsg = `Payment of $${newPayment.amount} recorded for ${member.name} via ${newPayment.payment_method.toUpperCase()}.`;
      
      const currentExpiry = new Date(member.expiry_date || new Date());
      const startFrom = currentExpiry > new Date() ? currentExpiry : new Date();
      
      let daysToExtend = 30;
      if (member.membership_plan === 'quarterly') daysToExtend = 90;
      else if (member.membership_plan === 'yearly') daysToExtend = 365;
      
      startFrom.setDate(startFrom.getDate() + daysToExtend);
      
      updatedMember = await updateMember(member.id, {
        membership_price: newPayment.amount,
        expiry_date: startFrom.toISOString(),
        status: "active"
      });
      
      detailMsg += ` Membership extended to ${startFrom.toLocaleDateString()}.`;
    }

    await logAction(gymId, "Payment Recorded", detailMsg);
    res.json({ payment: added, member: updatedMember ? computeMemberState(updatedMember) : null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/payments/:id", async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    const updatedFields = {
      ...req.body,
      id: payment.id,
    };
    const updated = await updatePayment(req.params.id, updatedFields);
    await logAction(updated.gym_id, "Payment Updated", `Payment ID ${req.params.id} updated.`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/payments/:id", async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    await deletePayment(req.params.id);
    await logAction(payment.gym_id, "Payment Deleted", `Payment record of $${payment.amount} deleted.`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SETTINGS / MESSAGE TEMPLATES API
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...req.body,
      id: "global"
    };
    const saved = await updateSettings(updatedSettings);
    await logAction("gym-1", "Settings Updated", "Custom WhatsApp notification templates updated.");
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REMINDERS API
app.get("/api/reminders/queue", async (req, res) => {
  try {
    const reminders = await getReminders();
    res.json(reminders || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reminders/send-bulk", async (req, res) => {
  try {
    const { memberIds } = req.body;
    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ error: "Invalid array of memberIds" });
    }

    const settings = await getSettings();
    const results: any[] = [];
    
    for (const id of memberIds) {
      const rawMember = await getMemberById(id);
      if (!rawMember) continue;

      const member = computeMemberState(rawMember);
      let template = settings.whatsapp_template_expired;
      let days = -1;

      if (member.expiry_group === 'expiring_30') {
        template = settings.whatsapp_template_30;
        days = 30;
      } else if (member.expiry_group === 'expiring_7') {
        template = settings.whatsapp_template_7;
        days = 7;
      } else if (member.expiry_group === 'expiring_3') {
        template = settings.whatsapp_template_3;
        days = 3;
      } else if (member.expiry_group === 'active' && member.diffDays === 0) {
        template = settings.whatsapp_template_0;
        days = 0;
      }

      let messageBody = template || "";
      messageBody = messageBody.replace(/{name}/g, member.name);
      messageBody = messageBody.replace(/{expiry_date}/g, new Date(member.expiry_date).toLocaleDateString());

      const statuses = ["delivered", "delivered", "delivered", "failed"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const reminderNode = {
        id: "rem-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        member_id: member.id,
        member_name: member.name,
        expiry_days: days,
        status,
        sent_at: new Date().toISOString(),
        message: messageBody
      };

      await addReminder(reminderNode);
      results.push(reminderNode);

      await logAction(member.gym_id, "WhatsApp Sent", `WhatsApp notification sent to ${member.name}. Delivery status: ${status.toUpperCase()}.`);
    }

    res.json({ success: true, sent: results.length, logs: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SYSTEM NOTIFICATIONS & INTEGRATIONS
app.get("/api/notifications", async (req, res) => {
  try {
    const members = await getMembers(true);
    const processedMembers = members.map(computeMemberState);
    const alerts: any[] = [];

    processedMembers.forEach((m: any) => {
      if (m.expiry_group === 'expired') {
        alerts.push({
          id: "alert-" + m.id + "-expired",
          type: "expired",
          title: "Membership Expired",
          description: `${m.name}'s package of plan ${m.membership_plan.toUpperCase()} expired.`,
          severity: "critical",
          timestamp: m.expiry_date,
        });
      } else if (['expiring_3', 'expiring_7'].includes(m.expiry_group)) {
        alerts.push({
          id: "alert-" + m.id + "-soon",
          type: "expiring",
          title: "Expiring Imminently",
          description: `${m.name} is expiring in ${Math.round(m.diffDays)} days.`,
          severity: "warning",
          timestamp: m.expiry_date,
        });
      }
    });

    const expiredAndUnpaid = processedMembers.filter((m: any) => m.expiry_group === 'expired').length;
    if (expiredAndUnpaid > 0) {
      alerts.push({
        id: "alert-churn",
        type: "churn",
        title: "Retention Risk Alert",
        description: `There are ${expiredAndUnpaid} expired members who haven't renewed their plans yet.`,
        severity: "warning",
        timestamp: new Date().toISOString()
      });
    }

    alerts.push({
      id: "alert-saas-ann",
      type: "announcement",
      title: "GymOS Pro Update",
      description: "Multi-tenant cloud renewal scheduling successfully synced. All systems operational.",
      severity: "info",
      timestamp: new Date().toISOString()
    });

    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PLATFORM ADMIN ONLY API (GYM REGISTRATIONS)
app.get("/api/admin/gyms", async (req, res) => {
  try {
    const gyms = await getGyms();
    const user_profiles = await getUserProfiles();
    
    const enrichedGyms = gyms.map((gym: any) => {
      const profile = user_profiles.find((u: any) => u.gym_id === gym.id);
      return {
        ...gym,
        owner_username: profile?.email || gym.email || "",
        owner_password_plain: profile?.password_plain || gym.password_plain || (profile?.password && profile.password.length < 40 ? profile.password : "N/A"),
        owner_phone: profile?.phone || gym.phone || "N/A"
      };
    });
    
    res.json(enrichedGyms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/gyms/:id/approve", async (req, res) => {
  try {
    const gym = await getGymById(req.params.id);
    if (!gym) return res.status(404).json({ error: "Gym not found" });

    const updatedGym = await updateGym(req.params.id, {
      status: "approved",
      subscription_status: "active",
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    const profiles = await getUserProfiles();
    for (const u of profiles) {
      if (u.gym_id === req.params.id) {
        await updateUserProfile(u.id, { status: "approved" });
      }
    }

    await logAction("gym-1", "Gym Registered & Approved", `Ecosystem approved new partner gym: ${updatedGym.name}.`);
    res.json(updatedGym);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/gyms/:id/reject", async (req, res) => {
  try {
    const gym = await getGymById(req.params.id);
    if (!gym) return res.status(404).json({ error: "Gym not found" });

    const updatedGym = await updateGym(req.params.id, { status: "rejected" });

    const profiles = await getUserProfiles();
    for (const u of profiles) {
      if (u.gym_id === req.params.id) {
        await updateUserProfile(u.id, { status: "rejected" });
      }
    }

    await logAction("gym-1", "Gym Rejected", `Ecosystem rejected partner gym: ${updatedGym.name}.`);
    res.json(updatedGym);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/gyms/:id/suspend", async (req, res) => {
  try {
    const gym = await getGymById(req.params.id);
    if (!gym) return res.status(404).json({ error: "Gym not found" });

    const updatedGym = await updateGym(req.params.id, { status: "suspended" });

    const profiles = await getUserProfiles();
    for (const u of profiles) {
      if (u.gym_id === req.params.id) {
        await updateUserProfile(u.id, { status: "suspended" });
      }
    }

    await logAction("gym-1", "Gym Suspended", `Ecosystem suspended partner gym: ${updatedGym.name}.`);
    res.json(updatedGym);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/gyms/:id/reactivate", async (req, res) => {
  try {
    const gym = await getGymById(req.params.id);
    if (!gym) return res.status(404).json({ error: "Gym not found" });

    const updatedGym = await updateGym(req.params.id, { status: "approved" });

    const profiles = await getUserProfiles();
    for (const u of profiles) {
      if (u.gym_id === req.params.id) {
        await updateUserProfile(u.id, { status: "approved" });
      }
    }

    await logAction("gym-1", "Gym Reactivated", `Ecosystem reactivated partner gym: ${updatedGym.name}.`);
    res.json(updatedGym);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/gyms/:id/renew", async (req, res) => {
  try {
    const gym = await getGymById(req.params.id);
    if (!gym) return res.status(404).json({ error: "Gym not found" });

    const updatedGym = await updateGym(req.params.id, {
      status: "approved",
      subscription_status: "active",
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    const profiles = await getUserProfiles();
    for (const u of profiles) {
      if (u.gym_id === req.params.id) {
        await updateUserProfile(u.id, { status: "approved" });
      }
    }

    await logAction("gym-1", "Gym Membership Renewed", `Ecosystem renewed partner gym: ${updatedGym.name} for 30 more days.`);
    res.json(updatedGym);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ACTIVITY LOGS API
app.get("/api/activities", async (req, res) => {
  try {
    const activities = await getActivities();
    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function for automatic model retry with exponential backoff and alternate model fallbacks
async function generateContentWithFallback(ai: GoogleGenAI, params: any) {
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.1-pro-preview"];
  let lastError: any = null;

  for (const model of models) {
    let attempts = 3;
    while (attempts > 0) {
      try {
        console.log(`[GymOS AI] Attempting generation with model: ${model}, attempts remaining: ${attempts}`);
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        attempts--;
        console.error(`[GymOS AI] Error using model ${model} (attempts remaining ${attempts}):`, err);

        const errMsg = String(err.message || "");
        const isTransient = errMsg.includes("503") || 
                            errMsg.includes("UNAVAILABLE") || 
                            errMsg.includes("429") || 
                            errMsg.includes("exhaust") || 
                            errMsg.includes("demand") ||
                            errMsg.includes("temporary");

        if (attempts > 0 && isTransient) {
          const delay = (3 - attempts) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
  }
  throw lastError || new Error("Failed to generate content with any model.");
}

// GEMINI AI - SECURE SERVER-SIDE CONTEXT GROUNDED INTELLIGENCE
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, activeFile } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const rawNormalized = message.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    
    const lowLatencyResponses: { [key: string]: string } = {
      "hey": "Hey! How can I help today?",
      "hello": "Hello! What can I scan or compile for you?",
      "hi": "Hi there! How can I assist with your gym today?",
      "good morning": "Good morning! Ready to optimize your gym operations today.",
      "good afternoon": "Good afternoon! How can I assist with your members today?",
      "good evening": "Good evening! Ready to help with your gym records.",
      "good night": "Good night! Ready whenever you need assistance.",
      "how are you": "Doing great! Ready to streamline your gym operations.",
      "how are you doing": "Doing great! Ready to streamline your gym operations.",
      "thanks": "You're very welcome! Let me know if you need anything else.",
      "thank you": "You're very welcome! Let me know if you need anything else.",
      "bye": "Goodbye! Have an amazing day ahead.",
      "goodbye": "Goodbye! Let me know whenever you need to check your analytics again.",
      "hey assistant": "Hey! How can I help today?",
      "hi there": "Hi there! What can I check for you?",
      "what can you do": "I can assist you instantly with tracking subscriptions, recording settlements, standardizing Excel ledgers in the Data Analyzer, sending automated WhatsApp alerts, and executing screen controls!",
      "what can i do": "I can assist you instantly with tracking subscriptions, recording settlements, standardizing Excel ledgers in the Data Analyzer, sending automated WhatsApp alerts, and executing screen controls!"
    };

    if (lowLatencyResponses[rawNormalized]) {
      return res.json({ response: lowLatencyResponses[rawNormalized] });
    }

    const greetingsWords = ["hi", "hey", "hello", "good morning", "good evening", "good afternoon"];
    if (greetingsWords.some(w => rawNormalized === w || rawNormalized.startsWith(w + " "))) {
      return res.json({ response: "Hello! What would you like to check today?" });
    }

    const members = await getMembers(true);
    const payments = await getPayments();
    const settings = await getSettings();
    const reminders = await getReminders();
    const gyms = await getGyms();

    const membersWithStatus = members.map(computeMemberState);

    const calculateLiveRevenueMetrics = (paymentsList: any[], membersList: any[]) => {
      const validPayments = paymentsList.filter((p: any) => {
        if (!p) return false;
        if (p.amount === undefined || p.amount === null || isNaN(p.amount) || p.amount <= 0) return false;
        const status = (p.status || "").toLowerCase();
        if (
          status === "cancelled" || 
          status === "refunded" || 
          status === "failed" || 
          status === "suspended" ||
          status === "refund" ||
          status === "fail" ||
          status === "cancel" ||
          status === "suspend"
        ) {
          return false;
        }
        return true;
      });

      const totalReceived = validPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

      const activeMembers = membersList.filter((m: any) => {
        if (m.is_archived) return false;
        const status = (m.status || "").toLowerCase();
        if (status === "expired" || status === "suspended" || status === "cancelled") {
          return false;
        }
        if (m.expiry_date) {
          const expiry = new Date(m.expiry_date);
          const t = new Date();
          expiry.setHours(0,0,0,0);
          t.setHours(0,0,0,0);
          if (expiry.getTime() < t.getTime()) {
            return false;
          }
        } else {
          return false;
        }
        return true;
      });

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 7);
      const startOfWeekTime = startOfWeek.getTime();

      const currentMonthNum = today.getMonth();
      const currentYearNum = today.getFullYear();

      const todaysRevenue = validPayments
        .filter((p: any) => {
          const pDate = new Date(p.date);
          return (
            pDate.getFullYear() === today.getFullYear() &&
            pDate.getMonth() === today.getMonth() &&
            pDate.getDate() === today.getDate()
          );
        })
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const weeklyRevenue = validPayments
        .filter((p: any) => new Date(p.date).getTime() >= startOfWeekTime)
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const monthlyRevenue = validPayments
        .filter((p: any) => {
          const pDate = new Date(p.date);
          return pDate.getFullYear() === currentYearNum && pDate.getMonth() === currentMonthNum;
        })
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const yearlyRevenue = validPayments
        .filter((p: any) => new Date(p.date).getFullYear() === currentYearNum)
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const mrr = activeMembers.reduce((sum: number, m: any) => {
        const price = m.membership_price || 0;
        const plan = (m.membership_plan || "").toLowerCase();
        if (plan.includes("monthly") || plan === "monthly") {
          return sum + price;
        } else if (plan.includes("quarter") || plan === "quarterly") {
          return sum + (price / 3);
        } else if (plan.includes("year") || plan.includes("annual") || plan === "yearly") {
          return sum + (price / 12);
        }
        return sum + price;
      }, 0);

      const arr = mrr * 12;

      let renewalSum = 0;
      const memberGroup: Record<string, any[]> = {};
      validPayments.forEach((p: any) => {
        if (!memberGroup[p.member_id]) {
          memberGroup[p.member_id] = [];
        }
        memberGroup[p.member_id].push(p);
      });

      Object.values(memberGroup).forEach((pmts: any[]) => {
        const sorted = [...pmts].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (sorted.length > 1) {
          for (let i = 1; i < sorted.length; i++) {
            renewalSum += sorted[i].amount;
          }
        }
      });
      const renewalRevenue = renewalSum;

      const prevMonthNum = currentMonthNum === 0 ? 11 : currentMonthNum - 1;
      const prevMonthYear = currentMonthNum === 0 ? currentYearNum - 1 : currentYearNum;

      const prevMonthRevenue = validPayments
        .filter((p: any) => {
          const pDate = new Date(p.date);
          return pDate.getFullYear() === prevMonthYear && pDate.getMonth() === prevMonthNum;
        })
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const revenueGrowthPercentage = prevMonthRevenue > 0 
        ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : monthlyRevenue > 0 ? 100 : 0;

      const totalAuditedMembers = membersList.filter((m: any) => !m.is_archived).length;
      const averageRevenuePerMember = totalAuditedMembers > 0 ? totalReceived / totalAuditedMembers : 0;

      return {
        todaysRevenue,
        weeklyRevenue,
        monthlyRevenue,
        yearlyRevenue,
        totalRevenue: totalReceived,
        mrr,
        arr,
        renewalRevenue,
        membershipRevenue: totalReceived,
        revenueGrowthPercentage,
        averageRevenuePerMember
      };
    };

    const metricsLive = calculateLiveRevenueMetrics(payments, membersWithStatus);
    
    const contextData = {
      currentTime: new Date().toISOString(),
      activeGym: gyms[0] || null,
      liveRevenueEngineMetrics: metricsLive,
      membersSummary: membersWithStatus.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        age: m.age,
        gender: m.gender,
        height: m.height,
        weight: m.weight,
        joining_date: m.joining_date,
        membership_plan: m.membership_plan,
        membership_price: m.membership_price,
        expiry_date: m.expiry_date,
        status: m.status,
        expiry_days: m.diffDays,
        expiry_label: m.label,
        notes: m.notes || ""
      })),
      recentPayments: payments,
      recentReminders: reminders,
      messageTemplates: settings
    };

    const ai = getGeminiClient();

    let systemPrompt = `You are GymOS AI, the elite SaaS context-grounded intelligence expert built for gym owners.
You should behave like a modern smart assistant (such as ChatGPT or Gemini) — natural, conversational, professional, and fast.

CRITICAL PERSONALITY AND LENGTH RULES:
1. DO NOT AUTO-GENERATE REPORTS OR DUMP DATA: Never automatically dump entire dashboard reports, tables, lists, or metrics unless the user explicitly requests them (e.g., "show a table of expiring members", "run a revenue report", "analyze this excel file").
2. SMART RESPONSE LENGTH SYSTEM:
   - For simple greetings (such as "Hey", "Hello", "Hi"): Keep responses under 10 words (e.g., "Hey! How can I help today?").
   - For simple conversation: Keep responses under 15 words and highly conversational.
   - For medium queries (e.g., "Who expires this week?"): Return a brief, highly concise direct answer or action suggestion. Only return relevant rows, not the whole database.
   - For complex, explicit analytical queries (e.g., "Analyze my revenue performance over the last 12 months", "Provide an audit of this Excel file"): Provide a detailed, high-quality, professional report with analytics and structures.
3. TONE: Professional, context-aware, fast, natural, and helpful. Feel like a smart business consultant.`;

    if (activeFile) {
      systemPrompt += `\n\nACTIVE UPLOADED FILE DATA SOURCE (EXCEL/CSV SHEET):
The user has uploaded a file named "${activeFile.fileName}" in the Data Analyzer Center. It is the ACTIVE data source for all analytical, listing, and validation questions.
Here are the raw records and flagged validation anomalies of this uploaded file:
${JSON.stringify(activeFile.rows, null, 2)}

CRITICAL REQUIREMENT & KEY MAPPING FOR THE ACTIVE FILE:
- Treat this uploaded file ("${activeFile.fileName}") as the PRIMARY, ACTIVE data source.
- ALWAYS ignore the standard gym database data completely during analysis unless the user explicitly asks to compare it.
- SCHEMA KEY MAPPING GUIDELINES:
  * When asked about "names" or "members", utilize the "member_name" key from the sheet.
  * When asked about "start date" or "joining date", utilize the "membership_start" key from the sheet.
  * When asked about "expiry date" or "expiration", utilize the "membership_expiry" key from the sheet.
  * When asked about "amount", "collected", "paid", or "revenue", utilize the "payment_amount" key from the sheet.
  * When asked about "status", utilize the "status" key.
  * When asked about validation/data cleanliness issues:
    - Duplicates are marked by "errors.duplicate=true" (e.g., duplicated emails).
    - Missing phone numbers are marked by "errors.missing_phone=true".
    - Invalid phone formats are marked by "errors.invalid_phone=true".
    - Chronologically inverted dates are marked by "errors.invalid_dates=true".
    - Revenue outliers/anomalies are marked by "errors.revenue_anomaly=true".
- When asked to count records or summarize errors in the current sheet, count them strictly from this uploaded file's dataset.
- Advise the gym owner that they can trigger easy 1-click cleanups for duplicates, bad phone numbers, chronological date inversions, revenue outliers, and null fields directly on their main Data Analyzer panel layout.`;
    } else {
      systemPrompt += `\n\nLIVE GYM DATABASE CONTEXT:
Here is the entire LIVE gym database context:
${JSON.stringify(contextData, null, 2)}

CRITICAL REVENUE ENGINE INSTRUCTIONS:
- Retrieve all financial information (revenue, collections, subscriptions, growth, ratios) directly from "liveRevenueEngineMetrics".
- This object has precalculated, live, 100% correct, synchronized values for:
  * Today's Revenue: "todaysRevenue"
  * Weekly Revenue: "weeklyRevenue"
  * Monthly Revenue: "monthlyRevenue"
  * Yearly Revenue: "yearlyRevenue"
  * Total Revenue: "totalRevenue"
  * MRR: "mrr"
  * ARR: "arr"
  * Renewal Revenue: "renewalRevenue"
  * Membership Revenue: "membershipRevenue"
  * Revenue Growth %: "revenueGrowthPercentage"
  * Average Revenue Per Member: "averageRevenuePerMember"
- NEVER calculate these parameters yourself or make up placeholder figures. Reference "liveRevenueEngineMetrics" values directly!`;
    }

    systemPrompt += `\n\nYou can trigger action triggers to mutate database or navigate/control the active screen/modals when the gym owner explicitly commands you.
Use your provided tool coordinates to execute:
1. addNoteToMember(memberId, noteText)
2. triggerWhatsAppReminder(memberId)
3. navigateToPage(pagePath)
4. triggerUIModal(modalType)

When asked to open or navigate to any view (e.g. "go to members list", "show setting price packages", "open activity logs", "show payment history"):
- call \`navigateToPage\` with page paths: "/members", "/payments", "/activity", "/notifications", "/settings", "/" (home dashboard).

When asked to launch or trigger interactive forms or modals (e.g. "add member", "renew member", "record payment checkout", "search member"):
- call \`triggerUIModal\` with modal types: "add_member", "renew_member", "record_payment", "search".`;

    const addNoteTool: FunctionDeclaration = {
      name: "addNoteToMember",
      description: "Appends or modifies a note in a gym member's profile record.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          memberId: { type: Type.STRING, description: "Unique ID of the member (e.g. 'mem-1')." },
          noteText: { type: Type.STRING, description: "Text content of the note to append." }
        },
        required: ["memberId", "noteText"]
      }
    };

    const remindTool: FunctionDeclaration = {
      name: "triggerWhatsAppReminder",
      description: "Dispatches WhatsApp renewal notices/reminders to an expiring or expired member.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          memberId: { type: Type.STRING, description: "Unique ID of the member (e.g. 'mem-2')." }
        },
        required: ["memberId"]
      }
    };

    const navigateToPageTool: FunctionDeclaration = {
      name: "navigateToPage",
      description: "Navigates the owner to a specific view/path on the dashboard application.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          pagePath: {
            type: Type.STRING,
            description: "Target route path to load. Must be one of: '/' (dashboard), '/members' (registry), '/payments' (transactions logs), '/activity' (timelines), '/notifications' (whatsapp rosters), '/settings' (package priced configurations)."
          }
        },
        required: ["pagePath"]
      }
    };

    const triggerUIModalTool: FunctionDeclaration = {
      name: "triggerUIModal",
      description: "Launches an interactive popup modal/form dialog on the screen.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          modalType: {
            type: Type.STRING,
            description: "Specific modal to open. Must be one of: 'add_member' (enrollment form), 'renew_member' (renewal form), 'record_payment' (income supplementary entries), 'search' (universal query search)."
          }
        },
        required: ["modalType"]
      }
    };

    const response = await generateContentWithFallback(ai, {
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: [addNoteTool, remindTool, navigateToPageTool, triggerUIModalTool] }]
      }
    });

    const functionCalls = response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const results: any = { status: "success" };

      if (call.name === "addNoteToMember") {
        const { memberId, noteText } = call.args as any;
        const mObj = await getMemberById(memberId);
        if (mObj) {
          const oldNotes = mObj.notes || "";
          const newNotes = oldNotes ? (oldNotes + " | " + noteText) : noteText;
          await updateMember(memberId, { notes: newNotes });
          await logAction(mObj.gym_id, "AI Action Executed", `AI updated ${mObj.name}'s notes: "${noteText}"`);
          results.feedback = `Successfully appended note into ${mObj.name}'s profile.`;
        } else {
          results.status = "error";
          results.feedback = "Member ID not found.";
        }
      } 
      
      else if (call.name === "triggerWhatsAppReminder") {
        const { memberId } = call.args as any;
        const mObj = await getMemberById(memberId);
        if (mObj) {
          const member = computeMemberState(mObj);
          let template = settings.whatsapp_template_expired;
          let days = -1;
          if (member.expiry_group === 'expiring_30') { template = settings.whatsapp_template_30; days = 30; }
          else if (member.expiry_group === 'expiring_7') { template = settings.whatsapp_template_7; days = 7; }
          else if (member.expiry_group === 'expiring_3') { template = settings.whatsapp_template_3; days = 3; }
          
          let body = template || "";
          body = body.replace(/{name}/g, member.name).replace(/{expiry_date}/g, new Date(member.expiry_date).toLocaleDateString());

          const LogNode = {
            id: "rem-" + Date.now(),
            member_id: member.id,
            member_name: member.name,
            expiry_days: days,
            status: "delivered",
            sent_at: new Date().toISOString(),
            message: body
          };
          await addReminder(LogNode);
          
          await logAction(member.gym_id, "AI Action Executed", `AI sent WhatsApp reminder notice to ${member.name}.`);
          results.feedback = `Simulated dispatch of WhatsApp alert successfully sent to ${member.name}. Details: "${body}"`;
        } else {
          results.status = "error";
          results.feedback = "Member not found.";
        }
      }

      else if (call.name === "navigateToPage") {
        const { pagePath } = call.args as any;
        results.feedback = `Successfully instructed screen to switch to the view at ${pagePath}.`;
      }

      else if (call.name === "triggerUIModal") {
        const { modalType } = call.args as any;
        results.feedback = `Successfully dispatched prompt to launch the UI modal of type ${modalType} on-screen.`;
      }

      const followupResponse = await generateContentWithFallback(ai, {
        contents: [
          { text: message },
          { text: `[SYSTEM_NOTIFICATION: Tool execution completed. Result: ${JSON.stringify(results)}]` }
        ],
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: [addNoteTool, remindTool, navigateToPageTool, triggerUIModalTool] }]
        }
      });

      return res.json({ response: followupResponse.text, toolExecuted: call.name, args: call.args });
    }

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Gemini AI API execution error:", error);
    res.json({ 
      response: `I'm unable to connect to Gemini because your **GEMINI_API_KEY** is not configured yet. Please open **Settings > Secrets** to easily add your backend API token. \n\n*Error details: ${error.message}*` 
    });
  }
});

// Asynchronous helper to mount Vite middleware in development without top-level await
async function startVite() {
  try {
    const vitePkg = "vite";
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({
      root: path.resolve(process.cwd(), "frontend"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } catch (err) {
    console.error("Failed to start Vite middleware:", err);
  }
}

// Mount Vite Middleware for Development / Server Client-Side Static Bundle for Production
if (process.env.VERCEL === "1") {
  // Edge CDN fallback
} else if (process.env.NODE_ENV === "production") {
  const distPath = fs.existsSync(path.join(process.cwd(), "frontend", "dist"))
    ? path.join(process.cwd(), "frontend", "dist")
    : path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  startVite();
}

if (process.env.VERCEL !== "1") {
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[GymOS Server] Active and listening on port ${PORT}`);
  });
}

export default app;
