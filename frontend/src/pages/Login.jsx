import React, { useState } from 'react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { Shield, Lock, UserCheck, ArrowRight } from 'lucide-react';

export function Login() {
  const { login, setUserRole } = useInvestigation();
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [id, setId] = useState('USR-001 (Inspector Sharma)');
  const [password, setPassword] = useState('••••••••••••');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setUserRole(role);
    if (role === 'Admin') setId('USR-001 (Inspector Sharma)');
    else if (role === 'Investigator') setId('USR-002 (Inspector Patil)');
    else if (role === 'Analyst') setId('USR-003 (Analyst Khan)');
    else setId('admin@sih2026.gov'); // Demo Supabase Email
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    try {
      // Only attempt real Supabase auth if it looks like an email
      if (id.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: id,
          password: password,
        });
        
        if (error) throw error;
      }
      
      // Update global context (works for both real auth and mock fallback)
      login(id, password);
    } catch (error) {
      console.warn("Supabase auth failed. Falling back to mock login.", error.message);
      // Fallback for demo purposes if Supabase isn't configured yet
      login(id, password);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center shadow-xs">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Criminal Investigation Platform</h1>
            <p className="text-xs text-slate-500 mt-0.5">Authorized Law Enforcement & CID Portal</p>
          </div>
        </div>

        {/* Role Quick Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Active Officer Profile</label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-full">
            {['Admin', 'Investigator', 'Analyst'].map(role => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`py-1.5 px-2 rounded-full font-medium text-xs transition-colors ${
                  selectedRole === role
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Officer Service ID</label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input 
                type="text" 
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Passkey / Security Token</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full btn-primary"
          >
            <span>Sign In to Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-[11px] text-slate-500">
          Official government software. Unauthorized access is punishable under Section 66 of the IT Act.
        </div>
      </div>
    </div>
  );
}
