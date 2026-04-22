
import React, { useState, useMemo } from 'react';
import { Transaction, Order, Customer, SupplierInvoice, Overhead, Employee, SKU, Sale, AccountType } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Bar, Cell, BarChart, Legend } from 'recharts';
import { generateCashStrategy, analyzeHistoricalCashFlow } from '../services/geminiService';
import ModuleAiInteraction from './ModuleAiInteraction';

interface CashFlowHubProps {
  transactions: Transaction[];
  orders: Order[];
  customers: Customer[];
  invoices: SupplierInvoice[];
  overheads: Overhead[];
  employees: Employee[];
  sales: Sale[];
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
}

export const CashFlowHub: React.FC<CashFlowHubProps> = ({ 
  transactions, orders, customers, invoices, overheads, employees, sales, currency 
}) => {
  const [activeView, setActiveView] = useState<'Forecast' | 'Statement' | 'Historical'>('Forecast');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [historicalAiReport, setHistoricalAiReport] = useState<any>(null);
  const [staggeredInvoices, setStaggeredInvoices] = useState<string[]>([]);
  const [salesStressFactor, setSalesStressFactor] = useState(100);

  const metrics = useMemo(() => {
    const cash = transactions.reduce((s, t) => t.type === 'Credit' ? s + t.amount : s - t.amount, 0);
    const receivables = orders.reduce((s, o) => o.status !== 'Completed' ? s + (o.totalPrice - o.totalPaid) : s, 0);
    
    const activeInvoices = invoices.filter(i => i.status !== 'Paid').map(inv => {
      const isStaggered = staggeredInvoices.includes(inv.id);
      const dueDate = new Date(inv.dueDate);
      if (isStaggered) dueDate.setDate(dueDate.getDate() + 10);
      return { ...inv, effectiveDueDate: dueDate, isStaggered };
    });

    const payables = activeInvoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    const netPosition = cash + receivables - payables;

    const totalRev = sales.reduce((s, x) => s + x.totalPrice, 0);
    const growthReserve = totalRev * 0.10;
    const usableLiquidity = cash - growthReserve;

    const monthlyFixed = overheads.reduce((s, o) => s + (o.period === 'Monthly' ? o.amount : o.amount * 4.33), 0);
    const monthlyLabor = employees.reduce((s, e) => s + (e.employmentType === 'Permanent' ? e.salary : (e.dailyRate || 0) * 26), 0);
    const dailyBurn = (monthlyFixed + monthlyLabor) / 30;

    const avgDailySales = (sales.slice(0, 30).reduce((s, x) => s + x.totalPrice, 0) / 30) * (salesStressFactor / 100);
    
    let hasInsolvencyRisk = false;
    const forecastData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const cumulativeSales = avgDailySales * i;
      const dueToday = activeInvoices
        .filter(inv => inv.effectiveDueDate.toISOString().split('T')[0] === dateStr)
        .reduce((s, x) => s + (x.totalAmount - x.paidAmount), 0);

      const projectedBalance = usableLiquidity + cumulativeSales - dueToday;
      if (projectedBalance < 0) hasInsolvencyRisk = true;

      return {
        day: i === 0 ? 'Today' : i === 29 ? 'Day 30' : `D+${i}`,
        balance: projectedBalance,
        isNegative: projectedBalance < 0
      };
    });

    const runway = dailyBurn > 0 ? usableLiquidity / dailyBurn : 999;

    // Statement Logic: Categorize transactions
    const statement = {
      operating: transactions.filter(t => t.category === 'Sale' || t.category === 'Expense' || t.category === 'Credit Note'),
      investing: transactions.filter(t => t.account === 'Fixed Assets' || t.description.toLowerCase().includes('purchase') || t.description.toLowerCase().includes('equipment')),
      financing: transactions.filter(t => t.description.toLowerCase().includes('loan') || t.description.toLowerCase().includes('equity') || t.description.toLowerCase().includes('drawings')),
    };

    const getNet = (list: Transaction[]) => list.reduce((s, t) => t.type === 'Credit' ? s + t.amount : s - t.amount, 0);

    // 6-Month Historical Derivation
    const historyData = Array.from({ length: 6 }, (_, i) => {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - (5 - i));
      const monthLabel = monthDate.toLocaleString('default', { month: 'short' });
      
      const monthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
      });

      const inflow = monthTxs.filter(t => t.type === 'Credit').reduce((s, x) => s + x.amount, 0);
      const outflow = monthTxs.filter(t => t.type === 'Debit').reduce((s, x) => s + x.amount, 0);
      
      return {
        month: monthLabel,
        inflow,
        outflow,
        net: inflow - outflow
      };
    });

    return { 
      cash, receivables, payables, netPosition, dailyBurn, runway, 
      growthReserve, usableLiquidity, forecastData, activeInvoices,
      hasInsolvencyRisk, avgDailySales, statement, historyData,
      netOps: getNet(statement.operating),
      netInv: getNet(statement.investing),
      netFin: getNet(statement.financing)
    };
  }, [transactions, orders, invoices, overheads, employees, sales, staggeredInvoices, salesStressFactor]);

  const handleRunAiAudit = async () => {
    setIsAiLoading(true);
    const result = await generateCashStrategy(metrics, orders, invoices);
    setAiInsight(result);
    setIsAiLoading(false);
  };

  const handleRunHistoricalAudit = async (intent: string) => {
    setIsAiLoading(true);
    const result = await analyzeHistoricalCashFlow({
      monthlyData: metrics.historyData,
      currentNet: metrics.netPosition,
      unpaidInvoicesValue: metrics.payables,
      receivablesValue: metrics.receivables
    });
    if (result) setHistoricalAiReport(result);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
           <button onClick={() => setActiveView('Forecast')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeView === 'Forecast' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>30-Day Forecast</button>
           <button onClick={() => setActiveView('Historical')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeView === 'Historical' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}>Historical Audit 📊</button>
           <button onClick={() => setActiveView('Statement')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeView === 'Statement' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Statement</button>
        </div>
        <button 
          onClick={handleRunAiAudit}
          disabled={isAiLoading}
          className="bg-indigo-900 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all"
        >
          {isAiLoading ? 'Analyzing...' : '🧠 AI Strategy'}
        </button>
      </header>

      {activeView === 'Historical' && (
        <div className="space-y-10 animate-fadeIn">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-center mb-10">
                    <div>
                       <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase tracking-tighter">6-Month Cash Flow Trend</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Comparing Capital Velocity vs. Spend</p>
                    </div>
                 </div>
                 <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={metrics.historyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={v => `U${v/1000}k`} tick={{fontSize: 10, fill: '#cbd5e1'}} />
                          <Tooltip contentStyle={{borderRadius: '1rem', border:'none', boxShadow:'0 10px 15px rgba(0,0,0,0.1)'}} />
                          <Legend verticalAlign="top" align="right" height={36}/>
                          <Bar name="Cash Inflow" dataKey="inflow" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                          <Bar name="Cash Outflow" dataKey="outflow" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={40} />
                          <Line name="Net Monthly" type="monotone" dataKey="net" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} />
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-full border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-16 -translate-y-16"></div>
                    <div className="relative z-10 space-y-6">
                       <div className="text-center">
                          <div className="text-6xl mb-6">🧠</div>
                          <h4 className="text-xl font-bold font-serif text-amber-400 mb-2 uppercase">Neural Historical Audit</h4>
                          <p className="text-xs text-indigo-100/70 italic leading-relaxed">
                            Let the AI identify the primary drivers of your 6-month capital cycles and suggest working capital optimizations.
                          </p>
                       </div>
                       <button 
                        onClick={() => handleRunHistoricalAudit("Analyze last 6 months trend")}
                        disabled={isAiLoading}
                        className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all ${isAiLoading ? 'bg-indigo-100 text-slate-400 animate-pulse' : 'bg-white text-slate-900 hover:bg-amber-400'}`}
                       >
                          {isAiLoading ? 'Auditing 180 Days...' : 'Perform CFO Review'}
                       </button>
                    </div>
                    {historicalAiReport && (
                      <div className="relative z-10 pt-10 border-t border-white/10 text-center">
                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Financial Health Score</span>
                         <div className={`text-6xl font-mono font-black ${historicalAiReport.healthScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{historicalAiReport.healthScore}%</div>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {historicalAiReport && (
              <div className="space-y-8 animate-softFade">
                 <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Identified Cash Drivers</h4>
                          <div className="space-y-4">
                             <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                                <span className="text-[8px] font-black text-emerald-600 uppercase block mb-2">Inflow Dominance</span>
                                <ul className="space-y-2">
                                   {historicalAiReport.inflowDrivers.map((d: string, i: number) => (
                                     <li key={i} className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {d}
                                     </li>
                                   ))}
                                </ul>
                             </div>
                             <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                                <span className="text-[8px] font-black text-rose-600 uppercase block mb-2">Outflow Dominance</span>
                                <ul className="space-y-2">
                                   {historicalAiReport.outflowDrivers.map((d: string, i: number) => (
                                     <li key={i} className="text-xs font-bold text-rose-900 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> {d}
                                     </li>
                                   ))}
                                </ul>
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2">Working Capital Strategy</h4>
                          <div className="space-y-4">
                             {historicalAiReport.capitalOptimizations.map((opt: any, i: number) => (
                               <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-300 transition-all">
                                  <div className="flex justify-between items-center mb-2">
                                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{opt.action}</span>
                                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${opt.impact === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{opt.impact} Impact</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 italic leading-relaxed">"{opt.logic}"</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="p-10 bg-indigo-900 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 left-0 p-4 opacity-5 text-9xl font-black italic pointer-events-none">CFO</div>
                       <h5 className="text-amber-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Executive Auditor Verdict</h5>
                       <p className="text-lg italic font-medium leading-relaxed relative z-10">"{historicalAiReport.executiveVerdict}"</p>
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}

      {activeView === 'Forecast' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-all"></div>
               <div className="relative">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Fortress Reserves</div>
                  <div className="text-3xl font-mono font-black text-emerald-400">{currency.formatCompact(metrics.growthReserve)}</div>
                  <p className="text-[8px] text-slate-500 mt-2 font-bold uppercase italic">Locked Expansion Capital</p>
               </div>
            </div>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="relative">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Usable Liquidity</div>
                  <div className="text-3xl font-mono font-black text-slate-900">{currency.formatCompact(metrics.usableLiquidity)}</div>
                  <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (metrics.usableLiquidity / metrics.cash) * 100)}%` }}></div>
                  </div>
               </div>
            </div>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fixed Monthly Burden</div>
               <div className="text-3xl font-mono font-black text-amber-600">{currency.formatCompact(metrics.dailyBurn * 30)}</div>
               <p className="text-[8px] text-slate-300 font-black uppercase mt-2">Salaries + Fixed Utilities</p>
            </div>
            <div className={`p-8 rounded-[3rem] text-white shadow-2xl flex flex-col justify-center text-center transition-all ${metrics.runway < 7 ? 'bg-rose-600 animate-pulse' : 'bg-slate-900'}`}>
               <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Survival Runway</div>
               <div className="text-5xl font-mono font-black">{Math.floor(metrics.runway)}</div>
               <p className="text-[9px] font-bold uppercase mt-2">Days of Operating Cash</p>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
             <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 mb-10">
                <div className="flex-1">
                   <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase tracking-tighter">Liquidity Projection</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Stressed at {salesStressFactor}% Market Velocity</p>
                </div>
                <div className="w-full xl:w-[350px] space-y-4">
                   <input 
                    type="range" min="0" max="200" step="10" 
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                    value={salesStressFactor} 
                    onChange={e => setSalesStressFactor(parseInt(e.target.value))} 
                   />
                </div>
             </div>
             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={metrics.forecastData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" hide />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={v => `U${v/1000}k`} tick={{fontSize: 10, fill: '#cbd5e1'}} />
                      <Tooltip formatter={(v: any) => [currency.format(v), 'Projected Balance']} contentStyle={{borderRadius: '1rem', border:'none'}} />
                      <Area type="monotone" dataKey="balance" fill={metrics.hasInsolvencyRisk ? "#fee2e2" : "#e0e7ff"} stroke={metrics.hasInsolvencyRisk ? "#ef4444" : "#4f46e5"} strokeWidth={4} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </>
      )}

      {activeView === 'Statement' && (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm animate-fadeIn">
           <div className="flex justify-between items-end border-b border-slate-50 pb-8 mb-10">
              <div>
                 <h3 className="text-3xl font-bold font-serif text-slate-900 uppercase tracking-tighter">Cash Flow Statement</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase mt-1">Lifecycle Movement of Liquid Capital</p>
              </div>
              <div className="text-right">
                 <span className="text-[10px] font-black text-slate-400 uppercase block">Net Position Change</span>
                 <div className={`text-2xl font-mono font-black ${metrics.netOps + metrics.netInv + metrics.netFin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currency.format(metrics.netOps + metrics.netInv + metrics.netFin)}
                 </div>
              </div>
           </div>

           <div className="space-y-12">
              {/* OPERATING ACTIVITIES */}
              <section className="space-y-6">
                 <div className="flex justify-between items-center border-b border-indigo-50 pb-2">
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">1. Cash from Operating Activities</h4>
                    <span className={`text-sm font-mono font-bold ${metrics.netOps >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currency.format(metrics.netOps)}</span>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium text-slate-600 px-4">
                       <span>Revenue from Sales (POS & Invoiced)</span>
                       <span className="font-mono text-emerald-600">+{currency.format(metrics.statement.operating.filter(t=>t.type==='Credit').reduce((s,t)=>s+t.amount,0))}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 px-4">
                       <span>Payments to Suppliers & Staff</span>
                       <span className="font-mono text-rose-600">-{currency.format(metrics.statement.operating.filter(t=>t.type==='Debit').reduce((s,t)=>s+t.amount,0))}</span>
                    </div>
                 </div>
              </section>

              {/* INVESTING ACTIVITIES */}
              <section className="space-y-6">
                 <div className="flex justify-between items-center border-b border-amber-50 pb-2">
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">2. Cash from Investing Activities</h4>
                    <span className={`text-sm font-mono font-bold ${metrics.netInv >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currency.format(metrics.netInv)}</span>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium text-slate-600 px-4">
                       <span>Capital Asset Acquisitions (Machinery/Vehicles)</span>
                       <span className="font-mono text-rose-600">{currency.format(metrics.netInv)}</span>
                    </div>
                 </div>
              </section>

              {/* FINANCING ACTIVITIES */}
              <section className="space-y-6">
                 <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                    <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">3. Cash from Financing Activities</h4>
                    <span className={`text-sm font-mono font-bold ${metrics.netFin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currency.format(metrics.netFin)}</span>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium text-slate-600 px-4">
                       <span>Loan Injections / Repayments</span>
                       <span className={`font-mono ${metrics.netFin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currency.format(metrics.netFin)}</span>
                    </div>
                 </div>
              </section>

              <div className="pt-8 border-t-4 border-slate-900 flex justify-between items-center bg-slate-900 p-8 rounded-[2rem] text-white">
                 <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Final Ledger Closing</span>
                    <h4 className="text-lg font-bold font-serif">Net Cash Position</h4>
                 </div>
                 <div className="text-4xl font-mono font-black">
                    {currency.format(metrics.cash)}
                 </div>
              </div>
           </div>
        </div>
      )}

      {aiInsight && (
        <div className="p-10 bg-indigo-900 text-white rounded-[3.5rem] shadow-2xl animate-softFade">
           <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4">Neural Strategy Recommendation</h4>
           <p className="text-lg italic font-medium leading-relaxed">"{aiInsight}"</p>
        </div>
      )}
    </div>
  );
};
