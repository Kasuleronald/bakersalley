import React, { useState, useMemo } from 'react';
import { User, AuthSession, TaxConfig } from '../types';
import { COMPLIANCE_DEFINITIONS, TERMS_AND_CONDITIONS } from '../constants';
import { apiClient } from '../services/apiClient';

interface AuthGateProps {
  session: AuthSession;
  onLogin: (user: User, token: string) => void;
  onVerifyMfa: () => void;
  users: User[];
  onRegister: (user: User) => void;
  taxConfig?: TaxConfig;
}

const AuthGate: React.FC<AuthGateProps> = ({ session, onLogin, users, onRegister, taxConfig }) => {
  const [view, setView] = useState<'Login' | 'Register'>('Login');
  const [identity, setIdentity] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Derive consolidated consent text based on active nexus
  const consentText = useMemo(() => {
    const activeIds = taxConfig?.activeJurisdictions || ['UG_DPA_2019', 'EU_GDPR'];
    const names = activeIds.map(id => COMPLIANCE_DEFINITIONS[id]?.name).filter(Boolean);
    return `I agree to the Terms & Conditions and consent to PII collection under ${names.join(' and ')}.`;
  }, [taxConfig]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (view === 'Login') {
      // Granular Login Validation
      if (!identity.trim()) {
        setError("User Identity (Email/ID) is required to access the ledger.");
        return;
      }
      if (!password.trim()) {
        setError("Security Password is required.");
        return;
      }

      setIsAuthenticating(true);
      const auth = await apiClient.login(identity, password);
      setIsAuthenticating(false);

      if (auth?.user && auth?.token) {
        onLogin(auth.user, auth.token);
      } else {
        const matched = users.find(u => u.identity === identity && u.passwordHash === password);
        if (matched) {
          onLogin(matched, 'local-fallback');
          return;
        }

        setError("Invalid username or password.");
      }
    } else if (view === 'Register') {
      // Granular Registration Validation
      if (!name.trim()) {
        setError("Business or Staff Name is required for enrollment.");
        return;
      }
      if (!identity.trim()) {
        setError("User Identity (Email/ID) is required.");
        return;
      }
      if (!password.trim()) {
        setError("A secure password is required.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters for industrial security.");
        return;
      }
      if (!hasConsented) {
        setError("Statutory agreement to terms and data privacy is mandatory.");
        return;
      }

      setIsAuthenticating(true);
      const created = await apiClient.register({ name, identity, password });
      setIsAuthenticating(false);

      if (!created?.user) {
        setError("Unable to create account. Confirm backend connection and try again.");
        return;
      }

      onRegister(created.user);
      setView('Login');
      setSuccessMsg("Account drafted. Your identity is now awaiting administrator clearance.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center app-shell p-4">
      <div className="max-w-md w-full app-panel rounded-[3rem] overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#533f35_0%,#3d2d26_100%)] p-10 text-center text-white relative">
          <div className="text-5xl mb-4">🥐</div>
          <h1 className="text-3xl font-bold font-serif mb-1 tracking-tight">BakersAlley 3.1</h1>
          <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">Enterprise Governance Active</p>
        </div>
        
        <div className="p-10">
          <div className="flex app-tab-group mb-8">
            <button 
              type="button"
              onClick={() => { setView('Login'); setError(null); }} 
              className={`flex-1 app-tab ${view === 'Login' ? 'is-active' : 'text-bakery-400'}`}
            >
              LOGIN
            </button>
            <button 
              type="button"
              onClick={() => { setView('Register'); setError(null); }} 
              className={`flex-1 app-tab ${view === 'Register' ? 'is-active' : 'text-bakery-400'}`}
            >
              SUBSCRIBE
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'Register' && (
              <div className="space-y-1">
                <label className="app-label ml-4">Authorized Entity Name</label>
                <input 
                  className="app-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Full Business/Staff Name" 
                />
              </div>
            )}
            
            <div className="space-y-1">
              <label className="app-label ml-4">User Identity</label>
              <input 
                className="app-input" 
                value={identity} 
                onChange={e => setIdentity(e.target.value)} 
                placeholder="Email or Identity ID" 
              />
            </div>

            <div className="space-y-1">
              <label className="app-label ml-4">Password</label>
              <input 
                type="password" 
                disabled={isAuthenticating} 
                className="app-input" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
              />
            </div>

            {view === 'Register' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3 p-5 rounded-[2rem] border border-bakery-100 bg-bakery-50/70">
                  <input 
                    type="checkbox" 
                    id="privacy-check" 
                    checked={hasConsented} 
                    onChange={e => setHasConsented(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="privacy-check" className="text-[9px] text-bakery-900 leading-relaxed font-bold uppercase cursor-pointer">
                     {consentText}
                  </label>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-[9px] font-black text-bakery-700 uppercase underline tracking-widest block w-full text-center"
                >
                  Read Full Terms & Conditions
                </button>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl animate-softFade">
                <p className="text-rose-600 text-[10px] font-black text-center uppercase tracking-widest">
                  ⚠️ {error}
                </p>
              </div>
            )}
            
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl animate-softFade">
                <p className="text-emerald-600 text-[10px] font-black text-center uppercase tracking-widest">
                  ✓ {successMsg}
                </p>
              </div>
            )}

            <button 
              disabled={isAuthenticating}
              className={`w-full app-button app-button-primary justify-center py-5 mt-4 ${isAuthenticating ? 'opacity-50 animate-pulse cursor-not-allowed' : ''}`}
            >
              {isAuthenticating ? 'Verifying Ledger Access...' : view === 'Login' ? 'Access Secure Ledger' : 'Confirm Subscription'}
            </button>
          </form>
          
          <div className="mt-10 pt-10 border-t border-stone-100 text-center">
             <div className="app-shell-title mb-3">Statutory Guardrail Profile</div>
             <div className="flex justify-center gap-2 flex-wrap">
                {(taxConfig?.activeJurisdictions || ['UG_DPA_2019', 'GLOBAL_ISO_9001']).map(id => (
                    <span key={id} className="app-pill">
                        {id.replace(/_/g, ' ')} Active
                    </span>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-xl p-6">
          <div className="app-panel w-full max-w-2xl rounded-[3rem] flex flex-col max-h-[85vh] overflow-hidden animate-softFade">
            <div className="bg-[linear-gradient(135deg,#533f35_0%,#3d2d26_100%)] p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold font-serif">Terms & Conditions</h3>
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mt-1">Industrial ERP Framework Agreement</p>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="p-10 overflow-y-auto scrollbar-hide flex-1">
               <pre className="text-xs text-slate-600 font-medium whitespace-pre-wrap leading-relaxed font-sans">
                 {TERMS_AND_CONDITIONS}
               </pre>
            </div>
            <div className="p-8 border-t border-slate-50 bg-slate-50 flex justify-end">
               <button 
                onClick={() => { setHasConsented(true); setShowTermsModal(false); setError(null); }}
                className="app-button app-button-primary px-12 py-4"
               >
                 I Accept & Understand
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthGate;
