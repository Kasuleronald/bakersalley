
import React, { useState } from 'react';
import { ProductionLog, Asset, Order, Employee } from '../types';
import { analyzeFloorProductivity } from '../services/geminiService';

interface ProcessOptimizerProps {
  logs: ProductionLog[];
  assets: Asset[];
  orders: Order[];
  employees: Employee[];
}

const ProcessOptimizer: React.FC<ProcessOptimizerProps> = ({ logs, assets, orders, employees }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleRunAudit = async (intent: string) => {
    setIsAuditing(true);
    const result = await analyzeFloorProductivity({ logs, assets, orders, employees });
    if (result) setReport(result);
    setIsAuditing(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-slate-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5 flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4 max-w-xl">
           <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Neural Process Auditor</h3>
           <p className="text-indigo-100 text-lg italic leading-relaxed">
             "Optimizing for 99% floor realization. Correlating shift logs and machine downtime to suggest high-impact sequence changes and loss prevention tactics."
           </p>
        </div>
        <button 
          onClick={() => handleRunAudit("Optimize shift throughput and minimize material scrap")}
          disabled={isAuditing}
          className={`relative z-10 px-12 py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all ${isAuditing ? 'bg-indigo-900 text-indigo-400 animate-pulse' : 'bg-white text-slate-900 hover:bg-amber-400 active:scale-95'}`}
        >
          {isAuditing ? 'Auditing Shift Data...' : '⚡ Execute Floor Audit'}
        </button>
      </div>

      {report ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-softFade">
           <div className="lg:col-span-7 space-y-8">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <h4 className="text-xl font-bold font-serif text-slate-900 uppercase">Productivity Directives</h4>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">Gain Target: {report.projectedMarginGain}</span>
                 </div>
                 <div className="space-y-4">
                    {report.productivityDirectives.map((d: any, i: number) => (
                      <div key={i} className={`p-6 rounded-[2rem] border transition-all flex flex-col gap-3 ${d.impact === 'High' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                         <div className="flex justify-between items-center">
                            <span className="font-black text-slate-900 text-xs uppercase tracking-tight">{d.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${d.impact === 'High' ? 'bg-indigo-900 text-white' : 'bg-white text-slate-400'}`}>{d.impact} IMPACT</span>
                         </div>
                         <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{d.action}"</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
                 <h4 className="text-lg font-bold font-serif text-amber-400 uppercase mb-6 relative z-10">Resource Re-Allocation</h4>
                 <div className="space-y-3 relative z-10">
                    {report.resourceOptimizations.map((opt: string, i: number) => (
                      <div key={i} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                         <span className="w-6 h-6 bg-amber-400 text-slate-900 rounded-lg flex items-center justify-center text-xs font-black shrink-0">{i+1}</span>
                         <span className="text-sm font-medium text-indigo-100 italic">"{opt}"</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 space-y-8">
              <div className="bg-rose-950 p-10 rounded-[3.5rem] text-white shadow-2xl border border-rose-900 flex flex-col justify-center h-full">
                 <div className="text-5xl mb-6">📉</div>
                 <h4 className="text-xl font-bold font-serif text-rose-300 uppercase mb-4">Loss Prevention Audit</h4>
                 <div className="space-y-6">
                    {report.lossPreventionTactics.map((t: any, i: number) => (
                      <div key={i} className="space-y-2">
                         <div className="font-black text-xs uppercase text-white">{t.title}</div>
                         <p className="text-xs text-rose-100/70 leading-relaxed italic">"{t.logic}"</p>
                      </div>
                    ))}
                 </div>
                 <div className="pt-8 mt-8 border-t border-rose-900">
                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Diagnosed Bottleneck</div>
                    <div className="text-lg font-bold text-white uppercase tracking-tight">"{report.bottleneckDiagnosis}"</div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 opacity-40 grayscale">
           <div className="text-8xl mb-6">⚙️</div>
           <h4 className="text-xl font-bold font-serif text-slate-400 uppercase tracking-widest">Auditor Idle</h4>
           <p className="text-sm text-slate-300 max-w-sm mx-auto mt-2 italic">Initiate a shift audit to generate real-time productivity recommendations.</p>
        </div>
      )}
    </div>
  );
};

export default ProcessOptimizer;
