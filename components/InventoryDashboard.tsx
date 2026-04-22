
import React, { useMemo } from 'react';
import { Ingredient, FinishedGood, SKU, Sale, ProductionLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface InventoryDashboardProps {
  ingredients: Ingredient[];
  finishedGoods: FinishedGood[];
  skus: SKU[];
  sales: Sale[];
  productionLogs: ProductionLog[];
  currency: { format: (v: number) => string, formatCompact: (v: number) => string };
  onNavigate?: (tab: string) => void;
}

const COLORS = ['#1e1b4b', '#4f46e5', '#818cf8', '#fbbf24', '#f59e0b', '#dc2626'];

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ ingredients, finishedGoods, skus, sales, productionLogs, currency, onNavigate }) => {
  const metrics = useMemo(() => {
    const rmValue = ingredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0);
    const fgValue = finishedGoods.reduce((sum, f) => {
      const sku = skus.find(s => s.id === f.skuId);
      return sum + (f.stockLevel * (sku?.factoryPrice || 0));
    }, 0);
    const totalValue = rmValue + fgValue;

    // 1. ABC Analysis (Pareto Classification)
    const sortedByValue = [...ingredients]
      .map(i => ({ ...i, val: i.currentStock * i.costPerUnit }))
      .sort((a, b) => b.val - a.val);
    
    let runningSum = 0;
    const abcData = sortedByValue.map(i => {
      runningSum += i.val;
      const pct = (runningSum / totalValue) * 100;
      let classification: 'A' | 'B' | 'C' = 'C';
      if (pct <= 70) classification = 'A';
      else if (pct <= 90) classification = 'B';
      return { ...i, classification };
    });

    const abcSummary = [
      { name: 'A-Class (Critical)', value: abcData.filter(x => x.classification === 'A').reduce((s, x) => s + x.val, 0), color: '#1e1b4b', desc: 'Top 70% Value' },
      { name: 'B-Class (Standard)', value: abcData.filter(x => x.classification === 'B').reduce((s, x) => s + x.val, 0), color: '#4f46e5', desc: 'Middle 20% Value' },
      { name: 'C-Class (Bulk)', value: abcData.filter(x => x.classification === 'C').reduce((s, x) => s + x.val, 0), color: '#94a3b8', desc: 'Bottom 10% Value' }
    ];

    // 2. Efficiency Ratios (Assumes 30 day window)
    const totalCogs = productionLogs.reduce((s, l) => s + (l.materialCost || 0), 0);
    const avgInv = totalValue || 1;
    const turnover = totalCogs / avgInv;
    const dio = 30 / (turnover || 1);

    return { 
      totalValue, rmValue, fgValue, 
      lowStockCount: ingredients.filter(i => i.currentStock <= i.reorderLevel).length,
      abcSummary,
      turnover,
      dio,
      expiringValue: ingredients.reduce((sum, i) => {
        const expiring = i.batches?.filter(b => {
          const diff = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
          return diff >= 0 && diff <= 3;
        }) || [];
        return sum + expiring.reduce((s, b) => s + (b.quantity * (b.unitCost || i.costPerUnit)), 0);
      }, 0)
    };
  }, [ingredients, finishedGoods, skus, productionLogs]);

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter">Inventory Asset Auditor</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Capital Liquidity • FEFO Risk • ABC Stratification</p>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 text-center">
              <div className="text-[8px] font-black text-amber-400 uppercase mb-1">Stock Turn Rate</div>
              <div className="text-xl font-mono font-black">{metrics.turnover.toFixed(1)}x</div>
           </div>
           <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 text-center">
              <div className="text-[8px] font-black text-indigo-300 uppercase mb-1">Days Stock On-Hand</div>
              <div className="text-xl font-mono font-black">{metrics.dio.toFixed(0)} Days</div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4 group hover:border-indigo-200 transition-all">
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Inventory Wealth</div>
           <div className="text-3xl font-mono font-black text-slate-900">{currency.formatCompact(metrics.totalValue)}</div>
           <div className="flex justify-between items-end pt-4 border-t border-slate-50">
              <div>
                 <div className="text-[7px] font-bold text-slate-300 uppercase">Raw (RM)</div>
                 <div className="text-xs font-mono font-black">{currency.formatCompact(metrics.rmValue)}</div>
              </div>
              <div className="text-right">
                 <div className="text-[7px] font-bold text-slate-300 uppercase">Finished (FG)</div>
                 <div className="text-xs font-mono font-black">{currency.formatCompact(metrics.fgValue)}</div>
              </div>
           </div>
        </div>

        <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 shadow-sm space-y-4">
           <div className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Value-at-Risk (Expiry)</div>
           <div className="text-3xl font-mono font-black text-rose-700">{currency.format(metrics.expiringValue)}</div>
           <p className="text-[9px] text-rose-400 font-bold uppercase italic">Stock expiring in &lt; 72hrs</p>
        </div>

        <div className="md:col-span-2 bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl flex items-center justify-between relative overflow-hidden">
           <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
           <div className="space-y-4 relative z-10">
              <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Inventory Health Score</h4>
              <div className="text-5xl font-mono font-black text-white">
                {Math.max(0, 100 - (metrics.expiringValue / (metrics.totalValue || 1) * 1000)).toFixed(0)}%
              </div>
              <p className="text-[8px] text-indigo-400 font-bold uppercase">Efficiency against spoilage and stock-outs</p>
           </div>
           <button onClick={() => onNavigate?.('stores')} className="relative z-10 bg-white text-indigo-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-amber-400 transition-all">Audit Floor Stock</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold font-serif text-slate-900">ABC Financial Stratification</h3>
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Pareto Optimized</span>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={metrics.abcSummary} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                       {metrics.abcSummary.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                      formatter={(v: any) => [currency.format(v), 'Capital Value']}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px'}} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-50">
              {metrics.abcSummary.map(s => (
                <div key={s.name} className="text-center">
                   <div className="text-[8px] font-black text-slate-400 uppercase mb-1">{s.name}</div>
                   <div className="text-sm font-mono font-black" style={{ color: s.color }}>{((s.value / metrics.totalValue) * 100).toFixed(0)}%</div>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
           <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl h-full flex flex-col justify-center">
              <h4 className="text-xl font-bold font-serif text-amber-400 mb-6">Managerial Insight</h4>
              <div className="space-y-6">
                 <p className="text-sm text-indigo-100 leading-relaxed italic">
                    "Your A-Class items (Top 70% value) represent the bulk of your 'Frozen Cash'. A 2% reduction in waste for these items has more financial impact than a 50% reduction in C-Class waste."
                 </p>
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase mb-3 tracking-widest">Recommended Action</h5>
                    <ul className="space-y-2">
                       <li className="flex items-start gap-2 text-xs text-indigo-200">
                          <span className="text-emerald-400">●</span> Audit hydration levels in A-Class doughs.
                       </li>
                       <li className="flex items-start gap-2 text-xs text-indigo-200">
                          <span className="text-amber-400">●</span> Move B-Class items to FEFO storage.
                       </li>
                    </ul>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
