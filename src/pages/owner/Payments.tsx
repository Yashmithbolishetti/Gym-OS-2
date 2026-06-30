import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Plus, Search, Filter, Trash2, Edit2, 
  TrendingUp, Download, Calendar, DollarSign, ArrowUpRight, ShieldCheck,
  Banknote
} from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { formatDate, formatCurrency, getCurrencySymbol } from "../../lib/utils";
import { exportToCSV, exportToExcel, exportToPDF } from "../../lib/exportUtils";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from "recharts";
import { calculateRevenueEngine, isPaymentValid } from "../../lib/revenueEngine";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0c0c0e]/95 border border-white/10 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono block">
          {data.period || label}
        </span>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between gap-5">
            <span className="text-zinc-400 text-xs">Revenue Amount:</span>
            <span className="text-white text-xs font-bold font-mono">
              {formatCurrency(data.revenue)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-5">
            <span className="text-zinc-400 text-xs">Transactions:</span>
            <span className="text-white text-xs font-semibold font-mono">
              {data.transactions}
            </span>
          </div>
          <div className="flex items-center justify-between gap-5">
            <span className="text-zinc-400 text-xs">Growth Rate:</span>
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

export default function Payments() {
  const { 
    payments, members, recordPayment, editPayment, deletePayment, isLoading, settings 
  } = useData();
  const currencySymbol = getCurrencySymbol(settings?.default_currency);

  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  
  // Modals Core State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  // Form Fields
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  // Compute Revenue Analytics via single Revenue Engine
  const engine = calculateRevenueEngine(payments, members);
  const totalReceived = engine.totalRevenue;
  const monthlyRevenue = engine.monthlyRevenue;
  
  const validPayments = payments.filter(isPaymentValid);
  const upiPayments = validPayments.filter(p => p.payment_method === "upi").reduce((sum, p) => sum + p.amount, 0);
  const cashPayments = validPayments.filter(p => p.payment_method === "cash").reduce((sum, p) => sum + p.amount, 0);
  const cardPayments = validPayments.filter(p => p.payment_method === "card").reduce((sum, p) => sum + p.amount, 0);
  const bankPayments = validPayments.filter(p => p.payment_method === "bank_transfer").reduce((sum, p) => sum + p.amount, 0);

  // Recharts Pie Chart Distribution Setup
  const pieData = [
    { name: "UPI", value: upiPayments, color: "#3b82f6" },
    { name: "Cash", value: cashPayments, color: "#10b981" },
    { name: "Card", value: cardPayments, color: "#f59e0b" },
    { name: "Bank Transfer", value: bankPayments, color: "#8b5cf6" }
  ].filter(item => item.value > 0);

  // Recharts Monthly Revenue Breakdown
  const monthsAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Generate last 6 months list cleanly
  const chartMonths: { name: string; year: number; month: number; period: string }[] = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    chartMonths.push({
      name: monthsAbbr[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
      period: d.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    });
  }

  const barChartData = chartMonths.map(cm => {
    const pts = validPayments.filter(p => {
      const pDate = new Date(p.date);
      return pDate.getFullYear() === cm.year && pDate.getMonth() === cm.month;
    });
    const rev = pts.reduce((sum, p) => sum + p.amount, 0);
    return {
      name: cm.name,
      period: cm.period,
      revenue: rev,
      transactions: pts.length,
      growth: 0
    };
  });

  // Calculate Growth MoM for the bar charts
  for (let idx = 0; idx < barChartData.length; idx++) {
    const prevValue = idx > 0 ? barChartData[idx - 1].revenue : 0;
    const currValue = barChartData[idx].revenue;
    barChartData[idx].growth = prevValue > 0 ? ((currValue - prevValue) / prevValue) * 100 : currValue > 0 ? 100 : 0;
  }

  // Filtering Payments Listing
  const filteredPayments = payments.filter(p => {
    const member = members.find(m => m.id === p.member_id);
    const mName = member ? member.name.toLowerCase() : "unknown";
    const mEmail = member ? member.email.toLowerCase() : "";
    const pId = p.id.toLowerCase();

    const matchesSearch = 
      mName.includes(searchTerm.toLowerCase()) || 
      mEmail.includes(searchTerm.toLowerCase()) ||
      pId.includes(searchTerm.toLowerCase());

    const matchesMethod = methodFilter === "all" || p.payment_method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  // Export Core Handlers
  const prepareExportData = () => {
    return filteredPayments.map(p => {
      const m = members.find(item => item.id === p.member_id);
      return {
        id: p.id,
        member: m ? m.name : "Unknown Member",
        email: m ? m.email : "N/A",
        amount: p.amount,
        payment_method: p.payment_method.toUpperCase(),
        date: new Date(p.date).toLocaleDateString()
      };
    });
  };

  const exportColumns = [
    { header: "Transaction ID", key: "id" },
    { header: "Member", key: "member" },
    { header: "Email Address", key: "email" },
    { header: "Amount Paid ($)", key: "amount" },
    { header: "Method", key: "payment_method" },
    { header: "Payment Date", key: "date" }
  ];

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const data = prepareExportData();
    const fName = `GymOS_Payments_Report_${new Date().toISOString().split("T")[0]}`;
    if (type === "csv") exportToCSV(data, exportColumns, fName);
    else if (type === "excel") exportToExcel(data, exportColumns, fName);
    else exportToPDF("GymOS Payments & Revenue Statement", exportColumns, data, fName);
  };

  // Submit recorded transaction handler
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !amount) return;

    try {
      await recordPayment({
        member_id: memberId,
        amount: Number(amount),
        payment_method: paymentMethod as any,
        date: new Date(paymentDate).toISOString()
      });

      // Clear fields and close
      setMemberId("");
      setAmount("");
      setPaymentMethod("upi");
      setIsRecordModalOpen(false);
    } catch (err) {
      alert("Error recording transaction record.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment || !amount) return;

    try {
      await editPayment(editingPayment.id, {
        amount: Number(amount),
        payment_method: paymentMethod as any,
        date: new Date(paymentDate).toISOString()
      });
      setIsEditModalOpen(false);
      setEditingPayment(null);
    } catch (e) {
      alert("Error saving transaction modifications.");
    }
  };

  const openEditModal = (p: any) => {
    setEditingPayment(p);
    setMemberId(p.member_id);
    setAmount(String(p.amount));
    setPaymentMethod(p.payment_method);
    setPaymentDate(p.date.split("T")[0]);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this payment record? If this was a renewal premium, the membership expiry date will not be rolled back automatically.")) {
      await deletePayment(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white mb-2">Payment Management</h1>
          <p className="text-zinc-500 text-sm">Monitor revenue, log member subscription receipts, and print financials.</p>
        </div>
        
        <div className="flex gap-3">
          {/* Quick Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 text-zinc-300 rounded-xl hover:text-white hover:border-white/10 transition-all text-xs font-medium cursor-pointer">
              <Download size={15} /> Export Reports
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-[#0C0C0E] border border-white/15 rounded-xl overflow-hidden hidden group-hover:block shadow-2xl z-20">
              <button onClick={() => handleExport("csv")} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs transition-colors">Export CSV</button>
              <button onClick={() => handleExport("excel")} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs transition-colors">Export Excel</button>
              <button onClick={() => handleExport("pdf")} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs transition-colors">Print PDF Statement</button>
            </div>
          </div>

          <button 
            onClick={() => {
              setMemberId("");
              setAmount("");
              setPaymentMethod("upi");
              setPaymentDate(new Date().toISOString().split("T")[0]);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-505 bg-blue-500 text-xs rounded-xl text-white font-medium hover:bg-blue-600 transition-all cursor-pointer"
          >
            <Plus size={15} /> Record Payment
          </button>
        </div>
      </div>

      {/* Analytics KPI section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-6 rounded-[24px] border border-white/5 flex items-center justify-between relative overflow-hidden"
        >
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Monthly Collections</span>
            <h2 className="text-3xl font-bold text-white mt-1.5">{formatCurrency(monthlyRevenue)}</h2>
            <p className="text-[10px] text-emerald-500 mt-2 font-medium flex items-center gap-1 font-mono">
              <TrendingUp size={12} /> Live subscription updates
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
            <motion.div 
              whileHover={{ scale: 1.12, rotate: 6 }} 
              transition={{ type: "spring", stiffness: 450, damping: 12 }}
            >
              <Banknote size={20} />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-6 rounded-[24px] border border-white/5 flex items-center justify-between relative overflow-hidden"
        >
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Yearly Collections</span>
            <h2 className="text-3xl font-bold text-white mt-1.5">{formatCurrency(totalReceived)}</h2>
            <p className="text-[10px] text-zinc-400 mt-2 font-mono">
              Total historical bookings
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
            <TrendingUp size={20} />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-6 rounded-[24px] border border-white/5 flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Active Receipts</span>
            <h2 className="text-3xl font-bold text-white mt-1.5">{payments.length}</h2>
            <p className="text-[10px] text-blue-400 mt-2 font-mono">
              All transactions synced
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
            <CreditCard size={20} />
          </div>
        </motion.div>
      </div>

      {/* Real-time Dynamic Revenue Engine Hub */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0b0b0d]/90 border border-white/5 rounded-[32px] p-6 lg:p-7 space-y-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4 gap-3">
          <div>
            <h2 className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Unified GymOS Revenue Engine
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1 font-sans">Single-source-of-truth calculations computed dynamically from actual transaction ledgers.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className="text-[9px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> REALTIME SYNC: ACTIVE
            </span>
            <span className="text-[9px] font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-mono">
              MRR METHODOLOGY
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#060608]/90 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Today's Collections</span>
            <span className="text-lg font-bold text-white mt-1.5 block">{formatCurrency(engine.todaysRevenue)}</span>
            <span className="text-[9px] text-zinc-650 text-zinc-600 block mt-1 font-mono">At-the-minute flow</span>
          </div>
          <div className="bg-[#060608]/90 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Weekly Velocity</span>
            <span className="text-lg font-bold text-white mt-1.5 block">{formatCurrency(engine.weeklyRevenue)}</span>
            <span className="text-[9px] text-emerald-500 block mt-1 font-mono">Active 7d volume</span>
          </div>
          <div className="bg-[#060608]/90 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Live Monthly (MRR)</span>
            <span className="text-lg font-bold text-blue-400 mt-1.5 block">{formatCurrency(engine.mrr)}</span>
            <span className="text-[9px] text-zinc-650 text-zinc-600 block mt-1 font-mono">Subscription bases</span>
          </div>
          <div className="bg-[#060608]/90 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Annual Recurrent (ARR)</span>
            <span className="text-lg font-bold text-blue-400 mt-1.5 block">{formatCurrency(engine.arr)}</span>
            <span className="text-[9px] text-zinc-650 text-zinc-600 block mt-1 font-mono">Normalized forward run</span>
          </div>
          <div className="bg-[#060608]/90 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Renewal Premium</span>
            <span className="text-lg font-bold text-emerald-400 mt-1.5 block">{formatCurrency(engine.renewalRevenue)}</span>
            <span className="text-[9px] text-zinc-650 text-zinc-600 block mt-1 font-mono">Re-signed membership</span>
          </div>
          <div className="bg-[#060608]/90 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">SaaS MoM Growth</span>
            <span className={`text-lg font-bold mt-1.5 block ${engine.revenueGrowthPercentage >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {engine.revenueGrowthPercentage >= 0 ? "+" : ""}{engine.revenueGrowthPercentage.toFixed(1)}%
            </span>
            <span className="text-[9px] text-zinc-650 text-zinc-600 block mt-1 font-mono">Dynamic MoM math</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/[0.03]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Avg Revenue / Member:</span>
            <span className="text-xs font-bold text-zinc-200">{formatCurrency(engine.averageRevenuePerMember)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Membership Income:</span>
            <span className="text-xs font-bold text-zinc-200">{formatCurrency(engine.membershipRevenue)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Total Collections:</span>
            <span className="text-xs font-bold text-zinc-200">{formatCurrency(engine.totalRevenue)}</span>
          </div>
        </div>
      </motion.div>

      {/* Recharts Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue over time (Bar chart) */}
        <div className="glass-card p-6 rounded-[24px] lg:col-span-2 border border-white/5 flex flex-col h-[340px]">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> Revenue Timeline Trend
          </h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickFormatter={(v) => `${currencySymbol}${v}`} tickLine={false} />
                <Tooltip 
                  content={<CustomTooltip />}
                />
                <Bar dataKey="revenue" fill="url(#blueGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment splits pie */}
        <div className="glass-card p-6 rounded-[24px] border border-white/5 flex flex-col h-[340px]">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-500" /> Payment Split Channels
          </h2>
          <div className="flex-1 w-full relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0C0C0E", borderColor: "#1f1f2e", borderRadius: 12 }}
                    itemStyle={{ fontSize: 12 }}
                    formatter={(v: any) => [`$${v}`, "Amount"]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={10} 
                    iconType="circle"
                    formatter={(value) => <span className="text-zinc-400 text-[11px] font-mono capitalize">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-600 text-xs text-center">No payment data recorded. Register your first transaction!</div>
            )}
          </div>
        </div>

      </div>

      {/* Transaction Records Area */}
      <div className="glass-card rounded-[24px] border border-white/5 overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0A0A0B]/30">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
            <input 
              type="text" 
              placeholder="Query transactions by ID, member name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter size={15} className="text-zinc-500 shrink-0" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full sm:w-40 bg-[#0A0A0B] border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">Every Method</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0A0A0B]/50 sticky top-0 z-10">
              <tr>
                <th className="py-4 px-6 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Transaction ID</th>
                <th className="py-4 px-6 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Member Name</th>
                <th className="py-4 px-6 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Plan Registered</th>
                <th className="py-4 px-6 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Amount Paid</th>
                <th className="py-4 px-6 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Channel</th>
                <th className="py-4 px-6 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Modifiers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredPayments.map((p, index) => {
                const member = members.find(m => m.id === p.member_id);
                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    key={p.id} 
                    className="hover:bg-zinc-800/10 transition-colors group text-xs border-zinc-800/40"
                  >
                    <td className="py-4 px-6 font-mono text-zinc-500">{p.id}</td>
                    <td className="py-4 px-6 font-medium text-white">{member ? member.name : "Deleted Member"}</td>
                    <td className="py-4 px-6">
                      <span className="capitalize text-zinc-400">{member ? member.membership_plan + " package" : "Expired package"}</span>
                    </td>
                    <td className="py-4 px-6 text-emerald-400 font-semibold font-mono">{formatCurrency(p.amount)}</td>
                    <td className="py-4 px-6 text-zinc-400">{formatDate(p.date)}</td>
                    <td className="py-4 px-6">
                      <span className="uppercase text-[9px] border border-white/5 bg-white/[0.02] p-1 px-2 rounded-md font-mono text-zinc-300">
                        {p.payment_method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CreditCard size={32} className="text-zinc-600 mb-3" />
              <h3 className="text-sm font-medium text-white mb-1">No collections logged</h3>
              <p className="text-xs text-zinc-500">We couldn't locate any transaction records.</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Dialog */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0e] border border-white/10 rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl relative p-8"
            >
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="text-blue-500" size={20} /> Record Receipt
              </h2>
              <p className="text-xs text-zinc-500 mb-6">Filing this log will instantly trigger membership authorization and extend plans based on pricing terms.</p>

              <form onSubmit={handleRecordSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Member Reference</label>
                  <select
                    required
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="">Select an enrolled member...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Amount Received ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 99"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash Direct</option>
                    <option value="card">Credit/Debit Card Terminal</option>
                    <option value="bank_transfer">Direct Bank wire / IMPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Settlement Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl hover:text-white transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
                  >
                    File Record
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Payment Dialog */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0e] border border-white/10 rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl relative p-8"
            >
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Edit2 className="text-blue-500" size={20} /> Modify Transaction
              </h2>
              <p className="text-xs text-zinc-500 mb-6">Modify receipts details. Please note that changing the price here will audit the ledger, but won't alter past auto-expiries.</p>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Selected Owner Member</label>
                  <input 
                    type="text" 
                    disabled 
                    value={members.find(m => m.id === memberId)?.name || "Unknown"}
                    className="w-full bg-[#0A0A0B]/55 border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-500 cursor-not-allowed font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Amount Paid ($)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Payment Channel</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="upi">UPI</option>
                    <option value="cash">Cash Direct</option>
                    <option value="card">Card Terminal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Date Received</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingPayment(null);
                    }}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
                  >
                    Apply Edits
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
