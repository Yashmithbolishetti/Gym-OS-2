import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import GymOSAI from './GymOSAI';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Calendar, CreditCard, Search, Bot, X, Check, Phone, 
  Users, LayoutDashboard, Activity, Settings as SettingsIcon, Bell, 
  User, ShieldAlert, Sparkles, ChevronRight, MessageSquare, Landmark, Sliders, LogOut
} from 'lucide-react';
import PhotoUpload from '../shared/PhotoUpload';
import { getCurrencySymbol, formatCurrency } from '../../lib/utils';
import GymOSLogo from '../shared/GymOSLogo';

export default function DashboardLayout() {
  const { user, gym, isLoading, logout } = useAuth();
  const { members, addMember, editMember, recordPayment, askAI, settings, isAdvisoryStreamActive } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdvisoryOpenOnNotifications = location.pathname === "/notifications" && isAdvisoryStreamActive;

  // Responsive state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Quick Action Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Add Member Form States
  const [photo, setPhoto] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('70');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [plan, setPlan] = useState('monthly');
  const [duration, setDuration] = useState('1 month');
  const [price, setPrice] = useState('99');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [emergency, setEmergency] = useState('');
  const [address, setAddress] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // States for Custom Plan calculations (Priority Fix #2)
  const [customPlanName, setCustomPlanName] = useState('15-Day Trial');
  const [customStartDate, setCustomStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customExpiryDate, setCustomExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  // Renew Membership Form States
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [renewPlan, setRenewPlan] = useState('monthly');
  const [renewPrice, setRenewPrice] = useState('99');
  const [renewStartDate, setRenewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [renewExpiryDate, setRenewExpiryDate] = useState('');

  // Renewal custom plan states
  const [renewCustomPlanName, setRenewCustomPlanName] = useState('90-Day Challenge');
  const [renewCustomStartDate, setRenewCustomStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [renewCustomExpiryDate, setRenewCustomExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });

  // Record Payment Form States
  const [payMemberId, setPayMemberId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payPurpose, setPayPurpose] = useState('monthly');
  const [payStatus, setPayStatus] = useState('Completed');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // Global Search and AI States
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [aiSearchPrompt, setAiSearchPrompt] = useState('');
  const [aiSearchResult, setAiSearchResult] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);

  // Sync pricing defaults when package changes in Add Form
  useEffect(() => {
    let p = '99';
    let d = '1 month';
    if (plan === 'monthly') {
      p = settings.plan_monthly_price || '99';
      d = '1 month';
    } else if (plan === 'quarterly') {
      p = settings.plan_quarterly_price || '250';
      d = '3 months';
    } else if (plan === 'yearly') {
      p = settings.plan_yearly_price || '990';
      d = '12 months';
    } else if (plan === 'custom') {
      try {
        const start = new Date(customStartDate);
        const end = new Date(customExpiryDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        p = price; // preserves current custom price entered by user
        d = `${diffDays} days`;
      } catch (e) {
        d = "0 days";
      }
    }
    if (plan !== 'custom') {
      setPrice(p);
    }
    setDuration(d);

    // Auto-calculate expiry
    try {
      if (plan === 'custom') {
        setExpiryDate(customExpiryDate);
      } else {
        const sDate = new Date(startDate);
        if (plan === 'monthly') sDate.setMonth(sDate.getMonth() + 1);
        else if (plan === 'quarterly') sDate.setMonth(sDate.getMonth() + 3);
        else if (plan === 'yearly') sDate.setMonth(sDate.getMonth() + 12);
        setExpiryDate(sDate.toISOString().split('T')[0]);
      }
    } catch (e) {}
  }, [plan, startDate, settings, customStartDate, customExpiryDate]);

  // Sync pricing defaults when package changes in Renew Form
  useEffect(() => {
    let p = '99';
    let monthsToAdd = 1;
    if (renewPlan === 'monthly') {
      p = settings.plan_monthly_price || '99';
      monthsToAdd = 1;
    } else if (renewPlan === 'quarterly') {
      p = settings.plan_quarterly_price || '250';
      monthsToAdd = 3;
    } else if (renewPlan === 'yearly') {
      p = settings.plan_yearly_price || '990';
      monthsToAdd = 12;
    }
    if (renewPlan !== 'custom') {
      setRenewPrice(p);
    }

    // Calculate expiry based on member status
    if (renewPlan === 'custom') {
      setRenewExpiryDate(renewCustomExpiryDate);
    } else {
      const memb = members.find(m => m.id === selectedMemberId);
      let baseDate = new Date(renewStartDate);
      if (memb && memb.expiry_date) {
        const currExpiry = new Date(memb.expiry_date);
        // If member is still active, extend of current expiration date
        if (currExpiry > new Date()) {
          baseDate = currExpiry;
        }
      }
      baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
      setRenewExpiryDate(baseDate.toISOString().split('T')[0]);
    }
  }, [renewPlan, renewStartDate, selectedMemberId, members, settings, renewCustomExpiryDate]);

  // Handle automatic modal triggers dispatched by the AI Central Assistant
  useEffect(() => {
    const handleAIModalTrigger = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { modalType } = customEvent.detail || {};
      if (modalType === "add_member") {
        setIsAddModalOpen(true);
      } else if (modalType === "renew_member") {
        setIsRenewModalOpen(true);
      } else if (modalType === "record_payment") {
        setIsPaymentModalOpen(true);
      } else if (modalType === "search") {
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener("gymos_ai_modal", handleAIModalTrigger);
    return () => window.removeEventListener("gymos_ai_modal", handleAIModalTrigger);
  }, []);

  // Clean form sets when opening Add Modal
  const openAddModal = () => {
    setPhoto('');
    setName('');
    setPhone('');
    setEmail('');
    setAge('25');
    setHeight('170');
    setWeight('70');
    setEmergency('');
    setAddress('');
    setMedicalNotes('');
    setAdditionalNotes('');
    setIsAddModalOpen(true);
    setIsSearchModalOpen(false);
  };

  const openRenewModal = (userId = '') => {
    setSelectedMemberId(userId || (members[0]?.id || ''));
    setIsRenewModalOpen(true);
    setIsSearchModalOpen(false);
  };

  const openPaymentModal = (userId = '') => {
    setPayMemberId(userId || (members[0]?.id || ''));
    setPayAmount('');
    setIsPaymentModalOpen(true);
    setIsSearchModalOpen(false);
  };

  const triggerOpenAI = () => {
    window.dispatchEvent(new CustomEvent('open-gymos-ai'));
  };

  // On submit additions
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !emergency || !address) {
      alert("Please ensure all mandatory enrollment fields are completed.");
      return;
    }

    let finalPlanName = plan;
    if (plan === 'custom') {
      finalPlanName = customPlanName.trim() || "Custom Plan";
    }

    try {
      await addMember({
        name,
        email,
        phone,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        joining_date: joiningDate,
        membership_plan: finalPlanName as any,
        membership_duration: duration,
        membership_price: Number(price),
        start_date: startDate,
        expiry_date: expiryDate,
        emergency_contact: emergency,
        address,
        medical_notes: medicalNotes,
        notes: additionalNotes,
        profile_photo_url: photo || undefined,
        status: 'active'
      });

      // record automatic first payment
      await recordPayment({
        member_id: `temp-${Date.now()}`, // will map on backend or auto refresh
        amount: Number(price),
        method: 'Cash',
        status: 'Completed',
        date: startDate,
        purpose: finalPlanName
      });

      setIsAddModalOpen(false);
      alert(`${name} enrolled and certified successfully. Membership is active.`);
    } catch (err) {
      alert("Error saving member details: " + err);
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    let finalPlanName = renewPlan;
    if (renewPlan === 'custom') {
      finalPlanName = renewCustomPlanName.trim() || "Custom Plan";
    }

    try {
      await editMember(selectedMemberId, {
        expiry_date: renewExpiryDate,
        membership_plan: finalPlanName as any,
        membership_price: Number(renewPrice),
        status: 'active'
      });

      await recordPayment({
        member_id: selectedMemberId,
        amount: Number(renewPrice),
        method: 'Cash',
        status: 'Completed',
        date: renewStartDate,
        purpose: finalPlanName
      });

      setIsRenewModalOpen(false);
      const memb = members.find(m => m.id === selectedMemberId);
      alert(`Success! ${memb?.name || "Member"} package extended to ${renewExpiryDate}.`);
    } catch (err) {
      alert("Failed to process subscription extension: " + err);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payMemberId || !payAmount) return;

    try {
      await recordPayment({
        member_id: payMemberId,
        amount: Number(payAmount),
        method: payMethod,
        status: payStatus as any,
        date: payDate,
        purpose: payPurpose
      });

      setIsPaymentModalOpen(false);
      alert("Transaction saved and indexed safely into the general ledger.");
    } catch (err) {
      alert("Failed to log transaction receipts: " + err);
    }
  };

  const handleAISearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchPrompt) return;
    setAiSearchLoading(true);
    setAiSearchResult('');
    try {
      const response = await askAI(aiSearchPrompt);
      setAiSearchResult(response);
    } catch(err) {
      setAiSearchResult("Our biometric processor encountered an analytics interruption. Please try again.");
    } finally {
      setAiSearchLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2, 
            ease: "easeInOut" 
          }}
          className="flex flex-col items-center gap-4"
        >
          <GymOSLogo showText={true} showSubtitle={true} size={64} textClassName="text-3xl" />
        </motion.div>
      </div>
    );
  }

  // 1. Is user authenticated?
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Is role = gym_owner or super_admin?
  if (user.role !== 'gym_owner' && user.role !== 'super_admin') {
    return <Navigate to="/login" replace />;
  }

  // 3. Is gym status = approved or suspended? (suspended owners can log in and see locked dashboard overlay)
  if (user.role === 'gym_owner' && (!user.status || (user.status !== 'approved' && user.status !== 'suspended'))) {
    return <Navigate to="/pending-approval" replace />;
  }

  // 4. Is gym owner subscription expired?
  const isExpired = user.role === 'gym_owner' && gym && (
    gym.subscription_status === 'expired' ||
    (gym.subscription_end_date && new Date(gym.subscription_end_date) < new Date())
  );

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-zinc-100">
        {/* Background Effect */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-amber-500/5 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 max-w-lg w-full text-center relative z-10 border border-white/5 rounded-[32px] bg-[#0A0A0B]/85 backdrop-blur-xl"
        >
          <div className="w-20 h-20 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center mb-8 border border-white/5 shadow-xl text-red-500">
            <ShieldAlert size={36} />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Membership Expired
          </h1>

          <div className="mx-auto mb-6 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-950/20 text-red-300 text-xs font-semibold uppercase tracking-wider inline-block">
            Status: Expired
          </div>
          
          <p className="text-zinc-300 mb-8 leading-relaxed text-sm">
            Please contact <span className="text-yellow-400 font-bold tracking-wider">+918919105441</span> if you are from not india call us on whats up so that we will renew
          </p>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-medium transition-all border border-white/5 flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-600/15 cursor-pointer"
            >
              <span>Sign out</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Prevent gym_owner from visiting admin routes
  if (user.role === 'gym_owner' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  // Local filtered search results for Global Search Modal
  const matchedMembers = globalSearchTerm 
    ? members.filter(m => 
        m.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        m.phone.includes(globalSearchTerm) ||
        m.status.toLowerCase().includes(globalSearchTerm.toLowerCase())
      )
    : [];

  // Bottom Navigation helper bar mapping for mobile
  const bottomNavLinks = [
    { name: 'Home', to: '/', icon: LayoutDashboard },
    { name: 'Members', to: '/members', icon: Users },
    { name: 'Payments', to: '/payments', icon: CreditCard },
    { name: 'Timeline', to: '/activity', icon: Activity },
    { name: 'Settings', to: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 flex flex-col lg:flex-row font-sans leading-relaxed relative overflow-hidden">
      
      {/* Background gradients for cinematic atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-[140px]" />
      </div>

      {/* Persistent desktop sidebar or mobile drawer menu */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile menu drawer overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/85"
            />
            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ ease: "easeInOut", duration: 0.25 }}
              className="relative w-[240px] h-full"
            >
              <Sidebar />
              {/* Manual close drawer indicator */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-[-45px] p-2 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Master details content pane */}
      <div className="flex-1 lg:ml-[240px] relative z-10 flex flex-col h-screen overflow-hidden pb-[144px] lg:pb-0">
        
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32 sm:pb-36 lg:pb-24 layout-content bg-[#0A0A0B]">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Panel helper */}
      <GymOSAI />

      {/* ======================================================== */}
      {/* STICKY QUICK ACTIONS SHELF                               */}
      {/* ======================================================== */}
      {!isAdvisoryOpenOnNotifications && (
        <div className="fixed bottom-0 left-0 right-0 lg:bottom-6 lg:left-[270px] lg:right-6 flex flex-col items-center gap-3 z-40 px-4 pointer-events-none">
          
          {/* Sleek Horizontal Quick Action pill items (Desktop: Floating, Tablet: Compact icons deck, Mobile: hidden) */}
          <div className="pointer-events-auto hidden sm:flex items-center justify-center gap-2 lg:gap-4 p-2 sm:p-3 bg-[#0C0C0E]/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl">
            
            <button 
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-2.5 py-2 lg:px-4 lg:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="Enroll New Gym Member"
            >
              <Plus size={15} /> <span className="hidden lg:inline">Add Member</span>
            </button>

            <button 
              onClick={() => openRenewModal()}
              className="flex items-center gap-1.5 px-2.5 py-2 lg:px-4 lg:py-2.5 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="Renew Package Plans"
            >
              <Calendar size={15} className="text-zinc-400" /> <span className="hidden lg:inline">Renew Membership</span>
            </button>

            <button 
              onClick={() => openPaymentModal()}
              className="flex items-center gap-1.5 px-2.5 py-2 lg:px-4 lg:py-2.5 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="Record Transaction"
            >
              <CreditCard size={15} className="text-zinc-400" /> <span className="hidden lg:inline">Record Payment</span>
            </button>

            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-2.5 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="SaaS Global Index Search"
            >
              <Search size={15} className="text-zinc-400" /> <span className="hidden lg:inline">Search Directory</span>
            </button>

            <button 
              onClick={triggerOpenAI}
              className="flex items-center gap-1.5 px-2.5 py-2.5 bg-gradient-to-tr from-blue-500/10 to-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold cursor-pointer hover:bg-emerald-500/20 transition-all"
              title="Enquire GymOS AI Assistant"
            >
              <Bot size={15} className="animate-pulse" /> <span className="hidden lg:inline">Ask AI</span>
            </button>
          </div>

          {/* Dynamic bottom tab nav for mobile layout devices (Mobile: visible, Tablet/Desktop: hidden) */}
          <div className="pointer-events-auto block sm:hidden w-full max-w-sm bg-[#070708]/95 border border-white/5 rounded-2xl flex justify-around p-2.5 shadow-xl backdrop-blur-xl mb-4">
            {bottomNavLinks.map((link) => {
              const LinkIcon = link.icon;
              const active = location.pathname === link.to;
              return (
                <Link 
                  key={link.to} 
                  to={link.to}
                  className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                    active ? "text-blue-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <LinkIcon size={18} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* GLOBAL MODALS POPUPS                                     */}
      {/* ======================================================== */}
      <AnimatePresence>
        
        {/* MODAL 1: ADD GYM MEMBER */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto pt-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[32px] max-w-2xl w-full overflow-hidden shadow-2xl relative p-6 sm:p-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User size={18} className="text-blue-500" /> New Biometric Onboarding Enrollment
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-6">Store emergency details, health conditions, profile photo, and membership package. All fields are mandatory.</p>

              <form onSubmit={handleAddMemberSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                
                {/* Photo crop/upload first */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Member Profile Photo (Mandatory)</label>
                  <PhotoUpload 
                    value={photo} 
                    onChange={(b64) => setPhoto(b64)} 
                    onClear={() => setPhoto('')} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Liam Lawson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Personal Mobile Phone</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. +1 (555) 0192"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email address</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="iam@physique.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Age</label>
                    <input 
                      type="number" 
                      required 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Biological Gender</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Height (cm)</label>
                    <input 
                      type="number" 
                      required 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Weight (kg)</label>
                    <input 
                      type="number" 
                      required 
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Sub Plan details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-zinc-950/60 rounded-2xl border border-white/5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.51">Membership Plan</label>
                    <select 
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="monthly">Monthly Subscription</option>
                      <option value="quarterly">Quarterly Plan Pro</option>
                      <option value="yearly">Yearly VIP Pro</option>
                      <option value="custom">Custom Plan ★</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Duration</label>
                    <input 
                      type="text" 
                      required 
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl p-2.5 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Amount Price ({getCurrencySymbol(settings?.default_currency)})</label>
                    <input 
                      type="number" 
                      required 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl p-2.5 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {plan === 'custom' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/5 animate-in slide-in-from-top-2 duration-200 text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Custom Plan Name Presets</label>
                      <input
                        type="text"
                        list="dashboard-custom-plan-presets"
                        placeholder="e.g. 15-Day Trial"
                        value={customPlanName}
                        onChange={(e) => setCustomPlanName(e.target.value)}
                        className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <datalist id="dashboard-custom-plan-presets">
                        <option value="15-Day Trial" />
                        <option value="45-Day Transformation" />
                        <option value="90-Day Challenge" />
                        <option value="6-Month Corporate Package" />
                        <option value="Personal Training Package" />
                      </datalist>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Custom Start Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Custom Expiry Date</label>
                        <input
                          type="date"
                          value={customExpiryDate}
                          onChange={(e) => setCustomExpiryDate(e.target.value)}
                          className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2 mt-2">
                      <div className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1">Contract Parameters Output</div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-black/40 p-2 rounded-xl">
                          <span className="text-[8px] text-zinc-500 uppercase block font-medium">Duration</span>
                          <span className="text-xs font-mono font-bold text-white">{duration}</span>
                        </div>
                        <div className="bg-black/40 p-2 rounded-xl">
                          <span className="text-[8px] text-zinc-500 uppercase block font-medium">Remaining</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {(() => {
                              try {
                                const expiry = new Date(customExpiryDate);
                                const today = new Date();
                                expiry.setHours(0,0,0,0);
                                today.setHours(0,0,0,0);
                                const diffTime = expiry.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                return diffDays >= 0 ? `${diffDays} Days` : "Expired";
                              } catch (e) {
                                return "0 Days";
                              }
                            })()}
                          </span>
                        </div>
                        <div className="bg-black/40 p-2 rounded-xl">
                          <span className="text-[8px] text-zinc-500 uppercase block font-medium">Custom Value</span>
                          <span className="text-xs font-mono font-bold text-blue-300">
                            {formatCurrency(Number(price) || 0, settings?.default_currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Joining Date</label>
                    <input 
                      type="date" 
                      required 
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Contract Startup Date</label>
                    <input 
                      type="date" 
                      required 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Contract Expiry Date</label>
                    <input 
                      type="date" 
                      required 
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Emergency Contact Details</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Sarah Lawson +1 (555) 7511"
                      value={emergency}
                      onChange={(e) => setEmergency(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Home Street Address</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="403 Powerlifting Way Apt 30"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Medical / Health notes</label>
                    <input 
                      type="text" 
                      placeholder="Asthma, knee surgery..." 
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Additional trainer notes</label>
                    <input 
                      type="text" 
                      placeholder="Prefers high intensity..." 
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 font-semibold rounded-xl hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} /> Approved & Active
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 2: RENEW MEMBERSHIP */}
        {isRenewModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl relative p-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-500" /> Renew Plan On-The-Spot
                </h3>
                <button 
                  onClick={() => setIsRenewModalOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-6">Select a profile, extend their subscription contract, and log an automated transaction clearance invoice instantly.</p>

              <form onSubmit={handleRenewSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Select Member Account</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                  >
                    <option value="" disabled>-- Select Enrollee Profile --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.status} - until {m.expiry_date.split('T')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Renewal Plan</label>
                    <select
                      value={renewPlan}
                      onChange={(e) => setRenewPlan(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-semibold"
                    >
                      <option value="monthly">Monthly Pro</option>
                      <option value="quarterly">Quarterly Plan Pro</option>
                      <option value="yearly">Yearly VIP Unlimited</option>
                      <option value="custom">Custom Plan ★</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Assigned Price ({getCurrencySymbol(settings?.default_currency)})</label>
                    <input 
                      type="number"
                      value={renewPrice}
                      onChange={(e) => setRenewPrice(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {renewPlan === 'custom' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/5 animate-in slide-in-from-top-2 duration-200 text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Custom Renewal Plan Name Presets</label>
                      <input
                        type="text"
                        list="dashboard-renew-plan-presets"
                        placeholder="e.g. 90-Day Challenge"
                        value={renewCustomPlanName}
                        onChange={(e) => setRenewCustomPlanName(e.target.value)}
                        className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <datalist id="dashboard-renew-plan-presets">
                        <option value="15-Day Trial" />
                        <option value="45-Day Transformation" />
                        <option value="90-Day Challenge" />
                        <option value="6-Month Corporate Package" />
                        <option value="Personal Training Package" />
                      </datalist>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Custom Start Date</label>
                        <input
                          type="date"
                          value={renewCustomStartDate}
                          onChange={(e) => setRenewCustomStartDate(e.target.value)}
                          className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Custom Expiry Date</label>
                        <input
                          type="date"
                          value={renewCustomExpiryDate}
                          onChange={(e) => setRenewCustomExpiryDate(e.target.value)}
                          className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 mt-2">
                      <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">Renewal Contract calculations</div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-black/40 p-2 rounded-xl">
                          <span className="text-[8px] text-zinc-500 uppercase block font-medium">Duration Total</span>
                          <span className="text-xs font-mono font-bold text-white">
                            {(() => {
                              try {
                                const start = new Date(renewCustomStartDate);
                                const end = new Date(renewCustomExpiryDate);
                                const diffDays = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                return `${diffDays} Days`;
                              } catch (e) {
                                return "0 Days";
                              }
                            })()}
                          </span>
                        </div>
                        <div className="bg-black/40 p-2 rounded-xl">
                          <span className="text-[8px] text-zinc-500 uppercase block font-medium">Renewal Value</span>
                          <span className="text-xs font-mono font-bold text-emerald-300">
                            {formatCurrency(Number(renewPrice) || 0, settings?.default_currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Start Date</label>
                    <input 
                      type="date"
                      value={renewStartDate}
                      onChange={(e) => setRenewStartDate(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Auto Calculated Expiry</label>
                    <input 
                      type="date"
                      value={renewExpiryDate}
                      onChange={(e) => setRenewExpiryDate(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono text-zinc-400"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsRenewModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 font-semibold rounded-xl hover:text-white"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} /> Clear Ledger Payment
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 3: RECORD PAYMENT */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl relative p-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-500" /> Log Dynamic General Payment
                </h3>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-6 font-medium">Record supplementary training classes fees, personal trainer hours receipts, or custom member settlements.</p>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Select Member Profile</label>
                  <select
                    value={payMemberId}
                    onChange={(e) => setPayMemberId(e.target.value)}
                    required
                    className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                  >
                    <option value="" disabled>-- Select Recipient --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Amount To Collect ({getCurrencySymbol(settings?.default_currency)})</label>
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 150"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Payment Channel</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-semibold"
                    >
                      <option value="Cash">Cash Handover</option>
                      <option value="Card">Visa/Mastercard Terminal</option>
                      <option value="UPI">UPI Instant (India)</option>
                      <option value="Bank Transfer">Direct Wire Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Log Date</label>
                    <input 
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Revenue Category</label>
                    <select
                      value={payPurpose}
                      onChange={(e) => setPayPurpose(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-semibold"
                    >
                      <option value="monthly">Monthly Active Plan</option>
                      <option value="quarterly">Quarterly Core Plan</option>
                      <option value="yearly">Yearly VIP Unlimited</option>
                      <option value="personal_training">Personal Training Session</option>
                      <option value="registration">Admission/Lockers Deposit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Clearing Status</label>
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none font-semibold"
                  >
                    <option value="Completed">Completed / Settle Credit</option>
                    <option value="Pending">Pending / Unsettled Dues</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 font-semibold rounded-xl hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} /> Commit Dynamic Payment
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 4: GLOBAL INTERACTIVE SEARCH & NATURAL LANGUAGE AI QUERY */}
        {isSearchModalOpen && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[36px] max-w-2xl w-full overflow-hidden shadow-2xl relative p-6 sm:p-8"
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Search size={18} className="text-blue-500 animate-pulse" /> Global GymOS Directory Lookup
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Find active/expired contracts profiles or ask artificial intelligence to filter query results.</p>
                </div>
                <button 
                  onClick={() => setIsSearchModalOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 1. KEYWORD SEARCH */}
              <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-3.5 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Instantly type name, phone, email, status, or plan..."
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  className="w-full bg-[#050506] border border-white/10 text-xs text-zinc-200 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner font-sans"
                  autoFocus
                />
              </div>

              {/* Result set cards */}
              {globalSearchTerm && (
                <div className="mb-6 max-h-[160px] overflow-y-auto space-y-2 pr-1">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Matching Directory profiles ({matchedMembers.length})</p>
                  
                  {matchedMembers.length === 0 ? (
                    <div className="text-zinc-550 italic text-xs py-4 text-center">No matches found in active directory index.</div>
                  ) : (
                    matchedMembers.map(m => (
                      <div key={m.id} className="p-3 bg-[#050506]/60 border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                            {m.profile_photo_url ? (
                              <img src={m.profile_photo_url} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              m.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">{m.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono border ${
                                m.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' :
                                m.status === 'expiring_soon' ? 'bg-orange-500/10 text-orange-400 border-orange-500/15' : 'bg-red-500/10 text-red-400 border-red-500/15'
                              }`}>
                                {m.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-medium font-mono mt-0.5 flex gap-2 flex-wrap">
                              <span>Plan: {m.membership_plan}</span>
                              <span>• Expire: {m.expiry_date.split('T')[0]}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {/* Tap-to-call link contact */}
                          {m.phone && (
                            <a 
                              href={`tel:${m.phone}`}
                              className="p-1.5 bg-zinc-900 hover:bg-zinc-805 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition-all"
                              title="Tap to Call Contact Phone"
                            >
                              <Phone size={13} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openRenewModal(m.id)}
                            className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1.5 rounded-lg border border-emerald-500/10"
                          >
                            Quick Renew
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSearchModalOpen(false);
                              navigate(`/members/${m.id}`);
                            }}
                            className="text-[9px] bg-blue-500 hover:bg-blue-650 text-white font-bold px-2 py-1.5 rounded-lg"
                          >
                            Go To Profile
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 2. DYNAMIC CENTRAL AI NATURAL LANGUAGE SEARCH */}
              <div className="border-t border-zinc-800/40 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={13} className="text-emerald-400" /> Seek Biometrics/Dues via Natural Language AI
                </h4>
                
                <form onSubmit={handleAISearchSubmit} className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. Find members weights over 80kg or expiring within this week..."
                    value={aiSearchPrompt}
                    onChange={(e) => setAiSearchPrompt(e.target.value)}
                    className="flex-1 bg-[#050506] border border-white/5 focus:border-emerald-500/55 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={aiSearchLoading}
                    className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {aiSearchLoading ? "Piping telemetry..." : "Ask AI Search"}
                  </button>
                </form>

                {aiSearchResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-zinc-950/80 border border-white/5 rounded-xl max-h-[160px] overflow-y-auto text-xs text-zinc-300 leading-relaxed font-medium"
                  >
                    {aiSearchResult}
                  </motion.div>
                )}
              </div>

            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {user?.role === 'gym_owner' && user.status === 'suspended' && (
        <SuspendedOverlay logout={logout} navigate={navigate} />
      )}

    </div>
  );
}

function SuspendedOverlay({ logout, navigate }: { logout: () => void; navigate: any }) {
  const [shake, setShake] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastTimeout, setToastTimeout] = useState<any>(null);

  const triggerAlert = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);

    setShowToast(true);
    if (toastTimeout) clearTimeout(toastTimeout);
    const timeout = setTimeout(() => {
      setShowToast(false);
    }, 6000);
    setToastTimeout(timeout);
  };

  return (
    <div 
      onClick={triggerAlert}
      className="fixed inset-0 z-[999999] bg-[#0A0A0B]/75 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none cursor-pointer"
    >
      {/* Toast Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[1000000] p-4 bg-red-950/90 border border-red-500/30 text-red-200 rounded-2xl shadow-2xl flex items-start gap-3 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert size={18} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">Action Blocked</h4>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                you have suspended please contact 8919105441 if you are from other country (not india) call or text us in whats up for restoring your access
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowToast(false);
              }}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Lock Card */}
      <motion.div
        animate={shake ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        onClick={(e) => {
          e.stopPropagation();
          triggerAlert();
        }}
        className="glass-card border border-red-500/20 max-w-md w-full p-8 rounded-[28px] text-center shadow-2xl relative overflow-hidden bg-[#121214]/90"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 bg-red-950/40 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-lg shadow-red-500/10">
          <ShieldAlert size={32} className="animate-bounce" />
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight mb-2">
          Workspace Suspended
        </h2>

        <div className="mx-auto mb-5 px-3 py-1 rounded-full border border-red-500/20 bg-red-950/20 text-red-300 text-[10px] font-mono uppercase tracking-wider inline-block">
          Access Status: Suspended
        </div>

        <p className="text-zinc-300 mb-6 leading-relaxed text-sm font-medium">
          you have suspended please contact <span className="text-red-400 font-bold tracking-wide">8919105441</span> if you are from other country (not india) call or text us in whats up for restoring your access
        </p>

        <div className="pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              logout();
              navigate('/login');
            }}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl font-medium transition-all border border-white/5 flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
