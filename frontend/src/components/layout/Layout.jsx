import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext.jsx';
import { 
  Shield, 
  Search, 
  Menu, 
  LogOut, 
  Globe, 
  FilePlus, 
  Home, 
  Fingerprint, 
  Users, 
  Settings, 
  LayoutTemplate, 
  ExternalLink, 
  FileText, 
  X, 
  ChevronRight,
  Pin,
  PinOff,
  FolderGit2,
  Sparkles,
  Plus,
  Link2,
  Activity,
  Layers,
  ChevronDown,
  Check
} from 'lucide-react';

export function TopBar() {
  const { 
    currentUser, 
    setUserRole, 
    logout, 
    toggleMobileMenu, 
    searchGlobal, 
    showToast, 
    globalSearchResults,
    isSearchOpen, 
    setIsSearchOpen, 
    navigate,
    openModal,
    isDarkMode,
    toggleDarkMode
  } = useInvestigation();

  return (
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 select-none font-sans shadow-sm">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center space-x-3.5">
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => navigate('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-blue-600 transition-colors">
            <Shield className="w-4.5 h-4.5 text-blue-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center space-x-2">
              <span>CRIMINAL INVESTIGATION PLATFORM</span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">CID Network Telemetry & Case Analysis</p>
          </div>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-6 relative">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by FIR number, suspect name, phone, plate, or evidence..." 
            className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
            onChange={(e) => searchGlobal(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
          />
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchOpen && globalSearchResults && (
          <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 space-y-1 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Records</span>
              <button onClick={() => setIsSearchOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {globalSearchResults.length === 0 ? (
              <div className="text-slate-400 text-center py-4 text-xs">No matching records found</div>
            ) : (
              globalSearchResults.map((res, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    if (res.caseId) navigate('overview', { caseId: res.caseId });
                    setIsSearchOpen(false);
                    showToast(`Opened ${res.title}`, 'info');
                  }}
                  className="p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">{res.title}</div>
                    <div className="text-[11px] text-slate-500">{res.subtitle}</div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                    {res.type}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Actions & Role Switching */}
      <div className="flex items-center space-x-2.5">
        <button 
          onClick={() => openModal('register-fir')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          title="Register New FIR Record"
        >
          <FilePlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New FIR</span>
        </button>

        {/* Role Selector */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          {['Admin', 'Investigator', 'Analyst'].map(role => {
            const isSelected = currentUser && currentUser.role === role;
            return (
              <button
                key={role}
                onClick={() => {
                  setUserRole(role);
                  showToast(`Switched active profile to ${role}`, 'info');
                }}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  isSelected 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-1.5 pl-1">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm" title={`${currentUser.name} (${currentUser.role})`}>
            {currentUser.name ? currentUser.name.charAt(0) : 'U'}
          </div>

          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Sidebar() {
  const { 
    currentPage, 
    currentUser, 
    navigate, 
    isMobileMenuOpen, 
    toggleMobileMenu, 
    currentCanvas, 
    activeCaseId,
    setActiveCaseId,
    cases,
    evidenceList,
    suspectDossiers,
    openModal,
    autoLinkCanvasWithAI,
    showToast 
  } = useInvestigation();

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const isAdmin = currentUser && currentUser.role === 'Admin';
  const isExpanded = isHovered || isPinned;

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Case Files & Hub', 
      icon: Home,
      badge: cases?.length ? `${cases.length}` : '6'
    },
    { 
      id: 'fir', 
      label: 'Statutory FIR Repository', 
      icon: FileText,
      badge: 'FIR'
    },
    { 
      id: 'evidence', 
      label: 'Evidence Vault & Forensics', 
      icon: FolderGit2,
      badge: evidenceList?.length ? `${evidenceList.length}` : '8'
    },
    { 
      id: 'tracker', 
      label: 'Incident Map & Heatmap', 
      icon: Globe,
      isLive: true
    },
    { 
      id: 'dossiers', 
      label: 'Suspect Dossiers & AFIS', 
      icon: Fingerprint,
      badge: suspectDossiers?.length ? `${suspectDossiers.length}` : '9'
    },
    { 
      id: 'overview', 
      label: 'Investigation Workspace', 
      icon: Search,
      badge: 'AI'
    },
    { 
      id: 'users', 
      label: 'Officer Access & Logs', 
      icon: Users, 
      adminOnly: true 
    },
    { 
      id: 'settings', 
      label: 'System Settings', 
      icon: Settings 
    }
  ];

  const renderSidebarContent = (mobile = false) => {
    const showFull = mobile || isExpanded;

    return (
      <div className="p-3 space-y-4 flex-1 overflow-y-auto overflow-x-hidden font-sans text-xs flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header Bar inside Sidebar */}
          <div className="flex items-center justify-between px-2.5 h-7">
            {showFull ? (
              <>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Navigation
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="text-[10px] text-slate-400 font-medium">8 Modules</span>
                </div>
                {!mobile && (
                  <button 
                    onClick={() => {
                      const next = !isPinned;
                      setIsPinned(next);
                      showToast(next ? 'Sidebar pinned open' : 'Sidebar set to hover expand', 'info');
                    }}
                    className={`p-1.5 rounded-lg transition-all ${
                      isPinned 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    title={isPinned ? 'Unpin sidebar (hover mode)' : 'Pin sidebar open'}
                  >
                    {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                )}
                {mobile && (
                  <button onClick={toggleMobileMenu} className="text-slate-400 hover:text-slate-700 p-1 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="w-full flex justify-center">
                <button 
                  onClick={() => setIsPinned(true)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Hover to expand or click to pin"
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map(item => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const isActive = currentPage === item.id || (item.id === 'overview' && (currentPage === 'overview' || currentPage === 'analysis'));

              return (
                <button 
                  key={item.id}
                  onClick={() => {
                    navigate(item.id);
                    if (mobile) toggleMobileMenu();
                  }}
                  title={!showFull ? item.label : undefined}
                  className={`w-full flex items-center transition-all duration-150 relative ${
                    showFull ? 'justify-between px-3 py-2 rounded-lg' : 'justify-center p-2.5 rounded-lg'
                  } font-medium group ${
                    isActive 
                      ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-md"></span>}
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`p-1 rounded-md transition-colors shrink-0 ${
                      isActive 
                        ? 'text-blue-600' 
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {showFull && (
                      <span className="text-xs truncate font-medium tracking-tight">{item.label}</span>
                    )}
                  </div>

                  {showFull && (
                    <div className="flex items-center space-x-1.5 shrink-0 pl-1">
                      {item.isLive && (
                        <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-emerald-50/50 text-emerald-600 border border-emerald-100'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>LIVE</span>
                        </span>
                      )}

                      {item.adminOnly && (
                        <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase transition-colors ${
                          isActive 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-amber-50/50 text-amber-600 border border-amber-100'
                        }`}>
                          ADMIN
                        </span>
                      )}

                      {!item.isLive && !item.adminOnly && item.badge && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                          isActive 
                            ? 'bg-white text-slate-700 border border-slate-200 shadow-sm' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-slate-200'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Corkboard Widget & Officer Profile */}
        <div className="space-y-3 pt-3 border-t border-slate-200">
          {/* Corkboard Workspace Widget */}
          {showFull ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-md bg-blue-50 border border-blue-100 text-blue-600">
                    <LayoutTemplate className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 tracking-tight">
                    Corkboard Studio
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="flex items-center space-x-1 text-[10px] font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>LIVE</span>
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    {currentCanvas?.id || 'CAN-001'}
                  </span>
                </div>
              </div>

              {/* Case Selector & Telemetry */}
              <div className="bg-white border border-slate-200 rounded-lg p-2 space-y-2 shadow-sm">
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="text-slate-500 text-[11px] font-medium">Case:</span>
                    <select
                      value={activeCaseId}
                      onChange={(e) => {
                        setActiveCaseId(e.target.value);
                        showToast(`Switched Corkboard focus to ${e.target.value}`, 'info');
                      }}
                      className="bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {(cases || [{ id: 'FIR-104', title: 'Narcotics Hawala' }]).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[11px] text-blue-600 font-medium bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded shrink-0">
                    {(currentCanvas?.connections || []).length} Links
                  </span>
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 rounded py-1 px-0.5 border border-slate-100">
                    <div className="text-xs font-semibold text-slate-800">
                      {(currentCanvas?.objects || []).filter(o => o.type === 'entity').length}
                    </div>
                    <div className="text-[9px] font-medium text-slate-500">Targets</div>
                  </div>
                  <div className="bg-slate-50 rounded py-1 px-0.5 border border-slate-100">
                    <div className="text-xs font-semibold text-slate-800">
                      {(currentCanvas?.objects || []).filter(o => o.type === 'evidence').length}
                    </div>
                    <div className="text-[9px] font-medium text-slate-500">Exhibits</div>
                  </div>
                  <div className="bg-slate-50 rounded py-1 px-0.5 border border-slate-100">
                    <div className="text-xs font-semibold text-slate-800">
                      {(currentCanvas?.objects || []).filter(o => o.type === 'note' || !o.type).length}
                    </div>
                    <div className="text-[9px] font-medium text-slate-500">Leads</div>
                  </div>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => autoLinkCanvasWithAI()}
                  className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                  title="Use AI to auto-connect related suspects and evidence"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>AI Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => openModal('add-custom-canvas-object')}
                  className="py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-sm"
                  title="Pin custom card or lead to board"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Add Lead</span>
                </button>
              </div>

              {/* Open Studio Action Button */}
              <button 
                onClick={() => {
                  navigate('canvas');
                  if (mobile) toggleMobileMenu();
                }}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Launch Canvas</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center relative">
              <button 
                onClick={() => navigate('canvas')}
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-blue-600 text-white flex items-center justify-center transition-all shadow-sm relative group"
                title={`Corkboard Studio (${activeCaseId}) - ${(currentCanvas?.objects || []).length} pins`}
              >
                <LayoutTemplate className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
                {(currentCanvas?.objects || []).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border border-white shadow-sm">
                    {(currentCanvas?.objects || []).length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Officer Identification Footer */}
          <div className={`border border-slate-200 bg-slate-50 rounded-xl transition-all shadow-sm ${
            showFull ? 'p-2.5' : 'p-2 flex justify-center'
          }`}>
            <div className="flex items-center space-x-2.5">
              <div className="relative shrink-0">
                <div 
                  className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs border border-slate-700" 
                  title={`${currentUser.name} (${currentUser.role})`}
                >
                  {currentUser.name ? currentUser.name.charAt(0) : 'O'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
              </div>

              {showFull && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900 text-xs truncate">{currentUser.name}</div>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{currentUser.role || 'Officer'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{currentUser.department || 'CID Special Crime Branch'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Hover-Expandable Sidebar (Auto-Adjusts Page Layout) */}
      <aside 
        className={`hidden md:flex flex-col justify-between bg-white border-r border-slate-200/90 h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0 transition-all duration-300 ease-in-out overflow-x-hidden ${
          isExpanded ? 'w-64 shadow-md' : 'w-20 shadow-2xs'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs md:hidden flex">
          <aside className="w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between h-full shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
          <div className="flex-1" onClick={toggleMobileMenu}></div>
        </div>
      )}
    </>
  );
}

export function Breadcrumbs() {
  const { currentPage, activeCaseId, activeAnalysisTab, navigate } = useInvestigation();

  const getPageTitle = (page) => {
    switch (page) {
      case 'dashboard': return 'Case Files & Hub';
      case 'fir': return 'Statutory FIR Repository';
      case 'evidence': return 'Evidence Vault & Digital Forensics Hub';
      case 'tracker': return 'Incident Map & Heatmap';
      case 'dossiers': return 'Suspect Dossiers & AFIS';
      case 'overview': return `Case ${activeCaseId} Overview`;
      case 'analysis': return `Case Analysis (${activeAnalysisTab.charAt(0).toUpperCase() + activeAnalysisTab.slice(1)})`;
      case 'canvas': return 'Tactical Corkboard';
      case 'users': return 'Officer Access & Logs';
      case 'settings': return 'System Settings';
      default: return page;
    }
  };

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 md:px-6 py-2.5 flex items-center space-x-2 text-xs font-sans text-slate-500">
      <button 
        onClick={() => navigate('dashboard')}
        className="flex items-center space-x-1 hover:text-slate-900 transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>Hub</span>
      </button>

      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
      <span className="font-semibold text-slate-800">{getPageTitle(currentPage)}</span>
    </div>
  );
}
