import React, { useState, useMemo } from 'react';
import { JournalLine, AccountType, Transaction } from '../types';
import TransactionDatePicker from './TransactionDatePicker';

interface GeneralJournalProps {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  currency: { format: (v: number) => string };
}

const ACCOUNTS: AccountType[] = ['Bank', 'Cash', 'Mobile Banking', 'Accounts Receivable', 'Accounts Payable', 'Equity', 'Fixed Assets', 'Depreciation Expense', 'Bad Debt Provision'];

const GeneralJournal: React.FC<GeneralJournalProps> = ({ transactions, setTransactions, currency }) => {
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<JournalLine[]>([
    { account: 'Cash', debit: 0, credit: 0, memo: '' },
    { account: 'Equity', debit: 0, credit: 0, memo: '' }
  ]);

  const totals = useMemo(() => {
    return lines.reduce((acc, l) => ({
      debit: acc.debit + l.debit,
      credit: acc.credit + l.credit
    }), { debit: 0, credit: 0 });
  }, [lines]);

  const variance = Math.abs(totals.debit - totals.credit);
  const isBalanced = variance < 0.01 && totals.debit > 0;

  const handleAddLine = () => {
    setLines([...lines, { account: 'Cash', debit: 0, credit: 0, memo: '' }]);
  };

  const handlePostEntry = () => {
    if (!isBalanced) return;

    const newTransactions: Transaction[] = lines.flatMap((l, i) => {
      if (l.debit === 0 && l.credit === 0) return [];
      
      return [{
        id: `journal-${Date.now()}-${i}`,
        date: new Date(date).toISOString(),
        account: l.account,
        type: l.debit > 0 ? 'Debit' : 'Credit',
        amount: l.debit > 0 ? l.debit : l.credit,
        description: `${description}: ${l.memo || 'General Entry'}`,
        category: 'Journal',
        auditLog: []
      }];
    });

    setTransactions([...newTransactions, ...transactions]);
    setShowEntryForm(false);
    setDescription('');
    setLines([{ account: 'Cash', debit: 0, credit: 0, memo: '' }, { account: 'Equity', debit: 0, credit: 0, memo: '' }]);
    alert("Voucher successfully posted to master ledger.");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl font-bold font-serif text-slate-900">General Journal</h3>
          <p className="text-xs text-slate-400 font-bold uppercase mt-1">Double-Entry Vouchers & Adjustments</p>
        </div>
        <button 
          onClick={() => setShowEntryForm(true)}
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all"
        >
          + Create New Voucher
        </button>
      </header>

      {showEntryForm && (
        <div className="bg-white p-12 rounded-[4rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-50 pb-8">
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Voucher Description</label>
               <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Loan Repayment Adjustment" />
            </div>
            <TransactionDatePicker 
               value={date} 
               onChange={setDate} 
               label="Effective Date"
            />
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-12 gap-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="col-span-4">Target Ledger Account</div>
                <div className="col-span-2 text-right">Debit (+)</div>
                <div className="col-span-2 text-right">Credit (-)</div>
                <div className="col-span-4">Line Memo</div>
             </div>
             {lines.map((line, idx) => (
               <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                     <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" value={line.account} onChange={e => {
                       const next = [...lines];
                       next[idx].account = e.target.value as AccountType;
                       setLines(next);
                     }}>
                        {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
                     </select>
                  </div>
                  <div className="col-span-2">
                     <input type="number" className="w-full p-3 bg-white border border-slate-100 rounded-xl font-mono font-bold text-xs text-right text-emerald-600" value={line.debit || ''} onChange={e => {
                        const next = [...lines];
                        next[idx].debit = parseFloat(e.target.value) || 0;
                        if (next[idx].debit > 0) next[idx].credit = 0;
                        setLines(next);
                     }} />
                  </div>
                  <div className="col-span-2">
                     <input type="number" className="w-full p-3 bg-white border border-slate-100 rounded-xl font-mono font-bold text-xs text-right text-rose-600" value={line.credit || ''} onChange={e => {
                        const next = [...lines];
                        next[idx].credit = parseFloat(e.target.value) || 0;
                        if (next[idx].credit > 0) next[idx].debit = 0;
                        setLines(next);
                     }} />
                  </div>
                  <div className="col-span-4 flex gap-2 items-center">
                     <input className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium" placeholder="Memo..." value={line.memo} onChange={e => {
                        const next = [...lines];
                        next[idx].memo = e.target.value;
                        setLines(next);
                     }} />
                     <button onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-rose-500">✕</button>
                  </div>
               </div>
             ))}
             <button onClick={handleAddLine} className="text-[10px] font-black text-indigo-400 uppercase hover:text-indigo-600 pl-4 tracking-tighter">+ Add Entry Line</button>
          </div>

          <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex gap-10">
                <div className="text-center">
                   <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Trial Debits</div>
                   <div className="text-xl font-mono font-black text-emerald-600">{currency.format(totals.debit)}</div>
                </div>
                <div className="text-center">
                   <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Trial Credits</div>
                   <div className="text-xl font-mono font-black text-rose-600">{currency.format(totals.credit)}</div>
                </div>
                <div className="flex flex-col justify-center">
                   <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isBalanced ? 'Voucher Balanced ✓' : `Variance: ${currency.format(variance)}`}
                   </div>
                </div>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setShowEntryForm(false)} className="px-10 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
                <button 
                  onClick={handlePostEntry}
                  disabled={!isBalanced}
                  className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-indigo-900 disabled:opacity-30 disabled:grayscale"
                >
                  Post to Ledger
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralJournal;