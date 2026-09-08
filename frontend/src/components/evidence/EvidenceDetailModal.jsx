import React, { useState, useEffect } from 'react';
import { useInvestigation } from '../../context/InvestigationContext.jsx';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  LayoutTemplate, 
  Bot, 
  Play, 
  Pause, 
  Volume2, 
  FileText, 
  CheckCircle, 
  Clock, 
  Lock, 
  Key, 
  Smartphone, 
  CreditCard, 
  Radio, 
  Camera, 
  Target, 
  Hash, 
  Copy, 
  ExternalLink, 
  Share2, 
  Download, 
  Printer, 
  Sparkles, 
  Layers, 
  AlertCircle,
  Video,
  Film,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FastForward,
  Sliders,
  Scan,
  Tag,
  Eye,
  Maximize2
} from 'lucide-react';

export function EvidenceDetailModal({ evidence: propEvidence, closeModal: propCloseModal }) {
  const { 
    selectedEvidence, 
    closeModal, 
    addToCanvas, 
    askAI, 
    verifyEvidenceIntegrity, 
    showToast,
    navigate,
    suspectDossiers,
    selectSuspectDossier
  } = useInvestigation();

  const evidence = propEvidence || selectedEvidence;
  const handleClose = propCloseModal || closeModal;

  const [activeTab, setActiveTab] = useState('forensics'); // 'forensics', 'custody', 'integrity', 'ai'
  
  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(25);
  
  // Video Player State
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(48); // in seconds
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState(1);
  const [showVideoOSD, setShowVideoOSD] = useState(true);
  
  // Image Inspector State
  const [imageZoom, setImageZoom] = useState(100);
  const [activeImageFilter, setActiveImageFilter] = useState('normal'); // 'normal', 'contrast', 'night', 'edge', 'thermal'
  const [showAnnotations, setShowAnnotations] = useState(true);

  const [isCopiedHash, setIsCopiedHash] = useState(false);
  const [isVerifyingHash, setIsVerifyingHash] = useState(false);

  // Audio timer
  useEffect(() => {
    let interval;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress(prev => (prev >= 100 ? 0 : prev + 2));
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  // Video timer
  useEffect(() => {
    let interval;
    if (isPlayingVideo) {
      interval = setInterval(() => {
        setVideoCurrentTime(prev => (prev >= 164 ? 0 : prev + 1));
      }, 1000 / videoPlaybackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlayingVideo, videoPlaybackSpeed]);

  if (!evidence) return null;

  const copyHashToClipboard = () => {
    if (evidence.hash) {
      navigator.clipboard?.writeText(evidence.hash);
      setIsCopiedHash(true);
      showToast('SHA-256 Hash copied to clipboard', 'info');
      setTimeout(() => setIsCopiedHash(false), 2000);
    }
  };

  const handleVerifyIntegrity = () => {
    setIsVerifyingHash(true);
    setTimeout(() => {
      setIsVerifyingHash(false);
      verifyEvidenceIntegrity(evidence.id);
    }, 600);
  };

  const getModalityIcon = (type, mediaType) => {
    if (mediaType === 'video') return Video;
    if (mediaType === 'image') return ImageIcon;
    switch (type?.toLowerCase()) {
      case 'financial': return CreditCard;
      case 'telecommunication': return Radio;
      case 'digital forensics': return Smartphone;
      case 'surveillance': return Camera;
      case 'physical & ballistics': return Target;
      default: return FileText;
    }
  };

  const ModalityIcon = getModalityIcon(evidence.type, evidence.mediaType);

  const formatVideoTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getImageFilterStyle = () => {
    switch (activeImageFilter) {
      case 'contrast': return 'contrast-175 brightness-95';
      case 'night': return 'brightness-150 contrast-125 saturate-50 hue-rotate-90';
      case 'edge': return 'grayscale invert contrast-200';
      case 'thermal': return 'hue-rotate-180 saturate-200 contrast-150';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 select-none font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] text-slate-800 animate-scale-up">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <ModalityIcon className="w-48 h-48 text-white" />
          </div>

          <div className="space-y-1.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-mono text-[11px] font-bold tracking-wider">
                {evidence.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700">
                {evidence.category || evidence.type}
              </span>
              {evidence.mediaType && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider flex items-center space-x-1 ${
                  evidence.mediaType === 'video' 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/40' 
                    : evidence.mediaType === 'image'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                }`}>
                  {evidence.mediaType === 'video' && <Video className="w-3 h-3" />}
                  {evidence.mediaType === 'image' && <ImageIcon className="w-3 h-3" />}
                  {evidence.mediaType === 'audio' && <Radio className="w-3 h-3" />}
                  <span>{evidence.mediaType} Exhibit</span>
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center space-x-1 ${
                evidence.suspicion === 'HIGH' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${evidence.suspicion === 'HIGH' ? 'bg-rose-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span>{evidence.suspicion} Criticality</span>
              </span>
              {evidence.caseId && (
                <span className="text-slate-400 text-xs">
                  Linked Case: <strong className="text-white">{evidence.caseId}</strong>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{evidence.title}</h2>
            
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
              <span>Seized: <strong className="text-slate-200">{evidence.date}</strong></span>
              <span>•</span>
              <span>Officer: <strong className="text-slate-200">{evidence.officer || '—'}</strong></span>
              <span>•</span>
              <span>Locker: <strong className="text-slate-200">{evidence.custodyLocker || '—'}</strong></span>
            </p>
          </div>

          <button 
            onClick={handleClose} 
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors z-10 cursor-pointer"
            title="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center justify-between overflow-x-auto shrink-0 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            {[
              { id: 'forensics', label: 'Forensic Workbench', icon: Sparkles },
              { id: 'custody', label: 'Chain of Custody', icon: Clock },
              { id: 'integrity', label: 'SHA-256 Hash & Seal', icon: Lock },
              { id: 'ai', label: 'AI Case Correlator', icon: Bot }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                    isActive 
                      ? 'bg-white text-slate-900 shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs">
            <button 
              onClick={() => {
                addToCanvas(evidence);
                showToast(`Pinned ${evidence.id} to Corkboard Canvas`, 'success');
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" />
              <span>+ Pin to Board</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs font-sans">
          
          {/* TAB 1: FORENSIC WORKBENCH */}
          {activeTab === 'forensics' && (
            <div className="space-y-5 animate-fade-in">
              {/* Executive Summary */}
              <div className="p-4.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Executive Seizure Summary</div>
                <p className="text-slate-800 text-sm leading-relaxed">{evidence.summary || evidence.description}</p>
                {evidence.description && evidence.summary && (
                  <p className="text-slate-500 text-xs pt-1 leading-relaxed">{evidence.description}</p>
                )}
              </div>

              {/* 🎥 SPECIALIZED 1: VIDEO SURVEILLANCE & CCTV WORKBENCH */}
              {(evidence.mediaType === 'video' || evidence.videoDetails) && (
                <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl shadow-xl border border-slate-800 space-y-4">
                  {/* Video Header Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-400/30">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center space-x-2">
                          <span>Surveillance CCTV Video Player (4K Stream)</span>
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {evidence.videoDetails?.cameraId || 'CAM-09-SURVEILLANCE'} • {evidence.videoDetails?.resolution || '4K 3840x2160'} • {evidence.videoDetails?.fps || '60 FPS'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setShowVideoOSD(!showVideoOSD)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          showVideoOSD 
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        OSD Telemetry
                      </button>
                    </div>
                  </div>

                  {/* Video Viewport Frame */}
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl aspect-video max-h-[360px] flex items-center justify-center group">
                    {/* Video Background Poster / Simulation */}
                    <img 
                      src={evidence.mediaUrl || evidence.thumbnailUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'} 
                      alt={evidence.title} 
                      className="w-full h-full object-cover opacity-85"
                    />

                    {/* Scanline & Grid Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none"></div>

                    {/* CCTV On-Screen Display (OSD) Overlay */}
                    {showVideoOSD && (
                      <>
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          <span>[REC] {evidence.videoDetails?.timestampOverlay || '2026-08-31 03:12:18 IST'}</span>
                        </div>

                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 border border-slate-700">
                          {evidence.videoDetails?.cameraId || 'CAMERA CH-04'}
                        </div>

                        {/* ANPR / AI Target Reticle Simulation */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="border-2 border-emerald-400/80 rounded-lg w-56 h-28 flex flex-col justify-between p-1.5 bg-emerald-500/10 shadow-lg shadow-emerald-500/20">
                            <div className="flex justify-between items-center text-[9px] font-mono text-emerald-300 font-bold">
                              <span>AI ANPR LOCK</span>
                              <span>99.4% CONF</span>
                            </div>
                            <div className="text-center font-mono text-xs font-bold text-white bg-black/70 px-2 py-0.5 rounded">
                              {evidence.forensics?.plateNumber || 'MH 02 AB 1234'}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Play / Pause Big Center Trigger */}
                    <button 
                      onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                      className="absolute w-14 h-14 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center border border-white/20 shadow-2xl transition-transform transform hover:scale-110 cursor-pointer"
                    >
                      {isPlayingVideo ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                    </button>

                    {/* Bottom Control Bar on Video */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 space-y-2">
                      {/* Scrubber */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-slate-300">{formatVideoTime(videoCurrentTime)}</span>
                        <input 
                          type="range" 
                          min={0} 
                          max={164} 
                          value={videoCurrentTime}
                          onChange={(e) => setVideoCurrentTime(Number(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{evidence.videoDetails?.duration || '02:44'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Video Playback Speed & Keyframe Bookmarks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Playback Controls */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Playback Speed</span>
                      <div className="flex space-x-1">
                        {[0.25, 0.5, 1, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => setVideoPlaybackSpeed(speed)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                              videoPlaybackSpeed === speed 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Keyframe Snapshot Export */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Current Keyframe</span>
                      <button 
                        onClick={() => showToast(`Extracted forensic keyframe snapshot at ${formatVideoTime(videoCurrentTime)}`, 'success')}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Extract Frame</span>
                      </button>
                    </div>
                  </div>

                  {/* Keyframe Bookmarks */}
                  {evidence.videoDetails?.timestamps && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Critical Incident Video Markers</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {evidence.videoDetails.timestamps.map((ts, idx) => (
                          <button 
                            key={idx}
                            onClick={() => {
                              const [m, s] = ts.time.split(':').map(Number);
                              setVideoCurrentTime(m * 60 + s);
                              setIsPlayingVideo(true);
                              showToast(`Jumped to marker ${ts.time}`, 'info');
                            }}
                            className="p-2.5 bg-slate-950/70 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left space-y-1 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                {ts.time}
                              </span>
                              <Play className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
                            </div>
                            <div className="text-xs text-slate-200 font-medium line-clamp-2">{ts.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📷 SPECIALIZED 2: FORENSIC IMAGE ANALYSIS & MACRO OPTICAL LAB */}
              {(evidence.mediaType === 'image' || evidence.imageDetails) && (
                <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl shadow-xl border border-slate-800 space-y-4">
                  {/* Image Inspector Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-400/30">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center space-x-2">
                          <span>High-Resolution Forensic Image Lab</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                            {evidence.imageDetails?.resolution || '4096 x 2730'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {evidence.imageDetails?.sensor || 'Optical Comparative Sensor'}
                        </p>
                      </div>
                    </div>

                    {/* Filter Presets */}
                    <div className="flex items-center space-x-1">
                      {[
                        { id: 'normal', label: 'Standard' },
                        { id: 'contrast', label: 'High Contrast' },
                        { id: 'night', label: 'Low Light' },
                        { id: 'edge', label: 'AFIS Ridge' },
                        { id: 'thermal', label: 'Spectral' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setActiveImageFilter(f.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            activeImageFilter === f.id 
                              ? 'bg-cyan-600 text-white font-bold' 
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Image Viewport */}
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 max-h-[380px] flex items-center justify-center">
                    <img 
                      src={evidence.mediaUrl || evidence.thumbnailUrl || 'https://images.unsplash.com/photo-1584281722572-8ef96d65a88e?w=800'} 
                      alt={evidence.title} 
                      className={`w-full max-h-[380px] object-contain transition-all duration-300 ${getImageFilterStyle()}`}
                      style={{ transform: `scale(${imageZoom / 100})` }}
                    />

                    {/* Bounding Box Annotations Overlay */}
                    {showAnnotations && evidence.imageDetails?.annotations?.map((box, idx) => (
                      <div 
                        key={idx}
                        className="absolute border-2 border-cyan-400 bg-cyan-500/10 rounded pointer-events-none"
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.width}%`,
                          height: `${box.height}%`
                        }}
                      >
                        <span className="absolute -top-6 left-0 bg-slate-900/90 text-cyan-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-400/40 whitespace-nowrap">
                          {box.label}
                        </span>
                      </div>
                    ))}

                    {/* Floating Zoom Controls Bar */}
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs p-1.5 rounded-xl border border-slate-700 flex items-center space-x-1 text-white text-xs">
                      <button 
                        onClick={() => setImageZoom(prev => Math.max(50, prev - 25))}
                        className="p-1 hover:bg-slate-800 rounded cursor-pointer"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="px-1.5 font-mono text-[11px] font-bold">{imageZoom}%</span>
                      <button 
                        onClick={() => setImageZoom(prev => Math.min(250, prev + 25))}
                        className="p-1 hover:bg-slate-800 rounded cursor-pointer"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setImageZoom(100)}
                        className="p-1 hover:bg-slate-800 rounded cursor-pointer"
                        title="Reset zoom"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Image Metadata Bar */}
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span>EXIF: <strong className="text-white">{evidence.imageDetails?.exif || 'ISO 100 • 1/250s'}</strong></span>
                      <span>•</span>
                      <span>Annotations: <strong className="text-cyan-400">{evidence.imageDetails?.annotations?.length || 1} Features Highlighted</strong></span>
                    </div>

                    <button 
                      onClick={() => showToast('Exported calibrated forensic optical report', 'success')}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Raw Exhibit</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. TELECOM / CDR WIRETAP PLAYER */}
              {evidence.type === 'Telecommunication' && (
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                      <span className="font-bold text-sm">Lawful Telecom Audio Interception Playback</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Duration: 06m 24s • 44.1 kHz 16-bit</span>
                  </div>

                  {/* Waveform Player */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>CALL: {evidence.forensics?.sourceNumber || '+91 98201 12345'}</span>
                      <span className="text-rose-400 font-bold">LIVE RECONSTRUCTION</span>
                      <span>TARGET: {evidence.forensics?.targetNumber || '+91 98201 99887'}</span>
                    </div>

                    {/* Waveform bars */}
                    <div className="flex items-center justify-between h-12 gap-1 px-1">
                      {(evidence.forensics?.waveformSamples || [20, 45, 80, 60, 30, 95, 75, 40, 85, 90, 65, 30, 50, 70, 85, 40, 60, 35, 80, 20]).map((h, idx) => {
                        const isPlayed = (idx / 20) * 100 <= audioProgress;
                        return (
                          <div 
                            key={idx}
                            className={`flex-1 rounded-full transition-all duration-200 ${
                              isPlayed ? 'bg-rose-500' : 'bg-slate-700'
                            }`}
                            style={{ 
                              height: isPlayingAudio ? `${Math.max(15, (h * (0.6 + Math.random() * 0.5)))}%` : `${h}%` 
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between pt-1">
                      <button 
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md cursor-pointer"
                      >
                        {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isPlayingAudio ? 'Pause Wiretap Audio' : 'Play Intercepted Audio'}</span>
                      </button>

                      <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono">
                        <Volume2 className="w-4 h-4 text-slate-300" />
                        <span>Tower ID: {evidence.forensics?.cellTowerId || 'TWR-MUM-BND-4019'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transcript */}
                  {evidence.forensics?.transcriptSnippet && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Synchronized Transcript Extraction</div>
                      <div className="p-3 bg-slate-950/70 border border-slate-700/60 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                        {evidence.forensics.transcriptSnippet}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. FINANCIAL & HAWALA FLOW */}
              {evidence.type === 'Financial' && (
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-sm">FIU Transaction Velocity & Hawala Trail</span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      Quantum: {evidence.amount || '₹5,00,000'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase">Bank / Platform</div>
                      <div className="font-bold text-slate-200">{evidence.forensics?.bankName || 'HDFC Bank Ltd'}</div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase">Beneficiary Ledger</div>
                      <div className="font-bold text-slate-200">{evidence.forensics?.beneficiary || 'Zenith Logistics & Impex'}</div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase">UTR Reference</div>
                      <div className="font-mono font-bold text-amber-300">{evidence.forensics?.utr || 'HDFCR5202608280049210'}</div>
                    </div>
                  </div>

                  {evidence.forensics?.flowGraph && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fund Flow Sequence</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {evidence.forensics.flowGraph.map((flow, idx) => (
                          <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-1 relative">
                            <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
                              <span>STEP 0{idx + 1}: {flow.step}</span>
                              <span>{flow.time}</span>
                            </div>
                            <div className="font-bold text-slate-100 text-xs">{flow.entity}</div>
                            <div className="text-emerald-400 font-mono font-bold">{flow.amount}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. DIGITAL FORENSICS HARDWARE CLONE */}
              {evidence.type === 'Digital Forensics' && (
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-sm">UFED Physical Bitstream Extraction</span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                      Write-Block Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1.5">
                      <div className="text-[10px] text-slate-400 uppercase">Hardware Model</div>
                      <div className="font-bold text-slate-100">{evidence.forensics?.deviceModel || 'OnePlus 11 5G'}</div>
                      <div className="text-slate-400 text-[11px]">S/N: {evidence.forensics?.serialNumber || 'OP11-8849201948'}</div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1.5">
                      <div className="text-[10px] text-slate-400 uppercase">Forensic Extraction Suite</div>
                      <div className="font-bold text-slate-100">{evidence.forensics?.toolUsed || 'Cellebrite UFED v7.68'}</div>
                      <div className="text-slate-400 text-[11px]">OS: {evidence.forensics?.osVersion || 'Android 14'}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-700/60 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Recovered Artifacts Payload</div>
                    <div className="text-slate-200 text-xs">{evidence.forensics?.recoveredItems || '14 Deleted Signal Chats, 8 Geo-Tagged Photos'}</div>
                    <div className="text-blue-400 font-mono text-[11px] pt-1">EXIF GPS: {evidence.forensics?.gpsWaypoints || '19.0596° N, 72.8295° E'}</div>
                  </div>
                </div>
              )}

              {/* 4. SURVEILLANCE & ANPR */}
              {evidence.type === 'Surveillance' && (
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-sm">Automated Number Plate Recognition (ANPR)</span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      {evidence.forensics?.confidence || '99.4% Match'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase">License Plate</div>
                      <div className="font-mono font-bold text-lg text-emerald-400">{evidence.forensics?.plateNumber || 'MH 02 AB 1234'}</div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase">Vehicle Description</div>
                      <div className="font-bold text-slate-200">{evidence.forensics?.vehicleMake || 'Mahindra Scorpio N'}</div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase">Speed & Telemetry</div>
                      <div className="font-bold text-slate-200">{evidence.forensics?.speedRecorded || '104 km/h'}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-700/60 text-[11px] text-slate-300">
                    Camera Sensor Location: <strong className="text-white">{evidence.forensics?.cameraLocation || 'Lane 04, Khalapur Toll Plaza'}</strong>
                  </div>
                </div>
              )}

              {/* 5. BALLISTICS & PHYSICAL */}
              {evidence.type === 'Physical & Ballistics' && (
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-rose-400" />
                      <span className="font-bold text-sm">Forensic Science Laboratory (FSL) Ballistics Report</span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      {evidence.forensics?.striationMatchPercentage || '98.7% Striation Match'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase">Caliber & Specs</div>
                      <div className="font-bold text-slate-200">{evidence.forensics?.caliber || '9x19mm Parabellum'}</div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase">NAFIS AFIS Fingerprint Latent</div>
                      <div className="font-bold text-emerald-400">{evidence.forensics?.afisFingerprintMatch || 'Match Confirmed'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Linked Suspects */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Linked Persons of Interest</div>
                <div className="flex flex-wrap gap-2">
                  {(evidence.linkedEntities || ['P001']).map(entityId => {
                    const dossier = suspectDossiers?.find(d => d.id === entityId);
                    return (
                      <div 
                        key={entityId}
                        onClick={() => {
                          handleClose();
                          selectSuspectDossier(entityId);
                          navigate('dossiers');
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex items-center space-x-2.5 cursor-pointer transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] group-hover:bg-blue-600 transition-colors">
                          {entityId}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                            {dossier ? dossier.name : entityId}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {dossier ? dossier.role : 'Accused Person'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHAIN OF CUSTODY */}
          {activeTab === 'custody' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Statutory Chain of Custody (BNSS / CrPC)</h3>
                  <p className="text-slate-500 text-xs">Immutable chronological record of physical possession and forensic transfer</p>
                </div>
                <button 
                  onClick={() => showToast('Printed official Chain of Custody certificate', 'success')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(evidence.chainOfCustody || [
                  { step: 1, action: 'Seized at Crime Scene with 2 Independent Panchas', date: evidence.date, officer: evidence.officer || '—', location: evidence.seizureLocation || '—' },
                  { step: 2, action: 'Secured in Police Station Malkhana Vault', date: evidence.date, officer: evidence.officer || '—', location: evidence.custodyLocker || '—' }
                ]).map((custody, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">Stage 0{custody.step}: {custody.action}</span>
                        <span className="text-[10px] font-mono text-slate-500">{custody.date}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-xs pt-1">
                        <div>Custodial Officer: <strong className="text-slate-800">{custody.officer}</strong></div>
                        <div>Facility / Location: <strong className="text-slate-800">{custody.location}</strong></div>
                      </div>
                      <div className="flex items-center space-x-1.5 text-emerald-600 font-bold text-[10px] pt-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Biometrically Authenticated Digital Seal</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SHA-256 INTEGRITY */}
          {activeTab === 'integrity' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Cryptographic Evidence Integrity</h4>
                      <p className="text-slate-500 text-xs">Bitstream verification ensuring court admissibility under BSA Section 63</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 font-bold text-xs rounded-full border ${evidence.integrityVerified === null ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
                    {evidence.integrityVerified === null ? 'Not verified' : '100% UNTAMPERED'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SHA-256 Checksum Hash</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 break-all select-all">
                      {evidence.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </div>
                    <button 
                      onClick={copyHashToClipboard}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                      title="Copy SHA-256"
                    >
                      {isCopiedHash ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-500 text-xs">
                    Storage Vault ID: <strong className="text-slate-800">{evidence.custodyLocker || '—'}</strong>
                  </span>
                  <button 
                    onClick={handleVerifyIntegrity}
                    disabled={isVerifyingHash}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <ShieldCheck className={`w-4 h-4 ${isVerifyingHash ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingHash ? 'Re-Computing SHA-256...' : 'Run Integrity Audit'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI FORENSIC COPILOT */}
          {activeTab === 'ai' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span>AI Forensic Correlation Engine</span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Automated correlation analysis between Exhibit <strong className="text-indigo-900">{evidence.id}</strong> and active case network:
                </p>

                <div className="space-y-2 pt-1 text-slate-800 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                    <div className="font-bold text-indigo-950">1. Corroborating Telecom Timestamps</div>
                    <p className="text-slate-600 leading-relaxed">
                      Exhibit {evidence.id} coincides within a 12-minute window of burst call interactions recorded on CDR-00821.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                    <div className="font-bold text-indigo-950">2. Court Admissibility Rating (Sec 65B BSA)</div>
                    <p className="text-slate-600 leading-relaxed">
                      98% evidentiary strength. Certificate of electronic authenticity and independent panchanama are fully attached.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => {
                      handleClose();
                      askAI(`Conduct an in-depth evidentiary review for exhibit ${evidence.id}: ${evidence.title}`);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Open Interactive AI Investigation</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>State Forensic Science Laboratory CCTNS Certified</span>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={handleClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors text-xs"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
