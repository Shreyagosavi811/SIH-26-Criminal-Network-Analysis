import React, { useState, useEffect } from 'react';
import { useInvestigation } from '../../context/InvestigationContext.jsx';
import { mockFIRDetails } from '../../data/mockFIRs.js';
import { 
  X, 
  Edit3, 
  Shield, 
  Sparkles, 
  Scale, 
  MapPin, 
  FileText, 
  Hash, 
  RefreshCw, 
  Check, 
  ShieldCheck, 
  User, 
  IndianRupee, 
  Trash2, 
  Save, 
  CheckCircle 
} from 'lucide-react';

export const STATUTORY_ACTS_OPTIONS = [
  'IPC 384 / BNS 308 (Extortion)',
  'IPC 386 / BNS 308 (Extortion by Threat)',
  'IPC 420 / BNS 318 (Cheating & Fraud)',
  'IPC 120B / BNS 61 (Criminal Conspiracy)',
  'IPC 302 / BNS 103 (Murder)',
  'IPC 307 / BNS 109 (Attempt to Murder)',
  'NDPS Sec 8/20/29 (Commercial Drug Cartel)',
  'IT Act Sec 66C/66D (Cyber Identity Theft)',
  'Arms Act Sec 25/27 (Illegal Firearms)',
  'PMLA Sec 3/4 (Money Laundering)'
];

export const FIR_PRESETS = [
  {
    label: '🚨 Armed Extortion',
    id: 'FIR-558',
    title: 'Syndicate Armed Extortion & Protection Pipeline',
    category: 'Robbery & Extortion',
    priority: 'HIGH',
    district: 'Maharashtra (Mumbai South)',
    policeStation: 'Crime Branch Unit IX, Bandra',
    acts: ['IPC 384 / BNS 308 (Extortion)', 'IPC 386 / BNS 308 (Extortion by Threat)', 'IPC 120B / BNS 61 (Criminal Conspiracy)', 'Arms Act Sec 25/27 (Illegal Firearms)'],
    complainant: 'Sunil R. Varma',
    complainantFather: 'Rameshwar Varma',
    complainantPhone: '+91 98201 84920',
    place: 'Commercial Complex, Linking Road, Bandra West, Mumbai',
    suspect: 'Vikramaditya Deshmukh (Alias: Vicky Bhai)',
    value: '₹15,00,000',
    narrative: 'Complainant reports that on 04-Sep-2026 at 19:30 hrs, two armed operatives associated with Vikramaditya Deshmukh entered his office premises and demanded protection money of ₹15,00,000 under threat of lethal violence against his family.'
  },
  {
    label: '💊 NDPS Seizure',
    id: 'FIR-104',
    title: 'Inter-State Narcotics Trafficking & Hawala Conduit',
    category: 'Narcotics',
    priority: 'CRITICAL',
    district: 'Maharashtra (Mumbai South)',
    policeStation: 'Anti-Narcotics Cell, Azad Maidan',
    acts: ['NDPS Sec 8/20/29 (Commercial Drug Cartel)', 'PMLA Sec 3/4 (Money Laundering)', 'IPC 120B / BNS 61 (Criminal Conspiracy)'],
    complainant: 'Inspector Sharma (Suo Moto Seizure)',
    complainantFather: 'Govt. of Maharashtra / CID Record',
    complainantPhone: '+91 22 2262 0111',
    place: 'Dock Terminal 4, Nhava Sheva Freight CFS, Mumbai',
    suspect: 'Tariq "Phantom" Merchant',
    value: '₹4,80,00,000',
    narrative: 'Intelligence-led interdiction conducted at Nhava Sheva freight container CFS resulted in physical recovery of 42.5 kg high-grade contraband concealed inside marble tile export consignments consigned to shell entity Falcon Import Corp.'
  },
  {
    label: '💻 Cyber Ransomware',
    id: 'FIR-721',
    title: 'Critical Infrastructure Ransomware Attack & Extortion',
    category: 'Cyber Crime',
    priority: 'HIGH',
    district: 'Maharashtra (Mumbai Suburban)',
    policeStation: 'Cyber Police Station, BKC Mumbai',
    acts: ['IT Act Sec 66C/66D (Cyber Identity Theft)', 'IPC 420 / BNS 318 (Cheating & Fraud)', 'IPC 384 / BNS 308 (Extortion)'],
    complainant: 'Dr. Arvind Menon (Chief InfoSec Officer)',
    complainantFather: 'K. P. Menon',
    complainantPhone: '+91 97112 34509',
    place: 'FinTech Tower B, BKC Cyber Hub, Bandra East, Mumbai',
    suspect: 'Alexey "Cipher" Voronin',
    value: '₹85,00,000',
    narrative: 'On 02-Sep-2026 at 03:15 IST, corporate cloud server clusters suffered unauthorized AES-256 payload encryption accompanied by a .onion ransom notice demanding 10.5 BTC to restore healthcare database accessibility.'
  },
  {
    label: '💼 Hawala Laundering',
    id: 'FIR-309',
    title: 'Cross-Border Hawala Financing & Money Laundering',
    category: 'Money Laundering',
    priority: 'CRITICAL',
    district: 'Maharashtra (Mumbai South)',
    policeStation: 'Economic Offences Wing (EOW), Mumbai',
    acts: ['PMLA Sec 3/4 (Money Laundering)', 'IPC 420 / BNS 318 (Cheating & Fraud)', 'IPC 120B / BNS 61 (Criminal Conspiracy)'],
    complainant: 'Intelligence Officer K. Deshmukh (EOW)',
    complainantFather: 'On Departmental Record',
    complainantPhone: '+91 22 2261 4433',
    place: 'Zaveri Bazaar Bullion Vaults, Kalbadevi, Mumbai',
    suspect: 'Harish "Angadia" Patel',
    value: '₹2,40,00,000',
    narrative: 'Surveillance raid intercepted two courier angadias transporting unaccounted bearer currency tokens and encrypted token chits tied to offshore syndicate money laundering operations.'
  }
];

export function FIRFormModal({ isEdit, modalData, closeModal }) {
  const { registerFIR, updateFIR, deleteFIR, navigate, currentUser, cases, showToast } = useInvestigation();

  const existingFir = isEdit ? (mockFIRDetails[modalData?.firId] || (cases || []).find(c => c.id === modalData?.firId)) : null;

  const [activeTab, setActiveTab] = useState('core'); // 'core', 'jurisdiction', 'statement'
  const [firId, setFirId] = useState(isEdit ? (modalData?.firId || existingFir?.id || '') : `FIR-${Math.floor(200 + Math.random() * 790)}`);
  const [firTitle, setFirTitle] = useState(isEdit ? (existingFir?.title || (modalData?.firId ? `${modalData.firId} Investigation` : '')) : '');
  const [firCategory, setFirCategory] = useState(isEdit ? (existingFir?.category || 'Robbery & Extortion') : 'Robbery & Extortion');
  const [firPriority, setFirPriority] = useState(isEdit ? (existingFir?.priority || 'HIGH') : 'HIGH');
  const [firStatus, setFirStatus] = useState(isEdit ? (existingFir?.status || 'ACTIVE') : 'ACTIVE');
  const [selectedActs, setSelectedActs] = useState(isEdit ? (existingFir?.actsAndSections?.[0]?.sections ? existingFir.actsAndSections[0].sections.split(', ') : ['IPC 384 / BNS 308 (Extortion)', 'IPC 120B / BNS 61 (Criminal Conspiracy)']) : ['IPC 384 / BNS 308 (Extortion)', 'IPC 120B / BNS 61 (Criminal Conspiracy)']);
  
  const [firDistrict, setFirDistrict] = useState(isEdit ? (existingFir?.district || 'Maharashtra (Mumbai South)') : 'Maharashtra (Mumbai South)');
  const [firStation, setFirStation] = useState(isEdit ? (existingFir?.policeStation || 'Crime Branch Unit IX, Bandra') : 'Crime Branch Unit IX, Bandra');
  const [firOfficer, setFirOfficer] = useState(isEdit ? (existingFir?.assignedTo || existingFir?.investigatingOfficer?.name || currentUser?.name) : (currentUser?.name || 'Inspector Sharma'));
  const [firComplainant, setFirComplainant] = useState(isEdit ? (existingFir?.complainant?.name || '') : '');
  const [firComplainantFather, setFirComplainantFather] = useState(isEdit ? (existingFir?.complainant?.fatherOrHusbandName || '') : '');
  const [firComplainantPhone, setFirComplainantPhone] = useState(isEdit ? (existingFir?.complainant?.phone || '') : '');
  const [firPlace, setFirPlace] = useState(isEdit ? (existingFir?.placeOfOccurrence?.address || '') : '');
  
  const [firSuspect, setFirSuspect] = useState(isEdit ? (existingFir?.accusedList?.[0]?.name || existingFir?.suspectName || '') : '');
  const [firPropertyValue, setFirPropertyValue] = useState(isEdit ? (existingFir?.totalPropertyValue || '') : '');
  const [firDescription, setFirDescription] = useState(isEdit ? (existingFir?.firstInformationContents || existingFir?.description || '') : '');
  const [autoOpenTarget, setAutoOpenTarget] = useState('fir');

  useEffect(() => {
    if (isEdit && modalData?.firId) {
      const target = mockFIRDetails[modalData.firId] || (cases || []).find(c => c.id === modalData.firId);
      if (target) {
        setFirId(target.id || modalData.firId);
        setFirTitle(target.title || target.firstInformationContents?.substring(0, 40) || '');
        setFirCategory(target.category || 'Robbery & Extortion');
        setFirPriority(target.priority || 'HIGH');
        setFirStatus(target.status || 'ACTIVE');
        setFirDistrict(target.district || 'Maharashtra (Mumbai South)');
        setFirStation(target.policeStation || 'Crime Branch Unit IX, Bandra');
        setFirOfficer(target.assignedTo || target.investigatingOfficer?.name || currentUser?.name);
        setFirComplainant(target.complainant?.name || '');
        setFirComplainantFather(target.complainant?.fatherOrHusbandName || '');
        setFirComplainantPhone(target.complainant?.phone || '');
        setFirPlace(target.placeOfOccurrence?.address || '');
        setFirSuspect(target.accusedList?.[0]?.name || target.suspectName || '');
        setFirPropertyValue(target.totalPropertyValue || '');
        setFirDescription(target.firstInformationContents || target.description || '');
        if (target.actsAndSections?.[0]?.sections) {
          setSelectedActs(target.actsAndSections[0].sections.split(', '));
        }
      }
    }
  }, [isEdit, modalData, cases, currentUser]);

  const loadPreset = (preset) => {
    if (!isEdit) setFirId(preset.id);
    setFirTitle(preset.title);
    setFirCategory(preset.category);
    setFirPriority(preset.priority);
    setFirDistrict(preset.district);
    setFirStation(preset.policeStation);
    setSelectedActs(preset.acts);
    setFirComplainant(preset.complainant);
    setFirComplainantFather(preset.complainantFather);
    setFirComplainantPhone(preset.complainantPhone);
    setFirPlace(preset.place);
    setFirSuspect(preset.suspect);
    setFirPropertyValue(preset.value);
    setFirDescription(preset.narrative);
    showToast(`Loaded "${preset.label}" statutory preset`, 'info');
  };

  const toggleAct = (act) => {
    if (selectedActs.includes(act)) {
      setSelectedActs(selectedActs.filter(a => a !== act));
    } else {
      setSelectedActs([...selectedActs, act]);
    }
  };

  const handleAIEnhance = () => {
    if (!firDescription) {
      setFirDescription(`Complainant ${firComplainant || 'on record'} approached this station stating that on ${new Date().toLocaleDateString('en-GB')} at ${firPlace || 'jurisdiction location'}, the named accused ${firSuspect || 'accused persons'} engaged in organized criminal activities causing wrongful loss amounting to ${firPropertyValue || 'statutory quantum'}. Formal inquiry initiated under Cr.P.C. Sec 154.`);
    } else {
      setFirDescription(prev => `[STATUTORY FORMULATION - Cr.P.C. Sec 154 / BNSS Sec 173]: ${prev.trim()} - Recorded under official supervision. First Information Report contents verified.`);
    }
    showToast('AI enhanced statutory narrative format', 'success');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const firPayload = {
      id: firId.toUpperCase().trim(),
      title: firTitle.trim() || `${firId.toUpperCase().trim()} Investigation`,
      category: firCategory,
      priority: firPriority,
      status: firStatus,
      district: firDistrict,
      policeStation: firStation || `${firDistrict} Police Station / Crime Branch`,
      assignedTo: firOfficer,
      acts: selectedActs.join(', '),
      actsAndSections: [{ act: 'Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023', sections: selectedActs.join(', ') }],
      complainantName: firComplainant.trim() || 'Confidential Complainant',
      complainantFather: firComplainantFather.trim() || 'On Official Record',
      phone: firComplainantPhone.trim() || '+91 98201 00000',
      place: firPlace.trim() || 'Jurisdiction Area',
      suspectName: firSuspect.trim() || 'Unidentified Suspect',
      propertyValue: firPropertyValue.trim() || '₹0',
      description: firDescription.trim() || 'First Information Report lodged under statutory police protocols.'
    };

    if (isEdit) {
      updateFIR(firPayload.id, firPayload);
    } else {
      registerFIR(firPayload);
      if (autoOpenTarget === 'fir') {
        navigate('fir', { caseId: firPayload.id });
      } else {
        navigate('overview', { caseId: firPayload.id });
      }
    }

    closeModal();
  };

  return (
    <div className="flex flex-col h-full max-h-[88vh] font-sans">
      {/* Modal Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold text-sm shadow-inner">
            {isEdit ? <Edit3 className="w-5 h-5 text-amber-400" /> : <Shield className="w-5 h-5 text-blue-400" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base tracking-tight">
                {isEdit ? `Edit Statutory FIR: ${firId}` : 'Register Statutory FIR (Form No. II)'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                CCTNS Standard
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
              <span>Cr.P.C. Sec 154</span>
              <span>•</span>
              <span>BNSS Sec 173</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Live Judicial Compliance</span>
            </p>
          </div>
        </div>

        <button 
          onClick={closeModal} 
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preset Templates Bar (Register Mode) */}
      {!isEdit && (
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <div className="flex items-center space-x-1.5 text-slate-600 font-semibold shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] uppercase tracking-wider">Quick Presets:</span>
          </div>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
            {FIR_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-slate-700 font-medium text-[11px] transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stepped Tab Navigator */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-5 pt-2 flex space-x-1 shrink-0">
        {[
          { id: 'core', label: '1. Incident & Penal Acts', icon: Scale },
          { id: 'jurisdiction', label: '2. Jurisdiction & Informant', icon: MapPin },
          { id: 'statement', label: '3. Accused, Quantum & Narrative', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2.5 px-3.5 border-b-2 font-semibold text-xs transition-all cursor-pointer ${
                isActive 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Form Content */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* TAB 1: Core Incident & Penal Acts */}
        {activeTab === 'core' && (
          <div className="space-y-4 animate-scale-up">
            {/* Row 1: FIR Number & Subject Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>FIR Number</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    disabled={isEdit}
                    value={firId}
                    onChange={(e) => setFirId(e.target.value)}
                    placeholder="e.g. FIR-558"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => setFirId(`FIR-${Math.floor(200 + Math.random() * 790)}`)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-blue-600 p-0.5"
                      title="Generate new ID"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Crime Title / Subject</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={firTitle}
                  onChange={(e) => setFirTitle(e.target.value)}
                  placeholder="e.g. Syndicate Armed Extortion & Hawala Pipeline"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Row 2: Category, Priority, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select 
                  value={firCategory} 
                  onChange={(e) => setFirCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="Robbery & Extortion">Robbery & Extortion</option>
                  <option value="Narcotics">Narcotics (NDPS)</option>
                  <option value="Cyber Crime">Cyber Crime (IT Act)</option>
                  <option value="Money Laundering">Money Laundering (PMLA)</option>
                  <option value="Organized Crime">Organized Crime (MCOCA)</option>
                  <option value="Homicide & Violent Crime">Homicide & Violent Crime</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Investigation Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CRITICAL', label: '🔴 CRITICAL', color: 'border-rose-300 bg-rose-50 text-rose-800' },
                    { id: 'HIGH', label: '🟠 HIGH', color: 'border-amber-300 bg-amber-50 text-amber-800' },
                    { id: 'MEDIUM', label: '🟡 MEDIUM', color: 'border-slate-300 bg-slate-50 text-slate-800' }
                  ].map(p => {
                    const isSelected = firPriority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFirPriority(p.id)}
                        className={`py-2 px-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          isSelected 
                            ? `${p.color} ring-2 ring-blue-500 shadow-xs font-black` 
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 3: Statutory Acts & Sections Multi-Selector */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-tight">
                    Statutory Penal Acts & Sections (IPC / BNS / Special Acts)
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  {selectedActs.length} Selected
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {STATUTORY_ACTS_OPTIONS.map((act) => {
                  const isChecked = selectedActs.includes(act);
                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => toggleAct(act)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                        isChecked 
                          ? 'bg-blue-600 text-white shadow-xs font-semibold' 
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                      <span>{act}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Jurisdiction & Informant Particulars */}
        {activeTab === 'jurisdiction' && (
          <div className="space-y-4 animate-scale-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Jurisdiction District</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={firDistrict}
                  onChange={(e) => setFirDistrict(e.target.value)}
                  placeholder="e.g. Maharashtra (Mumbai South)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Police Station / Crime Branch Unit</span>
                </label>
                <input 
                  type="text" 
                  value={firStation}
                  onChange={(e) => setFirStation(e.target.value)}
                  placeholder="e.g. Crime Branch Unit IX, Bandra"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Investigating Officer (I.O.)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={firOfficer}
                  onChange={(e) => setFirOfficer(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Exact Place of Occurrence</span>
                </label>
                <input 
                  type="text" 
                  value={firPlace}
                  onChange={(e) => setFirPlace(e.target.value)}
                  placeholder="e.g. Linking Road, Bandra West, Mumbai"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Complainant Particulars Card */}
            <div className="p-4 bg-gradient-to-b from-blue-50/70 to-blue-50/30 border border-blue-200/90 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs uppercase tracking-tight">
                  <User className="w-3.5 h-3.5 text-blue-700" />
                  <span>Complainant / Informant Particulars (Section 154 Cr.P.C.)</span>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Identity Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Full Legal Name"
                    value={firComplainant}
                    onChange={(e) => setFirComplainant(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Father's / Spouse's Name</label>
                  <input 
                    type="text" 
                    placeholder="Father's / Husband's Name"
                    value={firComplainantFather}
                    onChange={(e) => setFirComplainantFather(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Contact Phone</label>
                  <input 
                    type="text" 
                    placeholder="+91 98201 00000"
                    value={firComplainantPhone}
                    onChange={(e) => setFirComplainantPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Accused, Quantum & Narrative */}
        {activeTab === 'statement' && (
          <div className="space-y-4 animate-scale-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-rose-500" />
                  <span>Named Accused / Primary Suspect</span>
                </label>
                <input 
                  type="text" 
                  value={firSuspect}
                  onChange={(e) => setFirSuspect(e.target.value)}
                  placeholder="e.g. Vikramaditya Deshmukh (Alias: Vicky Bhai)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Estimated Property / Extortion Quantum (₹)</span>
                </label>
                <input 
                  type="text" 
                  value={firPropertyValue}
                  onChange={(e) => setFirPropertyValue(e.target.value)}
                  placeholder="e.g. ₹15,00,000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-emerald-800 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Narrative Box with AI Enhancer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Verbatim First Information Narrative (Form No. II Content)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAIEnhance}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>AI Statutory Polisher</span>
                </button>
              </div>

              <textarea 
                rows={4}
                required
                value={firDescription}
                onChange={(e) => setFirDescription(e.target.value)}
                placeholder="Official recorded statement of the complainant under statutory Cr.P.C. Sec 154 / BNSS Sec 173 protocols..."
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-2xl p-3 text-slate-900 font-medium text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            {isEdit && (
              <button 
                type="button" 
                onClick={() => {
                  if (confirm(`Are you sure you want to archive/remove FIR ${firId}?`)) {
                    deleteFIR(firId);
                    closeModal();
                  }
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive FIR</span>
              </button>
            )}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">CCTNS 2026 Compliant • Form II</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              type="button" 
              onClick={closeModal} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`px-5 py-2 ${
                isEdit 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer`}
            >
              {isEdit ? <Save className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span>{isEdit ? 'Save & Update FIR' : 'Register Form II FIR'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default FIRFormModal;
