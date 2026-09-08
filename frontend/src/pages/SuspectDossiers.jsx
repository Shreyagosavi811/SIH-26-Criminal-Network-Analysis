import React, { useState } from 'react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { mockAudioTranscriptLog } from '../data/mockData.js';
import SuspectDossierModal from '../components/suspects/SuspectDossierModal.jsx';
import BiometricScanModal from '../components/suspects/BiometricScanModal.jsx';
import { 
  Fingerprint, 
  Activity, 
  LayoutTemplate, 
  Bot, 
  Users, 
  Shield, 
  Radio, 
  Play,
  Pause,
  Volume2, 
  Edit3, 
  Plus, 
  Trash2, 
  Scan, 
  Save, 
  X, 
  Search, 
  Filter, 
  Dna, 
  Camera,
  CheckCircle2,
  AlertTriangle,
  History,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

const getRiskStyle = (rating) => {
  const r = rating?.toUpperCase() || 'LOW';
  if (r === 'HIGH' || r === 'CRITICAL') return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-600', Icon: AlertTriangle };
  if (r === 'MEDIUM' || r === 'MODERATE') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600', Icon: AlertCircle };
  return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', icon: 'text-slate-500', Icon: ShieldCheck };
};

export function SuspectDossiers() {
  const { 
    suspectDossiers,
    selectedSuspectDossier, 
    selectSuspectDossier, 
    addSuspectDossier,
    updateSuspectDossier,
    deleteSuspectDossier,
    addBiometricRecord,
    addToCanvas, 
    askAI, 
    showToast,
    backendStatus,
    backendSuspects
  } = useInvestigation();

  // PHASE 2E: Toggle real data when backend is online
  const isBackendActive = backendStatus?.online && backendSuspects;
  const dossiers = isBackendActive ? backendSuspects : (suspectDossiers || []);
  const activeDossier = dossiers.find(d => d.id === selectedSuspectDossier?.id) || dossiers[0] || {};

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [squadFilter, setSquadFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal & Audio States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBiometricScanModalOpen, setIsBiometricScanModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
    gender: 'MALE',
    dob: '1990-01-01',
    height: '175 cm',
    nationality: 'INDIAN',
    career: 'CYBER EXTORTION',
    squad: 'ALPHA-9',
    status: 'ACTIVE TARGET',
    trackCode: 'TRK-9901-X',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    bpm: 98,
    dnaMatch: '99.4%',
    riskRating: 'HIGH',
    recentOp: 'MULE TRANSFER & ENCRYPTED COMMS',
    fingerprintPattern: 'WHORL / AFIS-MATCH',
    irisScore: '98.7%',
    facialConfidence: '96.2%'
  });

  // Biometric Scan Form State
  const [scanForm, setScanForm] = useState({
    type: 'Fingerprint AFIS Scan',
    scannerId: 'NAFIS-POLICE-TERMINAL-01',
    matchScore: '99.6%',
    bpm: 104,
    status: 'MATCH VERIFIED',
    fingerprintPattern: 'WHORL (PRIMARY RIGHT INDEX)',
    dnaMatch: '99.8%',
    irisScore: '98.9%'
  });

  // Avatar presets for quick selection
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'
  ];

  // Open Edit Modal with active dossier data
  const handleOpenEdit = (dossier = activeDossier) => {
    setFormData({
      id: dossier.id || '',
      name: dossier.name || '',
      code: dossier.code || '',
      gender: dossier.gender || 'MALE',
      dob: dossier.dob || '1990-01-01',
      height: dossier.height || '175 cm',
      nationality: dossier.nationality || 'INDIAN',
      career: dossier.career || 'CYBER EXTORTION',
      squad: dossier.squad || 'ALPHA-9',
      status: dossier.status || 'ACTIVE TARGET',
      trackCode: dossier.trackCode || 'TRK-9901-X',
      photo: dossier.photo || avatarPresets[0],
      bpm: dossier.bpm || 95,
      dnaMatch: dossier.dnaMatch || '98.5%',
      riskRating: dossier.riskRating || 'HIGH',
      recentOp: dossier.recentOp || '',
      fingerprintPattern: dossier.fingerprintPattern || 'WHORL / AFIS-MATCH',
      irisScore: dossier.irisScore || '98.2%',
      facialConfidence: dossier.facialConfidence || '95.5%'
    });
    setIsEditModalOpen(true);
  };

  // Open Create Modal with clean template
  const handleOpenCreate = () => {
    const nextNum = dossiers.length + 1;
    setFormData({
      id: `OP-442-0${nextNum}`,
      name: '',
      code: `TAC-${Math.floor(10000 + Math.random() * 90000)}`,
      gender: 'MALE',
      dob: '1992-06-15',
      height: '178 cm',
      nationality: 'INDIAN',
      career: 'FINANCIAL HAWALA / BOTNET',
      squad: 'ALPHA-9',
      status: 'ACTIVE TARGET',
      trackCode: `TRK-${Math.floor(1000 + Math.random() * 9000)}-X`,
      photo: avatarPresets[Math.floor(Math.random() * avatarPresets.length)],
      bpm: 92,
      dnaMatch: '98.7%',
      riskRating: 'HIGH',
      recentOp: 'CROSS-BORDER ILLICIT COMMUNICATIONS',
      fingerprintPattern: 'CENTRAL LOOP / NAFIS-KEY',
      irisScore: '97.9%',
      facialConfidence: '96.0%'
    });
    setIsCreateModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveDossier = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Suspect name cannot be empty', 'error');
      return;
    }

    if (isEditModalOpen) {
      updateSuspectDossier(formData.id, formData);
      setIsEditModalOpen(false);
    } else {
      addSuspectDossier(formData);
      setIsCreateModalOpen(false);
    }
  };

  // Handle Adding New Biometric Scan
  const handleSaveBiometricScan = (e) => {
    e.preventDefault();
    if (!activeDossier.id) return;
    
    addBiometricRecord(activeDossier.id, scanForm);
    setIsBiometricScanModalOpen(false);
  };

  // Filtered Roster
  const filteredDossiers = dossiers.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.id && d.id.toLowerCase().includes(q)) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.career && d.career.toLowerCase().includes(q)) ||
      (d.nationality && d.nationality.toLowerCase().includes(q));

    const matchesSquad = squadFilter === 'ALL' || d.squad === squadFilter;
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;

    return matchesSearch && matchesSquad && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-800 font-sans max-w-7xl mx-auto select-none">
      
      {/* ============================================================ */}
      {/* 1. TACTICAL COMMAND HEADER & CRUD ACTIONS                    */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border border-blue-100 rounded-3xl p-6 md:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-500/20">
            <Fingerprint className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Suspect Dossiers & Biometrics Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                AFIS • NAFIS Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live biometric verification, AFIS fingerprints, DNA telemetry, and real-time dossier records management.
            </p>
          </div>
        </div>

        {/* Action Buttons: Register New Dossier & Add Biometric Record */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setIsBiometricScanModalOpen(true)}
            className="btn-secondary"
          >
            <Scan className="w-3.5 h-3.5 text-slate-600" />
            <span>New Biometric Scan</span>
          </button>

          <button 
            onClick={handleOpenCreate}
            className="btn-accent"
          >
            <Plus className="w-4 h-4" />
            <span>Register Suspect</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SEARCH & SQUAD FILTER BAR                                 */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full md:w-80 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search by name, ID, code, career..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500 font-medium">Squad:</span>
            <select 
              value={squadFilter}
              onChange={(e) => setSquadFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL SQUADS</option>
              <option value="ALPHA-9">ALPHA-9</option>
              <option value="BRAVO-3">BRAVO-3</option>
              <option value="DELTA-1">DELTA-1</option>
              <option value="CYBER-CELL">CYBER-CELL</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-500 font-medium">Status:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="ACTIVE TARGET">ACTIVE TARGET</option>
              <option value="UNDER SURVEILLANCE">SURVEILLANCE</option>
              <option value="IN CUSTODY">IN CUSTODY</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-semibold px-2">
            Showing <span className="text-blue-600 font-bold">{filteredDossiers.length}</span> of {dossiers.length} Records
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN TACTICAL WORKSPACE GRID                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ------------------------------------------------------------ */}
        {/* LEFT COLUMN: ACTIVE SUSPECT DETAILED BIOMETRIC DOSSIER (5)   */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-xs relative overflow-hidden">
          
          {/* Top Banner with Edit & Delete Actions */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] px-3 py-1 uppercase rounded-full tracking-wider">
              TARGET: {activeDossier.id || 'N/A'}
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenEdit(activeDossier)}
                className="px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                title="Edit this suspect record"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Dossier</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${activeDossier.name} (${activeDossier.id}) from the biometric database?`)) {
                    deleteSuspectDossier(activeDossier.id);
                  }
                }}
                className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                title="Delete dossier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suspect Photo & Demographics Header */}
          <div className="flex items-start space-x-4">
            <div className="relative shrink-0">
              <img 
                src={activeDossier.photo || avatarPresets[0]} 
                alt={activeDossier.name}
                className="w-24 h-28 sm:w-28 sm:h-32 object-cover rounded-2xl border-2 border-slate-200 hover:grayscale-0 transition-all shadow-sm"
              />
              <div className="absolute bottom-1 right-1 bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {activeDossier.code}
              </div>
            </div>

            <div className="space-y-2 flex-1 min-w-0 pt-1">
              <div>
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 truncate tracking-tight leading-none">{activeDossier.name}</div>
                <div className="text-xs text-blue-700 font-bold uppercase tracking-wider mt-1.5">{activeDossier.career}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"><span className="text-[10px] font-bold uppercase text-slate-400">DOB</span> <span className="font-semibold text-slate-900">{activeDossier.dob}</span></div>
                <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"><span className="text-[10px] font-bold uppercase text-slate-400">NAT</span> <span className="font-semibold text-slate-900">{activeDossier.nationality}</span></div>
                <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"><span className="text-[10px] font-bold uppercase text-slate-400">HT</span> <span className="font-semibold text-slate-900">{activeDossier.height}</span></div>
                <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"><span className="text-[10px] font-bold uppercase text-slate-400">SQUAD</span> <span className="font-bold text-blue-600">{activeDossier.squad}</span></div>
              </div>
              
              <div className="pt-1 flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${activeDossier.status === 'ACTIVE TARGET' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {activeDossier.status}
                </span>
                {(() => {
                  const rStyle = getRiskStyle(activeDossier.riskRating);
                  const RiskIcon = rStyle.Icon;
                  return (
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}>
                      <RiskIcon className="w-3 h-3" />
                      <span>{activeDossier.riskRating || 'HIGH'} RISK</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 4 Core Biometrics Telemetry Grid with Light Pastel Tints */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-rose-50/80 border border-rose-100 rounded-2xl text-center">
              <div className="text-[9px] text-rose-900 uppercase font-bold flex items-center justify-center space-x-1">
                <Activity className="w-3.5 h-3.5 text-rose-600" />
                <span>HEART RATE</span>
              </div>
              <div className="text-base font-extrabold text-rose-700 mt-1">
                {activeDossier.bpm || 95} BPM
              </div>
            </div>

            <div className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-2xl text-center">
              <div className="text-[9px] text-emerald-900 uppercase font-bold flex items-center justify-center space-x-1">
                <Dna className="w-3.5 h-3.5 text-emerald-600" />
                <span>DNA MATCH</span>
              </div>
              <div className="text-base font-extrabold text-emerald-700 mt-1">
                {activeDossier.dnaMatch || '98.5%'}
              </div>
            </div>

            <div className="p-3 bg-sky-50/80 border border-sky-100 rounded-2xl text-center">
              <div className="text-[9px] text-sky-900 uppercase font-bold flex items-center justify-center space-x-1">
                <Scan className="w-3.5 h-3.5 text-sky-600" />
                <span>IRIS SCAN</span>
              </div>
              <div className="text-base font-extrabold text-sky-700 mt-1">
                {activeDossier.irisScore || '98.2%'}
              </div>
            </div>

            {(() => {
              const rStyle = getRiskStyle(activeDossier.riskRating);
              const RiskIcon = rStyle.Icon;
              return (
                <div className={`p-3 ${rStyle.bg} border ${rStyle.border} rounded-2xl text-center`}>
                  <div className={`text-[9px] ${rStyle.text} uppercase font-bold flex items-center justify-center space-x-1 opacity-90`}>
                    <RiskIcon className={`w-3.5 h-3.5 ${rStyle.icon}`} />
                    <span>RISK RATING</span>
                  </div>
                  <div className={`text-base font-extrabold ${rStyle.text} mt-1`}>
                    {activeDossier.riskRating || 'HIGH'}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Extended Biometrics: Fingerprint & Facial Classification */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
            <div className="text-xs uppercase font-bold text-slate-700 flex items-center justify-between">
              <span>National Automated Fingerprint ID (NAFIS)</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">VERIFIED</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 block text-[10px] font-semibold">AFIS RIDGE PATTERN</span>
                <strong className="text-slate-900">{activeDossier.fingerprintPattern || 'WHORL / AFIS-MATCH'}</strong>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 block text-[10px] font-semibold">FACIAL 3D CONFIDENCE</span>
                <strong className="text-blue-700">{activeDossier.facialConfidence || '96.2% MATCH'}</strong>
              </div>
            </div>

            <div className="text-xs text-slate-600">
              Recent Activity / Telemetry: <span className="text-slate-900 font-medium">{activeDossier.recentOp || 'No suspicious movement logged today.'}</span>
            </div>
          </div>

          {/* Biometrics Scan Log History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
              <span className="flex items-center space-x-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>Biometric Audit & Scan History</span>
              </span>
              <button 
                onClick={() => setIsBiometricScanModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
              >
                + Append Scan
              </button>
            </div>

            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {(activeDossier.biometricsHistory || [
                { date: '2026-08-30', type: 'NAFIS Fingerprint Scanner Match', status: 'VERIFIED', matchScore: '99.4%', scannerId: 'MUMBAI-POLICE-02' },
                { date: '2026-08-25', type: 'Iris Pupil Topology Verification', status: 'VERIFIED', matchScore: '98.7%', scannerId: 'AIRPORT-SURVEILLANCE' }
              ]).map((hist, idx) => (
                <div key={idx} className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="truncate">
                    <span className="text-slate-500 font-semibold mr-1.5">{hist.date}</span>
                    <span className="text-slate-800">{hist.type}</span>
                  </div>
                  <span className="text-emerald-700 font-bold shrink-0 ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">{hist.matchScore || hist.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Shortcuts */}
          <div className="flex items-center space-x-2.5 pt-2">
            <button 
              onClick={() => {
                addToCanvas({ id: activeDossier.id, type: 'Person', name: activeDossier.name });
                showToast(`Pinned ${activeDossier.name} to Canva Studio Board`, 'success');
              }}
              className="btn-accent flex-1"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>Pin to Board</span>
            </button>

            <button 
              onClick={() => askAI(`Run complete biometric cross-verification and international criminal database check for ${activeDossier.name} (${activeDossier.id})`)}
              className="btn-secondary flex-1"
            >
              <Fingerprint className="w-4 h-4 text-slate-600" />
              <span>AFIS Cross-Check</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT COLUMN: TARGET ROSTER TABLE (7 Cols)                  */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Target Registry ({filteredDossiers.length} Records)</span>
              </h3>
              <button 
                onClick={handleOpenCreate}
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
              >
                + Quick Add Target
              </button>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Target Name</th>
                    <th className="p-2.5">Squad</th>
                    <th className="p-2.5">Specialization</th>
                    <th className="p-2.5">DNA Match</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDossiers.map(d => (
                    <tr 
                      key={d.id}
                      onClick={() => selectSuspectDossier(d)}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${activeDossier.id === d.id ? 'bg-blue-50/70 font-semibold' : ''}`}
                    >
                      <td className="p-2.5 font-mono font-bold text-blue-700">{d.code}</td>
                      <td className="p-2.5 font-bold text-slate-900 flex items-center space-x-2">
                        <img src={d.photo} alt={d.name} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                        <span className="truncate max-w-[120px]">{d.name}</span>
                      </td>
                      <td className="p-2.5 text-slate-700 font-medium">{d.squad || 'ALPHA-9'}</td>
                      <td className="p-2.5 text-slate-500 truncate max-w-[130px]">{d.career}</td>
                      <td className="p-2.5 text-emerald-700 font-bold">{d.dnaMatch || '98.5%'}</td>
                      <td className="p-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.riskRating === 'CRITICAL' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenEdit(d)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            selectSuspectDossier(d);
                            showToast(`Loaded dossier for ${d.name}`, 'info');
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 4. BOTTOM HALF: GALLERY & INTERCEPT AUDIO TRANSCRIPT STREAM  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Primary Suspect Dossier Cards</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{dossiers.length} Active Targets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dossiers.map(d => (
              <div 
                key={d.id}
                onClick={() => selectSuspectDossier(d)}
                className={`p-4 bg-white border rounded-2xl space-y-3 cursor-pointer transition-all hover:bg-blue-50/30 group shadow-2xs relative overflow-hidden ${
                  activeDossier.id === d.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' : 'border-slate-200/90 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <img src={d.photo} alt={d.name} className="w-16 h-16 rounded-xl object-cover border border-slate-200 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors truncate">{d.name}</div>
                    <div className="text-[11px] text-blue-600 font-semibold truncate">{d.code} • {d.squad || 'ALPHA-9'}</div>
                    <div className="flex items-center space-x-1.5 mt-1.5">
                      {(() => {
                        const rStyle = getRiskStyle(d.riskRating);
                        const RiskIcon = rStyle.Icon;
                        return (
                          <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${rStyle.bg} ${rStyle.border} ${rStyle.text}`}>
                            <RiskIcon className="w-2.5 h-2.5" />
                            <span>{d.riskRating || 'HIGH'} RISK</span>
                          </span>
                        );
                      })()}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${d.status === 'ACTIVE TARGET' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {d.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Track Code: <strong className="text-slate-800 font-semibold">{d.trackCode}</strong></span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(d);
                      }}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 text-[11px]"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCanvas({ id: d.id, type: 'Person', name: d.name });
                        showToast(`Pinned ${d.name} to canvas board`, 'success');
                      }}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-semibold hover:bg-blue-100 text-[11px]"
                    >
                      + Canvas
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audio Intercept Transcript Stream */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xs font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Live Comms Intercept</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">RECORDING</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                <span>COMMS CHANNEL 04</span>
              </span>
              <span className={`font-bold ${isPlayingAudio ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isPlayingAudio ? 'STREAMING 98%' : 'STANDBY'}
              </span>
            </div>
            <div className="h-7 flex items-center justify-between space-x-1 px-1 bg-white rounded-lg border border-slate-200">
              {Array.from({ length: 24 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlayingAudio ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'
                  }`} 
                  style={{ 
                    height: isPlayingAudio ? `${((i * 11 + (Date.now() % 5)) % 22) + 6}px` : '4px' 
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {mockAudioTranscriptLog.map((log, idx) => (
              <div key={idx} className="p-2.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1 text-[11px] transition-colors">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{log.speaker}</span>
                  <span>{log.timestamp} IST</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-snug">{log.text}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
              const nextState = !isPlayingAudio;
              setIsPlayingAudio(nextState);
              showToast(nextState ? 'Playing encrypted intercept audio stream' : 'Intercept audio stream paused', nextState ? 'success' : 'info');
            }}
            className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              isPlayingAudio 
                ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-3.5 h-3.5 text-white" />
                <span>Pause Intercept Audio</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Play Intercept Audio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. MODAL: CREATE / EDIT SUSPECT DOSSIER & BIOMETRICS         */}
      {/* ============================================================ */}
      <SuspectDossierModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        isEdit={isEditModalOpen}
        formData={formData}
        setFormData={setFormData}
        onClose={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
        onSubmit={handleSaveDossier}
        avatarPresets={avatarPresets}
      />

      {/* ============================================================ */}
      {/* 6. MODAL: ADD LIVE BIOMETRIC TELEMETRY SCAN                   */}
      {/* ============================================================ */}
      <BiometricScanModal
        isOpen={isBiometricScanModalOpen}
        onClose={() => setIsBiometricScanModalOpen(false)}
        activeDossier={activeDossier}
        scanForm={scanForm}
        setScanForm={setScanForm}
        onSubmit={handleSaveBiometricScan}
      />

    </div>
  );
}

export default SuspectDossiers;
