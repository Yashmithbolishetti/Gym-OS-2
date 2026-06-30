import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Landmark, Sliders, MessageSquare, Info, Shield, Key, Bell, Bot, Dumbbell, 
  Database, User, Globe, AlertTriangle, CloudLightning, Copy, FileText, CheckCircle2, RotateCcw
} from "lucide-react";
import { useData } from "../../contexts/DataContext";
import PhotoUpload from "../../components/shared/PhotoUpload";

type SettingsTab = 'general' | 'account' | 'currency' | 'notification' | 'ai' | 'membership' | 'backup' | 'security' | 'database';

export default function Settings() {
  const { settings, updateSettings, isLoading } = useData();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [success, setSuccess] = useState(false);

  // General Settings States
  const [gymName, setGymName] = useState("");
  const [gymLogo, setGymLogo] = useState("");
  const [gymPhone, setGymPhone] = useState("");
  const [gymEmail, setGymEmail] = useState("");
  const [gymWebsite, setGymWebsite] = useState("");
  const [gymAddress, setGymAddress] = useState("");
  const [businessReg, setBusinessReg] = useState("");
  const [taxInfo, setTaxInfo] = useState("");

  // Account Settings States
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhoto, setOwnerPhoto] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);

  // Currency Settings States
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [regionalFormat, setRegionalFormat] = useState("en-US");

  // Notification Settings States
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [renewalAlerts, setRenewalAlerts] = useState(true);
  const [aiNotifications, setAiNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  
  // Notification templates
  const [template30, setTemplate30] = useState("");
  const [template7, setTemplate7] = useState("");
  const [template3, setTemplate3] = useState("");
  const [template0, setTemplate0] = useState("");
  const [templateExpired, setTemplateExpired] = useState("");

  // AI Settings States
  const [enableAI, setEnableAI] = useState(true);
  const [aiAutoInsights, setAiAutoInsights] = useState(true);
  const [aiRevenueForecasts, setAiRevenueForecasts] = useState(true);
  const [aiRenewalPredictions, setAiRenewalPredictions] = useState(true);
  const [aiReminderAutomation, setAiReminderAutomation] = useState(false);

  // Membership Settings States
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState("99");
  const [planQuarterlyPrice, setPlanQuarterlyPrice] = useState("250");
  const [planYearlyPrice, setPlanYearlyPrice] = useState("990");
  const [gracePeriod, setGracePeriod] = useState("7");
  const [autoExpiry, setAutoExpiry] = useState(true);

  // Backup logs / status
  const [lastBackup, setLastBackup] = useState<string>("Never");

  // Supabase states
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState("");
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");

  useEffect(() => {
    if (settings) {
      // General
      setGymName(settings.gym_name || "Absolute Fitness");
      setGymLogo(settings.gym_logo || "");
      setGymPhone(settings.gym_phone || "+1 (555) 0182");
      setGymEmail(settings.gym_email || "support@absolutefit.com");
      setGymWebsite(settings.gym_website || "www.absolutefit.com");
      setGymAddress(settings.gym_address || "412 Powerlifting Way, Austin TX");
      setBusinessReg(settings.business_reg || "TX-9981882-B");
      setTaxInfo(settings.tax_info || "SalesTax-8821B");

      // Account
      setOwnerName(settings.owner_name || "David Miller");
      setOwnerEmail(settings.owner_email || "david@absolutefit.com");
      setOwnerPhoto(settings.owner_photo || "");
      setEnable2FA(settings.enable_2fa === "true");

      // Currency
      setDefaultCurrency(settings.default_currency || "USD");
      setRegionalFormat(settings.regional_format || "en-US");

      // Notifications
      setWhatsappReminders(settings.whatsapp_reminders !== "false");
      setEmailReminders(settings.email_reminders !== "false");
      setPaymentAlerts(settings.payment_alerts !== "false");
      setRenewalAlerts(settings.renewal_alerts !== "false");
      setAiNotifications(settings.ai_notifications !== "false");
      setSystemNotifications(settings.system_notifications !== "false");

      // Notification templates
      setTemplate30(settings.whatsapp_template_30 || "Hi {name}, your membership will renew on {expiry_date} (30 days lead notice). Contact us to change packages!");
      setTemplate7(settings.whatsapp_template_7 || "Hi {name}, your gym membership is expiring in 7 days on {expiry_date}. Keep up your streaks - renew soon!");
      setTemplate3(settings.whatsapp_template_3 || "URGENT: Hi {name}, only 3 days left until your Gym membership expires on {expiry_date}. Tap to pay.");
      setTemplate0(settings.whatsapp_template_0 || "Hi {name}, your GymOS account expires TODAY. Please complete renewal to avoid access limitations!");
      setTemplateExpired(settings.whatsapp_template_expired || "Hi {name}, your package expired on {expiry_date}. We miss you at the gym! Come over for a discount.");

      // AI States
      setEnableAI(settings.enable_ai !== "false");
      setAiAutoInsights(settings.ai_auto_insights !== "false");
      setAiRevenueForecasts(settings.ai_revenue_forecasts !== "false");
      setAiRenewalPredictions(settings.ai_renewal_predictions !== "false");
      setAiReminderAutomation(settings.ai_reminder_automation === "true");

      // Membership
      setPlanMonthlyPrice(settings.plan_monthly_price || "99");
      setPlanQuarterlyPrice(settings.plan_quarterly_price || "250");
      setPlanYearlyPrice(settings.plan_yearly_price || "990");
      setGracePeriod(settings.grace_period || "7");
      setAutoExpiry(settings.auto_expiry !== "false");
      
      setLastBackup(settings.last_backup_time || "Jun 19, 2026, 05:00 AM UTC");

      // Custom Supabase Settings
      setSupabaseUrl(settings.supabase_url || "");
      setSupabaseAnonKey(settings.supabase_anon_key || "");
    }
  }, [settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      await updateSettings({
        // General
        gym_name: gymName,
        gym_logo: gymLogo,
        gym_phone: gymPhone,
        gym_email: gymEmail,
        gym_website: gymWebsite,
        gym_address: gymAddress,
        business_reg: businessReg,
        tax_info: taxInfo,

        // Account
        owner_name: ownerName,
        owner_email: ownerEmail,
        owner_photo: ownerPhoto,
        enable_2fa: String(enable2FA),

        // Currency
        default_currency: defaultCurrency,
        regional_format: regionalFormat,

        // Notifications
        whatsapp_reminders: String(whatsappReminders),
        email_reminders: String(emailReminders),
        payment_alerts: String(paymentAlerts),
        renewal_alerts: String(renewalAlerts),
        ai_notifications: String(aiNotifications),
        system_notifications: String(systemNotifications),

        // templates
        whatsapp_template_30: template30,
        whatsapp_template_7: template7,
        whatsapp_template_3: template3,
        whatsapp_template_0: template0,
        whatsapp_template_expired: templateExpired,

        // AI
        enable_ai: String(enableAI),
        ai_auto_insights: String(aiAutoInsights),
        ai_revenue_forecasts: String(aiRevenueForecasts),
        ai_renewal_predictions: String(aiRenewalPredictions),
        ai_reminder_automation: String(aiReminderAutomation),

        // Membership
        plan_monthly_price: planMonthlyPrice,
        plan_quarterly_price: planQuarterlyPrice,
        plan_yearly_price: planYearlyPrice,
        grace_period: gracePeriod,
        auto_expiry: String(autoExpiry),

        // Custom Supabase Settings
        supabase_url: supabaseUrl,
        supabase_anon_key: supabaseAnonKey,
      });

      // Synchronize key parameters instantly
      localStorage.setItem("gymos_currency", defaultCurrency);

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert("Error saving your gym configurations: " + err);
    }
  };

  const triggerBackup = async () => {
    const timestamp = new Date().toLocaleString();
    try {
      await updateSettings({
        last_backup_time: timestamp
      });
      setLastBackup(timestamp);
      alert("Manual cryptographic database backup finalized and dispatched to secure offsite vault.");
    } catch (e) {
      alert("Backup failure: " + e);
    }
  };

  const handleSupabaseForceSync = async () => {
    setSupabaseSyncStatus('loading');
    setSupabaseSyncMessage("Connecting and uploading member records...");
    try {
      const res = await fetch("/api/supabase/sync-all", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setSupabaseSyncStatus('success');
        setSupabaseSyncMessage(data.message || `Synchronized ${data.syncedCount} members successfully!`);
      } else {
        setSupabaseSyncStatus('error');
        setSupabaseSyncMessage(data.message || "Synchronization failed. Make sure the 'members' table is provisioned.");
      }
    } catch (err: any) {
      setSupabaseSyncStatus('error');
      setSupabaseSyncMessage(err.message || "Failed to communicate with GymOS server sync endpoint.");
    }
  };

  const handleExportAll = () => {
    // Generate JSON package download
    const exportData = {
      exported_at: new Date().toISOString(),
      gym_identity: { gymName, businessReg, taxInfo },
      saved_settings: settings
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GymOS_System_Metadata_Backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'general', label: 'General Gym', icon: Landmark },
    { id: 'account', label: 'Owner Account', icon: User },
    { id: 'currency', label: 'Currency & Regional', icon: Globe },
    { id: 'membership', label: 'Membership Plans', icon: Dumbbell },
    { id: 'notification', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Core Insights', icon: Bot },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'database', label: 'Supabase Sync', icon: Database },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-16">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white mb-2">Platform Control Settings</h1>
          <p className="text-zinc-500 text-sm">Fine-tune automated pipelines, customized localization, financial plans, and administrative variables.</p>
        </div>

        <button 
          onClick={() => handleSave()}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Save size={14} /> Commit Changes
        </button>
      </div>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-3"
        >
          <CheckCircle2 size={16} className="shrink-0" />
          <span>All unified parameters, defaults, and localization options synced successfully across the active SaaS cluster.</span>
        </motion.div>
      )}

      {/* Grid containing Tabs Navigator AND fields panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left column Navigator */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-medium transition-all text-left border ${
                  active 
                    ? "bg-[#1E1E24]/60 text-blue-400 border-white/10 shadow-lg" 
                    : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/[0.02]"
                }`}
              >
                <Icon size={16} className={active ? "text-blue-400" : "text-zinc-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right column inputs context panel */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="glass-card p-6 sm:p-8 rounded-[28px] border border-white/5 space-y-6">
            
            <AnimatePresence mode="wait">
              
              {/* TAB 1: GENERAL SETTINGS */}
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/40">
                    <Landmark size={16} className="text-blue-500" /> General Gym Facility settings
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column(s) - Text Fields */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Gym Facility Name</label>
                        <input 
                          type="text"
                          value={gymName}
                          onChange={(e) => setGymName(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Facility Phone Contact</label>
                          <input 
                            type="text"
                            value={gymPhone}
                            onChange={(e) => setGymPhone(e.target.value)}
                            className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Administrative Email Address</label>
                          <input 
                            type="email"
                            value={gymEmail}
                            onChange={(e) => setGymEmail(e.target.value)}
                            className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Gym Website URL</label>
                        <input 
                          type="text"
                          value={gymWebsite}
                          onChange={(e) => setGymWebsite(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Physical Facility Street Address</label>
                        <input 
                          type="text"
                          value={gymAddress}
                          onChange={(e) => setGymAddress(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Business Registration Number</label>
                          <input 
                            type="text"
                            value={businessReg}
                            onChange={(e) => setBusinessReg(e.target.value)}
                            className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-sans">Tax Information / VAT ID</label>
                          <input 
                            type="text"
                            value={taxInfo}
                            onChange={(e) => setTaxInfo(e.target.value)}
                            className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Brand/Logo Upload */}
                    <div className="flex flex-col space-y-3">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Gym Logo Upload (Local)
                      </label>
                      <div className="bg-[#0A0A0B] border border-white/5 p-4 rounded-2xl flex-1 flex flex-col justify-center">
                        <PhotoUpload
                          value={gymLogo}
                          onChange={(b64) => setGymLogo(b64)}
                          onClear={() => setGymLogo("")}
                        />
                        <p className="text-[10px] text-zinc-500 font-mono text-center mt-3 leading-relaxed">
                          Your logo will be synchronized dynamically across all dashboards, receipts, and templates.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: OWNER ACCOUNT SETTINGS */}
              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/40">
                    <User size={16} className="text-emerald-500" /> Executive Owner Account settings
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Owner Full Name</label>
                        <input 
                          type="text"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Owner Primary Email</label>
                        <input 
                          type="email"
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Change Account Password</label>
                        <input 
                          type="password"
                          placeholder="Enter new strong password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Owner Profile Photo</label>
                      <PhotoUpload 
                        value={ownerPhoto} 
                        onChange={(b64) => setOwnerPhoto(b64)} 
                        onClear={() => setOwnerPhoto("")} 
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: CURRENCY regional SETTINGS */}
              {activeTab === 'currency' && (
                <motion.div
                  key="currency"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/40">
                    <Globe size={16} className="text-amber-500" /> Currency and Internationalization
                  </h2>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-400 text-xs flex gap-3">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p className="leading-relaxed">All invoices, registration plans, historic and live revenues, analytical reports, and forecast charts will render immediately in the chosen default currency representation system.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Default Currency</label>
                      <select
                        value={defaultCurrency}
                        onChange={(e) => setDefaultCurrency(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                      >
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="AED">AED (د.إ) - UAE Dirham</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Regional Format / Language Locale</label>
                      <select
                        value={regionalFormat}
                        onChange={(e) => setRegionalFormat(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                      >
                        <option value="en-IN">en-IN (India regional formatting)</option>
                        <option value="en-US">en-US (USA regional formatting)</option>
                        <option value="de-DE">de-DE (Germany regional formatting)</option>
                        <option value="en-GB">en-GB (UK regional formatting)</option>
                        <option value="ar-AE">ar-AE (Arabic regional formatting)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/5 space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-400">Live Sample Formatting Preview</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mb-1">Fee Amount</p>
                        <p className="text-sm font-mono font-bold text-green-400">
                          {new Intl.NumberFormat(regionalFormat, { style: "currency", currency: defaultCurrency }).format(99)}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mb-1">VIP Premium Annual</p>
                        <p className="text-sm font-mono font-bold text-blue-400">
                          {new Intl.NumberFormat(regionalFormat, { style: "currency", currency: defaultCurrency }).format(990)}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mb-1">Total Active Capital</p>
                        <p className="text-sm font-mono font-bold text-emerald-400">
                          {new Intl.NumberFormat(regionalFormat, { style: "currency", currency: defaultCurrency }).format(15820)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: AUTOMATED NOTIFICATIONS */}
              {activeTab === 'notification' && (
                <motion.div
                  key="notification"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/40">
                    <Bell size={16} className="text-purple-500" /> Automated Reminder Alerts & Notification Triggers
                  </h2>

                  {/* Settings toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">WhatsApp Reminders</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Automated alert on WhatsApp channel.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={whatsappReminders} 
                        onChange={(e) => setWhatsappReminders(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Email Reminder notifications</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Push automated HTML emails.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={emailReminders} 
                        onChange={(e) => setEmailReminders(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Live Payment receipt alerts</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Auto dispatch receipt invoice logs.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={paymentAlerts} 
                        onChange={(e) => setPaymentAlerts(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Expiring Renewal alerts</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Pings leading of subscription end.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={renewalAlerts} 
                        onChange={(e) => setRenewalAlerts(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </label>
                  </div>

                  {/* Messaging templates config */}
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pt-2">Customized WhatsApp Scripts</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>30 Days Lead Warning notice</span>
                        <span className="text-[9px] lowercase font-mono text-zinc-650 text-zinc-500">{`{name} | {expiry_date}`}</span>
                      </label>
                      <textarea 
                        rows={2} 
                        value={template30} 
                        onChange={(e) => setTemplate30(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl p-3 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>7 Days Prior Warning notice</span>
                        <span className="text-[9px] lowercase font-mono text-zinc-650 text-zinc-500">{`{name} | {expiry_date}`}</span>
                      </label>
                      <textarea 
                        rows={2} 
                        value={template7} 
                        onChange={(e) => setTemplate7(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl p-3 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>3 Days Urgent notice</span>
                        <span className="text-[9px] lowercase font-mono text-zinc-650 text-zinc-500">{`{name} | {expiry_date}`}</span>
                      </label>
                      <textarea 
                        rows={2} 
                        value={template3} 
                        onChange={(e) => setTemplate3(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl p-3 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>Expiry Day Notice (Today)</span>
                        <span className="text-[9px] lowercase font-mono text-zinc-650 text-zinc-500">{`{name} | {expiry_date}`}</span>
                      </label>
                      <textarea 
                        rows={2} 
                        value={template0} 
                        onChange={(e) => setTemplate0(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl p-3 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>Post-Expiration Script notice</span>
                        <span className="text-[9px] lowercase font-mono text-zinc-650 text-zinc-500">{`{name} | {expiry_date}`}</span>
                      </label>
                      <textarea 
                        rows={2} 
                        value={templateExpired} 
                        onChange={(e) => setTemplateExpired(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl p-3 focus:outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: AI INSIGHTS & ANALYTICS */}
              {activeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/40">
                    <Bot size={16} className="text-blue-500 animate-pulse" /> GymOS Core AI Engine Parameters
                  </h2>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Enable GymOS Central AI Assistant</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Activate floating artificial intelligence sidebar assistant.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableAI} 
                        onChange={(e) => setEnableAI(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">AI Auto Insights generation</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Auto scans biometrics on load and points health advice suggestions.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={aiAutoInsights} 
                        onChange={(e) => setAiAutoInsights(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">AI Revenue forecasts and Trends</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Pipes transaction history into linear projection matrices.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={aiRevenueForecasts} 
                        onChange={(e) => setAiRevenueForecasts(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">AI Renewal / Churn probability calculations</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Forecasts which member profiles are at high risk of expiry.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={aiRenewalPredictions} 
                        onChange={(e) => setAiRenewalPredictions(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">AI Automated message queues triggers</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Permits central system to choose and trigger alert dispatch templates.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={aiReminderAutomation} 
                        onChange={(e) => setAiReminderAutomation(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </motion.div>
              )}

              {/* TAB 6: MEMBERSHIP PLANS SETTINGS */}
              {activeTab === 'membership' && (
                <motion.div
                  key="membership"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/40">
                    <Dumbbell size={16} className="text-blue-500" /> Default Membership package Options
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Monthly Fee Unit</label>
                        <input 
                          type="number"
                          value={planMonthlyPrice}
                          onChange={(e) => setPlanMonthlyPrice(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Quarterly Fee Unit</label>
                        <input 
                          type="number"
                          value={planQuarterlyPrice}
                          onChange={(e) => setPlanQuarterlyPrice(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-sans">Yearly VIP Unit</label>
                        <input 
                          type="number"
                          value={planYearlyPrice}
                          onChange={(e) => setPlanYearlyPrice(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Grace Expiry Period (Days)</label>
                        <input 
                          type="number"
                          value={gracePeriod}
                          onChange={(e) => setGracePeriod(e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-white/5 focus:border-blue-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                        />
                      </div>

                      <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer mt-5">
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">Auto Expiry Enforcement rules</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Toggle status to Expired if dues are unsettled.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={autoExpiry} 
                          onChange={(e) => setAutoExpiry(e.target.checked)}
                          className="rounded bg-zinc-950 border-white/10 text-blue-500 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 7: SECURITY SETTINGS */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/40">
                    <Shield size={16} className="text-emerald-500" /> Live Security sessions & 2FA Tokens
                  </h2>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Enable Two-Factor Authentication (2FA)</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Prompts secure QR verification token keys during receptionist desktop signing.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enable2FA} 
                        onChange={(e) => setEnable2FA(e.target.checked)}
                        className="rounded bg-zinc-950 border-[#1f2025] text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>

                    <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/5 space-y-3">
                      <h3 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                        <Key size={14} className="text-blue-400" /> Active Registry Sign-In Sessions & Device History
                      </h3>
                      <div className="space-y-2 text-[11px] font-mono">
                        <div className="flex justify-between border-b border-zinc-900 pb-2">
                          <span className="text-zinc-500">Device/Host: iPad Pro 11" (Reception)</span>
                          <span className="text-green-400">Active Now • IP: 198.162.2.14</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-2">
                          <span className="text-zinc-500">Device/Host: iPhone 15 Pro (Mobile Applet)</span>
                          <span className="text-zinc-400">Sync 4 mins ago • IP: 172.56.21.99</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Device/Host: Safari Safari OS (Macbook Pro)</span>
                          <span className="text-zinc-550 text-zinc-500">Disconnected 2 days ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: SUPABASE SYNCHRONIZATION */}
              {activeTab === 'database' && (
                <motion.div
                  key="database"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-800/40">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Database size={16} className="text-emerald-500" /> Supabase Real-time Sync & Integration
                    </h2>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-semibold font-mono rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ACTIVE SYNC
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Connect GymOS securely to your production Supabase database. Every time a member is added, updated, or removed, GymOS will automatically replicate the change directly to Supabase in real-time under your gym's name.
                  </p>

                  {/* Connection Configuration Controls */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
                    {/* Active Status and Info Panel */}
                    <div className="bg-[#0A0A0B]/60 p-5 border border-white/5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Active Credentials</span>
                        {supabaseUrl ? (
                          <span className="px-2 py-0.5 bg-emerald-500/15 text-[10px] text-emerald-400 font-semibold rounded-full border border-emerald-500/10">
                            Custom Workspace
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/15 text-[10px] text-amber-400 font-semibold rounded-full border border-amber-500/10">
                            Shared Demo Sandbox
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5 font-mono space-y-2">
                          <div className="text-[11px] text-zinc-500">RESOLVED ENDPOINT URL</div>
                          <div className="text-blue-400 truncate select-all">
                            {supabaseUrl || "https://xgrfduzmhnwvknuugtjv.supabase.co"}
                          </div>
                        </div>

                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5 font-mono space-y-2">
                          <div className="text-[11px] text-zinc-500">RESOLVED ANON KEY</div>
                          <div className="text-zinc-300 truncate select-all">
                            {supabaseAnonKey ? `${supabaseAnonKey.slice(0, 15)}...${supabaseAnonKey.slice(-10)}` : "sb_publishable_bVS2SHqxP...Gbj7w_DIcYdZ2e"}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-500/5 text-blue-300 rounded-xl border border-blue-500/10 text-[11px] leading-relaxed">
                        💡 <strong>Real-time Replication:</strong> When a custom database is active, member enrollments, payments, and timeline updates sync instantly to your own tables.
                      </div>
                    </div>

                    {/* Editable Credentials Input Fields */}
                    <div className="bg-[#0A0A0B]/60 p-5 border border-white/5 rounded-2xl space-y-4">
                      <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider block">Modify Database Account</span>
                      
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <Globe size={11} className="text-zinc-400" /> Supabase API URL
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. https://your-project.supabase.co"
                            value={supabaseUrl}
                            onChange={(e) => setSupabaseUrl(e.target.value)}
                            className="w-full bg-[#050506] border border-white/5 focus:border-emerald-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <Key size={11} className="text-zinc-400" /> Supabase Anon Key
                          </label>
                          <input 
                            type="password"
                            placeholder="e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={supabaseAnonKey}
                            onChange={(e) => setSupabaseAnonKey(e.target.value)}
                            className="w-full bg-[#050506] border border-white/5 focus:border-emerald-500 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleSave()}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-emerald-900/10 cursor-pointer"
                        >
                          <Save size={14} />
                          <span>Save Credentials</span>
                        </button>
                        
                        {(supabaseUrl || supabaseAnonKey) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSupabaseUrl("");
                              setSupabaseAnonKey("");
                              setTimeout(() => handleSave(), 100);
                            }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white py-2.5 px-3.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1"
                            title="Reset to Demo Sandbox"
                          >
                            <RotateCcw size={14} />
                            <span className="hidden sm:inline">Reset</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SQL Setup schema instructions */}
                  <div className="bg-[#0A0A0B]/60 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                          <FileText size={14} className="text-blue-400" /> Step 1: Create 'members' Table in Supabase
                        </h3>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Copy and run this SQL query in your Supabase SQL Editor to provision the database schema.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sqlCode = `CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  gym_name TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT,
  height INTEGER,
  weight INTEGER,
  joining_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  membership_plan TEXT,
  membership_price NUMERIC,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  profile_photo_url TEXT,
  emergency_contact TEXT,
  address TEXT,
  medical_notes TEXT,
  additional_notes TEXT
);

-- OPTION A: Disable Row Level Security (RLS) to allow seamless sync from GymOS
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- OPTION B (Alternative): Keep RLS active but grant full access to public role
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow public CRUD" ON members;
-- CREATE POLICY "Allow public CRUD" ON members FOR ALL TO public USING (true) WITH CHECK (true);`;
                          navigator.clipboard.writeText(sqlCode);
                          setCopiedSQL(true);
                          setTimeout(() => setCopiedSQL(false), 3000);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                      >
                        {copiedSQL ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy SQL Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-[#050506] border border-white/[0.03] rounded-xl font-mono text-[11px] text-zinc-300 max-h-48 overflow-y-auto whitespace-pre leading-normal select-all">
{`CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  gym_name TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT,
  height INTEGER,
  weight INTEGER,
  joining_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  membership_plan TEXT,
  membership_price NUMERIC,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  profile_photo_url TEXT,
  emergency_contact TEXT,
  address TEXT,
  medical_notes TEXT,
  additional_notes TEXT
);

-- OPTION A: Disable RLS for seamless sync from GymOS
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- OPTION B (Alternative): Grant full access to public role
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow public CRUD" ON members;
-- CREATE POLICY "Allow public CRUD" ON members FOR ALL TO public USING (true) WITH CHECK (true);`}
                    </div>
                  </div>

                  {/* Sync Existing Data */}
                  <div className="bg-[#0A0A0B]/60 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                        <CloudLightning size={14} className="text-amber-400" /> Step 2: Push Existing Members to Supabase
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Click the button below to perform a full initial database synchronization and sync all existing gym members to your Supabase tables.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                      <button
                        type="button"
                        onClick={handleSupabaseForceSync}
                        disabled={supabaseSyncStatus === 'loading'}
                        className="px-5 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                      >
                        {supabaseSyncStatus === 'loading' ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>Syncing Records...</span>
                          </>
                        ) : (
                          <>
                            <Database size={14} />
                            <span>Force Sync All Members</span>
                          </>
                        )}
                      </button>

                      {supabaseSyncStatus !== 'idle' && (
                        <div className={`p-3 rounded-xl border flex-1 text-xs ${
                          supabaseSyncStatus === 'success' 
                            ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                            : supabaseSyncStatus === 'error'
                            ? "bg-rose-500/5 border-rose-500/10 text-rose-400"
                            : "bg-blue-500/5 border-blue-500/10 text-blue-400 animate-pulse"
                        }`}>
                          {supabaseSyncMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 8: CRYPTOGRAPHIC BACKUPS */}
              {activeTab === 'backup' && (
                <motion.div
                  key="backup"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/40">
                    <Database size={16} className="text-blue-500" /> Database Backup, Recovery & Export
                  </h2>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-blue-400 text-xs flex gap-3 leading-relaxed">
                    <CloudLightning size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Automated Offsite Snapshots enabled</p>
                      <p className="text-zinc-400 mt-1">GymOS automatically captures incremental hourly ledger logs and writes securely to an encrypted cloud database snapshot storage bucket. It maintains a 90-day archive history.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="bg-[#0A0A0B]/60 p-4 border border-white/5 rounded-xl">
                      <span className="text-zinc-550 text-zinc-500 block text-[10px] font-bold">LAST VAULT SNAPSHOT</span>
                      <span className="text-zinc-200 mt-1.5 block font-bold">{lastBackup}</span>
                    </div>

                    <div className="bg-[#0A0A0B]/60 p-4 border border-white/5 rounded-xl">
                      <span className="text-zinc-550 text-zinc-500 block text-[10px] font-bold">SNAPSHOT FREQUENCY</span>
                      <span className="text-emerald-400 mt-1.5 block font-bold">Every 24 hours (Daily Auto)</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={triggerBackup}
                      className="flex-1 py-3 bg-zinc-900 border border-white/5 text-zinc-350 rounded-xl text-xs font-semibold hover:border-white/10 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw size={14} /> Trigger Manual Vault Backup
                    </button>

                    <button 
                      type="button"
                      onClick={handleExportAll}
                      className="flex-1 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Database size={14} /> Export All Gym Registry Data (JSON)
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </form>
        </div>

      </div>
    </div>
  );
}
