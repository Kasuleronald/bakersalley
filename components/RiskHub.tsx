import React, { useState, useMemo } from 'react';
import { RiskItem, RiskReport, Ingredient, Asset, Loan, SupplierInvoice, Sale, Employee } from '../types';
import { analyzeRiskProfile } from '../services/geminiService';
import ModuleAiInteraction from './ModuleAiInteraction';

interface RiskHubProps {
  ingredients: Ingredient[];
  assets: Asset[];
  loans: Loan[];
  invoices: SupplierInvoice[];
  sales: Sale[];
  employees: Employee[];
}

const CATEGORY_ICONS = {
  'Supply Chain': '📦',
  'Financial': '💰',
  'Operational': '⚙️',
  'Compliance': '🛡️',
  'Personnel': '👥'
};

const RiskHub: React.FC<RiskHubProps> = ({ ingredients, assets, loans, invoices, sales, employees }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<RiskReport | null>(null);
  const [stressScenario, setStressScenario] = useState<string | null>(null);
  const [mitigatedIds, setMitigatedIds] = useState<string[]>([]);

  const handleGenerateReport = async (intent: string) => {
    setIsAnalyzing(true);
    const data = { ingredients, assets, loans, invoices, sales, employees };
    const result = await analyzeRiskProfile(data, intent);
    if (result) {
      setReport({
        timestamp: new Date().toISOString(),
        overallScore: result.overallScore,
        criticalRisks: result.criticalRisks,
        mitigationStrategy: result.mitigationStrategy
      });
    }
    setIsAnalyzing(false);
  };

  const handleMitigate = (id: string) => {
    setMitigatedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const SCENARIOS = [
    { id: 'grid', label: 'Total Grid Failure', impact: -25, description: 'Simulates 72hrs on diesel backup + high fuel burn.' },
    { id: 'wheat', label: 'Flour Price Spike (30%)', impact: -15, description: 'Market surge in raw material costs.' },
    { id: 'debtor', label: 'Wholesale Default', impact: -20, description: 'Simulates UGX 10M cash flow evaporation.' }
  ];

  const simulatedScore = useMemo(() => {
    if (!report) return null;
    const scenarioImpact = SCENARIOS.find(s => s.id === stressScenario)?.impact || 0;
    const mitigationBonus = mitigatedIds.length * 5; 
    return Math.min(100, Math.max(0, report.overallScore + scenarioImpact + mitigationBonus));
  }, [report, stressScenario, mitigatedIds]);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header>
        <h2 className="text-3xl font-bold text-gray-900 font-serif">Strategic Resilience Hub</h2>
        <p className="text-gray-500 font-medium text-sm">Industrial Uptime & Strategic Threat Mitigation.</p>
      </header>

      <ModuleAiInteraction 
        title="Resilience Auditor"
        theme="rose"
        isLoading={isAnalyzing}
        onExecute={handleGenerateReport}
        suggestions={[
          "Audit impact of a 50% fuel price hike",
          "Simulate a national lockdown supply block",
          "Identify risks in the 90-day aged debt"
        ]}
        placeholder="e.g. 'How would the business survive if our top 3 wholesale partners stopped paying for 60 days?'"
      />

      {report && (
        <div className="space-y-8 animate-fadeIn">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                 <div className="relative mb-6 group">
                    <div className="absolute -inset-4 bg-indigo-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <svg className="w-48 h-48 transform -rotate-90 relative z-10">
                       <circle className="text-slate-100" strokeWidth="16" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" />
                       <circle 
                        className={simulatedScore! > 70 ? "text-emerald-500" : simulatedScore! > 40 ? "text-amber-500" : "text-rose-500"} 
                        strokeWidth="16" 
                        strokeDasharray={2 * Math.PI * 80} 
                        strokeDashoffset={2 * Math.PI * 80 * (1 - simulatedScore! / 100)} 
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="transparent" r="80" cx="96" cy="96" 
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90 relative z-20">
                       <span className="text-5xl font-black font-mono text-slate-900">{simulatedScore}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resilience</span>
                    </div>
                 </div>
                 {mitigatedIds.length > 0 && <div className="text-[9px] font-black text-emerald-600 uppercase mb-2">+{mitigatedIds.length * 5} Mitigation Bonus Active</div>}
                 <p className="text-xs text-slate-500 italic leading-relaxed px-4">
                    {simulatedScore! > 70 ? "Operational Nominals: Safe." : "Strategic Warning: Resilience Compromised."}
                 </p>
              </div>

              <div className="lg:col-span-8 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
                 <h3 className="text-2xl font-bold font-serif text-amber-400 mb-8 relative z-10 flex items-center gap-3">
                    <span>🌊</span> Stress Simulator
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {SCENARIOS.map(s => (
                      <button 
                       key={s.id}
                       onClick={() => setStressScenario(stressScenario === s.id ? null : s.id)}
                       className={`p-6 rounded-[2rem] border transition-all text-left group ${stressScenario === s.id ? 'bg-rose-600 border-rose-400 shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                         <div className="font-black text-xs uppercase mb-2 group-hover:text-amber-300">{s.label}</div>
                         <p className="text-[10px] text-white/50 leading-relaxed">{s.description}</p>
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-6">Critical Risk Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {report.criticalRisks.map(risk => {
                    const isMitigated = mitigatedIds.includes(risk.id);
                    return (
                       <div key={risk.id} className={`bg-white p-6 rounded-3xl border transition-all flex items-start gap-6 group ${isMitigated ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 shadow-sm hover:border-indigo-100'}`}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${isMitigated ? 'bg-emerald-100 grayscale-0' : 'bg-slate-50 grayscale opacity-40'}`}>
                             {CATEGORY_ICONS[risk.category as keyof typeof CATEGORY_ICONS] || '⚠️'}
                          </div>
                          <div className="flex-1 space-y-2">
                             <div className="flex justify-between items-center">
                                <h4 className={`font-bold text-slate-900 ${isMitigated ? 'line-through opacity-40' : ''}`}>{risk.title}</h4>
                                <button 
                                  onClick={() => handleMitigate(risk.id)}
                                  className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${isMitigated ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700'}`}
                                >
                                  {isMitigated ? 'Mitigated' : 'Commit to Action'}
                                </button>
                             </div>
                             <p className="text-[11px] text-slate-500 italic leading-relaxed">{risk.description}</p>
                             {!isMitigated && (
                               <div className="mt-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-[10px] text-indigo-900 font-bold leading-relaxed">
                                  <span className="text-indigo-400 uppercase block mb-1">Direct Mitigation Plan:</span>
                                  {risk.mitigation}
                               </div>
                             )}
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RiskHub;