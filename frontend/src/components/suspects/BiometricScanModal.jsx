import React from 'react';
import { Scan, X, CheckCircle2 } from 'lucide-react';

export default function BiometricScanModal({
  isOpen,
  onClose,
  activeDossier,
  scanForm,
  setScanForm,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#090E17] border border-[#00B4D8]/60 w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 font-mono text-xs animate-fade-in">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase">ADD BIOMETRIC TELEMETRY SCAN</h2>
              <p className="text-[10px] text-slate-400">Target: {activeDossier?.name} ({activeDossier?.id})</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-300 font-bold">SCAN MODALITY</label>
            <select 
              value={scanForm.type}
              onChange={(e) => setScanForm({ ...scanForm, type: e.target.value })}
              className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="Fingerprint NAFIS Multi-Finger Match">Fingerprint NAFIS Multi-Finger Match</option>
              <option value="Iris Retinal Topography Scan">Iris Retinal Topography Scan</option>
              <option value="DNA STR Loci Sequencing">DNA STR Loci Sequencing</option>
              <option value="Facial 3D Landmark Geometry">Facial 3D Landmark Geometry</option>
              <option value="Voice Spectral Acoustic Print">Voice Spectral Acoustic Print</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-300 font-bold">DEVICE ID / TERMINAL</label>
              <input 
                type="text" 
                value={scanForm.scannerId}
                onChange={(e) => setScanForm({ ...scanForm, scannerId: e.target.value })}
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-300 font-bold">MATCH SCORE %</label>
              <input 
                type="text" 
                value={scanForm.matchScore}
                onChange={(e) => setScanForm({ ...scanForm, matchScore: e.target.value })}
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-emerald-400 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-300 font-bold">LIVE HEART RATE (BPM)</label>
              <input 
                type="number" 
                value={scanForm.bpm}
                onChange={(e) => setScanForm({ ...scanForm, bpm: Number(e.target.value) })}
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-red-400 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-300 font-bold">STATUS</label>
              <select 
                value={scanForm.status}
                onChange={(e) => setScanForm({ ...scanForm, status: e.target.value })}
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white"
              >
                <option value="MATCH VERIFIED">MATCH VERIFIED</option>
                <option value="PARTIAL MATCH">PARTIAL MATCH</option>
                <option value="UNDER REVIEW">UNDER REVIEW</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-slate-950 rounded-xl font-bold flex items-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record & Commit Scan</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
