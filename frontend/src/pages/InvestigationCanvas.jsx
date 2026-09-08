import React, { useRef, useState } from 'react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { mockEntities, mockEvidence } from '../data/mockData.js';
import { 
  Edit3, 
  Eraser, 
  Save, 
  MousePointer, 
  FileText, 
  UserPlus, 
  FolderPlus, 
  Plus, 
  Trash2, 
  History, 
  ChevronDown, 
  RotateCcw,
  Link2,
  Car,
  MapPin,
  CreditCard,
  X,
  Tag,
  Check,
  Activity,
  Layers,
  FilePlus,
  Sparkles,
  Download,
  LayoutTemplate,
  Bot,
  User,
  Phone,
  Building2,
  Landmark,
  FileSearch,
  StickyNote,
  HelpCircle
} from 'lucide-react';

export function InvestigationCanvas() {
  const { 
    currentCanvas, 
    setCurrentCanvas, 
    activeCaseId,
    activeCanvasTool, 
    setActiveCanvasTool, 
    activePenColor, 
    setActivePenColor, 
    activePenSize, 
    setActivePenSize, 
    clearDrawnPaths, 
    erasePath, 
    saveCanvas, 
    restoreCanvasVersion, 
    addToCanvas, 
    addCustomCanvasObject,
    removeCanvasObject, 
    editCanvasObject,
    addCanvasConnection,
    removeCanvasConnection,
    editCanvasConnection,
    clearCanvasConnections,
    autoLinkCanvasWithAI,
    openModal, 
  } = useInvestigation();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState([]);
  const boardRef = useRef(null);
  const [draggedObjId, setDraggedObjId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectSourceId, setConnectSourceId] = useState(null);
  const [hoveredPathId, setHoveredPathId] = useState(null);
  const [hoveredConnId, setHoveredConnId] = useState(null);

  const getCanvasCoords = (e) => {
    if (!boardRef.current) return { x: 0, y: 0 };
    const rect = boardRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.round(clientX - rect.left),
      y: Math.round(clientY - rect.top)
    };
  };

  const handleMouseDown = (e) => {
    if (activeCanvasTool === 'pen') {
      const coords = getCanvasCoords(e);
      setIsDrawing(true);
      setCurrentPathPoints([{ x: coords.x, y: coords.y }]);
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawing && activeCanvasTool === 'pen') {
      const coords = getCanvasCoords(e);
      setCurrentPathPoints(prev => [...prev, coords]);
    } else if (draggedObjId) {
      const coords = getCanvasCoords(e);
      setCurrentCanvas(prev => ({
        ...prev,
        objects: (prev.objects || []).map(obj => {
          if (obj.id === draggedObjId) {
            return {
              ...obj,
              x: Math.max(10, coords.x - dragOffset.x),
              y: Math.max(10, coords.y - dragOffset.y)
            };
          }
          return obj;
        })
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && activeCanvasTool === 'pen' && currentPathPoints.length > 1) {
      let d = `M ${currentPathPoints[0].x} ${currentPathPoints[0].y}`;
      for (let i = 1; i < currentPathPoints.length; i++) {
        d += ` L ${currentPathPoints[i].x} ${currentPathPoints[i].y}`;
      }
      const newPath = {
        id: `path-${Date.now()}`,
        color: activePenColor,
        width: activePenSize,
        d
      };
      setCurrentCanvas(prev => ({
        ...prev,
        drawnPaths: [...(prev.drawnPaths || []), newPath]
      }));
    }
    setIsDrawing(false);
    setCurrentPathPoints([]);
    setDraggedObjId(null);
  };

  const handleObjectMouseDown = (e, objId) => {
    if (activeCanvasTool === 'select') {
      e.stopPropagation();
      setDraggedObjId(objId);
      const coords = getCanvasCoords(e);
      const obj = (currentCanvas.objects || []).find(o => o.id === objId);
      if (obj) {
        setDragOffset({
          x: coords.x - obj.x,
          y: coords.y - obj.y
        });
      }
    } else if (activeCanvasTool === 'connect') {
      e.stopPropagation();
      if (!connectSourceId) {
        setConnectSourceId(objId);
        showToast('Selected first card. Now click target card to connect with yarn string!', 'info');
      } else if (connectSourceId !== objId) {
        addCanvasConnection(connectSourceId, objId, 'Investigation Link', '#dc2626', 'solid');
        setConnectSourceId(null);
      } else {
        setConnectSourceId(null);
      }
    } else if (activeCanvasTool === 'eraser') {
      e.stopPropagation();
      removeCanvasObject(objId);
    }
  };

  // Helper to find coordinates of card centers for dynamic connection lines
  const getCardCenter = (cardId) => {
    const card = (currentCanvas.objects || []).find(o => o.id === cardId);
    if (!card) return null;
    return {
      x: card.x + 115, // Approximate card center X
      y: card.y + 45   // Approximate card center Y
    };
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-200 font-sans">
      {/* Standalone Section Header for Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm font-sans text-xs">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            <LayoutTemplate className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive Corkboard Investigation Studio</h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                DYNAMIC RED YARN ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add suspect cards, connect red yarn string links, sketch tactical stroke annotations, and synthesize intelligence correlations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button 
            type="button"
            onClick={() => autoLinkCanvasWithAI()}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-purple-600/20 flex items-center space-x-2 transition-transform transform hover:scale-105 cursor-pointer"
            title="Use AI to automatically synthesize red yarn connection strings between related suspects and evidence"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>✨ AI Auto-Link Yarn</span>
          </button>

          <button 
            type="button"
            onClick={() => openModal('add-custom-canvas-object')}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 flex items-center space-x-2 transition-transform transform hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-300" />
            <span>+ Add Card / Lead</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              showToast(`Exported high-resolution snapshot for ${currentCanvas.title} (PNG/PDF)`, 'success');
            }}
            className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Export Corkboard Snapshot"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button 
            type="button"
            onClick={saveCanvas}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/10 flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Board</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Studio Panel */}
      <div className="h-[calc(100vh-14rem)] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl font-mono text-xs transition-colors">
        {/* Controls Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-bold">BOARD:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{currentCanvas.title}</span>
            </div>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-bold">CANVAS ID:</span>
              <span className="text-blue-700 dark:text-blue-400 font-bold">{currentCanvas.id}</span>
            </div>
          </div>

          {/* Ink & Stroke Palette */}
          <div className="flex items-center space-x-4 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 text-[11px] font-bold uppercase">Ink Color:</span>
              {['#ef4444', '#2563eb', '#f59e0b', '#10b981', '#1e293b'].map(c => (
                <button 
                  key={c}
                  onClick={() => { setActivePenColor(c); setActiveCanvasTool('pen'); }}
                  className={`w-5 h-5 rounded-full ring-2 transition-all ${activePenColor === c && activeCanvasTool === 'pen' ? 'ring-slate-900 scale-110' : 'ring-transparent'}`}
                  style={{ backgroundColor: c }}
                  title={`Select ink color ${c}`}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200"></div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 text-[11px] font-bold uppercase">Stroke:</span>
              {[2, 4, 8].map(s => (
                <button 
                  key={s}
                  onClick={() => { setActivePenSize(s); setActiveCanvasTool('pen'); }}
                  className={`px-2 py-0.5 rounded font-bold text-[11px] transition-all ${activePenSize === s && activeCanvasTool === 'pen' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          {/* Version History Dropdown */}
          <div className="relative group">
            <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 font-bold shadow-sm">
              <History className="w-3.5 h-3.5 text-purple-600" />
              <span>{currentCanvas.version}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute right-0 top-9 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
              <div className="text-[10px] uppercase text-slate-400 font-bold px-2 py-1">Restore Version</div>
              {(currentCanvas.versionsAvailable || ['Version 1', 'Version 2', 'Version 3 (Latest)']).map(v => (
                <button 
                  key={v}
                  onClick={() => restoreCanvasVersion(v)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-between"
                >
                  <span>{v}</span>
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Body: Left Tools + Interactive Board Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Toolbar */}
          <div className="w-full md:w-60 bg-slate-50 dark:bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-3.5 flex flex-col justify-between shrink-0 select-none overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 px-2">Drawing & Tool Modes</div>
                <div className="space-y-1">
                  <button 
                    onClick={() => { setActiveCanvasTool('select'); setConnectSourceId(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all ${
                      activeCanvasTool === 'select' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <MousePointer className="w-4 h-4" />
                    <span>Select & Drag Cards</span>
                  </button>

                  <button 
                    onClick={() => { setActiveCanvasTool('pen'); setConnectSourceId(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all ${
                      activeCanvasTool === 'pen' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Freehand Pen / Sketch</span>
                  </button>

                  <button 
                    onClick={() => { setActiveCanvasTool('connect'); setConnectSourceId(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all ${
                      activeCanvasTool === 'connect' ? 'bg-red-600 text-white shadow-md animate-pulse' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    title="Click card A then card B to link with red yarn"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>🔗 Connect Cards (Yarn)</span>
                  </button>

                  <button 
                    onClick={() => { setActiveCanvasTool('eraser'); setConnectSourceId(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all ${
                      activeCanvasTool === 'eraser' ? 'bg-amber-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    title="Click any freehand stroke, yarn line, or card to erase it"
                  >
                    <Eraser className="w-4 h-4" />
                    <span>Stroke Line Eraser</span>
                  </button>
                </div>
              </div>

              {/* Add Items By User Decision */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 px-2">Add Items To Board</div>
                <div className="space-y-1">
                  <button 
                    onClick={() => openModal('add-custom-canvas-object', { defaultType: 'note', defaultTitle: 'Investigator Lead' })} 
                    className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 flex items-center space-x-2 font-bold shadow-xs transition-colors"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>+ Text Note</span>
                  </button>

                  <button 
                    onClick={() => openModal('add-custom-canvas-object', { defaultType: 'entity', defaultTitle: 'P022: Suspect Name' })} 
                    className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 flex items-center space-x-2 font-bold shadow-xs transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-red-600" />
                    <span>+ Entity / Suspect</span>
                  </button>

                  <button 
                    onClick={() => openModal('add-custom-canvas-object', { defaultType: 'evidence', defaultTitle: 'EV-902: Seizure / Record' })} 
                    className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 flex items-center space-x-2 font-bold shadow-xs transition-colors"
                  >
                    <FolderPlus className="w-4 h-4 text-amber-600" />
                    <span>+ Evidence Card</span>
                  </button>

                  <button 
                    onClick={() => openModal('add-custom-canvas-object', { defaultType: 'vehicle', defaultTitle: 'MH-01-AX-9999 (Getaway Car)' })} 
                    className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center space-x-2 font-bold shadow-xs transition-colors"
                  >
                    <Car className="w-4 h-4 text-emerald-600" />
                    <span>+ Vehicle / Asset</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 px-2">Quick Entity Palette</div>
                <div className="space-y-1.5">
                  {(mockEntities || []).slice(0, 3).map(e => (
                    <button 
                      key={e.id}
                      onClick={() => addToCanvas(e.id)}
                      className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-between text-[11px] font-bold shadow-sm transition-all"
                    >
                      <span>{e.id} ({e.name.split(' ')[0]})</span>
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Board Cleaners */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 px-2">Eraser & Reset Tools</div>
                
                <button 
                  onClick={clearDrawnPaths}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center space-x-1.5 font-bold text-[11px]"
                >
                  <Eraser className="w-3.5 h-3.5 text-amber-600" />
                  <span>Clear Freehand Strokes</span>
                </button>

                <button 
                  onClick={clearCanvasConnections}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center space-x-1.5 font-bold text-[11px]"
                >
                  <Link2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Clear All Yarn Strings</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
                <button 
                  onClick={() => {
                    openModal('audit-warning', {
                      title: 'Clear Entire Canvas Board?',
                      message: 'This will reset all pinned cards, connections, and freehand drawings on this board.',
                      onConfirm: () => {
                        setCurrentCanvas(prev => ({ ...prev, objects: [], drawnPaths: [], connections: [] }));
                        showToast('Canvas board completely reset', 'warning');
                      }
                    });
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center space-x-2 font-bold transition-colors"
                >
                <Trash2 className="w-4 h-4" />
                <span>Reset Entire Board</span>
              </button>
            </div>
          </div>

          {/* Corkboard Interactive Drawing Area */}
          <div 
            ref={boardRef}
            className={`flex-1 canvas-grid-bg relative overflow-hidden p-6 select-none ${
              activeCanvasTool === 'pen' ? 'cursor-crosshair' : activeCanvasTool === 'eraser' ? 'cursor-no-drop' : activeCanvasTool === 'connect' ? 'cursor-pointer' : 'cursor-default'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            {/* SVG Dynamic Yarn & Freehand Vector Paths Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
              <defs>
                <filter id="yarn-shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.3"/>
                </filter>
              </defs>

              {/* DYNAMIC RED YARN STRINGS / CONNECTIONS */}
              {(currentCanvas.connections || []).map((conn, idx) => {
                const p1 = getCardCenter(conn.from);
                const p2 = getCardCenter(conn.to);
                if (!p1 || !p2) return null;

                const connId = conn.id || `conn-${idx}`;
                const isHovered = hoveredConnId === connId;
                const midX = Math.round((p1.x + p2.x) / 2);
                const midY = Math.round((p1.y + p2.y) / 2);

                return (
                  <g key={connId} className="transition-all">
                    {/* Background wider hit-test line for easy clicking/erasing */}
                    <line 
                      x1={p1.x} 
                      y1={p1.y} 
                      x2={p2.x} 
                      y2={p2.y} 
                      stroke="transparent" 
                      strokeWidth="18"
                      className="pointer-events-auto cursor-pointer"
                      onMouseEnter={() => setHoveredConnId(connId)}
                      onMouseLeave={() => setHoveredConnId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeCanvasTool === 'eraser') {
                          removeCanvasConnection(connId);
                        } else {
                          openModal('edit-canvas-connection', { id: connId, ...conn });
                        }
                      }}
                    />

                    {/* Actual Visible Edge String */}
                    <line 
                      x1={p1.x} 
                      y1={p1.y} 
                      x2={p2.x} 
                      y2={p2.y} 
                      stroke={isHovered && activeCanvasTool === 'eraser' ? '#ef4444' : (conn.color || (isHovered ? '#475569' : '#94a3b8'))} 
                      strokeWidth={isHovered ? (activeCanvasTool === 'eraser' ? 4 : 3) : 2} 
                      strokeDasharray={conn.style === 'dashed' ? '6,4' : conn.style === 'dotted' ? '2,4' : 'none'}
                      filter="url(#yarn-shadow)"
                      className={`pointer-events-none transition-all opacity-90 ${isHovered && activeCanvasTool === 'eraser' ? 'opacity-100 stroke-red-600' : ''}`}
                    />
                  </g>
                );
              })}

              {/* Freehand Vector Paths */}
              {(currentCanvas.drawnPaths || []).map(p => (
                <path 
                  key={p.id}
                  d={p.d}
                  stroke={hoveredPathId === p.id && activeCanvasTool === 'eraser' ? '#ef4444' : p.color}
                  strokeWidth={p.width + (activeCanvasTool === 'eraser' ? 6 : 0)}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  onMouseEnter={() => setHoveredPathId(p.id)}
                  onMouseLeave={() => setHoveredPathId(null)}
                  className={`transition-colors ${
                    activeCanvasTool === 'eraser' 
                      ? 'cursor-pointer pointer-events-auto hover:stroke-red-600 opacity-90' 
                      : 'pointer-events-none'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeCanvasTool === 'eraser') erasePath(p.id);
                  }}
                />
              ))}

              {/* Active Drawing Stroke Preview */}
              {isDrawing && currentPathPoints.length > 1 && (
                <path 
                  d={`M ${currentPathPoints[0].x} ${currentPathPoints[0].y} ${currentPathPoints.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ')}`}
                  stroke={activePenColor}
                  strokeWidth={activePenSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {/* Placed Drag & Drop Canvas Object Cards */}
            <div className="relative w-full h-full z-20">
              {/* Dynamic Connection Badges / Labels placed above cards */}
              {(currentCanvas.connections || []).map((conn, idx) => {
                const p1 = getCardCenter(conn.from);
                const p2 = getCardCenter(conn.to);
                if (!p1 || !p2) return null;

                const connId = conn.id || `conn-${idx}`;
                const midX = Math.round((p1.x + p2.x) / 2);
                const midY = Math.round((p1.y + p2.y) / 2);

                return (
                  <div
                    key={`badge-${connId}`}
                    style={{ left: `${midX}px`, top: `${midY}px`, transform: 'translate(-50%, -50%)' }}
                    className="absolute z-10 group"
                  >
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeCanvasTool === 'eraser') {
                          removeCanvasConnection(connId);
                        } else {
                          openModal('edit-canvas-connection', { id: connId, ...conn });
                        }
                      }}
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shadow-xs cursor-pointer flex items-center space-x-1 whitespace-nowrap transition-transform transform hover:scale-105 ${
                        activeCanvasTool === 'eraser'
                          ? 'bg-red-50/90 dark:bg-red-900/90 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-800 backdrop-blur-sm'
                          : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 backdrop-blur-sm'
                      }`}
                      title="Click to edit link / label or erase"
                    >
                      <span className="truncate max-w-[120px]">{conn.label || 'Link'}</span>
                      {activeCanvasTool === 'eraser' ? (
                        <Trash2 className="w-2.5 h-2.5 text-red-600 shrink-0" />
                      ) : (
                        <Edit3 className="w-2.5 h-2.5 text-slate-400 hover:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Actual Cards */}
              {(currentCanvas.objects || []).map(obj => {
                const isConnectSource = connectSourceId === obj.id;

                const getStyling = (type) => {
                  const t = (type || '').toLowerCase();
                  if (t.includes('person') || t.includes('suspect') || t.includes('entity')) return { Icon: User, borderColor: 'border-t-rose-500', iconColor: 'text-rose-600', bgClass: 'bg-rose-50' };
                  if (t.includes('phone')) return { Icon: Phone, borderColor: 'border-t-blue-500', iconColor: 'text-blue-600', bgClass: 'bg-blue-50' };
                  if (t.includes('vehicle') || t.includes('car')) return { Icon: Car, borderColor: 'border-t-amber-500', iconColor: 'text-amber-600', bgClass: 'bg-amber-50' };
                  if (t.includes('location')) return { Icon: MapPin, borderColor: 'border-t-emerald-500', iconColor: 'text-emerald-600', bgClass: 'bg-emerald-50' };
                  if (t.includes('fir') || t.includes('document')) return { Icon: FileText, borderColor: 'border-t-slate-500', iconColor: 'text-slate-600', bgClass: 'bg-slate-50' };
                  if (t.includes('bank') || t.includes('account')) return { Icon: Landmark, borderColor: 'border-t-indigo-500', iconColor: 'text-indigo-600', bgClass: 'bg-indigo-50' };
                  if (t.includes('organization') || t.includes('company')) return { Icon: Building2, borderColor: 'border-t-sky-500', iconColor: 'text-sky-600', bgClass: 'bg-sky-50' };
                  if (t.includes('evidence')) return { Icon: FileSearch, borderColor: 'border-t-indigo-500', iconColor: 'text-indigo-600', bgClass: 'bg-indigo-50' };
                  if (t.includes('note')) return { Icon: StickyNote, borderColor: 'border-t-amber-500', iconColor: 'text-amber-600', bgClass: 'bg-amber-50' };
                  return { Icon: HelpCircle, borderColor: 'border-t-slate-400', iconColor: 'text-slate-500', bgClass: 'bg-slate-50' };
                };
                
                const styling = getStyling(obj.type);
                const TypeIcon = styling.Icon;

                return (
                  <div 
                    key={obj.id}
                    style={{ left: `${obj.x}px`, top: `${obj.y}px` }}
                    className={`absolute z-20 min-w-[220px] max-w-[280px] p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-lg transition-all glass-panel group select-none border-t-4 ${styling.borderColor} ${
                      isConnectSource 
                        ? 'ring-4 ring-red-500 scale-105 shadow-2xl' 
                        : activeCanvasTool === 'connect'
                        ? 'hover:ring-2 hover:ring-blue-400 cursor-pointer'
                        : activeCanvasTool === 'eraser'
                        ? 'hover:border-red-500 hover:bg-red-50/50 cursor-no-drop'
                        : 'cursor-grab active:cursor-grabbing hover:border-blue-500'
                    }`}
                    onMouseDown={(e) => handleObjectMouseDown(e, obj.id)}
                  >
                    {/* Pushpin at top center of card */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80"></div>
                    </div>

                    <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className={`p-1.5 rounded-lg ${styling.bgClass} ${styling.iconColor}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">
                          {obj.type || 'NOTE'}
                        </span>
                      </div>

                      {/* Action Controls: [Link], [Edit], [Remove] */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (connectSourceId === obj.id) {
                              setConnectSourceId(null);
                            } else {
                              setConnectSourceId(obj.id);
                              setActiveCanvasTool('connect');
                              showToast(`Connecting from ${obj.id}. Now click target card!`, 'info');
                            }
                          }}
                          className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center transition-all shadow-xs ${
                            isConnectSource ? 'bg-red-600 text-white' : 'bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700'
                          }`}
                          title="Connect red yarn string from this card to another"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('edit-canvas-object', obj);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border-none text-[10px] font-bold flex items-center shadow-xs transition-colors"
                          title="Edit card content & color"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCanvasObject(obj.id);
                          }}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border-none text-[10px] font-bold flex items-center shadow-xs transition-colors"
                          title="Remove card from board"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div 
                      onDoubleClick={() => openModal('edit-canvas-object', obj)}
                      className="font-sans text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug whitespace-pre-wrap cursor-pointer hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                      title="Double-click to edit"
                    >
                      {obj.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Status Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between font-mono text-xs px-6 gap-2">
          <div className="flex items-center space-x-3">
            <span className="text-slate-500 font-bold">MODE:</span>
            <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase ${
              activeCanvasTool === 'pen' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : activeCanvasTool === 'connect'
                ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                : activeCanvasTool === 'eraser'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {activeCanvasTool === 'pen' && '✏️ Freehand Sketch Ink'}
              {activeCanvasTool === 'connect' && '🔗 Click 2 Cards to Connect Red String'}
              {activeCanvasTool === 'eraser' && '🧹 Click Any Stroke/String/Card to Erase'}
              {activeCanvasTool === 'select' && '🖐️ Select & Drag Cards'}
            </span>
          </div>
          
          <div className="text-slate-500 text-[11px] font-medium hidden sm:flex items-center space-x-2">
            <span>• Double-click any card to edit text</span>
            <span>• Use "+ Add Custom Card" for notes, evidence & suspects</span>
            <span>• Click "🔗" on cards to link them</span>
          </div>
        </div>
      </div>
    </div>
  );
}
