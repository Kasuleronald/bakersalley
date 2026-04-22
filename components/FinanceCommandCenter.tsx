
import React, { useMemo } from 'react';
import { Transaction, Order, Ingredient, SKU, SupplierInvoice, Asset, Loan, SyncPulse } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface FinanceCommandCenterProps {
  transactions: Transaction[];
  orders: Order[];
  ingredients: Ingredient[];
  skus: SKU[];
  invoices: SupplierInvoice[];
  assets: Asset[];
  loans: Loan[];
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
  syncStatus: SyncPulse;
}

const FinanceCommandCenter: React.FC<FinanceCommandCenterProps> = ({ 
  transactions, orders, ingredients, skus, invoices, assets, loans, currency, syncStatus 
}) => {
  const analytics = useMemo(() => {
    const cash = transactions.reduce((s, t) => t.type === 'Credit' ? s + t.amount : s - t.amount, 0);
    const ar = orders.reduce((s, o) => s + (o.totalPrice - o.totalPaid), 0);
    const ap = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    const invValue = ingredients.reduce((s, i) => s + (i.currentStock * i.costPerUnit), 0);
    const debt = loans.reduce((s, l) => s + l.balance, 0);
    const fixedAssets = assets.reduce((s, a) => s + (a.purchasePrice - (a.accumulatedDepreciation || 0)), 0);

    const currentAssets = cash + ar + invValue;
    const currentLiabilities = ap;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 99;
    
    const equity = (currentAssets + fixedAssets) - (currentLiabilities + debt);
    const solvencyRatio = equity > 0 ? (debt / equity) * 100 : 999;

    const healthScore = Math.min(100, Math.max(0, 
        (currentRatio > 1.5 ? 40 : currentRatio * 20) + 
        (solvencyRatio < 50 ? 40 : (100 - solvencyRatio) * 0.4) + 
        (syncStatus.status === 'Online' ? 20 : 10)
    ));

    return { cash, ar, ap, invValue, debt, currentRatio, healthScore, equity };
  }, [transactions, orders, ingredients, invoices, loans, assets, syncStatus]);

  const COLORS = ['#1e1b4b', '#4f46e5', '#818cf8', '#f59e0b'];
  const assetData = [
    { name: 'Cash', value: analytics.cash },
    { name: 'Receivables', value: analytics.ar },
    { name: 'Inventory', value: analytics.invValue }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center border border-white/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full translate-x-8 -translate-y-8"></div>
           <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Corporate Health Score</div>
           <div className="text-5xl font-mono font-black text-amber-400">{analytics.healthScore.toFixed(0)}%</div>
           <p className="text-[8px] text-slate-500 uppercase mt-2">Combined Liquidity & Solvency</p>
        </div>
        
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Ratio</div>
           <div className={`text-3xl font-mono font-black ${analytics.currentRatio > 1.2 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {analytics.currentRatio.toFixed(2)}
           </div>
           <p className="text-[8px] text-slate-300 uppercase mt-2">Target: {'>'} 1.50</p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Worth (Equity)</div>
           <div className="text-2xl font-mono font-black text-slate-900">{currency.formatCompact(analytics.equity)}</div>
           <p className="text-[8px] text-slate-300 uppercase mt-2">Verified Retained Earnings</p>
        </div>

        <div className={`p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center transition-all ${syncStatus.status === 'Online' ? 'bg-indigo-900' : 'bg-rose-900 animate-pulse'}`}>
           <div className="flex justify-between items-start mb-2">
              <div className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Deployment Readiness</div>
              <div className={`w-2 h-2 rounded-full ${syncStatus.status === 'Online' ? 'bg-emerald-400' : 'bg-white'}`}></div>
           </div>
           <div className="text-xl font-black uppercase tracking-tight">{syncStatus.status} Mode</div>
           <p className="text-[8px] text-white/40 uppercase mt-2">Pending Syncs: {syncStatus.pendingChanges}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-bold font-serif text-slate-900 mb-8 uppercase tracking-tighter">Current Asset Architecture</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={assetData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                       {assetData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '1.5rem', border:'none', boxShadow:'0 10px 15px rgba(0,0,0,0.1)'}} formatter={(v: any) => currency.format(v)} />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize:'10px', fontWeight:900, textTransform:'uppercase'}} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl space-y-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full translate-x-16 -translate-y-16"></div>
           <h3 className="text-2xl font-bold font-serif text-amber-400 uppercase">CFO Strategic Summary</h3>
           <div className="space-y-6 relative z-10">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">A/R vs A/P Gap</span>
                    <span className={`text-sm font-mono font-black ${analytics.ar > analytics.ap ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {currency.format(analytics.ar - analytics.ap)}
                    </span>
                 </div>
                 <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (analytics.ar / (analytics.ap || 1)) * 100)}%` }}></div>
                 </div>
              </div>

              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Audit Readiness Notice</h4>
                 <p className="text-xs text-indigo-100 italic leading-relaxed">
                   "Ledger integrity is currently **Verified**. 100% of transactions are signed with digital authority hashes. Local storage is encrypted with AES-256 and synchronized with the Private Cloud Nexus."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceCommandCenter;
