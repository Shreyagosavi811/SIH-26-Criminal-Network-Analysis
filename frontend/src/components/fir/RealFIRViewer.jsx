import React, { useState, useRef } from 'react';
import { useInvestigation } from '../../context/InvestigationContext.jsx';
import { mockFIRDetails } from '../../data/mockFIRs.js';
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  Share2, 
  FileText, 
  Search, 
  Bot, 
  LayoutTemplate, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  QrCode, 
  ArrowLeft, 
  Stamp, 
  Copy, 
  ExternalLink, 
  BadgeCheck, 
  FileSpreadsheet, 
  Edit3, 
  FilePlus 
} from 'lucide-react';

export function RealFIRViewer({ defaultCaseId, onBack }) {
  const { 
    activeCaseId, 
    setActiveCaseId, 
    cases: mockCases, 
    backendCases,
    backendStatus,
    navigate, 
    addToCanvas, 
    askAI, 
    toggleFloatingAI, 
    showToast,
    openModal,
    selectSuspectDossier
  } = useInvestigation();

  const currentSelectedId = defaultCaseId || activeCaseId || 'FIR-104';
  const [selectedFirId, setSelectedFirId] = useState(currentSelectedId);
  const [activeDocTab, setActiveDocTab] = useState('form2'); // 'form2', 'complaint', 'panchnama', 'audit'
  const [isCopied, setIsCopied] = useState(false);
  const printRef = useRef(null);

  const cases = (backendStatus?.online && backendCases) ? backendCases : mockCases;

  // Retrieve FIR record from mockFIRDetails or dynamically construct from cases list
  const currentCase = (cases || []).find(c => c.id === selectedFirId);
  const firData = mockFIRDetails[selectedFirId] || (currentCase ? {
    id: currentCase.id,
    firNumber: `${currentCase.id.replace(/\D/g, '') || '101'}/2026`,
    state: 'Maharashtra',
    district: currentCase.district || 'Mumbai South',
    policeStation: `${currentCase.district || 'Mumbai South'} Police Station / Crime Branch`,
    year: '2026',
    cctnsId: `MH-${currentCase.id}-2026-FIR-009941`,
    digitalHash: 'a8f9c412b3e7019dc7d2e99104b83fa1f1e400392bc194a2e291c7849102ab39',
    dateOfRegistration: currentCase.lastUpdated ? currentCase.lastUpdated.split(' ')[0] : '27/08/2026',
    timeOfRegistration: '10:30 IST',
    gdEntryNo: 'GD-441/2026',
    gdDateTime: '27/08/2026 09:15 IST',
    actsAndSections: [
      { act: 'Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita (BNS)', sections: 'Sec 420 (Cheating), Sec 384 (Extortion), Sec 468 (Forgery), Sec 120B (Conspiracy)' },
      { act: 'Information Technology Act, 2000', sections: 'Sec 66C, Sec 66D' }
    ],
    occurrence: {
      dayFrom: 'Monday',
      dateFrom: '25/08/2026',
      timeFrom: '21:00 IST',
      dayTo: 'Wednesday',
      dateTo: '27/08/2026',
      timeTo: '04:00 IST',
      priorInfoReceivedDate: '27/08/2026',
      priorInfoReceivedTime: '09:15 IST',
      typeOfInformation: 'Written & Certified Electronic Complaint'
    },
    placeOfOccurrence: {
      directionAndDistance: '3.2 KM South-West from Police Station',
      beatNo: 'Beat IV / Marine Drive Sector',
      address: `Incident site in ${currentCase.district || 'Mumbai South'} Jurisdiction`,
      outsideLimitPs: 'Inter-district links under investigation'
    },
    complainant: {
      name: 'Rajeshwar K. Sengupta',
      fatherOrHusbandName: 'Late K. N. Sengupta',
      dobOrAge: '50 Years',
      nationality: 'Indian',
      occupation: 'Chief Vigilance Officer, National Banking Consortium',
      idProof: 'Govt Service ID #CVO-MUM-9941',
      address: '14-B, Reserve Bank Officers Enclave, Cuffe Parade, Mumbai',
      phone: '+91 98200 44551'
    },
    accusedList: [
      {
        id: 'P001',
        name: currentCase.suspectName || 'Vikramaditya "Vikram" Deshmukh',
        alias: 'Kingpin / Prime Target',
        fatherName: 'Madhav Deshmukh',
        address: 'Bandra West, Mumbai',
        role: 'Prime Accused / Syndicate Mastermind',
        status: 'ACTIVE INVESTIGATION',
        identifyingMarks: 'Scar on left forearm'
      }
    ],
    propertiesInvolved: [
      { itemNo: 1, description: 'Laundered Hawala cash routed via shell mule accounts', value: '₹5,00,000/-', recoveryStatus: 'Frozen' }
    ],
    totalPropertyValue: '₹5,00,00,000/- (Rupees Five Crores Only)',
    reasonForDelay: 'Nil. Reported immediately upon intelligence discovery.',
    inquestReportNo: 'N/A',
    firstInformationContents: `TO THE OFFICER IN CHARGE, POLICE STATION.\n\nSUBJECT: OFFICIAL COMPLAINT REGARDING ${currentCase.title}.\n\n${currentCase.description}\n\nRespectfully submitted for statutory registration under Section 154 Cr.P.C.`,
    actionTaken: `Case registered. Investigation assigned to ${currentCase.assignedTo || 'Inspector Sharma'}.`,
    investigatingOfficer: {
      name: currentCase.assignedTo || 'Inspector Sharma',
      rank: 'Inspector of Police (Lead IO)',
      badgeNo: 'MH-POL-88410',
      policeStation: `${currentCase.district} Crime Branch`
    },
    stationHouseOfficer: {
      name: 'Senior Inspector K. R. Kadam',
      rank: 'Senior P.I. / Station House Officer',
      badgeNo: 'MH-POL-10022'
    },
    magistrateDispatchDate: '27/08/2026',
    magistrateDispatchTime: '11:15 IST',
    magistrateCourt: "Hon'ble Court of Additional Chief Metropolitan Magistrate, Mumbai"
  } : mockFIRDetails['FIR-104']);

  const handlePrint = () => {
    window.print();
  };

  const copyHash = () => {
    navigator.clipboard.writeText(firData.digitalHash || firData.cctnsId);
    setIsCopied(true);
    showToast('Copied CCTNS cryptographic verification hash to clipboard', 'info');
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200 font-sans">
      {/* Top Controls & FIR Case Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center space-x-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded font-bold bg-blue-100 text-blue-800 border border-blue-200 text-[10px]">
                CCTNS FORM II / SEC 154 Cr.P.C.
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center space-x-1">
                <BadgeCheck className="w-3 h-3 text-emerald-600" />
                <span>STATE POLICE CERTIFIED</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
              <span>FIRST INFORMATION REPORT (FIR) REPOSITORY</span>
            </h1>
          </div>
        </div>

        {/* Case Switcher & Action Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition-colors">
            <span className="text-slate-500 font-bold">Select FIR:</span>
            <select 
              value={selectedFirId}
              onChange={(e) => {
                setSelectedFirId(e.target.value);
                setActiveCaseId(e.target.value);
              }}
              className="bg-transparent font-bold text-blue-700 dark:text-blue-400 focus:outline-none cursor-pointer text-xs"
            >
              {(cases || []).map(c => (
                <option key={c.id} value={c.id}>{c.id} — {c.title.substring(0, 30)}...</option>
              ))}
              {Object.keys(mockFIRDetails).filter(k => !(cases || []).some(c => c.id === k)).map(k => (
                <option key={k} value={k}>{k} (Archived / Specialized)</option>
              ))}
            </select>
          </div>

          {/* Action: Edit FIR Button */}
          <button 
            onClick={() => openModal('edit-fir', { firId: firData.id, fir: firData })}
            className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            title="Edit Official FIR Particulars, Accused & Addenda"
          >
            <Edit3 className="w-4 h-4 text-amber-200" />
            <span>Edit FIR</span>
          </button>

          {/* Action: Register New FIR Button */}
          <button 
            onClick={() => openModal('register-fir')}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            title="Register New First Information Report"
          >
            <FilePlus className="w-4 h-4 text-cyan-300" />
            <span>+ New FIR</span>
          </button>

          <button 
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            title="Print Official Form II Copy"
          >
            <Printer className="w-4 h-4 text-cyan-300" />
            <span>Print FIR</span>
          </button>

          <button 
            onClick={() => {
              addToCanvas({ id: firData.id, type: 'fir', title: firData.title }, 'overview');
              showToast(`Added ${firData.id} FIR Document node to Canvas corkboard`, 'success');
            }}
            className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            title="Pin FIR Node to Drawing Corkboard"
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>+ Canvas</span>
          </button>

          <button 
            onClick={() => {
              toggleFloatingAI();
              askAI(`Analyze official FIR allegations and statutory sections for ${firData.id} (${firData.district})`);
            }}
            className="px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-300 font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            title="Ask AI about FIR contents"
          >
            <Bot className="w-4 h-4" />
            <span>AI Review</span>
          </button>
        </div>
      </div>

      {/* Document Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto font-mono text-xs pb-1 transition-colors">
        <button 
          onClick={() => setActiveDocTab('form2')}
          className={`py-2.5 px-4 rounded-t-lg font-bold flex items-center space-x-2 border-t border-x transition-all ${
            activeDocTab === 'form2'
              ? 'bg-amber-50/70 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800 border-b-2 border-b-transparent shadow-xs font-extrabold'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-600" />
          <span>Form II: Official FIR Document (Sec 154)</span>
        </button>

        <button 
          onClick={() => setActiveDocTab('complaint')}
          className={`py-2.5 px-4 rounded-t-lg font-bold flex items-center space-x-2 border-t border-x transition-all ${
            activeDocTab === 'complaint'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800 border-b-2 border-b-transparent shadow-xs font-extrabold'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          <span>Complainant's Original Complaint Letter</span>
        </button>

        <button 
          onClick={() => setActiveDocTab('panchnama')}
          className={`py-2.5 px-4 rounded-t-lg font-bold flex items-center space-x-2 border-t border-x transition-all ${
            activeDocTab === 'panchnama'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 border-b-2 border-b-transparent shadow-xs font-extrabold'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Stamp className="w-4 h-4 text-emerald-600" />
          <span>Seizure Panchnama & Asset Inventory</span>
        </button>

        <button 
          onClick={() => setActiveDocTab('audit')}
          className={`py-2.5 px-4 rounded-t-lg font-bold flex items-center space-x-2 border-t border-x transition-all ${
            activeDocTab === 'audit'
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-800 border-b-2 border-b-transparent shadow-xs font-extrabold'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>CCTNS Digital Integrity & QR Audit</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REAL STATUTORY FORM II - FIRST INFORMATION REPORT (Cr.P.C. 154)    */}
      {/* ========================================================================= */}
      {activeDocTab === 'form2' && (
        <div 
          ref={printRef}
          className="bg-[#faf9f5] border-2 border-slate-400/80 rounded-xl shadow-md overflow-hidden font-serif relative"
        >
          {/* Official Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <div className="transform -rotate-45 text-center">
              <div className="text-8xl font-extrabold tracking-widest text-slate-900">CONFIDENTIAL</div>
              <div className="text-6xl font-extrabold tracking-widest text-slate-900 mt-4">POLICE DEPARTMENT</div>
              <div className="text-4xl font-bold tracking-widest text-slate-900 mt-2">CCTNS SEC 154 Cr.P.C.</div>
            </div>
          </div>

          {/* Top Security Banner */}
          <div className="bg-slate-900 text-slate-300 px-6 py-2 text-[11px] font-mono flex flex-wrap items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-white uppercase tracking-wider">CCTNS NATIONAL INTEGRATED CRIME DATABASE</span>
              <span className="text-slate-400">• Form No. II (Sec 154 Cr.P.C.)</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>CCTNS UID: <strong className="text-cyan-300 font-bold">{firData.cctnsId}</strong></span>
              <button onClick={copyHash} className="hover:text-white flex items-center space-x-1">
                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy Hash'}</span>
              </button>
            </div>
          </div>

          {/* Authentic Form Paper Body */}
          <div className="p-6 md:p-10 space-y-6 text-slate-900">
            {/* Header: State Emblem of India + State Police Crest */}
            <div className="text-center relative border-b-2 border-slate-900 pb-5 space-y-2">
              {/* Left Top: Red Confidential Rubber Stamp */}
              <div className="absolute top-0 left-0 hidden md:block">
                <div className="border-2 border-red-600 text-red-600 px-3 py-1 rounded text-xs font-mono font-black uppercase tracking-widest transform -rotate-12 opacity-85 shadow-xs">
                  CONFIDENTIAL / वर्गीकृत
                </div>
              </div>

              {/* Right Top: CCTNS Barcode & Verification */}
              <div className="absolute top-0 right-0 hidden md:flex flex-col items-end text-right font-mono text-[10px] text-slate-600">
                <div className="font-bold tracking-tighter text-xs">||| | ||||| || |||| ||| |||| | ||</div>
                <div className="text-slate-800 font-bold">{firData.cctnsId}</div>
                <div className="text-emerald-700 font-bold flex items-center space-x-0.5">
                  <CheckCircle2 className="w-3 h-3 inline text-emerald-600" />
                  <span>CCTNS VERIFIED</span>
                </div>
              </div>

              {/* National Emblem SVG */}
              <div className="mx-auto w-16 h-16 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-16 h-16 text-amber-900" fill="currentColor">
                  {/* Ashoka Pillar Lion Crest Silhouette */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#78350f" strokeWidth="2" strokeDasharray="3 2" />
                  <path d="M50 10 L56 22 L68 24 L59 33 L62 45 L50 39 L38 45 L41 33 L32 24 L44 22 Z" fill="#78350f" />
                  <rect x="35" y="48" width="30" height="24" rx="2" fill="#78350f" />
                  <circle cx="50" cy="60" r="7" fill="#faf9f5" />
                  <path d="M50 53 L50 67 M43 60 L57 60" stroke="#78350f" strokeWidth="1.5" />
                  <rect x="30" y="75" width="40" height="6" rx="1" fill="#78350f" />
                  <text x="50" y="90" fontSize="7" fontFamily="serif" fontWeight="bold" textAnchor="middle" fill="#78350f">सत्यमेव जयते</text>
                </svg>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-700 font-sans">
                  GOVERNMENT OF {firData.state?.toUpperCase() || 'MAHARASHTRA'} • POLICE DEPARTMENT
                </p>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  प्रथम सूचना रिपोर्ट / FIRST INFORMATION REPORT
                </h2>
                <p className="text-xs font-semibold text-slate-800 font-sans">
                  (Under Section 154 of the Code of Criminal Procedure, 1973 / u/s 173 BNSS 2023)
                </p>
                <p className="text-[11px] font-mono text-slate-600">
                  FORM NO. II • विहित प्रपत्र संख्या २
                </p>
              </div>
            </div>

            {/* SECTION 1: POLICE STATION & BASIC PARTICULARS */}
            <div className="border border-slate-900 divide-y divide-slate-900 bg-white shadow-xs font-sans text-xs">
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-900 p-0">
                <div className="p-3">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">1. District / ज़िला:</span>
                  <strong className="text-slate-900 text-sm font-serif">{firData.district}</strong>
                </div>
                <div className="p-3">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Police Station / थाना:</span>
                  <strong className="text-slate-900 text-sm font-serif">{firData.policeStation}</strong>
                </div>
                <div className="p-3">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Year / वर्ष:</span>
                  <strong className="text-slate-900 text-sm font-serif">{firData.year}</strong>
                </div>
                <div className="p-3 bg-red-50/50">
                  <span className="font-bold text-red-700 uppercase text-[10px] block">FIR No. / प्र.सू.रि. सं.:</span>
                  <strong className="text-red-700 text-base font-mono font-black">{firData.id} ({firData.firNumber})</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-900 p-0">
                <div className="p-3">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Date of Registration / दर्ज करने की तिथि:</span>
                  <strong className="text-slate-900 font-serif">{firData.dateOfRegistration} at {firData.timeOfRegistration}</strong>
                </div>
                <div className="p-3">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">General Diary (GD) Entry Ref / रोजनामचा प्रविष्टि सं.:</span>
                  <strong className="text-slate-900 font-mono">{firData.gdEntryNo} (Dated {firData.gdDateTime})</strong>
                </div>
              </div>
            </div>

            {/* SECTION 2: ACTS & SECTIONS */}
            <div className="border border-slate-900 p-4 bg-white shadow-xs space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-sans border-b border-slate-200 pb-1">
                2. Acts and Sections / अधिनियम एवं धाराएं:
              </h3>
              <div className="space-y-2">
                {(firData.actsAndSections || []).map((as, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs font-sans">
                    <span className="font-bold text-slate-700">({String.fromCharCode(97 + idx)}) {as.act}:</span>
                    <span className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 rounded font-mono font-bold text-xs">
                      {as.sections}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: OCCURRENCE OF OFFENCE */}
            <div className="border border-slate-900 p-4 bg-white shadow-xs space-y-3 font-sans text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                3. (a) Occurrence of Offence / घटना का विवरण:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">Date & Time From / दिनांक व समय (प्रारंभ):</span>
                  <div className="text-slate-900 font-semibold">{firData.occurrence?.dayFrom}, {firData.occurrence?.dateFrom} at {firData.occurrence?.timeFrom}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">Date & Time To / दिनांक व समय (समाप्त):</span>
                  <div className="text-slate-900 font-semibold">{firData.occurrence?.dayTo}, {firData.occurrence?.dateTo} at {firData.occurrence?.timeTo}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    (b) Information received at Police Station / थाने पर सूचना प्राप्त होने का समय:
                  </span>
                  <p className="text-slate-900 font-semibold mt-0.5">
                    Date: {firData.occurrence?.priorInfoReceivedDate} at {firData.occurrence?.priorInfoReceivedTime}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    (c) Type of Information / सूचना का प्रकार:
                  </span>
                  <p className="text-blue-800 font-bold mt-0.5 font-mono">
                    {firData.occurrence?.typeOfInformation}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: PLACE OF OCCURRENCE */}
            <div className="border border-slate-900 p-4 bg-white shadow-xs space-y-2 font-sans text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                4. Place of Occurrence / घटनास्थल का विवरण:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">(a) Direction & Distance from P.S.:</span>
                  <p className="text-slate-900 font-semibold">{firData.placeOfOccurrence?.directionAndDistance}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">(b) Beat No. / Sector:</span>
                  <p className="text-slate-900 font-semibold">{firData.placeOfOccurrence?.beatNo}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">(c) Jurisdictional Note:</span>
                  <p className="text-slate-900 text-xs">{firData.placeOfOccurrence?.outsideLimitPs}</p>
                </div>
              </div>
              <div className="pt-2">
                <span className="font-bold text-slate-500 text-[10px] uppercase block">Exact Address / Location of Offence:</span>
                <p className="text-slate-900 font-serif font-bold text-sm bg-slate-50 p-2.5 rounded border border-slate-200">
                  {firData.placeOfOccurrence?.address}
                </p>
              </div>
            </div>

            {/* SECTION 5: COMPLAINANT / INFORMANT DETAILS */}
            <div className="border border-slate-900 p-4 bg-white shadow-xs space-y-3 font-sans text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                5. Complainant / Informant Details / शिकायतकर्ता का विवरण:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">(a) Name / नाम:</span>
                  <strong className="text-slate-900 font-serif text-sm">{firData.complainant?.name}</strong>
                </div>
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">(b) Father's / Husband's Name:</span>
                  <p className="text-slate-800">{firData.complainant?.fatherOrHusbandName}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">(c) Age & Date of Birth:</span>
                  <p className="text-slate-800">{firData.complainant?.dobOrAge}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">(d) Nationality:</span>
                  <p className="text-slate-800">{firData.complainant?.nationality}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">(e) Occupation & Official ID:</span>
                  <p className="text-slate-800 font-semibold">{firData.complainant?.occupation}</p>
                  <p className="text-slate-500 text-[10px]">{firData.complainant?.idProof}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">(f) Contact Phone / Email:</span>
                  <p className="text-blue-700 font-mono font-bold">{firData.complainant?.phone}</p>
                </div>
              </div>
              <div className="pt-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase block">(g) Residential / Office Address:</span>
                <p className="text-slate-800">{firData.complainant?.address}</p>
              </div>
            </div>

            {/* SECTION 6: DETAILS OF KNOWN / SUSPECTED / UNKNOWN ACCUSED */}
            <div className="border border-slate-900 p-4 bg-white shadow-xs space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h3 className="font-bold uppercase tracking-wider text-slate-900">
                  6. Details of Known / Suspected / Unknown Accused / नामजद / अज्ञात अभियुक्तों का विवरण:
                </h3>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px] border border-red-200">
                  {(firData.accusedList || []).length} Accused Identified
                </span>
              </div>

              <div className="space-y-3">
                {(firData.accusedList || []).map((acc, index) => (
                  <div 
                    key={index} 
                    onClick={() => {
                      if (acc.id || acc.name) {
                        selectSuspectDossier(acc.id || acc.name);
                        navigate('dossiers');
                      }
                    }}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center space-x-3.5">
                      {acc.photo ? (
                        <img 
                          src={acc.photo} 
                          alt={acc.name} 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-300 grayscale shrink-0" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs shrink-0">
                          ACC
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 text-sm font-serif">{acc.name}</span>
                          {acc.alias && (
                            <span className="text-[10px] text-slate-500 font-mono font-bold">({acc.alias})</span>
                          )}
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5">
                          S/o {acc.fatherName} • {acc.address}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                          <span className="text-red-700 font-bold">Role: {acc.role}</span>
                          {acc.identifyingMarks && (
                            <span className="text-slate-500">• Marks: {acc.identifyingMarks}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-200 shrink-0">
                      {acc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 7: PARTICULARS OF PROPERTIES & EXTORTION VALUE */}
            <div className="border border-slate-900 p-4 bg-white shadow-xs space-y-3 font-sans text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                7. Particulars of Properties Involved / Seized / Stolen / सम्बद्ध सम्पत्ति का विवरण:
              </h3>
              <div className="space-y-2">
                {(firData.propertiesInvolved || []).map((prop, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-400">#{prop.itemNo}</span>
                      <span className="text-slate-900 font-semibold">{prop.description}</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-red-700 font-mono font-bold">{prop.value}</strong>
                      <div className="text-[10px] text-slate-500">{prop.recoveryStatus}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-amber-900">Total Quantum Involved / कुल अनुमानित धनराशि:</span>
                <strong className="text-amber-950 font-mono font-black text-sm">{firData.totalPropertyValue}</strong>
              </div>
            </div>

            {/* SECTION 8: FIRST INFORMATION CONTENTS (VERBATIM POLICE COMPLAINT NARRATIVE) */}
            <div className="border border-slate-900 p-5 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold uppercase tracking-wider text-slate-900 font-sans text-xs">
                  8. First Information Contents / प्रथम सूचना तथ्य (Verbatim Official Transcript):
                </h3>
                <span className="text-[10px] font-mono text-slate-500 font-bold">ANNEXURE-A RECORDED</span>
              </div>
              
              <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {firData.firstInformationContents}
              </div>
            </div>

            {/* SECTION 9: ACTION TAKEN & INVESTIGATION ENTRUSTED */}
            <div className="border border-slate-900 p-4 bg-white shadow-xs space-y-3 font-sans text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                9. Action Taken / की गई कार्यवाही:
              </h3>
              <p className="text-slate-800 leading-relaxed font-medium">
                {firData.actionTaken}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                  <span className="text-[10px] font-bold text-blue-900 uppercase block">Investigation Entrusted To (Lead I.O.):</span>
                  <div className="text-slate-900 font-bold text-sm mt-0.5">{firData.investigatingOfficer?.name}</div>
                  <div className="text-slate-600 text-xs">{firData.investigatingOfficer?.rank} • Badge: {firData.investigatingOfficer?.badgeNo}</div>
                  <div className="text-slate-500 text-[11px]">{firData.investigatingOfficer?.policeStation}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-700 uppercase block">Court of Competent Magistrate for Dispatch:</span>
                  <div className="text-slate-900 font-semibold text-xs mt-0.5">{firData.magistrateCourt}</div>
                  <div className="text-slate-500 text-[11px] mt-1">Dispatched on: {firData.magistrateDispatchDate} at {firData.magistrateDispatchTime}</div>
                </div>
              </div>
            </div>

            {/* SECTION 10: OFFICIAL SEALS, RUBBER STAMPS & SIGNATURES */}
            <div className="border-2 border-slate-900 p-6 bg-white shadow-md rounded-xl font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* 1. Complainant Signature */}
                <div className="text-center space-y-2">
                  <div className="h-14 flex items-end justify-center">
                    <span className="font-serif italic text-lg text-blue-950 font-bold tracking-wider transform -rotate-3 select-none">
                      {firData.complainant?.name || 'R. K. Sengupta'}
                    </span>
                  </div>
                  <div className="border-t border-slate-900 pt-1">
                    <p className="font-bold text-xs text-slate-900">Signature / Thumb Impression of Informant</p>
                    <p className="text-[10px] text-slate-500">शिकायतकर्ता के हस्ताक्षर / अंगूठा निशान</p>
                  </div>
                </div>

                {/* 2. Official Circular Rubber Stamp */}
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-red-600 flex flex-col items-center justify-center text-center p-2 transform rotate-6 text-red-600 opacity-90 shadow-xs select-none">
                    <span className="text-[7px] font-black uppercase tracking-tighter">OFFICER-IN-CHARGE</span>
                    <span className="text-[8px] font-black my-0.5">POLICE DEPT</span>
                    <span className="text-[7px] font-black uppercase tracking-tighter">{firData.district?.toUpperCase()}</span>
                    <span className="text-[6px] font-bold text-slate-700">★ VERIFIED ★</span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 mt-1">Official Police Station Seal</p>
                </div>

                {/* 3. Station House Officer (SHO) Signature */}
                <div className="text-center space-y-2">
                  <div className="h-14 flex items-end justify-center">
                    <span className="font-serif italic text-lg text-blue-950 font-bold tracking-wider transform rotate-2 select-none">
                      {firData.stationHouseOfficer?.name || 'K. R. Kadam (Sr. P.I.)'}
                    </span>
                  </div>
                  <div className="border-t border-slate-900 pt-1">
                    <p className="font-bold text-xs text-slate-900">Signature of Officer in Charge, Police Station</p>
                    <p className="text-[10px] text-slate-600 font-mono font-bold">
                      Rank: {firData.stationHouseOfficer?.rank} ({firData.stationHouseOfficer?.badgeNo})
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Statutory Notice */}
              <div className="mt-6 pt-3 border-t border-slate-300 text-center text-[10px] text-slate-500 font-mono">
                Copy of this First Information Report (FIR) has been provided to the Informant / Complainant FREE OF COST as mandated under Section 154(2) of the Code of Criminal Procedure, 1973.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ORIGINAL COMPLAINANT APPLICATION LETTER FORMAT                      */}
      {/* ========================================================================= */}
      {activeDocTab === 'complaint' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-6 md:p-10 space-y-6 shadow-sm font-mono text-xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                EVIDENCE ANNEXURE-1
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">ORIGINAL SIGNED COMPLAINANT STATEMENT</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Physical written submission received at duty desk</p>
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-xs">Received: {firData.gdDateTime}</span>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 font-serif text-sm leading-relaxed text-slate-900 dark:text-slate-200 shadow-inner transition-colors">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 font-mono text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div><strong>From:</strong> {firData.complainant?.name}, {firData.complainant?.occupation}</div>
              <div><strong>Address:</strong> {firData.complainant?.address}</div>
              <div><strong>Phone:</strong> {firData.complainant?.phone}</div>
              <div><strong>To:</strong> The Station House Officer, {firData.policeStation}</div>
            </div>

            <div className="py-2 whitespace-pre-wrap font-mono text-xs text-slate-800 dark:text-slate-300">
              {firData.firstInformationContents}
            </div>

            <div className="pt-6 flex justify-between items-end font-mono text-xs">
              <div className="border border-blue-300 bg-blue-50 p-3 rounded-lg text-blue-950 text-[11px]">
                <div className="font-bold">DUTY DESK RECEIPT STAMP</div>
                <div>Received by Sub-Inspector on Duty</div>
                <div>Entry: {firData.gdEntryNo} • Time: {firData.gdDateTime}</div>
              </div>

              <div className="text-right">
                <div className="font-serif italic text-base font-bold text-slate-900 dark:text-white">{firData.complainant?.name}</div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">(Signature of Reporting Informant)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SEIZURE PANCHNAMA & ASSET INVENTORY                                 */}
      {/* ========================================================================= */}
      {activeDocTab === 'panchnama' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-6 md:p-8 space-y-6 shadow-sm font-mono text-xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                FORM NO. 27 / SEC 102 Cr.P.C.
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">SEIZURE MEMO & EVIDENCE PANCHNAMA</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Inventory of assets, vehicles, electronic media, and documents seized</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
              CASE: {firData.id}
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Panch Witnesses (स्वतंत्र पंच साक्षी):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <div className="font-bold text-slate-900">1. Mahesh S. Shinde (Age 42)</div>
                  <div className="text-slate-500 text-[11px]">Occ: Local Resident / Merchant, Nariman Point</div>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <div className="font-bold text-slate-900">2. Arvind T. Kamat (Age 38)</div>
                  <div className="text-slate-500 text-[11px]">Occ: Independent Building Supervisor, Colaba</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 border-b">Sr. No.</th>
                    <th className="p-3 border-b">Evidence Tag</th>
                    <th className="p-3 border-b">Item Description</th>
                    <th className="p-3 border-b">Recovered From / Place</th>
                    <th className="p-3 border-b">Estimated Value</th>
                    <th className="p-3 border-b">Chain of Custody</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold">01</td>
                    <td className="p-3 text-red-700 font-bold">TX-00121</td>
                    <td className="p-3">₹5,00,000/- Hawala Cash Packet (HDFC Mule Account TX-00121)</td>
                    <td className="p-3">Gateway Hotel Transfer / P007 Custody</td>
                    <td className="p-3 font-bold">₹5,00,000</td>
                    <td className="p-3 text-emerald-700 font-bold">Malkhana Seal #9941</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold">02</td>
                    <td className="p-3 text-blue-700 font-bold">V003</td>
                    <td className="p-3">Black Mahindra Scorpio SUV (Reg: MH02AB1234)</td>
                    <td className="p-3">Highway Toll Plaza Panvel</td>
                    <td className="p-3 font-bold">₹18,50,000</td>
                    <td className="p-3 text-emerald-700 font-bold">Impound Yard Bay 4</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold">03</td>
                    <td className="p-3 text-purple-700 font-bold">CDR-00821</td>
                    <td className="p-3">Encrypted Burner Handsets (2x Apple iPhone 14)</td>
                    <td className="p-3">Safehouse Sector 19, Panvel</td>
                    <td className="p-3 font-bold">₹1,60,000</td>
                    <td className="p-3 text-emerald-700 font-bold">Forensic Science Lab (FSL)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CCTNS DIGITAL INTEGRITY & QR AUDIT                                  */}
      {/* ========================================================================= */}
      {activeDocTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm font-mono text-xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded">
                DIGITAL EVIDENCE ACT CERTIFICATION
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">CCTNS CRYPTOGRAPHIC VERIFICATION & HASH AUDIT</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Section 65B Indian Evidence Act / Section 63 BSA Compliance</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cryptographic Document Integrity</span>
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">SHA-256 Digital Fingerprint:</span>
                  <div className="p-2 bg-white rounded border border-slate-200 text-[11px] font-mono break-all text-slate-800 select-all font-bold">
                    {firData.digitalHash}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">CCTNS Tracking Node:</span>
                  <div className="text-slate-900 font-bold">{firData.cctnsId}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Time Stamp Authority (TSA):</span>
                  <div className="text-slate-800 font-semibold">{firData.dateOfRegistration} {firData.timeOfRegistration} (NTP Verified)</div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
              <h4 className="font-bold text-purple-950 text-sm">Sec 65B Compliance Certificate:</h4>
              <p className="text-slate-700 text-xs leading-relaxed">
                Certified that this electronic First Information Report was generated on the state police server under secure terminal authentication without alteration or unauthorized intervention.
              </p>
              <div className="pt-2 border-t border-purple-200 flex items-center justify-between text-[11px]">
                <span className="text-purple-900 font-bold">Audit Officer: {firData.investigatingOfficer?.name}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">TAMPER-PROOF</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
