import React from 'react';
import { Fingerprint, X, Camera, Dna, Save } from 'lucide-react';

export default function SuspectDossierModal({
  isOpen,
  isEdit,
  formData,
  setFormData,
  onClose,
  onSubmit,
  avatarPresets = []
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#090E17] border border-[#1E2D44] w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 font-mono text-xs my-8 animate-fade-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Fingerprint className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-white uppercase">
              {isEdit ? `EDIT BIOMETRIC DOSSIER: ${formData.id}` : 'REGISTER NEW SUSPECT & BIOMETRICS'}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* Row 1: Name & Target ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold">FULL NAME *</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                placeholder="e.g. LAURA JOHN JONES"
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold">TARGET CODE / ALIAS</label>
              <input 
                type="text" 
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. ABACUS-23819"
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Row 2: Squad, Career & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold">ASSIGNED SQUAD</label>
              <select 
                value={formData.squad}
                onChange={(e) => setFormData({ ...formData, squad: e.target.value })}
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ALPHA-9">ALPHA-9 (Hawala)</option>
                <option value="BRAVO-3">BRAVO-3 (Armed)</option>
                <option value="DELTA-1">DELTA-1 (Syndicate)</option>
                <option value="CYBER-CELL">CYBER-CELL (Extortion)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold">CAREER / SPECIALIZATION</label>
              <input 
                type="text" 
                value={formData.career}
                onChange={(e) => setFormData({ ...formData, career: e.target.value.toUpperCase() })}
                placeholder="e.g. CYBER FINANCIAL / HAWALA"
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold">TARGET STATUS</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ACTIVE TARGET">ACTIVE TARGET</option>
                <option value="UNDER SURVEILLANCE">UNDER SURVEILLANCE</option>
                <option value="IN CUSTODY">IN CUSTODY</option>
                <option value="RED FLAG">RED FLAG INTERPOL</option>
              </select>
            </div>
          </div>

          {/* Row 3: Demographics (DOB, Gender, Height, Nationality) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold">DOB</label>
              <input 
                type="date" 
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold">GENDER</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold">HEIGHT</label>
              <input 
                type="text" 
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="175 cm"
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold">NATIONALITY</label>
              <input 
                type="text" 
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value.toUpperCase() })}
                placeholder="INDIAN"
                className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Photo Selector with Presets */}
          <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <label className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>SUSPECT PROFILE MUGSHOT / PHOTO</span>
              </span>
              <span className="text-slate-500">Pick from presets or input URL</span>
            </label>
            
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {avatarPresets.map((preset, idx) => (
                <img 
                  key={idx}
                  src={preset} 
                  alt={`preset-${idx}`}
                  onClick={() => setFormData({ ...formData, photo: preset })}
                  className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 transition-all ${
                    formData.photo === preset ? 'border-amber-400 scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            <input 
              type="text" 
              value={formData.photo}
              onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
              placeholder="Or enter custom image URL"
              className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none"
            />
          </div>

          {/* Biometrics Baseline Inputs */}
          <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[11px] text-amber-400 font-bold uppercase flex items-center space-x-1.5">
              <Dna className="w-4 h-4" />
              <span>Biometric Telemetry Baseline</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">HEART RATE (BPM)</label>
                <input 
                  type="number" 
                  value={formData.bpm}
                  onChange={(e) => setFormData({ ...formData, bpm: Number(e.target.value) })}
                  className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">DNA MATCH %</label>
                <input 
                  type="text" 
                  value={formData.dnaMatch}
                  onChange={(e) => setFormData({ ...formData, dnaMatch: e.target.value })}
                  placeholder="99.4%"
                  className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">IRIS SCAN SCORE</label>
                <input 
                  type="text" 
                  value={formData.irisScore}
                  onChange={(e) => setFormData({ ...formData, irisScore: e.target.value })}
                  placeholder="98.7%"
                  className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">RISK RATING</label>
                <select 
                  value={formData.riskRating}
                  onChange={(e) => setFormData({ ...formData, riskRating: e.target.value })}
                  className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">AFIS FINGERPRINT CLASSIFICATION</label>
                <input 
                  type="text" 
                  value={formData.fingerprintPattern}
                  onChange={(e) => setFormData({ ...formData, fingerprintPattern: e.target.value.toUpperCase() })}
                  placeholder="WHORL / CENTRAL LOOP"
                  className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">RECENT SUSPICIOUS OPERATION</label>
                <input 
                  type="text" 
                  value={formData.recentOp}
                  onChange={(e) => setFormData({ ...formData, recentOp: e.target.value })}
                  placeholder="e.g. MULE TRANSFER & OFFSHORE COMMS"
                  className="w-full bg-[#0E1624] border border-[#1E2E48] rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl font-bold flex items-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Save Dossier Changes' : 'Register Suspect Biometrics'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
