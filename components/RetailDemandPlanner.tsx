
import React, { useState, useMemo } from 'react';
import { SKU, Outlet, OutletStock, Sale, DailyOutletForecast } from '../types';
import { predictOutletDemand } from '../services/geminiService';
import { generateDispatchManifestPDF } from '../utils/exportUtils';

interface RetailDemandPlannerProps {
  skus: SKU[];
  outlets: Outlet[];
  outletStocks: OutletStock[];
  sales: Sale[];
  outletForecasts: DailyOutletForecast[];
  setOutletForecasts: (f: DailyOutletForecast[]) => void;
  currency: { active: any, format: (v: number) => string };
}

const RetailDemandPlanner: React.FC<RetailDemandPlannerProps> = ({
  skus, outlets, outletStocks, sales, outletForecasts, setOutletForecasts, currency
}) => {
  const [viewMode, setViewMode] = useState<'Master' | 'Outlet'>('Master');
  const [targetDate, setTargetDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [isPredicting, setIsPredicting] = useState(false);

  const handleForecastAll = async () => {
    if (!window.confirm(`Initiate Neural Demand Audit for ${outlets.length} active routes?`)) return;
    setIsPredicting(true);
    
    // Industrial logic: We loop through routes and fetch AI predictions based on historical velocity
    for (const outlet of outlets) {
        const history = sales.filter(s => s.outletId === outlet.id).slice(0, 50);
        const prediction = await predictOutletDemand(outlet.name, outlet.type, history, skus);
        
        if (prediction) {
          const newForecasts = [...outletForecasts];
          prediction.forEach((p: any) => {
            const idx = newForecasts.findIndex(f => f.outletId === outlet.id && f.skuId === p.skuId && f.date === targetDate);
            const forecast: DailyOutletForecast = {
              id: `f-${Date.now()}-${p.skuId}`,
              outletId: outlet.id,
              skuId: p.skuId,
              date: targetDate,
              forecastedQty: p.predictedQty,
              confidenceScore: p.confidence
            };
            if (idx > -1) newForecasts[idx] = forecast;
            else newForecasts.push(forecast);
          });
          setOutletForecasts(newForecasts);
        }
    }
    setIsPredicting(false);
    alert("National Forecast Sync Complete.");
  };

  const updateManualForecast = (outletId: string, skuId: string, qty: number) => {
    const newForecasts = [...outletForecasts];
    const idx = newForecasts.findIndex(f => f.outletId === outletId && f.skuId === skuId && f.date === targetDate);
    const forecast: DailyOutletForecast = {
      id: `f-${Date.now()}-${skuId}`,
      outletId,
      skuId,
      date: targetDate,
      forecastedQty: qty
    };
    if (idx > -1) newForecasts[idx] = forecast;
    else newForecasts.push(forecast);
    setOutletForecasts(newForecasts);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="bg-indigo-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
             <span className="px-4 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase">Fleet Intelligence Active</span>
          </div>
          <h2 className="text-4xl font-bold font-serif text-amber-400 uppercase tracking-tighter">National Load Manifest</h2>
          <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl italic">
            "Eliminate van-shrinkage. Use the AI Auditor to predict demand for every route in Uganda, ensuring dispatches match actual retail capacity."
          </p>
        </div>
        <div className="relative z-10 flex flex-col gap-3">
           <input type="date" className="bg-white/10 text-white p-4 rounded-2xl font-bold border border-white/20 outline-none" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
           <button onClick={handleForecastAll} disabled={isPredicting} className={`px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all ${isPredicting ? 'bg-white/10 text-indigo-300 animate-pulse' : 'bg-white text-slate-900 hover:bg-amber-400'}`}>
             {isPredicting ? 'Syncing Network...' : '✨ Neural Manifest Sync'}
           </button>
        </div>
      </header>

      <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="px-10 py-8 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Master Distribution Grid</h3>
            <button onClick={() => generateDispatchManifestPDF(targetDate, outlets, skus, outletForecasts)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-md">Print Loading Manifest</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-indigo-900 text-white text-[9px] font-black uppercase tracking-widest">
                     <th className="px-8 py-6 sticky left-0 z-30 bg-indigo-900 min-w-[250px]">Product SKU</th>
                     {outlets.map(o => (
                       <th key={o.id} className="px-4 py-6 text-center border-l border-white/5 min-w-[120px]">
                          <div className="truncate">{o.name}</div>
                          <div className="text-[7px] text-indigo-400 font-bold mt-1 uppercase">{o.type}</div>
                       </th>
                     ))}
                     <th className="px-8 py-6 text-right border-l border-white/10 bg-indigo-950">TOTAL</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {skus.map(sku => {
                     const total = outlets.reduce((sum, o) => {
                        const f = outletForecasts.find(x => x.outletId === o.id && x.skuId === sku.id && x.date === targetDate);
                        return sum + (f?.forecastedQty || 0);
                     }, 0);
                     return (
                        <tr key={sku.id} className="hover:bg-indigo-50/5 transition-all">
                           <td className="px-8 py-5 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r shadow-sm">
                              <div className="font-bold text-slate-900 text-xs uppercase">{sku.name}</div>
                              <div className="text-[8px] text-slate-400 font-bold uppercase">{sku.category}</div>
                           </td>
                           {outlets.map(outlet => {
                              const forecast = outletForecasts.find(f => f.outletId === outlet.id && f.skuId === sku.id && f.date === targetDate);
                              return (
                                <td key={outlet.id} className="px-2 py-4 text-center">
                                   <input 
                                    type="number"
                                    className="w-full bg-slate-50 border-none text-center font-mono font-black text-xs p-1 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                                    value={forecast?.forecastedQty || ''}
                                    onChange={e => updateManualForecast(outlet.id, sku.id, parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                   />
                                </td>
                              );
                           })}
                           <td className="px-8 py-5 text-right font-mono font-black text-sm bg-slate-50">
                              {total > 0 ? total.toLocaleString() : '--'}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default RetailDemandPlanner;
