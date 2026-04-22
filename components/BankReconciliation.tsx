import React, { useState, useMemo } from 'react';
import { Transaction, AccountType } from '../types';

interface BankReconciliationProps {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  currency: { format: (v: number) => string };
}

const BankReconciliation: React.FC<BankReconciliationProps> = ({ transactions, setTransactions, currency }) => {
  const [selectedAccount, setSelectedAccount] = useState<AccountType>('Bank');
  const [statementBalance, setStatementBalance] = useState(0);

  const accountTransactions = useMemo(() => {
    return transactions.filter(t => t.account === selectedAccount);
  }, [transactions, selectedAccount]);

  const bookBalance = useMemo(() => {
    return accountTransactions.reduce((s, t) => t.type === 'Credit' ? s + t.amount : s - t.amount, 0);
  }, [accountTransactions]);

  const clearedTotal = useMemo(() => {
    return accountTransactions.filter(t => t.isCleared).reduce((s, t) => t.type === 'Credit' ? s + t.amount : s - t.amount, 0);
  }, [accountTransactions]);

  const handleToggleClear = (id: string) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, isCleared: !t.isCleared } : t));
  };

  const variance = statementBalance - clearedTotal;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Ledger Balance</div>
           <div className="text-3xl font-mono font-black text-slate-900">{currency.format(bookBalance)}</div>
           <p className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter">"Book Value" from all system entries</p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-indigo-100 shadow-sm space-y-4">
           <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Physical Statement Balance</div>
           <input 
            type="number" 
            className="text-3xl font-mono font-black text-indigo-900 w-full bg-indigo-50/30 rounded-xl p-2 focus:outline-none"
            value={statementBalance || ''}
            onChange={e => setStatementBalance(parseFloat(e.target.value) || 0)}
            placeholder="Enter balance..."
           />
           <p className="text-[8px] text-indigo-300 font-bold uppercase tracking-tighter">Enter current balance from Bank Portal</p>
        </div>
        <div className={`p-8 rounded-[3rem] shadow-xl flex flex-col justify-center text-center ${Math.abs(variance) < 1 ? 'bg-emerald-600' : 'bg-rose-900'} text-white transition-all`}>
           <div className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Recon Variance</div>
           <div className="text-3xl font-mono font-black">{currency.format(variance)}</div>
           <p className="text-[8px] opacity-40 font-bold uppercase mt-2 tracking-tighter">
             {Math.abs(variance) < 1 ? 'Ledger Reconciled ✓' : 'Out of Balance'}
           </p>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
            <div>
               <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Verification Feed: {selectedAccount}</h3>
               <p className="text-xs text-slate-400 font-bold">Check off transactions that appear on your statement</p>
            </div>
            <select className="bg-white border p-2 rounded-xl text-xs font-bold" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value as AccountType)}>
               <option value="Bank">Bank A/C</option>
               <option value="Cash">Cash Ledger</option>
               <option value="Mobile Banking">Mobile Money Float</option>
            </select>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                     <th className="px-10 py-5">Verified</th>
                     <th className="px-6 py-5">Context / Memo</th>
                     <th className="px-6 py-5 text-right">Debit (-)</th>
                     <th className="px-10 py-5 text-right">Credit (+)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {accountTransactions.map(t => (
                    <tr key={t.id} className={`hover:bg-slate-50 transition-all ${t.isCleared ? 'bg-emerald-50/30' : ''}`}>
                       <td className="px-10 py-5">
                          <button 
                            onClick={() => handleToggleClear(t.id)}
                            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${t.isCleared ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent hover:border-indigo-400'}`}
                          >
                             ✓
                          </button>
                       </td>
                       <td className="px-6 py-5">
                          <div className="font-bold text-slate-900 text-sm uppercase">{t.description}</div>
                          <div className="text-[8px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleDateString()} • Ref: {t.id.slice(-6)}</div>
                       </td>
                       <td className="px-6 py-5 text-right font-mono text-xs text-rose-600">
                          {t.type === 'Debit' ? currency.format(t.amount) : '--'}
                       </td>
                       <td className="px-10 py-5 text-right font-mono text-xs text-emerald-600">
                          {t.type === 'Credit' ? currency.format(t.amount) : '--'}
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

export default BankReconciliation;