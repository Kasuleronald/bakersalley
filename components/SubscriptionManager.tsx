import React, { useState, useMemo } from 'react';
import { SubscriptionTier } from '../types';

interface SubscriptionManagerProps {
  currentTier: SubscriptionTier;
  setTier: (tier: SubscriptionTier) => void;
}

interface TierPlan {
  id: SubscriptionTier;
  name: string;
  price: string;
  description: string;
  features: string[];
  color: string;
  isTrial?: boolean;
}

const FEATURE_PLANS: TierPlan[] = [
  {
    id: 'Demo',
    name: 'Strategic Demo',
    price: 'Free Trial',
    description: 'Full system functionality for 3 months. Perfect for a Go-Live test.',
    features: [
      'ALL System Modules Included',
      'AI Strategic Decision HUB',
      'Full Financial Audit Tools',
      '3-Month Unlimited Validity',
      'Zero Commitment Setup'
    ],
    color: 'bg-emerald-900 border-emerald-800 text-white',
    isTrial: true
  },
  {
    id: 'Essentials',
    name: 'Bakery Essentials',
    price: 'UGX 150,000 / mo',
    description: 'Core operational tools for retail bakeries and small hotels.',
    features: [
      'Basic POS & Invoicing',
      'Material Inventory',
      'Recipe Formulations',
      'Staff Directory',
      'Daily Operations Floor',
      'Audit Trail Export'
    ],
    color: 'bg-indigo-50 border-indigo-200 text-indigo-900'
  },
  {
    id: 'Pro',
    name: 'Industrial Growth',
    price: 'UGX 350,000 / mo',
    description: 'Full financial transparency for growing factory floors.',
    features: [
      'Everything in Essentials',
      'Activity-Based Costing (ABC)',
      'Management Accounts (P&L, CF)',
      'Treasury & Banking',
      'Performance Trends Analysis'
    ],
    color: 'bg-amber-50 border-amber-200 text-amber-900'
  },
  {
    id: 'Enterprise',
    name: 'Global Standard',
    price: 'UGX 500,000 / mo',
    description: 'Industrial-grade strategy and global scalability.',
    features: [
      'Everything in Industrial',
      'Full Multi-Currency Reporting',
      'UNBS Quality Assurance Hub',
      'Sales & Operations (S&OP) Hub',
      'Document Vault & cPanel Sync'
    ],
    color: 'bg-slate-900 border-slate-800 text-white'
  }
];

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ currentTier, setTier }) => {
  const [billingMode, setBillingMode] = useState<'Features' | 'Seats'>('Features');
  const [userCount, setUserCount] = useState(5);

  const seatTierData = useMemo(() => {
    let rate = 40000;
    let label = 'Starter (1-5)';
    
    if (userCount > 50) {
      rate = 10000;
      label = 'Scale (50+)';
    } else if (userCount > 25) {
      rate = 15000;
      label = 'Growth (25-50)';
    } else if (userCount > 5) {
      rate = 25000;
      label = 'Team (5-25)';
    }

    return { rate, label, total: userCount * rate };
  }, [userCount]);

  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      <header className="text-center space-y-6 max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-900 font-serif">Licensing & Operations</h2>
        <p className="text-slate-500 font-medium">Choose between feature-locked packages or headcount-based industrial scaling.</p>
        
        <div className="inline-flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 shadow-inner">
           <button 
            onClick={() => setBillingMode('Features')}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${billingMode === 'Features' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}
           >
             Package Based
           </button>
           <button 
            onClick={() => setBillingMode('Seats')}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${billingMode === 'Seats' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}
           >
             Seat Based 👥
           </button>
        </div>
      </header>

      {billingMode === 'Features' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURE_PLANS.map(plan => {
            const isCurrent = currentTier === plan.id;
            return (
              <div key={plan.id} className={`relative flex flex-col p-8 rounded-[3.5rem] border-2 transition-all ${plan.color} ${isCurrent ? 'ring-4 ring-amber-500/20 scale-105 shadow-2xl' : 'opacity-80 hover:opacity-100 hover:scale-[1.02]'}`}>
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                      Active Environment
                  </div>
                )}
                
                <div className="mb-8">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold font-serif">{plan.name}</h3>
                      {plan.isTrial && <span className="bg-amber-400 text-amber-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Testing Only</span>}
                    </div>
                    <div className="text-2xl font-black font-mono tracking-tighter mb-4">{plan.price}</div>
                    <p className={`text-xs leading-relaxed opacity-70`}>
                      {plan.description}
                    </p>
                </div>

                <div className="flex-1 space-y-4 mb-10">
                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b border-current opacity-20`}>
                      Capabilities
                    </div>
                    {plan.features.map(feat => (
                      <div key={feat} className="flex items-center gap-3 text-xs font-semibold">
                        <span className="opacity-60">✓</span>
                        {feat}
                      </div>
                    ))}
                </div>

                {!isCurrent ? (
                  <button 
                    onClick={() => setTier(plan.id)}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      plan.id === 'Enterprise' || plan.id === 'Demo' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                    }`}
                  >
                    Deploy {plan.id}
                  </button>
                ) : (
                  <div className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center border border-current opacity-30">
                    Plan In Use
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-center animate-fadeIn">
           <div className="md:col-span-7 space-y-10">
              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
                 <div>
                    <h3 className="text-2xl font-bold text-slate-900 font-serif mb-2">Workforce Scaling</h3>
                    <p className="text-sm text-slate-500">Adjust the slider based on the number of staff requiring system accounts (Bakers, Storekeepers, Cashiers).</p>
                 </div>

                 <div className="space-y-6">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Headcount</span>
                       <div className="text-5xl font-mono font-black text-indigo-900">{userCount} <span className="text-sm font-bold uppercase text-slate-400">Users</span></div>
                    </div>
                    <input 
                      type="range" min="1" max="150" step="1" 
                      className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                      value={userCount}
                      onChange={(e) => setUserCount(parseInt(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase">
                       <span>1 (Solo)</span>
                       <span>25</span>
                       <span>50</span>
                       <span>100</span>
                       <span>150+ (Industrial)</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { range: '1-5', rate: '40k', active: userCount <= 5 },
                      { range: '5-25', rate: '25k', active: userCount > 5 && userCount <= 25 },
                      { range: '25-50', rate: '15k', active: userCount > 25 && userCount <= 50 },
                      { range: '50+', rate: '10k', active: userCount > 50 }
                    ].map(t => (
                      <div key={t.range} className={`p-4 rounded-3xl border text-center transition-all ${t.active ? 'bg-indigo-900 border-indigo-900 text-white shadow-xl scale-110' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                         <div className="text-[9px] font-black uppercase mb-1">{t.range} Users</div>
                         <div className="text-lg font-mono font-black">UGX {t.rate}</div>
                         <div className="text-[7px] opacity-60 uppercase font-bold">per account</div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="md:col-span-5">
              <div className="bg-slate-900 p-12 rounded-[4.5rem] text-white shadow-2xl space-y-10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10 blur-3xl"></div>
                 
                 <div className="relative space-y-2">
                    <h4 className="text-amber-400 font-black uppercase text-[10px] tracking-widest">Pricing Strategy</h4>
                    <h3 className="text-3xl font-bold font-serif">{seatTierData.label}</h3>
                    <p className="text-indigo-200 text-xs leading-relaxed italic">
                       Headcount-based billing grants **Full Enterprise Access** (Risk Hub, S&OP, Financial Audit) restricted only by your active staff roster.
                    </p>
                 </div>

                 <div className="relative pt-10 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-indigo-300 text-xs font-bold uppercase">Monthly Investment</span>
                       <span className="text-3xl font-mono font-black text-white">UGX {seatTierData.total.toLocaleString()}</span>
                    </div>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest text-right">Includes all industrial features</p>
                 </div>

                 <button 
                  onClick={() => setTier('Enterprise')}
                  className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-amber-400 transition-all active:scale-95"
                 >
                    Activate Seat License
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto">
         <div className="text-6xl">🏢</div>
         <div className="space-y-4">
            <h4 className="text-2xl font-bold text-slate-900 font-serif">Industrial Deployment Logic</h4>
            <p className="text-sm text-slate-500 leading-relaxed italic">
              "We provide two paths to digital stability. **Package-Based** is ideal for small retail outlets focusing on core POS and recipe management. **Seat-Based Licensing** is built for industrial factories where multiple supervisors, bakers, and dispatchers need simultaneous access to the master ledger, rewarding larger workforces with reduced costs per account."
            </p>
            <div className="flex gap-4 pt-4">
               <div className="px-6 py-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Mode</div>
                  <div className="text-sm font-bold text-indigo-600">{billingMode}</div>
               </div>
               <div className="px-6 py-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Access</div>
                  <div className="text-sm font-bold text-slate-800">{billingMode === 'Features' ? 'Tier Limited' : `${userCount} Full Seats`}</div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;