import React from 'react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { mockCases } from '../data/mockData.js';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Info,
  Users,
  FolderGit2,
  Network,
  Clock,
  FileText,
  LayoutTemplate,
  ChevronRight,
  Shield,
  ArrowRight
} from 'lucide-react';

export function InvestigatorOverview() {
  const { 
    activeCaseId, 
    cases,
    navigate, 
    selectEntity, 
    selectEvidence, 
    addToCanvas,
    showToast 
  } = useInvestigation();

  const currentCase = (cases || mockCases).find(c => c.id === activeCaseId) || mockCases[0];

  return (
    <div className="space-y-6 text-slate-800 font-sans max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-7 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <button 
              onClick={() => navigate('dashboard')} 
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-1 rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Case Files</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentCase.id}: {currentCase.title}
              </h1>
              <span className="px-3 py-0.5 rounded-full font-semibold text-xs bg-rose-50 text-rose-700 border border-rose-200">
                {currentCase.priority} Priority
              </span>
              <span className="px-3 py-0.5 rounded-full font-medium text-xs bg-slate-100 text-slate-700 border border-slate-200">
                {currentCase.status}
              </span>
            </div>

            <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">{currentCase.description}</p>
          </div>

          <div className="flex md:flex-col justify-between md:text-right text-xs text-slate-500 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 shrink-0 space-y-1">
            <div>Last Entry: <strong className="text-slate-800 font-medium">{currentCase.lastUpdated}</strong></div>
            <div>Investigating Officer: <strong className="text-slate-900 font-medium">{currentCase.assignedTo}</strong></div>
            <div>Precinct: <strong className="text-slate-800 font-medium">{currentCase.district}</strong></div>
          </div>
        </div>
      </div>

      {/* Case Summary Metric Cards */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Case Investigation Artifacts</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button 
            onClick={() => navigate('analysis', { tab: 'entities' })}
            className="p-4 bg-gradient-to-br from-blue-50/80 via-sky-50/30 to-white hover:from-blue-100/80 border border-blue-100 hover:border-blue-300 rounded-2xl text-center transition-all group active:scale-[0.98] shadow-2xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div className="text-xl font-extrabold text-blue-950">{currentCase.stats.persons}</div>
            <div className="text-xs text-blue-800/80 font-semibold">Suspects & Leads</div>
          </button>

          <button 
            onClick={() => navigate('analysis', { tab: 'evidence' })}
            className="p-4 bg-gradient-to-br from-purple-50/80 via-indigo-50/30 to-white hover:from-purple-100/80 border border-purple-100 hover:border-purple-300 rounded-2xl text-center transition-all group active:scale-[0.98] shadow-2xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
              <FolderGit2 className="w-4.5 h-4.5" />
            </div>
            <div className="text-xl font-extrabold text-purple-950">{currentCase.stats.evidence}</div>
            <div className="text-xs text-purple-800/80 font-semibold">Evidence Exhibits</div>
          </button>

          <button 
            onClick={() => navigate('analysis', { tab: 'network' })}
            className="p-4 bg-gradient-to-br from-amber-50/80 via-yellow-50/30 to-white hover:from-amber-100/80 border border-amber-100 hover:border-amber-300 rounded-2xl text-center transition-all group active:scale-[0.98] shadow-2xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
              <Network className="w-4.5 h-4.5" />
            </div>
            <div className="text-xl font-extrabold text-amber-950">{currentCase.stats.relations}</div>
            <div className="text-xs text-amber-800/80 font-semibold">Mapped Links</div>
          </button>

          <button 
            onClick={() => navigate('analysis', { tab: 'timeline' })}
            className="p-4 bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-white hover:from-emerald-100/80 border border-emerald-100 hover:border-emerald-300 rounded-2xl text-center transition-all group active:scale-[0.98] shadow-2xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div className="text-xl font-extrabold text-emerald-950">4 Events</div>
            <div className="text-xs text-emerald-800/80 font-semibold">Chronology</div>
          </button>

          <button 
            onClick={() => navigate('analysis', { tab: 'documents' })}
            className="p-4 bg-gradient-to-br from-rose-50/80 via-pink-50/30 to-white hover:from-rose-100/80 border border-rose-100 hover:border-rose-300 rounded-2xl text-center transition-all group active:scale-[0.98] shadow-2xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-2 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-xs">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div className="text-xl font-extrabold text-rose-950">2 Dossiers</div>
            <div className="text-xs text-rose-800/80 font-semibold">Statutory FIR</div>
          </button>

          <button 
            onClick={() => navigate('canvas')}
            className="p-4 bg-gradient-to-br from-cyan-50/80 via-blue-50/30 to-white hover:from-cyan-100/80 border border-cyan-100 hover:border-cyan-300 rounded-2xl text-center transition-all group active:scale-[0.98] shadow-2xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto mb-2 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-xs">
              <LayoutTemplate className="w-4.5 h-4.5" />
            </div>
            <div className="text-xl font-extrabold text-cyan-950">Studio</div>
            <div className="text-xs text-cyan-800/80 font-semibold">Corkboard</div>
          </button>
        </div>
      </div>

      {/* Intelligence & Lead Analysis Box */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Syndicate Telemetry & Verified Connections</h2>
          <p className="text-xs text-slate-500">Cross-referenced against CDR cell towers and bank transaction ledgers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Primary Link: P007 (Amit Kumar)</span>
              <span className="text-slate-600 font-semibold text-[11px] bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                Verified Exhibit
              </span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">Direct financial transfer & phone communication logged via CDR-00821 and Exhibit TX-00121.</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button 
                onClick={() => {
                  selectEntity('P007');
                  showToast('Opened intelligence dossier for P007 (Amit Kumar)', 'info');
                }} 
                className="btn-primary btn-sm"
              >
                View Person
              </button>
              <button 
                onClick={() => {
                  selectEvidence('TX-00121');
                  showToast('Opened exhibit details for TX-00121', 'info');
                }} 
                className="btn-secondary btn-sm"
              >
                View Exhibit
              </button>
              <button 
                onClick={() => {
                  addToCanvas('P007');
                  showToast('Pinned P007 to Corkboard Studio', 'success');
                }} 
                className="btn-secondary btn-sm"
              >
                Pin to Board
              </button>
            </div>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Cross-Case Reference: FIR-221 (Goa Narcotics)</span>
              <span className="text-slate-600 font-semibold text-[11px] bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                Inter-Precinct
              </span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">Suspect P007 identified as primary mule account holder in active Goa case FIR-221.</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button 
                onClick={() => {
                  navigate('overview', { caseId: 'FIR-221' });
                  showToast('Switched to linked case FIR-221', 'info');
                }} 
                className="btn-primary btn-sm"
              >
                Open Case File
              </button>
              <button 
                onClick={() => {
                  addToCanvas('FIR-221 Link');
                  showToast('Pinned FIR-221 Link to Corkboard Studio', 'success');
                }} 
                className="btn-secondary btn-sm"
              >
                Pin to Board
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Operational Exhibits & Field Notes */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900">Priority Field Leads & Surveillance Reports</h2>

        <div className="space-y-3">
          <div className="p-4.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">Mule Bank Account Transaction Detected</div>
                <div className="text-slate-600 text-xs mt-0.5">P001 → P007 (₹5,00,000 transaction via HDFC mule account TX-00121)</div>
              </div>
            </div>
            <button 
              onClick={() => navigate('analysis', { tab: 'evidence' })} 
              className="btn-primary btn-sm shrink-0"
            >
              <span>Inspect Exhibit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">Vehicle V003 Highway Toll Capture</div>
                <div className="text-slate-600 text-xs mt-0.5">Black SUV MH02AB1234 sighted near Panvel Toll Gate at 03:12 AM</div>
              </div>
            </div>
            <button 
              onClick={() => navigate('analysis', { tab: 'timeline' })} 
              className="btn-primary btn-sm shrink-0"
            >
              <span>Inspect Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
