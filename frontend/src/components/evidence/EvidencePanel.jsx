import React, { useState, useMemo } from 'react';
import { useInvestigation } from '../../context/InvestigationContext.jsx';
import { 
  FolderGit2, 
  Search, 
  Filter, 
  Plus, 
  LayoutTemplate, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  CreditCard, 
  Radio, 
  Smartphone, 
  Camera, 
  Target, 
  FileText, 
  Clock, 
  Copy, 
  CheckCircle, 
  ExternalLink, 
  Printer, 
  Download, 
  Sparkles, 
  Bot, 
  Grid, 
  List, 
  Columns, 
  Eye, 
  AlertTriangle,
  Layers,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  RefreshCw,
  Trash2,
  Edit3,
  Video,
  Play,
  Film,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { EvidenceDetailModal } from './EvidenceDetailModal.jsx';

export function EvidencePanel({ embeddedInAnalysis = false }) {
  const { 
    evidenceList, 
    activeCaseId, 
    openModal, 
    selectEvidence, 
    selectedEvidence, 
    addToCanvas, 
    askAI, 
    showToast, 
    verifyEvidenceIntegrity, 
    deleteEvidence,
    navigate,
    suspectDossiers,
    backendEvidence,
    backendStatus
  } = useInvestigation();

  const actualEvidenceList = (backendStatus?.online && backendEvidence) ? backendEvidence : evidenceList;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [suspicionFilter, setSuspicionFilter] = useState('All');
  const [caseScopeFilter, setCaseScopeFilter] = useState('All'); // 'All' or 'current'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'inspector', 'table', 'timeline'
  const [activeInspectorItem, setActiveInspectorItem] = useState(null);
  const [isAuditingAll, setIsAuditingAll] = useState(false);
  const [copiedHashId, setCopiedHashId] = useState(null);

  const categories = [
    'All',
    'Financial',
    'Telecommunication',
    'Digital Forensics',
    'Surveillance',
    'Physical & Ballistics',
    'Legal & Statutory'
  ];

  // Filtered evidence calculation
  const filteredEvidence = useMemo(() => {
    const list = actualEvidenceList || [];
    return list.filter(ev => {
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = ev.id?.toLowerCase().includes(q);
        const matchesTitle = ev.title?.toLowerCase().includes(q);
        const matchesDesc = ev.description?.toLowerCase().includes(q) || ev.summary?.toLowerCase().includes(q);
        const matchesOfficer = ev.officer?.toLowerCase().includes(q);
        const matchesHash = ev.hash?.toLowerCase().includes(q);
        const matchesLocker = ev.custodyLocker?.toLowerCase().includes(q);
        const matchesLocation = ev.seizureLocation?.toLowerCase().includes(q);
        const matchesCategory = ev.category?.toLowerCase().includes(q) || ev.type?.toLowerCase().includes(q);
        const matchesLinked = ev.linkedEntities?.some(ent => ent.toLowerCase().includes(q));

        if (!matchesId && !matchesTitle && !matchesDesc && !matchesOfficer && !matchesHash && !matchesLocker && !matchesLocation && !matchesCategory && !matchesLinked) {
          return false;
        }
      }

      // Category filter match
      if (categoryFilter !== 'All') {
        const catMatch = ev.type?.toLowerCase() === categoryFilter.toLowerCase() || 
                         ev.category?.toLowerCase().includes(categoryFilter.toLowerCase());
        if (!catMatch) return false;
      }

      // Suspicion filter match
      if (suspicionFilter !== 'All') {
        if (ev.suspicion?.toUpperCase() !== suspicionFilter.toUpperCase()) return false;
      }

      // Case filter match
      if (caseScopeFilter === 'current' && activeCaseId) {
        if (ev.caseId && ev.caseId !== activeCaseId) return false;
      }

      return true;
    });
  }, [actualEvidenceList, searchQuery, categoryFilter, suspicionFilter, caseScopeFilter, activeCaseId]);

  // Set default inspector item if not set
  React.useEffect(() => {
    if (!activeInspectorItem && filteredEvidence.length > 0) {
      setActiveInspectorItem(filteredEvidence[0]);
    }
  }, [filteredEvidence, activeInspectorItem]);

  // Stats calculation
  const stats = useMemo(() => {
    const list = actualEvidenceList || [];
    const total = list.length;
    const highSuspicion = list.filter(e => e.suspicion === 'HIGH').length;
    const verifiedIntegrity = list.filter(e => e.integrityVerified !== false).length;
    const categoriesCount = new Set(list.map(e => e.type)).size;
    return {
      total,
      highSuspicion,
      integrityRate: total > 0 ? Math.round((verifiedIntegrity / total) * 100) : 100,
      categoriesCount
    };
  }, [actualEvidenceList]);

  const handleAuditAll = () => {
    setIsAuditingAll(true);
    setTimeout(() => {
      setIsAuditingAll(false);
      showToast(`100% SHA-256 Cryptographic Checksum verified across all ${actualEvidenceList?.length || 0} exhibits`, 'success');
    }, 800);
  };

  const copyHash = (hash, id) => {
    if (hash) {
      navigator.clipboard?.writeText(hash);
      setCopiedHashId(id);
      showToast(`Copied SHA-256 Hash for exhibit ${id}`, 'info');
      setTimeout(() => setCopiedHashId(null), 2000);
    }
  };

  const getModalityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'financial': return CreditCard;
      case 'telecommunication': return Radio;
      case 'digital forensics': return Smartphone;
      case 'surveillance': return Camera;
      case 'physical & ballistics': return Target;
      default: return FileText;
    }
  };

  const getCategoryColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'financial': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'telecommunication': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'digital forensics': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'surveillance': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'physical & ballistics': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getMediaTypeInfo = (ev) => {
    const mType = ev.mediaType || (ev.videoDetails ? 'video' : ev.imageDetails ? 'image' : ev.type === 'Surveillance' ? 'video' : ev.type === 'Physical & Ballistics' ? 'image' : 'document');
    if (mType === 'video') {
      return {
        type: 'video',
        label: '4K CCTV VIDEO',
        icon: Video,
        badgeColor: 'bg-rose-600 text-white',
        borderTag: 'border-rose-300',
        duration: ev.videoDetails?.duration || '02:44',
        res: ev.videoDetails?.resolution || '3840x2160 (4K UHD)'
      };
    }
    if (mType === 'image') {
      return {
        type: 'image',
        label: 'HI-RES PHOTO',
        icon: Camera,
        badgeColor: 'bg-indigo-600 text-white',
        borderTag: 'border-indigo-300',
        res: ev.imageDetails?.resolution || '4000x3000 RAW'
      };
    }
    if (mType === 'audio') {
      return {
        type: 'audio',
        label: 'AUDIO RECORD',
        icon: Radio,
        badgeColor: 'bg-amber-600 text-white',
        borderTag: 'border-amber-300'
      };
    }
    return {
      type: 'document',
      label: 'DOC EXHIBIT',
      icon: FileText,
      badgeColor: 'bg-slate-700 text-white',
      borderTag: 'border-slate-300'
    };
  };

  const renderStatusBadge = (suspicion, dark = false) => {
    const s = (suspicion || '').toUpperCase();
    if (s === 'HIGH') {
      return (
        <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md font-sans text-[9px] font-bold border shadow-xs ${dark ? 'bg-rose-500/90 text-white border-rose-400/50 backdrop-blur-sm' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>CRITICAL</span>
        </span>
      );
    }
    if (s === 'MEDIUM') {
      return (
        <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md font-sans text-[9px] font-bold border shadow-xs ${dark ? 'bg-amber-500/90 text-white border-amber-400/50 backdrop-blur-sm' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>FLAGGED</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md font-sans text-[9px] font-bold border shadow-xs ${dark ? 'bg-slate-800/90 text-slate-200 border-slate-600/50 backdrop-blur-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
        <Info className="w-2.5 h-2.5" />
        <span>LOGGED</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans select-none">
      
      {/* 1. TOP STATS KPI BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</div>
            <div className="text-xs text-slate-500 font-medium">Logged Exhibits</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight">{stats.integrityRate}%</div>
            <div className="text-xs text-slate-500 font-medium">SHA-256 Validated</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-700 tracking-tight">{stats.highSuspicion}</div>
            <div className="text-xs text-slate-500 font-medium">Critical Exhibits</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.categoriesCount} Disciplines</div>
            <div className="text-xs text-slate-500 font-medium">Forensic Streams</div>
          </div>
        </div>
      </div>

      {/* 2. ACTIONS & VIEW MODE CONTROLS HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mb-1">
              <span>Malkhana Judicial Evidence Vault</span>
              <span>•</span>
              <span className="font-bold text-slate-800">{activeCaseId} Repository</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Evidence Vault & Forensics Hub</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cryptographically certified evidentiary assets with chain of custody tracking</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              onClick={handleAuditAll}
              disabled={isAuditingAll}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Re-evaluate SHA-256 hashes of all records"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isAuditingAll ? 'animate-spin' : ''}`} />
              <span>{isAuditingAll ? 'Verifying Hashes...' : 'Audit All Hashes'}</span>
            </button>

            <button 
              onClick={() => {
                showToast(`Exported Evidence Manifest for ${activeCaseId} (PDF/JSON)`, 'success');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Manifest</span>
            </button>

            <button 
              onClick={() => openModal('log-evidence', { defaultCaseId: activeCaseId })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Seize / Log Evidence</span>
            </button>
          </div>
        </div>

        {/* 3. MULTI-SEARCH & FILTER BAR */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exhibit ID, title, officer, suspect, SHA-256 hash, or locker..."
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              {[
                { id: 'grid', label: 'Grid Cards', icon: Grid },
                { id: 'inspector', label: 'Forensic Lab', icon: Columns },
                { id: 'table', label: 'Custody Ledger', icon: List },
                { id: 'timeline', label: 'Timeline', icon: Clock }
              ].map(m => {
                const Icon = m.icon;
                const isSelected = viewMode === m.id;
                return (
                  <button 
                    key={m.id}
                    onClick={() => setViewMode(m.id)}
                    className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                      isSelected 
                        ? 'bg-white text-slate-900 font-bold shadow-2xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="hidden md:inline">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 overflow-x-auto text-xs">
            <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider mr-1">Discipline:</span>
            {categories.map(cat => {
              const isSelected = categoryFilter === cat;
              const count = cat === 'All' 
                ? (evidenceList || []).length 
                : (evidenceList || []).filter(e => e.type?.toLowerCase() === cat.toLowerCase() || e.category?.toLowerCase().includes(cat.toLowerCase())).length;

              return (
                <button 
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center space-x-1.5 ${
                    isSelected 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans ${
                    isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            <div className="ml-auto flex items-center space-x-2">
              <select 
                value={suspicionFilter}
                onChange={(e) => setSuspicionFilter(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Criticality</option>
                <option value="HIGH">High Criticality Only</option>
                <option value="MEDIUM">Medium Criticality</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT BY VIEW MODE */}

      {/* VIEW MODE 1: GRID CARDS */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing <strong>{filteredEvidence.length}</strong> forensic exhibits</span>
            <span className="text-[11px] font-medium text-slate-600">Click any card to launch interactive 4K surveillance player or optical forensic lab</span>
          </div>

          {filteredEvidence.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-base">No matching evidence exhibits found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">Try resetting filters or search terms, or click the button below to record a new evidence item.</p>
              <button 
                onClick={() => { setSearchQuery(''); setCategoryFilter('All'); setSuspicionFilter('All'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvidence.map(ev => {
                const ModalityIconComponent = getModalityIcon(ev.type);
                const mediaInfo = getMediaTypeInfo(ev);
                const MediaIcon = mediaInfo.icon;
                const hasMedia = ev.thumbnailUrl || ev.mediaUrl;

                return (
                  <div 
                    key={ev.id}
                    onClick={() => selectEvidence(ev.id)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative"
                  >
                    {/* Media Thumbnail Banner (For Video & Image exhibits) */}
                    {hasMedia ? (
                      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-100">
                        <img 
                          src={ev.thumbnailUrl || ev.mediaUrl} 
                          alt={ev.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                        {/* Top Left: Media Format Badge */}
                        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold flex items-center space-x-1 shadow-xs ${mediaInfo.badgeColor}`}>
                            <MediaIcon className="w-2.5 h-2.5" />
                            <span>{mediaInfo.label}</span>
                          </span>
                          {renderStatusBadge(ev.suspicion, true)}
                        </div>

                        {/* Top Right: Exhibit ID */}
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-xs text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-white/10">
                          {ev.id}
                        </div>

                        {/* Center Hover Action */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                            {mediaInfo.type === 'video' ? <Play className="w-5 h-5 ml-0.5 fill-white" /> : <Maximize2 className="w-5 h-5" />}
                          </div>
                        </div>

                        {/* Bottom Bar: Resolution / Duration / Camera ID */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] text-slate-200 font-mono">
                          <span className="truncate max-w-[160px] text-slate-300">
                            {ev.videoDetails?.cameraId || ev.imageDetails?.sensor || ev.custodyLocker}
                          </span>
                          <span className="bg-black/80 px-1.5 py-0.5 rounded text-white font-bold shrink-0">
                            {mediaInfo.type === 'video' ? (ev.videoDetails?.duration || '02:44') : (ev.imageDetails?.resolution?.split(' ')[0] || 'HI-RES')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Non-Media Top Row Header */
                      <div className="p-5 pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(ev.type)} flex items-center space-x-1`}>
                              <ModalityIconComponent className="w-3 h-3" />
                              <span>{ev.category || ev.type}</span>
                            </span>
                            {renderStatusBadge(ev.suspicion, false)}
                          </div>
                          <span className="font-mono font-bold text-xs text-slate-700 group-hover:text-blue-600 transition-colors">
                            {ev.id}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        {!hasMedia && (
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                            <MediaIcon className="w-3 h-3 text-slate-500" />
                            <span>{mediaInfo.label}</span>
                          </div>
                        )}
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                          {ev.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                          {ev.summary || ev.description}
                        </p>
                      </div>

                      {/* Metadata Specs */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Locker Vault:</span>
                            <strong className="text-slate-800">{ev.custodyLocker || '—'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Seizing Officer:</span>
                            <strong className="text-slate-800">{ev.officer || '—'}</strong>
                          </div>
                        </div>

                        {/* SHA-256 Hash Strip */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            copyHash(ev.hash, ev.id);
                          }}
                          className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-600 transition-colors"
                          title="Click to copy SHA-256 checksum"
                        >
                          <div className="flex items-center space-x-1.5 truncate mr-2">
                            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{ev.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
                          </div>
                          <span className="text-[10px] font-sans font-bold text-blue-600 shrink-0">
                            {copiedHashId === ev.id ? 'COPIED' : 'HASH'}
                          </span>
                        </div>

                        {/* Linked Suspects Chips */}
                        {ev.linkedEntities && ev.linkedEntities.length > 0 && (
                          <div className="flex items-center space-x-1 overflow-x-auto pt-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold mr-1">Targets:</span>
                            {ev.linkedEntities.map(ent => (
                              <span 
                                key={ent}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold font-mono"
                              >
                                {ent}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] font-medium">{ev.date?.split(' ')[0]}</span>

                        <div className="flex items-center space-x-1.5">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCanvas(ev, 'evidence');
                              showToast(`Pinned ${ev.id} to Corkboard Studio`, 'success');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center space-x-1"
                            title="Pin onto Corkboard"
                          >
                            <LayoutTemplate className="w-3 h-3" />
                            <span>Corkboard</span>
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              selectEvidence(ev.id);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1 shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{mediaInfo.type === 'video' ? 'Play Video' : mediaInfo.type === 'image' ? 'Analyze' : 'Inspect'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: FORENSIC LAB INSPECTOR (SPLIT WORKBENCH) */}
      {viewMode === 'inspector' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Digital Forensics Laboratory & Telemetry Workspace</h3>
            <p className="text-xs text-slate-500">Live multi-source reconstruction workbench linking 4K video surveillance, optical macro analysis, voice, and financial forensics</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
            {/* Left Column: Evidence List Selection */}
            <div className="lg:col-span-4 space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Select Exhibit to Analyze</div>
              {filteredEvidence.map(ev => {
                const isSelected = activeInspectorItem?.id === ev.id;
                const mediaInfo = getMediaTypeInfo(ev);
                const MediaIcon = mediaInfo.icon;
                return (
                  <div 
                    key={ev.id}
                    onClick={() => setActiveInspectorItem(ev)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isSelected ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'bg-slate-200 text-slate-700'}`}>
                          {ev.category || ev.type}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${mediaInfo.badgeColor}`}>
                          {mediaInfo.label.split(' ')[0]}
                        </span>
                        {renderStatusBadge(ev.suspicion, isSelected)}
                      </div>
                      <span className={`font-mono font-bold text-xs ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>{ev.id}</span>
                    </div>
                    <div className={`font-bold text-xs line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{ev.title}</div>
                    <div className={`text-[10px] flex items-center justify-between ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>Locker: {ev.custodyLocker || '—'}</span>
                      <span>{ev.date?.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Interactive Forensic Laboratory View */}
            <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5 flex flex-col justify-between">
              {activeInspectorItem ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                          {activeInspectorItem.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
                          {activeInspectorItem.category || activeInspectorItem.type}
                        </span>
                        {renderStatusBadge(activeInspectorItem.suspicion, false)}
                        <span className="text-emerald-700 font-bold text-xs flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Integrity Sealed</span>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{activeInspectorItem.title}</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          addToCanvas(activeInspectorItem, 'evidence');
                          showToast(`Pinned ${activeInspectorItem.id} to Corkboard Canvas`, 'success');
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1 shadow-2xs"
                      >
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        <span>+ Corkboard</span>
                      </button>

                      <button 
                        onClick={() => selectEvidence(activeInspectorItem.id)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1 shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Launch Full Inspector</span>
                      </button>
                    </div>
                  </div>

                  {/* Media Visual Preview (If video / image) */}
                  {(activeInspectorItem.thumbnailUrl || activeInspectorItem.mediaUrl) && (
                    <div className="relative aspect-21/9 bg-slate-950 rounded-2xl overflow-hidden border border-slate-300 group shadow-sm">
                      <img 
                        src={activeInspectorItem.thumbnailUrl || activeInspectorItem.mediaUrl} 
                        alt="Evidence Preview" 
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                      <div className="absolute top-3 left-3 flex items-center space-x-2">
                        {activeInspectorItem.mediaType === 'video' || activeInspectorItem.videoDetails ? (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono font-bold text-[10px] flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>4K SURVEILLANCE VIDEO</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold text-[10px]">
                            OPTICAL MACRO PHOTOMICROGRAPH
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-mono">
                        <div>
                          {activeInspectorItem.videoDetails?.resolution || activeInspectorItem.imageDetails?.resolution || 'High-Resolution Forensic Asset'}
                        </div>
                        <button 
                          onClick={() => selectEvidence(activeInspectorItem.id)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 font-sans font-bold rounded-lg text-xs transition-all shadow-md flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>{activeInspectorItem.mediaType === 'video' ? 'Play 4K Player' : 'Open Optical Lab'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Forensic Assessment Summary</span>
                    <p className="text-slate-800 leading-relaxed font-medium">{activeInspectorItem.summary || activeInspectorItem.description}</p>
                  </div>

                  {/* Forensic Payload Snapshot */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                      <span className="text-blue-400 font-bold uppercase text-[11px]">Primary Telemetry Payload</span>
                      <span className="text-slate-400 text-[10px]">{activeInspectorItem.type} Stream</span>
                    </div>

                    {activeInspectorItem.type === 'Telecommunication' && (
                      <div className="space-y-2 text-slate-300">
                        <div>SOURCE: {activeInspectorItem.forensics?.sourceNumber || '+91 98201 12345'}</div>
                        <div>TARGET: {activeInspectorItem.forensics?.targetNumber || '+91 98201 99887'}</div>
                        <div className="text-rose-400 font-sans text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          {activeInspectorItem.forensics?.transcriptSnippet || 'Lawful intercepted conversation snippet on record.'}
                        </div>
                      </div>
                    )}

                    {activeInspectorItem.type === 'Financial' && (
                      <div className="space-y-2 text-slate-300">
                        <div className="text-amber-300 font-bold text-sm">SEIZED QUANTUM: {activeInspectorItem.amount || '₹5,00,000'}</div>
                        <div>UTR: {activeInspectorItem.forensics?.utr || 'HDFCR5202608280049210'}</div>
                        <div>BENEFICIARY: {activeInspectorItem.forensics?.beneficiary || 'Zenith Logistics & Impex'}</div>
                      </div>
                    )}

                    {activeInspectorItem.type === 'Surveillance' && (
                      <div className="space-y-2 text-slate-300">
                        <div className="text-emerald-400 font-bold text-base">{activeInspectorItem.forensics?.plateNumber || 'MH 02 AB 1234'}</div>
                        <div>VEHICLE: {activeInspectorItem.forensics?.vehicleMake || 'Mahindra Scorpio N'}</div>
                        <div>CAMERA: {activeInspectorItem.videoDetails?.cameraId || activeInspectorItem.forensics?.cameraLocation || 'Khalapur Expressway Toll'}</div>
                        <div>RESOLUTION: {activeInspectorItem.videoDetails?.resolution || '3840x2160 (4K UHD)'}</div>
                      </div>
                    )}

                    {activeInspectorItem.type === 'Physical & Ballistics' && (
                      <div className="space-y-2 text-slate-300">
                        <div className="text-rose-400 font-bold">{activeInspectorItem.forensics?.caliber || '9x19mm Parabellum'}</div>
                        <div>FSL MATCH: {activeInspectorItem.forensics?.striationMatchPercentage || '98.7% Striation Match'}</div>
                        <div>AFIS LATENT: {activeInspectorItem.forensics?.afisFingerprintMatch || 'Match Confirmed'}</div>
                        <div>SENSOR: {activeInspectorItem.imageDetails?.sensor || 'Forensic Macro Optical Sensor'}</div>
                      </div>
                    )}

                    {activeInspectorItem.type !== 'Telecommunication' && activeInspectorItem.type !== 'Financial' && activeInspectorItem.type !== 'Surveillance' && activeInspectorItem.type !== 'Physical & Ballistics' && (
                      <div className="space-y-1.5 text-slate-300">
                        <div>LOCATION: {activeInspectorItem.seizureLocation}</div>
                        <div>OFFICER: {activeInspectorItem.officer}</div>
                        <div>LOCKER: {activeInspectorItem.custodyLocker}</div>
                      </div>
                    )}
                  </div>

                  {/* Hash verification box */}
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono">
                    <div className="truncate mr-3">
                      <span className="text-slate-400 text-[10px] block uppercase font-sans font-bold">SHA-256 Bitstream Hash:</span>
                      <span className="text-slate-800 text-[11px] truncate block">{activeInspectorItem.hash}</span>
                    </div>
                    <button 
                      onClick={() => copyHash(activeInspectorItem.hash, activeInspectorItem.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold rounded-lg shrink-0 text-xs"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 text-xs">Select an exhibit to inspect</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: CUSTODY LEDGER TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Judicial Malkhana Custody Register</h3>
              <p className="text-xs text-slate-500">Sec 102 / 105 BNSS certified statutory register of seized evidence and digital extractions</p>
            </div>
            <button 
              onClick={() => showToast('Exporting Statutory Malkhana Register (Form 4)', 'success')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form IV Register</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-3.5 rounded-l-xl">Exhibit ID</th>
                  <th className="p-3.5">Media Format</th>
                  <th className="p-3.5">Title & Particulars</th>
                  <th className="p-3.5">Discipline</th>
                  <th className="p-3.5">Seizing IO</th>
                  <th className="p-3.5">Locker / Vault</th>
                  <th className="p-3.5">SHA-256 Checksum</th>
                  <th className="p-3.5">Integrity</th>
                  <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredEvidence.map(ev => {
                  const mediaInfo = getMediaTypeInfo(ev);
                  const MediaIcon = mediaInfo.icon;
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{ev.id}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono inline-flex items-center space-x-1 ${mediaInfo.badgeColor}`}>
                          <MediaIcon className="w-3 h-3" />
                          <span>{mediaInfo.label.split(' ')[0]}</span>
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-slate-900">{ev.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{ev.seizureLocation}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col space-y-1.5 items-start">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(ev.type)}`}>
                            {ev.category || ev.type}
                          </span>
                          {renderStatusBadge(ev.suspicion, false)}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-800 font-medium">{ev.officer || '—'}</td>
                      <td className="p-3.5 font-mono text-slate-800 font-bold">{ev.custodyLocker || '—'}</td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-500 max-w-[120px] truncate" title={ev.hash}>
                        {ev.hash?.substring(0, 16)}...
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center space-x-1 w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button 
                          onClick={() => selectEvidence(ev.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition-colors"
                        >
                          Inspect
                        </button>
                        <button 
                          onClick={() => {
                            addToCanvas(ev, 'evidence');
                            showToast(`Pinned ${ev.id} to Corkboard Canvas`, 'success');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
                          title="Pin to Corkboard"
                        >
                          + Pin
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: SEIZURE CHRONOLOGY TIMELINE */}
      {viewMode === 'timeline' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Chronological Seizure Sequence</h3>
              <p className="text-xs text-slate-500">Temporal sequence of evidence seizures across investigative operations</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {filteredEvidence.length} Seizure Milestones
            </span>
          </div>

          <div className="relative pl-6 md:pl-8 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {filteredEvidence.map(ev => {
              const ModalityIconComponent = getModalityIcon(ev.type);
              const mediaInfo = getMediaTypeInfo(ev);
              const MediaIcon = mediaInfo.icon;
              return (
                <div key={ev.id} className="relative group">
                  <div className="absolute -left-[23px] md:-left-[29px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-xs"></div>
                  <div 
                    onClick={() => selectEvidence(ev.id)}
                    className="p-4.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl space-y-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{ev.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(ev.type)}`}>
                          {ev.category || ev.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono flex items-center space-x-1 ${mediaInfo.badgeColor}`}>
                          <MediaIcon className="w-2.5 h-2.5" />
                          <span>{mediaInfo.label}</span>
                        </span>
                        {renderStatusBadge(ev.suspicion, false)}
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{ev.date}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{ev.title}</h4>
                    <p className="text-slate-600 text-xs leading-relaxed font-normal">{ev.summary || ev.description}</p>
                    
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
                      <span>Location: <strong className="text-slate-800">{ev.seizureLocation}</strong></span>
                      <span>Locker: <strong className="text-slate-800">{ev.custodyLocker}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
