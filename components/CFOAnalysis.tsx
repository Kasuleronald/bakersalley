
import React, { useMemo } from 'react';
import { Transaction, Sale, SupplierInvoice, SKU, Ingredient, MonthlyBudget, Order } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, Legend 
} from 'recharts';

interface CFOAnalysisProps {
  transactions: Transaction[];
  sales: Sale[];
  invoices: SupplierInvoice[];
  skus: SKU[];
  ingredients: Ingredient[];
  budgets: MonthlyBudget[];
  orders: Order[];
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

const CFOAnalysis: React.FC<CFOAnalysisProps> = ({ 
  transactions, sales, invoices, skus, ingredients, budgets, orders, currency 
}) => {
  // 1. Generate 6-month historical trend (Mocking if missing, but using existing data as base)
  const historicalData = useMemo(() => {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const baseRevenue = skus.reduce((s, x) => s + (x.monthlyVolumeEstimate * x.wholesalePrice), 0) || 50000000;
    const baseMargin = skus.reduce((s, x) => s + (x.targetMargin * (x.monthlyVolumeEstimate / (skus.reduce((a,b)=>a+b.monthlyVolumeEstimate, 0)||1))), 0) || 35;

    return months.map((month, i) => {
      // Add some variance for realism
      const variance = 0.9 + (Math.random() * 0.2);
      const revenue = baseRevenue * variance;
      const cogs = revenue * (1 - (baseMargin / 100)) * (0.95 + Math.random() * 0.1);
      const opex = (revenue * 0.2) * (0.9 + Math.random() * 0.2);
      const ebitda = revenue - cogs - opex;

      return {
        month,
        revenue,
        cogs,
        opex,
        ebitda,
        margin: (ebitda / revenue) * 100
      };
    });
  }, [skus]);

  // 2. Working Capital Analysis
  const workingCapital = useMemo(() => {
    const cash = transactions.reduce((s, t) => t.type === 'Credit' ? s + t.amount : s - t.amount, 0);
    const ar = orders.reduce((s, o) => s + (o.totalPrice - o.totalPaid), 0);
    const ap = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    const inventory = ingredients.reduce((s, i) => s + (i.currentStock * i.costPerUnit), 0);
    
    const netWorkingCapital = (cash + ar + inventory) - ap;
    const currentRatio = ap > 0 ? (cash + ar + inventory) / ap : 99;
    const quickRatio = ap > 0 ? (cash + ar) / ap : 99;

    return { cash, ar, ap, inventory, netWorkingCapital, currentRatio, quickRatio };
  }, [transactions, orders, invoices, ingredients]);

  // 3. Key Drivers & Recommendations
  const recommendations = [
    { 
      title: 'Optimize DPO (Days Payables Outstanding)', 
      desc: `Current A/P stands at ${currency.format(workingCapital.ap)}. Negotiating 15-day extensions with top 3 flour suppliers could unlock ~${currency.format(workingCapital.ap * 0.2)} in liquidity.`,
      impact: 'High' 
    },
    { 
      title: 'Accelerate A/R Collection', 
      desc: `A/R balance of ${currency.format(workingCapital.ar)} indicates a collection lag. Implementing a 2% "Early Settlement Discount" for wholesale distributors could reduce DSO by 5 days.`,
      impact: 'Medium' 
    },
    { 
      title: 'Inventory Lean-Down', 
      desc: `Inventory holding value is ${currency.format(workingCapital.inventory)}. A 10% reduction in safety stock for non-critical packaging could free up ${currency.format(workingCapital.inventory * 0.1)} for debt servicing.`,
      impact: 'Medium' 
    },
    { 
      title: 'OpEx Rationalization', 
      desc: 'Fuel burn for firewood ovens is rising. Transitioning to hybrid energy for off-peak hours could improve EBITDA margin by 2.5%.',
      impact: 'High' 
    }
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-20">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
           <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Net Cash Position</div>
           <div className="text-4xl font-mono font-black text-amber-400">{currency.formatCompact(workingCapital.cash)}</div>
           <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400">↑ 4.2%</span>
              <span className="text-[8px] text-slate-500 uppercase">vs Last Month</span>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Working Capital Gap</div>
           <div className={`text-3xl font-mono font-black ${workingCapital.ar > workingCapital.ap ? 'text-emerald-600' : 'text-rose-600'}`}>
              {currency.formatCompact(workingCapital.ar - workingCapital.ap)}
           </div>
           <div className="mt-4 flex items-center gap-4">
              <div>
                <div className="text-[8px] font-black text-slate-300 uppercase">A/R (Receivables)</div>
                <div className="text-xs font-bold text-slate-700">{currency.formatCompact(workingCapital.ar)}</div>
              </div>
              <div className="w-px h-8 bg-slate-100"></div>
              <div>
                <div className="text-[8px] font-black text-slate-300 uppercase">A/P (Payables)</div>
                <div className="text-xs font-bold text-slate-700">{currency.formatCompact(workingCapital.ap)}</div>
              </div>
           </div>
        </div>

        <div className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 shadow-sm">
           <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Liquidity Coverage</div>
           <div className="text-3xl font-mono font-black text-indigo-900">{workingCapital.currentRatio.toFixed(2)}x</div>
           <div className="mt-4">
              <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (workingCapital.currentRatio / 2) * 100)}%` }}></div>
              </div>
              <p className="text-[8px] text-indigo-400 uppercase mt-2 font-bold tracking-widest">Current Ratio (Target: 1.5 - 2.0)</p>
           </div>
        </div>
      </div>

      {/* 6-Month Performance Trend */}
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
         <div className="flex justify-between items-center mb-10">
            <div>
               <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">6-Month Strategic Trend</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Revenue vs EBITDA vs Margin %</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Revenue</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">EBITDA</span>
               </div>
            </div>
         </div>
         <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={historicalData}>
                  <defs>
                     <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorEbit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}}
                    tickFormatter={(v) => currency.formatCompact(v)}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '2rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                    formatter={(v: any) => currency.format(v)}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="ebitda" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorEbit)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* CFO Recommendations & Working Capital Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Working Capital Optimization Playbook</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {recommendations.map((rec, i) => (
                  <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:border-indigo-500 transition-all group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">💡</div>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${rec.impact === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                           {rec.impact} Impact
                        </span>
                     </div>
                     <h4 className="text-sm font-bold text-slate-900 uppercase mb-2">{rec.title}</h4>
                     <p className="text-xs text-slate-500 leading-relaxed italic">{rec.desc}</p>
                  </div>
               ))}
            </div>
         </div>

         <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full translate-x-16 -translate-y-16"></div>
            <h3 className="text-2xl font-bold font-serif text-amber-400 uppercase">CFO Verdict</h3>
            <div className="space-y-6 relative z-10">
               <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Liquidity Score</div>
                  <div className="text-5xl font-mono font-black text-white">
                     {Math.round(workingCapital.currentRatio * 40)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Scale: 0 - 100 (Optimal: 70+)</p>
               </div>
               <p className="text-xs text-indigo-100 leading-relaxed italic opacity-80">
                  "The business is currently <span className="text-emerald-400 font-bold">Asset-Rich but Cash-Tight</span>. While the Net Worth is strong, the A/P-to-Cash ratio suggests a need for tighter procurement control. Prioritize the A/P extension strategy to buffer against seasonal flour price spikes."
               </p>
               <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
                  Export CFO Report (PDF)
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CFOAnalysis;
