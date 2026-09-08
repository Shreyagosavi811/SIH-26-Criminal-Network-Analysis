// Complete Mock Datasets for SIH26189 Investigator-Centric Criminal Network Platform

export const mockUsers = [
  {
    id: 'USR-001',
    name: 'Inspector Sharma',
    email: 'sharma@police.gov.in',
    role: 'Admin',
    department: 'Special Narcotics & Organized Crime Unit',
    accessScope: 'National Crime Database (Full)',
    status: 'ACTIVE',
    lastActive: 'Just now',
    permissions: ['View cases', 'View evidence', 'Run investigations', 'Use AI', 'Create Canvas', 'Manage Users']
  },
  {
    id: 'USR-002',
    name: 'Inspector Patil',
    email: 'patil@police.gov.in',
    role: 'Investigator',
    department: 'District Intelligence Cell',
    accessScope: 'District FIR & CDR Records',
    status: 'ACTIVE',
    lastActive: '12 mins ago',
    permissions: ['View cases', 'View evidence', 'Run investigations', 'Use AI', 'Create Canvas']
  },
  {
    id: 'USR-003',
    name: 'Analyst Khan',
    email: 'khan@police.gov.in',
    role: 'Analyst',
    department: 'Financial Crime & Cyber Intelligence',
    accessScope: 'FIU & Bank Telemetry Data',
    status: 'ACTIVE',
    lastActive: '1 hour ago',
    permissions: ['View cases', 'View evidence', 'Run investigations', 'Use AI']
  }
];

export const mockCases = [
  {
    id: 'FIR-104',
    title: 'Inter-State Syndicate Counterfeiting & Extortion Ring',
    description: 'Syndicate operating across Mumbai and Pune involving money laundering, illicit vehicle transfers, and encrypted messaging.',
    category: 'Organized Crime',
    priority: 'HIGH',
    status: 'ACTIVE',
    district: 'Mumbai South',
    assignedTo: 'Inspector Sharma',
    lastUpdated: '2026-09-02 11:40 AM',
    stats: { persons: 5, evidence: 18, relations: 12 }
  },
  {
    id: 'FIR-221',
    title: 'Cross-Border Narcotics Supply Pipeline',
    description: 'Illicit trafficking pipeline linked to suspect P007 with money trails routed through shell entities.',
    category: 'Narcotics',
    priority: 'HIGH',
    status: 'UNDER REVIEW',
    district: 'Goa Coastal',
    assignedTo: 'Inspector Patil',
    lastUpdated: '2026-09-01 04:15 PM',
    stats: { persons: 8, evidence: 24, relations: 19 }
  },
  {
    id: 'FIR-089',
    title: 'High-Value Commercial Bank Cyber Intrusion',
    description: 'Unauthorized financial transfers routed to offshore accounts via multiple mule bank accounts.',
    category: 'Financial Crime',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    district: 'Cyber Crime Cell',
    assignedTo: 'Analyst Khan',
    lastUpdated: '2026-08-30 02:20 PM',
    stats: { persons: 3, evidence: 11, relations: 7 }
  }
];

export const mockActivityLogs = [
  {
    id: 'LOG-9941',
    timestamp: '2026-09-02 13:30:12 IST',
    userId: 'USR-001',
    userName: 'Inspector Sharma',
    userRole: 'Admin',
    actionCategory: 'Evidence Access',
    actionText: 'Viewed Restricted Intelligence Record (CDR-00821)',
    targetResource: 'CDR-00821 (Call Detail Log)',
    caseId: 'FIR-104',
    ipAddress: '10.204.12.89',
    device: 'Gov-Terminal-04 (Mumbai)',
    riskLevel: 'HIGH',
    hashSignature: 'a8f9c412b3e7019d'
  },
  {
    id: 'LOG-9940',
    timestamp: '2026-09-02 13:15:44 IST',
    userId: 'USR-001',
    userName: 'Inspector Sharma',
    userRole: 'Admin',
    actionCategory: 'Canvas Modification',
    actionText: 'Updated Canvas Board CAN-001 (Added freehand sketch & entity pins)',
    targetResource: 'CAN-001 (Tactical Board)',
    caseId: 'FIR-104',
    ipAddress: '10.204.12.89',
    device: 'Gov-Terminal-04 (Mumbai)',
    riskLevel: 'LOW',
    hashSignature: 'c7d2e99104b83fa1'
  },
  {
    id: 'LOG-9939',
    timestamp: '2026-09-02 12:45:10 IST',
    userId: 'USR-002',
    userName: 'Inspector Patil',
    userRole: 'Investigator',
    actionCategory: 'AI Assistant Query',
    actionText: 'Executed AI Query: "What is the relationship between P001 and P007?"',
    targetResource: 'AI Investigator Service',
    caseId: 'FIR-104',
    ipAddress: '10.204.14.102',
    device: 'Mobile-Intel-Pad',
    riskLevel: 'MEDIUM',
    hashSignature: 'f1e400392bc194a2'
  },
  {
    id: 'LOG-9938',
    timestamp: '2026-09-02 11:20:05 IST',
    userId: 'USR-003',
    userName: 'Analyst Khan',
    userRole: 'Analyst',
    actionCategory: 'Financial Query',
    actionText: 'Inspected Bank Transfer TX-00121 (₹5,00,000 via Shell Bank)',
    targetResource: 'TX-00121 (HDFC-A001)',
    caseId: 'FIR-104',
    ipAddress: '10.204.18.55',
    device: 'Gov-Terminal-09',
    riskLevel: 'MEDIUM',
    hashSignature: 'e291c7849102ab39'
  },
  {
    id: 'LOG-9937',
    timestamp: '2026-09-02 10:05:30 IST',
    userId: 'USR-001',
    userName: 'Inspector Sharma',
    userRole: 'Admin',
    actionCategory: 'User Management',
    actionText: 'Granted access scope "District FIR & CDR Records" to Inspector Patil',
    targetResource: 'USR-002 (Inspector Patil)',
    caseId: 'SYSTEM',
    ipAddress: '10.204.12.89',
    device: 'Gov-Terminal-04 (Mumbai)',
    riskLevel: 'HIGH',
    hashSignature: 'b102938475a6c8e9'
  },
  {
    id: 'LOG-9936',
    timestamp: '2026-09-01 16:50:22 IST',
    userId: 'USR-002',
    userName: 'Inspector Patil',
    userRole: 'Investigator',
    actionCategory: 'Dossier Export',
    actionText: 'Exported Intelligence Dossier PDF for Case FIR-221',
    targetResource: 'FIR-221 Dossier',
    caseId: 'FIR-221',
    ipAddress: '10.204.14.102',
    device: 'Mobile-Intel-Pad',
    riskLevel: 'HIGH',
    hashSignature: '9921ab485c29013e'
  }
];

export const mockEntities = [
  {
    id: 'P001',
    type: 'Person',
    name: 'Vikramaditya "Vikram" Deshmukh',
    roleInNetwork: 'Kingpin / Prime Suspect',
    suspicionLevel: 'HIGH',
    phone: '+91 98201 12345',
    address: 'Bandra West, Mumbai',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    details: 'Key syndicate leader managing illegal money routing and vehicle registrations.',
    evidenceCount: 7
  },
  {
    id: 'P007',
    type: 'Person',
    name: 'Amit Kumar',
    roleInNetwork: 'Middleman / Financial Intermediary',
    suspicionLevel: 'HIGH',
    phone: '+91 98201 99887',
    address: 'Kalyan East, Thane',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    details: 'Handles hawala cash movements and shell account transfers for P001.',
    evidenceCount: 5
  },
  {
    id: 'P011',
    type: 'Person',
    name: 'Suresh Patil',
    roleInNetwork: 'Associate / Logistics Handler',
    suspicionLevel: 'MEDIUM',
    phone: '+91 98920 44332',
    address: 'Panvel, Navi Mumbai',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    details: 'Provides vehicle storage and clandestine transportation services.',
    evidenceCount: 3
  },
  {
    id: 'V003',
    type: 'Vehicle',
    name: 'MH02AB1234 (Black SUV)',
    roleInNetwork: 'Transport Vehicle',
    suspicionLevel: 'MEDIUM',
    details: 'Registered under proxy name. Frequently sighted at ANPR locations near P001 residency.',
    evidenceCount: 4
  },
  {
    id: 'A001',
    type: 'Account',
    name: 'HDFC-****-9901 (Mule Account)',
    roleInNetwork: 'Financial Shell Account',
    suspicionLevel: 'HIGH',
    details: 'Used for laundering ₹5,00,000 cash deposits from P007 to offshore vendors.',
    evidenceCount: 6
  }
];

export const mockNetworkNodes = [
  { id: 'P001', label: 'P001 (Vikram Deshmukh)', type: 'Person', role: 'Kingpin', x: 220, y: 140, color: '#ef4444' },
  { id: 'P007', label: 'P007 (Amit Kumar)', type: 'Person', role: 'Middleman', x: 440, y: 220, color: '#ef4444' },
  { id: 'P011', label: 'P011 (Suresh Patil)', type: 'Person', role: 'Logistics', x: 220, y: 380, color: '#f59e0b' },
  { id: 'TX-00121', label: 'TX-00121 (₹5,00,000)', type: 'Transaction', role: 'Financial', x: 650, y: 140, color: '#3b82f6' },
  { id: 'CDR-00821', label: 'CDR-00821 (42 calls)', type: 'CDR', role: 'Telecom', x: 330, y: 80, color: '#8b5cf6' },
  { id: 'V003', label: 'V003 (Black SUV)', type: 'Vehicle', role: 'Transport', x: 440, y: 380, color: '#10b981' },
  { id: 'FIR-221', label: 'FIR-221 (Goa Case)', type: 'Case', role: 'Cross-case', x: 650, y: 300, color: '#6366f1' }
];

export const mockNetworkEdges = [
  { id: 'E1', source: 'P001', target: 'P007', label: '42 Encrypted Calls (CDR-00821)', type: 'CDR', confidence: '94%' },
  { id: 'E2', source: 'P007', target: 'TX-00121', label: 'Hawala Transfer ₹5,00,000', type: 'Financial', confidence: '98%' },
  { id: 'E3', source: 'P001', target: 'P011', label: 'Field Sighting (FN-003)', type: 'Intelligence', confidence: '85%' },
  { id: 'E4', source: 'P007', target: 'V003', label: 'Vehicle Sighting', type: 'ANPR', confidence: '89%' },
  { id: 'E5', source: 'TX-00121', target: 'FIR-221', label: 'Money Trail Link', type: 'Cross-Case', confidence: '91%' }
];

export const mockEvidence = [
  {
    id: 'TX-00121',
    type: 'Financial',
    category: 'Hawala Transfer',
    mediaType: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
    title: 'Mule Account Wire ₹5,00,000 (UTR: HDFC8829103)',
    date: '2026-08-28 14:22 IST',
    source: 'FIU Alert / HDFC AML Gateway',
    suspicion: 'HIGH',
    amount: '₹5,00,000',
    caseId: 'FIR-104',
    officer: 'Inspector Sharma (IO)',
    seizureLocation: 'HDFC Bank Fort Branch, Mumbai',
    custodyLocker: 'VAL-04 (Financial Vault)',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    integrityVerified: true,
    summary: 'Direct transfer of ₹5,00,000 from mule account A001 (Kavita Shinde) to P007 shell firm ledger.',
    description: 'Suspicious RTGS transaction flagged by FIU-IND with velocity anomalies. Originating account opened with forged Aadhaar credentials. Funds swiftly withdrawn via ATMs across South Mumbai within 30 minutes.',
    linkedEntities: ['P001', 'P007', 'A001'],
    videoDetails: {
      duration: '01:30',
      resolution: '1080p Full HD (CCTV)',
      fps: '30 FPS',
      cameraId: 'ATM-CCTV-COLABA-04',
      timestampOverlay: '2026-08-28 14:55:12 IST',
      timestamps: [
        { time: '00:08', label: 'Operative in dark hoodie approaches ATM terminal' },
        { time: '00:32', label: 'Mule Card inserted (Acct A001)' },
        { time: '01:05', label: '₹4,50,000 cash bundles liquidated and secured' }
      ]
    },
    forensics: {
      modality: 'financial',
      bankName: 'HDFC Bank Ltd',
      accountNumber: 'XXXX-XXXX-4921',
      beneficiary: 'Zenith Logistics & Impex (Shell)',
      utr: 'HDFCR5202608280049210',
      flowGraph: [
        { step: 'Originator', entity: 'Mule Account A001', amount: '₹5,00,000', time: '14:22 IST' },
        { step: 'Intermediary', entity: 'P007 Zenith Logistics', amount: '₹4,85,000', time: '14:28 IST' },
        { step: 'Cash Liquidation', entity: 'Colaba ATM Clustered Withdrawal', amount: '₹4,50,000', time: '14:55 IST' }
      ]
    },
    chainOfCustody: [
      { step: 1, action: 'Seized & Frozen via Sec 102 CrPC', date: '2026-08-28 15:30 IST', officer: 'SI R. Rao (Badge 4819)', location: 'HDFC AML Cell' },
      { step: 2, action: 'Bank Statement Ledger Certified under Sec 65B', date: '2026-08-29 11:00 IST', officer: 'Inspector Sharma', location: 'Cyber Crime Cell' },
      { step: 3, action: 'Deposited to Court Vault Evidence Registry', date: '2026-08-30 16:45 IST', officer: 'Head Constable D. Patil', location: 'Sessions Court Vault Locker 12' }
    ]
  },
  {
    id: 'CDR-00821',
    type: 'Telecommunication',
    category: 'Call Detail Record & Wiretap',
    mediaType: 'audio',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400',
    title: 'Encrypted Burst Calls (42 Interceptions)',
    date: '2026-08-29 23:10 IST',
    source: 'Telecom Provider Telemetry (Airtel/Jio)',
    suspicion: 'HIGH',
    callCount: 42,
    caseId: 'FIR-104',
    officer: 'Sub-Inspector R. Rao',
    seizureLocation: 'Cell Tower Triangulation Cell #4019, Bandra West',
    custodyLocker: 'DIG-09 (Telecom Server)',
    hash: 'a9f24c965b719468987bcf921d7bfa546871a25bc20c153835698b67f70b779a',
    integrityVerified: true,
    summary: 'High density late-night phone conversations between +919820112345 (P001) and +919820199887 (P007).',
    description: '42 voice calls and packet bursts recorded over 72 hours immediately preceding the extortion dispatch. IMEI analysis indicates SIM swap and burner handset switching.',
    linkedEntities: ['P001', 'P007'],
    audioDetails: {
      duration: '06:24',
      bitrate: '128 kbps AAC',
      sampleRate: '44.1 kHz 16-bit'
    },
    forensics: {
      modality: 'telecom',
      sourceNumber: '+91 98201 12345 (P001)',
      targetNumber: '+91 98201 99887 (P007)',
      imei: '864921049281726',
      durationSeconds: 384,
      cellTowerId: 'TWR-MUM-BND-4019 (Azimuth 120°)',
      transcriptSnippet: '[23:11:04] P001: "Is the consignment cleared at the dock?"\n[23:11:18] P007: "The driver is waiting at Godown 4. Transfer the remaining 5L to the ledger."\n[23:11:35] P001: "Check UTR HDFC8829103 now. Move before 4 AM."',
      waveformSamples: [12, 45, 78, 90, 65, 34, 88, 92, 40, 25, 70, 85, 95, 60, 30, 75, 80, 42, 18, 60]
    },
    chainOfCustody: [
      { step: 1, action: 'Lawful Interception Order Signed (Home Dept)', date: '2026-08-27 10:00 IST', officer: 'DCP Crime Branch', location: 'CID Telemetry Center' },
      { step: 2, action: 'Raw CDR Log Extracted with SHA-256 Checksum', date: '2026-08-29 23:30 IST', officer: 'Tech Specialist Neha Verma', location: 'Cyber Forensics Lab' },
      { step: 3, action: 'Sec 65B Indian Evidence Act Certificate Attached', date: '2026-08-30 10:15 IST', officer: 'Inspector Sharma', location: 'CID Evidence Registry' }
    ]
  },
  {
    id: 'DIG-00442',
    type: 'Digital Forensics',
    category: 'Encrypted Handset Clone',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    title: 'OnePlus 11 5G Physical EnCase Clone (256 GB)',
    date: '2026-08-30 08:30 IST',
    source: 'Seizure Panchnama at Bandra Hideout',
    suspicion: 'HIGH',
    caseId: 'FIR-104',
    officer: 'Inspector Sharma',
    seizureLocation: 'Flat 402, Sea Crest Apartments, Bandra',
    custodyLocker: 'SAFE-01 (Faraday Evidence Cage)',
    hash: '7b91d29381a7b4f8c921049281726ca9821048bcae9102837461928374619283',
    integrityVerified: true,
    summary: 'Full bitstream physical extraction of suspect mobile device recovered inside Faraday isolation pouch.',
    description: 'UFED Cellebrite extraction completed. Recovered 14 deleted Signal chat messages, 8 geolocated photo files of extortion targets, and encrypted private key fragments.',
    linkedEntities: ['P001', 'P007', 'P011'],
    imageDetails: {
      resolution: '3840 x 2160 (4K Raw)',
      sensor: 'DFL Kalina Lab Hex Workstation',
      exif: 'UFED 4PC v7.68 Bitstream Audit Match',
      annotations: [
        { x: 25, y: 35, width: 50, height: 30, label: 'Deleted Signal chat log fragment (Decrypted)' },
        { x: 15, y: 70, width: 70, height: 20, label: 'Encrypted crypto wallet mnemonic key' }
      ]
    },
    forensics: {
      modality: 'hardware',
      deviceModel: 'OnePlus 11 5G (CPH2447)',
      serialNumber: 'OP11-8849201948',
      osVersion: 'Android 14 / OxygenOS',
      toolUsed: 'Cellebrite UFED 4PC v7.68 / EnCase Forensic v22.4',
      recoveredItems: '14 Deleted Signal Chats, 8 Geo-Tagged Photos, 2 Crypto Wallet Mnemonic Notes',
      gpsWaypoints: '19.0596° N, 72.8295° E (Bandra Reclamation)'
    },
    chainOfCustody: [
      { step: 1, action: 'Seized in Faraday Bag with 2 Independent Panchas', date: '2026-08-30 08:30 IST', officer: 'Inspector Sharma', location: 'Bandra Crime Scene' },
      { step: 2, action: 'Delivered to State Digital Forensics Lab (Kalina)', date: '2026-08-30 14:00 IST', officer: 'Constable S. Kadam', location: 'DFL Kalina Locker 4' },
      { step: 3, action: 'Read-Only Hardware Write-Block Clone Generated', date: '2026-08-31 09:15 IST', officer: 'Dr. V. Kulkarni (Forensic Scientist)', location: 'DFL Kalina Clean Room' }
    ]
  },
  {
    id: 'ANPR-4410',
    type: 'Surveillance',
    category: 'ANPR Camera Match',
    mediaType: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
    title: 'Vehicle MH02AB1234 Toll Plaza Sighting (CCTV Video)',
    date: '2026-08-31 03:12 IST',
    source: 'National Highway Toll Surveillance (NH48)',
    suspicion: 'MEDIUM',
    caseId: 'FIR-104',
    officer: 'Sub-Inspector R. Rao',
    seizureLocation: 'Khalapur Toll Plaza, Mumbai-Pune Expressway',
    custodyLocker: 'SRV-02 (Surveillance Archive)',
    hash: 'c281048bfa91028374619283746192837b91d29381a7b4f8c921049281726ca9',
    integrityVerified: true,
    summary: 'Vehicle V003 (Black Scorpio MH-02-AB-1234) captured moving towards Goa border at 03:12 AM.',
    description: 'High-speed ANPR camera matched license plate with 99.4% confidence score. Front windshield camera snapshot confirms suspect P001 in passenger seat with an unidentified driver.',
    linkedEntities: ['V003', 'P001'],
    videoDetails: {
      duration: '02:44',
      resolution: '4K Ultra HD (3840x2160)',
      fps: '60 FPS',
      cameraId: 'CAM-09-TOLL-KHALAPUR-LN4',
      timestampOverlay: '2026-08-31 03:12:18 IST',
      timestamps: [
        { time: '00:14', label: 'Black Scorpio enters Toll Lane 4' },
        { time: '00:48', label: 'ANPR OCR lock: MH-02-AB-1234 (99.4% Confidence)' },
        { time: '01:22', label: 'Front windshield snapshot: Suspect P001 verified' }
      ]
    },
    forensics: {
      modality: 'surveillance',
      plateNumber: 'MH 02 AB 1234',
      confidence: '99.4% OCR Confidence',
      vehicleMake: 'Mahindra Scorpio N (Black Metallic)',
      speedRecorded: '104 km/h (FastTag Active)',
      cameraLocation: 'Lane 04, Khalapur Expressway Toll (18.8310° N, 73.2842° E)',
      fastTagId: 'FTG-8829-1092-4410'
    },
    chainOfCustody: [
      { step: 1, action: 'Automated ANPR Alert Triggered on Hotlist', date: '2026-08-31 03:12 IST', officer: 'NHAI Control Room Alert', location: 'Toll Server' },
      { step: 2, action: 'CCTV Video High-Res Footage Preserved', date: '2026-08-31 04:30 IST', officer: 'Highway Police IO M. Gaikwad', location: 'Khalapur Outpost' },
      { step: 3, action: 'Integrated with Case FIR-104 File', date: '2026-08-31 08:00 IST', officer: 'Inspector Sharma', location: 'CID Central Archive' }
    ]
  },
  {
    id: 'FN-003',
    type: 'Intelligence',
    category: 'HUMINT Field Memo',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    title: 'Informant Surveillance Photo at Gateway Hotel',
    date: '2026-08-30 19:45 IST',
    source: 'Field Intelligence Officer 14 (Confidential Informant)',
    suspicion: 'MEDIUM',
    caseId: 'FIR-104',
    officer: 'FIO-14 (Intelligence Wing)',
    seizureLocation: 'Gateway Grandeur Hotel Lobby & Parking, Colaba',
    custodyLocker: 'SEC-03 (Confidential Files)',
    hash: '9028374619283746192837b91d29381a7b4f8c921049281726ca9c281048bfa9',
    integrityVerified: true,
    summary: 'Informant witnessed P001 meeting associate P011 outside hotel parking basement.',
    description: 'Informant Memo code-named "OP BLUEBIRD". Target P001 handed over an unsealed brown leather envelope suspected to contain duplicate vehicle registration documents and cash.',
    linkedEntities: ['P001', 'P011'],
    imageDetails: {
      resolution: '5120 x 2880 (5K Telephoto)',
      sensor: 'Nikon D850 with 400mm Telephoto Lens',
      exif: 'F/2.8 • 1/1000s • ISO 800 • GPS Tagged',
      annotations: [
        { x: 35, y: 30, width: 30, height: 45, label: 'Target P001 & P011 Handover Zone' }
      ]
    },
    forensics: {
      modality: 'intelligence',
      informantCode: 'SOURCE-KILO-09',
      reliabilityScore: 'Grade A (Verified History)',
      meetingDuration: '14 Minutes',
      observedItems: 'Brown Leather Folder, Black Briefcase'
    },
    chainOfCustody: [
      { step: 1, action: 'Field Note Transcribed in Confidential Diary', date: '2026-08-30 20:30 IST', officer: 'FIO-14', location: 'Secret Office' },
      { step: 2, action: 'Countersigned by Assistant Commissioner of Police', date: '2026-08-31 09:00 IST', officer: 'ACP K. Deshmukh', location: 'Crime Branch HQ' }
    ]
  },
  {
    id: 'BAL-00912',
    type: 'Physical & Ballistics',
    category: 'Forensic Ballistics Seizure',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1584281722572-8ef96d65a88e?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584281722572-8ef96d65a88e?w=400',
    title: '9mm Spent Cartridge Casings & Beretta Handgun',
    date: '2026-08-27 22:45 IST',
    source: 'Crime Scene Recovery Panchnama',
    suspicion: 'HIGH',
    caseId: 'FIR-104',
    officer: 'Inspector Sharma',
    seizureLocation: 'Alleyway behind Nariman Point Commercial Complex',
    custodyLocker: 'ARM-01 (Armory Ballistics Vault)',
    hash: '48bcae91028374619283746192837b91d29381a7b4f8c921049281726ca9c281',
    integrityVerified: true,
    summary: 'One 9mm Beretta pistol (serial defaced) and 3 empty brass cartridge casings recovered.',
    description: 'Striation marks on cartridge casings match test-fire ballistics from the illegal firearm recovered from P001 associate godown. Latent thumb impression lifted from magazine casing.',
    linkedEntities: ['P001', 'P007'],
    imageDetails: {
      resolution: '4096 x 2730 (Macro Optical)',
      sensor: 'Leica Comparative Ballistics Microscope',
      exif: 'Focal: 50mm Macro • ISO 100 • 1/250s',
      annotations: [
        { x: 30, y: 40, width: 30, height: 30, label: 'Breech face striation match (98.7%)' },
        { x: 68, y: 55, width: 22, height: 25, label: 'Latent thumbprint ridge pattern' }
      ]
    },
    forensics: {
      modality: 'ballistics',
      caliber: '9x19mm Parabellum',
      striationMatchPercentage: '98.7% Confirmed Match',
      afisFingerprintMatch: 'Match with NAFIS Record #MH-2022-09419 (P001)',
      primerResidue: 'Positive for Lead Styphnate & Barium'
    },
    chainOfCustody: [
      { step: 1, action: 'Recovered with Rubber-Tipped Tongs into Anti-Static Box', date: '2026-08-27 23:00 IST', officer: 'Forensic Officer D. Joshi', location: 'Nariman Point' },
      { step: 2, action: 'Delivered to Ballistics Section, FSL Kalina', date: '2026-08-28 09:30 IST', officer: 'Constable A. Shinde', location: 'FSL Kalina Ballistics Lab' },
      { step: 3, action: 'Comparative Microscope Report Signed by Ballistics Chief', date: '2026-08-29 17:00 IST', officer: 'Dr. M. Soni', location: 'FSL Kalina' }
    ]
  },
  {
    id: 'CCTV-0089',
    type: 'Surveillance',
    category: 'CCTV Video Footage',
    mediaType: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
    title: 'Nhava Sheva Freight CFS Container Breach (4K Video)',
    date: '2026-08-29 02:20 IST',
    source: 'Customs Port Surveillance Network',
    suspicion: 'HIGH',
    caseId: 'FIR-104',
    officer: 'Inspector Sharma',
    seizureLocation: 'Freight Station Gate 12, Nhava Sheva Port, Navi Mumbai',
    custodyLocker: 'SRV-04 (Port Archives)',
    hash: '58f1928374619283746192837b91d29381a7b4f8c921049281726ca9c281048b',
    integrityVerified: true,
    summary: 'High-definition port security video footage capturing unauthorized container seal breach and cargo handover.',
    description: '4K CCTV footage from camera pole 12 confirms unlisted truck backing up to container #FAL-88219. Two individuals matching P007 and P011 descriptions observed unloading crates.',
    linkedEntities: ['P007', 'P011', 'V003'],
    videoDetails: {
      duration: '03:15',
      resolution: '4K Ultra HD (3840x2160)',
      fps: '30 FPS',
      cameraId: 'CFS-GATE-CAM-12-SOUTH',
      timestampOverlay: '2026-08-29 02:20:45 IST',
      timestamps: [
        { time: '00:22', label: 'Unscheduled container truck arrives at Bay 4' },
        { time: '01:10', label: 'Customs bolt seal tampered with hydraulic cutter' },
        { time: '02:40', label: 'Cargo transferred into Falcon Logistics van' }
      ]
    },
    forensics: {
      modality: 'surveillance',
      plateNumber: 'MH 04 CZ 9918',
      confidence: '98.2% Vehicle Match',
      vehicleMake: 'Tata 407 Cargo Van',
      cameraLocation: 'Bay 4, Nhava Sheva Freight Station'
    },
    chainOfCustody: [
      { step: 1, action: 'Direct DVR Export with SHA-256 Checksum', date: '2026-08-29 06:00 IST', officer: 'Customs Port Officer M. Nair', location: 'Port Security Server' },
      { step: 2, action: 'Preserved under Forensic Write-Blocker Protocol', date: '2026-08-29 11:30 IST', officer: 'Inspector Sharma', location: 'CID Digital Lab' }
    ]
  },
  {
    id: 'DOC-00518',
    type: 'Legal & Statutory',
    category: 'Search & Seizure Panchnama',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    title: 'Sec 105 BNSS Panchnama & Locker Seizure',
    date: '2026-08-29 16:30 IST',
    source: 'Statutory Judicial Seizure Memo',
    suspicion: 'MEDIUM',
    amount: '₹37,50,000 in Cash & Gold',
    caseId: 'FIR-104',
    officer: 'Inspector Sharma',
    seizureLocation: 'Safe Deposit Vault #108, Indian Overseas Bank, Colaba',
    custodyLocker: 'LEG-05 (Judicial Custody File)',
    hash: '19283746192837b91d29381a7b4f8c921049281726ca9c281048bfa948bcae91',
    integrityVerified: true,
    summary: 'Official Panchnama attested by two independent gazetted panchas with seizure of cash and bullion.',
    description: 'Seizure Memo prepared on-site following search warrant issued by Chief Metropolitan Magistrate. Itemized seizure includes ₹37,50,000 counterfeit-grade currency and ledger notebooks.',
    linkedEntities: ['P001', 'P007', 'A001'],
    imageDetails: {
      resolution: '3300 x 2550 (300 DPI Scanner)',
      sensor: 'High-Res Optical Document Scanner',
      annotations: [
        { x: 15, y: 75, width: 70, height: 15, label: 'Official CMM Search Warrant Stamp & Judicial Seal' }
      ]
    },
    forensics: {
      modality: 'legal',
      warrantNumber: 'CMM/MUM/W-8892/2026',
      panchas: '1. S. K. Mahajan (Gazetted Officer), 2. P. R. Joshi (Bank Manager)',
      seizedArticles: '₹37,50,000 Currency Notes, 2 Gold Bars (100g each), 1 Red Hardbound Ledger'
    },
    chainOfCustody: [
      { step: 1, action: 'Panchnama executed in presence of 2 independent panchas', date: '2026-08-29 16:30 IST', officer: 'Inspector Sharma', location: 'IOB Vault Colaba' },
      { step: 2, action: 'Original copy submitted to Chief Metropolitan Magistrate', date: '2026-08-30 11:00 IST', officer: 'Public Prosecutor Office', location: 'CMM Court No. 3' }
    ]
  }
];

export const mockTimelineEvents = [
  {
    id: 'TL-01',
    time: '2026-08-28 14:22 IST',
    category: 'Financial',
    icon: 'credit-card',
    color: '#f59e0b',
    title: 'Bank Transfer ₹5,00,000 (TX-00121)',
    description: 'Suspicious Hawala mule account transaction initiated between A001 and P007.',
    entities: ['P007', 'A001']
  },
  {
    id: 'TL-02',
    time: '2026-08-29 23:10 IST',
    category: 'Communication',
    icon: 'phone-call',
    color: '#ef4444',
    title: 'Burst Call Activity (CDR-00821)',
    description: '42 call interactions recorded between prime suspect P001 and middleman P007.',
    entities: ['P001', 'P007']
  },
  {
    id: 'TL-03',
    time: '2026-08-30 19:45 IST',
    category: 'Field Intelligence',
    icon: 'eye',
    color: '#10b981',
    title: 'Field Informant Sighting (FN-003)',
    description: 'HUMINT report confirms physical meeting between P001 and logistics handler P011.',
    entities: ['P001', 'P011']
  },
  {
    id: 'TL-04',
    time: '2026-08-31 03:12 IST',
    category: 'Surveillance',
    icon: 'camera',
    color: '#8b5cf6',
    title: 'ANPR Highway Toll Capture (ANPR-4410)',
    description: 'Vehicle MH02AB1234 captured heading south along NH-48 interstate corridor.',
    entities: ['V003', 'P001']
  }
];

export const mockDocuments = [
  {
    id: 'DOC-104-A',
    title: 'FIR-104 Official Police Complaint & Incident Report',
    date: '2026-08-27',
    author: 'Sub-Inspector R. K. Varma',
    type: 'FIR Copy',
    classification: 'CONFIDENTIAL',
    summary: 'Primary incident report detailing counterfeiting and extortion complaints filed by complainant.'
  },
  {
    id: 'DOC-104-B',
    title: 'FIU Intelligence Alert #9901 — Hawala Cash Trail',
    date: '2026-08-29',
    author: 'Financial Intelligence Unit (FIU-IND)',
    type: 'Financial Report',
    classification: 'SECRET',
    summary: 'Suspicious transaction report highlighting rapid money movements across multiple shell accounts.'
  }
];

export const mockCanvasBoards = [
  {
    id: 'CAN-001',
    caseId: 'FIR-104',
    title: 'FIR-104 Main Syndicate Investigation Corkboard',
    version: 'Version 3 (Latest)',
    versionsAvailable: ['Version 1 (Initial Setup)', 'Version 2 (Added CDR Links)', 'Version 3 (Latest)'],
    lastEditedBy: 'Inspector Sharma',
    lastEditedTime: '2026-09-02 11:30 AM',
    objects: [
      { id: 'c-1', type: 'entity', entityId: 'P001', label: 'P001: Vikramaditya Deshmukh\n(Kingpin)', x: 180, y: 100, color: '#ef4444' },
      { id: 'c-2', type: 'entity', entityId: 'P007', label: 'P007: Amit Kumar\n(Financial Intermediary)', x: 420, y: 200, color: '#ef4444' },
      { id: 'c-3', type: 'evidence', evidenceId: 'TX-00121', label: 'TX-00121\n₹5,00,000 Hawala Transfer', x: 650, y: 100, color: '#f59e0b' },
      { id: 'c-4', type: 'note', label: 'Investigator Note:\nVerify Hawala cash handler at Gateway Hotel meeting', x: 180, y: 350, color: '#2563eb' }
    ],
    connections: [
      { from: 'c-1', to: 'c-2', label: 'CDR Call Burst (42 calls)' },
      { from: 'c-2', to: 'c-3', label: 'Bank Transfer Route' },
      { from: 'c-1', to: 'c-4', label: 'Field Lead' }
    ]
  }
];

// Image 1: Recent Cases (20 Count) & Old Cases (2000 Count Summary)
export const mockRecentCasesList = [
  { id: 'FIR-104', title: 'Syndicate Extortion & Money Laundering', category: 'Robbery & Extortion', region: 'Maharashtra', count: 18, priority: 'HIGH', assigned: 'Inspector Sharma' },
  { id: 'FIR-221', title: 'Cross-Border Narcotics Supply Pipeline', category: 'Narcotics', region: 'Goa', count: 24, priority: 'HIGH', assigned: 'Inspector Patil' },
  { id: 'FIR-089', title: 'Commercial Bank Cyber Intrusion', category: 'Cyber Crime', region: 'Cyber Cell', count: 11, priority: 'MEDIUM', assigned: 'Analyst Khan' },
  { id: 'FIR-312', title: 'Armed Robbery at Diamond Exchange', category: 'Robbery & Extortion', region: 'Maharashtra', count: 15, priority: 'HIGH', assigned: 'Inspector Sharma' },
  { id: 'FIR-405', title: 'Homicide at Sector 14 Industrial Park', category: 'Murder', region: 'Delhi NCR', count: 29, priority: 'HIGH', assigned: 'Inspector Patil' },
  { id: 'FIR-511', title: 'Crypto Ransomware Attack on Municipal Grid', category: 'Cyber Crime', region: 'Cyber Cell', count: 34, priority: 'HIGH', assigned: 'Analyst Khan' },
  { id: 'FIR-620', title: 'Social Media Identity Theft & Extortion Syndicate', category: 'Social Media Extortion', region: 'Karnataka', count: 9, priority: 'MEDIUM', assigned: 'Inspector Sharma' },
  { id: 'FIR-734', title: 'Highway Truck Hijacking & Goods Diversion', category: 'Robbery & Extortion', region: 'Maharashtra', count: 12, priority: 'MEDIUM', assigned: 'Inspector Patil' },
  { id: 'FIR-882', title: 'Illegal Firearms Smuggling Syndicate', category: 'Organized Crime', region: 'Delhi NCR', count: 21, priority: 'HIGH', assigned: 'Inspector Sharma' },
  { id: 'FIR-901', title: 'Deepfake Financial Fraud Targetting Seniors', category: 'Cyber Crime', region: 'West Bengal', count: 16, priority: 'MEDIUM', assigned: 'Analyst Khan' }
];

export const mockOldCasesSummary = {
  totalCount: 2000,
  breakdown: [
    { category: 'Robbery & Extortion', count: 680, icon: 'shield-alert', color: '#ef4444' },
    { category: 'Murder & Homicide', count: 420, icon: 'alert-octagon', color: '#dc2626' },
    { category: 'Cyber Crime & Phishing', count: 540, icon: 'wifi-off', color: '#3b82f6' },
    { category: 'Social Media Crime', count: 360, icon: 'share-2', color: '#8b5cf6' }
  ]
};

// Image 3: Global & India Cyber / Crime Incident Tracker Data
export const mockTrackerStats = {
  totalIncidents: 6257,
  resolved: 3582,
  ongoing: 2392,
  critical: 474,
  lastUpdated: 'Just now'
};

export const mockIncidentTypes = [
  { type: 'DDoS Attacks', percentage: 41, color: '#3b82f6' },
  { type: 'Phishing Operations', percentage: 21, color: '#06b6d4' },
  { type: 'Ransomware', percentage: 17, color: '#f59e0b' },
  { type: 'Data Breach & Extortion', percentage: 11, color: '#ec4899' },
  { type: 'Armed Robbery & Other', percentage: 10, color: '#64748b' }
];

export const mockTopRegions = [
  { region: 'Maharashtra (Mumbai / Pune)', count: 2450, percentage: 39 },
  { region: 'Delhi NCR (Special Cell)', count: 1820, percentage: 29 },
  { region: 'Karnataka (Bengaluru CCPS)', count: 980, percentage: 15 },
  { region: 'Telangana (Hyderabad Cyberabad)', count: 620, percentage: 10 },
  { region: 'West Bengal (Kolkata Cyber)', count: 387, percentage: 7 }
];

export const mockLiveIncidentFeed = [
  { time: '11:07', type: 'UPI Mule Transfer', location: 'Maharashtra (Mumbai South)', severity: 'HIGH', status: 'ONGOING' },
  { time: '11:02', type: 'SIM Swap Extortion', location: 'Delhi NCR (Dwarka)', severity: 'MEDIUM', status: 'RESOLVED' },
  { time: '10:45', type: 'Hawala Transit Trail', location: 'Goa Coastal (Panaji)', severity: 'HIGH', status: 'ONGOING' },
  { time: '10:51', type: 'Ransomware Alert', location: 'Karnataka (Bengaluru CCPS)', severity: 'CRITICAL', status: 'ACTIVE' },
  { time: '10:30', type: 'Aadhaar AEPS Spoofing', location: 'West Bengal (Kolkata)', severity: 'HIGH', status: 'INVESTIGATING' }
];

// Image 4: Police Style Analytics & Hourly Heatmap Data
export const mockPoliceMetrics = {
  totalCrimes: 3866,
  resolutionRate: '92.7%',
  avgSeverity: '6.33',
  avgTimeToResolveDays: '0.81',
  avgTimeToReportDays: '7.68'
};

export const mockShiftDistribution = [
  { shift: 'Evening (4PM-12AM)', percentage: 43.0, color: '#ef4444' },
  { shift: 'Day (8AM-4PM)', percentage: 39.1, color: '#f59e0b' },
  { shift: 'Midnight (12AM-8AM)', percentage: 17.8, color: '#3b82f6' }
];

export const mockAMPMDistribution = [
  { time: 'PM Hours', percentage: 64.9, color: '#dc2626' },
  { time: 'AM Hours', percentage: 35.1, color: '#2563eb' }
];

// 24 Hour x 7 Days Hourly Heatmap Grid (0 = low, 5 = critical)
export const mockHourlyHeatmapMatrix = [
  { day: 'Monday', hours: [1,1,2,1,0,0,1,2,3,4,4,5,4,3,4,5,6,8,9,8,7,5,3,2] },
  { day: 'Tuesday', hours: [0,1,1,0,0,1,2,3,4,5,4,4,3,4,5,6,7,8,9,7,6,4,2,1] },
  { day: 'Wednesday', hours: [1,0,0,0,1,1,2,4,5,4,5,6,5,4,6,7,8,9,8,7,5,3,2,1] },
  { day: 'Thursday', hours: [2,1,1,0,0,1,3,4,4,6,5,5,4,5,7,8,9,9,8,6,5,4,3,2] },
  { day: 'Friday', hours: [2,2,1,1,0,1,2,3,5,6,7,7,6,7,8,9,10,10,9,8,7,6,4,3] },
  { day: 'Saturday', hours: [3,3,2,1,1,0,1,2,4,6,8,9,8,8,9,10,10,9,8,7,6,5,4,3] },
  { day: 'Sunday', hours: [4,3,2,2,1,1,0,1,3,5,7,8,7,6,7,8,9,8,7,6,5,4,3,2] }
];

// Image 2: Tactical Suspect Dossiers & Biometrics Data
export const mockSuspectDossiers = [
  {
    id: 'OP-442-01',
    name: 'LAURA JOHN JONES',
    code: 'ABACUS-23819',
    gender: 'FEMALE',
    dob: '1992-04-14',
    height: '172 cm',
    nationality: 'BRITISH',
    career: 'CYBER FINANCIAL / HAWALA',
    squad: 'ALPHA-9',
    status: 'ACTIVE TARGET',
    trackCode: 'TRK-9901-X',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    bpm: 116,
    dnaMatch: '99.4%',
    riskRating: 'HIGH',
    recentOp: 'MULE TRANSFER UK-IN'
  },
  {
    id: 'OP-442-02',
    name: 'DAVID SYDNEY CROSS',
    code: 'ATLAS-77102',
    gender: 'MALE',
    dob: '1988-11-22',
    height: '185 cm',
    nationality: 'AMERICAN',
    career: 'ARMED SYNDICATE LEAD',
    squad: 'BRAVO-3',
    status: 'ACTIVE TARGET',
    trackCode: 'TRK-4412-B',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    bpm: 98,
    dnaMatch: '98.1%',
    riskRating: 'CRITICAL',
    recentOp: 'HIGHWAY TRUCK HIJACK'
  },
  {
    id: 'OP-442-03',
    name: 'VIKRAMADITYA DESHMUKH',
    code: 'KINGPIN-104',
    gender: 'MALE',
    dob: '1984-06-08',
    height: '178 cm',
    nationality: 'INDIAN',
    career: 'ORGANIZED CRIME SYNDICATE',
    squad: 'CENTRAL-1',
    status: 'PRIME SUSPECT',
    trackCode: 'TRK-104-V',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    bpm: 104,
    dnaMatch: '99.9%',
    riskRating: 'CRITICAL',
    recentOp: 'FIR-104 MONEY LAUNDERING'
  },
  {
    id: 'OP-442-04',
    name: 'AMIT PATEL',
    code: 'INTERMEDIARY-07',
    gender: 'MALE',
    dob: '1990-09-30',
    height: '175 cm',
    nationality: 'INDIAN',
    career: 'HAWALA & MULE ACCOUNTS',
    squad: 'DELTA-4',
    status: 'UNDER SURVEILLANCE',
    trackCode: 'TRK-221-A',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
    bpm: 88,
    dnaMatch: '96.5%',
    riskRating: 'HIGH',
    recentOp: 'GOA NARCOTICS PIPELINE'
  }
];

export const mockAudioTranscriptLog = [
  { timestamp: '04:12:02', speaker: 'LMP', text: 'Okay, I am going to check Inverter 1. Inverter 2 is good, and so is Inverter 3.' },
  { timestamp: '04:12:15', speaker: 'CDR', text: 'Tom, good. We have a circuit breaker trip on line 4.' },
  { timestamp: '04:12:30', speaker: 'CDR-P001', text: 'Confirming transfer of ₹5,00,000 cash packet at toll plaza.' },
  { timestamp: '04:12:48', speaker: 'CDR-P007', text: 'Understood. Route proceeds through HDFC mule account A001 immediately.' }
];

