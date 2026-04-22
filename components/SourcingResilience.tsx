
import React, { useState, useMemo } from 'react';
import { Ingredient, Supplier, SourcingResilienceReport } from '../types';
import { runSourcingResilienceAudit } from '../services/geminiService';

interface SourcingResilienceProps {
  ingredients: Ingredient[];
  suppliers: Supplier[];
}

const SourcingResilience: React.FC<SourcingResilienceProps> = ({ ingredients, suppliers }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<SourcingResilienceReport | null>(null);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    const result = await runSourcingResilienceAudit(ingredients, suppliers);
    if (result) setReport(result);
    setIsAuditing(false);
  };

  const vulnerabilityMap = useMemo(() => {
      return ingredients.map(ing => {
          const vendorCount = suppliers.filter(s => s.category === ing.category || s.type === ing.category).length;
          const riskLevel = vendorCount <= 1 ? 'Critical' : vendorCount === 2 ? 'Warning' : 'Healthy';
          return { name: ing.name, vendorCount, riskLevel };
      }).sort((a,b) => a.vendorCount - b.vendorCount).slice(0, 12);
  }, [ingredients, suppliers]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4 max-w-xl">
           <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase">Network Resilience Audit</h3>
           <p className="text-indigo-100 text-lg max-w-xl italic">
             "SAP Standard: Moving from linear supply lines to networked resilience. Analyze your raw material dependency to detect single-source bottlenecks before they freeze production."
           </p>
        </div>
        <button 
          onClick={handleRunAudit}
          disabled={isAuditing}
          className={`relative z-10 px-10 py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all ${isAuditing ? 'bg-indigo-800 text-indigo-400 animate-pulse' : 'bg-white text-slate-900 hover:bg-emerald-400'}`}
        >
          {isAuditing ? 'Auditing Network...' : '🧠 Run Resilience Audit'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Diversification Score</div>
                <div className={`text-7xl font-mono font-black ${report ? (report.diversificationScore > 70 ? 'text-emerald-600' : 'text-amber-500') : 'text-slate-100'}`}>
                    {report ? `${report.diversificationScore}%` : '--'}
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-4 max-w-[180px]">Weighted against critical bakery staples</p>
            </div>
            
            <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center text-center">
                 <div className="text-3xl mb-4">🛡️</div>
                 <p className="text-[10px] text-indigo-100 leading-relaxed italic">"SAP recommendation: Maintain a Minimum 2+1 sourcing strategy (2 Local, 1 regional/backup) for flour, yeast, and fuel to achieve 99.9% production uptime."</p>
            </div>
        </div>

        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
            <h4 className="text-xl font-bold font-serif text-slate-900 mb-8 uppercase tracking-tighter">Vulnerability Heatmap</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vulnerabilityMap.map((item, idx) => (
                    <div key={idx} className={`p-6 rounded-3xl border transition-all ${item.riskLevel === 'Critical' ? 'bg-rose-50 border-rose-200' : item.riskLevel === 'Warning' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="text-[9px] font-black uppercase text-slate-400 mb-2">{item.riskLevel} Risk</div>
                        <div className="font-black text-xs uppercase text-slate-900 truncate mb-4">{item.name}</div>
                        <div className="flex justify-between items-end">
                            <span className="text-[7px] font-bold text-slate-500 uppercase">Vendor Depth</span>
                            <span className="text-xl font-mono font-black text-slate-900">{item.vendorCount}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {report && (
        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm animate-softFade">
            <h4 className="text-xl font-bold font-serif text-slate-900 mb-10 uppercase tracking-tighter">Strategic Procurement Directives</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.criticalShortfalls.map((item, idx) => (
                   <div key={idx} className={`p-6 rounded-[2.5rem] border transition-all ${item.riskLevel === 'Critical' ? 'bg-rose-50 border-rose-100 ring-4 ring-rose-50' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex justify-between items-start mb-4">
                         <span className="font-black text-slate-900 text-sm uppercase">{item.ingredientName}</span>
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.riskLevel === 'Critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>{item.riskLevel} RISK</span>
                      </div>
                      <div className="flex justify-between items-end">
                         <div className="text-[10px] text-slate-500 font-bold leading-relaxed">
                            Alternative Sources Required:
                         </div>
                         <div className="text-2xl font-mono font-black text-slate-900">{item.alternativeSuppliersNeeded}</div>
                      </div>
                   </div>
                 ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default SourcingResilience;
