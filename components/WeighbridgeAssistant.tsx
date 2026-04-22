
import React, { useState } from 'react';
import { WeighbridgeTicket, Ingredient, SKU } from '../types';
import { analyzeWeighbridgeIntegrity } from '../services/geminiService';

interface WeighbridgeAssistantProps {
  tickets: WeighbridgeTicket[];
  ingredients: Ingredient[];
  skus: SKU[];
  currency: { format: (v: number) => string };
}

const WeighbridgeAssistant: React.FC<WeighbridgeAssistantProps> = ({ tickets, ingredients, skus, currency }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleRunAudit = async () => {
    setIsAnalyzing(true);
    const result = await analyzeWeighbridgeIntegrity(tickets, ingredients, skus);
    if (result) setReport(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4">
           <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Neural Mass Auditor</h3>
           <p className="text-indigo-100 text-lg max-w-xl italic">
             "Analyze flow patterns across the weighbridge. Detecting shrinkage trends and supplier fraud by correlating physical mass reality against manifest claims."
           </p>
        </div>
        <button 
          onClick={handleRunAudit}
          disabled={isAnalyzing}
          className={`relative z-10 px-12 py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all ${isAnalyzing ? 'bg-white/10 text-indigo-400 animate-pulse' : 'bg-white text-slate-900 hover:bg-amber-400'}`}
        >
          {isAnalyzing ? 'Processing Patterns...' : '🧠 Run Neural Integrity Audit'}
        </button>
      </div>

      {report ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-softFade">
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mass flow integrity</div>
                 <div className={`text-7xl font-mono font-black ${report.integrityScore > 90 ? 'text-emerald-600' : report.integrityScore > 70 ? 'text-amber-500' : 'text-rose-600'}`}>
                    {report.integrityScore}%
                 </div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase mt-4 max-w-[180px]">Derived from Variance Drift and DoA Overrides</p>
              </div>
              <div className={`p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center ${report.leakageWarning.includes('Critical') ? 'bg-rose-900' : 'bg-indigo-900'}`}>
                 <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4">Integrity Verdict</h4>
                 <p className="text-sm text-indigo-100 leading-relaxed italic italic">"{report.leakageWarning}"</p>
              </div>
           </div>

           <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                 <h4 className="text-xl font-bold font-serif text-slate-900 mb-8 uppercase tracking-tighter">Statistical Fraud Detectors</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.highRiskEntities.map((item: any, idx: number) => (
                      <div key={idx} className={`p-6 rounded-[2.5rem] border transition-all ${item.riskLevel === 'Critical' ? 'bg-rose-50 border-rose-100 ring-4 ring-rose-50' : 'bg-slate-50 border-slate-100'}`}>
                         <div className="flex justify-between items-start mb-4">
                            <span className="font-black text-slate-900 text-sm uppercase">{item.entity}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.riskLevel === 'Critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>{item.riskLevel} RISK</span>
                         </div>
                         <p className="text-[11px] text-slate-600 leading-relaxed font-medium">"{item.pattern}"</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[3.5rem] border border-slate-100">
                 <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 border-b pb-4">Security Directives</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.tacticalDirectives.map((d: string, i: number) => (
                       <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                          <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-xs text-indigo-900 font-black shrink-0">{i+1}</span>
                          <span className="text-[11px] font-bold text-slate-700 leading-relaxed">{d}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
           <div className="text-8xl mb-6 opacity-20 grayscale">⚖️</div>
           <h4 className="text-2xl font-bold font-serif text-slate-300 uppercase tracking-widest">Neural Auditor Idle</h4>
           <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2 italic leading-relaxed">
             Run the audit to correlate historical Tare weights and spot suppliers who consistently under-deliver by "safe" margins.
           </p>
        </div>
      )}
    </div>
  );
};

export default WeighbridgeAssistant;
