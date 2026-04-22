
import React, { useState, useMemo } from 'react';
import { SKU, Sale, Ingredient, Activity, Overhead, Employee } from '../types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell, BarChart, Bar, Legend } from 'recharts';
import { analyzeProductMix } from '../services/geminiService';
import { getConversionFactor } from '../utils/conversionUtils';

interface ProductMixAnalysisProps {
  skus: SKU[];
  sales: Sale[];
  ingredients: Ingredient[];
  activities: Activity[];
  overheads: Overhead[];
  employees: Employee[];
  currency: { active: any, format: (v: number) => string };
}

const MATERIAL_WASTE_FACTOR = 1.08;
const PRODUCTION_DAYS = 26;

type AnalysisDimension = 'SKU' | 'Category';
type Quadrant = 'Star' | 'Cow' | 'Question' | 'Dog';

const ProductMixAnalysis: React.FC<ProductMixAnalysisProps> = ({ skus, sales, ingredients, activities, overheads, employees, currency }) => {
  const [dimension, setDimension] = useState<AnalysisDimension>('SKU');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // 1. Central Costing Engine (Simplified ABC for Mix analysis)
  const masterAnalysisData = useMemo(() => {
    // A. Pre-calculate Bakery-Wide Fixed Pools
    const totalProductionVol = skus.reduce((s, x) => s + x.monthlyVolumeEstimate, 0);
    const totalFixedOverhead = overheads.reduce((sum, oh) => {
      let mult = oh.period === 'Weekly' ? 4.33 : oh.period === 'Daily' ? PRODUCTION_DAYS : 1;
      return sum + (oh.amount * mult);
    }, 0);
    const totalSalaries = employees.filter(e => e.isActive).reduce((sum, e) => {
      const monthly = e.employmentType === 'Permanent' ? e.salary : (e.dailyRate || 0) * PRODUCTION_DAYS;
      return sum + monthly;
    }, 0);
    const totalBakeryBurden = totalFixedOverhead + totalSalaries;
    const unitFixedBurden = totalProductionVol > 0 ? totalBakeryBurden / totalProductionVol : 0;

    // B. Map each SKU with its true cost components
    const skuAnalysis = skus.map(sku => {
      const yieldVal = Math.max(1, sku.yield || 1);
      
      // Material Cost
      const unitMatCost = sku.recipeItems.reduce((acc, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        const factor = ing ? getConversionFactor(ing, item.unit) : 1;
        return acc + (((ing?.costPerUnit || 0) * (item.quantity * factor)) * MATERIAL_WASTE_FACTOR);
      }, 0) / yieldVal;

      // Activity/Labor Cost
      const unitActCost = sku.activities.reduce((acc, sa) => {
        const act = activities.find(a => a.id === sa.activityId);
        if (!act) return acc;
        const consumption = act.driver.includes('Hours') ? sa.quantity : sa.quantity / 60;
        return acc + (act.rate * consumption);
      }, 0) / yieldVal;

      const totalUnitCost = unitMatCost + unitActCost + unitFixedBurden;
      
      const skuSales = sales.filter(s => s.skuId === sku.id);
      const unitsSold = skuSales.reduce((sum, s) => sum + s.quantity, 0);
      const revenue = skuSales.reduce((sum, s) => sum + s.totalPrice, 0);
      
      const totalMatCostRealized = unitsSold * unitMatCost;
      const totalActCostRealized = unitsSold * unitActCost;
      const totalFixedRealized = unitsSold * unitFixedBurden;
      const totalCostRealized = totalMatCostRealized + totalActCostRealized + totalFixedRealized;

      const totalMargin = revenue - totalCostRealized;
      const marginPercent = sku.retailPrice > 0 ? ((sku.retailPrice - totalUnitCost) / sku.retailPrice) * 100 : 0;

      return {
        id: sku.id,
        name: sku.name,
        category: sku.category,
        unitsSold,
        revenue,
        totalMatCost: totalMatCostRealized,
        totalActCost: totalActCostRealized,
        totalFixedCost: totalFixedRealized,
        totalCost: totalCostRealized,
        unitCost: totalUnitCost,
        margin: totalMargin,
        marginPercent,
        type: 'SKU'
      };
    });

    if (dimension === 'Category') {
      const cats: Record<string, any> = {};
      skuAnalysis.forEach(s => {
        if (!cats[s.category]) cats[s.category] = { id: s.category, name: s.category, unitsSold: 0, revenue: 0, totalMatCost: 0, totalActCost: 0, totalFixedCost: 0, totalCost: 0, margin: 0, count: 0 };
        cats[s.category].unitsSold += s.unitsSold;
        cats[s.category].revenue += s.revenue;
        cats[s.category].totalMatCost += s.totalMatCost;
        cats[s.category].totalActCost += s.totalActCost;
        cats[s.category].totalFixedCost += s.totalFixedCost;
        cats[s.category].totalCost += s.totalCost;
        cats[s.category].margin += s.margin;
        cats[s.category].count += 1;
      });
      return Object.values(cats).map(c => ({
        ...c,
        marginPercent: c.revenue > 0 ? (c.margin / c.revenue) * 100 : 0,
        type: 'Category'
      }));
    }

    return skuAnalysis;
  }, [skus, sales, ingredients, activities, overheads, employees, dimension]);

  // 2. Pivot to Quadrant Assignment
  const quadrantData = useMemo(() => {
    const data = masterAnalysisData.map(d => ({
        ...d,
        x: d.unitsSold,
        y: d.marginPercent,
        z: d.revenue,
    }));

    const sortedX = [...data].sort((a,b) => a.x - b.x);
    const midX = sortedX.length > 0 ? sortedX[Math.floor(sortedX.length/2)].x : 0;
    const midY = dimension === 'Category' ? 25 : 35;

    return data.map(d => {
      let q: Quadrant = 'Dog';
      if (d.x >= midX && d.y >= midY) q = 'Star';
      else if (d.x >= midX && d.y < midY) q = 'Cow';
      else if (d.x < midX && d.y >= midY) q = 'Question';
      else q = 'Dog';
      return { ...d, quadrant: q };
    });
  }, [masterAnalysisData, dimension]);

  const handleAiAudit = async () => {
    setIsAnalyzing(true);
    const result = await analyzeProductMix(quadrantData);
    if (result) setAiReport(result);
    setIsAnalyzing(false);
  };

  const QUADRANT_COLORS: Record<Quadrant, string> = {
    Star: '#6366f1',
    Cow: '#10b981',
    Question: '#f59e0b',
    Dog: '#ef4444'
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif">Portfolio Mix Analysis</h2>
          <div className="mt-2 flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 shadow-inner">
             {(['SKU', 'Category'] as AnalysisDimension[]).map(d => (
               <button key={d} onClick={() => setDimension(d)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${dimension === d ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400'}`}>{d} Audit</button>
             ))}
          </div>
        </div>
        <button 
          onClick={handleAiAudit}
          disabled={isAnalyzing}
          className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${isAnalyzing ? 'bg-indigo-100 text-indigo-400 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black active:scale-95'}`}
        >
          {isAnalyzing ? 'Processing Portfolio...' : '🧠 AI Strategic Rationalization'}
        </button>
      </header>

      {/* TOP ROW: CATEGORY BURDEN ANALYSIS - Stacked Version */}
      {dimension === 'Category' && (
        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 animate-fadeIn">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold font-serif text-slate-900">Category Cost Stack vs. Realization</h3>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deep Margin Breakdown</div>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={quadrantData} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#475569' }} interval={0} angle={-30} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => `UGX ${v/1000}k`} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" align="right" height={36}/>
                    <Bar name="Material Component" dataKey="totalMatCost" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar name="Activity Component" dataKey="totalActCost" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                    <Bar name="Fixed Burden Component" dataKey="totalFixedCost" stackId="a" fill="#1e1b4b" radius={[4, 4, 0, 0]} />
                    <Bar name="Total Revenue (NSV)" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      )}

      {/* MATRIX VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
            <h3 className="text-xl font-bold font-serif text-slate-900 mb-8">{dimension} Positioning Matrix</h3>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
               <div className="w-full h-[2px] bg-slate-900"></div>
               <div className="h-full w-[2px] bg-slate-900 absolute"></div>
            </div>

            <div className="h-[500px]">
               <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                     <XAxis type="number" dataKey="x" name="Volume" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} label={{ value: 'Sales Volume', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 'bold' }} />
                     <YAxis type="number" dataKey="y" name="Margin" unit="%" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} label={{ value: 'True Margin %', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }} />
                     <ZAxis type="number" dataKey="z" range={[100, 2000]} name="NSV" />
                     <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        content={({ active, payload }) => {
                           if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                 <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-white/10 text-[10px] space-y-2">
                                    <div className="font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">{d.name}</div>
                                    <div className="flex justify-between gap-6"><span>Quadrant:</span> <span className="font-bold">{d.quadrant}</span></div>
                                    <div className="flex justify-between gap-6"><span>Volume:</span> <span className="font-bold">{d.unitsSold.toLocaleString()}</span></div>
                                    {/* Added cast to resolve potential unknown comparison in tooltip logic */}
                                    <div className="flex justify-between gap-6"><span>Margin:</span> <span className={`font-bold ${(d.marginPercent as number) > 35 ? 'text-emerald-400' : 'text-amber-400'}`}>{d.marginPercent.toFixed(1)}%</span></div>
                                    <div className="flex justify-between gap-6"><span>Revenue:</span> <span className="font-bold">{currency.format(d.revenue)}</span></div>
                                 </div>
                              );
                           }
                           return null;
                        }}
                     />
                     <Scatter name="Portfolio" data={quadrantData}>
                        {quadrantData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={QUADRANT_COLORS[entry.quadrant as Quadrant]} strokeWidth={entry.quadrant === 'Star' ? 2 : 1} stroke="#fff" />
                        ))}
                     </Scatter>
                  </ScatterChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            {!aiReport ? (
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl min-h-[400px] flex flex-col justify-center text-center space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
                 <div className="text-6xl grayscale opacity-20 mx-auto">📊</div>
                 <p className="text-sm text-slate-400 leading-relaxed italic px-4">
                    "Identify the cost drivers behind each category. Stacked bars reveal if high costs are driven by expensive raw materials or inefficient manual labor."
                 </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                 <div className="bg-rose-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
                    <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-4">SKU Rationalization Directive</h4>
                    <div className="text-xl font-bold font-serif text-white mb-2">"{aiReport.killSku}"</div>
                    <p className="text-xs text-rose-100/70 leading-relaxed italic">System recommendation: De-prioritize or overhaul formula to restore viable contribution.</p>
                 </div>

                 <div className="bg-white p-8 rounded-[3rem] border border-indigo-100 shadow-sm space-y-6">
                    <div>
                       <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Portfolio Narrative</h4>
                       <p className="text-sm text-slate-700 leading-relaxed italic">"{aiReport.healthSummary}"</p>
                    </div>
                    <div className="pt-6 border-t border-slate-50">
                       <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Growth Directive</h4>
                       <p className="text-xs text-slate-500 leading-relaxed">{aiReport.growthOpportunity}</p>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* DATA LEDGER WITH COST FOCUS */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="px-10 py-6 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 font-serif">{dimension} Profitability Ranking</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sorted by Total NSV realized</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b bg-gray-50/50">
                     <th className="px-10 py-5">Analysis Subject</th>
                     <th className="px-6 py-5 text-right">Raw Material Cost</th>
                     <th className="px-6 py-5 text-right">Fixed/Activity Load</th>
                     <th className="px-6 py-5 text-right">Revenue (NSV)</th>
                     <th className="px-6 py-5 text-right">Unit Efficiency</th>
                     <th className="px-10 py-5 text-right">Matrix Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {quadrantData.sort((a,b) => b.revenue - a.revenue).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                       <td className="px-10 py-5">
                          <div className="font-black text-slate-900 text-sm uppercase tracking-tighter">{item.name}</div>
                          <div className="text-[8px] text-slate-400 font-bold uppercase">{item.category} {item.type === 'Category' ? `(${item.count} SKUs)` : ''}</div>
                       </td>
                       <td className="px-6 py-5 text-right font-mono text-xs text-amber-600">
                          {currency.format(item.totalMatCost)}
                       </td>
                       <td className="px-6 py-5 text-right font-mono text-xs text-indigo-400">
                          {currency.format(item.totalActCost + item.totalFixedCost)}
                       </td>
                       <td className="px-6 py-5 text-right font-mono font-black text-indigo-900 text-sm">
                          {currency.format(item.revenue)}
                       </td>
                       <td className="px-6 py-5 text-right">
                          {/* Fixed: Explicitly cast marginPercent to number to avoid unknown type error in operator check */}
                          <div className={`text-xs font-mono font-black ${(item.marginPercent as number) > 35 ? 'text-emerald-600' : 'text-amber-600'}`}>
                             {item.marginPercent.toFixed(1)}%
                          </div>
                          <div className="text-[7px] font-black text-slate-300 uppercase">Operating Margin</div>
                       </td>
                       <td className="px-10 py-5 text-right">
                          <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-inner text-white`} style={{ backgroundColor: QUADRANT_COLORS[item.quadrant as Quadrant] }}>
                             {item.quadrant}
                          </span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ProductMixAnalysis;
