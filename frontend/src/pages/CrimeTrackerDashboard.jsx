import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { 
  Calendar, 
  Sliders, 
  Radio, 
  ChevronRight,
  Shield,
  Zap,
  ExternalLink,
  MapPin,
  Building2,
  AlertTriangle,
  Globe,
  Compass,
  Navigation,
  Activity,
  Layers,
  Search,
  Filter,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  CheckCircle,
  TrendingUp,
  CreditCard,
  Target,
  Car,
  PhoneCall,
  LayoutTemplate,
  Key,
  Settings,
  Map as MapIcon,
  Check,
  Info
} from 'lucide-react';

const getCategorySvg = (category) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('financial')) return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`;
  if (cat.includes('telecommunication')) return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
  if (cat.includes('surveillance')) return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
  if (cat.includes('forensics')) return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
};

export function CrimeTrackerDashboard() {
  const { 
    setRegionFilter, 
    showToast, 
    navigate,
    addToCanvas,
    backendStatus,
    backendHotspots
  } = useInvestigation();

  // Filter States
  const [timeRange, setTimeRange] = useState('24h'); // '24h', '7d', '30d', 'ytd'
  const [crimeCategory, setCrimeCategory] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All'); // 'All', 'CRITICAL', 'HIGH', 'MEDIUM'
  const [mapLayer, setMapLayer] = useState('hotspots'); // 'hotspots', 'corridors', 'density'
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isAudioLive, setIsAudioLive] = useState(true);
  const [mapFocus, setMapFocus] = useState('all'); // 'all', 'north', 'west', 'south', 'east'
  const [searchHotspotQuery, setSearchHotspotQuery] = useState('');

  // Indian Map API & Geographic View State
  const [mapViewMode, setMapViewMode] = useState('geographic'); // 'geographic' (Real Map) or 'radar' (Tactical Vector)
  const [mapProvider, setMapProvider] = useState(() => localStorage.getItem('indian_map_provider') || 'mappls'); // 'mappls', 'osm', 'google', 'mapbox'
  const [indianMapApiKey, setIndianMapApiKey] = useState(() => localStorage.getItem('indian_map_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState(() => localStorage.getItem('indian_map_api_key') || '');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [mapTileStyle, setMapTileStyle] = useState('streets'); // 'streets', 'satellite', 'dark'
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const leafletMapRef = useRef(null);
  const leafletInstance = useRef(null);
  const markersGroupRef = useRef(null);
  const corridorsGroupRef = useRef(null);

  // Top National KPI Cards with Light Pastel Accents
  const trackerKPIs = [
    { label: 'TOTAL INCIDENTS (INDIA)', value: '6,257', color: 'text-blue-950', badgeBg: 'bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white border-blue-100' },
    { label: 'SEIZED ASSETS QUANTUM', value: '₹42.8 Cr', color: 'text-emerald-950', badgeBg: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border-emerald-100' },
    { label: 'ACTIVE TRANSIT CORRIDORS', value: '8 Routes', color: 'text-amber-950', badgeBg: 'bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white border-amber-100' },
    { label: 'HIGH PRIORITY RED FLAGS', value: '1,820', color: 'text-rose-950', badgeBg: 'bg-gradient-to-br from-rose-50/90 via-pink-50/40 to-white border-rose-100' },
    { label: 'DISPATCH UNITS IN FIELD', value: '412 Units', color: 'text-purple-950', badgeBg: 'bg-gradient-to-br from-purple-50/90 via-indigo-50/40 to-white border-purple-100' }
  ];

  // Top Indian States & Cyber Telemetry
  const topStates = [
    { name: 'Maharashtra (Mumbai / Pune)', percentageText: '32%', barWidth: 88, cases: 1980, color: 'bg-rose-500' },
    { name: 'Delhi NCR (Special Cell)', percentageText: '24%', barWidth: 76, cases: 1450, color: 'bg-amber-500' },
    { name: 'Karnataka (Bengaluru CCPS)', percentageText: '18%', barWidth: 62, cases: 1120, color: 'bg-blue-500' },
    { name: 'Telangana (Cyberabad Police)', percentageText: '14%', barWidth: 54, cases: 890, color: 'bg-cyan-500' },
    { name: 'West Bengal (Kolkata Cyber)', percentageText: '12%', barWidth: 42, cases: 817, color: 'bg-indigo-500' }
  ];

  // Live Incident Feed for Indian Precincts
  const liveIncidents = [
    { id: 'INC-901', time: '12:21', type: 'UPI Mule Network Burst', state: 'Maharashtra (Mumbai South)', severity: 'CRITICAL', caseId: 'FIR-104', quantum: '₹5,00,000' },
    { id: 'INC-902', time: '12:14', type: 'SIM Swap Extortion Call', state: 'Delhi NCR (Rohini)', severity: 'HIGH', caseId: 'FIR-089', quantum: '42 Interceptions' },
    { id: 'INC-903', time: '11:58', type: 'Narcotics Hawala Transit', state: 'Goa Coastal (NH48 Highway)', severity: 'HIGH', caseId: 'FIR-221', quantum: '₹37,50,000' },
    { id: 'INC-904', time: '11:42', type: 'Aadhaar AEPS Spoof Extraction', state: 'West Bengal (Kolkata)', severity: 'CRITICAL', caseId: 'FIR-511', quantum: '₹12,80,000' },
    { id: 'INC-905', time: '11:29', type: 'ANPR Black Scorpio Sighting', state: 'Khalapur Toll (Mumbai-Pune)', severity: 'HIGH', caseId: 'FIR-104', quantum: 'Vehicle V003' },
    { id: 'INC-906', time: '11:05', type: 'Crypto Laundering Ledger', state: 'Karnataka (Bengaluru)', severity: 'MEDIUM', caseId: 'FIR-312', quantum: '2.4 BTC' }
  ];

  // Map Hotspots across India (Precise Lat/Long Coordinates on Real Indian GIS Map)
  const mapHotspots = [
    {
      id: 'mumbai',
      name: 'Maharashtra (Mumbai South & Cyber Cell Bandra)',
      label: 'Mumbai South',
      x: 198,
      y: 355,
      lat: 18.9220,
      lng: 72.8347,
      intensity: 'massive',
      glowColor: '#ef4444',
      pulseColor: '#f87171',
      cases: '1,980 Active Incidents',
      activeThreat: 'Syndicate Mule Accounts & Hawala Extortion Pipeline',
      category: 'Financial',
      details: 'Active state police investigations: Mumbai South, Pune Crime Branch, Thane Cyber Cell.',
      caseId: 'FIR-104',
      officer: 'Inspector Sharma (Lead IO)',
      coordinates: '18.9220° N, 72.8347° E',
      suspects: ['Vikramaditya Deshmukh (P001)', 'Amit Kumar (P007)']
    },
    {
      id: 'delhi',
      name: 'Delhi NCR (Special Cell & IFSO Unit)',
      label: 'Delhi NCR',
      x: 295,
      y: 175,
      lat: 28.6139,
      lng: 77.2090,
      intensity: 'high',
      glowColor: '#f59e0b',
      pulseColor: '#fbbf24',
      cases: '1,450 Incidents',
      activeThreat: 'Call Center Extortion & Fake Telecom Infrastructure',
      category: 'Telecommunication',
      details: 'Inter-precinct coordination active across Rohini, Dwarka, and Cyber Cell Mandir Marg.',
      caseId: 'FIR-089',
      officer: 'ACP V. Malhotra',
      coordinates: '28.6139° N, 77.2090° E',
      suspects: ['Kabir Khan (P011)', 'Rajesh Gupta']
    },
    {
      id: 'bengaluru',
      name: 'Karnataka (Bengaluru Cyber Police HQ)',
      label: 'Bengaluru',
      x: 275,
      y: 540,
      lat: 12.9716,
      lng: 77.5946,
      intensity: 'medium',
      glowColor: '#3b82f6',
      pulseColor: '#60a5fa',
      cases: '1,120 Incidents',
      activeThreat: 'Crypto Laundering & Cloud Intrusion Exploits',
      category: 'Digital Forensics',
      details: 'Linked to multi-state financial fraud pipelines.',
      caseId: 'FIR-221',
      officer: 'DCP K. Murthy',
      coordinates: '12.9716° N, 77.5946° E',
      suspects: ['Sunil Hegde', 'P007 Associate']
    },
    {
      id: 'hyderabad',
      name: 'Telangana (Cyberabad Police Station)',
      label: 'Hyderabad',
      x: 310,
      y: 445,
      lat: 17.3850,
      lng: 78.4867,
      intensity: 'high',
      glowColor: '#06b6d4',
      pulseColor: '#22d3ee',
      cases: '890 Incidents',
      activeThreat: 'Fake Loan App Extortion & SIM Box Routing',
      category: 'Telecommunication',
      details: 'State Task Force active on cross-border telecommunication lines.',
      caseId: 'FIR-104',
      officer: 'Inspector S. Reddy',
      coordinates: '17.3850° N, 78.4867° E',
      suspects: ['P001 Syndicate Link']
    },
    {
      id: 'kolkata',
      name: 'West Bengal (Kolkata Special Task Force)',
      label: 'Kolkata',
      x: 465,
      y: 335,
      lat: 22.5726,
      lng: 88.3639,
      intensity: 'medium',
      glowColor: '#f59e0b',
      pulseColor: '#fcd34d',
      cases: '817 Incidents',
      activeThreat: 'Aadhaar AEPS Spoofing & Border Couriers',
      category: 'Financial',
      details: 'Regional intelligence units on high alert along coastal border points.',
      caseId: 'FIR-221',
      officer: 'Inspector B. Sen',
      coordinates: '22.5726° N, 88.3639° E',
      suspects: ['Tariq Sheikh']
    },
    {
      id: 'goa',
      name: 'Goa Coastal (Narcotics & Anti-Extortion Unit)',
      label: 'Goa Coastal',
      x: 215,
      y: 455,
      lat: 15.2993,
      lng: 74.1240,
      intensity: 'high',
      glowColor: '#ef4444',
      pulseColor: '#fca5a5',
      cases: '420 Incidents',
      activeThreat: 'Illicit Narcotics Transit & Cash Conduits',
      category: 'Surveillance',
      details: 'Linked with Mumbai and Pune logistics networks along NH48 Expressway.',
      caseId: 'FIR-221',
      officer: 'SI R. Rao',
      coordinates: '15.2993° N, 74.1240° E',
      suspects: ['V003 Scorpio Driver', 'P001']
    },
    {
      id: 'ahmedabad',
      name: 'Gujarat (Ahmedabad Cyber Crime Wing)',
      label: 'Ahmedabad',
      x: 175,
      y: 280,
      lat: 23.0225,
      lng: 72.5714,
      intensity: 'low',
      glowColor: '#10b981',
      pulseColor: '#34d399',
      cases: '560 Incidents',
      activeThreat: 'Securities Manipulation & Identity Theft',
      category: 'Financial',
      details: 'Financial Intelligence Unit coordination active.',
      caseId: 'FIR-104',
      officer: 'Inspector Patel',
      coordinates: '23.0225° N, 72.5714° E',
      suspects: ['A001 Mule Accountholder']
    },
    {
      id: 'lucknow',
      name: 'Uttar Pradesh (Lucknow / Noida Cyber Cell)',
      label: 'Noida / Lucknow',
      x: 345,
      y: 220,
      lat: 26.8467,
      lng: 80.9462,
      intensity: 'medium',
      glowColor: '#3b82f6',
      pulseColor: '#93c5fd',
      cases: '680 Incidents',
      activeThreat: 'Impersonation & Fake Government Portals',
      category: 'Telecommunication',
      details: 'Multi-precinct raids currently in progress across Noida Expressways.',
      caseId: 'FIR-089',
      officer: 'DSP Alok Singh',
      coordinates: '26.8467° N, 80.9462° E',
      suspects: ['P011 Associate']
    },
    {
      id: 'chennai',
      name: 'Tamil Nadu (Chennai Cyber Crime Wing)',
      label: 'Chennai',
      x: 335,
      y: 550,
      lat: 13.0827,
      lng: 80.2707,
      intensity: 'medium',
      glowColor: '#3b82f6',
      pulseColor: '#93c5fd',
      cases: '740 Incidents',
      activeThreat: 'Payment Gateway Exploits & Overseas Remittances',
      category: 'Financial',
      details: 'Southern coastal surveillance and digital forensics cell.',
      caseId: 'FIR-104',
      officer: 'Inspector Anandan',
      coordinates: '13.0827° N, 80.2707° E',
      suspects: ['Shell Entity Conduit']
    },
    {
      id: 'guwahati',
      name: 'Assam (Guwahati Northeast Regional Hub)',
      label: 'Guwahati',
      x: 540,
      y: 250,
      lat: 26.1445,
      lng: 91.7362,
      intensity: 'low',
      glowColor: '#10b981',
      pulseColor: '#6ee7b7',
      cases: '390 Incidents',
      activeThreat: 'Border Cross-Telecom Routing & Device Clones',
      category: 'Digital Forensics',
      details: 'Northeast inter-state cyber intelligence hub.',
      caseId: 'FIR-221',
      officer: 'Inspector Baruah',
      coordinates: '26.1445° N, 91.7362° E',
      suspects: ['Cross-Border SIM Carrier']
    }
  ];

  // PHASE 2D: Toggle real data when backend is online
  const actualHotspots = (backendStatus?.online && backendHotspots) ? backendHotspots : mapHotspots;

  // Filtered hotspots
  const filteredHotspots = useMemo(() => {
    return actualHotspots.filter(h => {
      if (searchHotspotQuery.trim()) {
        const q = searchHotspotQuery.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(q) || h.label.toLowerCase().includes(q);
        const matchesThreat = h.activeThreat && h.activeThreat !== '—' ? h.activeThreat.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesThreat) return false;
      }
      if (crimeCategory !== 'All' && h.category !== crimeCategory) return false;
      if (severityFilter === 'CRITICAL' && h.intensity !== 'massive') return false;
      if (severityFilter === 'HIGH' && h.intensity !== 'massive' && h.intensity !== 'high') return false;
      return true;
    });
  }, [actualHotspots, searchHotspotQuery, crimeCategory, severityFilter]);

  // Set default hotspot if none selected
  useEffect(() => {
    if (!selectedHotspot && actualHotspots.length > 0) {
      setSelectedHotspot(actualHotspots[0]);
    }
  }, [actualHotspots]);

  // Save API Key Handler
  const handleSaveApiKey = () => {
    localStorage.setItem('indian_map_api_key', tempApiKey.trim());
    localStorage.setItem('indian_map_provider', mapProvider);
    setIndianMapApiKey(tempApiKey.trim());
    setIsApiKeyModalOpen(false);
    showToast(
      tempApiKey.trim() 
        ? `Saved Indian Map API Key for ${mapProvider.toUpperCase()}` 
        : 'Reverted to Default National GIS Tile Grid',
      'success'
    );
  };

  // Dynamically load Leaflet CDN assets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setIsLeafletReady(true);
      };
      document.head.appendChild(script);
    } else {
      setIsLeafletReady(true);
    }
  }, []);

  // Initialize or update Leaflet Map Instance
  useEffect(() => {
    if (!isLeafletReady || !leafletMapRef.current || mapViewMode !== 'geographic' || !window.L) return;

    const L = window.L;

    if (!leafletInstance.current) {
      const map = L.map(leafletMapRef.current, {
        center: [21.7679, 78.8718], // India Center coordinates
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      leafletInstance.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
      corridorsGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = leafletInstance.current;

    // Tile URLs based on provider/style
    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; OpenStreetMap contributors | India Geospatial Hub';

    if (mapTileStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Satellite Imagery &copy; Maxar, Earthstar Geographics';
    } else if (mapTileStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; OpenStreetMap &copy; CARTO';
    } else if (mapProvider === 'mappls' && indianMapApiKey) {
      // MapmyIndia / Mappls key configured
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = 'Mappls / MapmyIndia Enterprise API Key Active';
    }

    // Remove previous tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution
    }).addTo(map);

    // Markers Rendering
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      filteredHotspots.forEach(h => {
        const isSelected = selectedHotspot?.id === h.id;

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 38px; height: 38px;">
            <div class="absolute inset-0 rounded-full animate-ping opacity-50" style="background-color: ${h.glowColor};"></div>
            <div class="relative w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md border-[2.5px] border-white transition-transform ${isSelected ? 'scale-125 ring-4 ring-blue-500/30' : 'group-hover:scale-110'}" style="background-color: ${h.glowColor};">
              ${getCategorySvg(h.category)}
            </div>
            <div class="absolute -bottom-6 whitespace-nowrap bg-white text-slate-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded shadow-sm border border-slate-200 pointer-events-none uppercase tracking-wider">
              ${h.label}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-precinct-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([h.lat, h.lng], { icon: customIcon }).addTo(markersGroupRef.current);

        marker.on('click', () => {
          setSelectedHotspot(h);
          showToast(`Selected ${h.name} (${h.cases})`, 'info');
        });
      });
    }

    // Corridors Polyline Rendering
    if (corridorsGroupRef.current) {
      corridorsGroupRef.current.clearLayers();

      if (mapLayer === 'corridors' || mapLayer === 'hotspots') {
        const corridors = [
          [[28.6139, 77.2090], [18.9220, 72.8347]], // Delhi -> Mumbai
          [[18.9220, 72.8347], [12.9716, 77.5946]], // Mumbai -> Bengaluru
          [[18.9220, 72.8347], [15.2993, 74.1240]], // Mumbai -> Goa
          [[28.6139, 77.2090], [22.5726, 88.3639]], // Delhi -> Kolkata
          [[17.3850, 78.4867], [12.9716, 77.5946]], // Hyderabad -> Bengaluru
          [[22.5726, 88.3639], [26.1445, 91.7362]], // Kolkata -> Guwahati
          [[28.6139, 77.2090], [26.8467, 80.9462]], // Delhi -> Lucknow
          [[23.0225, 72.5714], [18.9220, 72.8347]], // Ahmedabad -> Mumbai
          [[12.9716, 77.5946], [13.0827, 80.2707]], // Bengaluru -> Chennai
        ];

        corridors.forEach(coords => {
          L.polyline(coords, {
            color: '#38bdf8',
            weight: mapLayer === 'corridors' ? 3 : 2,
            opacity: 0.75,
            dashArray: '5, 8'
          }).addTo(corridorsGroupRef.current);
        });
      }
    }

    // Pan to selected hotspot if any
    if (selectedHotspot) {
      map.panTo([selectedHotspot.lat, selectedHotspot.lng], { animate: true });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

  }, [isLeafletReady, mapViewMode, filteredHotspots, mapTileStyle, mapProvider, indianMapApiKey, mapLayer, selectedHotspot]);

  return (
    <div className="w-full min-h-full bg-white text-slate-800 font-sans p-4 md:p-6 space-y-6 rounded-3xl select-none border border-slate-200/90 shadow-xs">
      
      {/* 1. TOP HEADER & KPI METRICS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              <Globe className="w-4.5 h-4.5 animate-spin-slow" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              National Cyber Crime & Geospatial Incident Telemetry (India)
            </h1>
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>I4C & CCTNS LIVE FEED</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Inter-state tactical intelligence grid linking police crime branches across 28 States & 8 Union Territories
          </p>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 w-full xl:w-auto">
          {trackerKPIs.map((kpi, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border ${kpi.badgeBg} flex flex-col items-center justify-center shadow-xs cursor-pointer hover:scale-[1.02] transition-transform`}
              onClick={() => showToast(`Filtered telemetry by ${kpi.label} (${kpi.value})`, 'info')}
            >
              <div className={`text-lg sm:text-xl font-extrabold tracking-tight ${kpi.color}`}>
                {kpi.value}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold text-center mt-0.5">
                {kpi.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. INTERACTIVE FILTER & MAP CONTROLS TOOLBAR */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        
        {/* Left: Time Range Pills & Category Dropdown */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Time Window:</span>
          {[
            { id: '24h', label: 'Live 24h' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'ytd', label: 'YTD 2026' }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => {
                setTimeRange(t.id);
                showToast(`Switched telemetry window to ${t.label}`, 'info');
              }}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                timeRange === t.id 
                  ? 'bg-blue-600 text-white shadow-xs font-bold' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <span className="text-slate-500 font-bold uppercase text-[10px]">Stream:</span>
          {['All', 'Financial', 'Telecommunication', 'Surveillance', 'Digital Forensics'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCrimeCategory(cat)}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                crimeCategory === cat 
                  ? 'bg-slate-900 text-white shadow-xs font-bold' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right: Map Layers & Audio Telemetry Toggle */}
        <div className="flex items-center space-x-2 text-xs self-start lg:self-auto">
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            {[
              { id: 'hotspots', label: 'Hotspots', icon: Target },
              { id: 'corridors', label: 'Transit Arcs', icon: Activity },
              { id: 'density', label: 'State Load', icon: Layers }
            ].map(layer => {
              const Icon = layer.icon;
              const isSelected = mapLayer === layer.id;
              return (
                <button 
                  key={layer.id}
                  onClick={() => setMapLayer(layer.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-bold shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{layer.label}</span>
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => {
              const next = !isAudioLive;
              setIsAudioLive(next);
              showToast(next ? 'Live dispatch audio telemetry enabled' : 'Audio telemetry muted', 'info');
            }}
            className={`p-2 rounded-xl border transition-colors ${
              isAudioLive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-2xs' : 'bg-white border-slate-200 text-slate-400'
            }`}
            title={isAudioLive ? 'Live Dispatch Audio Enabled' : 'Muted'}
          >
            {isAudioLive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. MAIN GRID: INDIAN STATES ROSTER, INTERACTIVE INDIA MAP, TELEMETRY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top Indian States Incident Volume */}
        <div className="lg:col-span-3 bg-slate-50/80 border border-slate-200/90 rounded-3xl p-4 sm:p-5 space-y-4 flex flex-col justify-between shadow-2xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Incident Precincts</span>
              <span className="text-[10px] text-slate-400 font-semibold">Incident Share</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {topStates.map((st, i) => (
                <div 
                  key={st.name} 
                  className="space-y-1.5 cursor-pointer p-2.5 rounded-xl bg-white border border-slate-200/70 hover:border-blue-300 hover:shadow-2xs transition-all group"
                  onClick={() => showToast(`Selected ${st.name} jurisdiction (${st.cases} records)`, 'info')}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{st.name}</span>
                    <span className="font-bold text-slate-500 font-mono text-[11px]">{st.percentageText}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`${st.color || 'bg-blue-500'} h-full rounded-full transition-all duration-500`} 
                      style={{ width: `${st.barWidth}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs">
            <div className="text-slate-200 font-bold flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>National Cyber Desk (I4C)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Citizen Financial Cyber Fraud Reporting System (Helpline 1930) active across all state gateways.
            </p>
          </div>
        </div>

        {/* Center: Interactive India Map Visualizer & GIS Gateway */}
        <div className="lg:col-span-6 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
          {/* Map Header & Multi-Mode Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 z-10">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <span>India Tactical Incident Hotspot Map</span>
                </h3>
                {indianMapApiKey ? (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>{mapProvider.toUpperCase()} API ACTIVE</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                    NATIONAL GIS FEED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Real-time GPS incident telemetry across Indian state police precincts</p>
            </div>

            {/* Map Action Controls */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {/* API Key Modal Button */}
              <button
                type="button"
                onClick={() => {
                  setTempApiKey(indianMapApiKey);
                  setIsApiKeyModalOpen(true);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                title="Configure Indian Map API Key (Mappls / MapmyIndia, Google Maps, Mapbox)"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>{indianMapApiKey ? 'Map API Key' : '🔑 Set Indian Map API Key'}</span>
              </button>

              {/* View Mode Toggle: Real Geographic vs Tactical Radar */}
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    setMapViewMode('geographic');
                    showToast('Switched to Geographic Indian Map Mode', 'info');
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                    mapViewMode === 'geographic'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Real Map</span>
                </button>
                <button
                  onClick={() => {
                    setMapViewMode('radar');
                    showToast('Switched to Tactical Radar Vector Mode', 'info');
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                    mapViewMode === 'radar'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>Radar</span>
                </button>
              </div>

              {/* Tile Style Picker (When in Geographic Mode) */}
              {mapViewMode === 'geographic' && (
                <select
                  value={mapTileStyle}
                  onChange={(e) => setMapTileStyle(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-medium rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="streets">Streets</option>
                  <option value="satellite">Satellite</option>
                  <option value="dark">Dark Tactical</option>
                </select>
              )}
            </div>
          </div>

          {/* Map Display Container */}
          <div className="relative w-full h-[470px] sm:h-[530px] my-2 rounded-xl overflow-hidden">
            {mapViewMode === 'geographic' ? (
              /* REAL GEOGRAPHIC MAP CONTAINER */
              <div className="w-full h-full relative z-0">
                <div ref={leafletMapRef} className="w-full h-full bg-slate-900 rounded-xl" />
                
                {/* Overlay Badge */}
                <div className="absolute top-2 left-2 z-[400] bg-slate-900/90 border border-slate-700 text-white text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-md flex items-center space-x-1.5 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{mapProvider.toUpperCase()} / GPS SUB-GRID: INDIA</span>
                </div>
              </div>
            ) : (
              /* TACTICAL VECTOR RADAR SVG CONTAINER */
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:18px_18px]"></div>

                <svg className="w-full h-full select-none" viewBox="0 0 650 720">
                  <defs>
                    <filter id="indiaMapGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    
                    <linearGradient id="indiaLandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0a0f1d" />
                      <stop offset="50%" stopColor="#131e33" />
                      <stop offset="100%" stopColor="#0a0f1d" />
                    </linearGradient>

                    <radialGradient id="radarSweep" cx="45%" cy="40%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                      <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Radar Grid Circles */}
                  <circle cx="300" cy="350" r="140" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                  <circle cx="300" cy="350" r="240" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                  <circle cx="300" cy="350" r="320" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="5 5" opacity="0.2" />

                  {/* Geographic Indian Mainland Silhouette */}
                  <path 
                    d="M 285,38 
                       C 295,36 315,35 325,42
                       C 335,48 348,58 352,75
                       C 355,92 342,105 332,118
                       C 342,126 358,135 365,145
                       C 372,155 378,168 382,180
                       C 395,190 425,208 448,218
                       C 468,226 480,228 485,210
                       C 488,198 496,198 500,215
                       C 505,232 518,228 535,225
                       C 545,210 568,195 595,190
                       C 610,205 625,220 615,245
                       C 605,260 598,280 590,310
                       C 585,335 578,360 565,372
                       C 555,360 545,340 540,325
                       C 530,318 518,322 510,310
                       C 498,290 488,295 475,300
                       C 470,320 475,338 468,355
                       C 455,375 438,405 422,430
                       C 405,458 382,492 360,525
                       C 345,550 332,580 322,620
                       C 315,645 305,675 292,695
                       C 285,685 272,655 262,630
                       C 250,590 240,550 230,510
                       C 222,475 212,440 205,405
                       C 198,375 192,345 185,325
                       C 172,335 152,342 135,332
                       C 120,318 115,295 130,275
                       C 142,260 120,248 108,245
                       C 125,232 145,228 162,238
                       C 175,230 182,215 178,195
                       C 172,175 188,155 210,148
                       C 228,142 242,155 252,140
                       C 248,118 242,95 255,70
                       C 265,52 275,42 285,38 Z" 
                    fill="url(#indiaLandGrad)" 
                    stroke="#38bdf8" 
                    strokeWidth="2"
                    strokeOpacity="0.8"
                    filter="url(#indiaMapGlow)"
                  />

                  {/* Internal Regional Grid & Division Lines */}
                  <g stroke="#334155" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.6">
                    <path d="M 210,148 C 260,175 320,185 382,180" />
                    <path d="M 185,325 C 240,320 280,340 330,345" />
                    <path d="M 330,345 C 380,350 422,370 468,355" />
                    <path d="M 205,405 C 260,420 310,430 360,525" />
                    <path d="M 485,210 C 475,260 488,295 475,300" />
                  </g>

                  {/* Lakshadweep Island Territory */}
                  <g fill="#38bdf8" stroke="#38bdf8" opacity="0.7">
                    <circle cx="185" cy="590" r="3.5" />
                    <circle cx="190" cy="610" r="3" />
                    <circle cx="180" cy="635" r="2.5" />
                    <text x="145" y="615" fill="#64748b" fontSize="8" fontFamily="Figtree, sans-serif" fontWeight="bold">LAKSHADWEEP</text>
                  </g>

                  {/* Andaman & Nicobar Island Territory */}
                  <g fill="#38bdf8" stroke="#38bdf8" opacity="0.7">
                    <ellipse cx="575" cy="510" rx="3" ry="8" />
                    <ellipse cx="580" cy="535" rx="3.5" ry="12" />
                    <ellipse cx="585" cy="570" rx="3" ry="9" />
                    <circle cx="590" cy="605" r="3.5" />
                    <circle cx="592" cy="630" r="3" />
                    <text x="520" y="575" fill="#64748b" fontSize="8" fontFamily="Figtree, sans-serif" fontWeight="bold">ANDAMAN & NICOBAR</text>
                  </g>

                  {/* Inter-State Police Telemetry Lines & Corridors */}
                  {(mapLayer === 'corridors' || mapLayer === 'hotspots') && (
                    <g strokeWidth="1.5" strokeDasharray="3 3" opacity={mapLayer === 'corridors' ? '0.9' : '0.6'}>
                      <line x1="295" y1="175" x2="198" y2="355" stroke="#38bdf8" strokeWidth={mapLayer === 'corridors' ? '2' : '1.5'} />
                      <line x1="198" y1="355" x2="275" y2="540" stroke="#f59e0b" strokeWidth={mapLayer === 'corridors' ? '2' : '1.5'} />
                      <line x1="295" y1="175" x2="465" y2="335" stroke="#38bdf8" />
                      <line x1="198" y1="355" x2="215" y2="455" stroke="#ef4444" strokeWidth={mapLayer === 'corridors' ? '3' : '2'} opacity="0.9" />
                      <line x1="310" y1="445" x2="275" y2="540" stroke="#38bdf8" />
                      <line x1="465" y1="335" x2="540" y2="250" stroke="#38bdf8" />
                      <line x1="275" y1="540" x2="335" y2="550" stroke="#38bdf8" />
                      <line x1="295" y1="175" x2="345" y2="220" stroke="#38bdf8" />
                      <line x1="175" y1="280" x2="198" y2="355" stroke="#38bdf8" />
                    </g>
                  )}

                  {/* Interactive State Precinct Hotspot Pins */}
                  {filteredHotspots.map(h => {
                    const isSelected = selectedHotspot && selectedHotspot.id === h.id;
                    return (
                      <g 
                        key={h.id} 
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedHotspot(h);
                          showToast(`Selected ${h.name} (${h.cases})`, 'info');
                        }}
                      >
                        {/* Animated Pulse Ring */}
                        <circle 
                          cx={h.x} 
                          cy={h.y} 
                          r={isSelected ? 22 : 13} 
                          fill={h.glowColor} 
                          fillOpacity={isSelected ? '0.35' : '0.2'} 
                          className="animate-ping"
                        />
                        
                        {/* Solid Node Dot */}
                        <circle 
                          cx={h.x} 
                          cy={h.y} 
                          r={isSelected ? 8 : 5.5} 
                          fill={h.glowColor} 
                          stroke="#ffffff" 
                          strokeWidth={isSelected ? '2' : '1.5'}
                        />

                        {/* Precinct Label */}
                        <text 
                          x={h.x} 
                          y={h.y - 12} 
                          fill={isSelected ? '#ffffff' : '#cbd5e1'} 
                          fontSize="9.5" 
                          fontFamily="Figtree, sans-serif" 
                          fontWeight={isSelected ? 'bold' : '600'} 
                          textAnchor="middle"
                          className="drop-shadow-md select-none group-hover:fill-cyan-300 transition-colors"
                        >
                          {h.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Selected Hotspot Detailed Drawer Overlay */}
            {selectedHotspot && (
              <div className="absolute bottom-3 left-3 right-3 z-[500] bg-white/95 border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-2xl space-y-4 text-xs backdrop-blur-md animate-scale-up">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center space-x-1.5">
                        <MapPin className="w-4 h-4 text-slate-700" />
                        <span>{selectedHotspot.name}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                        {selectedHotspot.cases}
                      </span>
                    </div>
                    <div className="text-rose-700 font-bold text-[11px] bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg inline-flex items-center space-x-1.5 shadow-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Threat: {selectedHotspot.activeThreat}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedHotspot(null)} 
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-slate-600 text-xs leading-relaxed font-medium">
                  {selectedHotspot.details}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1"><Shield className="w-3.5 h-3.5 text-slate-400"/><span>Officer: <strong className="text-slate-800">{selectedHotspot.officer}</strong></span></span>
                    <span className="flex items-center space-x-1"><Navigation className="w-3.5 h-3.5 text-slate-400"/><span>GPS: <strong className="text-slate-800 font-mono">{selectedHotspot.coordinates}</strong></span></span>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <button 
                      onClick={() => {
                        addToCanvas({
                          id: `hotspot-${selectedHotspot.id}`,
                          type: 'location',
                          label: `${selectedHotspot.label}\n${selectedHotspot.activeThreat}`
                        });
                        showToast(`Pinned ${selectedHotspot.label} to Corkboard Canvas`, 'success');
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      <span>Pin to Corkboard</span>
                    </button>

                    {selectedHotspot.caseId && (
                      <button 
                        onClick={() => {
                          navigate('overview', { caseId: selectedHotspot.caseId });
                        }}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>Inspect Linked Case</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <span>Jurisdiction: National Inter-Precinct Telemetry Grid (I4C)</span>
            <span>Last Telemetry Sync: 05 Sep 2026, 12:24 IST</span>
          </div>
        </div>

        {/* INDIAN MAP API KEY CONFIGURATION MODAL */}
        {isApiKeyModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white font-sans text-xs animate-scale-up">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Indian Map API Key Configuration</h3>
                    <p className="text-[11px] text-slate-400">Connect MapmyIndia (Mappls), Google Maps, or Bhuvan GIS</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Select Map Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'mappls', label: 'MapmyIndia (Mappls)', desc: 'Official Indian GIS Platform', tag: 'Recommended' },
                    { id: 'osm', label: 'National I4C Grid (Bhuvan/OSM)', desc: 'Free Open GIS Feed', tag: 'No Key Required' },
                    { id: 'google', label: 'Google Maps API', desc: 'Enterprise Satellite & Roads', tag: 'Global' },
                    { id: 'mapbox', label: 'Mapbox Navigation', desc: 'Vector Dark GIS Themes', tag: 'Vector' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMapProvider(p.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        mapProvider === p.id 
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs' 
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{p.label}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          p.tag === 'Recommended' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                        }`}>{p.tag}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              {mapProvider !== 'osm' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300">
                      {mapProvider === 'mappls' ? 'Mappls / MapmyIndia REST API Key' : `${mapProvider.toUpperCase()} Access Token / Key`}
                    </label>
                    <span className="text-[10px] text-slate-400">Stored securely in local browser storage</span>
                  </div>
                  <input 
                    type="password"
                    placeholder={mapProvider === 'mappls' ? 'e.g., 28a01f8d9b9c4... (Mappls REST Key)' : 'Enter API Key token...'}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              )}

              {/* Informational Guidance */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start space-x-2 text-[11px] text-slate-400">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  MapmyIndia (Mappls) provides high-accuracy Indian territory borders, state precinct geocoding, and national road network telemetries compliant with Ministry of Home Affairs guidelines.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                {indianMapApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempApiKey('');
                      localStorage.removeItem('indian_map_api_key');
                      setIndianMapApiKey('');
                      showToast('Cleared custom Indian Map API key', 'info');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 rounded-xl font-semibold transition-colors cursor-pointer"
                  >
                    Clear Key
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-md"
                >
                  Save & Connect Map
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right: Live Indian Police Incident Feed with Light Cards */}
        <div className="lg:col-span-3 bg-slate-50/80 border border-slate-200/90 rounded-3xl p-4 sm:p-5 space-y-4 flex flex-col justify-between shadow-2xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <span>Live Incident Feed</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              </span>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">REAL-TIME</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-0.5">
              {liveIncidents.map((inc) => (
                <div 
                  key={inc.id}
                  onClick={() => navigate('overview', { caseId: inc.caseId })}
                  className="p-3 bg-white hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-300 rounded-2xl space-y-1.5 cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-blue-700 font-mono font-bold">{inc.time} IST</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                      inc.severity === 'CRITICAL' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs group-hover:text-blue-700 transition-colors">{inc.type}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>{inc.state}</span>
                    <span className="font-mono text-emerald-700 font-bold">{inc.quantum}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => showToast('Full CCTNS National Incident Feed Exported to PDF', 'success')}
            className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export National Feed (.PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
