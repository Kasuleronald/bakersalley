
import React, { useState, useMemo } from 'react';
import { Ingredient, FinishedGood, SKU, Transaction, Customer, SupplierInvoice, Asset, AccountType } from '../types';
import { generateDeploymentPlanPDF } from '../utils/exportUtils';
import { INITIAL_INGREDIENTS, INITIAL_SKUS, LAUNCH_CHECKLIST } from '../constants';

interface ReconstructionHubProps {
  ingredients: Ingredient[];
  setIngredients: (ings: Ingredient[]) => void;
  finishedGoods: FinishedGood[];
  setFinishedGoods: (fg: FinishedGood[]) => void;
  skus: SKU[];
  setSkus: (s: SKU[]) => void;
  customers: Customer[];
  setCustomers: (c: Customer[]) => void;
  invoices: SupplierInvoice[];
  setInvoices: (i: SupplierInvoice[]) => void;
  assets: Asset[];
  setAssets: (a: Asset[]) => void;
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  currency: { active: any, format: (v: number) => string };
  brandName?: string;
}

const ReconstructionHub: React.FC<ReconstructionHubProps> = ({
  ingredients, setIngredients, finishedGoods, setFinishedGoods, skus, setSkus,
  customers, setCustomers, invoices, setInvoices, assets, setAssets,
  transactions, setTransactions, currency, brandName = "New Customer"
}) => {
  const [activeStep, setActiveStep] = useState<'Introduction' | 'Readiness' | 'Inventory' | 'Treasury' | 'Finalize'>('Introduction');
  const [dayZeroDate, setDayZeroDate] = useState(new Date().toISOString().split('T')[0]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  
  const [physicalIngCounts, setPhysicalIngCounts] = useState<Record<string, number>>({});
  const [physicalFgCounts, setPhysicalFgCounts] = useState<Record<string, number>>({});
  const [openingBalances, setOpeningBalances] = useState<Record<string, number>>({
    'Cash': 0, 'Bank': 0, 'Mobile Banking': 0
  });

  const handleToggleTask = (id: string) => {
    setCompletedTasks(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleBootstrap = () => {
    if (!window.confirm("Bootstrap Day Zero? This will seed the system with a 'Standard Bakery Starter Kit' (Common Ingredients & SKUs). Recommended for new setups without existing digital records.")) return;
    
    setIngredients([...INITIAL_INGREDIENTS]);
    setSkus([...INITIAL_SKUS]);
    
    const newIngCounts: Record<string, number> = {};
    INITIAL_INGREDIENTS.forEach(i => newIngCounts[i.id] = 0);
    setPhysicalIngCounts(newIngCounts);

    const newFgCounts: Record<string, number> = {};
    INITIAL_SKUS.forEach(s => newFgCounts[s.id] = 0);
    setPhysicalFgCounts(newFgCounts);

    alert("System Bootstrapped with Bakery Defaults. Proceed to 'Inventory' to enter opening stock.");
    setActiveStep('Inventory');
  };

  const handleExportPlan = () => {
    generateDeploymentPlanPDF(brandName, LAUNCH_CHECKLIST);
  };

  const handleFinalizeReconstruction = () => {
    if (!window.confirm("CRITICAL: This will recalibrate your entire bakery ledger. This is usually done only once at Day 0. Proceed?")) return;

    const nextIngredients = ingredients.map(ing => ({
      ...ing,
      currentStock: physicalIngCounts[ing.id] ?? ing.currentStock,
      openingStock: physicalIngCounts[ing.id] ?? ing.currentStock
    }));

    const nextFg = skus.map(sku => {
      const existing = finishedGoods.find(f => f.skuId === sku.id);
      return {
        skuId: sku.id,
        stockLevel: physicalFgCounts[sku.id] ?? (existing?.stockLevel || 0),
        reorderLevel: existing?.reorderLevel || 20,
        lastProductionDate: dayZeroDate,
        batches: []
      };
    });

    const openingTxs: Transaction[] = Object.entries(openingBalances).map(([acc, bal]) => ({
      id: `opening-${acc}-${Date.now()}`,
      date: dayZeroDate,
      account: acc as AccountType,
      type: 'Credit',
      amount: bal as number,
      description: 'System Reconstruction: Initial Opening Balance',
      category: 'Adjustment'
    }));

    setIngredients(nextIngredients);
    setFinishedGoods(nextFg as FinishedGood[]);
    setTransactions([...openingTxs, ...transactions]);
    
    alert("System successfully reconstructed. Digital Go-Live Complete.");
    setActiveStep('Introduction');
  };

  const readinessPercent = Math.round((completedTasks.length / LAUNCH_CHECKLIST.length) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 text-amber-400 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl">🧹</div>
          <div className="text-left">
            <h2 className="text-4xl font-bold text-slate-900 font-serif">Business Reconstruction</h2>
            <p className="text-slate-500 font-medium">Deploying industrial-grade digital controls.</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={handleExportPlan} className="bg-white border-2 border-indigo-900 text-indigo-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-sm hover:bg-indigo-50 transition-all flex items-center gap-2">
              <span>📊</span> Export Deployment Roadmap
           </button>
           {ingredients.length === 0 && (
             <button onClick={handleBootstrap} className="bg-amber-500 text-slate-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl animate-pulse">
                🚀 Bootstrap Day Zero
             </button>
           )}
        </div>
      </header>

      <div className="flex bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide">
        {['Introduction', 'Readiness', 'Inventory', 'Treasury', 'Finalize'].map((step: any) => (
          <button 
            key={step} 
            onClick={() => setActiveStep(step)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeStep === step ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:text-slate-600'}`}
          >
            {step === 'Readiness' ? 'Launch Audit 🚀' : step}
          </button>
        ))}
      </div>

      <main className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50 min-h-[500px]">
        {activeStep === 'Introduction' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold font-serif text-slate-900">The Road to Go-Live</h3>
                <p className="text-slate-600 leading-relaxed">
                  Before you start inputting real business data, use the <b>Launch Audit</b> tab to track your technical setup. Once your environment is ready, use the <b>Inventory</b> and <b>Treasury</b> tabs to declare your starting balances.
                </p>
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <div className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Target Go-Live Date</div>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-white rounded-2xl border-none font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    value={dayZeroDate}
                    onChange={e => setDayZeroDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl text-center space-y-4">
                 <div className="text-5xl">📊</div>
                 <div className="text-4xl font-mono font-black text-amber-400">{readinessPercent}%</div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Launch Readiness Score</div>
                 <button onClick={() => setActiveStep('Readiness')} className="w-full py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase">Review Checklist</button>
              </div>
            </div>
          </div>
        )}

        {activeStep === 'Readiness' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-end border-b border-slate-100 pb-6">
                 <div>
                    <h3 className="text-2xl font-bold font-serif text-slate-900">Pre-Launch Deployment Audit</h3>
                    <p className="text-slate-500 text-sm">Verify your environment before committing real capital data.</p>
                 </div>
                 <div className="text-right">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Progress</span>
                    <div className="text-2xl font-mono font-black text-indigo-600">{completedTasks.length} / {LAUNCH_CHECKLIST.length}</div>
                 </div>
              </div>

              <div className="space-y-3">
                 {LAUNCH_CHECKLIST.map(item => (
                   <button 
                    key={item.id}
                    onClick={() => handleToggleTask(item.id)}
                    className={`w-full flex items-start gap-6 p-6 rounded-[2.5rem] border text-left transition-all ${completedTasks.includes(item.id) ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                   >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${completedTasks.includes(item.id) ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-300'}`}>
                         {completedTasks.includes(item.id) ? '✓' : ''}
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{item.phase}</span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${item.importance === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>{item.importance}</span>
                         </div>
                         <p className={`text-sm font-bold ${completedTasks.includes(item.id) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.task}</p>
                      </div>
                   </button>
                 ))}
              </div>
           </div>
        )}

        {activeStep === 'Inventory' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-bold font-serif text-slate-900">Physical Stock Declaration</h3>
               <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-4 py-1 rounded-full">Day 0 Cut-Off</span>
            </div>
            {ingredients.length === 0 && (
              <div className="p-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold mb-4 italic">Material Ledger is currently empty.</p>
                <button onClick={handleBootstrap} className="bg-indigo-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px]">Populate with Industrial Defaults</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2">Raw Materials (Physical Counts)</h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                     {ingredients.map(ing => (
                       <div key={ing.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                          <div>
                             <div className="font-bold text-xs uppercase">{ing.name}</div>
                             <div className="text-[9px] text-slate-400 font-bold uppercase">{ing.unit}</div>
                          </div>
                          <input 
                            type="number" 
                            className="w-24 p-2 bg-white rounded-xl border border-slate-200 text-center font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0"
                            value={physicalIngCounts[ing.id] ?? ''}
                            onChange={e => setPhysicalIngCounts({...physicalIngCounts, [ing.id]: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                     ))}
                  </div>
               </div>
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b pb-2">Finished Goods (Warehouse Bin)</h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                     {skus.map(sku => (
                       <div key={sku.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-100 transition-all">
                          <div>
                             <div className="font-bold text-xs uppercase">{sku.name}</div>
                             <div className="text-[9px] text-slate-400 font-bold uppercase">{sku.unit}</div>
                          </div>
                          <input 
                            type="number" 
                            className="w-24 p-2 bg-white rounded-xl border border-slate-200 text-center font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0"
                            value={physicalFgCounts[sku.id] ?? ''}
                            onChange={e => setPhysicalFgCounts({...physicalFgCounts, [sku.id]: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeStep === 'Treasury' && (
           <div className="space-y-10 animate-fadeIn">
              <div className="text-center max-w-xl mx-auto space-y-4">
                 <h3 className="text-2xl font-bold font-serif text-slate-900">Cash & Bank Initialization</h3>
                 <p className="text-slate-500 text-sm">Match digital balances to physical cash and bank statements for Go-Live.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { id: 'Cash', label: 'Petty Cash Box', icon: '💵' },
                   { id: 'Bank', label: 'Operating Bank A/C', icon: '🏦' },
                   { id: 'Mobile Banking', label: 'Mobile Money Float', icon: '📱' }
                 ].map(acc => (
                   <div key={acc.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-6 group hover:border-indigo-200 transition-all">
                      <div className="text-5xl group-hover:scale-110 transition-transform">{acc.icon}</div>
                      <div>
                        <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-1">{acc.label}</h4>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-slate-300">UGX</span>
                           <input 
                            type="number" 
                            className="w-full bg-white border-none rounded-2xl p-4 text-xl font-mono font-black text-center shadow-sm outline-none focus:ring-1 focus:ring-indigo-500"
                            value={openingBalances[acc.id] || ''}
                            onChange={e => setOpeningBalances({...openingBalances, [acc.id]: parseFloat(e.target.value) || 0})}
                            placeholder="0"
                           />
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeStep === 'Finalize' && (
          <div className="space-y-12 animate-fadeIn flex flex-col items-center justify-center py-10">
            <div className="w-24 h-24 bg-indigo-900 text-amber-400 rounded-[2rem] flex items-center justify-center text-4xl animate-bounce shadow-2xl">🚀</div>
            <div className="text-center max-w-lg space-y-4">
               <h3 className="text-3xl font-bold font-serif text-slate-900">Execute Cut-Over</h3>
               <p className="text-slate-500 text-sm leading-relaxed">
                  Ready to launch. This will archive the initialization timestamp and set your starting capital. Ensure all previous devices are synced before proceeding.
               </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl pt-6">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                  <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Declared Liquidity</div>
                  <div className="text-xl font-mono font-black text-indigo-900">
                    {currency.format((Object.values(openingBalances) as number[]).reduce((a: number, b: number) => a + b, 0))}
                  </div>
               </div>
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                  <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Materials Value</div>
                  <div className="text-xl font-mono font-black text-indigo-900">
                    {currency.format(Object.entries(physicalIngCounts).reduce((s: number, [id, q]) => s + ((q as number) * (ingredients.find(i => i.id === id)?.costPerUnit || 0)), 0))}
                  </div>
               </div>
            </div>

            <button 
              onClick={handleFinalizeReconstruction}
              className="px-16 py-6 bg-indigo-900 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95"
            >
               Initialize Production Ledger
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReconstructionHub;
