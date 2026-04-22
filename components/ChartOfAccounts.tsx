
import React, { useMemo } from 'react';
import { Transaction, AccountType, AccountGroup, SKU, Ingredient } from '../types';

interface ChartOfAccountsProps {
  transactions: Transaction[];
  accountGroups: AccountGroup[];
  ingredients: Ingredient[];
  skus: SKU[];
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

interface AccountRow {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  balance: number;
  nature: 'Debit' | 'Credit';
  isHeader?: boolean;
}

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({ transactions, accountGroups, ingredients, skus, currency }) => {
  
  const ledgerData = useMemo(() => {
    const balances: Record<string, number> = {};

    // Calculate balances for top-level AccountTypes
    transactions.forEach(t => {
      const key = t.account;
      if (!balances[key]) balances[key] = 0;
      if (t.type === 'Credit') balances[key] += t.amount;
      else balances[key] -= t.amount;
    });

    // Calculate balances for Sub-Categories (Expenses/Revenue)
    transactions.forEach(t => {
      if (t.subCategory) {
        const key = `sub-${t.subCategory}`;
        if (!balances[key]) balances[key] = 0;
        // Expenses are usually debits, so we flip for display if they are outflows
        if (t.type === 'Debit') balances[key] += t.amount;
        else balances[key] -= t.amount;
      }
    });

    const rows: AccountRow[] = [
      // ASSETS
      { code: '1000', name: 'ASSETS', type: 'Asset', balance: 0, nature: 'Debit', isHeader: true },
      { code: '1100', name: 'Cash on Hand', type: 'Asset', nature: 'Debit', balance: Math.abs(balances['Cash'] || 0) },
      { code: '1200', name: 'Bank Operating A/C', type: 'Asset', nature: 'Debit', balance: Math.abs(balances['Bank'] || 0) },
      { code: '1300', name: 'Mobile Money Float', type: 'Asset', nature: 'Debit', balance: Math.abs(balances['Mobile Banking'] || 0) },
      { code: '1400', name: 'Accounts Receivable', type: 'Asset', nature: 'Debit', balance: Math.abs(balances['Accounts Receivable'] || 0) },
      { code: '1500', name: 'Inventory (Raw Materials)', type: 'Asset', nature: 'Debit', balance: ingredients.reduce((s, i) => s + (i.currentStock * i.costPerUnit), 0) },
      
      // LIABILITIES
      { code: '2000', name: 'LIABILITIES', type: 'Liability', balance: 0, nature: 'Credit', isHeader: true },
      { code: '2100', name: 'Accounts Payable', type: 'Liability', nature: 'Credit', balance: Math.abs(balances['Accounts Payable'] || 0) },
      { code: '2200', name: 'Short-term Loans', type: 'Liability', nature: 'Credit', balance: 0 }, // Placeholder for specific loan ledger
      
      // REVENUE
      { code: '4000', name: 'OPERATING REVENUE', type: 'Revenue', balance: 0, nature: 'Credit', isHeader: true },
      { code: '4100', name: 'Product Sales', type: 'Revenue', nature: 'Credit', balance: transactions.filter(t => t.category === 'Sale').reduce((s, t) => s + t.amount, 0) },
    ];

    // Map Dynamic Expense Accounts from Groups
    rows.push({ code: '5000', name: 'OPERATING EXPENSES', type: 'Expense', balance: 0, nature: 'Debit', isHeader: true });
    
    accountGroups.forEach((group, gIdx) => {
      group.subCategories.forEach((sub, sIdx) => {
        const bal = balances[`sub-${sub}`] || 0;
        rows.push({
          code: `5${gIdx + 1}${sIdx + 1}0`,
          name: sub,
          type: 'Expense',
          nature: 'Debit',
          balance: bal
        });
      });
    });

    return rows;
  }, [transactions, accountGroups, ingredients]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-10 border-b pb-6 border-slate-50">
           <div>
              <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase tracking-tighter">Chart of Accounts</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Unified General Ledger Architecture</p>
           </div>
           <div className="flex gap-4">
              <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-600 transition-all">Print COA</button>
           </div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <th className="px-8 py-5">Acc Code</th>
                    <th className="px-8 py-5">Account Name</th>
                    <th className="px-8 py-5 text-center">Class</th>
                    <th className="px-8 py-5 text-center">Nature</th>
                    <th className="px-8 py-5 text-right">Live Balance</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {ledgerData.map((row, idx) => (
                   <tr key={idx} className={`${row.isHeader ? 'bg-slate-100/50' : 'hover:bg-indigo-50/20'} transition-colors`}>
                      <td className={`px-8 py-4 font-mono text-[10px] ${row.isHeader ? 'font-black text-slate-900' : 'text-slate-400'}`}>
                         {row.code}
                      </td>
                      <td className={`px-8 py-4 ${row.isHeader ? 'font-black text-indigo-900 text-xs' : 'text-slate-700 font-bold text-xs'} uppercase`}>
                         {row.name}
                      </td>
                      <td className="px-8 py-4 text-center">
                         {!row.isHeader && (
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${
                             row.type === 'Asset' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                             row.type === 'Liability' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                             row.type === 'Revenue' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                             'bg-slate-100 text-slate-600 border-slate-200'
                           }`}>
                              {row.type}
                           </span>
                         )}
                      </td>
                      <td className="px-8 py-4 text-center">
                         {!row.isHeader && (
                           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                              {row.nature}
                           </span>
                         )}
                      </td>
                      <td className={`px-8 py-4 text-right font-mono font-black ${row.isHeader ? 'opacity-0' : 'text-slate-900'}`}>
                         {row.balance > 0 ? currency.format(row.balance) : '--'}
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white flex items-center gap-10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
         <div className="text-5xl opacity-30 grayscale shrink-0">🏛️</div>
         <div>
            <h4 className="text-xl font-bold font-serif text-amber-400 mb-2 uppercase tracking-tight">Ledger Integrity Notice</h4>
            <p className="text-sm text-indigo-100 leading-relaxed italic max-w-4xl">
               "The Chart of Accounts (COA) is the index of your business's financial DNA. It maps every physical bag of flour and every customer coin to a specific category, ensuring your Balance Sheet and P&L remain balanced in real-time. Do not delete standard codes (1000-4000) as they are required for statutory reconciliation."
            </p>
         </div>
      </div>
    </div>
  );
};

export default ChartOfAccounts;
