
import React, { useState } from 'react';
import { SKU, TroubleshootingLog } from '../types';
import { getTroubleshootingAdvice } from '../services/geminiService';

interface TroubleshootingHubProps {
  skus: SKU[];
  logs: TroubleshootingLog[];
  setLogs: (logs: TroubleshootingLog[]) => void;
}

const TroubleshootingHub: React.FC<TroubleshootingHubProps> = ({ skus, logs, setLogs }) => {
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [defectDesc, setDefectDesc] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeDiagnosis, setActiveDiagnosis] = useState<any | null>(null);

  const handleRunDiagnostic = async () => {
    if (!selectedSkuId || !defectDesc) return;
    setIsAnalyzing(true);
    const sku = skus.find(s => s.id === selectedSkuId);
    const result = await getTroubleshootingAdvice(defectDesc, sku?.name || 'General Batch');
    if (result) {
      setActiveDiagnosis(result);
    }
    setIsAnalyzing(false);
  };

  const handleCommitLog = () => {
    if (!activeDiagnosis) return;
    const log: TroubleshootingLog = {
      id: `rca-${Date.now()}`,
      timestamp: new Date().toISOString(),
      skuId: selectedSkuId,
      defectDescription: defectDesc,
      aiDiagnosis: activeDiagnosis.diagnosis,
      remedialActions: activeDiagnosis.remedialActions
    };
    setLogs([log, ...logs]);
    setSelectedSkuId('');
    setDefectDesc('');
    setActiveDiagnosis(null);
    alert("Diagnostic archived in Production History.");
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Production Diagnostic Hub</h3>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time Batch Troubleshooting • Root Cause Analysis</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
           <h4 className="text-xl font-bold font-serif text-slate-900">Incident Intake</h4>
           <div className="space-y-6">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Affected Product</label>
                 <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={selectedSkuId} onChange={e => setSelectedSkuId(e.target.value)}>
                    <option value="">Choose item...</option>
                    {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Defect Observation</label>
                 <textarea 
                  className="w-full p-6 bg-slate-50 border-none rounded-3xl font-medium text-sm h-32 outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g. Crust is too dark while the center is doughy. Bottom of loaf is damp."
                  value={defectDesc}
                  onChange={e => setDefectDesc(e.target.value)}
                 />
              </div>
              <button 
                onClick={handleRunDiagnostic}
                disabled={isAnalyzing || !defectDesc}
                className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl transition-all ${isAnalyzing ? 'bg-indigo-100 text-indigo-400 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black'}`}
              >
                {isAnalyzing ? 'Running Neural Audit...' : '🧠 Run Diagnostic'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
           {activeDiagnosis ? (
             <div className="space-y-6 animate-fadeIn">
                <div className="bg-indigo-50 p-10 rounded-[4rem] border border-indigo-100 shadow-sm space-y-6">
                   <div className="flex items-center gap-4">
                      <span className="text-4xl">🔬</span>
                      <h3 className="text-xl font-bold font-serif text-indigo-900">Expert Diagnosis</h3>
                   </div>
                   <p className="text-sm text-indigo-800 leading-relaxed italic border-l-4 border-indigo-200 pl-6">
                      "{activeDiagnosis.diagnosis}"
                   </p>
                   
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Recommended Remedial Actions</h4>
                      <div className="space-y-2">
                         {activeDiagnosis.remedialActions.map((action: string, i: number) => (
                           <div key={i} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-indigo-50">
                              <span className="w-8 h-8 bg-indigo-900 text-white rounded-lg flex items-center justify-center text-xs font-black">{i+1}</span>
                              <span className="text-xs font-bold text-slate-700">{action}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <button 
                    onClick={handleCommitLog}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all mt-6"
                   >
                     Commit to Production History
                   </button>
                </div>
             </div>
           ) : (
             <div className="h-full py-32 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-6">
                <div className="text-6xl grayscale opacity-20">🧬</div>
                <p className="text-sm text-slate-400 max-w-xs italic leading-relaxed">
                   "Identify batch errors early. Our Diagnostic Engine uses industrial baking principles (Bakerpedia context) to identify if your issue is caused by proofing time, hydration, or oven hotspots."
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingHub;
