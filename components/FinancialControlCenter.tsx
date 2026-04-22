
import React, { useState, useMemo } from 'react';
import { Transaction, FinancialPeriod, AuditAnomaly, User, SKU, Sale, AccountType } from '../types';
import { performLedgerForensicAudit } from '../services/geminiService';
import ModuleAiInteraction from './ModuleAiInteraction';

interface FinancialControlCenterProps {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  skus: SKU[];
  sales: Sale[];
  currentUser: User;
  currency: { format: (v: number) => string };
}

const FinancialControlCenter: React.FC<FinancialControlCenterProps> = ({ 
  transactions, setTransactions, skus, sales, currentUser, currency 
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [closedPeriods, setClosedPeriods] = useState<FinancialPeriod[]>([]);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const isMonthClosed = useMemo(() => 
    closedPeriods.some(p => p.month === currentMonth && p.year === currentYear && p.isClosed),
    [closedPeriods, currentMonth, currentYear]
  );

  // Closing Readiness Check Logic
  const closingReadiness = useMemo(() => {
    const periodTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });

    const debits = periodTxs.filter(t => t.type === 'Debit').reduce((s, x) => s + x.amount, 0);
    const credits = periodTxs.filter(t => t.type === 'Credit').reduce((s, x) => s + x.amount, 0);
    const balanceGap = Math.abs(debits - credits);
    const unpostedJournals = periodTxs.filter(t => t.category === 'Journal' && !t.isCleared).length;

    return {
        isBalanced: balanceGap < 1,
        balanceGap,
        unpostedJournals,
        txCount: periodTxs.length,
        isReady: balanceGap < 1 && unpostedJournals === 0 && periodTxs.length > 0
    };
  }, [transactions, currentMonth, currentYear]);

  const handleRunForensicAudit = async (intent: string) => {
    setIsAuditing(true);
    const result = await performLedgerForensicAudit({
      transactions, sales, skus, intent
    });
    if (result) setAuditReport(result);
    setIsAuditing(false);
  };

  const handleCloseOperation = () => {
    if (!closingReadiness.isReady) {
        alert("CRITICAL: Period Closing Blocked. Ledger is out of balance or contains unposted journals. Resolve all variances before sealing.");
        return;
    }

    if (!window.confirm(`Locking ${currentMonth}/${currentYear} Ledger. Once closed, existing transactions for this period cannot be edited. Proceed?`)) return;
    
    const newPeriod: FinancialPeriod = {
      id: `period-${currentYear}-${currentMonth}`,
      month: currentMonth,
      year: currentYear,
      isClosed: true,
      closedBy: currentUser.name,
      closedAt: new Date().toISOString()
    };

    const lockedTxs = transactions.map(t => {
      const tDate = new Date(t.date);
      if (tDate.getMonth() + 1 === currentMonth && tDate.getFullYear() === currentYear) {
        return { ...t, isLocked: true };
      }
      return t;
    });

    setTransactions(lockedTxs);
    setClosedPeriods([...closedPeriods, newPeriod]);
    alert("Financial Period Closed. Governance active.");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl space-y-8 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
              <div className="relative z-10 space-y-2 text-center">
                 <h3 className="text-xl font-bold font-serif text-amber-400 uppercase tracking-widest">Period Control</h3>
                 <p className="text-[10px] text-indigo-300 font-black uppercase">Active Cycle: {currentMonth}/{currentYear}</p>
              </div>

              <div className="space-y-4 relative z-10">
                 <div className={`p-6 rounded-3xl border text-center transition-all ${isMonthClosed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Governance Status</div>
                    <div className={`text-2xl font-black uppercase tracking-tighter ${isMonthClosed ? 'text-emerald-400' : 'text-amber-400'}`}>
                       {isMonthClosed ? 'Period Sealed' : 'Open for Entry'}
                    </div>
                 </div>

                 {!isMonthClosed && (
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                       <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Closing Pre-Check</h4>
                       <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Ledger Balance</span>
                          <span className={closingReadiness.isBalanced ? "text-emerald-400" : "text-rose-400"}>
                             {closingReadiness.isBalanced ? "OK ✓" : `Mismatch: ${currency.format(closingReadiness.balanceGap)}`}
                          </span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Open Journals</span>
                          <span className={closingReadiness.unpostedJournals === 0 ? "text-emerald-400" : "text-rose-400"}>
                             {closingReadiness.unpostedJournals === 0 ? "None ✓" : `${closingReadiness.unpostedJournals} Pending`}
                          </span>
                       </div>
                    </div>
                 )}

                 {!isMonthClosed ? (
                    <button 
                      onClick={handleCloseOperation}
                      className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase shadow-xl transition-all active:scale-95 ${closingReadiness.isReady ? 'bg-indigo-600 text-white hover:bg-emerald-600' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                    >
                       Execute Month-End Close
                    </button>
                 ) : (
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center space-y-2">
                       <p className="text-[10px] text-emerald-300 italic">"Ledger immutability active. This period is locked for statutory reporting."</p>
                       <div className="text-[8px] font-bold text-emerald-500 uppercase">Authorized by {closedPeriods.find(p => p.month === currentMonth)?.closedBy}</div>
                    </div>
                 )}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="text-5xl mb-6">🛡️</div>
              <h4 className="text-lg font-bold font-serif text-slate-900 uppercase mb-2">Audit Readiness Score</h4>
              <div className="text-6xl font-mono font-black text-indigo-900 mb-2">
                 {auditReport?.integrityScore || 95}%
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                 Neural evaluation of material burn vs realization accuracy.
              </p>
           </div>
        </div>

        <div className="lg:col-span-8">
           <ModuleAiInteraction 
             title="Forensic Anomaly Scanner"
             theme="indigo"
             isLoading={isAuditing}
             onExecute={handleRunForensicAudit}
             suggestions={[
               "Scan for suspicious round-sum expenses",
               "Check sales vs master price drifts",
               "Audit fuel burn per batch round",
               "Validate deposit-to-sale matching"
             ]}
             placeholder="Focus the forensic audit on a specific area..."
             response={auditReport && (
               <div className="space-y-6 animate-softFade">
                  <div className="p-8 bg-white/40 rounded-[3rem] border border-white/50 space-y-4">
                     <div className="text-[10px] font-black text-indigo-600 uppercase">Executive Verdict</div>
                     <p className="text-sm font-medium text-slate-800 italic leading-relaxed">"{auditReport.verdict}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {auditReport.anomalies?.map((anomaly: any, idx: number) => (
                       <div key={idx} className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between ${
                         anomaly.severity === 'High' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
                       }`}>
                          <div>
                             <div className="flex justify-between items-center mb-3">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                                  anomaly.severity === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-400 text-slate-900'
                                }`}>{anomaly.severity} SEVERITY</span>
                                <span className="text-[8px] font-black uppercase text-slate-400">{anomaly.type}</span>
                             </div>
                             <p className="text-xs font-bold text-slate-800 leading-tight mb-2">{anomaly.description}</p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-black/5">
                             <div className="text-[8px] font-black uppercase text-indigo-600 mb-1">Recommended Correction:</div>
                             <p className="text-[10px] text-slate-600 italic">"{anomaly.remedy}"</p>
                          </div>
                       </div>
                     ))}
                     {(!auditReport.anomalies || auditReport.anomalies.length === 0) && (
                       <div className="col-span-2 py-10 text-center opacity-30 italic text-sm">No critical anomalies identified in this ledger sweep.</div>
                     )}
                  </div>
               </div>
             )}
           />
        </div>
      </div>
    </div>
  );
};

export default FinancialControlCenter;
