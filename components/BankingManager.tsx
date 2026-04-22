
import React, { useState, useMemo } from 'react';
import { Transaction, AccountType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BankingManagerProps {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
}

type BankAction = 'Deposit' | 'Withdrawal' | 'Transfer' | 'Charges';

const BankingManager: React.FC<BankingManagerProps> = ({ transactions, setTransactions, currency }) => {
  const [showAddTx, setShowAddTx] = useState(false);
  const [activeAction, setActiveAction] = useState<BankAction>('Deposit');
  
  const [newTx, setNewTx] = useState<{
    account: AccountType;
    toAccount: AccountType;
    amount: number;
    description: string;
    category: Transaction['category'];
  }>({
    account: 'Cash',
    toAccount: 'Bank',
    amount: 0,
    description: '',
    category: 'Adjustment'
  });

  const accountStats = useMemo(() => {
    const stats: Record<AccountType, { balance: number; inflow: number; outflow: number }> = {
      'Cash': { balance: 0, inflow: 0, outflow: 0 },
      'Bank': { balance: 0, inflow: 0, outflow: 0 },
      'Mobile Banking': { balance: 0, inflow: 0, outflow: 0 },
      'Merchant Settlement': { balance: 0, inflow: 0, outflow: 0 },
      'Accounts Receivable': { balance: 0, inflow: 0, outflow: 0 },
      'Accounts Payable': { balance: 0, inflow: 0, outflow: 0 },
      'Equity': { balance: 0, inflow: 0, outflow: 0 },
      'Fixed Assets': { balance: 0, inflow: 0, outflow: 0 },
      'Depreciation Expense': { balance: 0, inflow: 0, outflow: 0 },
      'Bad Debt Provision': { balance: 0, inflow: 0, outflow: 0 }
    };

    transactions.forEach(tx => {
      const acc = tx.account as AccountType;
      if (!stats[acc]) return;
      if (tx.type === 'Credit') {
        stats[acc].balance += tx.amount;
        stats[acc].inflow += tx.amount;
      } else {
        stats[acc].balance -= tx.amount;
        stats[acc].outflow += tx.amount;
      }
    });

    return stats;
  }, [transactions]);

  const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'];

  const handlePost = () => {
    if (!newTx.amount || newTx.amount <= 0) return;
    const baseTx = { id: `tx-${Date.now()}`, date: new Date().toISOString(), amount: newTx.amount };
    let txsToPost: Transaction[] = [];

    switch (activeAction) {
      case 'Transfer':
        if (newTx.account === newTx.toAccount) return;
        txsToPost.push({ ...baseTx, id: `${baseTx.id}-dr`, account: newTx.account, type: 'Debit', description: `Xfer to ${newTx.toAccount}`, category: 'Transfer' });
        txsToPost.push({ ...baseTx, id: `${baseTx.id}-cr`, account: newTx.toAccount, type: 'Credit', description: `Xfer from ${newTx.account}`, category: 'Transfer' });
        break;
      default:
        txsToPost.push({ ...baseTx, account: newTx.account, type: activeAction === 'Deposit' ? 'Credit' : 'Debit', description: newTx.description || `${activeAction}`, category: activeAction === 'Charges' ? 'Expense' : 'Adjustment' });
    }

    setTransactions([...txsToPost, ...transactions]);
    setShowAddTx(false);
    setNewTx({ account: 'Cash', toAccount: 'Bank', amount: 0, description: '', category: 'Adjustment' });
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 font-serif tracking-tight">Treasury Command</h2>
          <p className="text-slate-500 font-medium text-sm tracking-widest uppercase">Verified Liquidity Junction</p>
        </div>
        <button onClick={() => setShowAddTx(!showAddTx)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">
            {showAddTx ? 'Close Form' : '+ Post Ledger Entry'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {(['Cash', 'Bank', 'Mobile Banking', 'Merchant Settlement'] as AccountType[]).map(acc => (
             <div key={acc} className={`bg-white p-8 rounded-[3rem] border shadow-sm relative overflow-hidden group ${acc === 'Merchant Settlement' ? 'border-indigo-200' : 'border-slate-100'}`}>
                <div className="relative">
                   <div className="flex justify-between items-center mb-6">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{acc}</span>
                      <span className="text-xl">{acc === 'Bank' ? '🏦' : acc === 'Cash' ? '💵' : acc === 'Mobile Banking' ? '📱' : '💳'}</span>
                   </div>
                   <div className="text-2xl font-mono font-black text-slate-900">{currency.format(accountStats[acc].balance)}</div>
                   <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[8px] font-black uppercase">
                      <div className="text-emerald-500">Total In: {currency.formatCompact(accountStats[acc].inflow)}</div>
                   </div>
                </div>
             </div>
           ))}
      </div>

      {showAddTx && (
        <div className="bg-white p-10 rounded-[3.5rem] border-4 border-indigo-900 shadow-2xl animate-fadeIn space-y-8">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
              {['Deposit', 'Withdrawal', 'Transfer', 'Charges'].map(a => (
                <button key={a} onClick={() => setActiveAction(a as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeAction === a ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>{a}</button>
              ))}
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Source Ledger</label>
                 <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" value={newTx.account} onChange={e => setNewTx({...newTx, account: e.target.value as any})}>
                    <option value="Cash">Cash Ledger</option>
                    <option value="Bank">Bank Statement</option>
                    <option value="Mobile Banking">Mobile Money Float</option>
                    <option value="Merchant Settlement">Card Settlements</option>
                 </select>
              </div>
              {activeAction === 'Transfer' && (
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Destination Ledger</label>
                   <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" value={newTx.toAccount} onChange={e => setNewTx({...newTx, toAccount: e.target.value as any})}>
                      <option value="Cash">Cash Ledger</option>
                      <option value="Bank">Bank Statement</option>
                      <option value="Mobile Banking">Mobile Money Float</option>
                      <option value="Merchant Settlement">Card Settlements</option>
                   </select>
                </div>
              )}
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Magnitude (UGX)</label>
                 <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-mono font-black text-lg" value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="md:col-span-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Internal Memo</label>
                 <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Reason..." value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />
              </div>
           </div>
           <div className="flex justify-end pt-4">
              <button onClick={handlePost} className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-600 transition-all">Execute Ledger Operation</button>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-50 overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
           <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Recent Flows</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-10 py-5">Context</th>
                <th className="px-6 py-5">Account</th>
                <th className="px-10 py-5 text-right">Magnitude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.slice(0, 30).map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-10 py-5">
                    <div className="font-bold text-slate-800 text-xs uppercase">{tx.description}</div>
                    <div className="text-[8px] text-slate-400 font-mono mt-1">{new Date(tx.date).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black text-slate-600 uppercase">{tx.account}</span>
                  </td>
                  <td className={`px-10 py-5 text-right font-mono font-black text-sm ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {tx.type === 'Credit' ? '+' : '-'}{tx.amount.toLocaleString()}
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

export default BankingManager;
