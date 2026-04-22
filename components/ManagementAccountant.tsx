
import React, { useState, useMemo } from 'react';
import { 
  SKU, Ingredient, Sale, Transaction, Employee, Overhead, 
  Customer, Order, FinishedGood, Asset, Loan, SupplierInvoice, 
  ProductionLog, InventoryLoss, TaxConfig, AccountType, MonthlyBudget, AccountGroup, SyncPulse, User, Activity
} from '../types';
import { CashFlowHub } from './CashFlowHub';
import TaxHub from './TaxHub';
import BudgetingPlanner from './BudgetingPlanner';
import GeneralJournal from './GeneralJournal';
import BankReconciliation from './BankReconciliation';
import NeuralBookkeepingInbox from './NeuralBookkeepingInbox';
import ExpenseLedger from './ExpenseLedger';
import FinanceCommandCenter from './FinanceCommandCenter';
import FinancialControlCenter from './FinancialControlCenter';
import CostAccountantHub from './CostAccountantHub';
import ChartOfAccounts from './ChartOfAccounts';
import CFOAnalysis from './CFOAnalysis';

interface ManagementAccountantProps {
  skus: SKU[];
  setSkus: (skus: SKU[]) => void;
  ingredients: Ingredient[];
  setIngredients: (ings: Ingredient[]) => void;
  sales: Sale[];
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  employees: Employee[];
  overheads: Overhead[];
  setOverheads: (ohs: Overhead[]) => void;
  customers: Customer[];
  orders: Order[];
  finishedGoods: FinishedGood[];
  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  loans: Loan[];
  invoices: SupplierInvoice[];
  productionLogs: ProductionLog[];
  inventoryLosses: InventoryLoss[];
  activities: Activity[];
  setActivities: (acts: Activity[]) => void;
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
  taxConfig: TaxConfig;
  setTaxConfig: (config: TaxConfig) => void;
  budgets: MonthlyBudget[];
  setBudgets: (budgets: MonthlyBudget[]) => void;
  accountGroups: AccountGroup[];
  setAccountGroups: (groups: AccountGroup[]) => void;
  currentUser: User;
}

const ManagementAccountant: React.FC<ManagementAccountantProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'Command' | 'PnL' | 'BalanceSheet' | 'CashFlow' | 'Tax' | 'Budget' | 'Journal' | 'Recon' | 'TrialBalance' | 'Automation' | 'Expenses' | 'Search' | 'Control' | 'Costing' | 'COA' | 'CFOAnalysis'>('Command');
  const { currency, transactions, setTransactions, assets, setAssets } = props;
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Sync Status for deployment test
  const syncStatus: SyncPulse = {
    lastLocalSave: new Date().toLocaleTimeString(),
    lastCloudSync: new Date(Date.now() - 300000).toLocaleTimeString(),
    pendingChanges: 0,
    status: navigator.onLine ? 'Online' : 'Offline'
  };

  const pnLData = useMemo(() => {
    const revenue = props.sales.reduce((s, x) => s + x.totalPrice, 0);
    const materialCogs = props.productionLogs.reduce((acc, log) => acc + (log.materialCost || 0), 0);
    const operationalExpenses = props.transactions
        .filter(t => t.type === 'Debit' && (t.category === 'Expense' || t.category === 'Journal'))
        .reduce((s, x) => s + x.amount, 0);

    const grossProfit = revenue - materialCogs;
    const netProfit = grossProfit - operationalExpenses;

    const getPct = (val: number) => revenue > 0 ? (val / revenue) * 100 : 0;

    return { 
        revenue, 
        materialCogs, 
        operationalExpenses, 
        grossProfit, 
        netProfit,
        grossMargin: getPct(grossProfit),
        expenseRatio: getPct(operationalExpenses),
        netMargin: getPct(netProfit)
    };
  }, [props.sales, props.productionLogs, props.transactions]);

  const trialBalance = useMemo(() => {
    const balances: Record<AccountType, { debit: number; credit: number }> = {
      'Bank': { debit: 0, credit: 0 },
      'Cash': { debit: 0, credit: 0 },
      'Mobile Banking': { debit: 0, credit: 0 },
      'Merchant Settlement': { debit: 0, credit: 0 },
      'Accounts Receivable': { debit: 0, credit: 0 },
      'Accounts Payable': { debit: 0, credit: 0 },
      'Equity': { debit: 0, credit: 0 },
      'Fixed Assets': { debit: 0, credit: 0 },
      'Depreciation Expense': { debit: 0, credit: 0 },
      'Bad Debt Provision': { debit: 0, credit: 0 }
    };

    transactions.forEach(t => {
      const acc = t.account as AccountType;
      if (balances[acc]) {
        if (t.type === 'Debit') balances[acc].debit += t.amount;
        else balances[acc].credit += t.amount;
      }
    });

    return balances;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.subCategory && t.subCategory.toLowerCase().includes(q)) ||
      t.amount.toString().includes(q) ||
      t.account.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  const handleRunDepreciation = () => {
    if (!window.confirm("Post Monthly Depreciation? This will record value erosion for all Machinery & Vehicles in the P&L.")) return;
    
    const timestamp = new Date().toISOString();
    const newTransactions: Transaction[] = [];
    const updatedAssets = assets.map(asset => {
      const monthlyRate = (asset.purchasePrice * (asset.depreciationRate / 100)) / 12;
      
      newTransactions.push({
        id: `depr-${Date.now()}-${asset.id}-dr`,
        date: timestamp,
        account: 'Depreciation Expense',
        type: 'Debit',
        amount: monthlyRate,
        description: `Monthly Depreciation: ${asset.name}`,
        category: 'Journal'
      });

      newTransactions.push({
        id: `depr-${Date.now()}-${asset.id}-cr`,
        date: timestamp,
        account: 'Fixed Assets',
        type: 'Credit',
        amount: monthlyRate,
        description: `Accumulated Depr: ${asset.name}`,
        category: 'Journal'
      });

      return {
        ...asset,
        lastDepreciationDate: timestamp,
        accumulatedDepreciation: (asset.accumulatedDepreciation || 0) + monthlyRate
      };
    });

    setAssets(updatedAssets);
    setTransactions([...newTransactions, ...transactions]);
    alert("Asset Value erosion journalized successfully.");
  };

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-indigo-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter text-amber-400">Finance Module</h2>
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mt-1">GAAP Integrity • Industrial Costing • Integrated ERP Suite</p>
        </div>
        <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/20 relative z-10 overflow-x-auto scrollbar-hide shadow-inner">
          {[
            { id: 'Command', label: 'CFO View', icon: '👑' },
            { id: 'CFOAnalysis', label: 'CFO Analysis', icon: '📈' },
            { id: 'COA', label: 'COA', icon: '🏛️' },
            { id: 'Costing', label: 'Costing Hub', icon: '⚖️' },
            { id: 'Control', label: 'Governance', icon: '🛡️' },
            { id: 'CashFlow', label: 'Liquidity', icon: '🌊' },
            { id: 'Automation', label: 'Neural Inbox', icon: '⚡' },
            { id: 'Expenses', label: 'OpEx', icon: '🧾' },
            { id: 'PnL', label: 'P&L', icon: '📉' },
            { id: 'BalanceSheet', label: 'Position', icon: '🏛️' },
            { id: 'Search', label: 'Audit', icon: '🔍' },
            { id: 'Journal', label: 'Vouchers', icon: '✍️' },
            { id: 'Recon', label: 'Recon', icon: '✅' },
            { id: 'Tax', label: 'Statutory', icon: '🛡️' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-900 shadow-xl scale-105' : 'text-indigo-300 hover:text-white hover:bg-white/5'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="animate-fadeIn">
        {activeTab === 'Command' && (
          <FinanceCommandCenter 
            {...props} 
            syncStatus={syncStatus}
          />
        )}
        {activeTab === 'CFOAnalysis' && (
          <CFOAnalysis 
            {...props}
          />
        )}
        {activeTab === 'COA' && (
          <ChartOfAccounts 
            transactions={transactions} 
            accountGroups={props.accountGroups} 
            ingredients={props.ingredients} 
            skus={props.skus}
            currency={currency} 
          />
        )}
        {activeTab === 'Costing' && (
          <CostAccountantHub {...props} />
        )}
        {activeTab === 'Control' && (
          <FinancialControlCenter 
            {...props}
          />
        )}
        {activeTab === 'Automation' && <NeuralBookkeepingInbox transactions={transactions} setTransactions={setTransactions} accountGroups={props.accountGroups} currency={currency} />}
        {activeTab === 'Expenses' && <ExpenseLedger transactions={transactions} setTransactions={setTransactions} budgets={props.budgets} skus={props.skus} accountGroups={props.accountGroups} setAccountGroups={props.setAccountGroups} />}
        
        {activeTab === 'Search' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
                <input 
                  autoFocus
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2rem font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner transition-all" 
                  placeholder="Search ledger records..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                           <th className="px-10 py-6">Date / Reference</th>
                           <th className="px-6 py-6">Account</th>
                           <th className="px-6 py-6">Category</th>
                           <th className="px-10 py-6 text-right">Magnitude</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {filteredTransactions.slice(0, 100).map(t => (
                          <tr key={t.id} className={`hover:bg-indigo-50/10 transition-colors ${t.auditRisk === 'High' ? 'bg-rose-50/30' : ''}`}>
                             <td className="px-10 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="text-[11px] font-bold text-slate-900 uppercase">{new Date(t.date).toLocaleDateString()}</div>
                                    {t.auditRisk === 'High' && <span className="bg-rose-600 text-white text-[7px] px-2 py-0.5 rounded font-black animate-pulse">RISK</span>}
                                </div>
                                <div className="text-[8px] font-mono text-slate-400">{t.description}</div>
                             </td>
                             <td className="px-6 py-5">
                                <span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black text-slate-600 uppercase">{t.account}</span>
                             </td>
                             <td className="px-6 py-5">
                                <span className="text-[10px] font-black text-indigo-600 uppercase">{t.category}</span>
                             </td>
                             <td className={`px-10 py-5 text-right font-mono font-black text-sm ${t.type === 'Debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {t.type === 'Debit' ? '-' : '+'}{currency.format(t.amount)}
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'PnL' && (
          <div className="space-y-8 animate-fadeIn">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-12">
                   <div className="flex justify-between items-center border-b pb-6 border-slate-50">
                      <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Operating Performance</h3>
                      <button onClick={handleRunDepreciation} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Post Depreciation</button>
                   </div>
                   <div className="space-y-8">
                      <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                         <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">Net Sales Value (NSV)</span>
                            <div className="text-3xl font-mono font-black text-slate-900">{currency.format(pnLData.revenue)}</div>
                         </div>
                         <span className="text-xs font-black text-slate-300 uppercase">100.0%</span>
                      </div>

                      <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                         <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">Materials (COGS)</span>
                            <div className="text-xl font-mono font-black text-rose-600">-{currency.format(pnLData.materialCogs)}</div>
                         </div>
                         <span className="text-xs font-black text-rose-400 uppercase">-{ (pnLData.revenue > 0 ? (pnLData.materialCogs/pnLData.revenue)*100 : 0).toFixed(1) }%</span>
                      </div>

                      <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-3xl">
                         <span className="text-sm font-black text-indigo-900 uppercase tracking-widest">Gross Industrial Margin</span>
                         <div className="text-right">
                            <div className="text-3xl font-mono font-black text-indigo-900">{currency.format(pnLData.grossProfit)}</div>
                            <span className="text-xs font-black text-indigo-400 uppercase">{pnLData.grossMargin.toFixed(1)}% Yield</span>
                         </div>
                      </div>

                      <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                         <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">Total Operating Expenses (OpEx)</span>
                            <div className="text-xl font-mono font-black text-rose-600">-{currency.format(pnLData.operationalExpenses)}</div>
                         </div>
                         <span className="text-xs font-black text-rose-400 uppercase">-{pnLData.expenseRatio.toFixed(1)}%</span>
                      </div>

                      <div className="flex justify-between items-center pt-10 border-t-4 border-slate-900">
                         <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">Earnings Before Tax (EBT)</span>
                         <div className="text-right">
                            <div className={`text-4xl font-mono font-black ${pnLData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currency.format(pnLData.netProfit)}</div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Surplus: {pnLData.netMargin.toFixed(1)}%</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                   <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-center text-center space-y-4 h-fit border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest relative z-10">Industrial Efficiency Score</div>
                      <div className="text-7xl font-mono font-black text-amber-400 relative z-10">
                         {pnLData.grossMargin.toFixed(0)}%
                      </div>
                      <p className="text-[8px] text-indigo-200 opacity-60 uppercase font-bold tracking-widest relative z-10">Material-to-Revenue Alpha</p>
                   </div>
                   <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 flex flex-col gap-4">
                        <div className="text-3xl">📊</div>
                        <h4 className="text-lg font-bold text-indigo-900 font-serif uppercase">Vertical Common-Size Audit</h4>
                        <p className="text-xs text-indigo-700 leading-relaxed italic">
                            "By analyzing every expense as a percentage of Net Sales Value (NSV), we can spot 'Industrial Weight' issues. If your OpEx exceeds 30% of revenue, your fixed burden is likely too high for the current production volume."
                        </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'Journal' && <GeneralJournal transactions={transactions} setTransactions={setTransactions} currency={currency} />}
        {activeTab === 'Recon' && <BankReconciliation transactions={transactions} setTransactions={setTransactions} currency={currency} />}
        {activeTab === 'CashFlow' && <CashFlowHub {...props} />}
        {activeTab === 'Tax' && <TaxHub {...props} />}
        {activeTab === 'Budget' && <BudgetingPlanner {...props} />}
      </div>
    </div>
  );
};

export default ManagementAccountant;
