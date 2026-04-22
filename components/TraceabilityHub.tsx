
import React, { useState, useMemo } from 'react';
import { ProductionLog, Ingredient, Order, SKU, Customer } from '../types';

interface TraceabilityHubProps {
  productionLogs: ProductionLog[];
  ingredients: Ingredient[];
  orders: Order[];
  skus: SKU[];
  customers: Customer[];
}

const TraceabilityHub: React.FC<TraceabilityHubProps> = ({ productionLogs, ingredients, orders, skus, customers }) => {
  const [searchBatchId, setSearchBatchId] = useState('');
  const [activeTrace, setActiveTrace] = useState<any>(null);

  const handleTrace = () => {
    const log = productionLogs.find(l => l.id.includes(searchBatchId) || l.batchId?.includes(searchBatchId));
    if (!log) {
        alert("Batch ID not found in master ledger.");
        return;
    }

    const sku = skus.find(s => s.id === log.skuId);
    const affectedOrders = orders.filter(o => o.items.some(i => i.skuId === log.skuId && new Date(o.date).toDateString() === new Date(log.date).toDateString()));
    const materialsUsed = sku?.recipeItems.map(ri => ingredients.find(i => i.id === ri.ingredientId)) || [];

    setActiveTrace({ log, sku, affectedOrders, materialsUsed });
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold font-serif tracking-tight uppercase">Recall & Traceability Engine</h2>
            <p className="text-amber-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">One-Up / One-Down Lineage Audit</p>
          </div>
          <div className="flex bg-white/10 p-2 rounded-2xl border border-white/20 gap-3">
             <input 
              className="bg-transparent border-none text-white font-mono text-sm px-4 outline-none placeholder:text-white/20" 
              placeholder="Enter Batch ID..." 
              value={searchBatchId}
              onChange={e => setSearchBatchId(e.target.value)}
             />
             <button onClick={handleTrace} className="px-6 py-2 bg-amber-500 text-slate-900 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-white transition-all">Audit Pedigree</button>
          </div>
        </div>
      </header>

      {activeTrace ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-4">Batch Identity</h4>
                 <div className="text-center">
                    <div className="text-4xl mb-4">🥖</div>
                    <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">{activeTrace.sku?.name}</h3>
                    <div className="text-[10px] font-mono font-black text-indigo-600 mt-1">BATCH #{activeTrace.log.id.slice(-8)}</div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                    <div className="text-center">
                       <div className="text-[8px] font-black text-slate-300 uppercase">Yield</div>
                       <div className="text-sm font-mono font-black text-slate-900">{activeTrace.log.actualYield || activeTrace.log.totalUnitsProduced} pcs</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[8px] font-black text-slate-300 uppercase">Energy</div>
                       <div className="text-sm font-mono font-black text-slate-900">{activeTrace.log.energyUsed}</div>
                    </div>
                 </div>
              </div>

              <div className="bg-indigo-900 p-8 rounded-[3rem] text-white space-y-6 shadow-xl">
                 <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Backward Trace: Materials</h4>
                 <div className="space-y-3">
                    {activeTrace.materialsUsed.map((m: any) => (
                      <div key={m.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                         <span className="text-xs font-bold uppercase">{m.name}</span>
                         <span className="text-[8px] font-mono font-black text-emerald-400">LOT #{m.id.slice(-4)}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-10 border-b pb-6">
                 <h3 className="text-2xl font-bold font-serif text-slate-900">Forward Trace: At-Risk Customers</h3>
                 <span className="bg-rose-100 text-rose-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Recall List</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                 {activeTrace.affectedOrders.map((o: any) => {
                   const customer = customers.find(c => c.id === o.customerId);
                   return (
                     <div key={o.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:bg-rose-50 hover:border-rose-100 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">👤</div>
                           <div>
                              <div className="font-black text-slate-900 text-sm uppercase">{customer?.name || 'Walk-in Retail'}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Invoice: {o.invoiceNumber} • {o.items.find((i: any)=>i.skuId === activeTrace.sku.id)?.quantity} Units</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Contact:</div>
                           <div className="text-sm font-mono font-black text-slate-900">{customer?.phone || 'N/A'}</div>
                        </div>
                     </div>
                   );
                 })}
                 {activeTrace.affectedOrders.length === 0 && (
                   <div className="py-20 text-center text-slate-300 italic text-sm">No external orders linked to this batch (Potential internal shop consumption).</div>
                 )}
              </div>
              <div className="mt-10 pt-8 border-t border-slate-50 flex gap-4">
                 <button className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-rose-700">Initiate Emergency Recall Notice</button>
                 <button className="px-10 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase">Print Chain Audit</button>
              </div>
           </div>
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
           <div className="text-7xl mb-6 opacity-20 grayscale">🧬</div>
           <h4 className="text-xl font-bold font-serif text-slate-400 uppercase tracking-widest">DNA Trace Engine Idle</h4>
           <p className="text-sm text-slate-300 max-w-sm mx-auto mt-2 italic leading-relaxed">Search for a Batch ID or Production Reference to map its journey through the factory.</p>
        </div>
      )}
    </div>
  );
};

export default TraceabilityHub;
