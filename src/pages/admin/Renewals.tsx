import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Search, 
  PhoneCall, 
  User, 
  Check, 
  Building,
  Hourglass
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export default function Renewals() {
  const { adminGyms, renewGym, showToast } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter gyms by search term and expiration status
  const today = new Date();

  const isGymExpired = (gym: any) => {
    if (gym.subscription_status === 'expired') return true;
    if (gym.subscription_end_date && new Date(gym.subscription_end_date) < today) return true;
    return false;
  };

  const getDaysLeft = (endDateStr: string) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Split gyms into Expired and Active lists
  const expiredAndExpiringGyms = adminGyms.filter(gym => {
    const expired = isGymExpired(gym);
    const daysLeft = gym.subscription_end_date ? getDaysLeft(gym.subscription_end_date) : 999;
    const matchesSearch = gym.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          gym.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (expired || daysLeft <= 10);
  });

  const allActiveGyms = adminGyms.filter(gym => {
    const expired = isGymExpired(gym);
    const daysLeft = gym.subscription_end_date ? getDaysLeft(gym.subscription_end_date) : 999;
    const matchesSearch = gym.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          gym.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && !expired && daysLeft > 10;
  });

  const handleRenew = async (gymId: string, gymName: string) => {
    setProcessingId(gymId);
    try {
      await renewGym(gymId);
      showToast(`${gymName} membership renewed for a month!`, 'success');
    } catch (err: any) {
      showToast(`Renewal failed: ${err.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-zinc-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-red-400 font-mono mb-1 uppercase tracking-wider">
            <ShieldAlert size={14} className="text-red-500 animate-pulse" />
            <span>Core Subscription Ledger</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">membership Management</h1>
          <p className="text-zinc-500 text-sm">
            Monitor operative licenses, extend expiries, and resolve lockouts on decentralized GymOS nodes.
          </p>
        </div>

        {/* Contact info placard on admin dashboard */}
        <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <PhoneCall size={18} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Renewal Hotline</p>
            <p className="text-xs text-zinc-300 font-medium font-mono">+918919105441 (Whats App)</p>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-zinc-500" size={18} />
        <input
          type="text"
          placeholder="Filter gyms by name or terminal ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0A0A0B]/60 border border-white/5 hover:border-white/10 focus:border-blue-500 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
        />
      </div>

      {/* Main Expired/Expiring Queue */}
      <div className="bg-[#0A0A0B]/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6">
          <Hourglass className="text-red-500" size={18} />
          <h2 className="text-base font-semibold text-white">Expired or Expiring Soon</h2>
          <span className="px-2 py-0.5 bg-red-950/30 text-red-400 rounded-full text-[10px] font-mono">
            Requires Attention
          </span>
        </div>

        <div className="space-y-4">
          {expiredAndExpiringGyms.map((gym) => {
            const expired = isGymExpired(gym);
            const daysLeft = gym.subscription_end_date ? getDaysLeft(gym.subscription_end_date) : 0;
            const isProcessing = processingId === gym.id;

            return (
              <div 
                key={gym.id} 
                className={`flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-2xl bg-zinc-950/60 border hover:border-white/10 transition-all gap-4 ${
                  expired ? 'border-red-500/20 bg-red-950/5' : 'border-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg select-none shrink-0 ${
                    expired 
                      ? 'bg-red-500/10 border border-red-500/20 text-red-500' 
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                  }`}>
                    {gym.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="text-sm font-semibold text-white">{gym.name}</p>
                      {expired ? (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-wide border border-red-500/20">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-wide border border-amber-500/20">
                          Expiring in {daysLeft}d
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      ID: {gym.id} | Expires: {gym.subscription_end_date ? new Date(gym.subscription_end_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => handleRenew(gym.id, gym.name)}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-zinc-800 disabled:to-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
                  >
                    <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
                    <span>{isProcessing ? 'Renewing...' : 'Renew Account'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {expiredAndExpiringGyms.length === 0 && (
            <div className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-500/60 mb-2.5" />
              <p className="text-sm font-semibold text-zinc-400">Perfect Status Ledger</p>
              <p className="text-xs text-zinc-600 mt-1">No operative tenant accounts are currently expired or in danger of lockout.</p>
            </div>
          )}
        </div>
      </div>

      {/* Auxiliary All Active Gyms Queue (Advance Renewal Option) */}
      <div className="bg-[#0A0A0B]/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6">
          <Building className="text-blue-500" size={18} />
          <h2 className="text-base font-semibold text-white">Active Operator Ledger</h2>
          <span className="px-2 py-0.5 bg-blue-950/30 text-blue-400 rounded-full text-[10px] font-mono">
            Healthy Standings
          </span>
        </div>

        <div className="space-y-4">
          {allActiveGyms.map((gym) => {
            const daysLeft = gym.subscription_end_date ? getDaysLeft(gym.subscription_end_date) : 0;
            const isProcessing = processingId === gym.id;

            return (
              <div 
                key={gym.id} 
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4.5 rounded-2xl bg-zinc-950/30 border border-white/5 hover:border-white/10 transition-all gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-bold font-sans">
                    {gym.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{gym.name}</p>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[8px] font-mono font-bold uppercase border border-emerald-500/20">
                        {daysLeft} Days Remaining
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      ID: {gym.id} | Ends: {gym.subscription_end_date ? new Date(gym.subscription_end_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => handleRenew(gym.id, gym.name)}
                    disabled={isProcessing}
                    className="px-4 py-2 border border-white/10 hover:border-emerald-500/30 hover:text-emerald-400 bg-zinc-950 text-zinc-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} />
                    <span>Advance Renewal</span>
                  </button>
                </div>
              </div>
            );
          })}

          {allActiveGyms.length === 0 && (
            <div className="text-center py-8 text-zinc-600 text-xs">
              No matching active gym operator accounts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
