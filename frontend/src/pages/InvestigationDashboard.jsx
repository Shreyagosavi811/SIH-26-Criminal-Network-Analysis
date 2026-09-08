import React from 'react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { mockCases, mockRecentCasesList, mockOldCasesSummary } from '../data/mockData.js';
import { CrimeTrackerDashboard } from './CrimeTrackerDashboard.jsx';
import { 
  FolderOpen, 
  Archive, 
  MapPin, 
  Search, 
  Edit3, 
  ArrowRight, 
  FolderGit2, 
  Network, 
  UserCheck, 
  BarChart2, 
  LayoutTemplate,
  FilePlus,
  FileText,
  Clock,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Shield
} from 'lucide-react';

const getPriorityStyle = (priority) => {
  const p = priority?.toUpperCase() || 'LOW';
  if (p === 'CRITICAL' || p === 'HIGH') return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', block: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100', Icon: AlertTriangle };
  if (p === 'MEDIUM') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', block: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100', Icon: AlertCircle };
  return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', block: 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm shadow-slate-100', Icon: Shield };
};

const getStatusStyle = (status) => {
  const s = status?.toUpperCase() || 'UNKNOWN';
  if (s.includes('ACTIVE') || s.includes('OPEN')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  if (s.includes('PENDING') || s.includes('HOLD') || s.includes('SURVEILLANCE')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  if (s.includes('CLOSED') || s.includes('RESOLVED')) return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
  return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
};

export function InvestigationDashboard() {
  const { 
    currentUser, 
    cases: mockCases,
    backendCases,
    backendStatus,
    openModal, 
    activeRegionFilter, 
    setActiveRegionFilter, 
    activeCaseCategoryTab, 
    setActiveCaseCategoryTab, 
    navigate, 
    showToast, 
    searchGlobal 
  } = useInvestigation();

  const setRegionFilter = setActiveRegionFilter;

  // PHASE 2A: Use backend data if online, else fallback
  const cases = (backendStatus?.online && backendCases) ? backendCases : mockCases;

  const filteredCases = (cases || []).filter(c => {
    if (activeRegionFilter === 'All India') return true;
    return c.district.toLowerCase().includes(activeRegionFilter.toLowerCase());
  });

  const highPriorityCount = (cases || []).filter(c => c.priority === 'HIGH').length;

  return (
    <div className="space-y-6 text-slate-800 font-sans max-w-7xl mx-auto">
      {/* Officer Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">{currentUser.department || 'Crime Investigation Department'}</span>
            <span>•</span>
            <span>Station ID: CR-MUM-04</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Case Files & Investigation Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.role}) — {filteredCases.length} active investigations in {activeRegionFilter}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button 
            onClick={() => navigate('canvas')}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <LayoutTemplate className="w-4 h-4 text-slate-500" />
            <span>Corkboard Studio</span>
          </button>

          <button 
            onClick={() => openModal('register-fir')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <FilePlus className="w-4 h-4" />
            <span>New FIR Registration</span>
          </button>
        </div>
      </div>

      {/* Operational Case Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl shadow-sm space-y-1">
          <div className="text-xs text-blue-900 font-semibold flex items-center justify-between">
            <span>Active Cases</span>
            <FolderOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-blue-950 mt-1">{filteredCases.length}</div>
          <div className="text-[11px] text-blue-700 font-medium">Under active inquiry</div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-5 rounded-xl shadow-sm space-y-1">
          <div className="text-xs text-rose-900 font-semibold flex items-center justify-between">
            <span>Priority Cases</span>
            <Archive className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-rose-600 mt-1">{highPriorityCount}</div>
          <div className="text-[11px] text-rose-700 font-medium">Requires immediate action</div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl shadow-sm space-y-1">
          <div className="text-xs text-amber-900 font-semibold flex items-center justify-between">
            <span>Suspects Identified</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-amber-950 mt-1">18</div>
          <div className="text-[11px] text-amber-700 font-medium">AFIS record linked</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl shadow-sm space-y-1">
          <div className="text-xs text-emerald-900 font-semibold flex items-center justify-between">
            <span>Archived Records</span>
            <BarChart2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-950 mt-1">2,000</div>
          <div className="text-[11px] text-emerald-700 font-medium">Digitized repository</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Pill Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button 
              onClick={() => setActiveCaseCategoryTab('recent')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeCaseCategoryTab === 'recent' 
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Cases ({filteredCases.length})
            </button>

            <button 
              onClick={() => setActiveCaseCategoryTab('tracker-view')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeCaseCategoryTab === 'tracker-view' 
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Incident Map & Heatmap
            </button>

            <button 
              onClick={() => setActiveCaseCategoryTab('old')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeCaseCategoryTab === 'old' 
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Historical Database
            </button>
          </div>

          {/* Jurisdiction Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Jurisdiction:</span>
            <select 
              value={activeRegionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm"
            >
              <option value="All India">All Jurisdictions</option>
              <option value="Maharashtra">Maharashtra (Mumbai / Pune)</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Goa">Goa Coastal</option>
              <option value="Karnataka">Karnataka (Bangalore)</option>
              <option value="West Bengal">West Bengal (Kolkata)</option>
              <option value="Cyber Cell">Cyber Crime Cell</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Filter cases by crime type, FIR number, suspect name, or precinct..." 
            onChange={(e) => searchGlobal(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* TAB 0: LIVE INCIDENT HEATMAP */}
      {activeCaseCategoryTab === 'tracker-view' && (
        <div className="space-y-4">
          <CrimeTrackerDashboard />
        </div>
      )}

      {/* TAB 1: ACTIVE CASES TABLE & CARDS */}
      {activeCaseCategoryTab === 'recent' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h2 className="text-sm font-bold text-slate-900">Current Investigation Roster</h2>
            <span className="text-xs font-medium text-slate-500">{filteredCases.length} assigned records</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredCases.map(c => {
              const pStyle = getPriorityStyle(c.priority);
              const sStyle = getStatusStyle(c.status);
              const PriorityIcon = pStyle.Icon;

              return (
                <div 
                  key={c.id}
                  onClick={() => navigate('overview', { caseId: c.id })}
                  className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start space-x-4 min-w-0">
                    {/* The new colored priority anchor block */}
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 mt-0.5 border transition-all ${pStyle.block}`}>
                      <PriorityIcon className="w-4 h-4 mb-1" />
                      <span className="text-[9px] font-bold uppercase tracking-wider leading-none">{c.id.replace('FIR-', '')}</span>
                    </div>

                    <div className="space-y-1.5 min-w-0 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm md:text-base group-hover:text-blue-600 transition-colors tracking-tight">
                          {c.id}: {c.title}
                        </span>

                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                          {c.priority} PRIORITY
                        </span>

                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${sStyle.bg} ${sStyle.text} ${sStyle.border}`}>
                          {c.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1 leading-relaxed">{c.description}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-slate-500 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-700">{c.category}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-700">{c.district}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>IO: <span className="text-slate-700">{c.assignedTo}</span></span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Upd: <span className="text-slate-700">{c.lastUpdated}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        navigate('fir', { caseId: c.id });
                        showToast(`Opened Form II for ${c.id}`, 'info');
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      title="View Statutory FIR Document"
                    >
                      FIR Form
                    </button>

                    <button 
                      onClick={() => {
                        navigate('overview', { caseId: c.id });
                        showToast(`Viewing active file ${c.id}`, 'info');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1"
                    >
                      <span>Open File</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ARCHIVED DATABASE */}
      {activeCaseCategoryTab === 'old' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Historical & Archived Case Index</h2>
              <p className="text-xs font-medium text-slate-500">2,000 closed and historical police records available for precedent lookup</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {mockOldCasesSummary.breakdown.map(cat => (
              <div key={cat.category} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-xs text-slate-500 font-semibold">{cat.category}</div>
                <div className="text-xl font-bold text-slate-900">{cat.count} Cases</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input 
              type="text" 
              placeholder="Search historical FIR archives by incident title, year, suspect alias, or section..." 
              className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            />
            <button 
              onClick={() => showToast('Found 42 matching historical records', 'info')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              Search Archive
            </button>
          </div>
        </div>
      )}

      {/* Workspace Analytical Panels Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Investigation Workspace Modules</h3>
          <p className="text-xs font-medium text-slate-500">Quick access to specialized analytical workspaces</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div 
            onClick={() => navigate('analysis', { tab: 'evidence' })} 
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center cursor-pointer transition-colors space-y-1.5 group active:scale-[0.98]"
          >
            <FolderGit2 className="w-5 h-5 text-slate-500 mx-auto group-hover:text-blue-600 transition-colors" />
            <div className="font-semibold text-slate-900 text-xs">Evidence Vault</div>
            <div className="text-[11px] text-slate-500 font-medium">CDR, Bank & ANPR</div>
          </div>

          <div 
            onClick={() => navigate('analysis', { tab: 'network' })} 
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center cursor-pointer transition-colors space-y-1.5 group active:scale-[0.98]"
          >
            <Network className="w-5 h-5 text-slate-500 mx-auto group-hover:text-blue-600 transition-colors" />
            <div className="font-semibold text-slate-900 text-xs">Network Graph</div>
            <div className="text-[11px] text-slate-500 font-medium">Entity Topology</div>
          </div>

          <div 
            onClick={() => navigate('analysis', { tab: 'timeline' })} 
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center cursor-pointer transition-colors space-y-1.5 group active:scale-[0.98]"
          >
            <Clock className="w-5 h-5 text-slate-500 mx-auto group-hover:text-blue-600 transition-colors" />
            <div className="font-semibold text-slate-900 text-xs">Timeline Analysis</div>
            <div className="text-[11px] text-slate-500 font-medium">Chronology Matrix</div>
          </div>

          <div 
            onClick={() => navigate('dossiers')} 
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center cursor-pointer transition-colors space-y-1.5 group active:scale-[0.98]"
          >
            <UserCheck className="w-5 h-5 text-slate-500 mx-auto group-hover:text-blue-600 transition-colors" />
            <div className="font-semibold text-slate-900 text-xs">Suspect Dossiers</div>
            <div className="text-[11px] text-slate-500 font-medium">AFIS & Biometrics</div>
          </div>

          <div 
            onClick={() => navigate('tracker')} 
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center cursor-pointer transition-colors space-y-1.5 group active:scale-[0.98]"
          >
            <BarChart2 className="w-5 h-5 text-slate-500 mx-auto group-hover:text-blue-600 transition-colors" />
            <div className="font-semibold text-slate-900 text-xs">Incident Map</div>
            <div className="text-[11px] text-slate-500 font-medium">Telemetry Feed</div>
          </div>

          <div 
            onClick={() => navigate('canvas')} 
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center cursor-pointer transition-colors space-y-1.5 group active:scale-[0.98]"
          >
            <LayoutTemplate className="w-5 h-5 text-slate-500 mx-auto group-hover:text-blue-600 transition-colors" />
            <div className="font-semibold text-slate-900 text-xs">Corkboard Studio</div>
            <div className="text-[11px] text-slate-500 font-medium">Tactical Canvas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
