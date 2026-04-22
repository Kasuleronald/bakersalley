import React, { useState, useMemo } from 'react';
import { Sale, Transaction, Order, Customer, SKU } from '../types';
import { performRevenueForensicAudit } from '../services/geminiService';
import ModuleAiInteraction from './ModuleAiInteraction';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface RevenueAssuranceHubProps {
  sales: Sale[];
  transactions: Transaction[];
  orders: Order[];
  customers: Customer[];
  skus: SKU[];
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
  // Added onNavigate to props interface to support intra-app navigation
  onNavigate: (tab: string) => void;
}

// Added onNavigate to destructuring assignment to fix scope error
const RevenueAssuranceHub: React.FC<RevenueAssuranceHubProps> = ({ sales, transactions, orders, customers, skus, currency, onNavigate }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);

  const metrics = useMemo(() => {
    const totalInvoiced = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.totalPrice, 0);
    const totalCashRealized = transactions.filter(t => t.type === 'Credit' && t.category === 'Sale').reduce((s, t) => s + t.amount, 0);
    const realizedGap = totalInvoiced - totalCashRealized;
    const realizationRatio = totalInvoiced > 0 ? (totalCashRealized / totalInvoiced) * 100 : 100;

    const partnerIntelligence = customers.map(c => {
      const custOrders = orders.filter(o => o.customerId === c.id);
      const custPayments = transactions.filter(t => t.referenceId === c.id || t.description.includes(c.name));
      const totalBilled = custOrders.reduce((s, o) => s + o.totalPrice, 0);
      const totalPaid = custPayments.reduce((s, p) => s + p.amount, 0);
      const balance = totalBilled - totalPaid;
      
      // Techno Brain Style Credit Score logic
      const paymentVelocity = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 100;
      const score = Math.round(paymentVelocity);

      return {
        id: c.id,
        name: c.name,
        balance,
        score,
        isAtRisk: score < 60 && balance > 500000
      };
    }).sort((a,b) => b.balance - a.balance);

    return { totalInvoiced, totalCashRealized, realizedGap, realizationRatio, partnerIntelligence };
  }, [sales, transactions, orders, customers]);

  const handleRunForensicAudit = async (intent: string) => {
    setIsAuditing(true);
    const result = await performRevenueForensicAudit({
      sales, transactions, orders, customers, intent
    });
    if (result) setAuditReport(result);
    setIsAuditing(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HUD: Assurance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl space-y-2">
           <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Realized Cash Portfolio</div>
           <div className="text-3xl font-mono font-black text-white">{currency.formatCompact(metrics.totalCashRealized)}</div>
           <p className="text-[8px] text-slate-500 font-bold uppercase italic">Funds verified in bank/drawer</p>
        </div>
        
        <div className={`p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center text-center ${metrics.realizationRatio < 80 ? 'bg-rose-900 animate-pulse' : 'bg-indigo-900'}`}>
           <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Assurance Ratio</div>
           <div className="text-4xl font-mono font-black">{metrics.realizationRatio.toFixed(1)}%</div>
           <p className="text-[8px] font-bold uppercase mt-2">Cash-to-Invoice Match</p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
           <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Unaccounted Gap</div>
           <div className="text-3xl font-mono font-black text-rose-600">{currency.formatCompact(metrics.realizedGap)}</div>
           <p className="text-[8px] text-slate-300 font-bold uppercase mt-2">Potential Revenue Leakage</p>
        </div>

        <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 shadow-sm text-center flex flex-col justify-center">
           <div className="text-[10px] font-black text-emerald-600 uppercase mb-2">Compliance Score</div>
           <div className="text-4xl font-mono font-black text-emerald-700">94.2</div>
           <p className="text-[8px] text-emerald-500 font-bold uppercase mt-2">Procedural Integrity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEADS TO ASSURANCE INTERACTION */}
        <div className="lg:col-span-8">
          <ModuleAiInteraction 
            title="Revenue Forensic Auditor"
            theme="indigo"
            isLoading={isAuditing}
            onExecute={handleRunForensicAudit}
            suggestions={[
              "Identify high-risk wholesale partners",
              "Audit leakage between dispatch and cash deposit",
              "Simulate impact of 5% late penalty on DSO",
              "Draft a revenue protection directive"
            ]}
            response={auditReport && (
              <div className="space-y-8 animate-softFade">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-8 bg-white/60 rounded-[3rem] border border-white/50 space-y-4">
                      <div className="text-[10px] font-black text-indigo-400 uppercase">Forensic Summary</div>
                      <p className="text-sm font-medium text-indigo-900 leading-relaxed italic">"{auditReport.auditVerdict}"</p>
                   </div>
                   <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-4">
                      <div className="text-[10px] font-black text-amber-400 uppercase">Critical Risks Identified</div>
                      <div className="flex flex-wrap gap-2">
                         {auditReport.highRiskPartners?.map((p: string) => (
                           <span key={p} className="bg-rose-500/20 text-rose-300 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-rose-500/30">⚠️ {p}</span>
                         ))}
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {auditReport.protectionMeasures?.map((m: any, i: number) => (
                     <div key={i} className="p-6 bg-indigo-900 text-white rounded-3xl border border-indigo-700">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[8px] font-black bg-amber-400 text-slate-900 px-2 py-0.5 rounded uppercase">{m.impact} IMPACT</span>
                        </div>
                        <h5 className="font-bold text-xs uppercase mb-2">{m.title}</h5>
                        <p className="text-[10px] text-indigo-200 leading-relaxed">{m.description}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}
            placeholder="How can we increase our cash realization ratio for top distributors?"
          />
        </div>

        {/* REVENUE VELOCITY RADAR */}
        <aside className="lg:col-span-4 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center">
           <h3 className="text-xl font-bold font-serif text-slate-900 mb-8 uppercase tracking-tighter">Partner Credit Health</h3>
           <div className="space-y-4 w-full">
              {metrics.partnerIntelligence.slice(0, 6).map(partner => (
                <div key={partner.id} className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${partner.isAtRisk ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                   <div>
                      <div className="font-black text-xs uppercase text-slate-800 truncate max-w-[120px]">{partner.name}</div>
                      <div className="text-[8px] font-black text-slate-400 uppercase">Internal Score: {partner.score}</div>
                   </div>
                   <div className="text-right">
                      <div className={`text-sm font-mono font-black ${partner.isAtRisk ? 'text-rose-600' : 'text-indigo-900'}`}>{currency.formatCompact(partner.balance)}</div>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                         <div className={`h-full ${partner.score > 80 ? 'bg-emerald-500' : partner.score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${partner.score}%` }}></div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
           <button onClick={() => onNavigate('customers')} className="mt-8 text-[10px] font-black text-indigo-600 uppercase hover:underline">View Full Partner Register →</button>
        </aside>
      </div>

      {/* INSTITUTIONAL PHILOSOPHY FOOTER */}
      <div className="p-12 bg-slate-900 rounded-[5rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-7xl opacity-30 grayscale shrink-0">🏛️</div>
         <div className="relative z-10 space-y-4">
            <h4 className="text-2xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Techno Brain Logic: Revenue Assurance</h4>
            <p className="text-base text-indigo-100/90 leading-relaxed max-w-4xl italic">
              "In professional Revenue Management, a sale is only complete when it is realized as cash in a bank account. **BakersAlley Revenue Assurance** adopts the forensic principles used by national authorities: identifying the gap between 'Paper Revenue' and 'Bank Realization.' By profiling wholesale distributors as 'Taxpayers' with automated credit scores, the system protects your liquidity from chronic debtors."
            </p>
         </div>
      </div>
    </div>
  );
};

export default RevenueAssuranceHub;