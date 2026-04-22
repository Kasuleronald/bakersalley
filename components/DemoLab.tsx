
import React, { useState } from 'react';
import { SubscriptionTier } from '../types';

interface DemoStep {
  title: string;
  role: string;
  description: string;
  icon: string;
  module: string;
  tabId: string;
}

const TIER_DEMOS: Record<SubscriptionTier, DemoStep[]> = {
  // Added missing Demo tier to satisfy Record<SubscriptionTier, DemoStep[]> type
  Demo: [
    { title: 'Step 1: System Reconstruction', role: 'Administrator', description: 'Initialize your bakery from Day 0. Declare starting balances and physical stock counts.', icon: '🧹', module: 'Reconstruction', tabId: 'reconstruction' },
    { title: 'Step 2: Full Portfolio Audit', role: 'Executive', description: 'Access all strategic modules including AI Risk Hub and S&OP Planning.', icon: '🧠', module: 'Intelligence Hub', tabId: 'dashboard' }
  ],
  // Renamed Lite to Essentials to align with SubscriptionTier type definition
  Essentials: [
    { title: 'Step 1: Product Formulation', role: 'Master Baker', description: 'Define your multiple recipes. Input ingredients and yield targets to set the production baseline.', icon: '🥖', module: 'Recipes', tabId: 'master-data' },
    { title: 'Step 2: Inventory Intake', role: 'Store Clerk', description: 'Receive raw materials (Flour, Sugar, Yeast) into the digital ledger to track stock levels.', icon: '🌾', module: 'RM Inventory', tabId: 'stores' },
    { title: 'Step 3: Daily Shift Plan', role: 'Production Lead', description: 'Log completed production rounds. The app automatically deducts raw materials and stocks the warehouse.', icon: '🏗️', module: 'Daily Operations', tabId: 'snop' },
    { title: 'Step 4: POS Retail Sale', role: 'Cashier', description: 'Record sales directly from the outlet. Generate e-receipts and update inventory in real-time.', icon: '💵', module: 'Sales & POS', tabId: 'sales' }
  ],
  Pro: [
    { title: 'Step 1: Overhead Mapping', role: 'Accountant', description: 'Link rent, electricity, and water bills to specific energy categories (Ovens vs. Admin).', icon: '💰', module: 'Overheads', tabId: 'overheads' },
    { title: 'Step 2: ABC Costing Audit', role: 'Cost Accountant', description: 'View precise unit margins after the app "absorbs" fixed costs into every loaf of bread.', icon: '⚖️', module: 'Unit Cost Audit', tabId: 'product-costing' },
    { title: 'Step 3: Management Accounts', role: 'Owner', description: 'Review real-time P&L, Cash Flow, and Balance Sheets generated from operational data.', icon: '🏦', module: 'Financial Audit', tabId: 'mgmt-accountant' }
  ],
  Enterprise: [
    { title: 'Step 1: Demand Planning', role: 'Strategy Director', description: 'Reconcile sales forecasts with labor capacity. Use AI to identify production bottlenecks.', icon: '🎯', module: 'Demand Planning', tabId: 'demand-planning' },
    { title: 'Step 2: AI Risk Profiling', role: 'CEO', description: 'Run neural audits on your entire supply chain and financial health to detect hidden vulnerabilities.', icon: '🧠', module: 'Risk Hub', tabId: 'risk-hub' },
    { title: 'Step 3: Strategic Simulation', role: 'Executive', description: 'Simulate "What If" scenarios. Adjust price or efficiency and see the Future Value (FV) impact.', icon: '💹', module: 'Decision HUB', tabId: 'decision-hub' }
  ]
};

interface DemoLabProps {
  onNavigate: (tabId: string) => void;
}

const DemoLab: React.FC<DemoLabProps> = ({ onNavigate }) => {
  // Changed initial state from 'Lite' to 'Essentials'
  const [activeTier, setActiveTier] = useState<SubscriptionTier>('Essentials');
  const [stepIdx, setStepIdx] = useState(0);

  const steps = TIER_DEMOS[activeTier];
  const currentStep = steps[stepIdx];

  const handleNext = () => setStepIdx((prev) => (prev + 1) % steps.length);
  const handlePrev = () => setStepIdx((prev) => (prev - 1 + steps.length) % steps.length);

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-900 font-serif">BakersAlley 2.0 Feature Tour</h2>
        <p className="text-slate-500 font-medium">Select a plan to see a step-by-step demonstration of how to run your bakery at that scale.</p>
        
        <div className="flex justify-center bg-slate-100 p-1.5 rounded-[2rem] w-fit mx-auto border border-slate-200">
           {/* Changed 'Lite' to 'Essentials' in navigation buttons */}
           {(['Essentials', 'Pro', 'Enterprise'] as SubscriptionTier[]).map(t => (
             <button 
              key={t}
              onClick={() => { setActiveTier(t); setStepIdx(0); }}
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTier === t ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
             >
                {t} Plan
             </button>
           ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
         <div className="bg-slate-900 rounded-[4rem] overflow-hidden shadow-2xl border border-white/5 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-x-20 translate-y-20 blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row h-full min-h-[500px]">
               {/* Content Area */}
               <div className="flex-1 p-12 md:p-20 flex flex-col justify-center space-y-8 border-b md:border-b-0 md:border-r border-white/10">
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <span className="bg-white/10 text-amber-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/5">
                           {currentStep.role} Perspective
                        </span>
                        <span className="text-slate-500 font-mono text-xs">Step {stepIdx + 1} of {steps.length}</span>
                     </div>
                     <h3 className="text-4xl font-bold font-serif text-white">{currentStep.title}</h3>
                  </div>
                  
                  <p className="text-xl text-slate-300 leading-relaxed italic opacity-80">
                     "{currentStep.description}"
                  </p>

                  <div className="pt-10 flex items-center gap-6">
                     <button onClick={handlePrev} className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/5 transition-all">←</button>
                     <button onClick={handleNext} className="flex-1 bg-amber-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-amber-500 transition-all flex items-center justify-center gap-3">
                        {stepIdx === steps.length - 1 ? 'Restart Demo' : 'Next Step'} <span>→</span>
                     </button>
                  </div>
                  <button 
                    onClick={() => onNavigate(currentStep.tabId)}
                    className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors self-start"
                  >
                    Go to {currentStep.module} Module
                  </button>
               </div>

               {/* Visual Simulation Area */}
               <div className="w-full md:w-[400px] bg-white/5 p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-inner mb-8 animate-pulse">
                     {currentStep.icon}
                  </div>
                  <div className="space-y-1">
                     <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Active System Module</div>
                     <div className="text-2xl font-bold text-white uppercase tracking-tighter">{currentStep.module}</div>
                  </div>
                  
                  <div className="mt-12 space-y-2 w-full px-10">
                     {steps.map((_, i) => (
                       <div key={i} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${i === stepIdx ? 'bg-amber-500 scale-150 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`}></div>
                          <div className={`h-1 flex-1 rounded-full ${i <= stepIdx ? 'bg-white/20' : 'bg-white/5'}`}></div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Contextual Tips */}
         <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
               <h4 className="font-bold text-slate-900 mb-2">Multi-Recipe Support</h4>
               <p className="text-xs text-slate-500 leading-relaxed">BakersAlley handles complex mixes where one SKU might use another as an ingredient, maintaining deep traceability.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
               <h4 className="font-bold text-slate-900 mb-2">Industrial Traceability</h4>
               <p className="text-xs text-slate-500 leading-relaxed">Every bag of flour is tracked from delivery to the specific batch of bread it produced across multiple shifts.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
               <h4 className="font-bold text-slate-900 mb-2">Financial Transparency</h4>
               <p className="text-xs text-slate-500 leading-relaxed">We don't just track sales; we track the cost of the electricity that baked every specific loaf in your bakery.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DemoLab;
