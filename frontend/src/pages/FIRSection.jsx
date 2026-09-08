import React, { useState } from 'react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { RealFIRViewer } from '../components/fir/RealFIRViewer.jsx';
import { mockFIRDetails } from '../data/mockFIRs.js';
import { 
  FileText, 
  FilePlus, 
  Search, 
  Filter, 
  BadgeCheck, 
  Clock, 
  ShieldAlert, 
  FolderCheck, 
  Building2, 
  Printer, 
  Edit3,
  CheckCircle2
} from 'lucide-react';

export function FIRSection() {
  const { 
    cases: mockCases, 
    backendCases,
    backendStatus,
    activeCaseId, 
    setActiveCaseId, 
    openModal, 
    currentUser, 
    navigate 
  } = useInvestigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');
  
  // PHASE 2B: Use backend data if online, else fallback
  const cases = (backendStatus?.online && backendCases) ? backendCases : mockCases;
  
  const [selectedCaseForView, setSelectedCaseForView] = useState(activeCaseId || 'FIR-104');

  // Compute metrics
  const totalFIRs = (cases || []).length;
  const highPriorityFIRs = (cases || []).filter(c => c.priority === 'HIGH').length;

  const filteredCases = (cases || []).filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.assignedTo && c.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDistrict = districtFilter === 'All' || c.district.toLowerCase().includes(districtFilter.toLowerCase());
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="space-y-6 text-slate-800 font-sans max-w-7xl mx-auto">
      {/* Header Hub Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Statutory FIR Repository</h1>
            <span className="px-3 py-0.5 rounded-lg font-bold bg-blue-50 text-blue-700 border border-blue-200 text-xs">
              CR.P.C. 154 / BNSS 173
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Official police First Information Reports (Form No. II), certified complaint transcripts, and seizure panchnama dossiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => openModal('edit-fir', { firId: selectedCaseForView })}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Selected FIR</span>
          </button>

          <button 
            onClick={() => openModal('register-fir')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <FilePlus className="w-4 h-4" />
            <span>New FIR Registration</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-900 text-xs font-semibold">
            <span>Total Registered FIRs</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-950">{totalFIRs} Records</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>CCTNS Sync Active</span>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-900 text-xs font-semibold">
            <span>High Priority Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{highPriorityFIRs} Cases</div>
          <div className="text-[11px] text-rose-600 font-semibold">Immediate Lead Action</div>
        </div>

        <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-purple-900 text-xs font-semibold">
            <span>Magistrate Dispatched</span>
            <FolderCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-900">100% Verified</div>
          <div className="text-[11px] text-purple-700 font-semibold">Statutory Compliance</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-semibold">
            <span>Jurisdiction Range</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-950">National</div>
          <div className="text-[11px] text-emerald-700 font-semibold">Multi-State Inter-Grid</div>
        </div>
      </div>

      {/* Main Content Area: Case Roster Sidebar + Real FIR Form */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Sidebar: Case Selector */}
        <div className="w-full xl:w-[340px] shrink-0 space-y-4">
          {/* Search & Filter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input 
                type="text"
                placeholder="Search FIR records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors shadow-sm"
              />
            </div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 font-semibold text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors shadow-sm"
            >
              <option value="All">All Jurisdictions</option>
              <option value="Mumbai">Mumbai / Maharashtra</option>
              <option value="Goa">Goa Coastal</option>
              <option value="Delhi">Delhi NCR</option>
              <option value="Cyber">Cyber Crime Cell</option>
            </select>
          </div>

          {/* Scannable Case Roster */}
          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
            {filteredCases.map(c => {
              const isSelected = selectedCaseForView === c.id;
              const isHigh = c.priority === 'HIGH';
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseForView(c.id);
                    setActiveCaseId(c.id);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-900 shadow-md' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-mono font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>{c.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isHigh 
                        ? (isSelected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200') 
                        : (isSelected ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200')
                    }`}>
                      {c.priority || 'STANDARD'}
                    </span>
                  </div>
                  <h4 className={`font-bold text-sm line-clamp-2 mb-2 leading-snug ${isSelected ? 'text-slate-200' : 'text-slate-800'}`}>
                    {c.title}
                  </h4>
                  <div className={`text-[10px] flex items-center justify-between font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="truncate mr-2">{c.district}</span>
                    <span className="shrink-0">{c.date?.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
            {filteredCases.length === 0 && (
              <div className="text-center p-6 text-xs font-bold text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
                No matching FIRs found
              </div>
            )}
          </div>
        </div>

        {/* Main Viewer */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
          <RealFIRViewer key={selectedCaseForView} defaultCaseId={selectedCaseForView} />
        </div>
      </div>
    </div>
  );
}
