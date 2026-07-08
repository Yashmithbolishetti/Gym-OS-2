import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  AlertCircle,
  CreditCard,
  Plus,
  ArrowRight,
  TrendingDown,
  Dumbbell
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatDate, getCurrencySymbol } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { calculateRevenueEngine, isPaymentValid } from '../../lib/revenueEngine';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0c0c0e]/95 border border-white/10 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono block">
          {data.period || label}
        </span>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between gap-5 font-sans">
            <span className="text-zinc-400 text-xs text-[#9c9ca3]">Revenue Amount:</span>
            <span className="text-white text-xs font-bold font-mono">
              {formatCurrency(data.revenue)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-5 font-sans">
            <span className="text-zinc-400 text-xs text-[#9c9ca3]">Transactions:</span>
            <span className="text-white text-xs font-semibold font-mono">
              {data.transactions ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-5 font-sans">
            <span className="text-zinc-400 text-xs text-[#9c9ca3]">Growth Rate:</span>
            <span className={`text-xs font-bold font-mono ${data.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.growth >= 0 ? '+' : ''}{Number(data.growth).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    className="bg-zinc-900/40 border border-white/5 rounded-[24px] p-6 hover:bg-zinc-900/60 transition-colors"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10`}>
          {trendValue}
        </span>
      )}
    </div>
    <p className="text-3xl font-bold tracking-tight text-white mb-1">{value}</p>
    <h3 className="text-zinc-500 text-sm font-medium">{title}</h3>
  </motion.div>
);

export default function OwnerDashboard() {
  const { members, payments, activities, refreshAll, settings } = useData();
  const { user, gym } = useAuth();
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol(settings?.default_currency);

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

  const engine = calculateRevenueEngine(payments, members);

  // 1. Dynamic KPIs
  const totalMembersCount = members.filter(m => !m.is_archived).length;
  
  const monthlyRevenue = engine.monthlyRevenue;

  // Compute expiring within 7 days
  const expiring7d = members.filter(m => {
    if (m.status === 'suspended') return false;
    const diffTime = new Date(m.expiry_date).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const activeClasses = 14; // Premium fixed metric

  // 2. Dynamic multi-resolution engine for Area Chart (Daily, Weekly, Monthly, Yearly, Historical)
  const [resolution, setResolution] = useState<"daily" | "weekly" | "monthly" | "yearly" | "historical">("monthly");
  
  const validPayments = payments.filter(isPaymentValid);
  const monthsAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();

  let areaChartData: { name: string; period: string; revenue: number; transactions: number; growth: number }[] = [];

  if (resolution === "daily") {
    // Last 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

      const pts = validPayments.filter(p => {
        const time = new Date(p.date).getTime();
        return time >= startOfDay && time <= endOfDay;
      });

      areaChartData.push({
        name: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        period: d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
        revenue: pts.reduce((sum, p) => sum + p.amount, 0),
        transactions: pts.length,
        growth: 0
      });
    }
  } else if (resolution === "weekly") {
    // Last 6 weeks ending today
    for (let i = 5; i >= 0; i--) {
      const end = new Date(today);
      end.setDate(today.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const pts = validPayments.filter(p => {
        const time = new Date(p.date).getTime();
        return time >= start.getTime() && time <= end.getTime();
      });

      areaChartData.push({
        name: `Wk -${i}`,
        period: `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`,
        revenue: pts.reduce((sum, p) => sum + p.amount, 0),
        transactions: pts.length,
        growth: 0
      });
    }
  } else if (resolution === "monthly") {
    // Last 6 calendar months ending this month
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const pts = validPayments.filter(p => {
        const pDate = new Date(p.date);
        return pDate.getFullYear() === d.getFullYear() && pDate.getMonth() === d.getMonth();
      });

      areaChartData.push({
        name: monthsAbbr[d.getMonth()],
        period: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        revenue: pts.reduce((sum, p) => sum + p.amount, 0),
        transactions: pts.length,
        growth: 0
      });
    }
  } else if (resolution === "yearly") {
    // Last 3 calendar years ending this year
    for (let i = 2; i >= 0; i--) {
      const year = today.getFullYear() - i;
      const pts = validPayments.filter(p => {
        const pDate = new Date(p.date);
        return pDate.getFullYear() === year;
      });

      areaChartData.push({
        name: `${year}`,
        period: `Year ${year}`,
        revenue: pts.reduce((sum, p) => sum + p.amount, 0),
        transactions: pts.length,
        growth: 0
      });
    }
  } else if (resolution === "historical") {
    // Oldest payment to today grouped by month
    const oldestTimestamp = validPayments.length > 0 
      ? Math.min(...validPayments.map(p => new Date(p.date).getTime())) 
      : today.getTime();
    
    let cur = new Date(oldestTimestamp);
    cur.setDate(1); // floor to first
    cur.setHours(0,0,0,0);

    const checkLimit = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    while (cur < checkLimit) {
      const runDate = new Date(cur); // capture scope
      const pts = validPayments.filter(p => {
        const pDate = new Date(p.date);
        return pDate.getFullYear() === runDate.getFullYear() && pDate.getMonth() === runDate.getMonth();
      });

      areaChartData.push({
        name: `${monthsAbbr[runDate.getMonth()]} '${String(runDate.getFullYear()).slice(-2)}`,
        period: runDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        revenue: pts.reduce((sum, p) => sum + p.amount, 0),
        transactions: pts.length,
        growth: 0
      });

      cur.setMonth(cur.getMonth() + 1);
    }
  }

  // Calculate Growth MoM or consecutive points
  for (let idx = 0; idx < areaChartData.length; idx++) {
    const prevValue = idx > 0 ? areaChartData[idx - 1].revenue : 0;
    const currValue = areaChartData[idx].revenue;
    areaChartData[idx].growth = prevValue > 0 ? ((currValue - prevValue) / prevValue) * 100 : currValue > 0 ? 100 : 0;
  }

  // Expiring soon/expired list
  const priorityRenewals = members.filter(m => {
    const diffTime = new Date(m.expiry_date).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return m.status === 'suspended' || diffDays <= 15; // Expired, or expiring in 15 days
  }).slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white mb-2">Overview</h1>
          <p className="text-zinc-500 text-sm">Welcome back to GymOS. Dynamic operational metrics are fully synced.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate("/payments")}
            className="px-4 py-2 bg-zinc-90 w-full sm:w-auto bg-zinc-900 border border-white/5 text-xs rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-805 hover:bg-zinc-800 font-medium transition-colors cursor-pointer"
          >
            Record Payment
          </button>
          <button 
            onClick={() => navigate("/members")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-505 bg-blue-500 text-xs rounded-xl text-white font-medium hover:bg-blue-600 transition-colors cursor-pointer w-full sm:w-auto"
          >
            <Plus size={15} /> Add Member
          </button>
        </div>
      </div>

      {/* Subscription Guard Rule Banner */}
      {gym && (
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5 animate-bounce" size={18} />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-bold">Subscription Guard Rule:</span> Every approved gym owner holds a monthly subscription cycle. Once the expiration timestamp is breached, access controls automatically restrict workspace modules and forward the operator to the contact terminal displaying: 
              <span className="block mt-1 font-semibold italic text-white font-mono bg-zinc-950/40 p-2.5 rounded border border-white/5">
                "please contact +918919105441 if you are from not india call us on whats up so that we will renew"
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 self-stretch lg:self-auto">
            {gym.created_at && (
              <div className="flex-1 px-4 py-3 bg-zinc-950/60 border border-white/5 rounded-xl flex flex-col justify-center min-w-[140px]">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Registration Date</span>
                <span className="text-xs text-zinc-300 font-bold font-mono mt-0.5">
                  {formatDateDots(gym.created_at)}
                </span>
              </div>
            )}
            {gym.created_at && (
              <div className="flex-1 px-4 py-3 bg-zinc-950/60 border border-white/5 rounded-xl flex flex-col justify-center min-w-[140px]">
                <span className="text-[10px] text-amber-500 font-mono uppercase tracking-wider block font-semibold">1-Month Expiry</span>
                <span className="text-xs text-amber-400 font-bold font-mono mt-0.5">
                  {formatDateDots(gym.created_at, true)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Members" 
          value={String(totalMembersCount)} 
          icon={Users} 
          trend="up" 
          trendValue="Live Sync"
          colorClass="bg-blue-500/10 text-blue-500 border border-blue-500/20"
          delay={0.1}
        />
        <StatCard 
          title="Monthly Collections" 
          value={formatCurrency(monthlyRevenue)} 
          icon={CreditCard} 
          trend="up" 
          trendValue="Active month"
          colorClass="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
          delay={0.2}
        />
        <StatCard 
          title="Expiring In 7d" 
          value={String(expiring7d)} 
          icon={AlertCircle} 
          trend={expiring7d > 0 ? "down" : ""}
          trendValue="Expiring"
          colorClass="bg-orange-500/10 text-orange-500 border border-orange-500/20"
          delay={0.3}
        />
        <StatCard 
          title="Active Schedules" 
          value={String(activeClasses)} 
          icon={Dumbbell} 
          colorClass="bg-purple-500/10 text-purple-500 border border-purple-500/20"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dynamic Area Analytics Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="glass-card p-6 lg:p-8 rounded-[32px] lg:col-span-2 border border-white/5 flex flex-col"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Revenue Performance Timeline</h2>
              <p className="text-zinc-500 text-xs mt-1">SaaS growth statistics computed from active database records.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-zinc-950 border border-white/5 rounded-xl p-0.5">
                {(["daily", "weekly", "monthly", "yearly", "historical"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`px-2 py-1 text-[9px] uppercase font-mono tracking-wider rounded-lg transition-all cursor-pointer ${
                      resolution === r 
                        ? "bg-blue-500 text-white font-bold" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button onClick={() => navigate("/payments")} className="px-2.5 py-1.5 bg-zinc-900 border border-white/5 text-[9.5px] rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">View Statement</button>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis stroke="#52525b" axisLine={false} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} fontSize={11} />
                <Tooltip 
                  content={<CustomTooltip />}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Dynamic Priority Renewals */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="glass-card p-6 flex flex-col rounded-[24px] border border-white/5 max-h-[410px]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Urgent Renewals</h3>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">MONITOR</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3.5">
            {priorityRenewals.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-800/30 transition-colors text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold border border-white/5">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{member.name}</p>
                    <p className={`text-[10px] uppercase font-mono tracking-wider font-bold mt-0.5 ${
                      member.status === 'expired' ? 'text-red-400 animate-pulse' : 'text-orange-400'
                    }`}>
                      {member.status === 'expired' ? 'Expired' : 'Expures soon'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}

            {priorityRenewals.length === 0 && (
              <div className="text-center py-16 text-zinc-650 flex flex-col items-center justify-center">
                <Users size={22} className="text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">Every member account is fully active and current!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Dynamic Recent Activity stream */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="glass-card p-6 rounded-[24px] border border-white/5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Recent Activity Streams</h3>
          <button onClick={() => navigate("/activity")} className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer">View full timelines</button>
        </div>
        <div className="space-y-5">
          {activities.slice(0, 4).map((activity) => (
            <div key={activity.id} className="relative pl-6 pb-2 last:pb-0 border-l border-zinc-800 last:border-transparent">
              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              <div className="flex justify-between items-start text-xs">
                <div>
                  <p className="text-xs font-semibold text-white">{activity.action}</p>
                  <p className="text-zinc-400 mt-1.5 font-medium">{activity.description}</p>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">{formatDate(activity.created_at)}</span>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-6 text-zinc-650">No operational alerts logged.</div>
          )}
        </div>
      </motion.div>

    </div>
  );
}
