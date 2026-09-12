import React from 'react';
import { useInvestigation } from '../../context/InvestigationContext.jsx';
import { 
  X, 
  LayoutTemplate, 
  Bot, 
  Eye 
} from 'lucide-react';

/* SIDE INTELLIGENCE DRAWER */
export function Drawer() {
  const { 
    activeDrawer, 
    closeDrawer, 
    selectedEntity, 
    selectedEvidence, 
    addToCanvas, 
    askAI,
    openModal,
    showToast 
  } = useInvestigation();

  if (!activeDrawer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full shadow-2xl flex flex-col font-sans text-xs animate-slide-left overflow-y-auto">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase">
              {activeDrawer === 'node-details' && 'Suspect Entity Intelligence'}
              {activeDrawer === 'evidence-details' && 'Intelligence Evidence Dossier'}
              {activeDrawer === 'edge-details' && 'Relationship Link Telemetry'}
              {activeDrawer === 'user-profile' && 'Investigator Security Profile'}
            </h3>
            <p className="text-[10px] text-slate-500">SIH26189 Classified Evidence Drawer</p>
          </div>
          <button onClick={closeDrawer} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 space-y-5">
          {activeDrawer === 'node-details' && selectedEntity && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                {selectedEntity.photo && (
                  <img src={selectedEntity.photo} alt={selectedEntity.name} className="w-16 h-16 rounded-lg object-cover border border-slate-300 grayscale" />
                )}
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedEntity.name}</div>
                  <div className="text-[11px] text-blue-600 font-bold">{selectedEntity.id} • {selectedEntity.type}</div>
                  <div className="text-[10px] text-slate-500">{selectedEntity.roleInNetwork}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Profile Records</div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700">
                  {selectedEntity.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <strong className="text-slate-900">{selectedEntity.phone}</strong>
                    </div>
                  )}
                  {selectedEntity.address && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Address:</span>
                      <strong className="text-slate-900">{selectedEntity.address}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Suspicion Level:</span>
                    <span className="px-2 py-0.5 rounded font-bold bg-red-100 text-red-700 border border-red-200">{selectedEntity.suspicionLevel}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button 
                  onClick={() => addToCanvas(selectedEntity, 'analysis')}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <LayoutTemplate className="w-4 h-4" />
                  <span>Pin to Corkboard</span>
                </button>
                <button 
                  onClick={() => askAI(`Analyze suspect ${selectedEntity.name} (${selectedEntity.id})`)}
                  className="px-3 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>AI Review</span>
                </button>
              </div>
            </div>
          )}

          {activeDrawer === 'evidence-details' && selectedEvidence && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-300">{selectedEvidence.category || selectedEvidence.type}</span>
                  <span className="text-slate-500 font-mono font-bold text-xs">{selectedEvidence.id}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedEvidence.title}</h4>
                <p className="text-xs text-slate-600">{selectedEvidence.summary || selectedEvidence.description}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Seizure & Integrity Record</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Malkhana Locker:</span>
                  <strong className="text-slate-900 font-bold font-mono">{selectedEvidence.custodyLocker || 'VAL-04'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seizing Officer:</span>
                  <strong className="text-slate-900 font-bold">{selectedEvidence.officer || 'Inspector Sharma'}</strong>
                </div>
                {selectedEvidence.amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Value Quantum:</span>
                    <strong className="text-emerald-700 font-bold">{selectedEvidence.amount}</strong>
                  </div>
                )}
                {selectedEvidence.callCount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Calls Intercepted:</span>
                    <strong className="text-blue-700 font-bold">{selectedEvidence.callCount} Calls</strong>
                  </div>
                )}
                {selectedEvidence.hash && (
                  <div className="space-y-1 pt-1">
                    <span className="text-slate-500 text-[10px]">SHA-256 Checksum Hash:</span>
                    <div className="text-[10px] text-slate-800 bg-white p-2 rounded border border-slate-200 font-mono break-all">{selectedEvidence.hash}</div>
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button 
                  onClick={() => {
                    closeDrawer();
                    openModal('evidence-inspector', selectedEvidence);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Launch Forensic Lab Inspector</span>
                </button>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      addToCanvas(selectedEvidence, 'evidence');
                      showToast(`Pinned ${selectedEvidence.id} to Corkboard`, 'success');
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    <span>Pin to Canvas</span>
                  </button>

                  <button 
                    onClick={() => {
                      askAI(`Analyze forensic evidence ${selectedEvidence.id}: ${selectedEvidence.title}`);
                    }}
                    className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Review</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Drawer;
