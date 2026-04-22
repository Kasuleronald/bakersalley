
import React, { useMemo, useState } from 'react';
import { Supplier, Requisition, InventoryMovement, Ingredient, Transaction, SKU } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, ComposedChart } from 'recharts';

interface ProcurementDashboardProps {
  suppliers: Supplier[];
  requisitions: Requisition[];
  movements: InventoryMovement[];
  ingredients: Ingredient[];
  transactions: Transaction[];
  skus: SKU[];
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

const COLORS = ['#1e1b4b', '#4f46e5', '#818cf8', '#fbbf24', '#f59e0b', '#dc2626', '#10b981'];

const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({ suppliers, requisitions, movements, ingredients, transactions, skus, currency }) => {
  const [inflationStress, setInflationStress] = useState(0);

  const metrics = useMemo(() => {
    const activeReqs = requisitions.filter(r => r.status === 'Pending' || r.status === 'Authorized' || r.status === 'Draft');
    const totalReqValue = activeReqs.reduce((s, r) => s + r.estimatedCost, 0);
    
    const avgLeadTime = suppliers.length > 0 
      ? suppliers.reduce((s, x) => s + (x.averageDeliveryTime || 0), 0) / suppliers.length 
      : 0;
      
    const avgQuality = suppliers.length > 0 
      ? suppliers.reduce((s, x) => s + (x.averageQualityScore || 0), 0) / suppliers.length 
      : 0;

    const leadTimeData = suppliers
      .sort((a, b) => (b.averageDeliveryTime || 0) - (a.averageDeliveryTime || 0))
      .slice(0, 8)
      .map(s => ({ name: s.name.split(' ')[0], days: s.averageDeliveryTime }));

    const categorySpend: Record<string, number> = {};
    activeReqs.forEach(req => {
      const ing = ingredients.find(i => i.id === req.ingredientId);
      const cat = ing?.category || 'Other';
      categorySpend[cat] = (categorySpend[cat] || 0) + req.estimatedCost;
    });
    const spendChartData = Object.entries(categorySpend).map(([name, value]) => ({ name, value }));

    const varianceData = movements
      .filter(m => m.type === 'Received from Supplier' && m.cost && m.ingredientId)
      .slice(-15)
      .map(m => {
        const ing = ingredients.find(i => i.id === m.ingredientId);
        const theoreticalCost = ing ? ing.costPerUnit * m.quantity : 0;
        const actualCost = m.cost || 0;
        const variance = theoreticalCost > 0 ? ((actualCost - theoreticalCost) / theoreticalCost) * 100 : 0;
        return {
          date: new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          variance: Number(variance.toFixed(2)),
          item: ing?.name || 'Unknown'
        };
      });

    // Stress Impact Calculation
    const totalMaterialCogs = skus.reduce((sum, sku) => {
        const units = sku.monthlyVolumeEstimate || 1000;
        const matCost = sku.recipeItems.reduce((acc, ri) => {
            const ing = ingredients.find(i => i.id === ri.ingredientId);
            return acc + ((ing?.costPerUnit || 0) * ri.quantity);
        }, 0) / (sku.yield || 1);
        return sum + (matCost * units);
    }, 0);

    const marginImpact = totalMaterialCogs * (inflationStress / 100);

    return { 
      activeReqsCount: activeReqs.length, 
      totalReqValue, 
      avgLeadTime, 
      avgQuality, 
      leadTimeData, 
      spendChartData,
      varianceData,
      totalMaterialCogs,
      marginImpact
    };
  }, [suppliers, requisitions, ingredients, movements, skus, inflationStress]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-2 group hover:border-indigo-200 transition-all">
           <div className="flex justify-between items-center">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Requisitions</div>
              <span className="text-xl">📦</span>
           </div>
           <div className="text-4xl font-mono font-black text-indigo-900">{metrics.activeReqsCount}</div>
           <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Cycle: Open/Pending</p>
        </div>
        
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-2 group hover:border-emerald-200 transition-all">
           <div className="flex justify-between items-center">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Commitment Value</div>
              <span className="text-xl">💰</span>
           </div>
           <div className="text-4xl font-mono font-black text-emerald-600">{currency.formatCompact(metrics.totalReqValue)}</div>
           <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Drafted Capital</p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl space-y-2 group hover:shadow-indigo-500/10 transition-all">
           <div className="flex justify-between items-start mb-2">
              <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Network Lead Time</div>
              <span className="text-xl opacity-50">⏱️</span>
           </div>
           <div className="text-4xl font-mono font-black text-white">{metrics.avgLeadTime.toFixed(1)} <span className="text-xs">Days</span></div>
           <p className="text-[8px] text-slate-500 font-bold uppercase mt-2">Performance Benchmark</p>
        </div>

        <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 shadow-sm text-center flex flex-col justify-center transition-all hover:bg-indigo-100">
           <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Quality Reliability</div>
           <div className="text-3xl font-mono font-black text-indigo-900">{metrics.avgQuality.toFixed(1)} / 5.0</div>
           <div className="flex justify-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-[10px] ${i < Math.round(metrics.avgQuality) ? 'text-amber-500' : 'text-indigo-200'}`}>★</span>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold font-serif text-slate-900 uppercase tracking-tighter">Purchase Price Variance (PPV)</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Drift between market master price and actual cost (%)</p>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={metrics.varianceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(v: any, name: any, props: any) => [`${v}%`, `Variance (${props.payload.item})`]}
                    />
                    <Line type="monotone" dataKey="variance" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-6 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
            <div className="relative z-10 text-center">
                <h4 className="text-xl font-bold font-serif text-rose-400 uppercase mb-4">Inflation Stress Test</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span>Input Inflation</span>
                        <span className="text-rose-400 font-mono">+{inflationStress}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="50" step="5" 
                        className="w-full accent-rose-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                        value={inflationStress} 
                        onChange={e => setInflationStress(parseInt(e.target.value))} 
                    />
                    <div className="pt-6 border-t border-white/10">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Projected Margin Erosion</span>
                        <div className="text-3xl font-mono font-black text-rose-500">-{currency.formatCompact(metrics.marginImpact)}</div>
                        <p className="text-[7px] text-slate-500 uppercase mt-2">Based on current S&OP volume targets</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[4rem] text-slate-900 flex flex-col md:flex-row items-center gap-12 shadow-sm border border-slate-100">
         <div className="text-6xl grayscale opacity-30 shrink-0">📊</div>
         <div className="relative z-10 space-y-4">
            <h4 className="text-2xl font-bold font-serif text-indigo-900 mb-2 uppercase tracking-tight">Supply Performance Logic</h4>
            <p className="text-sm text-slate-500 leading-relaxed max-w-4xl italic">
              "Strategic procurement is built on three pillars: **Velocity, Integrity, and Cost**. The Inflation Stress Test allows you to visualize the impact of commodity surges before they hit your P&L. By monitoring PPV trends, you can identify suppliers who are drifting above market rates and re-allocate volume to higher-reliability vendors in your network."
            </p>
         </div>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
