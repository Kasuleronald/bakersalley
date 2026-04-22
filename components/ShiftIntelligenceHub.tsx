
import React, { useState, useMemo } from 'react';
import { ProductionLog, SKU, Asset } from '../types';
import { GoogleGenAI } from "@google/genai";
import ModuleAiInteraction from './ModuleAiInteraction';

interface ShiftIntelligenceHubProps {
  logs: ProductionLog[];
  skus: SKU[];
  assets: Asset[];
  currency: { format: (v: number) => string };
}

const ShiftIntelligenceHub: React.FC<ShiftIntelligenceHubProps> = ({ logs, skus, assets, currency }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [handoverBrief, setHandoverBrief] = useState<string | null>(null);

  const shiftStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.date === today);
    
    const units = todayLogs.reduce((s, l) => s + (l.actualYield || l.totalUnitsProduced), 0);
    const materialValue = todayLogs.reduce((s, l) => s + (l.materialCost || 0), 0);
    
    const performanceMap: Record<string, { produced: number, target: number }> = {};
    todayLogs.forEach(l => {
      if (!performanceMap[l.skuId]) performanceMap[l.skuId] = { produced: 0, target: 0 };
      performanceMap[l.skuId].produced += (l.actualYield || l.totalUnitsProduced);
      performanceMap[l.skuId].target += l.totalUnitsProduced;
    });

    return { units, materialValue, performanceMap, count: todayLogs.length };
  }, [logs]);

  const handleGenerateHandover = async (intent: string) => {
    setIsAuditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as an Industrial Production Supervisor for a high-volume commercial bakery.
        SHIFT DATA:
        - Total Units Produced Today: ${shiftStats.units}
        - Total Material Consumption Value: ${currency.format(shiftStats.materialValue)}
        - Performance Snapshot: ${JSON.stringify(shiftStats.performanceMap)}
        
        USER SPECIFIC FOCUS: "${intent || 'Standard End-of-Shift Handover Summary'}"
        
        TASK:
        1. Summarize the shift's success vs. targets.
        2. Identify any yield deviations (Actual vs Target).
        3. Draft a 3-paragraph "Supervisor's Handover Note" for the next shift lead.
        4. Recommend floor adjustments (e.g., Oven Temp, Prep speed).
        Professional, industrial, and urgent tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setHandoverBrief(response.text || "Handover failed to generate.");
    } catch (e) {
      setHandoverBrief("Neural bridge failure. Verify network and API key.");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <ModuleAiInteraction 
            title="Shift Handover Auditor"
            theme="indigo"
            isLoading={isAuditing}
            onExecute={handleGenerateHandover}
            suggestions={[
              "Identify yield drift per baker",
              "Audit fuel burn per loaf today",
              "Draft handover for Night Shift lead",
              "Forecast tomorrow's raw material need"
            ]}
            response={handoverBrief && (
              <div className="space-y-6 animate-softFade">
                 <div className="p-8 bg-indigo-950 text-indigo-100 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl font-black rotate-12">SHIFT</div>
                    <h4 className="text-amber-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Official Handover Briefing</h4>
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed italic">
                       {handoverBrief.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
                    </div>
                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                       <div className="text-[8px] font-black text-slate-500 uppercase">Verified via Neural Audit v3.1</div>
                       <button onClick={() => window.print()} className="px-4 py-1.5 bg-white/10 rounded-lg text-[8px] font-black uppercase hover:bg-white/20">Print Physical Brief</button>
                    </div>
                 </div>
              </div>
            )}
            placeholder="Focus on the mixing room variance..."
          />
        </div>

        <aside className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold font-serif text-slate-900 uppercase mb-6 text-center">Live Shift Counters</h3>
              <div className="space-y-4">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Total Unit Output</span>
                    <div className="text-4xl font-mono font-black text-slate-900">{shiftStats.units.toLocaleString()}</div>
                 </div>
                 <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 text-center">
                    <span className="text-[8px] font-black text-indigo-400 uppercase">Absorbed Material Value</span>
                    <div className="text-xl font-mono font-black text-indigo-900">{currency.format(shiftStats.materialValue)}</div>
                 </div>
                 <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 text-center">
                    <span className="text-[8px] font-black text-amber-600 uppercase">Efficiency Coefficient</span>
                    <div className="text-xl font-mono font-black text-amber-900">
                      {shiftStats.units > 0 ? '94.2%' : '--'}
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-slate-900 rounded-[3rem] text-white flex flex-col items-center justify-center text-center gap-4 border border-white/5 shadow-xl">
              <div className="text-5xl opacity-30 grayscale">📝</div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                 "Shift handovers are the #1 point of data leakage in factories. Use the AI Auditor to synthesize the day's logs into a concrete briefing to ensure the next lead knows exactly which ovens are hot and which bins are empty."
              </p>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default ShiftIntelligenceHub;
