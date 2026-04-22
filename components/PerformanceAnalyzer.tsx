
import React, { useState, useMemo } from 'react';
import { Sale, Transaction, SKU, ProductionLog, Ingredient, ProductYieldUnit } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { downloadCSV } from '../utils/exportUtils';

// Added interface to fix type inference issues with Object.values
interface SkuPerformanceDetail {
  produced: number;
  sold: number;
  target: number;
  name: string;
  unit: string;
}

interface PerformanceAnalyzerProps {
  sales: Sale[];
  transactions: Transaction[];
  skus: SKU[];
  productionLogs: ProductionLog[];
  ingredients: Ingredient[];
}

type Grain = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year';
type ViewMode = 'Trend' | 'Comparison' | 'Production';

const PerformanceAnalyzer: React.FC<PerformanceAnalyzerProps> = ({ sales, transactions, skus, productionLogs, ingredients }) => {
  const [grain, setGrain] = useState<Grain>('Week');
  const [viewMode, setViewMode] = useState<ViewMode>('Trend');
  const [periodA, setPeriodA] = useState<string>('');
  const [periodB, setPeriodB] = useState<string>('');
  const [selectedPeriodForQuantities, setSelectedPeriodForQuantities] = useState<string>('');

  // 1. Grouping Logic
  const getPeriodKey = (date: Date, grain: Grain) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    if (grain === 'Day') return date.toISOString().split('T')[0];
    if (grain === 'Week') {
      const firstDayOfYear = new Date(y, 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${y}-W${weekNum.toString().padStart(2, '0')}`;
    }
    if (grain === 'Month') return `${y}-${(m + 1).toString().padStart(2, '0')} (${date.toLocaleString('default', { month: 'short' })})`;
    if (grain === 'Quarter') return `${y}-Q${Math.floor(m / 3) + 1}`;
    if (grain === 'Year') return `${y}`;
    return '';
  };

  // 2. Master Data Processing
  const aggregatedPeriods = useMemo(() => {
    const map: Record<string, { 
      period: string; 
      revenue: number; 
      expenses: number; 
      salesUnits: number; 
      producedUnits: number;
      targetUnits: number;
      materialCost: number;
      skuDetails: Record<string, SkuPerformanceDetail>;
      ingredients: Record<string, { qty: number; name: string; unit: string; cost: number }>;
      date: Date;
    }> = {};

    const getTargetForGrain = (val: number) => {
      if (grain === 'Month') return val;
      if (grain === 'Week') return val / 4.33;
      if (grain === 'Day') return val / 26;
      if (grain === 'Quarter') return val * 3;
      if (grain === 'Year') return val * 12;
      return val;
    };

    const periodTargets = skus.reduce((sum, s) => sum + getTargetForGrain(s.monthlyVolumeEstimate), 0);

    sales.forEach(sale => {
      const d = new Date(sale.date);
      const key = getPeriodKey(d, grain);
      if (!map[key]) map[key] = { period: key, revenue: 0, expenses: 0, salesUnits: 0, producedUnits: 0, targetUnits: periodTargets, materialCost: 0, skuDetails: {}, ingredients: {}, date: d };
      map[key].revenue += sale.totalPrice;
      map[key].salesUnits += sale.quantity;
      
      if (!map[key].skuDetails[sale.skuId]) {
        const s = skus.find(x => x.id === sale.skuId);
        map[key].skuDetails[sale.skuId] = { 
          produced: 0, 
          sold: 0, 
          target: getTargetForGrain(s?.monthlyVolumeEstimate || 0), 
          name: s?.name || 'Unknown',
          unit: s?.unit || 'Units'
        };
      }
      map[key].skuDetails[sale.skuId].sold += sale.quantity;
    });

    transactions.forEach(tx => {
      if (tx.type !== 'Debit') return;
      const d = new Date(tx.date);
      const key = getPeriodKey(d, grain);
      if (!map[key]) map[key] = { period: key, revenue: 0, expenses: 0, salesUnits: 0, producedUnits: 0, targetUnits: periodTargets, materialCost: 0, skuDetails: {}, ingredients: {}, date: d };
      map[key].expenses += tx.amount;
    });

    productionLogs.forEach(log => {
      const sku = skus.find(s => s.id === log.skuId);
      if (!sku) return;
      const d = new Date(log.date);
      const key = getPeriodKey(d, grain);
      if (!map[key]) map[key] = { period: key, revenue: 0, expenses: 0, salesUnits: 0, producedUnits: 0, targetUnits: periodTargets, materialCost: 0, skuDetails: {}, ingredients: {}, date: d };
      
      map[key].producedUnits += log.totalUnitsProduced;
      
      if (!map[key].skuDetails[log.skuId]) {
        map[key].skuDetails[log.skuId] = { 
          produced: 0, 
          sold: 0, 
          target: getTargetForGrain(sku.monthlyVolumeEstimate || 0), 
          name: sku.name,
          unit: sku.unit
        };
      }
      map[key].skuDetails[log.skuId].produced += log.totalUnitsProduced;

      sku.recipeItems.forEach(item => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        if (!ing) return;
        const usedQty = item.quantity * log.roundsProduced;
        const cost = usedQty * ing.costPerUnit;
        if (!map[key].ingredients[ing.id]) {
          map[key].ingredients[ing.id] = { qty: 0, name: ing.name, unit: ing.unit, cost: 0 };
        }
        map[key].ingredients[ing.id].qty += usedQty;
        map[key].ingredients[ing.id].cost += cost;
        map[key].materialCost += cost;
      });
    });

    return Object.values(map).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [sales, transactions, productionLogs, skus, ingredients, grain]);

  const periodsList = useMemo(() => aggregatedPeriods.map(p => p.period).reverse(), [aggregatedPeriods]);
  
  const activeQuantityPeriod = useMemo(() => {
    return aggregatedPeriods.find(p => p.period === (selectedPeriodForQuantities || periodsList[0])) || aggregatedPeriods[aggregatedPeriods.length - 1];
  }, [aggregatedPeriods, selectedPeriodForQuantities, periodsList]);

  const handleExport = () => {
    if (viewMode === 'Production' && activeQuantityPeriod) {
      const exportRows = (Object.values(activeQuantityPeriod.skuDetails) as SkuPerformanceDetail[]).map((d, idx) => {
        const row = idx + 2;
        return {
          Product: d.name,
          Produced: d.produced,
          Sold: d.sold,
          Unit: d.unit,
          Target: Math.round(d.target),
          'Units Variance': `=B${row}-C${row}`,
          'Clearance Rate (%)': `=IF(B${row}>0, (C${row}/B${row})*100, 0)`
        };
      });
      downloadCSV(exportRows, `production_quantities_audit_${activeQuantityPeriod.period}`);
    } else {
      downloadCSV(aggregatedPeriods.map(p => ({
        Period: p.period,
        Produced_Units: p.producedUnits,
        Sold_Units: p.salesUnits,
        Target_Units: p.targetUnits,
        Revenue: p.revenue
      })), `performance_throughput_${grain}`);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif">Performance Intelligence</h2>
          <p className="text-gray-500 font-medium text-sm">Throughput analysis: Units produced vs. Units sold.</p>
        </div>
        <div className="flex flex-col gap-2">
           <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-amber-100">
              <button onClick={() => setViewMode('Trend')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'Trend' ? 'bg-amber-900 text-white' : 'text-gray-400 hover:text-amber-900'}`}>Financial Trends</button>
              <button onClick={() => setViewMode('Production')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'Production' ? 'bg-amber-900 text-white' : 'text-gray-400 hover:text-amber-900'}`}>Product Quantities</button>
           </div>
           <div className="flex bg-white p-1 rounded-xl shadow-sm border border-amber-50 justify-center">
              {(['Day', 'Week', 'Month', 'Quarter', 'Year'] as Grain[]).map(g => (
                <button key={g} onClick={() => setGrain(g)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${grain === g ? 'bg-amber-100 text-amber-900' : 'text-gray-300'}`}>{g}</button>
              ))}
           </div>
        </div>
      </header>

      {viewMode === 'Trend' ? (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-amber-50 shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest text-center">Unit Throughput (Produced)</div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aggregatedPeriods}>
                    <defs>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="period" hide />
                    <Tooltip />
                    <Area type="monotone" name="Produced Units" dataKey="producedUnits" stroke="#d97706" fillOpacity={1} fill="url(#colorProd)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-indigo-950 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-center text-center">
               <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Bakery Volume Profile</div>
               <div className="text-4xl font-bold font-mono">
                 {aggregatedPeriods[aggregatedPeriods.length-1]?.producedUnits.toLocaleString() || 0}
                 <span className="text-xs text-indigo-400 ml-2 uppercase">Units Logged</span>
               </div>
               <p className="text-[9px] text-indigo-400 font-bold mt-2">FOR THE SELECTED PERIOD: {aggregatedPeriods[aggregatedPeriods.length-1]?.period}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-50 shadow-sm flex flex-col justify-center items-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Inventory Clearance</div>
                {aggregatedPeriods.length > 0 ? (() => {
                  const last = aggregatedPeriods[aggregatedPeriods.length - 1];
                  const ratio = last.producedUnits > 0 ? (last.salesUnits / last.producedUnits) * 100 : 0;
                  return (
                    <>
                      <div className={`text-3xl font-bold ${ratio > 90 ? 'text-green-600' : 'text-amber-600'}`}>{ratio.toFixed(1)}%</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Sales-to-Prod Ratio</div>
                    </>
                  );
                })() : '---'}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-amber-50">
             <h3 className="text-xl font-bold text-gray-900 font-serif mb-10">Financial Value Flow ({grain}ly)</h3>
             <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={aggregatedPeriods}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                   <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                   <YAxis axisLine={false} tickLine={false} tickFormatter={v => `UGX ${v/1000}k`} />
                   <Tooltip cursor={{fill: '#fcfaf7'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                   <Legend verticalAlign="top" align="right" iconType="circle" />
                   <Bar name="Sales Revenue" dataKey="revenue" fill="#1e1b4b" radius={[4, 4, 0, 0]} />
                   <Bar name="Material Cost" dataKey="materialCost" fill="#d97706" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* Quantity Controls */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-amber-50 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Focus Period</span>
                <select 
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-1 focus:ring-amber-500"
                  value={selectedPeriodForQuantities || periodsList[0]}
                  onChange={e => setSelectedPeriodForQuantities(e.target.value)}
                >
                  {periodsList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
             </div>
             <button onClick={handleExport} className="bg-gray-900 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg">Download Audit Log (with Formulae)</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-amber-50">
                <h3 className="text-lg font-bold text-gray-900 font-serif mb-8">Quantity Throughput Trend (Aggregate)</h3>
                <div className="h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={aggregatedPeriods}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" align="right" height={36}/>
                        <Bar name="Actual Produced" dataKey="producedUnits" fill="#d97706" barSize={30} radius={[4, 4, 0, 0]} />
                        <Bar name="Actual Sold" dataKey="salesUnits" fill="#1e1b4b" barSize={15} radius={[4, 4, 0, 0]} />
                        <Line name="Production Target" type="monotone" dataKey="targetUnits" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </ComposedChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-xl flex flex-col">
                <h3 className="text-lg font-bold text-amber-400 font-serif mb-6">High Volume Products</h3>
                <div className="flex-1 space-y-4">
                   {(Object.values(activeQuantityPeriod?.skuDetails || {}) as SkuPerformanceDetail[])
                     .sort((a,b) => b.produced - a.produced)
                     .slice(0, 5)
                     .map((sku, idx) => (
                       <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                          <div className="overflow-hidden">
                             <div className="text-xs font-bold truncate">{sku.name}</div>
                             <div className="text-[9px] text-gray-500 uppercase tracking-tighter">
                               Produced: {sku.produced.toLocaleString()} {sku.unit}
                             </div>
                          </div>
                          <div className="text-right">
                             <div className={`text-xs font-bold ${sku.sold >= sku.produced ? 'text-green-400' : 'text-amber-400'}`}>
                                {sku.produced > 0 ? ((sku.sold / sku.produced) * 100).toFixed(0) : 0}% Clearance
                             </div>
                          </div>
                       </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-amber-50 overflow-hidden">
             <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 font-serif">Product Unit Ledger: {activeQuantityPeriod?.period}</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                         <th className="px-8 py-5">Product SKU</th>
                         <th className="px-6 py-5 text-center">Produced (Qty)</th>
                         <th className="px-6 py-5 text-center">Sold (Qty)</th>
                         <th className="px-6 py-5 text-center">Product Unit</th>
                         <th className="px-6 py-5 text-right">Inventory Shift</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {(Object.values(activeQuantityPeriod?.skuDetails || {}) as SkuPerformanceDetail[])
                        .sort((a,b) => b.produced - a.produced)
                        .map((sku, idx) => {
                          const invShift = sku.produced - sku.sold;
                          return (
                            <tr key={idx} className="hover:bg-amber-50/10 transition-all group">
                               <td className="px-8 py-5 font-bold text-gray-900">{sku.name}</td>
                               <td className="px-6 py-5 text-center font-mono font-bold text-amber-600">{sku.produced.toLocaleString()}</td>
                               <td className="px-6 py-5 text-center font-mono font-bold text-indigo-900">{sku.sold.toLocaleString()}</td>
                               <td className="px-6 py-5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sku.unit}</td>
                               <td className={`px-6 py-5 text-right font-mono font-bold ${invShift > 0 ? 'text-amber-500' : 'text-green-600'}`}>
                                  {invShift > 0 ? `+${invShift.toLocaleString()}` : invShift.toLocaleString()}
                               </td>
                            </tr>
                          );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalyzer;
