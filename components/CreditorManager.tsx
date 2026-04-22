import React, { useState, useMemo } from 'react';
import { SupplierInvoice, Transaction, AccountType, Loan, Supplier } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// Added missing import for downloadCSV
import { downloadCSV } from '../utils/exportUtils';

interface CreditorManagerProps {
  invoices: SupplierInvoice[];
  setInvoices: (invs: SupplierInvoice[]) => void;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  suppliers?: Supplier[];
  currency: { active: any, format: (v: number) => string; formatCompact: (v: number) => string };
}

const CreditorManager: React.FC<CreditorManagerProps> = ({ invoices, setInvoices, transactions, setTransactions, loans, setLoans, suppliers = [], currency }) => {
  const [activeTab, setActiveTab] = useState<'Invoices' | 'Loans' | 'Strategy' | 'Aging'>('Strategy');
  const [strategy, setStrategy] = useState<'Snowball' | 'Avalanche'>('Snowball');
  const [showLoanForm, setShowLoanForm] = useState(false);

  const [newLoan, setNewLoan] = useState<Partial<Loan>>({
    source: '', principal: 0, balance: 0, interestRate: 15, term: 'Long-term', startDate: new Date().toISOString().split('T')[0]
  });

  const handleAddLoan = () => {
    if (!newLoan.source || !newLoan.principal) return;
    const loan: Loan = {
      ...newLoan as Loan,
      id: `loan-${Date.now()}`
    };
    setLoans([...loans, loan]);
    setShowLoanForm(false);
    setNewLoan({ source: '', principal: 0, balance: 0, interestRate: 15, term: 'Long-term', startDate: new Date().toISOString().split('T')[0] });
  };

  const prioritizedLiabilities = useMemo(() => {
    const vendorBalances: Record<string, { 
      name: string, 
      balance: number, 
      type: 'Supplier' | 'Loan', 
      rate: number, 
      rating: number 
    }> = {};
    
    invoices.filter(inv => inv.status !== 'Paid').forEach(inv => {
      if (!vendorBalances[inv.supplierName]) {
        const supplier = suppliers.find(s => s.name === inv.supplierName);
        vendorBalances[inv.supplierName] = { 
          name: inv.supplierName, 
          balance: 0, 
          type: 'Supplier', 
          rate: inv.interestRate || 0,
          rating: supplier?.rating || 0
        };
      }
      vendorBalances[inv.supplierName].balance += (inv.totalAmount - inv.paidAmount);
    });

    const allLiabilities = [
      ...Object.values(vendorBalances),
      ...loans.map(l => ({ 
        name: l.source, 
        balance: l.balance, 
        type: 'Loan' as const, 
        rate: l.interestRate,
        rating: 5 
      }))
    ].filter(l => l.balance > 0);

    if (strategy === 'Snowball') return allLiabilities.sort((a, b) => a.balance - b.balance);
    return allLiabilities.sort((a, b) => b.rate - a.rate);
  }, [invoices, loans, strategy, suppliers]);

  const agingAnalysis = useMemo(() => {
    const now = new Date();
    const buckets = [
      { label: '0-30 Days', amount: 0, color: '#10b981' },
      { label: '31-60 Days', amount: 0, color: '#f59e0b' },
      { label: '61-90 Days', amount: 0, color: '#ef4444' },
      { label: '91+ Overdue', amount: 0, color: '#7f1d1d' },
    ];

    invoices.filter(i => i.status !== 'Paid').forEach(inv => {
      const balance = inv.totalAmount - inv.paidAmount;
      const dueDate = new Date(inv.dueDate);
      const diffTime = Math.abs(now.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) buckets[0].amount += balance;
      else if (diffDays <= 60) buckets[1].amount += balance;
      else if (diffDays <= 90) buckets[2].amount += balance;
      else buckets[3].amount += balance;
    });

    return buckets;
  }, [invoices]);

  const totalLiability = useMemo(() => prioritizedLiabilities.reduce((s, x) => s + x.balance, 0), [prioritizedLiabilities]);

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter text-rose-400">Creditors Control</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">A/P Aging • Staggered Payables • Debt Elimination Logic</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
           {[
             { id: 'Strategy', label: 'Elimination Plan', icon: '🎯' },
             { id: 'Aging', label: 'AP Aging', icon: '📊' },
             { id: 'Invoices', label: 'Invoices', icon: '🧾' },
             { id: 'Loans', label: 'Finance', icon: '🏛️' }
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}>
                <span>{tab.icon}</span> {tab.label}
             </button>
           ))}
        </div>
      </header>

      {activeTab === 'Aging' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
           <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold font-serif text-slate-900 mb-10 uppercase tracking-tighter">Payables Aging Profile</h3>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingAnalysis}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={v => currency.formatCompact(v)} />
                       <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                       <Bar dataKey="amount" radius={[10, 10, 0, 0]} barSize={60}>
                          {agingAnalysis.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
           <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-indigo-100 shadow-sm flex flex-col justify-center text-center space-y-6">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Aggregate Accounts Payable</div>
              <div className="text-4xl font-mono font-black text-slate-900">{currency.formatCompact(totalLiability - loans.reduce((s,l)=>s+l.balance,0))}</div>
              <p className="text-[9px] text-slate-500 font-bold uppercase italic border-t pt-4">Trade Suppliers Only</p>
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                 <h5 className="text-[10px] font-black text-amber-900 uppercase mb-2 tracking-widest">Strategic AP Tip</h5>
                 <p className="text-[11px] text-amber-700 italic leading-relaxed italic">"Maximize 'Free' capital by extending supplier payables as much as the credit rating allows. Prioritize payments to mission-critical flour/yeast vendors."</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Strategy' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-12">
                 <div>
                    <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Elimination Strategy Generator</h3>
                    <p className="text-sm text-slate-400 mt-1">Select an industrial method to accelerate technical solvency.</p>
                 </div>
                 <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                    <button onClick={() => setStrategy('Snowball')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${strategy === 'Snowball' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-400'}`}>Snowball (Build Momentum)</button>
                    <button onClick={() => setStrategy('Avalanche')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${strategy === 'Avalanche' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}>Avalanche (Math Focus)</button>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 <div className="lg:col-span-4 space-y-6">
                    <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Liability Portfolio</div>
                       <div className="text-4xl font-mono font-black text-slate-900">{currency.formatCompact(totalLiability)}</div>
                       <p className="text-[9px] text-indigo-400 font-bold uppercase mt-4">Weighted against classified ledgers</p>
                    </div>
                    <div className="p-8 bg-indigo-950 rounded-[3rem] text-white shadow-xl flex flex-col justify-center">
                       <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Elimination Logic</h4>
                       <p className="text-xs text-indigo-100 leading-relaxed italic">
                          {strategy === 'Snowball' ? 
                            "Snowball priorities the SMALLEST individual balances first. It aims to build psychological momentum by quickly reducing the number of active creditors on the ledger." : 
                            "Avalanche priorities the HIGHEST interest rates first (Loans/Late Fees). It is the mathematically optimal path to minimize the total cost of capital over time."
                          }
                       </p>
                    </div>
                 </div>

                 <div className="lg:col-span-8 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Priority Repayment Queue</h4>
                    <div className="space-y-3">
                       {prioritizedLiabilities.map((item, idx) => (
                         <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:border-indigo-500 transition-all">
                            <div className="flex items-center gap-6">
                               <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300">#{idx+1}</div>
                               <div>
                                  <div className="font-black text-slate-900 text-sm uppercase">{item.name}</div>
                                  <div className="text-[9px] font-black text-indigo-400 uppercase">{item.type} • {item.rate}% Interest Rate</div>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-lg font-mono font-black text-slate-900">{currency.format(item.balance)}</div>
                               <button className="text-[8px] font-black text-indigo-600 uppercase hover:underline">Voucher Entry →</button>
                            </div>
                         </div>
                       ))}
                       {prioritizedLiabilities.length === 0 && (
                          <div className="py-20 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest">No outstanding liabilities detected.</div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Invoices' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
           <div className="px-10 py-8 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Supplier Invoice Journal</h3>
              <button onClick={() => downloadCSV(invoices, 'ap_invoice_log')} className="text-[10px] font-black text-indigo-600 uppercase border border-indigo-100 px-4 py-2 rounded-xl">Export Ledger</button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                       <th className="px-10 py-6">Vendor / Inv #</th>
                       <th className="px-6 py-6 text-center">Due Date</th>
                       <th className="px-6 py-6 text-center">Status</th>
                       <th className="px-6 py-6 text-right">Invoiced Amount</th>
                       <th className="px-10 py-6 text-right">Outstanding Balance</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-all">
                         <td className="px-10 py-5">
                            <div className="font-black text-slate-900 text-sm uppercase">{inv.supplierName}</div>
                            <div className="text-[9px] text-slate-400 font-mono">#{inv.invoiceNumber}</div>
                         </td>
                         <td className="px-6 py-5 text-center text-xs font-bold text-slate-500">
                            {new Date(inv.dueDate).toLocaleDateString()}
                         </td>
                         <td className="px-6 py-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                               {inv.status}
                            </span>
                         </td>
                         <td className="px-6 py-5 text-right font-mono text-xs text-slate-400">{currency.format(inv.totalAmount)}</td>
                         <td className="px-10 py-5 text-right font-mono font-black text-slate-900 text-sm">{currency.format(inv.totalAmount - inv.paidAmount)}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'Loans' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <button onClick={() => setShowLoanForm(true)} className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">+ Enroll Capital Financing</button>
              <div className="text-right">
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Consolidated Loan Balance</span>
                 <span className="text-2xl font-mono font-black text-indigo-900">{currency.format(loans.reduce((s,l)=>s+l.balance, 0))}</span>
              </div>
           </div>

           {showLoanForm && (
             <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-8">
               <h3 className="text-xl font-bold font-serif text-indigo-900 uppercase">Capital Financing Intake</h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Funding Source</label>
                    <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newLoan.source} onChange={e => setNewLoan({...newLoan, source: e.target.value})} placeholder="Bank / Equity Partner" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Repayment Term</label>
                    <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" value={newLoan.term} onChange={e => setNewLoan({...newLoan, term: e.target.value as any})}>
                       <option value="Long-term">Long-Term (Non-Current Liability)</option>
                       <option value="Short-term">Short-Term (Current Liability)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Current Magnitude (UGX)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black text-lg" value={newLoan.balance || ''} onChange={e => setNewLoan({...newLoan, balance: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="flex gap-2">
                     <button onClick={handleAddLoan} className="flex-1 py-4 bg-indigo-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Archive Debt</button>
                     <button onClick={() => setShowLoanForm(false)} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase">Cancel</button>
                  </div>
               </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loans.map(loan => (
                <div key={loan.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all flex flex-col">
                   <div className="flex justify-between items-start mb-6">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${loan.term === 'Short-term' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{loan.term}</span>
                      <button onClick={() => setLoans(loans.filter(l => l.id !== loan.id))} className="text-slate-200 hover:text-rose-500 transition-colors">✕</button>
                   </div>
                   <h4 className="text-xl font-bold font-serif text-slate-900 uppercase truncate mb-1">{loan.source}</h4>
                   <div className="mt-auto pt-6 border-t border-slate-50">
                      <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Principal Balance</div>
                      <div className="text-3xl font-mono font-black text-slate-900">{currency.format(loan.balance)}</div>
                      <p className="text-[8px] text-indigo-400 font-bold uppercase mt-2">Yield Burden: {loan.interestRate}% APR</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default CreditorManager;