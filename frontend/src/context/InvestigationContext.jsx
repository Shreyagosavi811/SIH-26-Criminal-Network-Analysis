import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  mockUsers, 
  mockCases, 
  mockEntities, 
  mockEvidence, 
  mockCanvasBoards, 
  mockSuspectDossiers 
} from '../data/mockData.js';
import { mockFIRDetails, generateRealFIRRecord } from '../data/mockFIRs.js';

const InvestigationContext = createContext();

export function InvestigationProvider({ children }) {
  // Authentication & Current User
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_currentUser');
      return saved ? JSON.parse(saved) : mockUsers[0];
    } catch {
      return mockUsers[0];
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Dynamic Cases State & Registered FIRs
  const [cases, setCases] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_cases');
      return saved ? JSON.parse(saved) : mockCases;
    } catch {
      return mockCases;
    }
  });

  // Backend Integration State (MVP Phase 1)
  const [backendStatus, setBackendStatus] = useState({ online: false, status: 'checking', records: 0 });
  const [availableScenarios, setAvailableScenarios] = useState([]);
  const [backendCases, setBackendCases] = useState(null);
  const [backendEvidence, setBackendEvidence] = useState(null);
  const [backendHotspots, setBackendHotspots] = useState(null);
  const [backendSuspects, setBackendSuspects] = useState(null);
  const [backendTimeline, setBackendTimeline] = useState(null);
  const [backendNetwork, setBackendNetwork] = useState(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const [healthRes, scenariosRes] = await Promise.all([
          fetch('http://localhost:8000/api/health').catch(() => null),
          fetch('http://localhost:8000/api/scenarios').catch(() => null)
        ]);
        
        if (healthRes && healthRes.ok) {
          const health = await healthRes.json();
          setBackendStatus({ online: true, status: health.status, records: health.records });
        } else {
          setBackendStatus(prev => ({ ...prev, status: 'offline' }));
        }

        if (scenariosRes && scenariosRes.ok) {
          const scenarios = await scenariosRes.json();
          setAvailableScenarios(scenarios);
          
          // PHASE 2A: Fetch real observed FIRs for the dashboard
          const defaultScenario = scenarios[0]?.scenario_id || 'S01';
          try {
            const firRes = await fetch(`http://localhost:8000/api/records?scenario_id=${defaultScenario}&source_type=cctns_fir_records`);
            if (firRes.ok) {
              const data = await firRes.json();
              
              // Map observed records to UI format
              const mappedCases = (data.records || []).map(r => {
                const raw = r.raw_content || {};
                
                // Determine priority and status deterministically from observed data
                const status = raw.status === 'UNDER_INVESTIGATION' ? 'ACTIVE' : 
                               raw.status === 'CHARGE_SHEETED' ? 'CLOSED' : 'PENDING';
                
                const isSerious = (raw.ipc_sections || []).some(ipc => ipc.includes('302') || ipc.includes('384') || ipc.includes('420'));
                const priority = isSerious ? 'HIGH' : 'MEDIUM';

                return {
                  id: raw.fir_no || r.source_record_id,
                  title: `FIR ${raw.police_station || ''}`,
                  description: raw.complaint_summary || r.normalized_text,
                  priority: priority,
                  status: status,
                  category: raw.offence_category || 'Investigation',
                  district: raw.district || 'Unknown',
                  assignedTo: raw.investigating_officer || 'Unassigned',
                  lastUpdated: raw.registration_datetime ? raw.registration_datetime.split('T')[0] : 'N/A',
                  date: raw.registration_datetime ? raw.registration_datetime.split('T')[0] : 'N/A'
                };
              });
              setBackendCases(mappedCases);
            }
          } catch (fetchErr) {
            console.error("Failed to fetch backend cases", fetchErr);
          }

          // PHASE 2C: Fetch all observed records for Evidence Vault
          try {
            const evRes = await fetch(`http://localhost:8000/api/records?scenario_id=${defaultScenario}`);
            if (evRes.ok) {
              const data = await evRes.json();
              const mappedEvidence = (data.records || []).map(r => {
                const raw = r.raw_content || {};
                const stype = r.source_type || 'unknown';
                
                // Category Mapping
                let category = 'Legal & Statutory';
                if (['cbs_bank_transactions', 'fiu_str_alerts'].includes(stype)) category = 'Financial';
                if (['telecom_cdr_logs'].includes(stype)) category = 'Telecommunication';
                if (['cell_tower_dumps', 'osint_social_posts'].includes(stype)) category = 'Digital Forensics';
                if (['toll_anpr_logs', 'field_intelligence_notes'].includes(stype)) category = 'Surveillance';
                
                // Title Mapping
                const titleMap = {
                  cbs_bank_transactions: 'Bank Transaction',
                  fiu_str_alerts: 'FIU Alert',
                  telecom_cdr_logs: 'CDR Log',
                  cell_tower_dumps: 'Cell Tower Dump',
                  telecom_caf_kyc: 'CAF KYC Record',
                  osint_social_posts: 'OSINT Post',
                  toll_anpr_logs: 'ANPR Log',
                  field_intelligence_notes: 'Field Intelligence Note',
                  criminal_history_db: 'Criminal History Record',
                  cctns_fir_records: 'FIR Document'
                };
                const prefix = titleMap[stype] || 'Evidence';
                const title = `${prefix} ${r.source_record_id}`;

                // Suspicion / Risk (only from explicit fields)
                let suspicion = 'NEUTRAL';
                if (stype === 'fiu_str_alerts' && raw.risk_indicator) {
                  suspicion = (raw.risk_indicator === 'LARGE_CASH' || raw.risk_indicator === 'HIGH') ? 'HIGH' : 'MEDIUM';
                }

                return {
                  id: r.source_record_id,
                  title: title,
                  description: r.normalized_text,
                  type: category,
                  category: category,
                  linkedEntities: r.entity_refs || [],
                  seizureLocation: (r.location_refs && r.location_refs.length > 0) ? r.location_refs[0] : null,
                  date: r.timestamp || null,
                  officer: raw.investigating_officer || null,
                  suspicion: suspicion,
                  integrityVerified: null,
                  custodyLocker: null,
                  mediaType: 'document',
                  tags: [stype],
                  sourceType: stype
                };
              });
              setBackendEvidence(mappedEvidence);

              // PHASE 2D: Fetch Crime Tracker Hotspots (Cell Tower Dumps ONLY)
              const hotspotRecords = (data.records || []).filter(r => r.source_type === 'cell_tower_dumps' && r.raw_content && r.raw_content.lat);
              const mappedHotspots = hotspotRecords.map(r => {
                const raw = r.raw_content;
                const deviceCount = (raw.phone_numbers || []).length;
                return {
                  id: r.source_record_id,
                  lat: raw.lat,
                  lng: raw.lon,
                  name: raw.estimated_area || 'Cell Tower',
                  label: raw.estimated_area || 'Cell Tower',
                  category: 'Telecommunication',
                  timestamp: r.timestamp,
                  timeWindow: raw.timestamp_window || 'N/A',
                  towerId: raw.tower_id || 'Unknown',
                  suspects: r.entity_refs || [],
                  cases: `${deviceCount} Devices Logged`,
                  intensity: null,
                  activeThreat: '—',
                  caseId: '—',
                  officer: '—',
                  details: r.normalized_text,
                  coordinates: `${raw.lat}° N, ${raw.lon}° E`,
                  glowColor: '#3b82f6',
                  pulseColor: '#93c5fd'
                };
              });

              // Group duplicates by identical coordinates (Option B)
              const groupedHotspotsMap = {};
              mappedHotspots.forEach(h => {
                const key = `${h.lat}-${h.lng}`;
                if (!groupedHotspotsMap[key]) {
                  groupedHotspotsMap[key] = { ...h, observations: 1, allDevices: (h.suspects || []).length };
                } else {
                  groupedHotspotsMap[key].observations += 1;
                  groupedHotspotsMap[key].allDevices += (h.suspects || []).length;
                }
              });

              const finalHotspots = Object.values(groupedHotspotsMap).map(h => ({
                ...h,
                cases: h.observations > 1 ? `${h.observations} Tower Observations` : h.cases,
                details: h.observations > 1 ? `Multiple tower dumps recorded in this area. Devices tracked across observations: ${h.allDevices}` : h.details,
                id: h.observations > 1 ? `GROUP-${h.id}` : h.id
              }));

              setBackendHotspots(finalHotspots);

              // PHASE 2E: Fetch Suspect Dossiers (Observed Persons)
              const suspectMap = {};
              (data.records || []).forEach(r => {
                const stype = r.source_type;
                const raw = r.raw_content || {};
                const namesInRecord = [];
                
                if (stype === 'criminal_history_db' && raw.person_reference) namesInRecord.push(raw.person_reference);
                if (stype === 'telecom_caf_kyc' && raw.subscriber_name) namesInRecord.push(raw.subscriber_name);
                if (stype === 'cctns_fir_records') {
                   (raw.accused_details || []).forEach(a => { if (a.name) namesInRecord.push(a.name); });
                   if (raw.complainant_name) namesInRecord.push(raw.complainant_name);
                }
                (r.entity_refs || []).forEach(e => {
                   if (e.includes(' ') && !/\d/.test(e) && !namesInRecord.includes(e)) namesInRecord.push(e);
                });
                
                namesInRecord.forEach(name => {
                  const n = name.trim();
                  if (!n || n === 'Unknown' || n === 'System' || n === 'Unidentified Person') return;
                  if (!suspectMap[n]) {
                    suspectMap[n] = {
                       id: `PERSON-${n.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`,
                       name: n,
                       code: '—',
                       gender: '—',
                       dob: '—',
                       height: '—',
                       nationality: '—',
                       career: '—',
                       squad: '—',
                       status: 'Observed Person',
                       trackCode: '—',
                       photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
                       bpm: null,
                       dnaMatch: null,
                       riskRating: null, // Neutral
                       recentOp: '—',
                       fingerprintPattern: '—',
                       irisScore: null,
                       facialConfidence: null,
                       sources: new Set(),
                       linkedRecords: [],
                       linkedEntities: new Set(),
                       locations: new Set(),
                       history: []
                    };
                  }
                  
                  const s = suspectMap[n];
                  s.sources.add(stype);
                  if (!s.linkedRecords.includes(r.source_record_id)) {
                    s.linkedRecords.push(r.source_record_id);
                  }
                  (r.entity_refs || []).forEach(e => {
                    if (e !== n) s.linkedEntities.add(e);
                  });
                  (r.location_refs || []).forEach(l => s.locations.add(l));
                  
                  if (stype === 'criminal_history_db') {
                     s.history.push(`${raw.offence_category || 'Record'} (${raw.case_year || 'Unknown Year'})`);
                  }
                });
              });

              const mappedSuspects = Object.values(suspectMap).map(s => ({
                ...s,
                sources: Array.from(s.sources),
                linkedEntities: Array.from(s.linkedEntities),
                locations: Array.from(s.locations),
                career: s.history.length > 0 ? 'Criminal history record available' : '—',
                recentOp: Array.from(s.sources).join(', ')
              }));
              setBackendSuspects(mappedSuspects);

              // PHASE 2F: Fetch Timeline Events
              const sortedRecords = [...(data.records || [])].sort((a, b) => {
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                return new Date(a.timestamp) - new Date(b.timestamp);
              });

              const timeline = sortedRecords.filter(r => r.timestamp).map(r => {
                const stype = r.source_type || 'unknown';
                
                let category = 'Legal & Statutory';
                if (['cbs_bank_transactions', 'fiu_str_alerts'].includes(stype)) category = 'Financial';
                if (['telecom_cdr_logs'].includes(stype)) category = 'Telecommunication';
                if (['cell_tower_dumps', 'osint_social_posts'].includes(stype)) category = 'Digital Forensics';
                if (['toll_anpr_logs', 'field_intelligence_notes'].includes(stype)) category = 'Surveillance';
                
                const titleMap = {
                  cctns_fir_records: 'FIR',
                  criminal_history_db: 'Criminal History',
                  telecom_caf_kyc: 'KYC',
                  telecom_cdr_logs: 'CDR',
                  cell_tower_dumps: 'Cell Tower',
                  cbs_bank_transactions: 'Bank Transaction',
                  fiu_str_alerts: 'FIU Alert',
                  osint_social_posts: 'OSINT',
                  field_intelligence_notes: 'Field Intelligence',
                  toll_anpr_logs: 'ANPR'
                };
                const evTitle = `Source: ${titleMap[stype] || 'Unknown'} - ${r.source_record_id}`;

                let caseRef = null;
                if (stype === 'cctns_fir_records') caseRef = r.raw_content?.fir_no;
                if (stype === 'criminal_history_db') caseRef = r.raw_content?.case_reference;
                
                return {
                  id: r.source_record_id,
                  time: r.timestamp.replace('T', ' ').replace('Z', ''),
                  category: category,
                  title: evTitle,
                  description: r.normalized_text,
                  entities: r.entity_refs || [],
                  location: (r.location_refs && r.location_refs.length > 0) ? r.location_refs[0] : null,
                  caseRef: caseRef || null,
                  sourceType: stype
                };
              });
              setBackendTimeline(timeline);
            }

            // PHASE 2G: Fetch Network Graph
            const netRes = await fetch(`http://localhost:8000/api/network/${defaultScenario}`).catch(() => null);
            if (netRes && netRes.ok) {
              const netData = await netRes.json();
              setBackendNetwork(netData);
            }

          } catch (evErr) {
            console.error("Failed to fetch backend evidence", evErr);
          }
        }
      } catch (err) {
        setBackendStatus({ online: false, status: 'offline', records: 0 });
      }
    };
    checkBackend();
  }, []);

  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'tracker', 'dossiers', 'overview', 'analysis', 'canvas', 'users', 'settings'
  const [activeCaseId, setActiveCaseId] = useState('FIR-104');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('network'); // 'network', 'evidence', 'timeline', 'documents', 'entities'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Region & Category Filters (Image 1 Specs)
  const [activeRegionFilter, setActiveRegionFilter] = useState('All India');
  const [activeCaseCategoryTab, setActiveCaseCategoryTab] = useState('recent'); // 'recent' (20 count) or 'old' (2000 count)

  // Selection & Details State
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  
  // Evidence Vault & Forensics State with localStorage
  const [evidenceList, setEvidenceList] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_evidence_list');
      return saved ? JSON.parse(saved) : mockEvidence;
    } catch {
      return mockEvidence;
    }
  });

  // Suspect Dossiers & Biometrics State with localStorage
  const [suspectDossiers, setSuspectDossiers] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_suspect_dossiers');
      return saved ? JSON.parse(saved) : mockSuspectDossiers;
    } catch {
      return mockSuspectDossiers;
    }
  });
  const [selectedSuspectDossier, setSelectedSuspectDossier] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_suspect_dossiers');
      const list = saved ? JSON.parse(saved) : mockSuspectDossiers;
      return list[0] || mockSuspectDossiers[0];
    } catch {
      return mockSuspectDossiers[0];
    }
  });

  // Canvas Board & Drawing State
  const [currentCanvas, setCurrentCanvas] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_currentCanvas');
      if (saved) return JSON.parse(saved);
    } catch {}

    const base = JSON.parse(JSON.stringify(mockCanvasBoards[0]));
    if (!base.drawnPaths) {
      base.drawnPaths = [
        { id: 'path-demo-1', color: '#ef4444', width: 3, d: 'M 220 140 Q 350 80 440 220' },
        { id: 'path-demo-2', color: '#f59e0b', width: 3, d: 'M 440 240 Q 560 300 660 140' }
      ];
    }
    return base;
  });

  // Auto-persist to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem('sih_cases', JSON.stringify(cases));
    } catch (e) {
      console.warn('LocalStorage save failed for cases:', e);
    }
  }, [cases]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_currentCanvas', JSON.stringify(currentCanvas));
    } catch (e) {
      console.warn('LocalStorage save failed for canvas:', e);
    }
  }, [currentCanvas]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_currentUser', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_evidence_list', JSON.stringify(evidenceList));
    } catch (e) {
      console.warn('LocalStorage save failed for evidenceList:', e);
    }
  }, [evidenceList]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_suspect_dossiers', JSON.stringify(suspectDossiers));
    } catch (e) {
      console.warn('LocalStorage save failed for suspectDossiers:', e);
    }
  }, [suspectDossiers]);
  const [activeCanvasTool, setActiveCanvasTool] = useState('select'); // 'select', 'pen', 'eraser'
  const [activePenColor, setActivePenColor] = useState('#ef4444');
  const [activePenSize, setActivePenSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState([]);

  // AI Assistant State (Image 5)
  const [isFloatingAIOpen, setIsFloatingAIOpen] = useState(false);
  const [isAIExpanded, setIsAIExpanded] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      sender: 'ai',
      text: 'Greetings Inspector Sharma. Multi-source records loaded for FIR-104. How can I assist your criminal network investigation today?',
      timestamp: '11:45 AM',
      evidence: []
    }
  ]);

  // Overlays, Drawers, Modals & Feedback
  const [activeDrawer, setActiveDrawer] = useState(null); // 'node-details', 'edge-details', 'evidence-details', 'user-profile'
  const [activeModal, setActiveModal] = useState(null); // 'add-user', 'edit-canvas-object', 'audit-warning'
  const [modalData, setModalData] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- Helper Functions & Actions ---

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => {
      // Filter out duplicate messages and keep only the single most recent toast to prevent stacking
      const filtered = prev.filter(t => t.message !== message);
      return [...filtered.slice(-1), { id, message, type }];
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const navigate = (page, params = {}) => {
    if (params.caseId) setActiveCaseId(params.caseId);
    if (params.tab) setActiveAnalysisTab(params.tab);
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  const toggleFloatingAI = () => setIsFloatingAIOpen(prev => !prev);
  const toggleAIExpand = () => setIsAIExpanded(prev => !prev);

  const login = (id, password) => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
    showToast(`Welcome back, ${currentUser.name}`, 'success');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  const setUserRole = (role) => {
    const user = mockUsers.find(u => u.role === role) || mockUsers[0];
    setCurrentUser(user);
    showToast(`Switched user profile to ${user.name} (${user.role})`, 'info');
  };

  const selectEntity = (entityId) => {
    const entity = mockEntities.find(e => e.id === entityId) || null;
    setSelectedEntity(entity);
    if (entity) setActiveDrawer('node-details');
  };

  const selectEvidence = (evidenceId) => {
    const ev = (backendEvidence || []).find(e => e.id === evidenceId) || (evidenceList || []).find(e => e.id === evidenceId) || mockEvidence.find(e => e.id === evidenceId) || null;
    setSelectedEvidence(ev);
    if (ev) {
      setActiveDrawer('evidence-details');
    }
  };

  const openEvidenceInspector = (evidenceItem) => {
    setSelectedEvidence(evidenceItem);
    openModal('evidence-inspector', evidenceItem);
  };

  const addEvidence = (evidenceData) => {
    const newId = evidenceData.id || `EV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newHash = evidenceData.hash || Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newExhibit = {
      id: newId,
      type: evidenceData.type || 'Physical & Ballistics',
      category: evidenceData.category || 'Forensic Seizure',
      title: evidenceData.title || `Seized Exhibit ${newId}`,
      date: evidenceData.date || new Date().toISOString().replace('T', ' ').substring(0, 16) + ' IST',
      source: evidenceData.source || 'Crime Scene Recovery Memo',
      suspicion: evidenceData.suspicion || 'HIGH',
      amount: evidenceData.amount || undefined,
      caseId: evidenceData.caseId || activeCaseId || 'FIR-104',
      officer: evidenceData.officer || currentUser?.name || 'Inspector Sharma',
      seizureLocation: evidenceData.seizureLocation || 'Jurisdiction Crime Scene',
      custodyLocker: evidenceData.custodyLocker || `LOC-${Math.floor(10 + Math.random() * 90)}`,
      hash: newHash,
      integrityVerified: true,
      summary: evidenceData.summary || evidenceData.description || 'Forensic evidence exhibit logged into custody.',
      description: evidenceData.description || 'Evidence recovered and documented under standard police seizure protocols.',
      linkedEntities: evidenceData.linkedEntities || ['P001'],
      forensics: evidenceData.forensics || {
        modality: 'general',
        seizedQuantum: evidenceData.amount || 'Documented on record'
      },
      chainOfCustody: [
        {
          step: 1,
          action: 'Seized on Site with Panchnama Memo',
          date: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' IST',
          officer: `${currentUser?.name || 'Inspector Sharma'} (Badge Verified)`,
          location: evidenceData.seizureLocation || 'Crime Scene'
        },
        {
          step: 2,
          action: 'Secured in Evidence Vault Locker',
          date: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' IST',
          officer: `${currentUser?.name || 'Inspector Sharma'} (Custodial Seal)`,
          location: evidenceData.custodyLocker || 'Malkhana Vault'
        }
      ]
    };

    setEvidenceList(prev => [newExhibit, ...prev]);
    showToast(`Logged exhibit ${newId} with SHA-256 seal`, 'success');
    return newExhibit;
  };

  const updateEvidence = (id, updatedFields) => {
    setEvidenceList(prev => prev.map(ev => {
      if (ev.id === id) {
        return { ...ev, ...updatedFields };
      }
      return ev;
    }));
    if (selectedEvidence && selectedEvidence.id === id) {
      setSelectedEvidence(prev => ({ ...prev, ...updatedFields }));
    }
    showToast(`Updated evidence record ${id}`, 'success');
  };

  const deleteEvidence = (id) => {
    setEvidenceList(prev => prev.filter(ev => ev.id !== id));
    if (selectedEvidence && selectedEvidence.id === id) {
      setSelectedEvidence(null);
      closeDrawer();
    }
    showToast(`Archived exhibit ${id}`, 'warning');
  };

  const verifyEvidenceIntegrity = (id) => {
    setEvidenceList(prev => prev.map(ev => {
      if (ev.id === id) {
        return { ...ev, integrityVerified: true, lastAudit: new Date().toISOString() };
      }
      return ev;
    }));
    showToast(`SHA-256 Checksum 100% verified for exhibit ${id}`, 'success');
  };

  const selectEdge = (edgeId) => {
    setSelectedEdgeId(edgeId);
    setActiveDrawer('edge-details');
  };

  const selectSuspectDossier = (dossier) => {
    // If passed a string ID, try to look it up
    if (typeof dossier === 'string') {
      const found = (backendSuspects || []).find(d => d.id === dossier || d.name === dossier) || 
                    (suspectDossiers || []).find(d => d.id === dossier || d.name === dossier);
      if (found) {
        setSelectedSuspectDossier(found);
      }
    } else {
      setSelectedSuspectDossier(dossier);
    }
    if (dossier) showToast(`Selected dossier for target ${dossier.name || dossier} (${dossier.code || 'N/A'})`, 'info');
  };

  const openDrawer = (drawerType) => setActiveDrawer(drawerType);
  const closeDrawer = () => setActiveDrawer(null);

  const openModal = (modalType, data = null) => {
    setActiveModal(modalType);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  // Canvas Actions
  const addToCanvas = (item) => {
    let newObj = null;
    if (item.type === 'Person' || item.type === 'Vehicle' || item.type === 'Account' || item.type === 'Location') {
      newObj = {
        id: `c-obj-${Date.now()}`,
        type: item.type ? item.type.toLowerCase() : 'entity',
        entityId: item.id,
        label: `${item.id}: ${item.name || item.id}`,
        x: 180 + Math.floor(Math.random() * 200),
        y: 120 + Math.floor(Math.random() * 160),
        color: item.type === 'Person' ? '#ef4444' : item.type === 'Vehicle' ? '#10b981' : '#3b82f6'
      };
    } else if (item.amount || item.category || item.evidenceId) {
      newObj = {
        id: `c-obj-${Date.now()}`,
        type: 'evidence',
        evidenceId: item.id,
        label: `${item.id}\n${item.title || item.type || 'Evidence Item'}`,
        x: 240 + Math.floor(Math.random() * 200),
        y: 160 + Math.floor(Math.random() * 160),
        color: '#f59e0b'
      };
    } else if (typeof item === 'string') {
      newObj = {
        id: `c-obj-${Date.now()}`,
        type: 'note',
        label: item,
        x: 180 + Math.floor(Math.random() * 150),
        y: 200 + Math.floor(Math.random() * 150),
        color: '#2563eb'
      };
    } else if (item.label) {
      newObj = {
        id: `c-obj-${Date.now()}`,
        type: item.type || 'note',
        label: item.label,
        x: item.x || (200 + Math.floor(Math.random() * 150)),
        y: item.y || (150 + Math.floor(Math.random() * 150)),
        color: item.color || '#2563eb'
      };
    }

    if (newObj) {
      setCurrentCanvas(prev => ({
        ...prev,
        objects: [...(prev.objects || []), newObj]
      }));
      showToast(`Added ${newObj.type?.toUpperCase()} card to corkboard!`, 'success');
    }
  };

  const addCustomCanvasObject = (customData) => {
    const newObj = {
      id: `c-custom-${Date.now()}`,
      type: customData.type || 'note',
      label: customData.label || 'Custom Investigator Item',
      x: customData.x || (200 + Math.floor(Math.random() * 120)),
      y: customData.y || (150 + Math.floor(Math.random() * 120)),
      color: customData.color || '#2563eb'
    };

    setCurrentCanvas(prev => ({
      ...prev,
      objects: [...(prev.objects || []), newObj]
    }));
    showToast(`Added custom ${newObj.type?.toUpperCase()} to canvas board`, 'success');
    return newObj;
  };

  const removeCanvasObject = (objId) => {
    setCurrentCanvas(prev => ({
      ...prev,
      objects: (prev.objects || []).filter(o => o.id !== objId),
      connections: (prev.connections || []).filter(c => c.from !== objId && c.to !== objId && c.id !== objId)
    }));
    showToast('Removed card & associated links from board', 'info');
  };

  const editCanvasObject = (objId, newLabel, newColor, newType) => {
    setCurrentCanvas(prev => ({
      ...prev,
      objects: (prev.objects || []).map(o => o.id === objId ? { 
        ...o, 
        label: newLabel !== undefined ? newLabel : o.label, 
        color: newColor !== undefined ? newColor : o.color,
        type: newType !== undefined ? newType : o.type
      } : o)
    }));
    showToast('Updated card content on canvas board', 'success');
  };

  const addCanvasConnection = (fromId, toId, label = 'Evidence Link', color = '#dc2626', style = 'solid') => {
    if (!fromId || !toId || fromId === toId) return;
    const newConn = {
      id: `conn-${Date.now()}`,
      from: fromId,
      to: toId,
      label: label || 'Linked Evidence',
      color: color || '#dc2626',
      style: style || 'solid'
    };

    setCurrentCanvas(prev => ({
      ...prev,
      connections: [...(prev.connections || []).filter(c => !(c.from === fromId && c.to === toId)), newConn]
    }));
    showToast('Connected cards with investigation yarn string!', 'success');
    return newConn;
  };

  const removeCanvasConnection = (connId) => {
    setCurrentCanvas(prev => ({
      ...prev,
      connections: (prev.connections || []).filter(c => c.id !== connId)
    }));
    showToast('Erased connection yarn line', 'info');
  };

  const editCanvasConnection = (connId, newLabel, newColor, newStyle) => {
    setCurrentCanvas(prev => ({
      ...prev,
      connections: (prev.connections || []).map(c => c.id === connId ? {
        ...c,
        label: newLabel !== undefined ? newLabel : c.label,
        color: newColor !== undefined ? newColor : c.color,
        style: newStyle !== undefined ? newStyle : c.style
      } : c)
    }));
    showToast('Updated connection string label', 'success');
  };

  const clearCanvasConnections = () => {
    setCurrentCanvas(prev => ({ ...prev, connections: [] }));
    showToast('Cleared all connection strings from board', 'info');
  };

  const clearDrawnPaths = () => {
    setCurrentCanvas(prev => ({ ...prev, drawnPaths: [] }));
    showToast('Cleared all freehand drawings', 'info');
  };

  const erasePath = (pathId) => {
    setCurrentCanvas(prev => ({
      ...prev,
      drawnPaths: (prev.drawnPaths || []).filter(p => p.id !== pathId)
    }));
    showToast('Erased freehand stroke line', 'info');
  };

  const autoLinkCanvasWithAI = () => {
    const objects = currentCanvas.objects || [];
    if (objects.length < 2) {
      showToast('Need at least 2 cards on the board to auto-synthesize links', 'info');
      return 0;
    }

    const newConnections = [];
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const objA = objects[i];
        const objB = objects[j];
        
        let shouldLink = false;
        let label = 'Linked Lead';
        let color = '#dc2626';

        if ((objA.type === 'entity' && objB.type === 'evidence') || (objA.type === 'evidence' && objB.type === 'entity')) {
          shouldLink = true;
          label = 'Seized from / Attributed To';
          color = '#dc2626';
        } else if (objA.type === 'entity' && objB.type === 'entity') {
          shouldLink = true;
          label = 'Conspiracy Association';
          color = '#f59e0b';
        } else if ((objA.type === 'entity' && objB.type === 'vehicle') || (objA.type === 'vehicle' && objB.type === 'entity')) {
          shouldLink = true;
          label = 'Getaway Vehicle';
          color = '#10b981';
        } else if ((objA.type === 'entity' && objB.type === 'account') || (objA.type === 'account' && objB.type === 'entity')) {
          shouldLink = true;
          label = 'Beneficiary Conduit';
          color = '#2563eb';
        }

        if (shouldLink) {
          newConnections.push({
            id: `conn-ai-${Date.now()}-${i}-${j}`,
            from: objA.id,
            to: objB.id,
            label,
            color,
            style: 'solid'
          });
        }
      }
    }

    if (newConnections.length === 0 && objects.length >= 2) {
      newConnections.push({
        id: `conn-ai-${Date.now()}`,
        from: objects[0].id,
        to: objects[1].id,
        label: 'Investigative Correlation',
        color: '#dc2626',
        style: 'solid'
      });
    }

    setCurrentCanvas(prev => ({
      ...prev,
      connections: [...(prev.connections || []), ...newConnections]
    }));

    showToast(`✨ AI Synthesized ${newConnections.length} Red Yarn Link${newConnections.length > 1 ? 's' : ''} on Board!`, 'success');
    return newConnections.length;
  };

  const restoreCanvasVersion = (versionStr) => {
    setCurrentCanvas(prev => ({ ...prev, version: versionStr }));
    showToast(`Restored board state to ${versionStr}`, 'info');
  };

  const saveCanvas = () => {
    showToast(`Saved ${currentCanvas.title} (${currentCanvas.version})`, 'success');
  };

  // AI Query Action
  const askAI = async (queryText) => {
    if (!queryText.trim()) {
      showToast('Enter an investigative question first.', 'warning');
      return;
    }

    const userMsg = {
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Push user message and a temporary loading message
    const loadingId = Date.now();
    setAiMessages(prev => [
      ...prev, 
      userMsg,
      {
        id: loadingId,
        sender: 'ai',
        text: 'Analyzing observed records...',
        isLoading: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    try {
      const activeScenario = availableScenarios.length > 0 ? availableScenarios[0].scenario_id : 'S01';
      
      const response = await fetch('http://localhost:8000/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          scenario_id: activeScenario
        })
      });
      
      if (!response.ok) {
        throw new Error('Backend responded with error');
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.llm_response) {
        setAiMessages(prev => prev.map(msg => 
          msg.id === loadingId ? {
            sender: 'ai',
            text: data.llm_response.answer || 'No answer provided.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            citations: data.llm_response.citations || [],
            evidence_basis: data.llm_response.evidence_basis || null,
            confidence: data.llm_response.confidence || 'insufficient',
            mode: data.llm_response.mode || 'retrieval_fallback'
          } : msg
        ));
      } else {
        throw new Error('Malformed response');
      }
      
    } catch (err) {
      console.error('AI query failed:', err);
      // Fallback behavior
      setAiMessages(prev => prev.map(msg => 
        msg.id === loadingId ? {
          sender: 'ai',
          text: 'AI analysis is temporarily unavailable. Please try again. (Evidence retrieval fallback)',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: 'retrieval_fallback',
          confidence: 'insufficient'
        } : msg
      ));
    }
  };

  // Global Search Action
  const searchGlobal = (query) => {
    setGlobalSearchQuery(query);
    if (!query.trim()) {
      setGlobalSearchResults(null);
      setIsSearchOpen(false);
      return;
    }
    setIsSearchOpen(true);
    const q = query.toLowerCase();
    const matchedEntities = mockEntities.filter(e => 
      e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || (e.phone && e.phone.includes(q))
    );
    const matchedCases = mockCases.filter(c => 
      c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    );
    const matchedEvidence = mockEvidence.filter(ev => 
      ev.id.toLowerCase().includes(q) || ev.title.toLowerCase().includes(q)
    );
    setGlobalSearchResults({
      entities: matchedEntities,
      cases: matchedCases,
      evidence: matchedEvidence
    });
  };

  const registerFIR = (firData) => {
    const newId = firData.id && firData.id.trim() ? firData.id.trim() : `FIR-${Math.floor(100 + Math.random() * 900)}`;
    const newCase = {
      id: newId,
      title: firData.title || 'Untitled Crime Investigation',
      description: firData.description || 'First Information Report complaint registered into official jurisdiction database.',
      category: firData.category || 'Organized Crime',
      priority: firData.priority || 'HIGH',
      status: 'ACTIVE',
      district: firData.district || 'Mumbai South',
      assignedTo: firData.assignedTo || currentUser.name,
      suspectName: firData.suspectName || '',
      lastUpdated: 'Just now',
      stats: {
        persons: firData.suspectName ? 1 : 1,
        evidence: firData.evidenceTag ? 1 : 1,
        relations: 0,
        vehicles: 0,
        accounts: 0,
        locations: 1,
        relatedFIRs: 0
      }
    };

    // Also store complete statutory Form II FIR record
    const realFIR = generateRealFIRRecord({
      ...firData,
      id: newId
    }, currentUser);
    mockFIRDetails[newId] = realFIR;

    setCases(prev => [newCase, ...prev]);
    setActiveCaseId(newId);
    showToast(`Registered Statutory Form II FIR: ${newId} (${newCase.title})`, 'success');
    return newCase;
  };

  const updateFIR = (firId, updatedData) => {
    // 1. Update cases state
    setCases(prev => prev.map(c => {
      if (c.id === firId) {
        return {
          ...c,
          title: updatedData.title ?? c.title,
          category: updatedData.category ?? c.category,
          priority: updatedData.priority ?? c.priority,
          status: updatedData.status ?? c.status,
          district: updatedData.district ?? c.district,
          assignedTo: updatedData.assignedTo ?? c.assignedTo,
          description: updatedData.description ?? c.description,
          suspectName: updatedData.suspectName ?? c.suspectName,
          lastUpdated: 'Just now (Updated)'
        };
      }
      return c;
    }));

    // 2. Update mockFIRDetails[firId]
    if (mockFIRDetails[firId]) {
      const existing = mockFIRDetails[firId];
      mockFIRDetails[firId] = {
        ...existing,
        district: updatedData.district ?? existing.district,
        policeStation: updatedData.policeStation ?? (updatedData.district ? `${updatedData.district} Police Station / Crime Branch` : existing.policeStation),
        actsAndSections: updatedData.actsAndSections ?? (updatedData.acts ? [{ act: 'Indian Penal Code, 1860 / BNS 2023', sections: updatedData.acts }] : existing.actsAndSections),
        complainant: {
          ...existing.complainant,
          name: updatedData.complainantName ?? existing.complainant?.name,
          fatherOrHusbandName: updatedData.complainantFather ?? existing.complainant?.fatherOrHusbandName,
          phone: updatedData.phone ?? existing.complainant?.phone,
          address: updatedData.complainantAddress ?? existing.complainant?.address
        },
        placeOfOccurrence: {
          ...existing.placeOfOccurrence,
          address: updatedData.place ?? existing.placeOfOccurrence?.address,
          directionAndDistance: updatedData.directionAndDistance ?? existing.placeOfOccurrence?.directionAndDistance,
          beatNo: updatedData.beatNo ?? existing.placeOfOccurrence?.beatNo
        },
        accusedList: updatedData.suspectName ? [
          {
            id: existing.accusedList?.[0]?.id || 'P001',
            name: updatedData.suspectName,
            alias: updatedData.suspectAlias ?? existing.accusedList?.[0]?.alias ?? 'Primary Accused',
            fatherName: updatedData.suspectFather ?? existing.accusedList?.[0]?.fatherName ?? 'On Record',
            address: updatedData.suspectAddress ?? existing.accusedList?.[0]?.address ?? 'Jurisdiction Area',
            role: updatedData.suspectRole ?? existing.accusedList?.[0]?.role ?? 'Primary Accused',
            status: updatedData.suspectStatus ?? existing.accusedList?.[0]?.status ?? 'ACTIVE INVESTIGATION',
            photo: existing.accusedList?.[0]?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            identifyingMarks: updatedData.identifyingMarks ?? existing.accusedList?.[0]?.identifyingMarks ?? 'CCTNS Record Match'
          },
          ...(existing.accusedList?.slice(1) || [])
        ] : existing.accusedList,
        totalPropertyValue: updatedData.propertyValue ?? existing.totalPropertyValue,
        firstInformationContents: updatedData.description ?? existing.firstInformationContents,
        actionTaken: updatedData.actionTaken ?? existing.actionTaken,
        investigatingOfficer: {
          ...existing.investigatingOfficer,
          name: updatedData.assignedTo ?? existing.investigatingOfficer?.name
        }
      };
    }

    showToast(`Updated FIR ${firId} details successfully!`, 'success');
  };

  useEffect(() => {
    try {
      localStorage.setItem('sih_suspect_dossiers', JSON.stringify(suspectDossiers));
    } catch (e) {
      console.warn('LocalStorage save failed for suspect dossiers:', e);
    }
  }, [suspectDossiers]);

  const addSuspectDossier = (dossierData) => {
    const newId = dossierData.id && dossierData.id.trim() ? dossierData.id.trim() : `OP-${Math.floor(100 + Math.random() * 900)}-${String(suspectDossiers.length + 1).padStart(2, '0')}`;
    const newDossier = {
      id: newId,
      trackCode: dossierData.trackCode || `TRK-${Math.floor(1000 + Math.random() * 9000)}-X`,
      code: dossierData.code || `TACTICAL-${Math.floor(10000 + Math.random() * 90000)}`,
      name: dossierData.name || 'UNIDENTIFIED TARGET',
      gender: dossierData.gender || 'MALE',
      dob: dossierData.dob || '1990-01-01',
      height: dossierData.height || '175 cm',
      nationality: dossierData.nationality || 'INDIAN',
      career: dossierData.career || 'CYBER EXTORTION',
      squad: dossierData.squad || 'ALPHA-9',
      status: dossierData.status || 'ACTIVE TARGET',
      photo: dossierData.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
      bpm: Number(dossierData.bpm) || 85,
      dnaMatch: dossierData.dnaMatch || '98.5%',
      riskRating: dossierData.riskRating || 'HIGH',
      recentOp: dossierData.recentOp || 'UNDER INVESTIGATION',
      fingerprintPattern: dossierData.fingerprintPattern || 'WHORL / AFIS-MATCH',
      irisScore: dossierData.irisScore || '97.8%',
      facialConfidence: dossierData.facialConfidence || '95.4%',
      biometricsHistory: dossierData.biometricsHistory || [
        { date: new Date().toISOString().split('T')[0], type: 'INITIAL ENROLLMENT', status: 'VERIFIED' }
      ],
      ...dossierData
    };

    setSuspectDossiers(prev => [newDossier, ...prev]);
    setSelectedSuspectDossier(newDossier);
    showToast(`New Biometric Dossier ${newDossier.name} registered successfully`, 'success');
    return newDossier;
  };

  const updateSuspectDossier = (id, updatedFields) => {
    setSuspectDossiers(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, ...updatedFields };
        if (selectedSuspectDossier?.id === id) {
          setSelectedSuspectDossier(updated);
        }
        return updated;
      }
      return d;
    }));
    showToast(`Biometric Dossier ${id} updated`, 'success');
  };

  const deleteSuspectDossier = (id) => {
    setSuspectDossiers(prev => {
      const filtered = prev.filter(d => d.id !== id);
      if (selectedSuspectDossier?.id === id) {
        setSelectedSuspectDossier(filtered[0] || null);
      }
      return filtered;
    });
    showToast(`Dossier ${id} removed from active roster`, 'warning');
  };

  const addBiometricRecord = (suspectId, biometricRecord) => {
    setSuspectDossiers(prev => prev.map(d => {
      if (d.id === suspectId) {
        const history = d.biometricsHistory ? [...d.biometricsHistory] : [];
        history.unshift({
          date: new Date().toISOString().split('T')[0],
          type: biometricRecord.type || 'FINGERPRINT / IRIS SCAN',
          status: biometricRecord.status || 'VERIFIED',
          matchScore: biometricRecord.matchScore || '99.1%',
          scannerId: biometricRecord.scannerId || 'NAFIS-DEVICE-04'
        });
        const updated = { 
          ...d, 
          biometricsHistory: history,
          bpm: biometricRecord.bpm ?? d.bpm,
          dnaMatch: biometricRecord.dnaMatch ?? d.dnaMatch,
          fingerprintPattern: biometricRecord.fingerprintPattern ?? d.fingerprintPattern,
          irisScore: biometricRecord.irisScore ?? d.irisScore
        };
        if (selectedSuspectDossier?.id === suspectId) {
          setSelectedSuspectDossier(updated);
        }
        return updated;
      }
      return d;
    }));
    showToast(`Added new Biometric Telemetry Record for ${suspectId}`, 'success');
  };

  const deleteFIR = (firId) => {
    setCases(prev => prev.filter(c => c.id !== firId));
    delete mockFIRDetails[firId];
    showToast(`Archived / Removed FIR ${firId} from active registry`, 'info');
  };

  const value = {
    backendStatus,
    availableScenarios,
    backendCases,
    backendEvidence,
    currentUser,
    isAuthenticated,
    login,
    logout,
    setUserRole,
    cases,
    setCases,
    registerFIR,
    updateFIR,
    deleteFIR,
    currentPage,
    activeCaseId,
    setActiveCaseId,
    activeAnalysisTab,
    setActiveAnalysisTab,
    navigate,
    isMobileMenuOpen,
    toggleMobileMenu,
    activeRegionFilter,
    setActiveRegionFilter,
    setRegionFilter: setActiveRegionFilter,
    activeCaseCategoryTab,
    setActiveCaseCategoryTab,
    setCaseCategoryTab: setActiveCaseCategoryTab,
    selectedEntity,
    selectEntity,
    selectedEvidence,
    setSelectedEvidence,
    selectEvidence,
    evidenceList,
    setEvidenceList,
    addEvidence,
    updateEvidence,
    deleteEvidence,
    verifyEvidenceIntegrity,
    openEvidenceInspector,
    selectedNodeId,
    setSelectedNodeId,
    suspectDossiers,
    setSuspectDossiers,
    selectedSuspectDossier,
    setSelectedSuspectDossier,
    selectSuspectDossier: setSelectedSuspectDossier,
    addSuspectDossier,
    updateSuspectDossier,
    deleteSuspectDossier,
    addBiometricRecord,
    currentCanvas,
    setCurrentCanvas,
    activeCanvasTool,
    setActiveCanvasTool,
    activePenColor,
    setActivePenColor,
    activePenSize,
    setActivePenSize,
    isDrawing,
    setIsDrawing,
    currentPathPoints,
    setCurrentPathPoints,
    addToCanvas,
    addCustomCanvasObject,
    removeCanvasObject,
    editCanvasObject,
    addCanvasConnection,
    removeCanvasConnection,
    editCanvasConnection,
    clearCanvasConnections,
    clearDrawnPaths,
    erasePath,
    restoreCanvasVersion,
    saveCanvas,
    autoLinkCanvasWithAI,
    isFloatingAIOpen,
    toggleFloatingAI,
    isAIExpanded,
    toggleAIExpand,
    aiMessages,
    askAI,
    activeDrawer,
    openDrawer,
    closeDrawer,
    activeModal,
    modalData,
    openModal,
    closeModal,
    toasts,
    showToast,
    removeToast,
    globalSearchQuery,
    globalSearchResults,
    isSearchOpen,
    setIsSearchOpen,
    searchGlobal,
    backendHotspots,
    backendSuspects,
    backendTimeline,
    backendNetwork
  };

  return (
    <InvestigationContext.Provider value={value}>
      {children}
    </InvestigationContext.Provider>
  );
}

export function useInvestigation() {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
}
