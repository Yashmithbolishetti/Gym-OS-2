import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  Users, 
  CreditCard,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Ban,
  RefreshCw,
  LogOut,
  User,
  Mail,
  Key,
  Phone
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ title, value, icon: Icon, colorClass, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    className="bg-[#0A0A0B] border border-white/5 rounded-[24px] p-6 hover:bg-zinc-900/60 transition-colors"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
    <p className="text-3xl font-bold tracking-tight text-white mb-1">{value}</p>
    <h3 className="text-zinc-500 text-sm font-medium">{title}</h3>
  </motion.div>
);

export default function AdminDashboard() {
  const { adminGyms, approveGym, rejectGym, suspendGym, reactivateGym } = useData();
  const { logout } = useAuth();

  const [activeQueueTab, setActiveQueueTab] = useState<'pending' | 'approved' | 'restricted'>('pending');

  const formatDateDots = (dateStr: string, addOneMonth = false) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    if (addOneMonth) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      while (d <= today) {
        d.setMonth(d.getMonth() + 1);
      }
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  const totalGyms = adminGyms.length;
  const pendingGyms = adminGyms.filter(g => g.status === 'pending');
  const approvedGyms = adminGyms.filter(g => g.status === 'approved');
  const restrictedGyms = adminGyms.filter(g => g.status === 'rejected' || g.status === 'suspended');

  const computedMRR = approvedGyms.length * 149; // $149/mo license

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-zinc-100 font-sans">
      {/* Platform Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-mono mb-1 uppercase tracking-wider">
            <ShieldCheck size={14} className="text-blue-500" />
            <span>Root Administrator Space</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Control Console</h1>
          <p className="text-zinc-500 text-sm">Orchestrate tenant permissions, registration dossiers, and operational statuses across GymOS nodes.</p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 border border-white/5 hover:border-red-500/20 hover:text-red-400 bg-zinc-950 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Exit Platform Console</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Registered Studios" 
          value={String(totalGyms)} 
          icon={Building} 
          colorClass="bg-blue-500/10 text-blue-500 border border-blue-500/20"
          delay={0.1}
        />
        <StatCard 
          title="Monthly Recurring Revenue" 
          value={formatCurrency(computedMRR)} 
          icon={CreditCard} 
          colorClass="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
          delay={0.2}
        />
        <StatCard 
          title="Active Tenant Licenses" 
          value={String(approvedGyms.length)} 
          icon={ShieldCheck} 
          colorClass="bg-blue-500/10 text-emerald-500 border border-emerald-500/20"
          delay={0.3}
        />
        <StatCard 
          title="Pending Queue" 
          value={String(pendingGyms.length)} 
          icon={Activity} 
          colorClass="bg-orange-500/10 text-orange-500 border border-orange-500/20"
          delay={0.4}
        />
      </div>

      {/* Primary Lifecycle Manager Workbench */}
      <div className="bg-[#0A0A0B]/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        {/* Tab Headers */}
        <div className="flex border-b border-white/5 pb-4 mb-6 justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveQueueTab('pending')}
              className={`pb-2 text-sm font-semibold relative transition-colors cursor-pointer ${
                activeQueueTab === 'pending' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>Pending Reviews</span>
              {pendingGyms.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-orange-600/30 text-orange-400 rounded-full text-[10px] inline-block font-mono">
                  {pendingGyms.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveQueueTab('approved')}
              className={`pb-2 text-sm font-semibold relative transition-colors cursor-pointer ${
                activeQueueTab === 'approved' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>Active Operators</span>
              <span className="ml-2 px-1.5 py-0.5 bg-emerald-600/15 text-emerald-400 rounded-full text-[10px] inline-block font-mono">
                {approvedGyms.length}
              </span>
            </button>

            <button
              onClick={() => setActiveQueueTab('restricted')}
              className={`pb-2 text-sm font-semibold relative transition-colors cursor-pointer ${
                activeQueueTab === 'restricted' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>Restricted / Denied</span>
              {restrictedGyms.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-650/20 text-red-400 rounded-full text-[10px] inline-block font-mono">
                  {restrictedGyms.length}
                </span>
              )}
            </button>
          </div>
          
          <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">SYSTEM STATE: DECENTRALIZED AUTH NODE SYNCED</span>
        </div>

        {/* Dynamic Queues */}
        <AnimatePresence mode="wait">
          {activeQueueTab === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {pendingGyms.map((gym) => (
                <div key={gym.id} className="flex flex-col p-5 rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-white/10 transition-colors gap-4">
                  {/* Main Header Info Row */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center font-bold text-lg select-none">
                        {gym.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{gym.name}</p>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">ID: {gym.id} | Country: {gym.country || 'USA'} ({gym.currency || 'USD'})</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      <button 
                        onClick={() => approveGym(gym.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Approve registration"
                      >
                        <CheckCircle2 size={16} />
                        <span>Approve</span>
                      </button>
                      <button 
                        onClick={() => rejectGym(gym.id)}
                        className="px-4 py-2 bg-red-950/40 hover:bg-red-950/80 text-red-200 border border-red-500/20 hover:border-red-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Reject registration"
                      >
                        <XCircle size={16} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>

                  {/* Registered Owner Credentials Dossier */}
                  <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Operator Name</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <User size={13} className="text-zinc-500" />
                        <span className="font-medium">{gym.owner_name || 'Gym Owner'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Login Username (Email)</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Mail size={13} className="text-zinc-500" />
                        <span className="font-mono">{gym.owner_username || gym.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Login Password</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Key size={13} className="text-zinc-500" />
                        <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded border border-white/5 font-semibold text-amber-400">
                          {gym.owner_password_plain || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Registration Date</span>
                      <span className="text-zinc-300 font-mono block mt-1 font-semibold">
                        {formatDateDots(gym.created_at)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-500 font-mono uppercase tracking-wider block font-semibold">1-Month Expiry</span>
                      <span className="text-amber-400 font-bold font-mono block mt-1">
                        {formatDateDots(gym.created_at, true)}
                      </span>
                    </div>
                    {gym.owner_phone && gym.owner_phone !== 'N/A' && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-5 pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-zinc-500">
                        <Phone size={11} className="text-zinc-500" />
                        <span>Registered Contact: <span className="text-zinc-400 font-mono">{gym.owner_phone}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {pendingGyms.length === 0 && (
                <div className="text-center py-16 text-zinc-500 flex flex-col items-center justify-center">
                  <ShieldCheck size={32} className="text-zinc-600 mb-3" />
                  <p className="text-sm font-semibold text-zinc-400">All pending registrations have been processed!</p>
                  <p className="text-xs text-zinc-650 mt-1">New studios registering on the launchpad will arrive here in real time.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeQueueTab === 'approved' && (
            <motion.div
              key="approved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {approvedGyms.map((gym) => (
                <div key={gym.id} className="flex flex-col p-5 rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-white/10 transition-colors gap-4">
                  {/* Main Header Info Row */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center font-bold text-lg select-none">
                        {gym.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{gym.name}</p>
                        <div className="flex gap-2 items-center text-xs text-zinc-500 font-mono mt-0.5">
                          <span>ID: {gym.id}</span>
                          <span>•</span>
                          <span className="text-emerald-500">License: Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 items-center w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-zinc-400 font-semibold mb-0.5">{formatCurrency(149)}/mo License</p>
                        <span className="text-[10px] text-zinc-600 font-mono">Cloud Workspace Enabled</span>
                      </div>

                      <button 
                        onClick={() => suspendGym(gym.id)}
                        className="px-4 py-2 border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Suspend operative tenant"
                      >
                        <Ban size={14} />
                        <span>Suspend Tenant</span>
                      </button>
                    </div>
                  </div>

                  {/* Registered Owner Credentials Dossier */}
                  <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Operator Name</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <User size={13} className="text-zinc-500" />
                        <span className="font-medium">{gym.owner_name || 'Gym Owner'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Login Username (Email)</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Mail size={13} className="text-zinc-500" />
                        <span className="font-mono">{gym.owner_username || gym.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Login Password</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Key size={13} className="text-zinc-500" />
                        <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded border border-white/5 font-semibold text-emerald-400">
                          {gym.owner_password_plain || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Registration Date</span>
                      <span className="text-zinc-300 font-mono block mt-1 font-semibold">
                        {formatDateDots(gym.created_at)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-500 font-mono uppercase tracking-wider block font-semibold">1-Month Expiry</span>
                      <span className="text-amber-400 font-bold font-mono block mt-1">
                        {formatDateDots(gym.created_at, true)}
                      </span>
                    </div>
                    {gym.owner_phone && gym.owner_phone !== 'N/A' && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-5 pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-zinc-500">
                        <Phone size={11} className="text-zinc-500" />
                        <span>Registered Contact: <span className="text-zinc-400 font-mono">{gym.owner_phone}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {approvedGyms.length === 0 && (
                <div className="text-center py-16 text-zinc-500 flex flex-col items-center justify-center">
                  <AlertCircle size={32} className="text-zinc-600 mb-3" />
                  <p className="text-sm font-semibold text-zinc-400">No active operating studios.</p>
                  <p className="text-xs text-zinc-650 mt-1">Approve pending applications above to launch active client workspaces.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeQueueTab === 'restricted' && (
            <motion.div
              key="restricted"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {restrictedGyms.map((gym) => (
                <div key={gym.id} className="flex flex-col p-5 rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-white/10 transition-colors gap-4">
                  {/* Main Header Info Row */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center font-bold text-lg select-none">
                        {gym.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{gym.name}</p>
                        <div className="flex gap-2 items-center text-xs mt-0.5">
                          <span className="text-zinc-500 font-mono">ID: {gym.id}</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider ${
                            gym.status === 'suspended' ? 'bg-zinc-800 text-zinc-400' : 'bg-red-950/40 text-red-400'
                          }`}>
                            {gym.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => reactivateGym(gym.id)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer w-full md:w-auto justify-center"
                      title="Reactivate license access"
                    >
                      <RefreshCw size={14} />
                      <span>Restore access</span>
                    </button>
                  </div>

                  {/* Registered Owner Credentials Dossier */}
                  <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Operator Name</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <User size={13} className="text-zinc-500" />
                        <span className="font-medium">{gym.owner_name || 'Gym Owner'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Login Username (Email)</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Mail size={13} className="text-zinc-500" />
                        <span className="font-mono">{gym.owner_username || gym.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Login Password</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Key size={13} className="text-zinc-500" />
                        <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded border border-white/5 font-semibold text-red-400">
                          {gym.owner_password_plain || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Registration Date</span>
                      <span className="text-zinc-300 font-mono block mt-1 font-semibold">
                        {formatDateDots(gym.created_at)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-500 font-mono uppercase tracking-wider block font-semibold">1-Month Expiry</span>
                      <span className="text-amber-400 font-bold font-mono block mt-1">
                        {formatDateDots(gym.created_at, true)}
                      </span>
                    </div>
                    {gym.owner_phone && gym.owner_phone !== 'N/A' && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-5 pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-zinc-500">
                        <Phone size={11} className="text-zinc-500" />
                        <span>Registered Contact: <span className="text-zinc-400 font-mono">{gym.owner_phone}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {restrictedGyms.length === 0 && (
                <div className="text-center py-16 text-zinc-500 flex flex-col items-center justify-center">
                  <ShieldCheck size={32} className="text-zinc-600 mb-3" />
                  <p className="text-sm font-semibold text-zinc-400">No restricted or denied tenants.</p>
                  <p className="text-xs text-zinc-650 mt-1">Suspended or rejected workspace dossiers will be logged and controlled here.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
