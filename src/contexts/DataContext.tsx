import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Member, Payment, ActivityLog } from "../types";
import { useAuth } from "./AuthContext";

export interface ReminderLog {
  id: string;
  member_id: string;
  member_name: string;
  expiry_days: number;
  status: "sent" | "delivered" | "failed";
  sent_at: string;
  message: string;
}

export interface SystemAlert {
  id: string;
  type: "expired" | "expiring" | "churn" | "announcement";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
}

export interface AdminGym {
  id: string;
  name: string;
  owner_id: string;
  status: "approved" | "pending" | "suspended";
  created_at: string;
  subscription_status: "active" | "expired" | "suspended";
  subscription_end_date: string;
  owner_username?: string;
  owner_password_plain?: string;
  owner_phone?: string;
}

interface DataContextType {
  members: Member[];
  payments: Payment[];
  activities: ActivityLog[];
  settings: Record<string, string>;
  reminders: ReminderLog[];
  alerts: SystemAlert[];
  adminGyms: AdminGym[];
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  
  // Member Operations
  addMember: (memberData: Partial<Member>) => Promise<Member>;
  editMember: (id: string, memberData: Partial<Member>) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;
  suspendMember: (id: string) => Promise<Member>;
  reactivateMember: (id: string) => Promise<Member>;
  archiveMember: (id: string) => Promise<Member>;
  restoreMember: (id: string) => Promise<Member>;

  // Payment Operations
  recordPayment: (paymentData: Partial<Payment>) => Promise<any>;
  editPayment: (id: string, paymentData: Partial<Payment>) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;

  // Settings
  updateSettings: (settingsData: Record<string, string>) => Promise<Record<string, string>>;

  // Bulk Reminders
  sendBulkReminders: (memberIds: string[]) => Promise<any>;

  // Admin Operations
  approveGym: (id: string) => Promise<AdminGym>;
  rejectGym: (id: string) => Promise<AdminGym>;
  suspendGym: (id: string) => Promise<AdminGym>;
  reactivateGym: (id: string) => Promise<AdminGym>;
  renewGym: (id: string) => Promise<AdminGym>;

  // AI Assistant Chat Dialogues
  askAI: (message: string, history?: any[]) => Promise<{ response: string; toolExecuted?: string; args?: any }>;
  
  // Real-time custom toast communication
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  isAdvisoryStreamActive: boolean;
  setIsAdvisoryStreamActive: (active: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [adminGyms, setAdminGyms] = useState<AdminGym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdvisoryStreamActive, setIsAdvisoryStreamActive] = useState(true);
  
  // Custom non-blocking interactive toaster notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const refreshAll = async () => {
    try {
      const [membersRes, paymentsRes, activitiesRes, settingsRes, remindersRes, alertsRes, gymsRes] = await Promise.all([
        fetch("/api/members?includeArchived=true"),
        fetch("/api/payments"),
        fetch("/api/activities"),
        fetch("/api/settings"),
        fetch("/api/reminders/queue"),
        fetch("/api/notifications"),
        fetch("/api/admin/gyms")
      ]);

      if (membersRes.ok) setMembers(await membersRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (remindersRes.ok) setReminders(await remindersRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (gymsRes.ok) setAdminGyms(await gymsRes.json());
    } catch (e) {
      console.warn("Could not refresh SaaS resources (server may be starting or offline):", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();

    // 1. Live Instant SSE subscription
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/realtime");
      eventSource.onmessage = (e) => {
        if (e.data === "update") {
          refreshAll();
        }
      };
      eventSource.onerror = (err) => {
        console.warn("SSE connection error, fallback is active.", err);
      };
    } catch (err) {
      console.error("Failed to construct EventSource:", err);
    }
    
    // 2. Resilient fallback polling
    const interval = setInterval(refreshAll, 12000);
    
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (settings && settings.default_currency) {
      localStorage.setItem("gymos_currency", settings.default_currency);
    }
  }, [settings]);

  // Members Actions
  const addMember = async (memberData: Partial<Member>): Promise<Member> => {
    // Default fully functional path for all dashboards (with no limits)
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData),
    });
    if (!res.ok) throw new Error("Failed to add member");
    const m = await res.json();
    
    setMembers((prev) => [m, ...prev]);
    refreshAll();
    return m;
  };

  const editMember = async (id: string, memberData: Partial<Member>): Promise<Member> => {
    const res = await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData),
    });
    if (!res.ok) throw new Error("Failed to update member");
    const m = await res.json();
    setMembers((prev) => prev.map((item) => (item.id === id ? m : item)));
    refreshAll();
    return m;
  };

  const deleteMember = async (id: string): Promise<void> => {
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete member");
    setMembers((prev) => prev.filter((item) => item.id !== id));
    refreshAll();
  };

  const suspendMember = async (id: string): Promise<Member> => {
    const res = await fetch(`/api/members/${id}/suspend`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to suspend member");
    const m = await res.json();
    refreshAll();
    return m;
  };

  const reactivateMember = async (id: string): Promise<Member> => {
    const res = await fetch(`/api/members/${id}/reactivate`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to lift suspension");
    const m = await res.json();
    refreshAll();
    return m;
  };

  const archiveMember = async (id: string): Promise<Member> => {
    const res = await fetch(`/api/members/${id}/archive`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to archive member");
    const m = await res.json();
    refreshAll();
    return m;
  };

  const restoreMember = async (id: string): Promise<Member> => {
    const res = await fetch(`/api/members/${id}/restore`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to restore member");
    const m = await res.json();
    refreshAll();
    return m;
  };

  // Payments Actions
  const recordPayment = async (paymentData: Partial<Payment>): Promise<any> => {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) throw new Error("Failed to record payment");
    const data = await res.json();
    refreshAll();
    return data;
  };

  const editPayment = async (id: string, paymentData: Partial<Payment>): Promise<Payment> => {
    const res = await fetch(`/api/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) throw new Error("Failed to edit payment");
    const p = await res.json();
    refreshAll();
    return p;
  };

  const deletePayment = async (id: string): Promise<void> => {
    const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete payment");
    refreshAll();
  };

  // Settings Actions
  const updateSettings = async (settingsData: Record<string, string>): Promise<Record<string, string>> => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsData),
    });
    if (!res.ok) throw new Error("Failed to save templates");
    const updated = await res.json();
    setSettings(updated);
    refreshAll();
    return updated;
  };

  // Reminders Actions
  const sendBulkReminders = async (memberIds: string[]): Promise<any> => {
    const res = await fetch("/api/reminders/send-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberIds }),
    });
    if (!res.ok) throw new Error("Failed simulation of messages");
    const data = await res.json();
    refreshAll();
    return data;
  };

  // Admin Gym Management Actions
  const approveGym = async (id: string): Promise<AdminGym> => {
    const res = await fetch(`/api/admin/gyms/${id}/approve`, { method: "POST" });
    if (!res.ok) throw new Error("Failed approval request");
    const g = await res.json();
    refreshAll();
    return g;
  };

  const rejectGym = async (id: string): Promise<AdminGym> => {
    const res = await fetch(`/api/admin/gyms/${id}/reject`, { method: "POST" });
    if (!res.ok) throw new Error("Failed rejection request");
    const g = await res.json();
    refreshAll();
    return g;
  };

  const suspendGym = async (id: string): Promise<AdminGym> => {
    const res = await fetch(`/api/admin/gyms/${id}/suspend`, { method: "POST" });
    if (!res.ok) throw new Error("Failed suspension request");
    const g = await res.json();
    refreshAll();
    return g;
  };

  const reactivateGym = async (id: string): Promise<AdminGym> => {
    const res = await fetch(`/api/admin/gyms/${id}/reactivate`, { method: "POST" });
    if (!res.ok) throw new Error("Failed reactivation request");
    const g = await res.json();
    refreshAll();
    return g;
  };

  const renewGym = async (id: string): Promise<AdminGym> => {
    const res = await fetch(`/api/admin/gyms/${id}/renew`, { method: "POST" });
    if (!res.ok) throw new Error("Failed renewal request");
    const g = await res.json();
    refreshAll();
    return g;
  };

  // Ask AI Assistant Chat Dialogue
  const askAI = async (message: string, history?: any[]): Promise<{ response: string; toolExecuted?: string; args?: any }> => {
    let activeFile = null;
    try {
      const activeFileRaw = localStorage.getItem("gymos_active_uploaded_file");
      if (activeFileRaw) {
        activeFile = JSON.parse(activeFileRaw);
      }
    } catch (e) {
      console.error("Failed to parse active uploaded file for AI payload", e);
    }

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, activeFile }),
    });
    if (!res.ok) throw new Error("Failing to chat with Gemini backend");
    return await res.json();
  };

  return (
    <DataContext.Provider
      value={{
        members,
        payments,
        activities,
        settings,
        reminders,
        alerts,
        adminGyms,
        isLoading,
        refreshAll,
        addMember,
        editMember,
        deleteMember,
        suspendMember,
        reactivateMember,
        archiveMember,
        restoreMember,
        recordPayment,
        editPayment,
        deletePayment,
        updateSettings,
        sendBulkReminders,
        approveGym,
        rejectGym,
        suspendGym,
        reactivateGym,
        renewGym,
        askAI,
        showToast,
        isAdvisoryStreamActive,
        setIsAdvisoryStreamActive
      }}
    >
      {children}
      
      {/* Interactive Non-blocking Toast Alerts Portal Overlay */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center justify-between transition-all duration-300 transform translate-y-0 ${
              t.type === 'success' 
                ? 'bg-emerald-950/95 border-emerald-500/20 text-emerald-300' 
                : t.type === 'error' 
                ? 'bg-red-950/95 border-red-500/20 text-red-300' 
                : 'bg-zinc-900/95 border-white/5 text-zinc-350'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${
                t.type === 'success' ? 'bg-emerald-400 animate-pulse' : t.type === 'error' ? 'bg-red-400 animate-pulse' : 'bg-blue-400 animate-pulse'
              }`} />
              <p className="text-xs font-semibold tracking-wide">{t.message}</p>
            </div>
            <button 
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="text-white/40 hover:text-white/80 p-1 text-[10px] ml-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
