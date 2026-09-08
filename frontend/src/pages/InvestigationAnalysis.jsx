import React, { useState } from 'react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { 
  mockEntities, 
  mockNetworkNodes, 
  mockNetworkEdges, 
  mockEvidence, 
  mockTimelineEvents, 
  mockDocuments 
} from '../data/mockData.js';
import { 
  Network, 
  FolderGit2, 
  Clock, 
  FileText, 
  Users, 
  LayoutTemplate,
  Filter,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Phone,
  Landmark,
  Car,
  Eye,
  Camera,
  AlertTriangle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { RealFIRViewer } from '../components/fir/RealFIRViewer.jsx';
import { EvidencePanel } from '../components/evidence/EvidencePanel.jsx';

const getTimelineStyle = (category) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('financial') || cat.includes('transaction')) {
    return { colorClass: 'text-indigo-700', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200', dotClass: 'bg-indigo-500', badgeBg: 'bg-indigo-100', Icon: Landmark };
  }
  if (cat.includes('communication') || cat.includes('call') || cat.includes('phone')) {
    return { colorClass: 'text-blue-700', bgClass: 'bg-blue-50', borderClass: 'border-blue-200', dotClass: 'bg-blue-500', badgeBg: 'bg-blue-100', Icon: Phone };
  }
  if (cat.includes('surveillance') || cat.includes('vehicle') || cat.includes('anpr')) {
    return { colorClass: 'text-amber-700', bgClass: 'bg-amber-50', borderClass: 'border-amber-200', dotClass: 'bg-amber-500', badgeBg: 'bg-amber-100', Icon: Camera };
  }
  if (cat.includes('intelligence') || cat.includes('sighting') || cat.includes('location')) {
    return { colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200', dotClass: 'bg-emerald-500', badgeBg: 'bg-emerald-100', Icon: Eye };
  }
  return { colorClass: 'text-slate-700', bgClass: 'bg-slate-50', borderClass: 'border-slate-200', dotClass: 'bg-slate-500', badgeBg: 'bg-slate-100', Icon: FileText };
};

const getSuspicionStyle = (level) => {
  const l = level?.toUpperCase() || 'LOW';
  if (l === 'HIGH') return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', Icon: AlertTriangle };
  if (l === 'MEDIUM') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', Icon: AlertCircle };
  return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', Icon: ShieldCheck };
};

export function InvestigationAnalysis() {
  const { 
    activeAnalysisTab, 
    setActiveAnalysisTab, 
    activeCaseId, 
    navigate, 
    selectEntity, 
    selectEvidence, 
    selectEdge, 
    addToCanvas,
    showToast,
    backendStatus,
    backendTimeline,
    backendNetwork
  } = useInvestigation();

  const actualTimeline = (backendStatus?.online && backendTimeline) ? backendTimeline : mockTimelineEvents;

  // PHASE 2G: Compute Graph Data
  const actualNodes = React.useMemo(() => {
    if (backendStatus?.online && backendNetwork?.nodes) {
      const n = backendNetwork.nodes.length;
      return backendNetwork.nodes.map((node, i) => {
        const radius = 120 + ((i % 4) * 45); // Concentric circles to fit more nodes
        const angle = (i / n) * 2 * Math.PI;
        const cx = 425 + radius * Math.cos(angle);
        const cy = 250 + radius * Math.sin(angle);
        
        const typeStr = (node.type || '').toUpperCase();
        let color = '#94a3b8'; // Default slate
        if (typeStr === 'PERSON') color = '#ef4444';
        else if (typeStr === 'ACCOUNT' || typeStr === 'FINANCIAL') color = '#f59e0b';
        else if (typeStr === 'PHONE') color = '#3b82f6';
        else if (typeStr === 'LOCATION' || typeStr === 'VEHICLE') color = '#10b981';
        else if (typeStr === 'CASE' || typeStr === 'DOCUMENT') color = '#64748b';

        return {
          id: node.id,
          label: node.label,
          type: typeStr,
          color: color,
          role: `${node.occurrences} observed records`,
          x: cx,
          y: cy
        };
      });
    }
    return mockNetworkNodes;
  }, [backendStatus, backendNetwork]);

  const actualEdges = React.useMemo(() => {
    if (backendStatus?.online && backendNetwork?.edges) {
      return backendNetwork.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.type || 'CO_OCCURRENCE',
        provenance: e.provenance
      }));
    }
    return mockNetworkEdges;
  }, [backendStatus, backendNetwork]);

  return (
    <div className="space-y-6 text-slate-800 font-sans max-w-7xl mx-auto">
      {/* Top Title & Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mb-1">
              <span>Analytical Case File</span>
              <span>•</span>
              <span className="font-bold text-slate-800">{activeCaseId}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Case Intelligence & Link Analysis</h1>
            <p className="text-xs text-slate-500 mt-0.5">Multi-source correlation engine for syndicate relationship mapping and timeline synthesis</p>
          </div>
          <button 
            onClick={() => navigate('canvas')} 
            className="btn-primary"
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>Open Corkboard Canvas</span>
          </button>
        </div>

        {/* Focused Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full overflow-x-auto text-xs font-semibold">
          {[
            { id: 'network', label: 'Network Graph', icon: Network },
            { id: 'evidence', label: 'Evidence Exhibits', icon: FolderGit2 },
            { id: 'timeline', label: 'Case Chronology', icon: Clock },
            { id: 'documents', label: 'Statutory Documents', icon: FileText },
            { id: 'entities', label: 'Tracked Persons', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeAnalysisTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveAnalysisTab(tab.id)}
                className={`px-4 py-2 rounded-full font-semibold text-xs flex items-center space-x-2 transition-all shrink-0 ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-sm font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: NETWORK GRAPH */}
      {activeAnalysisTab === 'network' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Syndicate Topology & Relationship Map</h3>
              <p className="text-xs text-slate-500">Visual link analysis connecting suspects, financial routes, and telecom assets</p>
            </div>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Click node or edge to inspect details
            </span>
          </div>

          <div className="relative w-full h-[520px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden p-4">
            <div className="absolute top-4 left-4 z-10 bg-white border border-slate-200 p-3 rounded-2xl text-xs space-y-1.5 text-slate-700 shadow-sm">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1">Legend</div>
              <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-rose-500"></span><span className="text-[11px]">Suspect Person</span></div>
              <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-[11px]">Financial Conduit</span></div>
              <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-[11px]">Phone / CDR Cell</span></div>
              <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-[11px]">Vehicle / Location</span></div>
            </div>

            <svg className="w-full h-full" viewBox="0 0 850 500">
              {/* Edges */}
              {actualEdges.map(e => {
                const srcNode = actualNodes.find(n => n.id === e.source);
                const tgtNode = actualNodes.find(n => n.id === e.target);
                if (!srcNode || !tgtNode) return null;
                const midX = (srcNode.x + tgtNode.x) / 2;
                const midY = (srcNode.y + tgtNode.y) / 2;
                return (
                  <g key={e.id} className="network-edge cursor-pointer group" onClick={() => selectEdge(e.id)}>
                    <line 
                      x1={srcNode.x} y1={srcNode.y} 
                      x2={tgtNode.x} y2={tgtNode.y} 
                      stroke="#94a3b8" 
                      strokeWidth="2"
                      className="transition-all group-hover:stroke-slate-600 group-hover:stroke-[3px]"
                    />
                    <foreignObject 
                      x={midX - 100} 
                      y={midY - 15} 
                      width="200" 
                      height="30"
                    >
                      <div className="flex justify-center items-center w-full h-full">
                        <span className="inline-block px-2.5 py-0.5 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold shadow-xs truncate max-w-[180px] group-hover:border-slate-400 group-hover:text-slate-800 transition-colors">
                          {e.label}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Nodes */}
              {actualNodes.map(n => (
                <g 
                  key={n.id}
                  className="network-node cursor-pointer group" 
                  transform={`translate(${n.x}, ${n.y})`} 
                  onClick={() => {
                     // Phase 2G cross navigation
                     if (n.type === 'PERSON') {
                       navigate('dossiers');
                       showToast(`Opened Dossier: ${n.label}`, 'success');
                     } else if (n.type === 'CASE' || n.id.startsWith('FIR-')) {
                       navigate('documents');
                       showToast(`Opened FIR: ${n.label}`, 'success');
                     } else if (n.type === 'LOCATION') {
                       navigate('tracker');
                       showToast(`Mapped Location: ${n.label}`, 'success');
                     } else {
                       selectEntity(n.id);
                     }
                  }}
                >
                  <circle r="22" fill="#ffffff" stroke={n.color} strokeWidth="2.5" className="transition-all group-hover:drop-shadow-md" />
                  <circle r="8" fill={n.color} opacity="0.15" />
                  <circle r="4" fill={n.color} />
                  <text y="38" fill="#0f172a" fontSize="11" fontFamily="Figtree, sans-serif" fontWeight="700" textAnchor="middle" className="group-hover:fill-blue-600 transition-colors">{n.id}</text>
                  <text y="50" fill="#64748b" fontSize="9" fontFamily="Figtree, sans-serif" fontWeight="500" textAnchor="middle">{n.role}</text>
                </g>
              ))}
            </svg>
          </div>
          <p className="text-slate-500 text-xs text-center">Click any suspect node or connection line to open its supporting intelligence dossier.</p>
        </div>
      )}

      {/* TAB 2: EVIDENCE EXHIBITS */}
      {activeAnalysisTab === 'evidence' && (
        <EvidencePanel embeddedInAnalysis={true} />
      )}

      {/* TAB 3: CASE CHRONOLOGY */}
      {activeAnalysisTab === 'timeline' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Chronological Case Reconstruction</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronology verified across CDR cell towers, bank timestamps, and witness records</p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
              {actualTimeline.length} Events Verified
            </span>
          </div>

          <div className="relative pl-12 space-y-6 before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {actualTimeline.map(ev => {
              const style = getTimelineStyle(ev.category);
              const EventIcon = style.Icon;

              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline Node / Icon Dot */}
                  <div className={`absolute -left-[40px] top-1.5 w-8 h-8 rounded-full ${style.bgClass} border-[3px] border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110`}>
                    <EventIcon className={`w-3.5 h-3.5 ${style.colorClass}`} />
                  </div>
                  
                  {/* Event Card */}
                  <div className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-900 font-bold text-xs">{ev.time}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full ${style.badgeBg} ${style.colorClass} text-[10px] uppercase tracking-wider font-bold`}>
                        {ev.category}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h4 
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => {
                          if (ev.sourceType) {
                             selectEvidence(ev.id);
                             setActiveAnalysisTab('evidence');
                             showToast('Linked to Evidence Record', 'success');
                          }
                        }}
                      >
                        {ev.title}
                      </h4>
                      <p className="text-slate-600 text-xs leading-relaxed">{ev.description}</p>
                      
                      {/* PHASE 2F: Cross-Module Links */}
                      {(ev.entities?.length > 0 || ev.location || ev.caseRef) && (
                        <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap gap-2">
                          {ev.caseRef && (
                            <span 
                              className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-md cursor-pointer hover:bg-rose-100 transition-colors flex items-center space-x-1"
                              onClick={() => {
                                showToast(`FIR Reference: ${ev.caseRef}`, 'info');
                                navigate('documents');
                              }}
                            >
                              <FileText className="w-3 h-3" />
                              <span>FIR: {ev.caseRef}</span>
                            </span>
                          )}
                          {ev.location && (
                            <span 
                              className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-md cursor-pointer hover:bg-amber-100 transition-colors flex items-center space-x-1"
                              onClick={() => {
                                showToast(`Location: ${ev.location}`, 'info');
                                navigate('tracker');
                              }}
                            >
                              <Camera className="w-3 h-3" />
                              <span>{ev.location}</span>
                            </span>
                          )}
                          {ev.entities?.map((ent, idx) => (
                            <span 
                              key={idx} 
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-md cursor-pointer hover:bg-indigo-100 transition-colors flex items-center space-x-1"
                              onClick={() => {
                                showToast(`Entity Linked: ${ent}`, 'info');
                                navigate('dossiers');
                              }}
                            >
                              <Users className="w-3 h-3" />
                              <span>{ent}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: STATUTORY DOCUMENTS */}
      {activeAnalysisTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-slate-700" />
                  <span>Statutory First Information Report (Form No. II) — {activeCaseId}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Section 154 Cr.P.C. / BNSS certified document</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-semibold text-xs">
                CCTNS VERIFIED
              </span>
            </div>

            <RealFIRViewer defaultCaseId={activeCaseId} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Inter-Agency Reports & Seizure Panchnama</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockDocuments.map(d => (
                <div key={d.id} className="p-4.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-slate-900 text-sm">{d.title}</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">{d.classification}</span>
                  </div>
                  <p className="text-slate-700 text-xs bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">{d.summary}</p>
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>IO: {d.author} ({d.date})</span>
                    <button 
                      onClick={() => {
                        addToCanvas(d.title);
                        showToast(`Pinned ${d.title} to Corkboard`, 'success');
                      }} 
                      className="btn-primary btn-sm"
                    >
                      + Corkboard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TRACKED PERSONS */}
      {activeAnalysisTab === 'entities' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Identified Persons & Suspects</h3>
              <p className="text-xs text-slate-500">Cross-referenced with NAFIS fingerprint database</p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
              {mockEntities.length} Tracked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockEntities.map(p => (
              <div 
                key={p.id}
                onClick={() => {
                  selectEntity(p.id);
                  showToast(`Viewing intelligence file for ${p.name}`, 'info');
                }}
                className="p-4.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer flex items-center justify-between group transition-colors shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{p.id}: {p.name}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{p.roleInNetwork}</div>
                  </div>
                  <div>
                    {(() => {
                      const s = getSuspicionStyle(p.suspicionLevel);
                      const SuspicionIcon = s.Icon;
                      return (
                        <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${s.bg} ${s.border} ${s.text} text-[10px] font-bold uppercase tracking-wider`}>
                          <SuspicionIcon className="w-3 h-3" />
                          <span>{p.suspicionLevel}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCanvas(p);
                    showToast(`Pinned ${p.name} to Corkboard`, 'success');
                  }}
                  className="btn-primary btn-sm shrink-0"
                >
                  + Corkboard
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
