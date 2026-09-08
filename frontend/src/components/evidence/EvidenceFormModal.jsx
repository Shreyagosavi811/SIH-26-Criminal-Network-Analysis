import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import {
  FolderGit2,
  Edit3,
  X,
  Sparkles,
  Tag,
  ShieldCheck,
  Trash2,
  CheckCircle
} from 'lucide-react';

/* EVIDENCE PRESETS */
export const EVIDENCE_PRESETS = [
  {
    label: '🎥 4K Port CCTV Video',
    type: 'Surveillance',
    category: '4K CCTV Video Stream',
    mediaType: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
    title: 'Port Terminal 4 Freight Yard 4K Night CCTV Surveillance',
    description: '4K optical surveillance recording capturing unauthorized container break-in and cargo transfer into unmarked truck at Berth 4B.',
    seizureLocation: 'Nhava Sheva Freight CFS Terminal 4, Mumbai',
    custodyLocker: 'DIGI-CCTV-01',
    suspicion: 'HIGH',
    videoDetails: {
      duration: '02:44',
      resolution: '3840x2160 (4K UHD)',
      fps: 60,
      cameraId: 'CAM-PORT-BERTH4B-PTZ',
      timestampOverlay: '2026-08-31 03:12:18 IST',
      codec: 'H.265 / HEVC',
      keyframes: [
        { time: '00:14', label: 'Suspicious White Scorpio arrives at perimeter gate' },
        { time: '00:48', label: 'Operative cuts freight security seal' },
        { time: '01:22', label: 'Consignment transfer into secondary vehicle' }
      ]
    }
  },
  {
    label: '🎥 ANPR Toll CCTV Video',
    type: 'Surveillance',
    category: 'ANPR CCTV Video Feed',
    mediaType: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475b?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475b?w=600&auto=format&fit=crop&q=80',
    title: 'Khalapur Toll Plaza ANPR High-Speed Video Intercept',
    description: 'High-speed automated optical ANPR video showing suspect vehicle crossing Toll Lane 04 at 02:45 hrs.',
    seizureLocation: 'Khalapur Toll Plaza, Mumbai-Pune Expressway',
    custodyLocker: 'DIGI-ANPR-03',
    suspicion: 'HIGH',
    videoDetails: {
      duration: '01:15',
      resolution: '1920x1080 (FHD 60FPS)',
      fps: 60,
      cameraId: 'TOLL-EXPR-LANE4-ANPR',
      timestampOverlay: '2026-08-31 02:45:10 IST',
      codec: 'H.264 / AVC',
      keyframes: [
        { time: '00:05', label: 'Vehicle approaches toll barrier' },
        { time: '00:18', label: 'ANPR lock on license plate MH 02 AB 1234' },
        { time: '00:32', label: 'Barrier breach / high-speed departure' }
      ]
    }
  },
  {
    label: '📷 9mm Ballistics Photo',
    type: 'Physical & Ballistics',
    category: 'Ballistic Macro Photomicrograph',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    title: 'Beretta 9mm Fired Casing Micro-Striation Photomicrograph',
    description: 'FSL Macro-imaging of firing pin indentation and breech face striation marks matched to seized weapon.',
    seizureLocation: 'Crime Scene: Linking Road, Bandra West',
    custodyLocker: 'ARM-02-MACRO',
    suspicion: 'HIGH',
    imageDetails: {
      resolution: '4000x3000 (RAW 12-bit)',
      sensor: 'Forensic Macro Photomicroscope Keyence VHX-7000',
      exif: { ISO: 100, Aperture: 'f/8.0', Exposure: '1/200s', FocalLength: '105mm Macro' },
      annotations: [
        { x: 42, y: 35, width: 18, height: 22, label: 'Firing Pin Indentation (98.7% Striation Match)' },
        { x: 68, y: 60, width: 20, height: 18, label: 'Extractor Claw Mark - Consistent with Beretta 92FS' }
      ]
    }
  },
  {
    label: '📷 Night Telephoto Photo',
    type: 'Surveillance',
    category: 'Telephoto Surveillance Image',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    title: 'Telephoto Night Surveillance: Cash-for-Keys Handover',
    description: 'Long-range optical telephoto capture of midnight transaction between key suspects outside Warehouse 12.',
    seizureLocation: 'Warehouse 12, Wadi Bunder, Mazgaon',
    custodyLocker: 'SURV-TELE-08',
    suspicion: 'HIGH',
    imageDetails: {
      resolution: '3840x2160 (High-ISO Night Shot)',
      sensor: 'Sony A7S III + 400mm f/2.8 GM Lens',
      exif: { ISO: 12800, Aperture: 'f/2.8', Exposure: '1/60s', FocalLength: '400mm' },
      annotations: [
        { x: 30, y: 25, width: 25, height: 35, label: 'Suspect P001 identifying bag contents' },
        { x: 65, y: 40, width: 20, height: 25, label: 'Cash satchel with counterfeit markings' }
      ]
    }
  }
];

export default function EvidenceFormModal({ isEdit, modalData, closeModal }) {
  const { addEvidence, updateEvidence, deleteEvidence, currentUser, activeCaseId, suspectDossiers } = useInvestigation();

  const [type, setType] = useState(modalData?.type || 'Physical & Ballistics');
  const [category, setCategory] = useState(modalData?.category || 'Forensic Seizure');
  const [mediaType, setMediaType] = useState(modalData?.mediaType || (modalData?.videoDetails ? 'video' : modalData?.imageDetails ? 'image' : 'image'));
  const [mediaUrl, setMediaUrl] = useState(modalData?.mediaUrl || modalData?.thumbnailUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80');
  const [thumbnailUrl, setThumbnailUrl] = useState(modalData?.thumbnailUrl || modalData?.mediaUrl || '');
  const [title, setTitle] = useState(modalData?.title || '');
  const [description, setDescription] = useState(modalData?.description || '');
  const [amount, setAmount] = useState(modalData?.amount || '');
  const [officer, setOfficer] = useState(modalData?.officer || currentUser?.name || 'Inspector Sharma');
  const [seizureLocation, setSeizureLocation] = useState(modalData?.seizureLocation || '');
  const [custodyLocker, setCustodyLocker] = useState(modalData?.custodyLocker || `LOC-${Math.floor(10 + Math.random() * 90)}`);
  const [suspicion, setSuspicion] = useState(modalData?.suspicion || 'HIGH');
  const [linkedEntity, setLinkedEntity] = useState(modalData?.linkedEntities?.[0] || 'P001');

  // Video and Image specifics
  const [videoDuration, setVideoDuration] = useState(modalData?.videoDetails?.duration || '02:44');
  const [videoResolution, setVideoResolution] = useState(modalData?.videoDetails?.resolution || '3840x2160 (4K UHD)');
  const [videoCameraId, setVideoCameraId] = useState(modalData?.videoDetails?.cameraId || 'CAM-CCTV-01');

  const [imageResolution, setImageResolution] = useState(modalData?.imageDetails?.resolution || '4000x3000 (RAW 12-bit)');
  const [imageSensor, setImageSensor] = useState(modalData?.imageDetails?.sensor || 'Forensic Optical Sensor');

  const applyPreset = (preset) => {
    setType(preset.type);
    setCategory(preset.category);
    setMediaType(preset.mediaType);
    setMediaUrl(preset.mediaUrl);
    setThumbnailUrl(preset.thumbnailUrl);
    setTitle(preset.title);
    setDescription(preset.description);
    setSeizureLocation(preset.seizureLocation);
    setCustodyLocker(preset.custodyLocker);
    setSuspicion(preset.suspicion);
    if (preset.videoDetails) {
      setVideoDuration(preset.videoDetails.duration);
      setVideoResolution(preset.videoDetails.resolution);
      setVideoCameraId(preset.videoDetails.cameraId);
    }
    if (preset.imageDetails) {
      setImageResolution(preset.imageDetails.resolution);
      setImageSensor(preset.imageDetails.sensor);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      type,
      category,
      mediaType,
      mediaUrl: mediaUrl.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || mediaUrl.trim() || undefined,
      title: title.trim() || `Seized Exhibit (${type})`,
      description: description.trim(),
      summary: description.trim() || `${type} exhibit logged into official malkhana custody.`,
      amount: amount.trim() || undefined,
      officer: officer.trim(),
      seizureLocation: seizureLocation.trim() || 'Jurisdiction Crime Scene',
      custodyLocker: custodyLocker.trim(),
      suspicion,
      caseId: modalData?.caseId || modalData?.defaultCaseId || activeCaseId || 'FIR-104',
      linkedEntities: [linkedEntity],
      ...(mediaType === 'video' ? {
        videoDetails: {
          duration: videoDuration,
          resolution: videoResolution,
          fps: 60,
          cameraId: videoCameraId,
          timestampOverlay: `${new Date().toISOString().split('T')[0]} 03:12:18 IST`,
          codec: 'H.265 / HEVC',
          keyframes: [
            { time: '00:10', label: 'Incident onset / movement detected' },
            { time: '00:45', label: 'Subject locks in perimeter' },
            { time: '01:20', label: 'Primary target action' }
          ]
        }
      } : {}),
      ...(mediaType === 'image' ? {
        imageDetails: {
          resolution: imageResolution,
          sensor: imageSensor,
          exif: { ISO: 100, Aperture: 'f/4.0', Exposure: '1/125s', FocalLength: '50mm' },
          annotations: [
            { x: 35, y: 30, width: 25, height: 25, label: 'Primary Forensic Region of Interest (ROI)' }
          ]
        }
      } : {})
    };

    if (isEdit && modalData?.id) {
      updateEvidence(modalData.id, payload);
    } else {
      addEvidence(payload);
    }
    closeModal();
  };

  return (
    <div className="flex flex-col h-full max-h-[88vh]">
      {/* Modal Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          {isEdit ? <Edit3 className="w-5 h-5 text-amber-400" /> : <FolderGit2 className="w-5 h-5 text-blue-400" />}
          <div>
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <span>{isEdit ? `Edit Evidence Exhibit: ${modalData?.id}` : 'Seize & Log New Evidentiary Exhibit'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                mediaType === 'video' ? 'bg-rose-600 text-white' : 
                mediaType === 'image' ? 'bg-indigo-600 text-white' : 
                mediaType === 'audio' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-200'
              }`}>
                {mediaType === 'video' ? '🎥 4K VIDEO' : mediaType === 'image' ? '📷 HI-RES PHOTO' : mediaType === 'audio' ? '🎙️ AUDIO RECORD' : '📄 DOCUMENT'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Sec 102/105 BNSS Malkhana Digital Custody & Forensic Media Registry</p>
          </div>
        </div>
        <button onClick={closeModal} className="text-slate-400 hover:text-white p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preset Fast-Loader Bar */}
      {!isEdit && (
        <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center space-x-2 overflow-x-auto shrink-0 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fast Presets:</span>
          </span>
          {EVIDENCE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors shadow-2xs"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
        
        {/* 1. MEDIA FORMAT SELECTION TABS */}
        <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span>Evidence Media Format (First-Class Multimedia Support)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'video', label: '🎥 4K Surveillance Video', desc: 'CCTV / Dashcam / ANPR' },
              { id: 'image', label: '📷 High-Res Optical Photo', desc: 'Ballistics / Macro / Scene' },
              { id: 'audio', label: '🎙️ Intercept Wiretap Audio', desc: 'VoIP / GSM Call Records' },
              { id: 'document', label: '📄 Judicial Panchnama Doc', desc: 'Written & Bank Statements' }
            ].map(m => {
              const isSelected = mediaType === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMediaType(m.id);
                    if (m.id === 'video') setType('Surveillance');
                    else if (m.id === 'image') setType('Physical & Ballistics');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-blue-500/20' 
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">{m.label}</div>
                  <div className={`text-[9px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. MEDIA URL & LIVE MEDIA PREVIEW */}
        {(mediaType === 'video' || mediaType === 'image') && (
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1">
                <span>{mediaType === 'video' ? '🎥 4K Surveillance Video Feed & Live Preview' : '📷 High-Resolution Optical Image Preview'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {mediaType === 'video' ? videoResolution : imageResolution}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Thumbnail / Video Simulation Box */}
              <div className="sm:col-span-4 relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 group">
                <img 
                  src={mediaUrl || thumbnailUrl || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80'} 
                  alt="Media Preview" 
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                
                {mediaType === 'video' ? (
                  <>
                    <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>REC • 4K</span>
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                      {videoDuration}
                    </div>
                  </>
                ) : (
                  <div className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
                    RAW PHOTO
                  </div>
                )}
              </div>

              {/* URL & Camera Config Fields */}
              <div className="sm:col-span-8 space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Evidence Media Source URL / Image Stream</label>
                  <input 
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => {
                      setMediaUrl(e.target.value);
                      setThumbnailUrl(e.target.value);
                    }}
                    placeholder="https://... (Image or Video Stream URL)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>

                {mediaType === 'video' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Surveillance Camera ID</label>
                      <input 
                        type="text"
                        value={videoCameraId}
                        onChange={(e) => setVideoCameraId(e.target.value)}
                        placeholder="e.g. CAM-PORT-BERTH4B-PTZ"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-[11px] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Duration & FPS</label>
                      <input 
                        type="text"
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(e.target.value)}
                        placeholder="e.g. 02:44 (60 FPS)"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-[11px] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {mediaType === 'image' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Optical Sensor / Device</label>
                      <input 
                        type="text"
                        value={imageSensor}
                        onChange={(e) => setImageSensor(e.target.value)}
                        placeholder="e.g. Keyence VHX-7000 Macro"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-[11px] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Resolution / Bit Depth</label>
                      <input 
                        type="text"
                        value={imageResolution}
                        onChange={(e) => setImageResolution(e.target.value)}
                        placeholder="e.g. 4000x3000 RAW"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-[11px] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. CORE EVIDENCE ATTRIBUTES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Forensic Discipline / Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
            >
              <option value="Surveillance">Surveillance & ANPR (Video / Imagery)</option>
              <option value="Physical & Ballistics">Physical & Ballistics (Optical / Weapon)</option>
              <option value="Digital Forensics">Digital Forensics & Hardware</option>
              <option value="Financial">Financial & Hawala</option>
              <option value="Telecommunication">Telecommunication & CDR</option>
              <option value="Legal & Statutory">Legal & Seizure Panchnama</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Sub-Classification</label>
            <input 
              type="text" 
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. 4K CCTV Stream, Micro-Striation Photo, Burner SIM"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Exhibit Title / Subject</label>
          <input 
            type="text" 
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Berth 4B 4K CCTV Surveillance Video Footage"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Criticality Level</label>
            <select 
              value={suspicion}
              onChange={(e) => setSuspicion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
            >
              <option value="HIGH">🔴 High (Red Flag)</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🔵 Low</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Value / Quantum (₹)</label>
            <input 
              type="text" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. ₹5,00,000 or N/A"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Malkhana Locker / Vault</label>
            <input 
              type="text" 
              required
              value={custodyLocker}
              onChange={(e) => setCustodyLocker(e.target.value)}
              placeholder="e.g. DIGI-CCTV-01, VAL-04"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Seizure Location</label>
            <input 
              type="text" 
              required
              value={seizureLocation}
              onChange={(e) => setSeizureLocation(e.target.value)}
              placeholder="e.g. Terminal 4 CFS, Nhava Sheva, Mumbai"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Linked Primary Suspect</label>
            <select 
              value={linkedEntity}
              onChange={(e) => setLinkedEntity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
            >
              {(suspectDossiers || [{ id: 'P001', name: 'Vikramaditya Deshmukh' }]).map(s => (
                <option key={s.id} value={s.id}>{s.id}: {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Seizure Panchnama & Narrative</label>
          <textarea 
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Official recorded narrative of recovery, panchas signatures, and condition upon seizure..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            {isEdit && (
              <button 
                type="button" 
                onClick={() => {
                  if (confirm(`Archive exhibit ${modalData?.id}?`)) {
                    deleteEvidence(modalData?.id);
                    closeModal();
                  }
                }}
                className="px-3 py-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-300 rounded-lg font-bold flex items-center space-x-1 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            )}
            <div className="hidden sm:flex items-center space-x-1.5 text-[10px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Automated SHA-256 Checksum Seal</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>{isEdit ? 'Save Changes' : 'Log into Vault'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
