
import React, { useState, useEffect } from 'react';
import { SKU, Sale, ReturnLog, SalesAgent, Outlet } from '../types';
import { analyzeSalesProductivity } from '../services/geminiService';
import ModuleAiInteraction from './ModuleAiInteraction';

interface SalesStrategyAuditProps {
  sales: Sale[];
  skus: SKU[];
  agents: SalesAgent[];
  outlets: Outlet[];
  returnLogs: ReturnLog[];
  currency: { format: (v: number) => string };
}

const SalesStrategyAudit: React.FC<SalesStrategyAuditProps> = ({ sales, skus, agents, outlets, returnLogs, currency }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleRunAudit = async (intent: string) => {
    setIsAnalyzing(true);
    const result = await analyzeSalesProductivity({
      sales,
      skus,
      agents,
      outlets,
      returns: returnLogs,
      intent
    });
    if (result) setReport(result);
    setIsAnalyzing(false);
  };

  // Automatically trigger productivity audit on component mount
  useEffect(() => {
    handleRunAudit("Initial productivity and loss minimization audit");
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      <ModuleAiInteraction 
        title="Commercial Productivity Auditor"
        theme="indigo"
        isLoading={isAnalyzing}
        onExecute={handleRunAudit}
        suggestions={[
          "Analyze Cost-to-Serve per route",
          "Identify return-heavy SKUs",
          "Audit sales agent ROI",
          "Forecast weekend demand shifts"
        ]}
        response={report && (
          <div className="space-y-10 animate-softFade">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-8 bg-white/40 rounded-[3rem] border border-white/50 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Commercial Health Score</span>
                    <span className="text-4xl font-mono font-black text-indigo-900">{report.productivityScore}%</span>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-rose-600 uppercase">Primary Leakage Point</h5>
                    <p className="text-sm font-bold text-slate-800 italic">"{report.primaryLossDriver}"</p>
                  </div>
                  <div className="pt-6 border-t border-white/50">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase">Leakage Narrative</h5>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">{report.leakageAnalysis}</p>
                  </div>
               </div>

               <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl flex flex-col justify-center">
                  <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4">Strategic Synthesis</h4>
                  <p className="text-base text-indigo-100 leading-relaxed italic">"{report.strategyNarrative}"</p>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Priority Tactical Adjustments</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {report.recommendations?.map((rec: any, i: number) => (
                    <div key={i} className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between h-full ${
                      rec.impact === 'High' ? 'bg-indigo-900 border-indigo-700 text-white shadow-xl' : 'bg-white border-slate-100 shadow-sm'
                    }`}>
                       <div>
                          <div className="flex justify-between items-center mb-3">
                             <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                               rec.impact === 'High' ? 'bg-amber-400 text-slate-900' : 'bg-indigo-50 text-indigo-600'
                             }`}>{rec.impact} Impact</span>
                             <span className="text-[8px] font-black uppercase opacity-40">{rec.category}</span>
                          </div>
                          <p className={`text-xs font-bold leading-relaxed ${rec.impact === 'High' ? 'text-indigo-100' : 'text-slate-800'}`}>
                             {rec.action}
                          </p>
                       </div>
                       <button className={`mt-6 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                         rec.impact === 'High' ? 'bg-white text-indigo-900 hover:bg-amber-400' : 'bg-slate-900 text-white hover:bg-indigo-600'
                       }`}>Draft Directive</button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
        placeholder="How can we optimize our retail routes for the next 7 days?"
      />

      <div className="p-12 bg-slate-900 rounded-[5rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-7xl opacity-30 grayscale shrink-0">📊</div>
         <div className="relative z-10 space-y-4">
            <h4 className="text-2xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Productivity & Loss Philosophy</h4>
            <p className="text-base text-indigo-100/90 leading-relaxed max-w-4xl italic">
              "Industrial sales productivity is not just about revenue; it's about the quality of that revenue. A sale that incurs a 5% commission and a 10% return rate is technically a loss when accounting for logistics fuel. The **Neural Sales Auditor** correlates your agent effort against actual cash realization to ensure your resource allocation is focused on high-yield partners, not just high-volume ones."
            </p>
         </div>
      </div>
    </div>
  );
};

export default SalesStrategyAudit;
