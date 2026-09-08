import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext.jsx';
import { 
  FileText, 
  FolderGit2, 
  Clock, 
  Users, 
  CheckCheck,
  Maximize2, 
  Minimize2, 
  X, 
  Send,
  Sparkles,
  Bot,
  Shield,
  Zap,
  Copy,
  LayoutTemplate,
  Search,
  Radio,
  ArrowUpRight
} from 'lucide-react';

export function FloatingAI() {
  const { 
    isFloatingAIOpen, 
    toggleFloatingAI, 
    isAIExpanded, 
    toggleAIExpand, 
    aiMessages, 
    askAI, 
    currentPage, 
    activeCaseId, 
    selectedEntity, 
    selectedEvidence, 
    navigate, 
    selectEvidence, 
    addToCanvas,
    showToast 
  } = useInvestigation();

  const [inputVal, setInputVal] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);

  let contextLabel = `Case Context: ${activeCaseId}`;
  if (currentPage === 'dashboard') contextLabel = 'National Case Repository';
  if (selectedEntity) contextLabel = `Suspect: ${selectedEntity.id} (${selectedEntity.name})`;
  if (selectedEvidence) contextLabel = `Exhibit: ${selectedEvidence.id}`;

  const handleCopy = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    showToast('Copied intelligence insight to clipboard', 'info');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!isFloatingAIOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 font-sans select-none">
        {/* Hover label tag */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-sm border border-slate-700/80 animate-fade-in pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>CID Copilot</span>
        </div>

        {/* Floating Trigger Button */}
        <button 
          onClick={toggleFloatingAI}
          className="relative group w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 hover:from-blue-700 hover:via-indigo-800 hover:to-slate-900 text-white shadow-xl shadow-blue-950/40 hover:shadow-blue-500/30 flex items-center justify-center border border-blue-400/40 hover:border-cyan-300 transition-all duration-300 transform hover:scale-108 active:scale-95 cursor-pointer"
          title="Open Case Intelligence Copilot (AI Assistance)"
        >
          {/* Subtle Outer Glow Ring */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 opacity-20 group-hover:opacity-40 blur-xs transition-opacity"></div>
          
          {/* Main Icon */}
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-cyan-300 group-hover:text-white transition-colors animate-pulse" />
          </div>

          {/* Active Status Indicator Dot */}
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-cyan-400 border-2 border-slate-950 rounded-full shadow-xs"></span>
        </button>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      askAI(inputVal.trim());
      setInputVal('');
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 ${isAIExpanded ? 'w-full md:w-[680px] lg:w-[820px]' : 'w-full sm:w-[440px] md:w-[480px]'} bg-white border-l border-slate-200/90 shadow-2xl flex flex-col overflow-hidden font-sans animate-slide-left transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-cyan-400 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white tracking-tight">CID Intel Copilot</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5">{contextLabel}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button 
            onClick={toggleAIExpand}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={isAIExpanded ? 'Restore window size' : 'Expand window'}
          >
            {isAIExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={toggleFloatingAI}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Intelligence Prompts Bar */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-3.5 py-2 flex items-center space-x-1.5 overflow-x-auto text-xs shrink-0">
        <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 pr-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick:</span>
        </div>
        <button 
          onClick={() => askAI('Analyze financial Hawala money trail for target P001')} 
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-slate-700 whitespace-nowrap text-[11px] font-medium transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          💸 Hawala Trail
        </button>
        <button 
          onClick={() => askAI('Cross-check suspect P007 biometrics with AFIS records')} 
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-slate-700 whitespace-nowrap text-[11px] font-medium transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          🧬 AFIS Check
        </button>
        <button 
          onClick={() => askAI('Reconstruct chronological seizure timeline for this case')} 
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-slate-700 whitespace-nowrap text-[11px] font-medium transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          ⏱️ Seizure Chronology
        </button>
        <button 
          onClick={() => askAI('Summarize statutory FIR Form No. II and check penal section compliance')} 
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-slate-700 whitespace-nowrap text-[11px] font-medium transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          📑 FIR Compliance
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-slate-50/60">
        {aiMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl p-3.5 transition-all ${
              msg.sender === 'user' 
                ? 'bg-slate-900 text-white rounded-br-xs shadow-sm' 
                : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-xs'
            }`}>
              {/* Message Header */}
              <div className="text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  {msg.sender === 'user' ? (
                    <>
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[9px]">O</div>
                      <span className="text-slate-300">Investigating Officer</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[9px]">
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-slate-700 font-bold">CID Intelligence Core</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-1.5">
                  <span>{msg.timestamp}</span>
                  {msg.sender !== 'user' && (
                    <button
                      onClick={() => handleCopy(msg.text, idx)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Copy message"
                    >
                      {copiedIdx === idx ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Text Content */}
              <p className="leading-relaxed text-xs text-slate-800 whitespace-pre-wrap">{msg.text}</p>

              {/* Dynamic Result Routing Tiles */}
              {msg.isDynamicRoute && (
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                  <button onClick={() => navigate('analysis', { tab: 'documents' })} className="py-1.5 px-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-slate-700 font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Statutory FIR</span>
                  </button>
                  <button onClick={() => navigate('analysis', { tab: 'evidence' })} className="py-1.5 px-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-slate-700 font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer">
                    <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Exhibits</span>
                  </button>
                  <button onClick={() => navigate('analysis', { tab: 'timeline' })} className="py-1.5 px-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-slate-700 font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chronology</span>
                  </button>
                  <button onClick={() => navigate('analysis', { tab: 'entities' })} className="py-1.5 px-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-slate-700 font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Suspects</span>
                  </button>
                </div>
              )}

              {/* Supporting Evidence Badges */}
              {msg.evidence && msg.evidence.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Attached Exhibits</div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.evidence.map(evId => (
                      <button 
                        key={evId}
                        onClick={() => selectEvidence(evId)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] hover:bg-blue-100 font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <CheckCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>{evId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured Connections */}
              {msg.structuredConnections && (
                <div className="mt-2.5 space-y-1.5">
                  {msg.structuredConnections.map(c => (
                    <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{c.label}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{c.type} • {c.confidence} Confidence</div>
                      </div>
                      <button 
                        onClick={() => {
                          addToCanvas(c.id);
                          showToast(`Pinned ${c.label} to Corkboard`, 'success');
                        }} 
                        className="px-2.5 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <LayoutTemplate className="w-3 h-3" />
                        <span>Pin Card</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Footer */}
      <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Ask CID Intel (e.g., 'Find CDR links for P001', 'Trace Hawala ledger')..." 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 rounded-2xl pl-3.5 pr-8 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {inputVal && (
              <button 
                type="button" 
                onClick={() => setInputVal('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button 
            type="submit" 
            disabled={!inputVal.trim()}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-slate-900 text-white transition-all shadow-xs cursor-pointer shrink-0"
            title="Send Intelligence Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
