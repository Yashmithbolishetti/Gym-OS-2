import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Activity, 
  Settings, 
  Bell, 
  Dumbbell,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import GymOSLogo from '../shared/GymOSLogo';

export default function Sidebar() {
  const { user, gym } = useAuth();
  
  const ownerLinks = [
    { name: 'Overview', to: '/', icon: LayoutDashboard },
    { name: 'Members', to: '/members', icon: Users },
    { name: 'Payments', to: '/payments', icon: CreditCard },
    { name: 'Activity Timeline', to: '/activity', icon: Activity },
    { name: 'Notifications', to: '/notifications', icon: Bell },
    { name: 'Data Analyzer', to: '/analyzer', icon: FileSpreadsheet },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Renewals', to: '/admin/renewals', icon: ShieldAlert },
    { name: 'Gyms', to: '/admin/gyms', icon: Dumbbell },
    { name: 'Platform Settings', to: '/admin/settings', icon: Settings },
  ];

  const links = user?.role === 'super_admin' ? adminLinks : ownerLinks;

  const getSubscriptionDetails = (createdAtStr: string | undefined) => {
    if (!createdAtStr) return { daysRemaining: 0, percentage: 100, nextRenewalDate: 'N/A' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const regDate = new Date(createdAtStr);
    if (isNaN(regDate.getTime())) {
      return { daysRemaining: 30, percentage: 0, nextRenewalDate: 'N/A' };
    }

    const nextRenewal = new Date(regDate);
    nextRenewal.setHours(0, 0, 0, 0);

    // Keep adding 1 month until nextRenewal is strictly after today
    while (nextRenewal <= today) {
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    }

    // Previous renewal date would be exactly 1 month before nextRenewal
    const prevRenewal = new Date(nextRenewal);
    prevRenewal.setMonth(prevRenewal.getMonth() - 1);

    const totalMs = nextRenewal.getTime() - prevRenewal.getTime();
    const remainingMs = nextRenewal.getTime() - today.getTime();
    
    const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    
    // Calculate percentage of month elapsed
    const elapsedMs = totalMs - remainingMs;
    const rawPercent = (elapsedMs / totalMs) * 100;
    const percentage = Math.max(0, Math.min(100, rawPercent));

    // Format next renewal date as DD.MM.YY
    const day = String(nextRenewal.getDate()).padStart(2, '0');
    const month = String(nextRenewal.getMonth() + 1).padStart(2, '0');
    const year = String(nextRenewal.getFullYear()).slice(-2);
    const nextRenewalDate = `${day}.${month}.${year}`;

    return { daysRemaining, percentage, nextRenewalDate };
  };

  const sub = getSubscriptionDetails(gym?.created_at);

  return (
    <div className="w-[240px] h-screen bg-[#0A0A0B] border-r border-white/5 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b-0">
        <GymOSLogo showText={true} size={38} textClassName="text-lg" />
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive 
                  ? "bg-white/5 text-blue-400 border border-white/5" 
                  : "text-zinc-400 hover:text-white"
              )
            }
          >
            <link.icon size={20} />
            <span className="font-medium text-sm">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {user?.role === 'gym_owner' && (
        <div className="p-4 border-t-0 mt-auto">
          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5">
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-bold">Subscription</div>
            <div className="text-sm font-medium text-white">Pro Plan • <span className="text-emerald-500">Active</span></div>
            <div className="mt-3 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${sub.percentage}%` }} />
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">
              Renewal in {sub.daysRemaining} {sub.daysRemaining === 1 ? 'day' : 'days'} ({sub.nextRenewalDate})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
