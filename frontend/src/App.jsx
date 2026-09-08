import React from 'react';
import { InvestigationProvider, useInvestigation } from './context/InvestigationContext.jsx';
import { TopBar, Sidebar, Breadcrumbs } from './components/layout/Layout.jsx';
import { FloatingAI } from './components/ai/FloatingAI.jsx';
import { Overlays } from './components/common/Overlays.jsx';
import { Settings as SettingsIcon, Database, Radio, Building2, CheckCircle2 } from 'lucide-react';

// Pages
import { Login } from './pages/Login.jsx';
import { InvestigationDashboard } from './pages/InvestigationDashboard.jsx';
import { CrimeTrackerDashboard } from './pages/CrimeTrackerDashboard.jsx';
import { SuspectDossiers } from './pages/SuspectDossiers.jsx';
import { InvestigatorOverview } from './pages/InvestigatorOverview.jsx';
import { InvestigationAnalysis } from './pages/InvestigationAnalysis.jsx';
import { InvestigationCanvas } from './pages/InvestigationCanvas.jsx';
import { UserManagement } from './pages/UserManagement.jsx';
import { FIRSection } from './pages/FIRSection.jsx';
import { EvidencePanel } from './components/evidence/EvidencePanel.jsx';

function MainAppContent() {
  const { currentPage, isAuthenticated } = useInvestigation();

  if (!isAuthenticated || currentPage === 'login') {
    return <Login />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <InvestigationDashboard />;
      case 'fir':
        return <FIRSection />;
      case 'evidence':
        return (
          <div className="max-w-7xl mx-auto">
            <EvidencePanel />
          </div>
        );
      case 'tracker':
        return <CrimeTrackerDashboard />;
      case 'dossiers':
        return <SuspectDossiers />;
      case 'overview':
        return <InvestigatorOverview />;
      case 'analysis':
        return <InvestigationAnalysis />;
      case 'canvas':
        return <InvestigationCanvas />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return (
          <div className="max-w-4xl mx-auto space-y-6 text-slate-800 font-sans">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings & Data Feeds</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Manage API integrations with police FIR databases, CDR telemetry, ANPR cameras, and FIU alerts.</p>
                </div>
              </div>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FIR DB */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">FIR Database Synchronization</h3>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">CCTNS State Police Gateway</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                  <span className="text-[11px] font-mono text-slate-400 font-medium">Last sync: 2 mins ago</span>
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>CONNECTED</span>
                  </div>
                </div>
              </div>

              {/* CDR */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">CDR Telemetry Gateway</h3>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Telecom Provider Intercepts</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                  <span className="text-[11px] font-mono text-slate-400 font-medium">Stream: Encrypted</span>
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* FIU */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">FIU Financial Alert Pipeline</h3>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Financial Intelligence Unit</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                  <span className="text-[11px] font-mono text-slate-400 font-medium">Status: Polling</span>
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <InvestigationDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto transition-all duration-300 ease-in-out">
          <Breadcrumbs />
          <div className="p-3 sm:p-4 md:p-6 flex-1">
            {renderCurrentPage()}
          </div>
        </main>
      </div>

      <FloatingAI />
      <Overlays />
    </div>
  );
}

export function App() {
  return (
    <InvestigationProvider>
      <MainAppContent />
    </InvestigationProvider>
  );
}

export default App;
