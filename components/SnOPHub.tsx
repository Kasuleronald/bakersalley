
import React, { useState, useMemo } from 'react';
import { SKU, Activity, Employee, MonthlyForecast, Asset } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyzeSnOP } from '../services/geminiService';

interface SnOPHubProps {
  skus: SKU[];
  activities: Activity[];
  employees: Employee[];
  forecasts: MonthlyForecast[];
  setForecasts: (f: MonthlyForecast[]) => void;
  assets?: Asset[];
}

const PRODUCTION_DAYS = 26;

const SnOPHub: React.FC<SnOPHubProps> = ({ skus, activities, employees, forecasts, setForecasts, assets = [] }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<any>(null);

  const planningData = useMemo(() => {
    return skus.map(sku => {
      const f = forecasts.find(x => x.skuId === sku.id && x.month === selectedMonth) || {
        skuId: sku.id,
        year: 2026,
        month: selectedMonth,
        unconstrainedDemand: sku.monthlyVolumeEstimate,
        plannedSupply: sku.monthlyVolumeEstimate
      };

      const gap = f.plannedSupply - f.unconstrainedDemand;
      const serviceLevel = f.unconstrainedDemand > 0 ? Math.min(100, (f.plannedSupply / f.unconstrainedDemand) * 100) : 100;
      
      return {
        ...sku,
        demand: f.unconstrainedDemand,
        supply: f.plannedSupply,
        gap,
        serviceLevel
      };
    });
  }, [skus, forecasts, selectedMonth]);

  const totals = useMemo(() => {
    const demand = planningData.reduce((s, x) => s + x.demand, 0);
    const supply = planningData.reduce((s, x) => s + x.supply, 0);
    const weightedService = demand > 0 ? (supply / demand) * 100 : 100;
    
    // Labor Capacity Analysis
    const productionStaff = employees.filter(e => e.isActive && e.department === 'Production');
    const totalCapacityHours = productionStaff.length * 12 * PRODUCTION_DAYS;
    
    // Machine Capacity Analysis
    const activeAssets = assets.filter(a => a.status === 'Active');
    const totalMachineHours = activeAssets.length * 16 * PRODUCTION_DAYS;

    let totalNeededHours = 0;
    planningData.forEach(p => {
      const batches = p.supply / (p.yield || 1);
      const laborAct = p.activities.find(a => activities.find(act => act.id === a.activityId)?.driver === 'Labor Hours');
      if (laborAct) {
        totalNeededHours += batches * (laborAct.quantity / 60);
      }
    });

    return { 
      demand, 
      supply, 
      weightedService, 
      totalCapacityHours, 
      totalNeededHours,
      totalMachineHours,
      utilization: totalCapacityHours > 0 ? (totalNeededHours / totalCapacityHours) * 100 : 0,
      machineUtilization: totalMachineHours > 0 ? (totalNeededHours / totalMachineHours) * 100 : 0
    };
  }, [planningData, employees, activities, assets]);

  const updateForecast = (skuId: string, field: 'unconstrainedDemand' | 'plannedSupply', value: number) => {
    const existingIdx = forecasts.findIndex(f => f.skuId === skuId && f.month === selectedMonth);
    const newForecasts = [...forecasts];
    
    if (existingIdx > -1) {
      newForecasts[existingIdx] = { ...newForecasts[existingIdx], [field]: value };
    } else {
      newForecasts.push({
        skuId,
        month: selectedMonth,
        year: 2026,
        unconstrainedDemand: field === 'unconstrainedDemand' ? value : skus.find(s => s.id === skuId)?.monthlyVolumeEstimate || 0,
        plannedSupply: field === 'plannedSupply' ? value : skus.find(s => s.id === skuId)?.monthlyVolumeEstimate || 0,
        scenario: 'Expected',
        baseDemand: 0,
        incrementalDemand: 0
      });
    }
    setForecasts(newForecasts);
  };

  const handleAiPlan = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSnOP(skus, forecasts.filter(f => f.month === selectedMonth), totals);
    setAiAdvice(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif">S & OP War Room</h2>
          <p className="text-gray-500 font-medium">Strategic reconciliation of Sales Forecasts and Production Capacity.</p>
        </div>
        <div className="flex gap-3">
           <select 
            className="bg-white border border-amber-100 px-6 py-3 rounded-2xl font-bold text-amber-900 shadow-sm outline-none"
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
           >
              {Array.from({length: 12}).map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(2026, i).toLocaleString('default', { month: 'long' })} 2026</option>
              ))}
           </select>
           <button 
            onClick={handleAiPlan}
            disabled={isAnalyzing}
            className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
           >
             {isAnalyzing ? 'Thinking...' : '✨ AI Strategic Audit'}
           </button>
        </div>
      </header>

      {/* TOP HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-amber-50 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
           <div className="relative">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Plan Service Level</div>
              <div className={`text-4xl font-mono font-bold ${totals.weightedService >= 95 ? 'text-green-600' : 'text-amber-600'}`}>
                {Math.round(totals.weightedService)}%
              </div>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-50 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
           <div className="relative">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Capacity Load</div>
              <div className={`text-4xl font-mono font-bold ${totals.utilization > 90 ? 'text-red-600' : 'text-indigo-900'}`}>
                {Math.round(totals.utilization)}%
              </div>
              <p className="text-[8px] text-gray-400 mt-2 font-bold uppercase">{Math.round(totals.totalNeededHours)} / {Math.round(totals.totalCapacityHours)} Labor Hrs</p>
           </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-center md:col-span-2">
           <div className="flex justify-between items-center">
              <div>
                 <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Critical Bottleneck</div>
                 <div className="text-xl font-bold font-serif text-white">{aiAdvice?.primaryBottleneck || 'Run AI Audit for Diagnostic'}</div>
              </div>
              {aiAdvice?.primaryBottleneck && (
                 <div className="bg-amber-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase animate-pulse">Alert</div>
              )}
           </div>
        </div>
      </div>

      {aiAdvice && (
        <div className="bg-indigo-50 p-10 rounded-[3rem] border border-indigo-100 animate-fadeIn space-y-10">
           <div className="flex items-center gap-4 border-b border-indigo-100 pb-6">
              <span className="text-4xl">🤖</span>
              <div>
                <h3 className="text-2xl font-bold text-indigo-900 font-serif">Planning Intelligence Report</h3>
                <p className="text-sm text-indigo-600 font-medium">Equilibrium Analysis for {new Date(2026, selectedMonth - 1).toLocaleString('default', { month: 'long' })}</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-6">
                 <div>
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Critical Under-Supply</h4>
                    <div className="flex flex-wrap gap-2">
                       {aiAdvice.underSupplyItems.map((item: string) => (
                         <span key={item} className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-rose-200">⚠️ {item}</span>
                       ))}
                       {aiAdvice.underSupplyItems.length === 0 && <span className="text-xs text-indigo-400 italic">No critical gaps detected.</span>}
                    </div>
                 </div>

                 <div className="p-6 bg-white rounded-[2.5rem] border border-indigo-100 shadow-sm">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lost Revenue Estimate</h4>
                    <div className="text-2xl font-mono font-black text-rose-600">{aiAdvice.revenueImpactEstimate}</div>
                 </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                 <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Strategic SKU Prioritization</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiAdvice.prioritizationList.map((p: any, idx: number) => (
                      <div key={idx} className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-start gap-4">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${p.priority === 'High' ? 'bg-indigo-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {p.priority.charAt(0)}
                         </div>
                         <div>
                            <div className="text-xs font-black text-slate-900 uppercase">{p.skuName}</div>
                            <p className="text-[10px] text-slate-500 leading-tight mt-1">"{p.reason}"</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-inner">
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Operations Directives</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiAdvice.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex gap-3 text-xs text-indigo-800 font-medium items-center">
                     <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-[10px] flex-shrink-0">✓</span>
                     {rec}
                  </li>
                ))}
              </ul>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] shadow-sm border border-amber-50">
            <h3 className="text-xl font-bold font-serif text-slate-900 mb-8">Supply-Demand Convergence</h3>
            <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={planningData.sort((a,b) => b.demand - a.demand).slice(0, 15)}>
                    <defs>
                      <linearGradient id="colorD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e1b4b" stopOpacity={0.1}/><stop offset="95%" stopColor="#1e1b4b" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/><stop offset="95%" stopColor="#d97706" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip cursor={{ fill: '#fcfaf7' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" />
                    <Area name="Market Demand" type="monotone" dataKey="demand" stroke="#1e1b4b" strokeWidth={3} fillOpacity={1} fill="url(#colorD)" />
                    <Area name="Production Commit" type="monotone" dataKey="supply" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorS)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 bg-white rounded-[3rem] shadow-sm border border-amber-50 overflow-hidden flex flex-col">
            <div className="p-8 bg-slate-50 border-b border-slate-100">
               <h3 className="text-lg font-bold text-gray-900 font-serif">Planning Exceptions</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[440px] scrollbar-hide">
               {planningData.filter(p => p.gap !== 0).map(p => (
                 <div key={p.id} className={`p-5 rounded-3xl border ${p.gap < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <div className="font-bold text-xs text-gray-900">{p.name}</div>
                       <span className={`text-[9px] font-black uppercase ${p.gap < 0 ? 'text-red-600' : 'text-green-600'}`}>
                         {p.gap < 0 ? 'Gap' : 'Surplus'}
                       </span>
                    </div>
                    <div className="flex justify-between items-end">
                       <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{Math.abs(p.gap).toLocaleString()} Units</div>
                       <div className="text-sm font-mono font-bold text-gray-900">{p.serviceLevel.toFixed(0)}% Srv.</div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-amber-50 overflow-hidden">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
                  <th className="px-8 py-5">Product SKU</th>
                  <th className="px-6 py-5 text-center">Unconstrained Demand</th>
                  <th className="px-6 py-5 text-center">Commitment Supply</th>
                  <th className="px-6 py-5 text-center">Service level</th>
                  <th className="px-8 py-5 text-right">Potential Value</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {planningData.map(p => (
                 <tr key={p.id} className={`hover:bg-amber-50/10 transition-all ${p.serviceLevel < 80 ? 'bg-rose-50/20' : ''}`}>
                    <td className="px-8 py-5">
                       <div className="font-bold text-gray-900 text-sm uppercase">{p.name}</div>
                       <div className="text-[9px] text-gray-400 font-bold uppercase">{p.category}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="text-sm font-mono font-bold text-slate-400">{p.demand.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex justify-center">
                          <input 
                           type="number" 
                           className="w-24 bg-gray-50 border border-slate-100 rounded-xl px-3 py-2 text-center font-mono font-bold text-indigo-900"
                           value={p.supply}
                           onChange={e => updateForecast(p.id, 'plannedSupply', parseInt(e.target.value) || 0)}
                          />
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.serviceLevel >= 95 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.serviceLevel.toFixed(1)}%
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right font-mono font-bold text-gray-900">
                       UGX {(p.supply * p.retailPrice).toLocaleString()}
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default SnOPHub;
