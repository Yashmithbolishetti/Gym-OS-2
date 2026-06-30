import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Edit2, CreditCard, Calendar, Activity, 
  MapPin, Mail, Phone, Weight, Sliders, ShieldAlert, CheckCircle2, Archive, HelpCircle, X, Check, Printer, Download, Trash2, RotateCcw
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDate, formatCurrency, getCurrencySymbol } from '../../lib/utils';
import PhotoUpload from '../../components/shared/PhotoUpload';

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    members, editMember, suspendMember, reactivateMember, 
    archiveMember, restoreMember, deleteMember, recordPayment, isLoading, settings, showToast 
  } = useData();
  
  const member = members.find(m => m.id === id);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [plan, setPlan] = useState('monthly');
  const [price, setPrice] = useState('99');
  const [photo, setPhoto] = useState('');
  const [notes, setNotes] = useState('');
  const [emergency, setEmergency] = useState('');
  const [address, setAddress] = useState('');
  const [medical, setMedical] = useState('');

  // Renew State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewPlan, setRenewPlan] = useState('monthly');
  const [renewPrice, setRenewPrice] = useState('99');
  const [renewMonths, setRenewMonths] = useState(1);

  // States for Custom Plan calculations (Priority Fix #2)
  const [renewCustomPlanName, setRenewCustomPlanName] = useState('90-Day Challenge');
  const [renewCustomStartDate, setRenewCustomStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [renewCustomExpiryDate, setRenewCustomExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });

  // Custom Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payPurpose, setPayPurpose] = useState('monthly');

  // Sync edit form on open
  const handleOpenEdit = () => {
    if (!member) return;
    setName(member.name);
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setAge(String(member.age ?? '25'));
    setGender(member.gender || 'Male');
    setHeight(String(member.height ?? '170'));
    setWeight(String(member.weight ?? '70'));
    setPlan(member.membership_plan || 'monthly');
    setPrice(String(member.membership_price || '99'));
    setPhoto(member.profile_photo_url || '');
    setNotes(member.notes || '');
    setEmergency(member.emergency_contact || '');
    setAddress(member.address || '');
    setMedical(member.medical_notes || '');
    setIsEditModalOpen(true);
  };

  const [gender, setGender] = useState('Male');

  useEffect(() => {
    const monthlyPrice = settings?.plan_monthly_price || '99';
    const quarterlyPrice = settings?.plan_quarterly_price || '250';
    const yearlyPrice = settings?.plan_yearly_price || '990';
    if (renewPlan === 'monthly') {
      setRenewPrice(monthlyPrice);
      setRenewMonths(1);
    } else if (renewPlan === 'quarterly') {
      setRenewPrice(quarterlyPrice);
      setRenewMonths(3);
    } else if (renewPlan === 'yearly') {
      setRenewPrice(yearlyPrice);
      setRenewMonths(12);
    } else if (renewPlan === 'custom') {
      try {
        const start = new Date(renewCustomStartDate);
        const end = new Date(renewCustomExpiryDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        setRenewPrice("150"); // default for custom
        setRenewMonths(Math.ceil(diffDays / 30) || 1);
      } catch (e) {}
    }
  }, [renewPlan, settings, renewCustomStartDate, renewCustomExpiryDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-t-2 border-blue-500 border-r-2 border-transparent rounded-full"
        />
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-mono">Loading telemetry profile...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <ShieldAlert size={40} className="text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Record Not Found</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">The specific enrollment profile ID may have been deleted, clean-swept, or archived under separate metadata parameters.</p>
        <Link to="/members" className="inline-block px-4 py-2 bg-zinc-900 border border-white/5 hover:text-white rounded-xl text-xs font-semibold">
          Return to Registry
        </Link>
      </div>
    );
  }

  // Action Operations
  const handleToggleSuspension = async () => {
    try {
      if (member.status === 'suspended') {
        const updated = await reactivateMember(member.id);
        showToast(`Suspension lifted. ${updated.name} credentials reactivated.`, "success");
      } else {
        const updated = await suspendMember(member.id);
        showToast(`${updated.name} access suspended.`, "success");
      }
    } catch (err) {
      showToast("Error updating suspension state: " + err, "error");
    }
  };

  const handleToggleArchival = async () => {
    try {
      if (member.is_archived) {
        const updated = await restoreMember(member.id);
        showToast(`${updated.name} reinstated to the active directory.`, "success");
      } else {
        const updated = await archiveMember(member.id);
         showToast(`${updated.name} archived safely.`, "success");
      }
    } catch (err) {
      showToast("Error archiving: " + err, "error");
    }
  };

  const handleDeletePermanent = async () => {
    try {
      await deleteMember(member.id);
      showToast("The biometric registry record was completely wiped.", "info");
      navigate("/members");
    } catch (err) {
      showToast("Error deleting record.", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await editMember(member.id, {
        name,
        email,
        phone,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        notes,
        emergency_contact: emergency,
        address,
        medical_notes: medical,
        profile_photo_url: photo || undefined
      });
      setIsEditModalOpen(false);
      showToast(`Profile updated for ${updated.name}.`, "success");
    } catch (err) {
      showToast("Failed updating member details.", "error");
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let expiryIso = "";
    let finalPlanName = renewPlan;
    if (renewPlan === 'custom') {
      expiryIso = new Date(renewCustomExpiryDate).toISOString();
      finalPlanName = renewCustomPlanName.trim() || "Custom Plan";
    } else {
      let baseDate = new Date();
      const currExpiry = new Date(member.expiry_date);
      if (currExpiry > new Date()) {
        baseDate = currExpiry;
      }
      baseDate.setMonth(baseDate.getMonth() + renewMonths);
      expiryIso = baseDate.toISOString();
    }

    try {
      const updated = await editMember(member.id, {
        expiry_date: expiryIso,
        membership_plan: finalPlanName as any,
        membership_price: Number(renewPrice),
        status: 'active'
      });

      await recordPayment({
        member_id: member.id,
        amount: Number(renewPrice),
        method: 'Cash',
        status: 'Completed',
        date: new Date().toISOString().split('T')[0],
        purpose: finalPlanName
      });

      setIsRenewModalOpen(false);
      showToast(`Contract plan premium extended for ${updated.name}.`, "success");
    } catch (e) {
      showToast("Error applying renewal: " + e, "error");
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;
    try {
      await recordPayment({
        member_id: member.id,
        amount: Number(payAmount),
        method: payMethod,
        purpose: payPurpose,
        status: 'Completed',
        date: new Date().toISOString().split('T')[0]
      });
      setIsPaymentModalOpen(false);
      showToast("Custom transaction item cleared successfully.", "success");
    } catch (err) {
      showToast("Transaction logging error: " + err, "error");
    }
  };

  const handleExportDataForMember = () => {
    const blob = new Blob([JSON.stringify(member, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GymOS_Profile_${member.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintInformation = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Biometric Sheet - ${member.name}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #111; }
            .card { border: 2px solid #ccc; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; }
            h1 { margin-top: 0; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #555; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>GymOS Member Telemetry Record</h1>
            <div class="field"><span class="label">Full Name:</span><span>${member.name}</span></div>
            <div class="field"><span class="label">Phone:</span><span>${member.phone || 'N/A'}</span></div>
            <div class="field"><span class="label">Email Address:</span><span>${member.email || 'N/A'}</span></div>
            <div class="field"><span class="label">Age / Gender:</span><span>${member.age ?? '25'} yrs / ${member.gender || 'Male'}</span></div>
            <div class="field"><span class="label">Composition:</span><span>${member.weight ?? '70'}kg / ${member.height ?? '170'}cm</span></div>
            <div class="field"><span class="label">Package Plan:</span><span>${member.membership_plan.toUpperCase()}</span></div>
            <div class="field"><span class="label">Start/Expiry Date:</span><span>${formatDate(member.joining_date)} to ${formatDate(member.expiry_date)}</span></div>
            <div class="field"><span class="label">Emergency Contact:</span><span>${member.emergency_contact || 'N/A'}</span></div>
            <div class="field"><span class="label">Medical Precautions:</span><span>${member.medical_notes || 'None noted'}</span></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full overflow-hidden flex flex-col font-sans pb-16 lg:pb-0">
      
      {/* Profiler Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/members" className="w-10 h-10 rounded-xl bg-[#0C0C0E] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white mb-0.5">Telemetry Profile</h1>
            <p className="text-zinc-500 text-sm">Review biometric logging, body composition metrics, and status flags.</p>
          </div>
        </div>
        
        <div className="flex gap-2.5 flex-wrap">
          <button 
            onClick={handleToggleSuspension}
            className={`flex items-center gap-2 px-4 py-2 border text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
              member.status === 'suspended'
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                : "border-orange-500/20 bg-orange-500/5 text-orange-400"
            }`}
          >
            <ShieldAlert size={14} /> {member.status === 'suspended' ? "Lift Suspension" : "Suspend Access"}
          </button>

          <button 
            onClick={handleToggleArchival}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C0C0E] border border-white/5 text-[11px] text-zinc-300 font-bold rounded-xl hover:text-white"
          >
            <Archive size={14} /> {member.is_archived ? "Restore Account" : "Archive Account"}
          </button>

          <button 
            onClick={handleOpenEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-[11px] text-white font-bold rounded-xl"
          >
            <Edit2 size={14} /> Edit Biometrics
          </button>
        </div>
      </div>

      {/* Main split details content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start overflow-y-auto pr-1">
        
        {/* Profile Card Sidebar */}
        <div className="glass-card border border-white/5 rounded-3xl p-6 space-y-6 text-center shadow-xl bg-gradient-to-b from-[#0C0C0E]/90 to-[#0A0A0B]/80 relative overflow-hidden">
          
          {/* Circular picture frame */}
          <div className="relative w-32 h-32 mx-auto rounded-full border-2 border-white/10 p-1 bg-zinc-950/40">
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border border-white/5 flex items-center justify-center text-4xl font-bold uppercase text-white">
              {member.profile_photo_url ? (
                <img referrerPolicy="no-referrer" src={member.profile_photo_url} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span>{member.name.charAt(0)}</span>
              )}
            </div>
            
            <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-[#09090b] ${
              member.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/40' :
              member.status === 'expiring_soon' ? 'bg-orange-500 shadow-orange-500/40' :
              member.status === 'suspended' ? 'bg-zinc-500 shadow-zinc-500/40' : 'bg-red-500 shadow-red-500/40'
            }`} />
          </div>

          <div>
            <h2 className="text-base font-bold text-white mb-1.5">{member.name}</h2>
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest leading-none font-bold">Biometric ID: {member.id.substring(0, 8)}</p>
          </div>

          <div className="px-3 py-1 bg-zinc-950/60 rounded-xl border border-white/5 text-xs text-zinc-300 font-semibold flex justify-between items-center gap-2">
            <span className="text-zinc-550 text-zinc-500 uppercase text-[9px] font-bold tracking-widest">Active Status</span>
            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase font-mono border ${
              member.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' :
              member.status === 'expiring_soon' ? 'bg-orange-500/10 text-orange-400 border-orange-500/15' :
              member.status === 'suspended' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/15' : 'bg-red-500/10 text-red-100 border-red-500/15'
            }`}>
              {member.status}
            </span>
          </div>

          {/* Quick Contact metrics */}
          <div className="p-4 bg-[#050506]/60 rounded-2xl border border-white/5 space-y-3.5 text-left text-xs text-zinc-300">
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-zinc-550 text-zinc-400" />
              <span className="lowercase truncate font-mono">{member.email || "No email in ledger"}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone size={14} className="text-zinc-555 text-zinc-400" />
              {/* Tap-to-call link contact details */}
              <a href={`tel:${member.phone}`} className="text-blue-400 font-bold hover:underline font-mono">{member.phone || "No connection"}</a>
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={14} className="text-zinc-550 text-zinc-400" />
              <span className="truncate">{member.address || "No primary street listed"}</span>
            </div>
          </div>

          {/* Printing & Backup elements */}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <button 
              onClick={handlePrintInformation}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-zinc-900 hover:bg-zinc-805 border border-white/5 text-[10px] font-bold text-zinc-350 hover:text-white rounded-xl cursor-pointer"
            >
              <Printer size={12} /> Print telemetry
            </button>
            <button 
              onClick={handleExportDataForMember}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-zinc-900 hover:bg-zinc-805 border border-white/5 text-[10px] font-bold text-zinc-350 hover:text-white rounded-xl cursor-pointer"
            >
              <Download size={12} /> Export profile
            </button>
          </div>

        </div>

        {/* Dynamic Detail Sections */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Biometrics compositional details */}
          <div className="glass-card border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-blue-500" /> Compositional Biometrics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Biological Age</span>
                <span className="text-lg font-bold text-white font-mono">{member.age ?? '25'} <span className="text-xs text-zinc-500">YRS</span></span>
              </div>
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Biological Gender</span>
                <span className="text-lg font-bold text-white capitalize">{member.gender || 'Male'}</span>
              </div>
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Body Height</span>
                <span className="text-lg font-bold text-white font-mono">{member.height ?? '170'} <span className="text-xs text-zinc-500">CM</span></span>
              </div>
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Body Weight</span>
                <span className="text-lg font-bold text-white font-mono">{member.weight ?? '70'} <span className="text-xs text-zinc-500">KG</span></span>
              </div>
            </div>
          </div>

          {/* Core Plan specs & dates */}
          <div className="glass-card border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} className="text-emerald-500" /> Subscription Contract Plan
              </h3>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsRenewModalOpen(true)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1.5 border border-emerald-500/10 rounded-lg cursor-pointer"
                >
                  Spot Extend Plan
                </button>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1.5 border border-blue-500/10 rounded-lg cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 bg-[#050506]/40 rounded-2xl border border-white/5">
                <span className="text-[9px] text-zinc-550 text-zinc-500 uppercase tracking-widest font-bold block mb-1">Assigned Package</span>
                <span className="text-base font-bold text-white capitalize">{member.membership_plan} Package</span>
              </div>
              <div className="p-4 bg-[#050506]/40 rounded-2xl border border-white/5">
                <span className="text-[9px] text-zinc-550 text-zinc-500 uppercase tracking-widest font-bold block mb-1">General premium paid</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">{formatCurrency(member.membership_price)}</span>
              </div>
              <div className="p-4 bg-[#050506]/40 rounded-2xl border border-white/5">
                <span className="text-[9px] text-zinc-550 text-zinc-500 uppercase tracking-widest font-bold block mb-1">Expiry Date</span>
                <span className="text-base font-bold text-zinc-200 font-mono">{formatDate(member.expiry_date)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 border border-white/5 bg-[#050506]/60 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1.5">Emergency Contact details</span>
                <p className="font-semibold text-zinc-200">{member.emergency_contact || "Emergency contact not specified"}</p>
              </div>
              <div className="p-4 border border-white/5 bg-[#050506]/60 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1.5 font-sans">Active Health Caveats / medical</span>
                <p className="font-semibold text-zinc-200">{member.medical_notes || "No standard asthma/knee injury declared"}</p>
              </div>
            </div>

            {member.notes && (
              <div className="p-4 bg-[#050506]/20 rounded-2xl border border-white/5 text-xs text-zinc-400 leading-relaxed">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Personal trainer directives</span>
                {member.notes}
              </div>
            )}
          </div>

          {/* Safety deletion warning section */}
          <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Safety Permanent deletion
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">This will permanently delete the member from all registry directory, logs, and database tables.</p>
            </div>
            
            <button 
              onClick={handleDeletePermanent}
              className="py-2 px-4 text-xs font-bold bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all cursor-pointer border border-red-505 border-red-500/20"
            >
              Force Wipe Profile
            </button>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* OPERATIONS MULTI-MODAL DETAILS SYSTEM                  */}
      {/* ======================================================== */}
      <AnimatePresence>
        
        {/* EDIT OVERLAY */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-55 overflow-y-auto pt-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl relative p-6 sm:p-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="text-blue-500" size={18} /> Modify Biometrics Telemetry
                </h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Change Profile Photo</label>
                  <PhotoUpload value={photo} onChange={(b64) => setPhoto(b64)} onClear={() => setPhoto('')} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-[#0a1b3a] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email address</label>
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Phone contact</label>
                    <input
                      type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Age</label>
                    <input
                      type="number" value={age} onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Height (cm)</label>
                    <input
                      type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Weight (kg)</label>
                    <input
                      type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Emergency contact</label>
                    <input
                      type="text" required value={emergency} onChange={(e) => setEmergency(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-sans">physical Address</label>
                    <input
                      type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-sans">Active Medical Caveats</label>
                  <input
                    type="text" value={medical} onChange={(e) => setMedical(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Personal Instruction notes</label>
                  <textarea
                    rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl p-3 focus:outline-none text-xs text-zinc-300"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button" onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-405 text-zinc-400 rounded-xl hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* RENEW OVERLAY */}
        {isRenewModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-55">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[32px] max-w-md w-full p-8 shadow-2xl relative"
            >
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="text-emerald-500" size={18} /> Renew Contract Plan
              </h3>
              
              <form onSubmit={handleRenewSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Package Option</label>
                  <select
                    value={renewPlan} onChange={(e) => setRenewPlan(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none font-semibold"
                  >
                    <option value="monthly">Monthly Plan Package</option>
                    <option value="quarterly">Quarterly Plan Pro</option>
                    <option value="yearly">Yearly VIP Unlimited</option>
                    <option value="custom">Custom Plan ★</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Override Price rate ({getCurrencySymbol(settings?.default_currency)})</label>
                  <input
                    type="number" value={renewPrice} onChange={(e) => setRenewPrice(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none font-mono"
                  />
                </div>

                {renewPlan === 'custom' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/5 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Custom Renewal Plan Name Presets</label>
                      <input
                        type="text"
                        list="profile-renew-presets"
                        placeholder="e.g. 90-Day Challenge"
                        value={renewCustomPlanName}
                        onChange={(e) => setRenewCustomPlanName(e.target.value)}
                        className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <datalist id="profile-renew-presets">
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

                <div className="flex gap-3 pt-3">
                  <button
                    type="button" onClick={() => setIsRenewModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> Safe Extend
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* PAYMENT OVERLAY */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-55">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[32px] max-w-md w-full p-8 shadow-2xl relative"
            >
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="text-blue-500" size={18} /> Record supplementary Fee
              </h3>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Collected Amount ({getCurrencySymbol(settings?.default_currency)})</label>
                  <input
                    type="number" required placeholder="e.g. 70"
                    value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">method</label>
                    <select
                      value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-2 py-3 text-xs text-zinc-200 focus:outline-none font-semibold"
                    >
                      <option value="Cash">Cash Handover</option>
                      <option value="Card">Visa Terminal</option>
                      <option value="UPI">UPI Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-sans">purpose</label>
                    <select
                      value={payPurpose} onChange={(e) => setPayPurpose(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-2 py-3 text-xs text-zinc-200 focus:outline-none font-semibold"
                    >
                      <option value="monthly">Monthly plan surcharge</option>
                      <option value="personal_training">Personal Training session</option>
                      <option value="registration">admission lockup deposit</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button" onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl"
                  >
                    Log Transaction
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
