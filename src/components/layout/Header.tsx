import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, gym, logout } = useAuth();
  const { settings } = useData();

  return (
    <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-4 sm:px-8 z-20">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 lg:hidden text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle Navigation Sidebar Menu"
          >
            <Menu size={20} />
          </button>
        )}
        {gym && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <h1 className="text-base sm:text-xl font-semibold tracking-tight text-white line-clamp-1">{settings.gym_name || gym.name} Dashboard</h1>
            {user?.email === 'demo@gymos.com' ? (
              <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold rounded-[6px] uppercase tracking-wider">
                Demo Sandbox
              </span>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                animate={{ 
                  boxShadow: ["0 0 4px rgba(212,175,55,0.2)", "0 0 10px rgba(212,175,55,0.4)", "0 0 4px rgba(212,175,55,0.2)"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative overflow-hidden cursor-pointer select-none px-2.5 py-1 bg-gradient-to-tr from-[#A67C1E] via-[#FCF6BA] to-[#BF953F] text-zinc-950 font-extrabold text-[10px] rounded-[6px] uppercase tracking-wider hidden sm:inline-flex items-center gap-1 border border-[#F2D06B]/50 shadow-[0_2px_10px_rgba(0,0,0,0.5)] group"
              >
                <span className="relative z-10 text-[#3d2a04] font-black drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.8)]">Elite Pro</span>
                {/* Gold sweeping shine overlay */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full animate-gold-shine pointer-events-none z-20" />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pl-6 border-l border-white/5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none text-white">{user?.email}</p>
            <p className="text-xs text-zinc-500 mt-1 capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center text-white font-medium overflow-hidden">
            {settings?.owner_photo ? (
              <img src={settings.owner_photo} className="w-full h-full object-cover" alt="User Profile" referrerPolicy="no-referrer" />
            ) : (
              (user?.email || "D").charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
