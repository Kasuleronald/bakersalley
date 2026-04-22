import React, { useState, useMemo } from 'react';
import { Order, Customer, SKU, Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { downloadCSV } from '../utils/exportUtils';
import ModuleAiInteraction from './ModuleAiInteraction';
import { GoogleGenAI } from "@google/genai";

interface DebtManagerProps {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  customers: Customer[];
  skus: SKU[];
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

const DebtManager: React.FC<DebtManagerProps> = ({ orders, setOrders, customers, skus, transactions, setTransactions, currency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiCollectionStrategy, setAiCollectionStrategy] = useState<string | null>(null);
  
  // Manual Entry State
  const [manualEntry, setManualEntry] = useState({
    customerId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    ref: ''
  });

  const handleAddManualDebt = () => {
    if (!manualEntry.customerId || manualEntry.amount <= 0 || !manualEntry.date) {
      alert("Please fill all required fields: Customer, Amount, and Date.");
      return;
    }

    const newOrder: Order = {
      id: `hist-ord-${Date.now()}`,
      invoiceNumber: manualEntry.ref || `HIST-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: manualEntry.customerId,
      items: [], 
      totalPrice: manualEntry.amount,
      totalPaid: 0,
      status: 'Pending',
      approvalStatus: 'Approved',
      date: manualEntry.date,
      notes: 'Historical Opening Balance / Legacy Debt',
      productionLogged: false,
      submittedToAdmin: true
    };

    setOrders([newOrder, ...orders]);
    setShowManualForm(false);
    setManualEntry({ customerId: '', amount: 0, date: new Date().toISOString().split('T')[0], ref: '' });
  };

  const agingAnalysis = useMemo(() => {
    const now = new Date();
    const buckets = [
      { label: 'Current (0-30d)', amount: 0, count: 0, color: '#10b981' },
      { label: '31-60 Days', amount: 0, count: 0, color: '#f59e0b' },
      { label: '61-90 Days', amount: 0, count: 0, color: '#ef4444' },
      { label: '91+ Days Overdue', amount: 0, count: 0, color: '#7f1d1d' },
    ];

    orders.forEach(order => {
      const balance = order.totalPrice - order.totalPaid;
      if (balance <= 0 || order.status === 'Cancelled') return;

      const orderDate = new Date(order.date);
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        buckets[0].amount += balance;
        buckets[0].count++;
      } else if (diffDays <= 60) {
        buckets[1].amount += balance;
        buckets[1].count++;
      } else if (diffDays <= 90) {
        buckets[2].amount += balance;
        buckets[2].count++;
      } else {
        buckets[3].amount += balance;
        buckets[3].count++;
      }
    });

    return buckets;
  }, [orders]);

  const debtorLedger = useMemo(() => {
    const map: Record<string, { customer: Customer; balance: number; oldestInvoiceDate: string; riskScore: number }> = {};
    
    orders.forEach(o => {
      const bal = o.totalPrice - o.totalPaid;
      if (bal <= 0 || o.status === 'Cancelled') return;
      
      if (!map[o.customerId]) {
        const cust = customers.find(c => c.id === o.customerId);
        if (!cust) return;
        map[o.customerId] = { customer: cust, balance: 0, oldestInvoiceDate: o.date, riskScore: 0 };
      }
      
      map[o.customerId].balance += bal;
      if (new Date(o.date) < new Date(map[o.customerId].oldestInvoiceDate)) {
        map[o.customerId].oldestInvoiceDate = o.date;
      }
    });

    return Object.values(map).map(entry => {
      const age = Math.ceil((Date.now() - new Date(entry.oldestInvoiceDate).getTime()) / (1000 * 3600 * 24));
      // Risk Score: (Balance / 1M) * (Age / 30)
      const riskScore = Math.min(100, Math.round((entry.balance / 1000000) * (age / 30) * 10));
      return { ...entry, age, riskScore };
    }).sort((a, b) => b.balance - a.balance);
  }, [orders, customers]);

  const handleRunCollectionAudit = async (intent: string) => {
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as a Credit Controller for an industrial bakery.
        DEBTOR DATA: ${JSON.stringify(debtorLedger.slice(0, 10).map(d => ({ name: d.customer.name, bal: d.balance, age: d.age, risk: d.riskScore })))}
        AGING BUCKETS: ${JSON.stringify(agingAnalysis)}
        
        USER INTENT: "${intent || 'Minimize DSO (Days Sales Outstanding)'}"
        
        TASK:
        1. Analyze the current aging profile.
        2. Identify the top 3 critical collection targets.
        3. Draft a sample collection script for the highest risk debtor.
        Professional, firm, but partnership-focused tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiCollectionStrategy(response.text || "Audit complete. No critical risks found.");
    } catch (e) {
      setAiCollectionStrategy("Neural synthesis failed. Verify connection.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handlePostEclProvision = () => {
    const criticalDebt = agingAnalysis[3].amount;
    const suggestedProvision = criticalDebt * 0.50; 
    if (suggestedProvision <= 0) return;
    
    const txs: Transaction[] = [
      {
        id: `ecl-${Date.now()}-dr`,
        date: new Date().toISOString(),
        account: 'Bad Debt Provision',
        type: 'Debit',
        amount: suggestedProvision,
        description: 'Monthly ECL Provision (IFRS 9 Audit)',
        category: 'Journal'
      },
      {
        id: `ecl-${Date.now()}-cr`,
        date: new Date().toISOString(),
        account: 'Accounts Receivable',
        type: 'Credit',
        amount: suggestedProvision,
        description: 'Monthly ECL Provision (Counter-Asset Adjustment)',
        category: 'Journal'
      }
    ];

    setTransactions([...txs, ...transactions]);
    alert(`ECL Provision of ${currency.format(suggestedProvision)} journalized.`);
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 font-serif uppercase tracking-tight">Debtors Registry</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Aged Receivables • ECL Provisioning • Collection Intelligence</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={() => setShowManualForm(!showManualForm)}
            className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-slate-200 hover:bg-slate-200 transition-all"
           >
             {showManualForm ? 'Close Intake' : '+ Record Legacy Debt'}
           </button>
           <button 
            onClick={handlePostEclProvision}
            className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all"
           >
             🧠 Post ECL Provision
           </button>
        </div>
      </header>

      {showManualForm && (
        <div className="bg-amber-50 p-10 rounded-[3rem] border-2 border-amber-200 shadow-2xl animate-softFade space-y-8">
           <h3 className="text-xl font-bold text-amber-900 font-serif uppercase">Historical Balance Intake</h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-[10px] font-black text-amber-600 uppercase mb-2">1. Debtor Entity</label>
                <select className="w-full p-4 bg-white border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" value={manualEntry.customerId} onChange={e => setManualEntry({...manualEntry, customerId: e.target.value})}>
                  <option value="">Select Partner...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-amber-600 uppercase mb-2">2. Opening Magnitude</label>
                <input type="number" className="w-full p-4 bg-white border-none rounded-2xl font-mono font-black text-lg outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" value={manualEntry.amount || ''} onChange={e => setManualEntry({...manualEntry, amount: parseFloat(e.target.value) || 0})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-amber-600 uppercase mb-2">3. Effective Date</label>
                <input type="date" className="w-full p-4 bg-white border-none rounded-2xl font-bold text-sm" value={manualEntry.date} onChange={e => setManualEntry({...manualEntry, date: e.target.value})} />
              </div>
              <button onClick={handleAddManualDebt} className="w-full py-4 bg-amber-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Archive Balance</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-bold font-serif text-slate-900 mb-10 uppercase tracking-tighter">A/R Aging Distribution</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={agingAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={v => currency.formatCompact(v)} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="amount" radius={[10, 10, 0, 0]} barSize={60}>
                       {agingAnalysis.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10"></div>
              <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest relative z-10">Asset Quality Audit</h4>
              <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400 font-bold uppercase">Critical Debt ({'>'}91d)</span>
                    <span className="font-mono font-black text-rose-500">{currency.format(agingAnalysis[3].amount)}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400 font-bold uppercase">Target Provision</span>
                    <span className="font-mono font-black text-amber-400">{currency.format(agingAnalysis[3].amount * 0.5)}</span>
                 </div>
                 <p className="text-[10px] text-indigo-200 italic leading-relaxed pt-4">
                    "Under IFRS 9, bad-debt provisions should reflect Expected Credit Losses. Maintaining a 50% provision on 90+ day debt prevents Balance Sheet inflation."
                 </p>
              </div>
           </div>
        </div>
      </div>

      <ModuleAiInteraction 
        title="Collection Intelligence Audit"
        theme="indigo"
        isLoading={isAiProcessing}
        onExecute={handleRunCollectionAudit}
        suggestions={[
          "Analyze high-risk corporate accounts",
          "Draft friendly reminders for 31-60d bucket",
          "Identify seasonal payment patterns",
          "Optimize collection staff allocation"
        ]}
        response={aiCollectionStrategy}
      />

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="px-10 py-8 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Detailed Debtor Ledger</h3>
            <button onClick={() => downloadCSV(debtorLedger, 'debtor_ledger')} className="text-[10px] font-black text-indigo-600 uppercase border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all">Export CSV</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                     <th className="px-10 py-6">Customer Entity</th>
                     <th className="px-6 py-6 text-center">Oldest Invoice</th>
                     <th className="px-6 py-6 text-center">Age (Days)</th>
                     <th className="px-6 py-6 text-center">Risk Score</th>
                     <th className="px-10 py-6 text-right">Outstanding Balance</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {debtorLedger.map(item => (
                    <tr key={item.customer.id} className="hover:bg-slate-50/50 transition-all group">
                       <td className="px-10 py-5">
                          <div className="font-bold text-slate-900 text-sm uppercase">{item.customer.name}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase">{item.customer.type}</div>
                       </td>
                       <td className="px-6 py-5 text-center text-[10px] font-mono font-bold text-slate-500">
                          {new Date(item.oldestInvoiceDate).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <span className={`text-xs font-mono font-black ${item.age > 60 ? 'text-rose-600' : item.age > 30 ? 'text-amber-600' : 'text-slate-400'}`}>
                             {item.age}d
                          </span>
                       </td>
                       <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${item.riskScore > 70 ? 'bg-rose-600' : item.riskScore > 30 ? 'bg-amber-500' : 'bg-indigo-400'}`} style={{ width: `${item.riskScore}%` }}></div>
                             </div>
                             <span className="text-[10px] font-mono font-bold text-slate-400">{item.riskScore}%</span>
                          </div>
                       </td>
                       <td className="px-10 py-5 text-right font-mono font-black text-slate-900">
                          {currency.format(item.balance)}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {debtorLedger.length === 0 && (
               <div className="py-24 text-center opacity-20 grayscale">
                  <div className="text-8xl mb-6">📑</div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400">Ledger Zero: No Outstanding Debtors Detected</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default DebtManager;