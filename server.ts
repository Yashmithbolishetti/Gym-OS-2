import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const rawSupabaseUrl = (process.env.VITE_SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
const rawSupabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || "").trim().replace(/^["']|["']$/g, "");

let cleanSupabaseUrl = rawSupabaseUrl;
// Strip trailing slash if present
if (cleanSupabaseUrl.endsWith("/")) {
  cleanSupabaseUrl = cleanSupabaseUrl.slice(0, -1);
}
// Strip /rest/v1 or /rest if present at the end
if (cleanSupabaseUrl.endsWith("/rest/v1")) {
  cleanSupabaseUrl = cleanSupabaseUrl.slice(0, -8);
} else if (cleanSupabaseUrl.endsWith("/rest")) {
  cleanSupabaseUrl = cleanSupabaseUrl.slice(0, -5);
}

const SUPABASE_URL = cleanSupabaseUrl || "https://xgrfduzmhnwvknuugtjv.supabase.co";
const SUPABASE_ANON_KEY = rawSupabaseKey || "sb_publishable_bVS2SHqxP0t9AxLwhGbj7w_DIcYdZ2e";

console.log("SUPABASE_URL resolved to:", SUPABASE_URL);
console.log("SUPABASE_ANON_KEY length:", SUPABASE_ANON_KEY.length);

function getSupabaseAdmin(db?: any) {
  const activeDb = db || getDB();
  const settingsUrl = (activeDb?.settings?.supabase_url || "").trim();
  const settingsKey = (activeDb?.settings?.supabase_anon_key || "").trim();

  const urlToUse = settingsUrl || rawSupabaseUrl;
  const keyToUse = settingsKey || rawSupabaseKey;

  let cleanUrl = urlToUse;
  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  if (cleanUrl.endsWith("/rest/v1")) {
    cleanUrl = cleanUrl.slice(0, -8);
  } else if (cleanUrl.endsWith("/rest")) {
    cleanUrl = cleanUrl.slice(0, -5);
  }

  const finalUrl = cleanUrl || "https://xgrfduzmhnwvknuugtjv.supabase.co";
  const finalKey = keyToUse || "sb_publishable_bVS2SHqxP0t9AxLwhGbj7w_DIcYdZ2e";

  return createClient(finalUrl, finalKey);
}
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getGymNameByGymId(db: any, gymId: string): string {
  const gym = (db.gyms || []).find((g: any) => g.id === gymId);
  if (gym) return gym.name;
  if (db.settings && db.settings.gym_name) return db.settings.gym_name;
  return "GymOS Premium Gym";
}

async function syncMemberToSupabase(member: any, gymName: string) {
  try {
    const db = getDB();
    const payload = {
      id: member.id,
      gym_id: member.gym_id,
      gym_name: gymName,
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      age: Number(member.age) || 25,
      gender: member.gender || "Other",
      height: Number(member.height) || 170,
      weight: Number(member.weight) || 70,
      joining_date: member.joining_date,
      membership_plan: member.membership_plan || "monthly",
      membership_price: Number(member.membership_price) || 99,
      expiry_date: member.expiry_date,
      status: member.status || "active",
      notes: member.notes || "",
      is_archived: !!member.is_archived,
      profile_photo_url: member.profile_photo_url || "",
      emergency_contact: member.emergency_contact || "",
      address: member.address || "",
      medical_notes: member.medical_notes || "",
      additional_notes: member.additional_notes || ""
    };

    const customClient = getSupabaseAdmin(db);
    const { error } = await customClient
      .from("members")
      .upsert(payload);

    if (error) {
      console.warn(`Supabase sync failed for ${member.name}:`, error.message);
    } else {
      console.log(`Successfully synced member ${member.name} to Supabase ('members' table) under gym: ${gymName}`);
    }
  } catch (err: any) {
    console.warn(`Supabase network sync exception for ${member.name}:`, err.message || err);
  }
}

async function deleteMemberFromSupabase(id: string) {
  try {
    const db = getDB();
    const customClient = getSupabaseAdmin(db);
    const { error } = await customClient
      .from("members")
      .delete()
      .eq("id", id);
    if (error) {
      console.warn(`Supabase delete failed for ${id}:`, error.message);
    } else {
      console.log(`Successfully deleted member ${id} from Supabase 'members' table.`);
    }
  } catch (err: any) {
    console.warn(`Supabase network delete exception for ${id}:`, err.message || err);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

// Initialize database with default premium data if it doesn't exist yet
function initializeDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      // Ensure basic structure exists
      if (data.members && data.payments && data.activities && data.settings) {
        return;
      }
    } catch (e) {
      console.error("Error reading database file, re-initializing", e);
    }
  }

  const today = new Date();
  const subDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() - days);
    return res;
  };
  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  const initialData = {
    members: [
      {
        id: "mem-1",
        gym_id: "gym-1",
        name: "Marcus Johnson",
        email: "marcus.j@example.com",
        phone: "+1 555-0101",
        age: 28,
        gender: "Male",
        height: 180,
        weight: 85,
        joining_date: subDays(today, 120).toISOString(),
        membership_plan: "monthly",
        membership_price: 99,
        expiry_date: addDays(today, 20).toISOString(),
        status: "active",
        notes: "Powerlifter focused on squating strength.",
        is_archived: false,
        profile_photo_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=120&auto=format&fit=crop"
      },
      {
        id: "mem-2",
        gym_id: "gym-1",
        name: "Sarah Williams",
        email: "sarah.w@example.com",
        phone: "+1 555-0102",
        age: 32,
        gender: "Female",
        height: 165,
        weight: 62,
        joining_date: subDays(today, 300).toISOString(),
        membership_plan: "yearly",
        membership_price: 990,
        expiry_date: addDays(today, 3).toISOString(),
        status: "expiring_soon",
        notes: "Enjoys cardio classes and yoga sessions.",
        is_archived: false,
        profile_photo_url: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=120&auto=format&fit=crop"
      },
      {
        id: "mem-3",
        gym_id: "gym-1",
        name: "Michael Chen",
        email: "michael.c@example.com",
        phone: "+1 555-0103",
        age: 45,
        gender: "Male",
        height: 175,
        weight: 78,
        joining_date: subDays(today, 60).toISOString(),
        membership_plan: "quarterly",
        membership_price: 250,
        expiry_date: subDays(today, 2).toISOString(),
        status: "expired",
        notes: "Prefers morning workouts before office hours.",
        is_archived: false,
        profile_photo_url: ""
      },
      {
        id: "mem-4",
        gym_id: "gym-1",
        name: "Emma Davis",
        email: "emma.d@example.com",
        phone: "+1 555-0104",
        age: 24,
        gender: "Female",
        height: 170,
        weight: 65,
        joining_date: subDays(today, 15).toISOString(),
        membership_plan: "monthly",
        membership_price: 99,
        expiry_date: addDays(today, 15).toISOString(),
        status: "active",
        notes: "Needs help with nutritional guide.",
        is_archived: false,
        profile_photo_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop"
      },
      {
        id: "mem-5",
        gym_id: "gym-1",
        name: "David Smith",
        email: "david.s@example.com",
        phone: "+1 555-0105",
        age: 36,
        gender: "Male",
        height: 185,
        weight: 92,
        joining_date: subDays(today, 180).toISOString(),
        membership_plan: "quarterly",
        membership_price: 250,
        expiry_date: addDays(today, 5).toISOString(),
        status: "expiring_soon",
        notes: "Strict keto diet, heavy compound lifts.",
        is_archived: false,
        profile_photo_url: ""
      },
      {
        id: "mem-6",
        gym_id: "gym-1",
        name: "Robert Taylor",
        email: "robert.t@example.com",
        phone: "+1 555-0106",
        age: 35,
        gender: "Male",
        height: 190,
        weight: 105,
        joining_date: subDays(today, 90).toISOString(),
        membership_plan: "monthly",
        membership_price: 99,
        expiry_date: subDays(today, 10).toISOString(),
        status: "expired",
        notes: "Over 90kg category, focused on hypertrophy and fat loss.",
        is_archived: false,
        profile_photo_url: ""
      },
      {
        id: "mem-7",
        gym_id: "gym-1",
        name: "Lily Evans",
        email: "lily.e@example.com",
        phone: "+1 555-0107",
        age: 22,
        gender: "Female",
        height: 160,
        weight: 54,
        joining_date: subDays(today, 30).toISOString(),
        membership_plan: "yearly",
        membership_price: 990,
        expiry_date: addDays(today, 335).toISOString(),
        status: "active",
        notes: "Under 60kg category, collegiate athlete.",
        is_archived: false,
        profile_photo_url: ""
      }
    ],
    payments: [
      {
        id: "pay-1",
        gym_id: "gym-1",
        member_id: "mem-1",
        amount: 99,
        payment_method: "card",
        date: subDays(today, 10).toISOString()
      },
      {
        id: "pay-2",
        gym_id: "gym-1",
        member_id: "mem-2",
        amount: 990,
        payment_method: "bank_transfer",
        date: subDays(today, 362).toISOString()
      },
      {
        id: "pay-3",
        gym_id: "gym-1",
        member_id: "mem-5",
        amount: 250,
        payment_method: "upi",
        date: subDays(today, 85).toISOString()
      },
      {
        id: "pay-4",
        gym_id: "gym-1",
        member_id: "mem-4",
        amount: 99,
        payment_method: "upi",
        date: subDays(today, 15).toISOString()
      },
      {
        id: "pay-5",
        gym_id: "gym-1",
        member_id: "mem-7",
        amount: 990,
        payment_method: "cash",
        date: subDays(today, 30).toISOString()
      }
    ],
    activities: [
      {
        id: "act-1",
        gym_id: "gym-1",
        action: "Member Added",
        description: "Lily Evans joined the gym on Yearly Plan",
        created_at: subDays(today, 30).toISOString()
      },
      {
        id: "act-2",
        gym_id: "gym-1",
        action: "Payment Recorded",
        description: "Payment of $990 received from Lily Evans via Cash",
        created_at: subDays(today, 30).toISOString()
      },
      {
        id: "act-3",
        gym_id: "gym-1",
        action: "Member Updated",
        description: "David Smith's training notes updated",
        created_at: subDays(today, 2).toISOString()
      }
    ],
    settings: {
      whatsapp_template_30: "Your GymOS membership expires in 30 days. Don't lose your gym streak!",
      whatsapp_template_7: "Your GymOS membership expires in 7 days. Ensure to renew to avoid interruption.",
      whatsapp_template_3: "Your membership expires in 3 days. Prepare your sports gear, renewal is quick!",
      whatsapp_template_0: "Your GymOS membership expires today. Renew now to stay on your fitness path!",
      whatsapp_template_expired: "Your membership has expired. Renew your registration today to resume workouts!"
    },
    reminders: [
      {
        id: "rem-1",
        member_id: "mem-2",
        member_name: "Sarah Williams",
        expiry_days: 3,
        status: "delivered",
        sent_at: subDays(today, 1).toISOString(),
        message: "Your membership expires in 3 days. Prepare your sports gear, renewal is quick!"
      }
    ],
    gyms: [
      {
        id: "gym-1",
        name: "Elite Fitness Studios",
        owner_id: "owner-1",
        owner_name: "Demo Owner",
        email: "demo@gymos.com",
        password_hash: hashPassword("demo123"),
        status: "approved",
        created_at: subDays(today, 365).toISOString(),
        subscription_status: "active",
        subscription_end_date: addDays(today, 180).toISOString()
      },
      {
        id: "gym-2",
        name: "Spartan Heavy Lifters",
        owner_id: "owner-2",
        owner_name: "Leonidas Spartan",
        email: "spartan@gymos.com",
        password_hash: hashPassword("spartan123"),
        status: "pending",
        created_at: subDays(today, 1).toISOString(),
        subscription_status: "active",
        subscription_end_date: addDays(today, 30).toISOString()
      },
      {
        id: "gym-3",
        name: "Iron Sanctuary",
        owner_id: "owner-3",
        owner_name: "Tony Stark",
        email: "iron@gymos.com",
        password_hash: hashPassword("iron123"),
        status: "pending",
        created_at: subDays(today, 0).toISOString(),
        subscription_status: "active",
        subscription_end_date: addDays(today, 30).toISOString()
      }
    ]
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write initial database.json (this is expected on read-only environments like Vercel):", err);
  }
}

initializeDatabase();

// Database read/write helpers
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

function getDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initializeDatabase();
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(raw);
    
    // Evaluate subscription expirations dynamically in-place
    let modified = false;
    if (db.gyms && Array.isArray(db.gyms)) {
      db.gyms.forEach((g: any) => {
        if (g.subscription_end_date) {
          const isPast = new Date(g.subscription_end_date) < new Date();
          if (isPast && g.subscription_status !== "expired") {
            g.subscription_status = "expired";
            modified = true;
          } else if (!isPast && g.subscription_status === "expired") {
            g.subscription_status = "active";
            modified = true;
          }
        }
      });
    }

    if (!db.user_profiles) {
      db.user_profiles = [
        {
          id: "owner-1",
          email: "demo@gymos.com",
          password: "demo123",
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
          role: "gym_owner",
          gym_id: "gym-3",
          status: "pending",
          name: "Tony Stark",
          phone: "+1 555-0103",
          created_at: "2026-06-19T17:27:03.416Z"
        }
      ];
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    }
    return db;
  } catch (e) {
    console.error("Error reading database file, returning fresh structure", e);
    return {
      members: [],
      payments: [],
      activities: [],
      settings: {},
      reminders: [],
      gyms: [],
      user_profiles: [
        {
          id: "owner-1",
          email: "demo@gymos.com",
          password: "demo123",
          role: "gym_owner",
          gym_id: "gym-1",
          status: "approved",
          name: "Demo Owner",
          phone: "+1 555-0101",
          created_at: "2025-06-19T17:27:03.416Z"
        }
      ]
    };
  }
}

function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    notifySseClients();
  } catch (e) {
    console.error("Error writing to database.json", e);
  }
}

// Log an action helper
function logAction(gymId: string, action: string, description: string) {
  const db = getDB();
  const log = {
    id: "act-" + Date.now(),
    gym_id: gymId || "gym-1",
    action,
    description,
    created_at: new Date().toISOString()
  };
  db.activities = [log, ...db.activities];
  saveDB(db);
}

// Member classification helper (dynamic status tagging)
function computeMemberState(m: any) {
  if (m.status === 'suspended') {
    return { ...m, label: 'Suspended', color: 'orange', expiry_group: 'suspended' };
  }
  const expiry = new Date(m.expiry_date);
  const today = new Date();
  
  // Set times to midnight for precise day calculation
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
      throw new Error("GEMINI_API_KEY environment variable is not configured yet in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}


/* ==================== ENDPOINTS ==================== */

// Health & Status Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/auth/sign-up", (req, res) => {
  const { email, password, options } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const db = getDB();
  db.user_profiles = db.user_profiles || [];
  db.gyms = db.gyms || [];

  const existing = db.user_profiles.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
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
    password: hashPassword(password), // hashed
    password_hash: hashPassword(password), // hashed
    password_plain: password,
    role: "gym_owner",
    gym_id: gymId,
    status: "pending",
    name: name || "Gym Owner",
    phone: phone || "",
    created_at: new Date().toISOString()
  };

  db.user_profiles.push(newProfile);
  db.gyms.push(newGym);

  saveDB(db);

  logAction(gymId, "Gym Registered", `New partner gym registered: ${newGym.name}. Awaiting approval.`);

  res.json({
    session: {
      user: {
        id: newProfile.id,
        email: newProfile.email,
        role: newProfile.role,
        gym_id: newProfile.gym_id,
        status: newProfile.status,
        name: newProfile.name,
        phone: newProfile.phone,
        created_at: newProfile.created_at
      },
      gym: newGym
    }
  });
});

app.post("/api/auth/sign-in", (req, res) => {
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

  const db = getDB();
  const userProfiles = db.user_profiles || [];
  const userProfile = userProfiles.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  const hashedPassword = hashPassword(password);
  const isValidPassword = userProfile && (
    userProfile.password === password || 
    userProfile.password === hashedPassword || 
    userProfile.password_hash === hashedPassword
  );

  if (!userProfile || !isValidPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const gymRecord = (db.gyms || []).find((g: any) => g.id === userProfile.gym_id);

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
});

app.post("/api/auth/demo-login", (req, res) => {
  const { role, status } = req.body;
  const db = getDB();

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
  const userProfile = (db.user_profiles || []).find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!userProfile) {
    return res.status(404).json({ error: "Demo user profile not found for status: " + status });
  }

  const gymRecord = (db.gyms || []).find((g: any) => g.id === userProfile.gym_id);
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
});

app.post("/api/auth/sign-out", (req, res) => {
  res.json({ success: true });
});

app.get("/api/auth/user-status", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const db = getDB();
  const profile = (db.user_profiles || []).find((u: any) => u.id === userId);
  if (!profile) return res.status(404).json({ error: "User not found" });

  const gym = (db.gyms || []).find((g: any) => g.id === profile.gym_id);
  res.json({
    status: profile.status || "pending",
    gymStatus: gym ? gym.status : "pending",
    gym: gym || null
  });
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
app.get("/api/members", (req, res) => {
  const db = getDB();
  const includeArchived = req.query.includeArchived === "true";
  
  // Tag status dynamically on load
  const processed = db.members
    .filter((m: any) => includeArchived ? true : !m.is_archived)
    .map(computeMemberState);
  
  res.json(processed);
});

app.post("/api/members", (req, res) => {
  const db = getDB();
  const newMember = {
    id: "mem-" + Date.now(),
    gym_id: req.body.gym_id || "gym-1",
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
  };

  db.members.push(newMember);
  saveDB(db);

  // Sync to Supabase in background
  syncMemberToSupabase(newMember, getGymNameByGymId(db, newMember.gym_id));

  logAction(newMember.gym_id, "Member Added", `${newMember.name} added as a member on ${newMember.membership_plan} plan.`);
  res.json(computeMemberState(newMember));
});

app.put("/api/members/:id", (req, res) => {
  const db = getDB();
  const index = db.members.findIndex((m: any) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Member not found" });
  }

  const updated = {
    ...db.members[index],
    ...req.body,
    // Keep id and gym_id immutable
    id: db.members[index].id,
    gym_id: db.members[index].gym_id,
  };

  db.members[index] = updated;
  saveDB(db);

  // Sync to Supabase in background
  syncMemberToSupabase(updated, getGymNameByGymId(db, updated.gym_id));

  logAction(updated.gym_id, "Member Updated", `Profile details updated for ${updated.name}.`);
  res.json(computeMemberState(updated));
});

// Member special actions: suspend / reactivate / archive / restore
app.post("/api/members/:id/suspend", (req, res) => {
  const db = getDB();
  const index = db.members.findIndex((m: any) => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Member not found" });

  db.members[index].status = "suspended";
  saveDB(db);

  // Sync to Supabase in background
  syncMemberToSupabase(db.members[index], getGymNameByGymId(db, db.members[index].gym_id));

  logAction(db.members[index].gym_id, "Member Suspended", `${db.members[index].name} has been suspended.`);
  res.json(computeMemberState(db.members[index]));
});

app.post("/api/members/:id/reactivate", (req, res) => {
  const db = getDB();
  const index = db.members.findIndex((m: any) => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Member not found" });

  // Reset to computed state based on dates
  db.members[index].status = "active";
  saveDB(db);

  // Sync to Supabase in background
  syncMemberToSupabase(db.members[index], getGymNameByGymId(db, db.members[index].gym_id));

  logAction(db.members[index].gym_id, "Member Reactivated", `${db.members[index].name}'s suspension has been lifted.`);
  res.json(computeMemberState(db.members[index]));
});

app.post("/api/members/:id/archive", (req, res) => {
  const db = getDB();
  const index = db.members.findIndex((m: any) => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Member not found" });

  db.members[index].is_archived = true;
  saveDB(db);

  // Sync to Supabase in background
  syncMemberToSupabase(db.members[index], getGymNameByGymId(db, db.members[index].gym_id));

  logAction(db.members[index].gym_id, "Member Archived", `${db.members[index].name} was moved to archives.`);
  res.json(computeMemberState(db.members[index]));
});

app.post("/api/members/:id/restore", (req, res) => {
  const db = getDB();
  const index = db.members.findIndex((m: any) => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Member not found" });

  db.members[index].is_archived = false;
  saveDB(db);

  // Sync to Supabase in background
  syncMemberToSupabase(db.members[index], getGymNameByGymId(db, db.members[index].gym_id));

  logAction(db.members[index].gym_id, "Member Restored", `${db.members[index].name} restored from archives.`);
  res.json(computeMemberState(db.members[index]));
});

app.delete("/api/members/:id", (req, res) => {
  const db = getDB();
  const index = db.members.findIndex((m: any) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Member not found" });
  }

  const name = db.members[index].name;
  const gymId = db.members[index].gym_id;

  db.members.splice(index, 1);
  saveDB(db);

  // Delete from Supabase in background
  deleteMemberFromSupabase(req.params.id);

  logAction(gymId, "Member Deleted", `${name}'s record was permanently deleted.`);
  res.json({ success: true, message: `Member ${name} deleted successfully.` });
});

app.post("/api/supabase/sync-all", async (req, res) => {
  try {
    const db = getDB();
    const members = db.members || [];
    if (members.length === 0) {
      return res.json({ success: true, count: 0, message: "No members to sync." });
    }

    console.log(`Starting manual bulk sync of ${members.length} members to Supabase...`);
    let syncedCount = 0;
    let failedCount = 0;
    let lastError = null;

    const customClient = getSupabaseAdmin(db);
    const activeUrl = (db.settings?.supabase_url || "").trim() || rawSupabaseUrl || "https://xgrfduzmhnwvknuugtjv.supabase.co";

    for (const member of members) {
      const gymName = getGymNameByGymId(db, member.gym_id);
      try {
        const payload = {
          id: member.id,
          gym_id: member.gym_id,
          gym_name: gymName,
          name: member.name,
          email: member.email || "",
          phone: member.phone || "",
          age: Number(member.age) || 25,
          gender: member.gender || "Other",
          height: Number(member.height) || 170,
          weight: Number(member.weight) || 70,
          joining_date: member.joining_date,
          membership_plan: member.membership_plan || "monthly",
          membership_price: Number(member.membership_price) || 99,
          expiry_date: member.expiry_date,
          status: member.status || "active",
          notes: member.notes || "",
          is_archived: !!member.is_archived,
          profile_photo_url: member.profile_photo_url || "",
          emergency_contact: member.emergency_contact || "",
          address: member.address || "",
          medical_notes: member.medical_notes || "",
          additional_notes: member.additional_notes || ""
        };

        const { error } = await customClient.from("members").upsert(payload);
        if (error) {
          failedCount++;
          lastError = error.message;
          console.warn(`Bulk sync item failed: ${error.message}`);
        } else {
          syncedCount++;
        }
      } catch (err: any) {
        failedCount++;
        lastError = err.message;
      }
    }

    if (failedCount > 0) {
      res.json({
        success: false,
        syncedCount,
        failedCount,
        message: `Synced ${syncedCount} members. ${failedCount} failed. Please ensure the 'members' table is provisioned in Supabase. Error: ${lastError} (Target URL: ${activeUrl})`
      });
    } else {
      res.json({
        success: true,
        syncedCount,
        message: `Successfully synced ${syncedCount} members to your Supabase project!`
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// PAYMENTS API
app.get("/api/payments", (req, res) => {
  const db = getDB();
  res.json(db.payments);
});

app.post("/api/payments", (req, res) => {
  const db = getDB();
  const newPayment = {
    id: "pay-" + Date.now(),
    gym_id: req.body.gym_id || "gym-1",
    member_id: req.body.member_id,
    amount: Number(req.body.amount),
    payment_method: req.body.payment_method || "upi",
    date: req.body.date || new Date().toISOString(),
  };

  db.payments.push(newPayment);

  // Automate membership extension upon payment recording
  const memberIndex = db.members.findIndex((m: any) => m.id === newPayment.member_id);
  let detailMsg = `Payment of $${newPayment.amount} received via ${newPayment.payment_method.toUpperCase()}.`;
  
  if (memberIndex !== -1) {
    const member = db.members[memberIndex];
    detailMsg = `Payment of $${newPayment.amount} recorded for ${member.name} via ${newPayment.payment_method.toUpperCase()}.`;
    
    // Automatically renew his plan
    member.membership_price = newPayment.amount;
    
    // Auto calculate extension date
    const currentExpiry = new Date(member.expiry_date);
    const startFrom = currentExpiry > new Date() ? currentExpiry : new Date();
    
    let daysToExtend = 30;
    if (member.membership_plan === 'quarterly') daysToExtend = 90;
    else if (member.membership_plan === 'yearly') daysToExtend = 365;
    
    startFrom.setDate(startFrom.getDate() + daysToExtend);
    member.expiry_date = startFrom.toISOString();
    member.status = 'active'; // automatically active again
    db.members[memberIndex] = member;
    
    detailMsg += ` Membership extended to ${startFrom.toLocaleDateString()}.`;
  }

  saveDB(db);
  logAction(newPayment.gym_id, "Payment Recorded", detailMsg);
  res.json({ payment: newPayment, member: memberIndex !== -1 ? db.members[memberIndex] : null });
});

app.put("/api/payments/:id", (req, res) => {
  const db = getDB();
  const index = db.payments.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Payment not found" });

  db.payments[index] = {
    ...db.payments[index],
    ...req.body,
    id: db.payments[index].id, // protect ID
  };
  saveDB(db);

  logAction(db.payments[index].gym_id, "Payment Updated", `Payment ID ${req.params.id} updated.`);
  res.json(db.payments[index]);
});

app.delete("/api/payments/:id", (req, res) => {
  const db = getDB();
  const index = db.payments.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Payment not found" });

  const p = db.payments[index];
  db.payments.splice(index, 1);
  saveDB(db);

  logAction(p.gym_id, "Payment Deleted", `Payment record of $${p.amount} deleted.`);
  res.json({ success: true });
});


// SETTINGS / MESSAGE TEMPLATES API
app.get("/api/settings", (req, res) => {
  const db = getDB();
  res.json(db.settings);
});

app.put("/api/settings", (req, res) => {
  const db = getDB();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  saveDB(db);
  logAction("gym-1", "Settings Updated", "Custom WhatsApp notification templates updated.");
  res.json(db.settings);
});


// REMINDERS API
app.get("/api/reminders/queue", (req, res) => {
  const db = getDB();
  res.json(db.reminders || []);
});

// Trigger bulk reminder simulation
app.post("/api/reminders/send-bulk", (req, res) => {
  const db = getDB();
  const { memberIds } = req.body;
  if (!memberIds || !Array.isArray(memberIds)) {
    return res.status(400).json({ error: "Invalid array of memberIds" });
  }

  const results: any[] = [];
  const today = new Date();

  memberIds.forEach((id: string) => {
    const rawMember = db.members.find((m: any) => m.id === id);
    if (!rawMember) return;

    const member = computeMemberState(rawMember);
    let template = db.settings.whatsapp_template_expired;
    let days = -1;

    if (member.expiry_group === 'expiring_30') {
      template = db.settings.whatsapp_template_30;
      days = 30;
    } else if (member.expiry_group === 'expiring_7') {
      template = db.settings.whatsapp_template_7;
      days = 7;
    } else if (member.expiry_group === 'expiring_3') {
      template = db.settings.whatsapp_template_3;
      days = 3;
    } else if (member.expiry_group === 'active' && member.diffDays === 0) {
      template = db.settings.whatsapp_template_0;
      days = 0;
    }

    // Parse template
    let messageBody = template || "";
    messageBody = messageBody.replace(/{name}/g, member.name);
    messageBody = messageBody.replace(/{expiry_date}/g, new Date(member.expiry_date).toLocaleDateString());

    // Generate simulated outcome
    const statuses = ["delivered", "delivered", "delivered", "failed"]; // 75% success rate
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

    if (!db.reminders) db.reminders = [];
    db.reminders.unshift(reminderNode);
    results.push(reminderNode);

    logAction(member.gym_id, "WhatsApp Sent", `WhatsApp notification sent to ${member.name}. Delivery status: ${status.toUpperCase()}.`);
  });

  saveDB(db);
  res.json({ success: true, sent: results.length, logs: results });
});


// SYSTEM NOTIFICATIONS & INTEGRATIONS
app.get("/api/notifications", (req, res) => {
  const db = getDB();
  const members = db.members.map(computeMemberState);
  
  // Create static system alerts + dynamic warnings
  const alerts: any[] = [];
  
  // 1. Expiring Warnings
  members.forEach((m: any) => {
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

  // 2. High Churn Alert
  const expiredAndUnpaid = members.filter((m: any) => m.expiry_group === 'expired').length;
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

  // 3. System Announcement
  alerts.push({
    id: "alert-saas-ann",
    type: "announcement",
    title: "GymOS Pro Update",
    description: "Multi-tenant cloud renewal scheduling successfully synced. All systems operational.",
    severity: "info",
    timestamp: new Date().toISOString()
  });

  res.json(alerts);
});


// PLATFORM ADMIN ONLY API (GYM REGISTRATIONS)
app.get("/api/admin/gyms", (req, res) => {
  const db = getDB();
  const gyms = db.gyms || [];
  const user_profiles = db.user_profiles || [];
  
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
});

app.post("/api/admin/gyms/:id/approve", (req, res) => {
  const db = getDB();
  const index = db.gyms.findIndex((g: any) => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Gym not found" });

  db.gyms[index].status = "approved";
  db.gyms[index].subscription_status = "active";
  db.gyms[index].subscription_end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // also update user profiles
  db.user_profiles = db.user_profiles || [];
  db.user_profiles.forEach((u: any) => {
    if (u.gym_id === req.params.id) {
      u.status = "approved";
    }
  });

  saveDB(db);

  logAction("gym-1", "Gym Registered & Approved", `Ecosystem approved new partner gym: ${db.gyms[index].name}.`);
  res.json(db.gyms[index]);
});

app.post("/api/admin/gyms/:id/reject", (req, res) => {
  const db = getDB();
  const index = db.gyms.findIndex((g: any) => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Gym not found" });

  db.gyms[index].status = "rejected";
  
  // also update user profiles
  db.user_profiles = db.user_profiles || [];
  db.user_profiles.forEach((u: any) => {
    if (u.gym_id === req.params.id) {
      u.status = "rejected";
    }
  });

  saveDB(db);

  logAction("gym-1", "Gym Rejected", `Ecosystem rejected partner gym: ${db.gyms[index].name}.`);
  res.json(db.gyms[index]);
});

app.post("/api/admin/gyms/:id/suspend", (req, res) => {
  const db = getDB();
  const index = db.gyms.findIndex((g: any) => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Gym not found" });

  db.gyms[index].status = "suspended";
  
  // also update user profiles
  db.user_profiles = db.user_profiles || [];
  db.user_profiles.forEach((u: any) => {
    if (u.gym_id === req.params.id) {
      u.status = "suspended";
    }
  });

  saveDB(db);

  logAction("gym-1", "Gym Suspended", `Ecosystem suspended partner gym: ${db.gyms[index].name}.`);
  res.json(db.gyms[index]);
});

app.post("/api/admin/gyms/:id/reactivate", (req, res) => {
  const db = getDB();
  const index = db.gyms.findIndex((g: any) => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Gym not found" });

  db.gyms[index].status = "approved";
  
  // also update user profiles
  db.user_profiles = db.user_profiles || [];
  db.user_profiles.forEach((u: any) => {
    if (u.gym_id === req.params.id) {
      u.status = "approved";
    }
  });

  saveDB(db);

  logAction("gym-1", "Gym Reactivated", `Ecosystem reactivated partner gym: ${db.gyms[index].name}.`);
  res.json(db.gyms[index]);
});

app.post("/api/admin/gyms/:id/renew", (req, res) => {
  const db = getDB();
  const index = db.gyms.findIndex((g: any) => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Gym not found" });

  db.gyms[index].status = "approved";
  db.gyms[index].subscription_status = "active";
  db.gyms[index].subscription_end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // also update user profiles
  db.user_profiles = db.user_profiles || [];
  db.user_profiles.forEach((u: any) => {
    if (u.gym_id === req.params.id) {
      u.status = "approved";
    }
  });

  saveDB(db);

  logAction("gym-1", "Gym Membership Renewed", `Ecosystem renewed partner gym: ${db.gyms[index].name} for 30 more days.`);
  res.json(db.gyms[index]);
});


// ACTIVITY LOGS API
app.get("/api/activities", (req, res) => {
  const db = getDB();
  res.json(db.activities);
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

        // If it's a transient 503 (UNAVAILABLE), 429 (RATE_LIMIT), server overload, or resource exhaust
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
          // If not transient, or out of attempts, stop retrying this model and proceed to fallback
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

    // LOW LATENCY MODE - SUB-100MS GREETINGS & SIMPLE REPLIES (Zero DB query, zero API delay)
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

    // Substring matchers for extremely fast greetings
    const greetingsWords = ["hi", "hey", "hello", "good morning", "good evening", "good afternoon"];
    if (greetingsWords.some(w => rawNormalized === w || rawNormalized.startsWith(w + " "))) {
      return res.json({ response: "Hello! What would you like to check today?" });
    }

    const db = getDB();
    const membersWithStatus = db.members.map(computeMemberState);

    // Dynamic Live Revenue Engine calculation for AI assistant Grounding
    const calculateLiveRevenueMetrics = (payments: any[], membersList: any[]) => {
      // Exclude cancelled/refunded/failed/suspended payments
      const validPayments = payments.filter((p: any) => {
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

      // Active members only - exclude expired, suspended, archived, cancelled
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

      // Sub plans matching the frontend MRR calculation
      const mrr = activeMembers.reduce((sum: number, m: any) => {
        const price = m.membership_price || 0;
        const plan = (m.membership_plan || "").toLowerCase();
        if (plan.includes("monthly") || plan === "monthly") {
          return sum + price;
        } else if (plan.includes("quarter") || plan === "quarterly") {
          return sum + (price / 3);
        } else if (plan.includes("year") || plan.includes("annual") || plan === "yearly") {
          return sum + (price / 12);
        } else if (
          plan.includes("trial") || 
          plan.includes("day") || 
          plan.includes("week") || 
          plan.includes("one-time") || 
          plan.includes("pass")
        ) {
          return sum; // non-recurring
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

    const metricsLive = calculateLiveRevenueMetrics(db.payments, membersWithStatus);
    
    // Safe structure serialize to give Gemini 100% full contextual intelligence
    const contextData = {
      currentTime: new Date().toISOString(),
      activeGym: db.gyms[0],
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
      recentPayments: db.payments,
      recentReminders: db.reminders || [],
      messageTemplates: db.settings
    };

    const ai = getGeminiClient();

    // Setup capabilities and function call tools to write updates back
    let systemPrompt = `You are GymOS AI, the elite SaaS context-grounded intelligence expert built for gym owners.
You should behave like a modern smart assistant (such as ChatGPT or Gemini) — natural, conversational, professional, and fast.

CRITICAL PERSONALITY AND LENGTH RULES:
1. DO NOT AUTO-GENERATE REPORTS OR DUMP DATA: Never automatically dump entire dashboard reports, tables, lists, or metrics unless the user explicitly requests them (e.g., "show a table of expiring members", "run a revenue report", "analyze this excel file").
2. SMART RESPONSE LENGTH SYSTEM:
   - For simple greetings (such as "Hey", "Hello", "Hi"): Keep responses under 10 words (e.g., "Hey! How can I help today?").
   - For simple conversation: Keep responses under 15 words and highly conversational.
   - For medium queries (e.g., "Who expires this week?"): Return a brief, highly concise direct answer or action suggestion. Only return relevant rows, not the whole database.
   - For complex, explicit analytical queries (e.g., "Analyze my revenue performance over the last 12 months", "Provide an audit of this Excel file"): Provide a detailed, high-quality, professional report with analytics and structures.
3. TONE: Professional, context-aware, fast, natural, and helpful. Feel like a smart business consultant.`;    if (activeFile) {
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

    // Construct request config
    const response = await generateContentWithFallback(ai, {
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: [addNoteTool, remindTool, navigateToPageTool, triggerUIModalTool] }]
      }
    });

    const functionCalls = response.functionCalls;
    
    // Execute tool mutation on the server if Gemini requested it
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const results: any = { status: "success" };

      if (call.name === "addNoteToMember") {
        const { memberId, noteText } = call.args as any;
        const mIdx = db.members.findIndex((m: any) => m.id === memberId);
        if (mIdx !== -1) {
          const oldNotes = db.members[mIdx].notes || "";
          db.members[mIdx].notes = oldNotes ? (oldNotes + " | " + noteText) : noteText;
          saveDB(db);
          logAction(db.members[mIdx].gym_id, "AI Action Executed", `AI updated ${db.members[mIdx].name}'s notes: "${noteText}"`);
          results.feedback = `Successfully appended note into ${db.members[mIdx].name}'s profile.`;
        } else {
          results.status = "error";
          results.feedback = "Member ID not found.";
        }
      } 
      
      else if (call.name === "triggerWhatsAppReminder") {
        const { memberId } = call.args as any;
        const mObj = db.members.find((m: any) => m.id === memberId);
        if (mObj) {
          const member = computeMemberState(mObj);
          let template = db.settings.whatsapp_template_expired;
          let days = -1;
          if (member.expiry_group === 'expiring_30') { template = db.settings.whatsapp_template_30; days = 30; }
          else if (member.expiry_group === 'expiring_7') { template = db.settings.whatsapp_template_7; days = 7; }
          else if (member.expiry_group === 'expiring_3') { template = db.settings.whatsapp_template_3; days = 3; }
          
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
          if (!db.reminders) db.reminders = [];
          db.reminders.unshift(LogNode);
          saveDB(db);
          
          logAction(member.gym_id, "AI Action Executed", `AI sent WhatsApp reminder notice to ${member.name}.`);
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

      // Chain back execution results to Gemini for complete answers
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


// Mount Vite Middleware for Development / Server Client-Side Static Bundle for Production
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Bind to port 3000 as explicitly restricted by the container ingress reverse proxy
if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GymOS Server] Active and listening on port ${PORT}`);
  });
}

export default app;
