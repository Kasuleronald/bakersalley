import React, { useMemo } from 'react';
import { SKU, Ingredient, Activity, Overhead, Employee, Transaction } from '../types';
import { getConversionFactor } from '../utils/conversionUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface MarginalCostingProps {
  skus: SKU[];
  ingredients: Ingredient[];
  activities: Activity[];
  overheads: Overhead[];
  employees: Employee[];
  currency: { format: (v: number) => string, formatCompact: (v: number) => string };
}

const PRODUCTION_DAYS = 26;
const MATERIAL_WASTE_FACTOR = 1.08;

const MarginalCosting: React.FC<MarginalCostingProps> = ({ skus, ingredients, activities, overheads, employees, currency }) => {
  
  const marginalData = useMemo(() => {
    // 1. Fixed Cost Pool (Period Costs)
    const fixedOverheads = overheads
      .filter(oh => oh.type === 'Fixed')
      .reduce((sum, oh) => sum + (oh.period === 'Monthly' ? oh.amount : oh.amount * 4.33), 0);
    
    const fixedSalaries = employees
      .filter(e => e.isActive && e.employmentType === 'Permanent')
      .reduce((sum, e) => sum + e.salary, 0);
    
    const totalFixedCosts = fixedOverheads + fixedSalaries;

    // 2. Marginal Analysis per SKU
    const analysis = skus.map(sku => {
      const yieldVal = Math.max(1, sku.yield || 1);
      
      // Variable Material Cost
      const unitVariableMaterials = sku.recipeItems.reduce((acc, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        const factor = ing ? getConversionFactor(ing, item.unit) : 1;
        return acc + (((ing?.costPerUnit || 0) * (item.quantity * factor)) * MATERIAL_WASTE_FACTOR);
      }, 0) / yieldVal;

      // Variable Activity/Labor Cost (Only if treated as variable)
      const unitVariableActivities = sku.activities.reduce((acc, sa) => {
        const act = activities.find(a => a.id === sa.activityId);
        if (!act) return acc;
        // In marginal costing, we often treat manual labor as fixed unless it's piece-rate.
        // For this audit, we will include variable energy/fuel drivers as marginal.
        const isVariableDriver = act.driver.includes('Units') || act.driver.includes('Batches');
        if (!isVariableDriver) return acc;
        
        const consumption = act.driver.includes('Hours') ? sa.quantity : sa.quantity / 60;
        return acc + (act.rate * consumption);
      }, 0) / yieldVal;

      const marginalCost = unitVariableMaterials + unitVariableActivities;
      const contribution = sku.retailPrice - marginalCost;
      const pvRatio = sku.retailPrice > 0 ? (contribution / sku.retailPrice) * 100 : 0;

      return {
        ...sku,
        marginalCost,
        contribution,
        pvRatio,
        monthlyContribution: contribution * sku.monthlyVolumeEstimate
      };
    });

    const totalContribution = analysis.reduce((s, x) => s + x.monthlyContribution, 0);
    const netProfit = totalContribution - totalFixedCosts;

    return { analysis, totalFixedCosts, totalContribution, netProfit };
  }, [skus, ingredients, activities, overheads, employees]);

  const chartData = useMemo(() => {
    return marginalData.analysis
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 10)
      .map(item => ({
        name: item.name,
        contribution: item.contribution,
        marginalCost: item.marginalCost
      }));
  }, [marginalData]);

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fixed Burden</div>
           <div className="text-3xl font-mono font-black text-slate-900">{currency.formatCompact(marginalData.totalFixedCosts)}</div>
           <p className="text-[8px] text-slate-300 font-bold uppercase mt-2">Period Cost Target</p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-sm text-center">
           <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Contribution</div>
           <div className="text-3xl font-mono font-black text-emerald-700">{currency.formatCompact(marginalData.totalContribution)}</div>
           <p className="text-[8px] text-emerald-400 font-bold uppercase mt-2">Before Fixed deduction</p>
        </div>
        <div className={`p-8 rounded-[3rem] shadow-xl flex flex-col justify-center text-center ${marginalData.netProfit >= 0 ? 'bg-indigo-900 text-white' : 'bg-rose-900 text-white'}`}>
           <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Net Period Profit</div>
           <div className="text-3xl font-mono font-black">{currency.formatCompact(marginalData.netProfit)}</div>
           <p className="text-[8px] text-white/40 font-bold uppercase mt-2">Marginal Net Surplus</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-bold font-serif text-slate-900 mb-10 uppercase tracking-tighter text-center">Unit Contribution Ladder</h3>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} width={120} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" align="right" height={36}/>
                    <Bar name="Unit Contribution" dataKey="contribution" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} />
                    <Bar name="Marginal Cost" dataKey="marginalCost" fill="#cbd5e1" radius={[0, 10, 10, 0]} barSize={20} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center h-full border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10 blur-3xl"></div>
              <h4 className="text-amber-400 font-black uppercase text-[10px] tracking-widest mb-6 relative z-10">Strategic P/V Audit</h4>
              <div className="space-y-6 relative z-10">
                 {marginalData.analysis.sort((a,b) => b.pvRatio - a.pvRatio).slice(0, 4).map(sku => (
                   <div key={sku.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-xs font-bold uppercase truncate pr-4">{sku.name}</span>
                         <span className="text-sm font-mono font-black text-emerald-400">{sku.pvRatio.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500" style={{ width: `${sku.pvRatio}%` }}></div>
                      </div>
                      <div className="text-[7px] text-slate-400 font-bold uppercase mt-2">Profit/Volume Ratio</div>
                   </div>
                 ))}
              </div>
              <div className="pt-8 mt-8 border-t border-white/10 relative z-10">
                 <p className="text-xs text-indigo-200 italic leading-relaxed">
                   "A high P/V ratio indicates that volume increases will rapidly convert to net profit once the fixed costs are covered."
                 </p>
              </div>
           </div>
        </aside>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="px-10 py-6 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 font-serif uppercase tracking-tight">Marginal Ledger View</h3>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Variable Analysis</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                     <th className="px-10 py-5">Product SKU</th>
                     <th className="px-6 py-5 text-right">Selling Price</th>
                     <th className="px-6 py-5 text-right">Marginal Cost</th>
                     <th className="px-6 py-5 text-right">Contribution</th>
                     <th className="px-10 py-5 text-right">P/V Ratio</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {marginalData.analysis.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-all">
                       <td className="px-10 py-5">
                          <div className="font-black text-slate-900 text-sm uppercase">{item.name}</div>
                          <div className="text-[8px] text-slate-400 font-bold uppercase">{item.category}</div>
                       </td>
                       <td className="px-6 py-5 text-right font-mono text-xs text-slate-500">{currency.format(item.retailPrice)}</td>
                       <td className="px-6 py-5 text-right font-mono text-xs text-rose-400">-{currency.format(item.marginalCost)}</td>
                       <td className="px-6 py-5 text-right font-mono font-black text-slate-900 text-sm">{currency.format(item.contribution)}</td>
                       <td className="px-10 py-5 text-right">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.pvRatio > 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                             {item.pvRatio.toFixed(1)}%
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

export default MarginalCosting;