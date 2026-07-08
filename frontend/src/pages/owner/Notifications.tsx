import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, CheckCircle2, AlertTriangle, Info, Send, 
  MessageSquare, Users, ShieldAlert, Sparkles, RefreshCw, Smartphone,
  Copy, X, Check, ExternalLink, Smile, Brain, Zap, Heart
} from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { formatDate } from "../../lib/utils";

export default function Notifications() {
  const { 
    alerts, reminders, members, sendBulkReminders, refreshAll, isLoading,
    isAdvisoryStreamActive, setIsAdvisoryStreamActive
  } = useData();

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showDeliveryHistory, setShowDeliveryHistory] = useState(() => {
    const saved = localStorage.getItem("gymos_show_delivery_history");
    return saved !== "false";
  });

  // Psychological Assistant States
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantActiveIndex, setAssistantActiveIndex] = useState(0);
  const [withEmoji, setWithEmoji] = useState(true);
  const [psychologyAngle, setPsychologyAngle] = useState<'loss' | 'identity' | 'urgency'>('loss');
  const [copiedState, setCopiedState] = useState(false);

  const toggleDeliveryHistory = () => {
    setShowDeliveryHistory(prev => {
      const next = !prev;
      localStorage.setItem("gymos_show_delivery_history", String(next));
      return next;
    });
  };

  // Filter members that are expiring/expired right now to allow direct messaging selection
  const expiringMembers = members.map(m => {
    const expDate = new Date(m.expiry_date);
    const today = new Date();
    expDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ...m, diffDays };
  }).filter(m => m.status === 'suspended' || m.diffDays <= 30); // Show expiring within 30 days or expired

  const handleSelectToggle = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === expiringMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(expiringMembers.map(m => m.id));
    }
  };

  const handleBulkTrigger = async () => {
    if (selectedMembers.length === 0) return;
    setIsSending(true);
    setSuccessMsg("");

    try {
      const payload = await sendBulkReminders(selectedMembers);
      setSelectedMembers([]);
      setSuccessMsg(`Simulated send completed! Successfully dispatched ${payload.sent} WhatsApp notification renewal notices.`);
      refreshAll();
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (e) {
      alert("Error sending bulk WhatsApp notices.");
    } finally {
      setIsSending(false);
    }
  };

  const alertIcon = (severity: string, type: string) => {
    if (severity === "critical" || type === "expired") {
      return <ShieldAlert size={16} className="text-red-400 animate-pulse" />;
    }
    if (severity === "warning" || type === "expiring") {
      return <AlertTriangle size={16} className="text-amber-400" />;
    }
    return <Info size={16} className="text-blue-400" />;
  };

  const alertBg = (severity: string) => {
    if (severity === "critical") return "border-red-500/10 bg-red-500/5 text-red-200";
    if (severity === "warning") return "border-amber-500/10 bg-amber-500/5 text-amber-200";
    return "border-blue-500/10 bg-blue-500/5 text-blue-200";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white mb-2">Notifications & Automation Center</h1>
          <p className="text-zinc-500 text-sm">Disseminate customized WhatsApp notices, draft warning streams, and automate renewals.</p>
        </div>
        
        <button 
          onClick={() => { refreshAll(); }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 rounded-xl hover:text-white transition-all text-xs font-medium cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Sync Alerts
        </button>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-3"
        >
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* Grid Layout splits into Warning List & Whatsapp Bulk Trigger Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Column - Real-time Business Intel Stream */}
        <div className="lg:col-span-7 space-y-6">
          {isAdvisoryStreamActive ? (
            <div className="glass-card p-6 rounded-[24px] border border-white/5 space-y-6 relative">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Bell size={16} className="text-blue-500" /> Active System Advisory Stream
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAdvisoryStreamActive(false)}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer border border-white/5"
                  title="Minimize advisory stream"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {alerts.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 border rounded-xl flex items-start gap-3.5 transition-colors duration-300 ${alertBg(item.severity)}`}
                  >
                    <div className="p-2 bg-black/40 rounded-lg shrink-0">
                      {alertIcon(item.severity, item.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold uppercase tracking-wider">{item.title}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">{formatDate(item.timestamp)}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 font-medium leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-16 text-zinc-600">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500/20 mb-3" />
                    <p className="text-xs">No pending advisories or expired members. All structures functional!</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-4 rounded-[20px] border border-white/5 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-blue-500/60" />
                <span>Advisory stream is minimized</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdvisoryStreamActive(true)}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Restore Stream
              </button>
            </div>
          )}

          {/* Historical Sent Reminders Log */}
          <div id="sent-whatsapp-delivery-history" className="glass-card p-6 rounded-[24px] border border-white/5 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/5 flex-wrap sm:flex-nowrap">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-purple-500" /> Sent WhatsApp Delivery History
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider hidden md:inline">Controls:</span>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-0.5">
                  <button
                    type="button"
                    title="Expand Section & Show Delivery History"
                    onClick={() => {
                      setShowDeliveryHistory(true);
                      localStorage.setItem("gymos_show_delivery_history", "true");
                    }}
                    className={`px-2.5 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                      showDeliveryHistory 
                        ? "bg-purple-600 font-bold text-white shadow-sm" 
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    Show / Expand Section
                  </button>
                  <button
                    type="button"
                    title="Collapse Section & Hide Delivery History"
                    onClick={() => {
                      setShowDeliveryHistory(false);
                      localStorage.setItem("gymos_show_delivery_history", "false");
                    }}
                    className={`px-2.5 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                      !showDeliveryHistory 
                        ? "bg-zinc-850 font-bold text-zinc-300 border border-white/10 shadow-sm" 
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    Hide / Collapse Section
                  </button>
                </div>
              </div>
            </div>
            
            <AnimatePresence initial={false}>
              {showDeliveryHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-zinc-800/40 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                    {reminders.map((log) => (
                      <div key={log.id} className="py-3 flex sm:items-center justify-between gap-4 text-xs flex-col sm:flex-row">
                        <div>
                          <h4 className="font-semibold text-white">{log.member_name}</h4>
                          <p className="text-[11px] text-zinc-500 mt-0.5 font-medium italic">"{log.message}"</p>
                          <span className="text-[10px] text-zinc-600 font-mono mt-1 block">Sent: {new Date(log.sent_at).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block text-[9px] uppercase tracking-wider font-mono font-bold p-1 px-2.5 rounded border ${
                            log.status === 'delivered' 
                              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                              : 'border-red-500/20 bg-red-500/5 text-red-500'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}

                    {reminders.length === 0 && (
                      <div className="text-center py-6 text-zinc-600 text-xs text-mono">
                        No notifications logs filed. Use the bulk sender panel to deliver.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side Column - Interactive Bulk Send Simulation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-[24px] border border-white/5 space-y-6 flex flex-col h-full">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1.5">
                <Smartphone size={16} className="text-emerald-400" /> WhatsApp Renewal Dispatcher
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed">Select expiring or expired members below to simulcast customized message templates instantly.</p>
            </div>

            {expiringMembers.length > 0 && (
              <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/40">
                <button 
                  onClick={handleSelectAll} 
                  className="text-[11px] text-zinc-400 hover:text-white font-medium"
                >
                  {selectedMembers.length === expiringMembers.length ? "Deselect All" : "Select All Expiring"}
                </button>
                <span className="text-[10px] font-mono text-zinc-500">{selectedMembers.length} selected</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-2.5">
              {expiringMembers.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => handleSelectToggle(m.id)}
                  className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 ${
                    selectedMembers.includes(m.id) 
                      ? "border-blue-500 bg-blue-500/5" 
                      : "border-white/5 bg-zinc-950/20 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedMembers.includes(m.id)}
                      onChange={() => {}} // event handled via parent div click
                      className="rounded border-zinc-700 bg-zinc-950 text-blue-500 text-xs shrink-0 cursor-pointer focus:ring-0"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-white">{m.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{m.phone}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold ${
                    m.diffDays < 0 
                      ? "text-red-400" 
                      : m.diffDays <= 3 
                      ? "text-red-400 animate-pulse" 
                      : "text-amber-400"
                  }`}>
                    {m.diffDays < 0 ? "Expired" : `Expires in ${m.diffDays}d`}
                  </span>
                </div>
              ))}

              {expiringMembers.length === 0 && (
                <div className="text-center py-10">
                  <Users size={24} className="text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">No members within 30 days of expiry right now.</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                if (selectedMembers.length > 0) {
                  setAssistantActiveIndex(0);
                  setIsAssistantOpen(true);
                }
              }}
              disabled={selectedMembers.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-95 active:scale-[0.98] disabled:opacity-40 disabled:scale-100 rounded-xl font-semibold text-xs text-white tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 shrink-0"
            >
              <Brain size={14} /> Copy-Paste Psychological Text ({selectedMembers.length})
            </button>
          </div>
        </div>

      </div>

      {/* Psychological Assistant Modal */}
      <AnimatePresence>
        {isAssistantOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[28px] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsAssistantOpen(false)}
                className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/5"
              >
                <X size={16} />
              </button>

              {/* Title & Description */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                  <Brain size={14} /> Neurological Copywriting Assistant
                </div>
                <h3 className="text-lg font-semibold text-white">Generate Persuasive Renewal Notice</h3>
                <p className="text-xs text-zinc-400">
                  Formulated with cognitive psychology principles to trigger immediate commitment and action.
                </p>
              </div>

              {/* Selected Member Details */}
              {(() => {
                const selectedExpiringMembers = expiringMembers.filter(m => selectedMembers.includes(m.id));
                const activeMemberForAssistant = selectedExpiringMembers[assistantActiveIndex] || selectedExpiringMembers[0];
                
                if (!activeMemberForAssistant) {
                  return (
                    <p className="text-xs text-zinc-500 text-center py-4">No selected member available.</p>
                  );
                }

                const generatePsychologicalMessage = (member: any, angle: 'loss' | 'identity' | 'urgency', includeEmoji: boolean) => {
                  if (!member) return "";
                  const name = member.name || "valued member";
                  const plan = member.membership_plan ? `${member.membership_plan.toLowerCase()} package` : "membership";
                  const date = member.expiry_date || "soon";

                  if (angle === 'loss') {
                    if (includeEmoji) {
                      return `Hey ${name}! 🏋️‍♂️ Your current ${plan} is set to expire soon on ${date}, and we really don't want you to lose the amazing momentum you've built up! 📈 Muscle memory is real, but so is losing progress when consistency breaks. Don't let those hard-earned sweat sessions go to waste. Let's keep that streak alive! 🔥 Tap here to secure your spot and renew in 10 seconds: [link] — see you on the gym floor tomorrow! 💪`;
                    } else {
                      return `Hello ${name}, your current ${plan} is scheduled to expire on ${date}. Maintaining consistency is the hardest but most crucial part of any fitness journey; starting back from zero is always much harder than keeping the momentum you have already worked so hard to build. Let's make sure your physical progress remains uninterrupted. You can renew your plan in under a minute here: [link]. We look forward to seeing you at your next session.`;
                    }
                  }

                  if (angle === 'identity') {
                    if (includeEmoji) {
                      return `Hey ${name}! 👊 When you joined us with your ${plan}, you didn't just buy access to gym equipment—you made a commitment to your health and future self. 🌟 Your membership expires on ${date}. Do not break that promise. Discipline is choosing between what you want now and what you want most. Let's renew today and keep showing up for yourself! 👑 Secure your plan here: [link]`;
                    } else {
                      return `Hello ${name}, your current ${plan} expires on ${date}. When you first signed up, you made a clear commitment to your physical health and personal discipline. The strongest individuals are defined by their daily consistency, even when the initial excitement fades. Keep showing up for yourself and honor the promise you made. You can quickly renew your membership here: [link]`;
                    }
                  }

                  // urgency / pricing
                  if (includeEmoji) {
                    return `Hey ${name}! 🚨 Your ${plan} expires on ${date}. As one of our top dedicated members, we've unlocked a priority rate to lock in your current price before the upcoming seasonal adjustments! 🤫 This exclusive rate is only valid for the next 48 hours. Secure your spot now and keep crushing your goals without paying more later! 💎 Click here to renew instantly: [link]`;
                  } else {
                    return `Hello ${name}, your current ${plan} expires on ${date}. To show our appreciation for your dedication to our community, we have temporarily locked in your current price tier, protecting you from upcoming seasonal price adjustments. This exclusive rate will remain open for the next 48 hours only. You can renew and secure your current pricing immediately here: [link]`;
                  }
                };

                const activeMessageText = generatePsychologicalMessage(activeMemberForAssistant, psychologyAngle, withEmoji);

                const handleCopyMessage = () => {
                  navigator.clipboard.writeText(activeMessageText);
                  setCopiedState(true);
                  setTimeout(() => setCopiedState(false), 2000);
                };

                const handleWhatsAppRedirect = () => {
                  const phone = activeMemberForAssistant.phone.replace(/[^0-9+]/g, "");
                  const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(activeMessageText)}`;
                  window.open(url, "_blank");
                };

                return (
                  <>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-widest">Target Gym Member</span>
                        <span className="text-sm font-semibold text-white">{activeMemberForAssistant.name}</span>
                        <span className="text-[10px] text-zinc-400 ml-2 font-mono bg-zinc-800/80 px-1.5 py-0.5 rounded">
                          {activeMemberForAssistant.phone}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-widest">Current Package</span>
                        <span className="text-xs font-semibold text-emerald-400 capitalize">
                          {activeMemberForAssistant.membership_plan || "Active Plan"}
                        </span>
                      </div>
                    </div>

                    {/* Multiple Members Navigation */}
                    {selectedExpiringMembers.length > 1 && (
                      <div className="flex justify-between items-center bg-zinc-950/80 p-2.5 rounded-xl border border-white/5 text-xs">
                        <button
                          type="button"
                          disabled={assistantActiveIndex === 0}
                          onClick={() => {
                            setAssistantActiveIndex(prev => prev - 1);
                            setCopiedState(false);
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 rounded transition-all cursor-pointer text-[11px]"
                        >
                          Previous
                        </button>
                        <span className="text-zinc-400 text-[11px] font-mono">
                          Reviewing {assistantActiveIndex + 1} of {selectedExpiringMembers.length} selected
                        </span>
                        <button
                          type="button"
                          disabled={assistantActiveIndex === selectedExpiringMembers.length - 1}
                          onClick={() => {
                            setAssistantActiveIndex(prev => prev + 1);
                            setCopiedState(false);
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 rounded transition-all cursor-pointer text-[11px]"
                        >
                          Next
                        </button>
                      </div>
                    )}

                    {/* Control Panel: Psychology Angle & Emoji Selector */}
                    <div className="space-y-4">
                      {/* 1. Psychological Angle selection */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                          Choose Psychological Influence Angle
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => { setPsychologyAngle('loss'); setCopiedState(false); }}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                              psychologyAngle === 'loss'
                                ? "border-emerald-500/30 bg-emerald-500/10 text-white"
                                : "border-white/5 bg-white/[0.01] hover:border-white/10 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                              <Zap size={12} className={psychologyAngle === 'loss' ? "text-emerald-400" : "text-zinc-500"} />
                              <span>Loss Aversion</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-snug">Focuses on loss of momentum & progress.</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setPsychologyAngle('identity'); setCopiedState(false); }}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                              psychologyAngle === 'identity'
                                ? "border-emerald-500/30 bg-emerald-500/10 text-white"
                                : "border-white/5 bg-white/[0.01] hover:border-white/10 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                              <Heart size={12} className={psychologyAngle === 'identity' ? "text-rose-400" : "text-zinc-500"} />
                              <span>Identity Align</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-snug">Appeals to self-discipline & promise.</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setPsychologyAngle('urgency'); setCopiedState(false); }}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                              psychologyAngle === 'urgency'
                                ? "border-emerald-500/30 bg-emerald-500/10 text-white"
                                : "border-white/5 bg-white/[0.01] hover:border-white/10 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                              <Sparkles size={12} className={psychologyAngle === 'urgency' ? "text-amber-400" : "text-zinc-500"} />
                              <span>Price Lock</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-snug">VIP pricing protection with urgency.</p>
                          </button>
                        </div>
                      </div>

                      {/* 2. Emoji Option Selector */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                          Emoji Mode Configuration
                        </label>
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
                          <button
                            type="button"
                            onClick={() => { setWithEmoji(true); setCopiedState(false); }}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              withEmoji
                                ? "bg-emerald-600/95 text-white shadow-md"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                            }`}
                          >
                            <Smile size={14} />
                            <span>✨ With Emojis</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setWithEmoji(false); setCopiedState(false); }}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              !withEmoji
                                ? "bg-emerald-600/95 text-white shadow-md"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                            }`}
                          >
                            <span>📝 No Emojis (Plain text)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preview Area */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          Persuasive Message Preview
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wide">
                          Live Draft
                        </span>
                      </div>
                      <div className="relative">
                        <textarea
                          readOnly
                          value={activeMessageText}
                          className="w-full bg-[#050506] border border-white/5 rounded-2xl p-4 text-xs text-zinc-300 font-mono focus:outline-none min-h-[140px] resize-none leading-relaxed select-all"
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2">
                          <button
                            type="button"
                            onClick={handleCopyMessage}
                            className="bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {copiedState ? (
                              <>
                                <Check size={11} className="text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        {copiedState ? (
                          <>
                            <Check size={14} />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy Persuasive Notice</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleWhatsAppRedirect}
                        className="bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] py-3 px-5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Direct Dispatch via WhatsApp Link"
                      >
                        <ExternalLink size={14} />
                        <span>Send via WhatsApp</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
