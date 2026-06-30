import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, RefreshCw, XCircle, Slash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PendingApproval() {
  const { user, gym, logout, refreshUserStatus } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Auto-foward if already approved or suspended, or redirect to login if signed out
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user && user.role === 'super_admin') {
      navigate('/');
    } else if (user && (user.status === 'approved' || user.status === 'suspended')) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setFeedbackMsg(null);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = await refreshUserStatus();
    setIsRefreshing(false);

    if (result) {
      if (result.status === 'approved') {
        navigate('/');
      } else {
        setFeedbackMsg(`Current status evaluated on cloud core: ${result.status.toUpperCase()}`);
      }
    } else {
      setFeedbackMsg('Unable to retrieve status. Cloud server is syncing.');
    }
  };

  // Decide current header, description, and status based on both user & gym values
  const currentStatus = user?.status || 'pending';

  let title = "Awaiting Verification";
  let description = "Your account has been submitted for review. Please wait for administrator approval before accessing GymOS.";
  let icon = <ShieldAlert size={36} className="text-amber-500" />;
  let headerBg = "bg-amber-950/20 border-amber-500/20 text-amber-200";

  if (currentStatus === 'rejected') {
    title = "Registration Request Denied";
    description = "Your registration request was not approved. Please contact administration for further assistance.";
    icon = <XCircle size={36} className="text-red-500" />;
    headerBg = "bg-red-950/20 border-red-500/20 text-red-200";
  } else if (currentStatus === 'suspended') {
    title = "Workspace Suspended";
    description = "Your GymOS account has been suspended. Please contact administration.";
    icon = <Slash size={36} className="text-zinc-500 rotate-45" />;
    headerBg = "bg-zinc-950 border-zinc-500/20 text-zinc-400";
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 max-w-lg w-full text-center relative z-10 border border-white/5 rounded-[32px] bg-[#0A0A0B]/85 backdrop-blur-xl"
      >
        <div className="w-20 h-20 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center mb-8 border border-white/5 shadow-xl">
          {icon}
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {title}
        </h1>

        <div className={`mx-auto mb-6 px-4 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider inline-block ${headerBg}`}>
          Status: {currentStatus}
        </div>
        
        <p className="text-zinc-400 mb-8 leading-relaxed text-sm">
          {description}
        </p>

        {feedbackMsg && (
          <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-300">
            {feedbackMsg}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-medium transition-colors border border-white/5 flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/15"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span>Check Approval Status</span>
          </button>
          
          <button 
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors py-2 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
