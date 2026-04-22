
import React, { useState, useMemo } from 'react';
import { 
  SKU, Ingredient, Sale, Transaction, Employee, 
  Overhead, Customer, Order, FinishedGood, Asset, Loan, SupplierInvoice, ProductionLog, InventoryLoss
} from '../types';
import { financialEngine } from '../services/financialEngine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ComposedChart, Line } from 'recharts';

interface RatioAnalysisProps {
  skus: SKU[];
  ingredients: Ingredient[];
  sales: Sale[];
  transactions: Transaction[];
  employees: Employee[];
  overheads: Overhead[];
  customers: Customer[];
  orders: Order[];
  finishedGoods: FinishedGood[];
  assets: Asset[];
  loans: Loan[];
  invoices: SupplierInvoice[];
  productionLogs: ProductionLog[];
  inventoryLosses: InventoryLoss[];
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
}

type RatioCategory = 'Reserves' | 'CashCycle' | 'BakersRatios' | 'Liquidity';

const RatioAnalysis: React.FC<RatioAnalysisProps> = ({ 
  skus, ingredients, sales, transactions, employees, overheads, customers, orders, finishedGoods, assets, loans, invoices, productionLogs, inventoryLosses, currency 
}) => {
  const [activeCategory, setActiveCategory] = useState<RatioCategory>('CashCycle');

  const intel = useMemo(() => financialEngine.calculateRatioIntelligence({
    ingredients, finishedGoods, skus, sales, transactions, employees, overheads, customers, orders, assets, loans, invoices, productionLogs, inventoryLosses
  }), [ingredients, finishedGoods, skus, sales, transactions, employees, overheads, customers, orders, assets, loans, invoices, productionLogs, inventoryLosses]);

  const cycleChartData = useMemo(() => [
    { name: 'Inventory (DSI)', days: intel.cashCycle.dsi, fill: '#6366f1', type: 'Add' },
    { name: 'Receivables (DSO)', days: intel.cashCycle.dso, fill: '#818cf8', type: 'Add' },
    { name: 'Payables (DPO)', days: -intel.cashCycle.dpo, fill: '#fbbf24', type: 'Sub' },
  ], [intel.cashCycle]);

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-fit shadow-inner border border-slate-200 overflow-x-auto scrollbar-hide max-w-full">
         {[
           { id: 'CashCycle', label: 'Cash Conversion', icon: '🔄' },
           { id: 'Reserves', label: 'Growth Reserves', icon: '🛡️' },
           { id: 'BakersRatios', label: 'Floor Audit', icon: '🥖' },
           { id: 'Liquidity', label: 'Insolvency', icon: '🏦' }
         ].map((cat) => (
           <button 
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as RatioCategory)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${activeCategory === cat.id ? 'bg-indigo-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <span>{cat.icon}</span> {cat.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <main className="lg:col-span-8 space-y-8">
           {activeCategory === 'CashCycle' && (
             <div className="space-y-8 animate-fadeIn">
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                         <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">The Liquidity Bridge</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Measuring Day-Velocity of Capital</p>
                      </div>
                      <div className="bg-indigo-900 px-6 py-4 rounded-[2rem] text-center border-l-4 border-amber-500 shadow-xl">
                         <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Cash Conversion Cycle</span>
                         <div className="text-3xl font-mono font-black text-white">{Math.round(intel.cashCycle.ccc)} <span className="text-sm">Days</span></div>
                      </div>
                   </div>

                   <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={cycleChartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="days" radius={[10, 10, 0, 0]} barSize={60}>
                               {cycleChartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-8 rounded-[3rem] border border-slate-50 text-center space-y-2 group hover:border-indigo-100 transition-all">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Collection (DSO)</div>
                      <div className="text-3xl font-mono font-black text-indigo-900">{Math.round(intel.cashCycle.dso)}d</div>
                      <p className="text-[8px] text-indigo-400 font-bold uppercase">Time to receive cash</p>
                   </div>
                   <div className="bg-white p-8 rounded-[3rem] border border-slate-50 text-center space-y-2 group hover:border-indigo-100 transition-all">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inventory (DSI)</div>
                      <div className="text-3xl font-mono font-black text-indigo-900">{Math.round(intel.cashCycle.dsi)}d</div>
                      <p className="text-[8px] text-indigo-400 font-bold uppercase">Time to sell stock</p>
                   </div>
                   <div className="bg-white p-8 rounded-[3rem] border border-slate-50 text-center space-y-2 group hover:border-amber-100 transition-all">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payables (DPO)</div>
                      <div className="text-3xl font-mono font-black text-amber-600">{Math.round(intel.cashCycle.dpo)}d</div>
                      <p className="text-[8px] text-amber-500 font-bold uppercase">Time to pay suppliers</p>
                   </div>
                </div>
             </div>
           )}

           {activeCategory === 'Reserves' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                <div className="p-10 rounded-[3rem] border border-emerald-100 bg-emerald-50/30">
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-emerald-600">Expansion Reserves (10%)</div>
                   <div className="text-5xl font-mono font-black text-emerald-700">{currency.format(intel.reserves.totalSavings)}</div>
                </div>
                <div className="p-10 rounded-[3rem] border border-slate-100 bg-white shadow-sm flex flex-col justify-center">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-4">Cash Position Post-Reserve</div>
                   <div className="text-3xl font-mono font-black text-slate-900">{currency.format(intel.reserves.availableCashAfterSavings)}</div>
                </div>
             </div>
           )}
        </main>

        <aside className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[450px] border border-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
              <div className="relative z-10 space-y-8">
                 <div>
                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Efficiency Benchmarking</h4>
                    <div className="space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400 font-bold uppercase">Industrial Target</span>
                          <span className="font-mono font-black text-emerald-400">14 Days</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400 font-bold uppercase">Your Velocity</span>
                          <span className={`font-mono font-black ${intel.cashCycle.ccc < 20 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {Math.round(intel.cashCycle.ccc)} Days
                          </span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <h5 className="text-[9px] font-black text-indigo-300 uppercase mb-3">Neural Advice</h5>
                    <p className="text-xs text-indigo-100 italic leading-relaxed">
                       {intel.cashCycle.ccc > 30 ? 
                        "High CCC detected. Your capital is stagnant. Accelerate collections from corporate clients (DSO) or negotiate longer credit terms with flour suppliers (DPO)." :
                        "Excellent capital velocity. Your business is generating cash faster than it is consuming it, allowing for aggressive reinvestment."
                       }
                    </p>
                 </div>
              </div>
              <button className="relative z-10 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all">Optimize Flow Velocity</button>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default RatioAnalysis;
