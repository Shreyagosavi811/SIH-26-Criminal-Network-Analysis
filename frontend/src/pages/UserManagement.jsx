import React, { useState, useMemo } from 'react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { mockUsers, mockActivityLogs } from '../data/mockData.js';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Users, 
  FileText, 
  History, 
  Clock, 
  Search, 
  Filter, 
  Lock, 
  Key, 
  Download, 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  MoreVertical, 
  Shield, 
  Laptop, 
  Smartphone, 
  RefreshCw, 
  Eye, 
  UserCheck, 
  Fingerprint, 
  Layers, 
  Edit3, 
  Trash2,
  Copy
} from 'lucide-react';

export function UserManagement() {
  const { openModal, showToast, currentUser } = useInvestigation();

  const [activeTab, setActiveTab] = useState('users'); // 'users', 'logs', 'history', 'matrix'
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [logCategoryFilter, setLogCategoryFilter] = useState('All');
  const [copiedHashId, setCopiedHashId] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Local state for users so user can interactively toggle status or view
  const [usersList, setUsersList] = useState(mockUsers);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesDept = u.department?.toLowerCase().includes(q);
        const matchesRole = u.role?.toLowerCase().includes(q);
        const matchesId = u.id?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept && !matchesRole && !matchesId) return false;
      }
      if (roleFilter !== 'All' && u.role?.toLowerCase() !== roleFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [usersList, userSearchQuery, roleFilter]);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return mockActivityLogs.filter(log => {
      if (logCategoryFilter !== 'All' && log.riskLevel?.toUpperCase() !== logCategoryFilter.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [logCategoryFilter]);

  const toggleUserStatus = (userId) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        showToast(`${u.name} status updated to ${nextStatus}`, nextStatus === 'ACTIVE' ? 'success' : 'warning');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const copyHash = (hash, id) => {
    if (hash) {
      navigator.clipboard?.writeText(hash);
      setCopiedHashId(id);
      showToast(`Copied SHA-256 Hash for log ${id}`, 'info');
      setTimeout(() => setCopiedHashId(null), 2000);
    }
  };

  const handleAuditExport = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      showToast('Exported Cryptographic Security & Access Ledger (PDF)', 'success');
    }, 800);
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'investigator':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'analyst':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans max-w-7xl mx-auto select-none">
      
      {/* 1. TOP KPI METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{usersList.length} Officers</div>
            <div className="text-xs text-slate-500 font-medium">Authorized Personnel</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight">100% Verified</div>
            <div className="text-xs text-slate-500 font-medium">Security Clearances</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{mockActivityLogs.length} Records</div>
            <div className="text-xs text-slate-500 font-medium">24h Audit Trail</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">3 Terminals</div>
            <div className="text-xs text-slate-500 font-medium">Active Secure Sessions</div>
          </div>
        </div>
      </div>

      {/* 2. TOP ACTION HEADER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mb-1">
              <span>Security Administration & Access Control</span>
              <span>•</span>
              <span className="font-bold text-slate-800">CCTNS Statutory Compliance</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Officer Access & Security Logs</h1>
            <p className="text-xs text-slate-500 mt-0.5">Role-based access matrix, biometrics clearance, and immutable cryptographic audit ledger</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              onClick={handleAuditExport}
              disabled={isAuditing}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Download className={`w-3.5 h-3.5 text-slate-600 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Generating...' : 'Export Audit Log'}</span>
            </button>

            <button 
              onClick={() => openModal('add-user')}
              className="btn-primary"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register Officer</span>
            </button>
          </div>
        </div>

        {/* Focused Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full overflow-x-auto text-xs font-semibold pt-1">
          {[
            { id: 'users', label: 'Officer Directory & Roles', icon: Users, count: usersList.length },
            { id: 'logs', label: 'Cryptographic Audit Trail', icon: FileText, count: mockActivityLogs.length },
            { id: 'history', label: 'Session & Studio History', icon: History },
            { id: 'matrix', label: 'Role Capability Matrix', icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full font-semibold text-xs flex items-center space-x-2 transition-all shrink-0 ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-5 shadow-xs">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input 
                type="text" 
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search officer name, badge ID, email, or department..." 
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {userSearchQuery && (
                <button onClick={() => setUserSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold">✕</button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Role Filter:</span>
              {['All', 'Admin', 'Investigator', 'Analyst'].map(r => (
                <button 
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    roleFilter === r ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Officers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  <th className="p-4 rounded-l-xl">Officer Identity</th>
                  <th className="p-4">Role & Unit</th>
                  <th className="p-4">Jurisdiction Scope</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200 shrink-0 shadow-xs">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{u.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start space-y-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                        <span className="text-slate-600 text-xs font-semibold">{u.department}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start space-y-1.5">
                        <span className="text-slate-800 text-xs font-semibold">{u.accessScope || 'Statewide CID Jurisdiction'}</span>
                        <span className="text-slate-500 text-[10px] font-mono">ID: {u.id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleUserStatus(u.id)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors shadow-xs ${
                          u.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle account status"
                      >
                        {u.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{u.status}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => showToast(`Verified security profile & digital certificate for ${u.name}`, 'info')}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200 shadow-xs"
                        title="View Security Permissions"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">Policy</span>
                      </button>
                      <button 
                        onClick={() => openModal('add-user', { user: u })}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-blue-600 rounded-lg transition-colors border border-slate-200 shadow-xs"
                        title="Edit Officer Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB 2: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cryptographic Audit Trail (CCTNS Compliance)</h3>
              <p className="text-xs text-slate-500">Immutable ledger of every search, case file access, evidence retrieval, and biometric query</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Severity:</span>
              {['All', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
                <button 
                  key={lvl}
                  onClick={() => setLogCategoryFilter(lvl)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    logCategoryFilter === lvl ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-3.5 rounded-l-xl">Timestamp</th>
                  <th className="p-3.5">Officer (WHO)</th>
                  <th className="p-3.5">Action Performed</th>
                  <th className="p-3.5">Resource / Case</th>
                  <th className="p-3.5">Terminal IP</th>
                  <th className="p-3.5">Risk Level</th>
                  <th className="p-3.5 rounded-r-xl text-right">Hash Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{log.userRole}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 max-w-xs">{log.actionText}</div>
                      <div className="text-[10px] text-blue-600 font-medium">{log.actionCategory}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200">
                        {log.targetResource}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      <div>{log.ipAddress}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{log.device}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        log.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        log.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {log.riskLevel}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-[10px] whitespace-nowrap">
                      <button 
                        onClick={() => copyHash(log.hashSignature, log.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg font-bold transition-colors"
                        title="Click to copy log signature"
                      >
                        {copiedHashId === log.id ? 'COPIED' : log.hashSignature}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 3: SYSTEM & CORKBOARD HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Investigative Studio Version History & Auth Trail</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated timestamped snapshots of Corkboard diagramming, evidence pins, and terminal sessions</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
              Continuous Ledger
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <History className="w-4 h-4 text-blue-600" />
                <span>Corkboard Studio Canvas History</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">Inspector Sharma (IO)</span>
                    <span className="text-[10px] text-slate-400">11:30 AM Today</span>
                  </div>
                  <p className="text-xs text-slate-600">Added red yarn string between P001 (Vikramaditya) and P007 (Amit Kumar) with CDR memo.</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">Inspector Patil</span>
                    <span className="text-[10px] text-slate-400">Yesterday 16:15 IST</span>
                  </div>
                  <p className="text-xs text-slate-600">Pinned Hawala exhibit TX-00121 (₹5,00,000) and updated sketch annotations.</p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Authentication & Session Logs</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">Admin Login (Inspector Sharma)</span>
                    <span className="text-emerald-700 font-bold text-[10px]">ACTIVE</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">Terminal: Gov-Terminal-04 • IP: 10.204.12.89</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">Mobile Field Terminal Login</span>
                    <span className="text-slate-400 text-[10px]">12 mins ago</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">Device: Mobile-Intel-Pad • IP: 10.204.14.102</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: ROLE CAPABILITY MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Role-Based Access Control (RBAC) Permissions Matrix</h3>
            <p className="text-xs text-slate-500">Statutory authority and privilege bounds defined per Cr.P.C. / BNSS operational guidelines</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-3.5 rounded-l-xl">Operational Capability</th>
                  <th className="p-3.5 text-center">Admin</th>
                  <th className="p-3.5 text-center">Lead Investigator</th>
                  <th className="p-3.5 rounded-r-xl text-center">Forensic Analyst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {[
                  { name: 'Register & Edit Statutory Form II FIRs', admin: true, inv: true, analyst: false },
                  { name: 'View Classified Evidence Vault & Hashes', admin: true, inv: true, analyst: true },
                  { name: 'Perform UFED / Wiretap Forensic Extraction', admin: true, inv: true, analyst: true },
                  { name: 'Export Cryptographic Legal Manifests', admin: true, inv: true, analyst: false },
                  { name: 'Edit & Save Corkboard Canvas Diagrams', admin: true, inv: true, analyst: true },
                  { name: 'Manage Officer Accounts & Security Clearance', admin: true, inv: false, analyst: false },
                  { name: 'Access Confidential HUMINT Field Notes', admin: true, inv: true, analyst: false }
                ].map((cap, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{cap.name}</td>
                    <td className="p-3.5 text-center">
                      {cap.admin ? <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                    </td>
                    <td className="p-3.5 text-center">
                      {cap.inv ? <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                    </td>
                    <td className="p-3.5 text-center">
                      {cap.analyst ? <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
