import React, { useState, useMemo } from 'react';
import { SKU, Ingredient, Activity, Overhead, Employee, TaxConfig } from '../types';
import { getConversionFactor } from '../utils/conversionUtils';
import { getIndustryTerms } from '../utils/industryUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ReferenceLine } from 'recharts';

interface CostAccountantProps {
  skus: SKU[];
  ingredients: Ingredient[];
  activities: Activity[];
  overheads: Overhead[];
  employees: Employee[];
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
  taxConfig: TaxConfig;
}

const PRODUCTION_DAYS_PER_MONTH = 26;
const MATERIAL_WASTE_FACTOR = 1.08; 

type AnalysisMode = 'SKU' | 'Category' | 'Portfolio' | 'Breakeven';
type PricingTier = 'Factory' | 'Wholesale' | 'Retail';

const CostAccountant: React.FC<CostAccountantProps> = ({ skus, ingredients, activities, overheads, employees, currency, taxConfig }) => {
  const [mode, setMode] = useState<AnalysisMode>('Portfolio');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<PricingTier>('Retail');
  const [materialStress, setMaterialStress] = useState(0); 

  // Breakeven Analysis State
  const [manualFixed, setManualFixed] = useState(5000000);
  const [manualPrice, setManualPrice] = useState(5000);
  const [manualVC, setManualVC] = useState(3000);
  const [manualPlannedVol, setManualPlannedVol] = useState(2500);

  const terms = useMemo(() => getIndustryTerms(taxConfig), [taxConfig]);

  const pools = useMemo(() => {
    const totalProductionSalaries = employees
      .filter(e => e.isActive && e.department === 'Production')
      .reduce((sum, e) => {
        const cost = e.employmentType === 'Permanent' ? e.salary : (e.dailyRate || 0) * PRODUCTION_DAYS_PER_MONTH;
        return sum + cost;
      }, 0);

    const totalSupportSalaries = employees
      .filter(e => e.isActive && e.department !== 'Production')
      .reduce((sum, e) => {
        const cost = e.employmentType === 'Permanent' ? e.salary : (e.dailyRate || 0) * PRODUCTION_DAYS_PER_MONTH;
        return sum + cost;
      }, 0);

    const totalOverheadsMonthly = overheads.reduce((sum, oh) => {
      const mult = oh.period === 'Weekly' ? 4.33 : oh.period === 'Daily' ? 26 : 1;
      return sum + (oh.amount * mult);
    }, 0);

    const totalFixedPool = totalOverheadsMonthly + totalSupportSalaries + totalProductionSalaries;

    return { totalFixedPool, totalProductionSalaries, totalSupportSalaries, totalOverheadsMonthly };
  }, [overheads, employees]);

  const skuMetrics = useMemo(() => {
    return skus.map(sku => {
      const yieldPerBatch = Math.max(1, sku.yield || 1);
      const vol = sku.monthlyVolumeEstimate;

      let price = sku.retailPrice;
      if (activeTier === 'Factory') price = sku.factoryPrice;
      if (activeTier === 'Wholesale') price = sku.wholesalePrice;

      const rawBatchIngCost = sku.recipeItems.reduce((acc, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        const factor = ing ? getConversionFactor(ing, item.unit) : 1;
        const stressedCost = (ing?.costPerUnit || 0) * (1 + (materialStress / 100));
        return acc + (stressedCost * (item.quantity * factor));
      }, 0);
      
      const unitVC_Material = (rawBatchIngCost * MATERIAL_WASTE_FACTOR) / yieldPerBatch;
      const unitCM = price - unitVC_Material;
      const cmRatio = price > 0 ? unitCM / price : 0;

      return {
        ...sku,
        price,
        unitVC_Material,
        unitCM,
        cmRatio,
        monthlyRevenue: price * vol,
        monthlyCM: unitCM * vol,
        monthlyVC: unitVC_Material * vol
      };
    });
  }, [skus, ingredients, activeTier, materialStress]);

  const portfolioAnalysis = useMemo(() => {
    const totalRevenue = skuMetrics.reduce((s, x) => s + x.monthlyRevenue, 0);
    const totalCM = skuMetrics.reduce((s, x) => s + x.monthlyCM, 0);
    const totalVC = skuMetrics.reduce((s, x) => s + x.monthlyVC, 0);
    
    const wacmRatio = totalRevenue > 0 ? totalCM / totalRevenue : 0;
    const portfolioBepRevenue = wacmRatio > 0 ? pools.totalFixedPool / wacmRatio : 0;
    
    const mosValue = Math.max(0, totalRevenue - portfolioBepRevenue);
    const mosPercent = totalRevenue > 0 ? (mosValue / totalRevenue) * 100 : 0;

    return {
      id: 'portfolio',
      name: `Entire Portfolio`,
      totalRevenue,
      totalCM,
      totalVC,
      wacmRatio,
      bepRevenue: portfolioBepRevenue,
      bepUnits: 0, 
      mosValue,
      mosPercent,
      fixed: pools.totalFixedPool
    };
  }, [skuMetrics, pools]);

  const rollupData = useMemo(() => {
    if (mode === 'Portfolio') return [portfolioAnalysis];
    
    if (mode === 'Category') {
      const cats: Record<string, any> = {};
      skuMetrics.forEach(s => {
        if (!cats[s.category]) cats[s.category] = { id: s.category, name: s.category, revenue: 0, cm: 0, vol: 0, count: 0, vc: 0 };
        cats[s.category].revenue += s.monthlyRevenue;
        cats[s.category].cm += s.monthlyCM;
        cats[s.category].vc += s.monthlyVC;
        cats[s.category].vol += s.monthlyVolumeEstimate;
        cats[s.category].count += 1;
      });
      return Object.values(cats).map(c => {
        const cmRatio = c.revenue > 0 ? c.cm / c.revenue : 0;
        const weight = c.revenue / (portfolioAnalysis.totalRevenue || 1);
        const categoryFixedShare = pools.totalFixedPool * weight;
        const bepRevenue = cmRatio > 0 ? categoryFixedShare / cmRatio : 0;
        return {
          ...c,
          cmRatio,
          bepRevenue,
          bepUnits: 0,
          mosPercent: c.revenue > 0 ? (Math.max(0, c.revenue - bepRevenue) / c.revenue) * 100 : 0
        };
      });
    }
    if (mode === 'SKU') {
      return skuMetrics.map(s => {
        const weight = s.monthlyRevenue / (portfolioAnalysis.totalRevenue || 1);
        const skuFixedShare = pools.totalFixedPool * weight;
        const bepRevenue = s.cmRatio > 0 ? skuFixedShare / s.cmRatio : 0;
        const bepUnits = s.unitCM > 0 ? skuFixedShare / s.unitCM : 0;
        return {
          ...s,
          bepRevenue,
          bepUnits,
          mosPercent: s.monthlyRevenue > 0 ? (Math.max(0, s.monthlyRevenue - bepRevenue) / s.monthlyRevenue) * 100 : 0
        };
      });
    }
    return [];
  }, [skuMetrics, mode, portfolioAnalysis, pools]);

  const activeAnalysis = useMemo(() => {
    if (mode === 'Breakeven') {
        const cm = manualPrice - manualVC;
        const cmRatio = manualPrice > 0 ? cm / manualPrice : 0;
        const bepUnits = cm > 0 ? manualFixed / cm : 0;
        const bepRevenue = bepUnits * manualPrice;
        const revenue = manualPlannedVol * manualPrice;
        const mosValue = Math.max(0, revenue - bepRevenue);
        const mosPercent = revenue > 0 ? (mosValue / revenue) * 100 : 0;

        return {
            id: 'breakeven',
            name: 'Manual Breakeven Analysis',
            totalRevenue: revenue,
            cmRatio,
            bepRevenue,
            bepUnits,
            mosPercent,
            fixed: manualFixed
        };
    }
    if (mode === 'Portfolio') return portfolioAnalysis;
    if (!selectedId) return rollupData[0];
    return rollupData.find(x => (x as any).id === selectedId) || rollupData[0];
  }, [rollupData, selectedId, mode, portfolioAnalysis, manualFixed, manualPrice, manualVC, manualPlannedVol]);

  const chartData = useMemo(() => {
    if (!activeAnalysis) return [];
    const steps = 12;
    const data = [];
    const cmRatio = (activeAnalysis as any).cmRatio || (activeAnalysis as any).wacmRatio || 0;
    const fixed = (activeAnalysis as any).fixed || ((activeAnalysis as any).bepRevenue * cmRatio);
    
    const bepRev = (activeAnalysis as any).bepRevenue;
    const maxRev = Math.max(bepRev * 1.6, (activeAnalysis as any).totalRevenue || (activeAnalysis as any).monthlyRevenue || 1000000);

    for (let i = 0; i <= steps; i++) {
      const r = (maxRev / steps) * i;
      const vc = r * (1 - cmRatio);
      data.push({
        label: `U${Math.round(r/1000)}k`,
        revenue: r,
        totalCost: fixed + vc,
        fixedCost: fixed,
        isLoss: (fixed + vc) > r
      });
    }
    return data;
  }, [activeAnalysis]);

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase tracking-tighter">Cost-Volume-Profit Analysis</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Industrial Margin Audit & Breakeven Modeling</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto scrollbar-hide">
          {(['Portfolio', 'Category', 'SKU', 'Breakeven'] as AnalysisMode[]).map(m => (
            <button 
              key={m} 
              onClick={() => { setMode(m); setSelectedId(null); }}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${mode === m ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {m === 'Breakeven' ? 'Breakeven Tool ⚖️' : `${m} Audit`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
             <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  {mode === 'Breakeven' ? 'Analysis Inputs' : 'Simulation Parameters'}
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {mode === 'Breakeven' ? 'Configure Manual Scenario' : 'Simulate Operational Volatility'}
                </p>
             </div>
             
             <div className="space-y-6">
                {mode === 'Breakeven' ? (
                  <div className="space-y-5 animate-fadeIn">
                     <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100 space-y-4">
                        <div>
                          <label className="block text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">1. Monthly Fixed Costs</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-300">UGX</span>
                            <input 
                                type="number" 
                                className="w-full pl-12 pr-5 py-4 bg-white border border-indigo-100 rounded-2xl font-mono font-black text-lg text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                value={manualFixed}
                                onChange={e => setManualFixed(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">2. Unit Selling Price</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-300">UGX</span>
                            <input 
                                type="number" 
                                className="w-full pl-12 pr-5 py-4 bg-white border border-indigo-100 rounded-2xl font-mono font-black text-lg text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                value={manualPrice}
                                onChange={e => setManualPrice(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">3. Unit Variable Cost</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-300">UGX</span>
                            <input 
                                type="number" 
                                className="w-full pl-12 pr-5 py-4 bg-white border border-indigo-100 rounded-2xl font-mono font-black text-lg text-rose-600 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                value={manualVC}
                                onChange={e => setManualVC(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="pt-4 border-t border-indigo-100">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Monthly Volume</label>
                          <input 
                              type="number" 
                              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-mono font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={manualPlannedVol}
                              onChange={e => setManualPlannedVol(parseFloat(e.target.value) || 0)}
                              placeholder="Planned Units"
                          />
                        </div>
                     </div>
                  </div>
                ) : (
                  <>
                    {mode !== 'Portfolio' && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Audit Target</label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                          value={selectedId || ''}
                          onChange={e => setSelectedId(e.target.value)}
                        >
                            <option value="">Select {mode === 'SKU' ? terms.skuLabel : mode}...</option>
                            {rollupData.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="space-y-4 p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Material Inflation</label>
                          <span className="text-sm font-mono font-black text-rose-700">+{materialStress}%</span>
                       </div>
                       <input type="range" min="0" max="50" step="5" className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" value={materialStress} onChange={e => setMaterialStress(parseFloat(e.target.value))} />
                       <p className="text-[8px] text-rose-400 font-bold uppercase italic text-center">Recalculating unit VC impact across ledger</p>
                    </div>

                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                        <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-widest mb-2">Pricing Tier Audit</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['Factory', 'Wholesale', 'Retail'] as PricingTier[]).map(t => (
                            <button key={t} onClick={() => setActiveTier(t)} className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all ${activeTier === t ? 'bg-indigo-900 text-white shadow-sm' : 'bg-white text-slate-400'}`}>
                               {t}
                            </button>
                          ))}
                        </div>
                    </div>
                  </>
                )}
             </div>
          </div>
        </aside>

        <main className="lg:col-span-8 space-y-8">
           <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                 <div>
                    <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">{activeAnalysis.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Visualizing the Critical Convergence Point</p>
                 </div>
                 <div className="bg-slate-900 px-6 py-4 rounded-[2rem] text-center border-l-4 border-amber-500">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-1">Fixed Burden Requirement</span>
                    <div className="text-2xl font-mono font-black text-white">{currency.formatCompact(activeAnalysis.fixed || 0)}</div>
                 </div>
              </div>
              
              <div className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                       <YAxis axisLine={false} tickLine={false} tickFormatter={v => `U${v/1000}k`} tick={{fontSize: 10, fontWeight: 700, fill: '#cbd5e1'}} />
                       <Tooltip 
                        cursor={{ stroke: '#f1f5f9', strokeWidth: 20 }}
                        contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)'}}
                        formatter={(v: any) => [currency.format(v), 'Value']}
                       />
                       <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '20px'}} />
                       
                       <ReferenceLine x={`U${Math.round(activeAnalysis.bepRevenue/1000)}k`} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" label={{ value: 'BEP', position: 'top', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                       
                       <Area name="Cumulative Costs" type="monotone" dataKey="totalCost" stroke="#ef4444" strokeWidth={2} fill="url(#colorLoss)" fillOpacity={1} />
                       <Area name="Sales Revenue (NSV)" type="monotone" dataKey="revenue" stroke="#1e1b4b" strokeWidth={4} fill="transparent" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 text-center space-y-2 group hover:bg-emerald-100 transition-all">
                 <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Breakeven Value</div>
                 <div className="text-3xl font-mono font-black text-emerald-950">{currency.formatCompact(activeAnalysis.bepRevenue)}</div>
                 <p className="text-[8px] text-emerald-500 font-bold uppercase">Required Revenue</p>
              </div>
              <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white text-center space-y-2 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full translate-x-4 -translate-y-4"></div>
                 <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Breakeven Units</div>
                 <div className="text-3xl font-mono font-black">
                    {Math.ceil(activeAnalysis.bepUnits || 0).toLocaleString()}
                 </div>
                 <p className="text-[8px] text-indigo-300 font-bold uppercase">Critical Target Qty</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center space-y-2 shadow-sm">
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Margin of Safety</div>
                 <div className={`text-3xl font-mono font-black ${activeAnalysis.mosPercent > 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {activeAnalysis.mosPercent.toFixed(1)}%
                 </div>
                 <p className="text-[8px] text-slate-300 font-bold uppercase">Volume Buffer</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 text-center space-y-2">
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contribution Ratio</div>
                 <div className="text-3xl font-mono font-black text-slate-900">{Math.round((activeAnalysis.cmRatio || 0) * 100)}%</div>
                 <p className="text-[8px] text-slate-300 font-bold uppercase">Penny-to-Profit Conversion</p>
              </div>
           </div>

           <div className="bg-indigo-50 p-10 rounded-[4rem] border border-indigo-100 flex flex-col md:flex-row items-center gap-10">
              <div className="text-5xl grayscale opacity-30 shrink-0">📈</div>
              <div>
                 <h4 className="text-xl font-bold text-indigo-900 font-serif mb-2 uppercase">Understanding the Threshold</h4>
                 <p className="text-sm text-indigo-700 leading-relaxed italic">
                    "Breakeven occurs where total revenue precisely offsets total fixed and variable costs. Any unit produced beyond this point contributes purely to your net surplus. Use the **Breakeven Tool** to simulate how small pricing increases or material efficiency gains can dramatically lower your risk profile."
                 </p>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default CostAccountant;
