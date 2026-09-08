// Real Statutory Indian Police FIR Form II Datasets (Under Section 154 Cr.P.C. / u/s 173 BNSS)
// Designed to replicate official Crime and Criminal Tracking Network & Systems (CCTNS) standards

export const mockFIRDetails = {
  'FIR-104': {
    id: 'FIR-104',
    firNumber: '104/2026',
    state: 'Maharashtra',
    district: 'Mumbai South',
    policeStation: 'Special Narcotics & Organized Crime Unit / Colaba P.S.',
    year: '2026',
    cctnsId: 'MH-MUM-2026-FIR-000104-X9',
    digitalHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    dateOfRegistration: '27/08/2026',
    timeOfRegistration: '10:30 IST',
    gdEntryNo: 'GD-441/2026',
    gdDateTime: '27/08/2026 09:15 IST',
    
    // Acts and Sections
    actsAndSections: [
      { act: 'Indian Penal Code, 1860 / BNS 2023', sections: 'Sec 420 (Cheating), Sec 384 (Extortion), Sec 467/468 (Forgery), Sec 120B (Criminal Conspiracy)' },
      { act: 'Information Technology Act, 2000', sections: 'Sec 66C (Identity Theft), Sec 66D (Cheating by Impersonation using Computer Resource)' },
      { act: 'Prevention of Money Laundering Act, 2002', sections: 'Sec 3 & Sec 4 (Offence of Money Laundering)' }
    ],

    // Occurrence of Offence
    occurrence: {
      dayFrom: 'Monday',
      dateFrom: '25/08/2026',
      timeFrom: '21:00 IST',
      dayTo: 'Wednesday',
      dateTo: '27/08/2026',
      timeTo: '04:00 IST',
      priorInfoReceivedDate: '27/08/2026',
      priorInfoReceivedTime: '09:15 IST',
      typeOfInformation: 'Written & Certified Electronic Record'
    },

    // Place of Occurrence
    placeOfOccurrence: {
      directionAndDistance: '3.2 KM South-West from Police Station',
      beatNo: 'Beat IV / Marine Drive Sector',
      address: 'Suite 402, Nariman Bhavan, Nariman Point, Mumbai - 400021 (and multiple coordinated cyber endpoints)',
      outsideLimitPs: 'Inter-district links identified in Thane, Navi Mumbai & Pune rural'
    },

    // Complainant / Informant
    complainant: {
      name: 'Rajeshwar K. Sengupta',
      fatherOrHusbandName: 'Late K. N. Sengupta',
      dobOrAge: '50 Years (DOB: 14/05/1976)',
      nationality: 'Indian',
      occupation: 'Chief Vigilance Officer, National Commercial Banking Consortium',
      idProof: 'Govt Service ID #CVO-MUM-9941 / PAN: ABCPS1234K',
      address: '14-B, Reserve Bank Officers Enclave, Cuffe Parade, Mumbai - 400005',
      phone: '+91 98200 44551'
    },

    // Details of Known / Suspected / Unknown Accused
    accusedList: [
      {
        id: 'P001',
        name: 'Vikramaditya "Vikram" Deshmukh',
        alias: 'VD / Kingpin / The Boss',
        fatherName: 'Madhav Deshmukh',
        address: 'Bungalow 7, Bandra West, Mumbai',
        role: 'Prime Accused / Syndicate Mastermind',
        status: 'ABSCONDING / HIGH RISK TARGET',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        identifyingMarks: 'Scar on left forearm, height 178 cm'
      },
      {
        id: 'P007',
        name: 'Amit Kumar',
        alias: 'Amit Bhai / Operator',
        fatherName: 'Ramakant Kumar',
        address: 'Flat 301, Shanti Heights, Kalyan East, Thane',
        role: 'Financial Intermediary / Hawala Cash Mule Handler',
        status: 'UNDER ACTIVE SURVEILLANCE',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        identifyingMarks: 'Mole on right cheek'
      },
      {
        id: 'P011',
        name: 'Suresh Patil',
        alias: 'Logistics Suresh',
        fatherName: 'Dnyaneshwar Patil',
        address: 'Plot 88, Sector 19, Panvel, Navi Mumbai',
        role: 'Transport & Safehouse Coordinator',
        status: 'DETAINED FOR QUESTIONING',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        identifyingMarks: 'Tattoo on right wrist'
      }
    ],

    // Particulars of Properties Stolen / Extorted / Laundered
    propertiesInvolved: [
      { itemNo: 1, description: 'Laundered Hawala cash routed via HDFC Mule Account A001 (TX-00121)', value: '₹5,00,000/-', recoveryStatus: 'Frozen by Cyber Cell' },
      { itemNo: 2, description: 'Black Mahindra Scorpio SUV (Reg: MH02AB1234) used for illicit movement', value: '₹18,50,000/-', recoveryStatus: 'Identified on ANPR / Impounded lead' },
      { itemNo: 3, description: 'Total Syndicate Financial Extortion Target Quantum', value: '₹5,00,00,000/-', recoveryStatus: 'Trail under investigation' }
    ],

    totalPropertyValue: '₹5,00,00,000/- (Rupees Five Crores Only)',
    reasonForDelay: 'No delay. Matter reported immediately following FIU-IND suspicious transaction anomaly detection and extortion threat verification.',
    inquestReportNo: 'N/A (No loss of human life reported)',

    // First Information Contents (Verbatim Written Narrative)
    firstInformationContents: `TO THE OFFICER IN CHARGE,
SPECIAL NARCOTICS & ORGANIZED CRIME UNIT / COLABA POLICE STATION, MUMBAI.

SUBJECT: COMPLAINT REGARDING EXTORTION, MULTI-CRORE HAWALA MONEY LAUNDERING, ELECTRONIC IDENTITY FORGERY, AND CRIMINAL CONSPIRACY UNDER IPC SEC 420, 384, 467, 120B AND IT ACT SEC 66C/66D.

Sir,
I, Rajeshwar K. Sengupta, residing at 14-B Reserve Bank Officers Enclave, Cuffe Parade, serving as Chief Vigilance Officer for the National Commercial Banking Consortium, do hereby report serious criminal conduct orchestrated against member banking institutions.

Between 25/08/2026 and 27/08/2026, our internal automated fraud mitigation engines flagged systematic extortion demands and fraudulent electronic clearing requests totaling ₹5,00,00,000/-. Preliminary forensic inspection established that prime suspect VIKRAMADITYA DESHMUKH (P001), in criminal conspiracy with intermediary AMIT KUMAR (P007) and logistics associate SURESH PATIL (P011), utilized fraudulent KYC documents to establish mule bank accounts (including HDFC Account ending ****9901).

On 28/08/2026, an unauthorized debit of ₹5,00,000/- (TX-00121) was transacted through shell entities to fund syndicate transport logistics involving vehicle MH02AB1234. Furthermore, telecommunication telemetry records (CDR-00821) confirm over 42 late-night encrypted telephonic coordination bursts between +91 98201 12345 (P001) and +91 98201 99887 (P007).

Given the cognizable gravity of inter-state financial extortion, cyber fraud, and money laundering, it is respectfully prayed that this First Information Report be registered and immediate forensic seizures and custodial warrants be executed.

Yours faithfully,
Sd/-
(Rajeshwar K. Sengupta)
Chief Vigilance Officer`,

    // Action Taken & Investigating Officer
    actionTaken: 'Since the above report reveals commission of cognizable offence(s) as mentioned under Item No. 2, registered the case and took up investigation. Directed Lead Investigating Officer to seize electronic evidence, freeze bank accounts, and apprehend prime suspects.',
    investigatingOfficer: {
      name: 'Inspector Sharma',
      rank: 'Inspector of Police (Crime Branch)',
      badgeNo: 'MH-POL-88410',
      policeStation: 'Special Narcotics & Organized Crime Unit, Mumbai'
    },
    
    stationHouseOfficer: {
      name: 'Senior Inspector K. R. Kadam',
      rank: 'Senior P.I. / Station House Officer',
      badgeNo: 'MH-POL-10022'
    },

    magistrateDispatchDate: '27/08/2026',
    magistrateDispatchTime: '11:15 IST',
    magistrateCourt: "Hon'ble Court of Additional Chief Metropolitan Magistrate, 37th Court, Esplanade, Mumbai"
  },

  'FIR-221': {
    id: 'FIR-221',
    firNumber: '221/2026',
    state: 'Goa',
    district: 'Goa Coastal',
    policeStation: 'Anti-Narcotics Task Force / Calangute P.S.',
    year: '2026',
    cctnsId: 'GA-COAST-2026-FIR-000221-N4',
    digitalHash: 'f4a8b192c73d9e01824a7bc910248e9102ab3984c102938475a6c8e99921ab48',
    dateOfRegistration: '01/09/2026',
    timeOfRegistration: '16:15 IST',
    gdEntryNo: 'GD-119/2026',
    gdDateTime: '01/09/2026 15:30 IST',
    
    actsAndSections: [
      { act: 'Narcotic Drugs and Psychotropic Substances Act, 1985', sections: 'Sec 8(c), Sec 20(b)(ii)(C), Sec 29 (Abetment & Criminal Conspiracy)' },
      { act: 'Indian Penal Code, 1860 / BNS 2023', sections: 'Sec 120B (Conspiracy), Sec 468 (Forgery)' }
    ],

    occurrence: {
      dayFrom: 'Sunday',
      dateFrom: '31/08/2026',
      timeFrom: '22:00 IST',
      dayTo: 'Monday',
      dateTo: '01/09/2026',
      timeTo: '06:00 IST',
      priorInfoReceivedDate: '01/09/2026',
      priorInfoReceivedTime: '15:30 IST',
      typeOfInformation: 'Written Informant Secret Intelligence Report'
    },

    placeOfOccurrence: {
      directionAndDistance: '5.8 KM North-East from Calangute Police Station',
      beatNo: 'Beat II / Coastal Highway Sector',
      address: 'Warehouse Complex near Baga-Arpora Junction, North Goa - 403516',
      outsideLimitPs: 'Inter-state contraband supply pipeline extending to Mumbai South (FIR-104 Link)'
    },

    complainant: {
      name: 'Sub-Inspector R. B. Sawant',
      fatherOrHusbandName: 'B. T. Sawant',
      dobOrAge: '38 Years',
      nationality: 'Indian',
      occupation: 'Sub-Inspector of Police, Anti-Narcotics Cell',
      idProof: 'Goa Police Departmental ID #GA-POL-4410',
      address: 'Anti-Narcotics Bureau, Crime Branch HQ, Ribandar, Goa',
      phone: '+91 83224 10099'
    },

    accusedList: [
      {
        id: 'P007',
        name: 'Amit Kumar',
        alias: 'Operator / Cashier',
        fatherName: 'Ramakant Kumar',
        address: 'Thane / Goa Coastal Transit',
        role: 'Hawala Fund Conduit & Coastal Pipeline Financer',
        status: 'LINKED VIA FINANCIAL TRAIL',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        identifyingMarks: 'Mole on right cheek'
      },
      {
        id: 'P001',
        name: 'Vikramaditya Deshmukh (Alias VD)',
        alias: 'Kingpin',
        fatherName: 'Madhav Deshmukh',
        address: 'Bandra West, Mumbai',
        role: 'Beneficiary & Strategic Syndicate Overseer',
        status: 'UNDER CHARGESHEET INQUIRY',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        identifyingMarks: 'Scar on left forearm'
      }
    ],

    propertiesInvolved: [
      { itemNo: 1, description: 'Commercial Quantity Contraband consignment seized during checkpoint raid', value: '₹42,00,000/-', recoveryStatus: 'Deposited in Malkhana / Forensic seal' },
      { itemNo: 2, description: 'Prepaid Hawala cash vouchers and encrypted satellite phone handsets', value: '₹3,50,000/-', recoveryStatus: 'Forensic extraction underway' }
    ],

    totalPropertyValue: '₹45,50,000/- (Rupees Forty-Five Lakhs Fifty Thousand Only)',
    reasonForDelay: 'Nil. Interception executed during active midnight transit raid.',
    inquestReportNo: 'N/A',

    firstInformationContents: `TO THE STATION HOUSE OFFICER,
ANTI-NARCOTICS CELL / CALANGUTE POLICE STATION, GOA.

SUBJECT: REGISTRATION OF CASE UNDER NDPS ACT SEC 8(C), 20(B)(II)(C), 29 AND IPC 120B REGARDING CROSS-BORDER NARCOTICS SUPPLY CHAIN.

Sir,
I, Sub-Inspector R. B. Sawant, state that on reliable HUMINT intelligence regarding high-volume narcotic shipments entering the coastal tourist circuit via NH-48 interstate corridor, checkpoint surveillance was mounted near Baga-Arpora junction.

During vehicle interception at 03:12 AM, suspect courier operatives linked to Amit Kumar (P007) and Vikramaditya Deshmukh (P001) were intercepted transporting commercial quantity psychotropic substances. Financial telemetry links confirmed hawala routing corresponding with Mumbai FIR-104.

Hence this FIR is registered for immediate custodial interrogation and asset freezing.

Sd/-
(Sub-Inspector R. B. Sawant)`,

    actionTaken: 'Case registered under NDPS Act. Investigation handed over to Inspector Patil, District Intelligence Cell.',
    investigatingOfficer: {
      name: 'Inspector Patil',
      rank: 'Inspector of Police (Intelligence)',
      badgeNo: 'GA-POL-9921',
      policeStation: 'District Intelligence Cell, Goa'
    },
    stationHouseOfficer: {
      name: 'Senior Inspector D. Rodrigues',
      rank: 'SHO / Senior Inspector',
      badgeNo: 'GA-POL-1004'
    },
    magistrateDispatchDate: '01/09/2026',
    magistrateDispatchTime: '17:00 IST',
    magistrateCourt: "Hon'ble Special NDPS Court, Mapusa, North Goa"
  },

  'FIR-089': {
    id: 'FIR-089',
    firNumber: '89/2026',
    state: 'Maharashtra',
    district: 'National Cyber Crime Cell',
    policeStation: 'Cyber Crime Police Station / BKC Mumbai',
    year: '2026',
    cctnsId: 'MH-CYBER-2026-FIR-000089-C1',
    digitalHash: 'a8f9c412b3e7019dc7d2e99104b83fa1f1e400392bc194a2e291c7849102ab39',
    dateOfRegistration: '30/08/2026',
    timeOfRegistration: '14:20 IST',
    gdEntryNo: 'GD-892/2026',
    gdDateTime: '30/08/2026 13:40 IST',
    
    actsAndSections: [
      { act: 'Information Technology Act, 2000', sections: 'Sec 43, Sec 66 (Computer Related Offences), Sec 66C (Identity Theft), Sec 66D' },
      { act: 'Indian Penal Code, 1860 / BNS 2023', sections: 'Sec 420 (Cheating), Sec 468 (Forgery for Purpose of Cheating), Sec 120B' }
    ],

    occurrence: {
      dayFrom: 'Friday',
      dateFrom: '28/08/2026',
      timeFrom: '14:00 IST',
      dayTo: 'Saturday',
      dateTo: '29/08/2026',
      timeTo: '18:00 IST',
      priorInfoReceivedDate: '30/08/2026',
      priorInfoReceivedTime: '13:40 IST',
      typeOfInformation: 'Written Electronic Incident Submission via CERT-In'
    },

    placeOfOccurrence: {
      directionAndDistance: '4.5 KM North-East from Cyber Cell BKC',
      beatNo: 'Cyber Infrastructure Sector 9',
      address: 'Core Banking Data Center & Cloud Gateway, Bandra-Kurla Complex (BKC), Mumbai - 400051',
      outsideLimitPs: 'Offshore IP proxies in Eastern Europe & mule bank accounts across Delhi/Mumbai'
    },

    complainant: {
      name: 'Ananya Deshpande',
      fatherOrHusbandName: 'M. V. Deshpande',
      dobOrAge: '42 Years',
      nationality: 'Indian',
      occupation: 'Chief Information Security Officer (CISO), Commercial Apex Bank',
      idProof: 'Aadhaar / Corporate Sec ID #CISO-BKC-002',
      address: 'Plot C-12, G-Block, Bandra Kurla Complex, Mumbai - 400051',
      phone: '+91 98331 77662'
    },

    accusedList: [
      {
        id: 'CYBER-SYN-01',
        name: 'Unknown Threat Actors / "DarkMesh Syndicate"',
        alias: 'Phantom Node / Proxy Mule Ring',
        fatherName: 'Unknown',
        address: 'Operating through bulletproof hosting and VPN proxies',
        role: 'Intrusion, Malware Deployment & Mule Account Siphon',
        status: 'ACTIVE TRACING',
        identifyingMarks: 'Digital Signature Hash Match'
      }
    ],

    propertiesInvolved: [
      { itemNo: 1, description: 'Diverted electronic commercial funds through 14 mule accounts', value: '₹1,85,00,000/-', recoveryStatus: '₹1.1 Cr frozen in transit' }
    ],

    totalPropertyValue: '₹1,85,00,000/- (Rupees One Crore Eighty-Five Lakhs Only)',
    reasonForDelay: 'Technical root-cause analysis by CERT-In forensic auditors before formal complaint filing.',
    inquestReportNo: 'N/A',

    firstInformationContents: `TO THE ASSISTANT COMMISSIONER OF POLICE,
CYBER CRIME POLICE STATION, BKC, MUMBAI.

SUBJECT: REPORT OF ADVANCED PERSISTENT THREAT (APT) INTRUSION, PRIVILEGE ESCALATION, AND UNAUTHORIZED WIRE TRANSFERS UNDER IT ACT SEC 43/66/66C/66D & IPC 420/120B.

Respected Sir,
I, Ananya Deshpande, CISO, submit that an unauthorized cyber intrusion breached perimeter API gateways between 28/08/2026 and 29/08/2026, executing unauthorized RTGS diversion totaling ₹1.85 Crores to 14 mule bank accounts.

Immediate assistance is requested to freeze remaining funds and subpoena ISP access logs.

Sd/-
(Ananya Deshpande)`,

    actionTaken: 'Case registered. Investigation entrusted to Analyst Khan, Cyber Crime Intelligence Unit.',
    investigatingOfficer: {
      name: 'Analyst Khan',
      rank: 'Cyber Intelligence Analyst / Sub-Inspector',
      badgeNo: 'MH-CYB-5520',
      policeStation: 'Cyber Crime Police Station, BKC'
    },
    stationHouseOfficer: {
      name: 'ACP S. V. More',
      rank: 'Assistant Commissioner of Police (Cyber)',
      badgeNo: 'MH-POL-0041'
    },
    magistrateDispatchDate: '30/08/2026',
    magistrateDispatchTime: '15:30 IST',
    magistrateCourt: "Hon'ble Cyber Court, Ballard Pier, Mumbai"
  }
};

// Helper to generate dynamic FIR details for newly registered FIRs
export function generateRealFIRRecord(firData, currentUser) {
  const cleanId = firData.id || `FIR-${Math.floor(100 + Math.random() * 899)}`;
  const numPart = cleanId.replace(/\D/g, '') || `${Math.floor(100 + Math.random() * 899)}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';

  return {
    id: cleanId,
    firNumber: `${numPart}/2026`,
    state: 'Maharashtra',
    district: firData.district || 'Mumbai South',
    policeStation: `${firData.district || 'Mumbai South'} Crime Branch / Central P.S.`,
    year: '2026',
    cctnsId: `MH-${numPart}-2026-FIR-${Math.floor(1000 + Math.random() * 9000)}-D1`,
    digitalHash: Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
    dateOfRegistration: dateStr,
    timeOfRegistration: timeStr,
    gdEntryNo: `GD-${Math.floor(100 + Math.random() * 899)}/2026`,
    gdDateTime: `${dateStr} ${timeStr}`,
    
    actsAndSections: [
      { act: 'Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita (BNS)', sections: firData.category?.includes('Robbery') ? 'Sec 392 (Robbery), Sec 384 (Extortion), Sec 120B (Criminal Conspiracy)' : firData.category?.includes('Cyber') ? 'Sec 420 (Cheating), Sec 66C/66D IT Act 2000' : firData.category?.includes('Murder') ? 'Sec 302/103 (Murder), Sec 34 (Common Intention)' : 'Sec 420, Sec 468, Sec 120B (Conspiracy)' },
      { act: 'Special & Local Laws (SLL)', sections: 'Applicable Criminal Procedure Code (Cr.P.C. 154 / BNSS 173)' }
    ],

    occurrence: {
      dayFrom: 'Recent Occurrence',
      dateFrom: dateStr,
      timeFrom: '08:00 IST',
      dayTo: 'Same Day',
      dateTo: dateStr,
      timeTo: timeStr,
      priorInfoReceivedDate: dateStr,
      priorInfoReceivedTime: timeStr,
      typeOfInformation: 'Written Police Complaint / CCTNS Digital Entry'
    },

    placeOfOccurrence: {
      directionAndDistance: '2.5 KM East from Jurisdictional Police Station',
      beatNo: 'Beat No. 03 / Central Sector',
      address: `Incident Sector, ${firData.district || 'Mumbai South'} Jurisdiction`,
      outsideLimitPs: 'Inter-district coordination alerted'
    },

    complainant: {
      name: firData.complainantName || 'Authorized State Informant / Complainant',
      fatherOrHusbandName: firData.complainantFather || 'Father / Guardian Name on Record',
      dobOrAge: '45 Years',
      nationality: 'Indian',
      occupation: 'Government / Private Reporting Party',
      idProof: 'Govt Aadhaar / Departmental ID Verified',
      address: `${firData.district || 'Mumbai South'}, Maharashtra`,
      phone: '+91 98200 ' + Math.floor(10000 + Math.random() * 90000)
    },

    accusedList: [
      {
        id: firData.suspectId || 'SUSPECT-01',
        name: firData.suspectName || 'Unknown / Named Accused under Verification',
        alias: 'Primary Target',
        fatherName: 'On Record',
        address: `${firData.district || 'Jurisdiction Area'}`,
        role: 'Primary Accused',
        status: 'ACTIVE TARGET / WARRANT PENDING',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        identifyingMarks: 'Identified through CCTNS network records'
      }
    ],

    propertiesInvolved: [
      { itemNo: 1, description: `Seized Assets / Evidence linked to ${firData.title}`, value: '₹25,00,000/-', recoveryStatus: 'Under Active Seizure' }
    ],

    totalPropertyValue: '₹25,00,000/- (Rupees Twenty-Five Lakhs Only)',
    reasonForDelay: 'Nil. Promptly registered upon receipt of formal complaint.',
    inquestReportNo: 'N/A',

    firstInformationContents: `TO THE OFFICER IN CHARGE,
POLICE DEPARTMENT / JURISDICTIONAL CRIME UNIT.

SUBJECT: REGISTRATION OF FIRST INFORMATION REPORT FOR ${firData.title?.toUpperCase() || 'CRIMINAL INCIDENT'}.

Sir,
I, the undersigned complainant, do hereby formally report that an offence concerning ${firData.category || 'Organized Crime'} was committed in the jurisdiction of ${firData.district || 'Mumbai'}.

${firData.description || 'The suspects coordinated unlawful actions resulting in damages and violation of statutory provisions.'}

Accused person(s) identified: ${firData.suspectName || 'Under active identification'}.

It is requested that formal proceedings under Section 154 Cr.P.C. / BNSS be initiated and lawful action executed forthwith.

Yours faithfully,
Sd/-
(${firData.complainantName || 'Complainant'})`,

    actionTaken: `Case officially registered under statutory provisions. Investigation assigned to ${firData.assignedTo || currentUser?.name || 'Inspector Sharma'}.`,
    investigatingOfficer: {
      name: firData.assignedTo || currentUser?.name || 'Inspector Sharma',
      rank: 'Inspector of Police (Lead IO)',
      badgeNo: 'MH-POL-' + Math.floor(1000 + Math.random() * 8999),
      policeStation: `${firData.district || 'Mumbai South'} Crime Branch`
    },
    stationHouseOfficer: {
      name: 'Senior Inspector S. H. Deshmukh',
      rank: 'Station House Officer (SHO)',
      badgeNo: 'MH-SHO-7712'
    },
    magistrateDispatchDate: dateStr,
    magistrateDispatchTime: timeStr,
    magistrateCourt: `Hon'ble Metropolitan Magistrate Court, ${firData.district || 'Mumbai'}`
  };
}
