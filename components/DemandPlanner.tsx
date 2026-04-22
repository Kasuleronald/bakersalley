
import React, { useState, useMemo } from 'react';
import { SKU, MonthlyForecast, Employee, Activity, Asset, Ingredient, ForecastScenario, Requisition } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyzeSnOP } from '../services/geminiService';
import { getConversionFactor } from '../utils/conversionUtils';

interface DemandPlannerProps {
  skus: SKU[];
  forecasts: MonthlyForecast[];
  setForecasts: (f: MonthlyForecast[]) => void;
  employees: Employee[];
  activities: Activity[];
  assets: Asset[];
  ingredients: Ingredient[];
  requisitions: Requisition[];
  setRequisitions: (reqs: Requisition[]) => void;
  currency: { active: any, format: (v: number) => string };
}

const PRODUCTION_DAYS = 26;
const SCENARIO_FACTORS: Record<ForecastScenario, number> = {
  Conservative: 0.8,
  Expected: 1.0,
  Aggressive: 1.3
};

const DemandPlanner: React.FC<DemandPlannerProps> = ({ skus, forecasts, setForecasts, employees, activities, assets, ingredients, requisitions, setRequisitions, currency }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [scenario, setScenario] = useState<ForecastScenario>('Expected');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  const planningData = useMemo(() => {
    const factor = SCENARIO_FACTORS[scenario];
    return skus.map(sku => {
      const f = forecasts.find(x => x.skuId === sku.id && x.month === selectedMonth && x.year === selectedYear) || {
        skuId: sku.id,
        year: selectedYear,
        month: selectedMonth,
        baseDemand: sku.monthlyVolumeEstimate,
        incrementalDemand: 0,
        unconstrainedDemand: sku.monthlyVolumeEstimate,
        plannedSupply: sku.monthlyVolumeEstimate,
        scenario: 'Expected'
      };

      const totalDemand = (f.baseDemand + f.incrementalDemand) * factor;
      const plannedSupply = f.plannedSupply * factor;
      const demandGap = plannedSupply - totalDemand;
      
      return {
        ...sku,
        base: f.baseDemand,
        incremental: f.incrementalDemand,
        totalDemand,
        supply: plannedSupply,
        gap: demandGap,
        serviceLevel: totalDemand > 0 ? (plannedSupply / totalDemand) * 100 : 100
      };
    });
  }, [skus, forecasts, selectedMonth, selectedYear, scenario]);

  const capacityMetrics = useMemo(() => {
    const prodStaff = employees.filter(e => e.isActive && e.department === 'Production');
    const totalCapHours = prodStaff.length * 10 * PRODUCTION_DAYS; 
    
    const activeAssets = assets.filter(a => a.status === 'Active');
    const totalMachineHours = activeAssets.length * 16 * PRODUCTION_DAYS;

    let neededHours = 0;
    planningData.forEach(p => {
      const batches = p.supply / Math.max(1, p.yield || 1);
      const laborAct = p.activities.find(a => activities.find(act => act.id === a.activityId)?.driver.includes('Hours'));
      if (laborAct) neededHours += batches * (laborAct.quantity);
    });

    return { 
      totalCapHours, 
      neededHours, 
      totalMachineHours,
      utilization: (neededHours / totalCapHours) * 100,
      machineUtilization: (totalMachineHours > 0) ? (neededHours / totalMachineHours) * 100 : 0
    };
  }, [planningData, employees, activities, assets]);

  const mrpImpact = useMemo(() => {
    const requirements: Record<string, { name: string, needed: number, current: number, unit: string, cost: number }> = {};
    
    planningData.forEach(p => {
      const batches = p.supply / Math.max(1, p.yield || 1);
      p.recipeItems.forEach(item => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        if (!ing) return;
        const factor = getConversionFactor(ing, item.unit);
        const qtyNeeded = item.quantity * factor * batches * 1.08; 
        
        if (!requirements[ing.id]) {
          requirements[ing.id] = { name: ing.name, needed: 0, current: ing.currentStock, unit: ing.unit, cost: ing.costPerUnit };
        }
        requirements[ing.id].needed += qtyNeeded;
      });
    });

    return Object.values(requirements).map(r => ({
      ...r,
      shortfall: Math.max(0, r.needed - r.current),
      status: r.current >= r.needed ? 'Healthy' : 'Critical'
    })).sort((a, b) => b.shortfall - a.shortfall);
  }, [planningData, ingredients]);

  const handleBulkProcure = () => {
    const shortfalls = mrpImpact.filter(m => m.shortfall > 0);
    if (shortfalls.length === 0) {
      alert("Inventory levels are sufficient for the current plan.");
      return;
    }

    if (!window.confirm(`Generate ${shortfalls.length} requisitions for all identified material shortfalls?`)) return;

    const newReqs: Requisition[] = shortfalls.map(m => {
      // Find ingredient ID
      const ing = ingredients.find(i => i.name === m.name);
      return {
        id: `auto-req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ingredientId: ing?.id || '',
        quantityRequested: m.shortfall * 1.2, // 20% safety buffer for ordering
        estimatedCost: (m.shortfall * 1.2) * m.cost,
        status: 'Pending',
        date: new Date().toISOString()
      };
    });

    setRequisitions([...newReqs, ...requisitions]);
    alert("Bulk Requisitions generated. Please finalize suppliers in the Sourcing Hub.");
  };

  const updateForecast = (skuId: string, field: 'baseDemand' | 'incrementalDemand' | 'plannedSupply', val: number) => {
    const existingIdx = forecasts.findIndex(f => f.skuId === skuId && f.month === selectedMonth && f.year === selectedYear);
    const newForecasts = [...forecasts];
    
    if (existingIdx > -1) {
      newForecasts[existingIdx] = { ...newForecasts[existingIdx], [field]: val };
    } else {
      const sku = skus.find(s => s.id === skuId);
      newForecasts.push({
        skuId, month: selectedMonth, year: selectedYear,
        baseDemand: field === 'baseDemand' ? val : (sku?.monthlyVolumeEstimate || 0),
        incrementalDemand: field === 'incrementalDemand' ? val : 0,
        unconstrainedDemand: 0,
        plannedSupply: field === 'plannedSupply' ? val : (sku?.monthlyVolumeEstimate || 0),
        scenario: 'Expected'
      });
    }
    setForecasts(newForecasts);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif">Plan Equilibrium Audit</h2>
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 mt-2 shadow-inner">
             {(['Conservative', 'Expected', 'Aggressive'] as ForecastScenario[]).map(s => (
               <button key={s} onClick={() => setScenario(s)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${scenario === s ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}>{s}</button>
             ))}
          </div>
        </div>
        <div className="flex gap-3">
           <select 
            className="bg-white border border-amber-100 px-6 py-3 rounded-2xl font-bold text-amber-900 shadow-sm outline-none"
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
           >
              {Array.from({length: 12}).map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })} {selectedYear}</option>
              ))}
           </select>
           <button onClick={handleBulkProcure} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2">
             <span>🛒</span> Bulk Procure Shortfalls
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan Utilization</div>
            <div className={`text-4xl font-mono font-black ${capacityMetrics.utilization > 100 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>{Math.round(capacityMetrics.utilization)}%</div>
            <p className="text-[8px] text-gray-400 mt-2 font-bold uppercase">Floor Load</p>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Criticality</div>
            <div className={`text-4xl font-mono font-black ${mrpImpact.some(m => m.status === 'Critical') ? 'text-rose-600' : 'text-emerald-600'}`}>
               {mrpImpact.filter(m => m.status === 'Healthy').length} / {mrpImpact.length}
            </div>
            <p className="text-[8px] text-gray-400 mt-2 font-bold uppercase">Materials Ready</p>
         </div>
         <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl md:col-span-2 flex items-center justify-between overflow-hidden relative">
            <div className="absolute right-0 bottom-0 text-9xl opacity-5 translate-x-10 translate-y-10">🎯</div>
            <div className="space-y-1 relative z-10">
               <div className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">Value Opportunity</div>
               <div className="text-3xl font-mono font-black">{currency.format(planningData.reduce((s, x) => s + (x.supply * x.retailPrice), 0))}</div>
               <p className="text-[9px] text-slate-400 font-bold uppercase">Realizable Revenue</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold font-serif text-slate-900 mb-10">Equilibrium Stack</h3>
            <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={planningData.sort((a,b) => b.totalDemand - a.totalDemand).slice(0, 8)}>
                    <defs>
                      <linearGradient id="colorD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e1b4b" stopOpacity={0.1}/><stop offset="95%" stopColor="#1e1b4b" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                    <Tooltip cursor={{ fill: '#fcfaf7' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" name="Total Demand" dataKey="totalDemand" stroke="#1e1b4b" strokeWidth={3} fillOpacity={1} fill="url(#colorD)" />
                    <Area type="monotone" name="Planned Output" dataKey="supply" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorS)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-8 bg-slate-50 border-b border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 font-serif">MRP Shortfall Alert</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Shortfall detected for {scenario} plan</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[440px] scrollbar-hide">
               {mrpImpact.filter(m => m.shortfall > 0).map(item => (
                 <div key={item.name} className="p-5 rounded-3xl border bg-rose-50 border-rose-100 transition-all">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-black text-slate-900 uppercase truncate pr-2">{item.name}</span>
                       <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-600 text-white">Stock-Out</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase">Requirement</div>
                          <div className="text-sm font-mono font-bold text-slate-900">{Math.round(item.needed).toLocaleString()} {item.unit}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-[8px] font-bold text-slate-400 uppercase">Procurement Gap</div>
                          <div className="text-sm font-mono font-bold text-rose-600">-{Math.round(item.shortfall).toLocaleString()}</div>
                       </div>
                    </div>
                 </div>
               ))}
               {mrpImpact.filter(m => m.shortfall > 0).length === 0 && (
                 <div className="py-20 text-center text-slate-300 italic text-sm">All materials in stock.</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default DemandPlanner;
