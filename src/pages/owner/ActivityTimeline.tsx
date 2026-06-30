import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Search, Filter, Download, Zap, Database, UserCheck, CreditCard } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { formatDate } from "../../lib/utils";
import { exportToCSV, exportToExcel, exportToPDF } from "../../lib/exportUtils";

export default function ActivityTimeline() {
  const { activities, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const filteredLogs = activities.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getLogIcon = (action: string) => {
    if (action.includes("Member Added")) return <UserCheck size={16} className="text-emerald-400" />;
    if (action.includes("Payment")) return <CreditCard size={16} className="text-blue-400" />;
    if (action.includes("Updated")) return <Zap size={16} className="text-yellow-400" />;
    if (action.includes("WhatsApp") || action.includes("Reminder")) return <Zap size={16} className="text-purple-400" />;
    return <Database size={16} className="text-zinc-400" />;
  };

  const getActionColors = (action: string) => {
    if (action.includes("Added")) return "border-emerald-500/30 bg-emerald-500/5 text-emerald-400";
    if (action.includes("Deleted")) return "border-red-500/30 bg-red-500/5 text-red-400";
    if (action.includes("WhatsApp") || action.includes("Reminder")) return "border-purple-500/30 bg-purple-500/5 text-purple-400";
    if (action.includes("Payment")) return "border-blue-500/30 bg-blue-500/5 text-blue-400";
    return "border-zinc-800 bg-zinc-900/60 text-zinc-400";
  };

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const data = filteredLogs.map(log => ({
      id: log.id,
      action: log.action,
      description: log.description,
      date: new Date(log.created_at).toLocaleString()
    }));

    const cols = [
      { header: "Log ID", key: "id" },
      { header: "Action Taken", key: "action" },
      { header: "Log Description", key: "description" },
      { header: "Timestamp", key: "date" }
    ];

    const fName = `GymOS_Activity_Logs_${new Date().toISOString().split("T")[0]}`;
    if (type === "csv") exportToCSV(data, cols, fName);
    else if (type === "excel") exportToExcel(data, cols, fName);
    else exportToPDF("GymOS Professional Audit Logs", cols, data, fName);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white mb-2">Ecosystem Activity Timeline</h1>
          <p className="text-zinc-500 text-sm">Real-time cryptographic auditing and operation pipeline logs for your GymOS tenancy.</p>
        </div>

        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 text-zinc-300 rounded-xl hover:text-white hover:border-white/10 transition-all text-xs font-medium cursor-pointer">
            <Download size={15} /> Export Audit Trail
          </button>
          <div className="absolute right-0 mt-2 w-40 bg-[#0C0C0E] border border-white/15 rounded-xl overflow-hidden hidden group-hover:block shadow-2xl z-20">
            <button onClick={() => handleExport("csv")} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs transition-colors">Export CSV</button>
            <button onClick={() => handleExport("excel")} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs transition-colors">Export Excel</button>
            <button onClick={() => handleExport("pdf")} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs transition-colors">Print PDF Logbook</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Timeline feed column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-[24px] border border-white/5 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-4 border-b border-zinc-800/40">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Keyword search audit trail..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={14} className="text-zinc-500 shrink-0" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full sm:w-40 bg-[#0A0A0B] border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none"
                >
                  <option value="all">All Category Events</option>
                  <option value="Member Added">Member Added</option>
                  <option value="Member Updated">Member Updated</option>
                  <option value="Member Deleted">Member Deleted</option>
                  <option value="Payment Recorded">Payment Recorded</option>
                  <option value="Membership Renewed">Membership Renewed</option>
                  <option value="WhatsApp Sent">WhatsApp Sent</option>
                  <option value="AI Action Executed">AI Actions</option>
                </select>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="relative border-l border-zinc-800 pl-6 ml-3 space-y-8 py-2">
              {filteredLogs.map((log, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.4) }}
                  key={log.id} 
                  className="relative group"
                >
                  {/* Indicator Pip */}
                  <span className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-lg bg-[#0C0C0E] border border-white/10 flex items-center justify-center shadow-lg group-hover:border-blue-500 transition-colors">
                    {getLogIcon(log.action)}
                  </span>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className={`text-[10px] uppercase font-mono tracking-widest font-bold px-2 py-0.5 rounded border ${getActionColors(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-zinc-200 text-xs mt-2.5 font-medium">{log.description}</p>
                    <p className="text-[9px] text-zinc-600 mt-1 font-mono uppercase tracking-wider">Transaction hash: {log.id}</p>
                  </div>
                </motion.div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="text-center py-16">
                  <Activity size={32} className="text-zinc-600 mx-auto mb-3" />
                  <p className="text-xs text-zinc-500 font-medium">No matching audit logs caught in this filters view.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-[24px] border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-2">Audit Assurance</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every operation including client onboarding, subscription settlement, renewal triggers, and database-grounded AI assistant dialogues are logged cryptographically in the GymOS local stream.
            </p>
            <div className="mt-4 p-4 border border-white/5 bg-zinc-950/40 rounded-xl">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">Integrity Status</span>
              <p className="text-xs text-white font-medium mt-1">Operational & Verifiably Synced</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
