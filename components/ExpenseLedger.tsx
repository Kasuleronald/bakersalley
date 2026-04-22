
import React, { useState, useMemo } from 'react';
import { Transaction, AccountType, MonthlyBudget, SKU, AccountGroup } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import AuditTrailModal from './AuditTrailModal';
import AIScanner from './AIScanner';
import TransactionDatePicker from './TransactionDatePicker';

interface ExpenseLedgerProps {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  budgets: MonthlyBudget[];
  skus: SKU[];
  accountGroups: AccountGroup[];
  setAccountGroups: (groups: AccountGroup[]) => void;
  onManualCorrection?: (category: 'transactions', id: string, updates: Record<string, any>, reason: string) => void;
}

const COLORS = ['#1e1b4b', '#4f46e5', '#818cf8', '#fbbf24', '#f59e0b', '#dc2626', '#db2777', '#7c3aed', '#ea580c', '#2563eb', '#16a34a', '#a855f7', '#64748b'];

const ExpenseLedger: React.FC<ExpenseLedgerProps> = ({ transactions, setTransactions, budgets, skus, accountGroups, setAccountGroups, onManualCorrection }) => {
  const [activeSubTab, setActiveTab] = useState<'Ledger' | 'Categories'>('Ledger');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [viewHistoryId, setViewHistoryId] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [newSubName, setNewSubName] = useState<Record<string, string>>({});

  const [newExp, setNewExp] = useState({
    amount: 0,
    category: accountGroups[0]?.subCategories[0] || 'Other',
    account: 'Cash' as AccountType,
    description: '',
    date: new Date().toISOString().split('T')[0],
    costType: 'Indirect' as 'Direct' | 'Indirect' | 'Variable',
    skuId: ''
  });

  const expenseTransactions = useMemo(() => {
    return transactions
      .filter(t => t.category === 'Expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const filteredExpenses = useMemo(() => {
    if (filterCategory === 'All') return expenseTransactions;
    return expenseTransactions.filter(t => t.subCategory === filterCategory);
  }, [expenseTransactions, filterCategory]);

  const handleAddExpense = () => {
    if (!newExp.amount || newExp.amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const tx: Transaction = {
      id: `exp-${Date.now()}`,
      date: new Date(newExp.date).toISOString(),
      account: newExp.account,
      type: 'Debit',
      amount: newExp.amount,
      description: newExp.description || `Expense: ${newExp.category}`,
      category: 'Expense',
      subCategory: newExp.category,
      costType: newExp.costType,
      skuId: newExp.skuId || undefined,
      auditLog: []
    };

    setTransactions([tx, ...transactions]);
    setShowAddForm(false);
    setNewExp({ ...newExp, amount: 0, description: '' });
  };

  const handleCorrection = (id: string) => {
    if (!correctionReason) {
      alert("A reason for this manual correction is mandatory for audit compliance.");
      return;
    }
    if (onManualCorrection) {
      onManualCorrection('transactions', id, editForm, correctionReason);
      setEditingTxId(null);
      setCorrectionReason('');
    }
  };

  const startCorrection = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditForm({ 
      amount: tx.amount, 
      subCategory: tx.subCategory, 
      description: tx.description, 
      costType: tx.costType,
      date: tx.date.split('T')[0]
    });
    setCorrectionReason('');
  };

  const allSubcategories = useMemo(() => {
    return accountGroups.reduce((acc, g) => [...acc, ...g.subCategories], [] as string[]);
  }, [accountGroups]);

  const subcategorySpendMap = useMemo(() => {
    const map: Record<string, number> = {};
    expenseTransactions.forEach(t => {
      const cat = t.subCategory || 'Uncategorized';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return map;
  }, [expenseTransactions]);

  const chartData = useMemo(() => {
    return Object.entries(subcategorySpendMap).map(([name, value]) => ({ name, value }));
  }, [subcategorySpendMap]);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {showScanner && <AIScanner docType="Receipt" onConfirm={() => {}} onClose={() => setShowScanner(false)} />}
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-serif uppercase tracking-tighter">Operating Expenditure</h2>
          <p className="text-slate-500 font-medium text-[10px] uppercase font-black tracking-widest">Granular Cost Center Management</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner border border-slate-200">
           <button onClick={() => setActiveTab('Ledger')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'Ledger' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Transactions</button>
           <button onClick={() => setActiveTab('Categories')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'Categories' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}>Manage Accounts</button>
        </div>
      </header>

      {activeSubTab === 'Ledger' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Period Spend Distribution</div>
               <div className="text-3xl font-bold font-mono text-slate-900 text-center mb-6">
                  UGX {(Object.values(subcategorySpendMap) as number[]).reduce((a: number, b: number) => a + b, 0).toLocaleString()}
               </div>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                       {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                     <Tooltip contentStyle={{borderRadius: '1rem', border: 'none'}} formatter={(v: any) => [`UGX ${v.toLocaleString()}`, 'Spend']} />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {editingTxId && (
              <div className="bg-amber-900 p-10 rounded-[3rem] text-white shadow-2xl animate-softFade space-y-8 sticky top-4">
                 <h4 className="text-xl font-bold font-serif text-amber-400">Ledger Correction</h4>
                 <div className="space-y-4">
                    <TransactionDatePicker 
                       value={editForm.date || ''} 
                       onChange={date => setEditForm({...editForm, date})} 
                       dark 
                       label="Effective Date"
                    />
                    <div>
                       <label className="block text-[8px] font-black text-amber-400 uppercase mb-1">Adjusted Magnitude</label>
                       <input type="number" className="w-full p-4 bg-white/10 border-none rounded-2xl font-mono font-black text-xl text-white outline-none" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div>
                       <label className="block text-[8px] font-black text-amber-400 uppercase mb-1">Re-classify</label>
                       <select className="w-full p-4 bg-white/10 border-none rounded-2xl font-bold text-xs" value={editForm.subCategory} onChange={e => setEditForm({...editForm, subCategory: e.target.value})}>
                          {allSubcategories.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                       </select>
                    </div>
                    <textarea className="w-full p-4 bg-white/10 border-none rounded-2xl text-xs font-medium h-24 italic" placeholder="Mandatory reason..." value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} />
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleCorrection(editingTxId)} className="flex-1 py-4 bg-white text-amber-900 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-amber-100 transition-all">Save Changes</button>
                    <button onClick={() => setEditingTxId(null)} className="px-6 py-4 bg-white/10 text-white/50 rounded-2xl font-bold text-xs uppercase">Abort</button>
                 </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            {!showAddForm ? (
                <button onClick={() => setShowAddForm(true)} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">+ Post New Expense to Ledger</button>
            ) : (
              <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-indigo-100 animate-fadeIn space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-bold font-serif text-slate-900">Direct Ledger Injection</h3>
                   <button onClick={() => setShowAddForm(false)} className="text-slate-300 hover:text-slate-900">✕</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <TransactionDatePicker 
                      value={newExp.date} 
                      onChange={date => setNewExp({...newExp, date})} 
                      label="Effective Date"
                   />
                   
                   <div>
                     <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Magnitude (UGX)</label>
                     <input type="number" className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-mono font-bold text-xl text-indigo-900 outline-none" value={newExp.amount || ''} onChange={e => setNewExp({...newExp, amount: parseFloat(e.target.value) || 0})} placeholder="0" />
                   </div>

                   <div>
                     <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Account Group / Sub-Account</label>
                     <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none" value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})}>
                       {accountGroups.map(group => (
                         <optgroup key={group.id} label={group.name}>
                            {group.subCategories.map(c => <option key={c} value={c}>{c}</option>)}
                         </optgroup>
                       ))}
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-[10px] font-bold text-indigo-600 mb-2 uppercase tracking-widest">Source Account</label>
                     <select className="w-full px-6 py-4 rounded-2xl bg-indigo-50 border border-indigo-100 font-bold text-indigo-900 outline-none" value={newExp.account} onChange={e => setNewExp({...newExp, account: e.target.value as any})}>
                       <option value="Cash">Cash Ledger</option>
                       <option value="Bank">Bank Account</option>
                       <option value="Mobile Banking">Mobile Money Float</option>
                     </select>
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Memo / Description</label>
                     <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold outline-none" placeholder="Context for auditor..." value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} />
                   </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowAddForm(false)} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold uppercase text-[10px]">Discard</button>
                  <button onClick={handleAddExpense} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl uppercase text-[10px]">Commit to Master Ledger</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 font-serif">Verified Expenditure Journal</h3>
                <select className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase outline-none" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                   <option value="All">All Categories</option>
                   {allSubcategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-gray-50/30 border-b border-gray-100">
                      <th className="px-8 py-4">Memo</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-8 py-4 text-right">Actual Magnitude</th>
                      <th className="px-8 py-4 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredExpenses.map(tx => (
                      <tr key={tx.id} className="hover:bg-indigo-50/10 group transition-all">
                        <td className="px-8 py-5">
                          <div className="text-xs font-bold text-slate-800 leading-tight">{tx.description}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-1">{new Date(tx.date).toLocaleDateString()} via {tx.account}</div>
                        </td>
                        <td className="px-6 py-5">
                            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-full">{tx.subCategory}</span>
                        </td>
                        <td className="px-8 py-5 text-right font-mono font-black text-slate-900">
                           {tx.amount.toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right">
                           <button onClick={() => startCorrection(tx)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">✎ Adjust</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-end border-b pb-8 border-slate-50 gap-6">
                 <div>
                    <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Account Group Architect</h3>
                    <p className="text-sm text-slate-400 mt-1 font-medium italic">Define parent groups and granular sub-accounts.</p>
                 </div>
                 <div className="flex gap-4 w-full md:w-auto">
                    <input className="flex-1 md:w-64 px-6 py-3 bg-slate-50 rounded-2xl font-bold text-sm outline-none border border-slate-100 focus:ring-2 focus:ring-indigo-500" placeholder="New Parent Group Name..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                    <button onClick={() => {
                        if(!newGroupName.trim()) return;
                        setAccountGroups([...accountGroups, { id: `g-${Date.now()}`, name: newGroupName, subCategories: [] }]);
                        setNewGroupName('');
                    }} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">+ Add Group</button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                 {accountGroups.map(group => (
                   <div key={group.id} className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 flex flex-col justify-between group hover:shadow-lg transition-all border-b-4 border-b-transparent hover:border-b-indigo-500 min-h-[400px]">
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                           <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{group.name}</h4>
                           <button onClick={() => setAccountGroups(accountGroups.filter(g => g.id !== group.id))} className="text-slate-200 hover:text-rose-500 transition-colors">✕</button>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">Active Sub-Accounts</span>
                          <div className="space-y-1.5">
                            {group.subCategories.map(sub => {
                               const spend = subcategorySpendMap[sub] || 0;
                               return (
                                 <div key={sub} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between group/sub">
                                    <div>
                                       <div className="text-[10px] font-bold text-slate-600 uppercase">{sub}</div>
                                       <div className="text-[8px] font-mono font-bold text-indigo-400 mt-0.5">Total: UGX {spend.toLocaleString()}</div>
                                    </div>
                                 </div>
                               );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-200/50 mt-6">
                        <div className="flex gap-2">
                           <input 
                            className="flex-1 px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" 
                            placeholder="Add sub-account..." 
                            value={newSubName[group.id] || ''} 
                            onChange={e => setNewSubName({...newSubName, [group.id]: e.target.value})}
                           />
                           <button onClick={() => {
                               const val = newSubName[group.id]?.trim();
                               if (!val) return;
                               setAccountGroups(accountGroups.map(g => g.id === group.id ? { ...g, subCategories: [...g.subCategories, val] } : g));
                               setNewSubName({...newSubName, [group.id]: ''});
                           }} className="bg-indigo-900 text-white px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-black">Add</button>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseLedger;
