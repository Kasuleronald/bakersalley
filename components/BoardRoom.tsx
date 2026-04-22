
import React, { useState, useMemo } from 'react';
import { BoardDirective, User, Sale, Transaction, Order, SKU, Ingredient, ProductionLog, InventoryLoss, Asset, Loan, SupplierInvoice, TaxConfig } from '../types';
import { generateExecutiveBoardBrief } from '../services/geminiService';
import ExecutiveDirectiveHub from './ExecutiveDirectiveHub';

interface BoardRoomProps {
  sales: Sale[];
  transactions: Transaction[];
  orders: Order[];
  skus: SKU[];
  ingredients: Ingredient[];
  productionLogs: ProductionLog[];
  inventoryLosses: InventoryLoss[];
  assets: Asset[];
  loans: Loan[];
  invoices: SupplierInvoice[];
  taxConfig: TaxConfig;
  directives: BoardDirective[];
  setDirectives: (d: BoardDirective[]) => void;
  currentUser: User;
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

const BoardRoom: React.FC<BoardRoomProps> = ({ 
  sales, transactions, orders, skus, ingredients, productionLogs, inventoryLosses, assets, loans, invoices, taxConfig, directives, setDirectives, currentUser, currency 
}) => {
  const [activeTab, setActiveTab] = useState<'Summary' | 'Directives' | 'Risk' | 'Governance'>('Summary');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalRev = sales.reduce((s, x) => s + x.totalPrice, 0);
    const materialCogs = productionLogs.reduce((acc, log) => acc + (log.materialCost || 0), 0);
    const opEx = transactions.filter(t => t.type === 'Debit' && t.category === 'Expense').reduce((s, x) => s + x.amount, 0);
    const ebitda = totalRev - materialCogs - opEx;
    
    const cash = transactions.reduce((s, t) => t.type === 'Credit' ? s + t.amount : s - t.amount, 0);
    const ar = orders.reduce((s, o) => s + (o.totalPrice - o.totalPaid), 0);
    const ap = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    const netLiquidity = cash + ar - ap;

    return { totalRev, materialCogs, opEx, ebitda, netLiquidity, cash };
  }, [sales, productionLogs, transactions, orders, invoices]);

  const handleRunAiBrief = async () => {
    setIsAiLoading(true);
    const context = {
      financials: { revenue: stats.totalRev, ebitda: stats.ebitda, cash: stats.cash },
      riskProfile: 'Medium-High', // Simulated based on logic
      complianceScore: 88,
      nsvGrowth: 12.4
    };
    const brief = await generateExecutiveBoardBrief(context);
    setAiBrief(brief);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-amber-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter text-amber-400">Board Room Platform</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Executive Governance • Strategic Directives • Closed-Loop Audit</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10">
          {['Summary', 'Directives', 'Risk', 'Governance'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
          ))}
        </div>
      </header>

      {activeTab === 'Summary' && (
        <div className="space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operating Result (EBITDA)</div>
                 <div className={`text-4xl font-mono font-black ${stats.ebitda >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currency.formatCompact(stats.ebitda)}</div>
                 <p className="text-[8px] text-slate-300 font-bold uppercase italic">Realized Margin Audit</p>
              </div>
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquidity Coverage</div>
                 <div className="text-4xl font-mono font-black text-indigo-900">{currency.formatCompact(stats.netLiquidity)}</div>
                 <p className="text-[8px] text-slate-300 font-bold uppercase italic">Cash + A/R - A/P</p>
              </div>
              <div className="bg-indigo-900 p-10 rounded-[3.5rem] text-white flex flex-col justify-center text-center shadow-2xl">
                 <div className="text-[10px] font-black text-amber-400 uppercase mb-2">Expansion Reserves</div>
                 <div className="text-4xl font-mono font-black">{currency.formatCompact(stats.totalRev * 0.1)}</div>
                 <span className="text-[7px] font-black uppercase mt-2 opacity-50">Locked Fortress Capital</span>
              </div>
           </div>

           <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden min-h-[400px]">
              <div className="flex justify-between items-center mb-8 border-b pb-6 border-slate-50">
                 <div>
                    <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Executive Intelligence Brief</h3>
                    <p className="text-xs text-slate-400 font-medium">Month-to-date strategic synthesis</p>
                 </div>
                 <button 
                  onClick={handleRunAiBrief}
                  disabled={isAiLoading}
                  className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all ${isAiLoading ? 'bg-indigo-50 text-indigo-300 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black'}`}
                 >
                    {isAiLoading ? 'Synthesizing...' : '🧠 Generate Board Brief'}
                 </button>
              </div>

              {aiBrief ? (
                <div className="prose prose-indigo max-w-none animate-fadeIn">
                   <div className="p-8 bg-indigo-50/30 rounded-[3rem] border border-indigo-100 italic font-medium leading-relaxed text-indigo-900">
                      {aiBrief.split('\n').map((para, i) => <p key={i} className="mb-4">{para}</p>)}
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-30 grayscale text-center space-y-4">
                   <div className="text-7xl">📈</div>
                   <p className="text-sm font-black uppercase tracking-widest max-w-xs">Run the Briefing engine to condense factory data for board consumption.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'Directives' && (
        <ExecutiveDirectiveHub 
          directives={directives} 
          setDirectives={setDirectives} 
          currentUser={currentUser} 
        />
      )}

      {activeTab === 'Risk' && (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center py-32 opacity-30 grayscale">
          <div className="text-8xl mb-6">🛡️</div>
          <h4 className="text-2xl font-bold font-serif uppercase tracking-widest text-slate-400">Board Level Risk Audit</h4>
          <p className="text-sm text-slate-300 max-w-sm mt-2 italic">Full supply chain dependency mapping and financial leverage analysis for directors.</p>
        </div>
      )}

      {activeTab === 'Governance' && (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center py-32 opacity-30 grayscale">
          <div className="text-8xl mb-6">✅</div>
          <h4 className="text-2xl font-bold font-serif uppercase tracking-widest text-slate-400">Statutory Assurance</h4>
          <p className="text-sm text-slate-300 max-w-sm mt-2 italic">Certification tracking for UNBS Q-Mark and URA EFRIS compliance status.</p>
        </div>
      )}
    </div>
  );
};

export default BoardRoom;
