import React, { useState, useMemo, useEffect } from 'react';
import { MonthlyBudget, Transaction, Sale, BudgetLine, AccountGroup } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BudgetingPlannerProps {
  budgets: MonthlyBudget[];
  setBudgets: (budgets: MonthlyBudget[]) => void;
  transactions: Transaction[];
  sales: Sale[];
  accountGroups: AccountGroup[];
}

const BudgetingPlanner: React.FC<BudgetingPlannerProps> = ({ budgets, setBudgets, transactions, sales, accountGroups }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Draft state to allow "Saving" logic
  const [draftLines, setDraftLines] = useState<BudgetLine[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Derive flat list of categories from account groups
  const dynamicCategories = useMemo(() => {
    return accountGroups.reduce((acc, g) => [...acc, ...g.subCategories], [] as string[]);
  }, [accountGroups]);

  // Load budget into draft when month/year changes
  useEffect(() => {
    const existing = budgets.find(b => b.month === selectedMonth && b.year === selectedYear);
    if (existing) {
      // Sync existing budget with potentially new dynamic categories
      const lines = [...existing.lines];
      dynamicCategories.forEach(cat => {
        if (!lines.find(l => l.category === cat)) {
          lines.push({ category: cat, amount: 0 });
        }
      });
      setDraftLines(lines);
    } else {
      const initial: BudgetLine[] = [
        { category: 'Revenue', amount: 0 },
        ...dynamicCategories.map(cat => ({ category: cat, amount: 0 }))
      ];
      setDraftLines(initial);
    }
    setIsDirty(false);
  }, [selectedMonth, selectedYear, budgets, dynamicCategories]);

  const actuals = useMemo(() => {
    const revenue = sales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    }).reduce((sum, s) => sum + s.totalPrice, 0);

    const expenseMap: Record<string, number> = {};
    transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear && t.type === 'Debit';
    }).forEach(t => {
      const cat = t.subCategory || 'Other';
      expenseMap[cat] = (expenseMap[cat] || 0) + t.amount;
    });

    return { Revenue: revenue, ...expenseMap };
  }, [sales, transactions, selectedMonth, selectedYear]);

  const handleUpdateDraft = (category: string, amount: number) => {
    setDraftLines(prev => prev.map(l => l.category === category ? { ...l, amount } : l));
    setIsDirty(true);
  };

  const handleSaveBudget = () => {
    const nextBudgets = [...budgets];
    const idx = nextBudgets.findIndex(b => b.month === selectedMonth && b.year === selectedYear);
    
    if (idx > -1) {
      nextBudgets[idx].lines = draftLines;
    } else {
      nextBudgets.push({
        id: `budget-${selectedYear}-${selectedMonth}`,
        month: selectedMonth,
        year: selectedYear,
        lines: draftLines
      });
    }
    setBudgets(nextBudgets);
    setIsDirty(false);
    alert("Master Budget Plan Saved Successfully.");
  };

  const comparisonData = useMemo(() => {
    return draftLines.map(line => {
      const actual = (actuals as any)[line.category] || 0;
      const budget = line.amount || 0;
      const variance = isFinite(actual) && isFinite(budget) ? actual - budget : 0;
      
      return {
        category: line.category,
        budget,
        actual,
        variance,
        variancePercent: budget > 0 ? (variance / budget) * 100 : 0
      };
    }).sort((a, b) => b.budget - a.budget);
  }, [draftLines, actuals]);

  const totalBudgetedExpenses = comparisonData.filter(d => d.category !== 'Revenue').reduce((s, x) => s + x.budget, 0);
  const totalActualExpenses = comparisonData.filter(d => d.category !== 'Revenue').reduce((s, x) => s + x.actual, 0);

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-serif">Master Planning Workspace</h2>
          <p className="text-slate-500 font-medium text-sm">Inter-linked Budgeting & Actual Variance Analysis.</p>
        </div>
        <div className="flex gap-3">
          {isDirty && (
            <button 
              onClick={handleSaveBudget}
              className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 animate-pulse"
            >
              <span>💾</span> Save Master Plan
            </button>
          )}
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
            <select className="px-4 py-2 rounded-xl text-xs font-bold outline-none" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
              {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <h3 className="text-xl font-bold font-serif text-slate-900">Expense & Revenue Targets</h3>
                 {isDirty && <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Unsaved Draft</span>}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Double-click value to edit</span>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-4">Account Category</th>
                    <th className="px-6 py-4 text-right">Target Budget (Editable)</th>
                    <th className="px-6 py-4 text-right">Ledger (Actual)</th>
                    <th className="px-8 py-4 text-right">Variance Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {comparisonData.map(d => {
                    const isRevenue = d.category === 'Revenue';
                    const isFavorable = isRevenue ? d.variance >= 0 : d.variance <= 0;
                    return (
                      <tr key={d.category} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-5">
                           <div className={`font-bold text-xs uppercase tracking-tight ${isRevenue ? 'text-indigo-600' : 'text-slate-700'}`}>{d.category}</div>
                        </td>
                        <td className="px-6 py-5 text-right relative">
                           <input 
                            type="number"
                            className={`w-36 bg-transparent border-none text-right font-mono font-bold text-sm outline-none focus:ring-1 focus:ring-indigo-500 p-2 rounded-xl transition-all ${isDirty ? 'bg-amber-50/30' : ''}`}
                            value={d.budget || ''}
                            onChange={e => handleUpdateDraft(d.category as string, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                           />
                        </td>
                        <td className="px-6 py-5 text-right font-mono font-bold text-slate-400 text-xs">
                           UGX {d.actual.toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className={`text-xs font-mono font-bold ${isFavorable ? 'text-emerald-600' : 'text-red-600'}`}>
                             {d.variance > 0 ? '+' : ''}{Math.round(d.variance).toLocaleString()}
                           </div>
                           <div className="text-[8px] font-bold text-slate-300 uppercase">
                             {isFavorable ? 'Within Limit' : 'Over Spend'}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
              <h4 className="text-xl font-bold font-serif mb-6 flex items-center gap-2 text-amber-400">
                 <span>📈</span> Burn Analysis
              </h4>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                       <span>Overall Budget Used</span>
                       <span>{totalBudgetedExpenses > 0 ? Math.round((totalActualExpenses/totalBudgetedExpenses)*100) : 0}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                       <div 
                        className={`h-full transition-all duration-1000 ${totalActualExpenses > totalBudgetedExpenses ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (totalActualExpenses / (totalBudgetedExpenses || 1)) * 100)}%` }}
                       ></div>
                    </div>
                 </div>
                 <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div>
                       <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Budget Total</span>
                       <span className="text-sm font-mono font-bold">UGX {Math.round(totalBudgetedExpenses).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Actual Total</span>
                       <span className="text-sm font-mono font-bold">UGX {Math.round(totalActualExpenses).toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Saving Guidance</h4>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                "The Save button appears only when changes are detected in your draft plan. Saving here will immediately update the Unit Cost Audit (ABC) and your Management Financial Statements for this month."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetingPlanner;