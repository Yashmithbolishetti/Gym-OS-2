import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, UserCircle, Download, X, Eye, CreditCard, 
  ShieldAlert, Trash2, Phone, Mail, Archive, RotateCcw, Edit2, CheckCircle, CheckSquare, Dumbbell, Calendar, FileText, Printer, Check
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDate, formatCurrency, getCurrencySymbol } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { exportToCSV, exportToExcel, exportToPDF } from '../../lib/exportUtils';
import PhotoUpload from '../../components/shared/PhotoUpload';

export default function Members() {
  const { 
    members, addMember, editMember, deleteMember, suspendMember, 
    reactivateMember, archiveMember, restoreMember, recordPayment, isLoading, settings, showToast 
  } = useData();
  
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active_only');

  // Interactive Operations Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Focus target ID
  const [targetMemberId, setTargetMemberId] = useState('');

  // Add/Edit Form Fields
  const [photo, setPhoto] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('78');
  const [plan, setPlan] = useState('monthly');
  const [duration, setDuration] = useState('1 month');
  const [price, setPrice] = useState('99');
  const [notes, setNotes] = useState('');
  const [emergency, setEmergency] = useState('');
  const [address, setAddress] = useState('');
  const [medical, setMedical] = useState('');

  // States for Custom Plan calculations (Priority Fix #2)
  const [customPlanName, setCustomPlanName] = useState('15-Day Trial');
  const [customStartDate, setCustomStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customExpiryDate, setCustomExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  // Renewal Form Fields
  const [renewPlan, setRenewPlan] = useState('monthly');
  const [renewPrice, setRenewPrice] = useState('99');
  const [renewMonths, setRenewMonths] = useState(1);

  // Renewal Custom Plan states
  const [renewCustomPlanName, setRenewCustomPlanName] = useState('90-Day Challenge');
  const [renewCustomStartDate, setRenewCustomStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [renewCustomExpiryDate, setRenewCustomExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });

  // Record Payment Form Fields
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentPurpose, setPaymentPurpose] = useState('monthly');

  // Sync pricing for new additions
  useEffect(() => {
    const monthlyPrice = settings?.plan_monthly_price || '99';
    const quarterlyPrice = settings?.plan_quarterly_price || '250';
    const yearlyPrice = settings?.plan_yearly_price || '990';
    if (plan === 'monthly') {
      setPrice(monthlyPrice);
      setDuration('1 month');
    } else if (plan === 'quarterly') {
      setPrice(quarterlyPrice);
      setDuration('3 months');
    } else if (plan === 'yearly') {
      setPrice(yearlyPrice);
      setDuration('12 months');
    } else if (plan === 'custom') {
      try {
        const start = new Date(customStartDate);
        const end = new Date(customExpiryDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        setDuration(`${diffDays} days`);
      } catch (e) {
        setDuration("0 days");
      }
    }
  }, [plan, settings, customStartDate, customExpiryDate]);

  // Sync renewal defaults
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
        setRenewPrice("150"); // initial default for custom
        setRenewMonths(Math.ceil(diffDays / 30) || 1);
      } catch (e) {}
    }
  }, [renewPlan, settings, renewCustomStartDate, renewCustomExpiryDate]);

  // Multi-dimensional filter
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (m.phone && m.phone.includes(searchTerm));

    if (statusFilter === 'archived') {
      return matchesSearch && m.is_archived;
    }
    if (statusFilter === 'all') {
      return matchesSearch;
    }
    if (statusFilter === 'active_only') {
      return matchesSearch && !m.is_archived;
    }
    // Specific standard filters
    return matchesSearch && m.status === statusFilter && !m.is_archived;
  });

  // Action handovers
  const openEditModal = (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetMemberId(member.id);
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

  const openRenewModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetMemberId(id);
    setIsRenewModalOpen(true);
  };

  const openRecordModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetMemberId(id);
    setAmountPaid('');
    setIsRecordModalOpen(true);
  };

  const triggerDeleteConfirm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetMemberId(id);
    setIsDeleteConfirmOpen(true);
  };

  // Toggle Actions
  const handleToggleSuspension = async (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (member.status === 'suspended') {
        const updated = await reactivateMember(member.id);
        showToast(`Suspension lifted. ${updated.name} access reactivated.`, "success");
      } else {
        const updated = await suspendMember(member.id);
        showToast(`${updated.name} has been suspended inside the records.`, "success");
      }
    } catch (err) {
      showToast("Status mutation error: " + err, "error");
    }
  };

  const handleToggleArchival = async (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (member.is_archived) {
        const updated = await restoreMember(member.id);
        showToast(`${updated.name} restored to the active registry.`, "success");
      } else {
        const updated = await archiveMember(member.id);
        showToast(`${updated.name} is archived and filtered from active view.`, "success");
      }
    } catch (err) {
      showToast("Archival mutation error: " + err, "error");
    }
  };

  // Submits
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      showToast("Name, Phone, and Email are strictly required.", "error");
      return;
    }

    let expiryIso = "";
    let finalPlanName = plan;

    if (plan === 'custom') {
      expiryIso = new Date(customExpiryDate).toISOString();
      finalPlanName = customPlanName.trim() || "Custom Plan";
    } else {
      const d = new Date();
      let days = 30;
      if (plan === 'quarterly') days = 90;
      else if (plan === 'yearly') days = 365;
      d.setDate(d.getDate() + days);
      expiryIso = d.toISOString();
    }

    try {
      const added = await addMember({
        name,
        email,
        phone,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        membership_plan: finalPlanName as any,
        membership_price: Number(price),
        expiry_date: expiryIso,
        notes,
        joining_date: plan === 'custom' ? new Date(customStartDate).toISOString() : new Date().toISOString(),
        emergency_contact: emergency,
        address,
        medical_notes: medical,
        profile_photo_url: photo || undefined,
        status: 'active'
      });

      // Reset
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setPhoto('');
      setIsAddModalOpen(false);
      showToast(`Onboarding finished. Registered ${added.name} successfully!`, "success");
    } catch (err) {
      showToast("Error adding member record.", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalPlanName = plan;
    if (plan === 'custom') {
      finalPlanName = customPlanName.trim() || "Custom Plan";
    }
    try {
      const updated = await editMember(targetMemberId, {
        name,
        email,
        phone,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        membership_plan: finalPlanName as any,
        membership_price: Number(price),
        notes,
        emergency_contact: emergency,
        address,
        medical_notes: medical,
        profile_photo_url: photo || undefined
      });
      setIsEditModalOpen(false);
      showToast(`Profile telemetry updated for ${updated.name}.`, "success");
    } catch (err) {
      showToast("Failed updating member details.", "error");
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMember = members.find(m => m.id === targetMemberId);
    if (!currentMember) return;

    let expiryIso = "";
    let finalPlanName = renewPlan;
    if (renewPlan === 'custom') {
      expiryIso = new Date(renewCustomExpiryDate).toISOString();
      finalPlanName = renewCustomPlanName.trim() || "Custom Plan";
    } else {
      let baseDate = new Date();
      const currExpiry = new Date(currentMember.expiry_date);
      if (currExpiry > new Date()) {
        baseDate = currExpiry;
      }
      baseDate.setMonth(baseDate.getMonth() + renewMonths);
      expiryIso = baseDate.toISOString();
    }

    try {
      const updated = await editMember(targetMemberId, {
        expiry_date: expiryIso,
        membership_plan: finalPlanName as any,
        membership_price: Number(renewPrice),
        status: 'active'
      });

      await recordPayment({
        member_id: targetMemberId,
        amount: Number(renewPrice),
        method: 'Cash',
        status: 'Completed',
        date: new Date().toISOString().split('T')[0],
        purpose: finalPlanName
      });

      setIsRenewModalOpen(false);
      showToast(`Contract extension recorded for ${updated.name}.`, "success");
    } catch (e) {
      showToast("Error applying renewal.", "error");
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountPaid) return;
    try {
      await recordPayment({
        member_id: targetMemberId,
        amount: Number(amountPaid),
        method: paymentMethod,
        purpose: paymentPurpose,
        status: 'Completed',
        date: new Date().toISOString().split('T')[0]
      });
      setIsRecordModalOpen(false);
      showToast(`Checkout transaction printed and recorded successfully.`, "success");
    } catch (err) {
      showToast("Transaction logging error: " + err, "error");
    }
  };

  const handlePermanentDelete = async () => {
    try {
      await deleteMember(targetMemberId);
      setIsDeleteConfirmOpen(false);
      showToast("Member record wiped permanently from registry.", "info");
    } catch (e) {
      showToast("Error permanently deleting member record.", "error");
    }
  };

  // Export & Print Actions
  const handleExportDataForMember = (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([JSON.stringify(member, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GymOS_Member_Telemetry_${member.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintInformation = (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Biometric Ledger - ${member.name}</title>
          <style>
            body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; color: #111; }
            .card { border: 2px solid #ccc; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; }
            h1 { margin-top: 0; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #555; }
            .val { font-mono: true; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>GymOS Member Telemetry Record</h1>
            <div class="field"><span class="label">Name:</span><span class="val">${member.name}</span></div>
            <div class="field"><span class="label">Phone Contact:</span><span class="val">${member.phone}</span></div>
            <div class="field"><span class="label">Email Address:</span><span class="val">${member.email}</span></div>
            <div class="field"><span class="label">Age / Gender:</span><span class="val">${member.age} yrs / ${member.gender}</span></div>
            <div class="field"><span class="label">Weight / Height:</span><span class="val">${member.weight}kg / ${member.height}cm</span></div>
            <div class="field"><span class="label">Current Plan:</span><span class="val">${member.membership_plan.toUpperCase()}</span></div>
            <div class="field"><span class="label">Expiry Date:</span><span class="val">${new Date(member.expiry_date).toLocaleDateString()}</span></div>
            <div class="field"><span class="label">Emergency Contact:</span><span class="val">${member.emergency_contact || 'N/A'}</span></div>
            <div class="field"><span class="label">Medical Precautions:</span><span class="val">${member.medical_notes || 'None noted'}</span></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // General report export
  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    const data = filteredMembers.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      plan: m.membership_plan.toUpperCase(),
      price: m.membership_price,
      joining_date: new Date(m.joining_date).toLocaleDateString(),
      expiry_date: new Date(m.expiry_date).toLocaleDateString(),
      status: m.status.toUpperCase()
    }));

    const columns = [
      { header: "ID", key: "id" },
      { header: "Member Name", key: "name" },
      { header: "Email Address", key: "email" },
      { header: "Phone Number", key: "phone" },
      { header: "Registered Plan", key: "plan" },
      { header: "Price Paid", key: "price" },
      { header: "Joining Date", key: "joining_date" },
      { header: "Expiry Date", key: "expiry_date" },
      { header: "Status", key: "status" }
    ];

    const fName = `GymOS_Members_Report_${new Date().toISOString().split("T")[0]}`;
    if (type === 'csv') exportToCSV(data, columns, fName);
    else if (type === 'excel') exportToExcel(data, columns, fName);
    else exportToPDF("GymOS Members Registry Directory", columns, data, fName);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col font-sans pb-16 lg:pb-0">
      
      {/* Dynamic Header toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white mb-2">Members Registry</h1>
          <p className="text-zinc-500 text-sm">Review biometric logging, execute renewals, and manage active vs archived portfolios.</p>
        </div>

        <div className="flex gap-3">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0C0C0E] border border-white/5 text-zinc-350 hover:text-white rounded-xl transition-all text-xs font-semibold cursor-pointer">
              <Download size={15} /> Export General Reports
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-[#0C0C0E] border border-white/10 rounded-xl overflow-hidden hidden group-hover:block shadow-2xl z-20">
              <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs transition-colors">Export CSV</button>
              <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs transition-colors">Export Excel</button>
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs transition-colors">Print PDF Directory</button>
            </div>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-xs rounded-xl text-white font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <Plus size={16} /> Enroll New Member
          </button>
        </div>
      </div>

      <div className="glass-card flex-1 flex flex-col overflow-hidden rounded-[24px] border border-white/5">
        
        {/* Filters and search toggles */}
        <div className="p-4 border-b border-zinc-800/40 flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#070708]/30">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
            <input 
              type="text" 
              placeholder="Search members by name, email, phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors font-sans focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-zinc-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 bg-[#0A0A0B] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
            >
              <option value="active_only">Active Registry</option>
              <option value="archived">Archived Members</option>
              <option value="active">Active Members Only</option>
              <option value="expiring_soon">Expiring Soon Only</option>
              <option value="expired">Expired Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="all">Every Account (incl. Archived)</option>
            </select>
          </div>
        </div>

        {/* 1. DESKTOP VIEW GRID TABLE */}
        <div className="hidden sm:block flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0A0A0B]/60 sticky top-0 z-10 backdrop-blur-md">
              <tr className="border-b border-zinc-800/40">
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Member Name</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Plan</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Price Rate</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Expiry Date</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Biometric Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/20">
              {filteredMembers.map((member, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.2) }}
                  key={member.id} 
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="hover:bg-zinc-800/10 transition-colors group cursor-pointer border-zinc-850"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-white/5 flex items-center justify-center text-zinc-300 overflow-hidden relative">
                        {member.profile_photo_url ? (
                          <img referrerPolicy="no-referrer" src={member.profile_photo_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-sm uppercase">{member.name.charAt(0)}</span>
                        )}
                        <div className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ${
                          member.status === 'active' ? 'bg-emerald-500' :
                          member.status === 'expiring_soon' ? 'bg-orange-500' :
                          member.status === 'suspended' ? 'bg-zinc-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">{member.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5 flex gap-2">
                          <span>{member.phone}</span>
                          <span>|</span>
                          <span className="lowercase line-clamp-1">{member.email || "No email"}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs text-zinc-200 capitalize font-medium">{member.membership_plan} Plan</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs text-emerald-400 font-bold font-mono">{formatCurrency(member.membership_price)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs text-zinc-400 font-mono font-medium">{formatDate(member.expiry_date)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold border tracking-wider
                      ${member.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        member.status === 'expiring_soon' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                        member.status === 'suspended' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
                        'bg-red-500/10 text-red-00 border-red-500/20'}
                    `}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2 text-zinc-500 group-hover:text-zinc-300" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => openEditModal(member, e)}
                        className="p-1.5 hover:text-blue-400 rounded-lg hover:bg-zinc-800/40 transition-colors"
                        title="Edit member biometrics"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={(e) => openRenewModal(member.id, e)}
                        className="p-1.5 hover:text-emerald-400 rounded-lg hover:bg-zinc-800/40 transition-colors"
                        title="Renew membership"
                      >
                        <Calendar size={13} />
                      </button>
                      <button 
                        onClick={(e) => openRecordModal(member.id, e)}
                        className="p-1.5 hover:text-purple-400 rounded-lg hover:bg-zinc-800/40 transition-colors"
                        title="Record extra checkout payment"
                      >
                        <CreditCard size={13} />
                      </button>
                      <button 
                        onClick={(e) => handleToggleSuspension(member, e)}
                        className="p-1.5 hover:text-orange-400 rounded-lg hover:bg-zinc-800/40 transition-colors"
                        title={member.status === 'suspended' ? "Reactivate member" : "Suspend member access"}
                      >
                        <ShieldAlert size={13} />
                      </button>
                      <button 
                        onClick={(e) => handleToggleArchival(member, e)}
                        className="p-1.5 hover:text-amber-400 rounded-lg hover:bg-zinc-800/40 transition-colors"
                        title={member.is_archived ? "Restore member profile" : "Archive member profile"}
                      >
                        <Archive size={13} />
                      </button>
                      <button 
                        onClick={(e) => handlePrintInformation(member, e)}
                        className="p-1.5 hover:text-white rounded-lg hover:bg-zinc-800/40 transition-colors"
                        title="Print telemetry profile information sheet"
                      >
                        <Printer size={13} />
                      </button>
                      <button 
                        onClick={(e) => triggerDeleteConfirm(member.id, e)}
                        className="p-1.5 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Wipe record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. MOBILE-FIRST CARD-BASED LAYOUT */}
        <div className="block sm:hidden flex-1 overflow-y-auto p-4 space-y-4">
          {filteredMembers.map((member) => (
            <div 
              key={member.id} 
              onClick={() => navigate(`/members/${member.id}`)}
              className="bg-[#0C0C0E] border border-white/5 rounded-2xl p-4 space-y-4 relative overflow-hidden shadow-lg hover:border-white/10 active:scale-[0.99] transition-all cursor-pointer"
            >
              {/* Photo, Name, and Status row */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/5 flex items-center justify-center text-sm font-bold text-white relative">
                  {member.profile_photo_url ? (
                    <img referrerPolicy="no-referrer" src={member.profile_photo_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{member.name.charAt(0)}</span>
                  )}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0c0c0e] ${
                    member.status === 'active' ? 'bg-emerald-500' :
                    member.status === 'expiring_soon' ? 'bg-orange-500' : 
                    member.status === 'suspended' ? 'bg-zinc-500' : 'bg-red-500'
                  }`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{member.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border font-mono ${
                      member.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                      member.status === 'expiring_soon' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 
                      member.status === 'suspended' ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/15' : 'bg-red-500/10 text-red-400 border border-red-550'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{member.email || "No email added"}</p>
                  
                  {/* Tap-to-call link contact phone details */}
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Phone: <a href={`tel:${member.phone}`} data-testid="phone-link" onClick={(e) => e.stopPropagation()} className="text-blue-400 font-bold hover:underline">{member.phone || "No phone added"}</a>
                  </p>
                </div>
              </div>

              {/* Package and expiry row details */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900/60 text-[10px]">
                <div className="bg-[#050506]/60 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-650 text-zinc-500 block uppercase font-bold tracking-wider text-[8px] mb-0.5">CONTRACT PLAN</span>
                  <span className="font-semibold text-zinc-300 capitalize">{member.membership_plan} Sub</span>
                </div>
                <div className="bg-[#050506]/60 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-650 text-zinc-500 block uppercase font-bold tracking-wider text-[8px] mb-0.5">EXPIRATION DATE</span>
                  <span className="font-semibold text-zinc-300 font-mono">{formatDate(member.expiry_date)}</span>
                </div>
              </div>

              {/* Mobile Quick Tap buttons */}
              <div className="flex flex-wrap gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => openEditModal(member, e)}
                  className="flex-1 py-2 text-[10px] bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white rounded-xl font-bold flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <Edit2 size={11} /> Edit
                </button>
                <button
                  onClick={(e) => openRenewModal(member.id, e)}
                  className="flex-1 py-2 text-[10px] bg-[#1a2e26] border border-emerald-500/10 text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <Calendar size={11} /> Renew
                </button>
                <button
                  onClick={(e) => openRecordModal(member.id, e)}
                  className="flex-1 py-2 text-[10px] bg-zinc-905 bg-[#171424] border border-blue-500/10 text-blue-400 rounded-xl font-bold flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <CreditCard size={11} /> Pay
                </button>
                <button
                  onClick={(e) => handleToggleSuspension(member, e)}
                  className={`flex-1 py-2 text-[10px] rounded-xl font-bold flex items-center justify-center gap-1 min-h-[44px] border ${
                    member.status === 'suspended'
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-[#291712] border-orange-500/10 text-orange-400"
                  }`}
                >
                  <ShieldAlert size={11} /> {member.status === 'suspended' ? "Active" : "Suspend"}
                </button>
                <button
                  onClick={(e) => handleToggleArchival(member, e)}
                  className="p-2.5 text-[10px] bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl font-bold hover:text-white min-h-[44px]"
                  title="Archive/Restore"
                >
                  <Archive size={12} />
                </button>
                <button
                  onClick={(e) => handlePrintInformation(member, e)}
                  className="p-2.5 text-[10px] bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl font-bold hover:text-white min-h-[44px]"
                  title="Print Slip"
                >
                  <Printer size={12} />
                </button>
                <button
                  onClick={(e) => triggerDeleteConfirm(member.id, e)}
                  className="p-2.5 text-[10px] bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/25 min-h-[44px]"
                  title="Wipe Profile"
                >
                  <Trash2 size={12} />
                </button>
              </div>

            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
              <Search size={22} className="text-zinc-500" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">No matching members found</h3>
            <p className="text-xs text-zinc-500">Try modifying spelling query tags or status filters.</p>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* LOCAL OPERATIONS POPUP OVERLAYS                         */}
      {/* ======================================================== */}
      <AnimatePresence>
        
        {/* ADD MEMBER OVERLAY */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-55 overflow-y-auto pt-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl relative p-6 sm:p-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCircle className="text-blue-500" size={20} /> Onboard New Member
                </h2>
                <button 
                  onClick={() => { setIsAddModalOpen(false); setPhoto(''); }}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                
                {/* Photo upload frame */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Member Profile Photo</label>
                  <PhotoUpload value={photo} onChange={(b64) => setPhoto(b64)} onClear={() => setPhoto('')} />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text" required placeholder="e.g. Liam Lawson"
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email address</label>
                    <input
                      type="email" required placeholder="e.g. liam@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                    <input
                      type="text" required placeholder="e.g. +1 555-0391"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Age</label>
                    <input
                      type="number" value={age} onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Height (cm)</label>
                    <input
                      type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Weight (kg)</label>
                    <input
                      type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Package Plan</label>
                    <select
                      value={plan} onChange={(e) => setPlan(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-2 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="monthly">Monthly Subscription</option>
                      <option value="quarterly">Quarterly Plan Pro</option>
                      <option value="yearly">Yearly VIP Unlimited</option>
                      <option value="custom">Custom Plan ★</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Fee Rate ({getCurrencySymbol(settings?.default_currency)})</label>
                    <input
                      type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {plan === 'custom' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/5 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Custom Plan Name Presets</label>
                      <input
                        type="text"
                        list="custom-plan-presets"
                        placeholder="e.g. 15-Day Trial"
                        value={customPlanName}
                        onChange={(e) => setCustomPlanName(e.target.value)}
                        className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <datalist id="custom-plan-presets">
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

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Supplementary bio notes</label>
                  <textarea
                    rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Physical specifications, knee injuries, target weight..."
                    className="w-full bg-[#050506] border border-white/5 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-xs text-zinc-300"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button" onClick={() => { setIsAddModalOpen(false); setPhoto(''); }}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl hover:text-white"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> Approved & Active
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT MEMBER BIOMETRICS OVERLAY */}
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
                  <Edit2 className="text-blue-500" size={18} /> Edit Enrollee Biometrics
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
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Member Profile Photo</label>
                  <PhotoUpload value={photo} onChange={(b64) => setPhoto(b64)} onClear={() => setPhoto('')} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none"
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
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Phone Contact</label>
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
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Emergency Contact Details</label>
                    <input
                      type="text" required value={emergency} onChange={(e) => setEmergency(e.target.value)}
                      placeholder="Name & emergency phone number"
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-sans">Home physical Address</label>
                    <input
                      type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                      placeholder="Physical registered street address"
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Medical / Health caveats</label>
                  <input
                    type="text" value={medical} onChange={(e) => setMedical(e.target.value)}
                    placeholder="Asthma, spinal considerations, dietary needs..."
                    className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">General bio instructions notes</label>
                  <textarea
                    rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl p-3 focus:outline-none text-xs text-zinc-300"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button" onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl"
                  >
                    Save modifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* RENEW MEMBERSHIP OVERLAY */}
        {isRenewModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-55">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[32px] max-w-md w-full p-8 shadow-2xl relative"
            >
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="text-emerald-500" size={18} /> Renew Subscription Package
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
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Override Price fee ({getCurrencySymbol(settings?.default_currency)})</label>
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
                        list="renew-plan-presets"
                        placeholder="e.g. 90-Day Challenge"
                        value={renewCustomPlanName}
                        onChange={(e) => setRenewCustomPlanName(e.target.value)}
                        className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <datalist id="renew-plan-presets">
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

                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[11px] text-zinc-500 leading-relaxed font-sans">
                  The system will calculate the package expiry dates based on current contract status (extending if active, setting active from today if expired).
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button" onClick={() => setIsRenewModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl hover:text-white"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> Clear Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* RECORD PAYMENT OVERLAY */}
        {isRecordModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-55">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[32px] max-w-md w-full p-8 shadow-2xl relative"
            >
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="text-blue-500" size={18} /> Record checkout Settlement
              </h3>

              <form onSubmit={handleRecordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Collected Amount ({getCurrencySymbol(settings?.default_currency)})</label>
                  <input
                    type="number" required placeholder="e.g. 50"
                    value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full bg-[#050506] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Method</label>
                    <select
                      value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-2 py-3 text-xs text-zinc-200 focus:outline-none font-semibold"
                    >
                      <option value="Cash">Cash Handover</option>
                      <option value="Card">Visa Terminal</option>
                      <option value="UPI">UPI instant transfer</option>
                      <option value="Bank Transfer">Direct Wire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-sans">purpose</label>
                    <select
                      value={paymentPurpose} onChange={(e) => setPaymentPurpose(e.target.value)}
                      className="w-full bg-[#050506] border border-white/5 rounded-xl px-2 py-3 text-xs text-zinc-200 focus:outline-none font-semibold"
                    >
                      <option value="monthly">Monthly Contract Fee</option>
                      <option value="personal_training">Personal Trainer session</option>
                      <option value="registration">Admission lockers fee</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button" onClick={() => setIsRecordModalOpen(false)}
                    className="flex-1 py-3 text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl"
                  >
                    Log transaction
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* DOUBLE-SAFE PERMANENT DELETE WARNING MODAL */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-55">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C0E] border border-red-500/20 rounded-[32px] max-w-sm w-full p-8 shadow-2xl relative font-sans text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert size={28} />
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">Permanent wipe Confirmation</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">Are you sure you want to permanently delete this member? This action cannot be undone.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button" onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 py-2.5 text-xs bg-zinc-900 border border-white/5 text-zinc-405 text-zinc-400 rounded-xl hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button" onClick={handlePermanentDelete}
                  className="flex-1 py-2.5 text-xs bg-red-500 hover:bg-red-655 bg-red-600 text-white font-bold rounded-xl"
                >
                  Yes, Force Wipe
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
}
