import React, { useState, useMemo } from 'react';
import { InventoryLoss, Ingredient, SKU, LossReason, ProductionLog, Sale, DefectCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import ModuleAiInteraction from './ModuleAiInteraction';

interface WasteManagerProps {
  inventoryLosses: InventoryLoss[];
  setInventoryLosses: (losses: InventoryLoss[]) => void;
  ingredients: Ingredient[];
  skus: SKU[];
  sales: Sale[];
  productionLogs: ProductionLog[];
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981', '#1e1b4b', '#64748b', '#db2777', '#7c3aed'];

const WasteManager: React.FC<WasteManagerProps> = ({ inventoryLosses, setInventoryLosses, ingredients, skus, sales, productionLogs, currency }) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Defect_Audit' | 'RM_Spoilage' | 'AI_Audit'>('Overview');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalLossValue = inventoryLosses.reduce((s, l) => s + (l.quantity * l.unitCost), 0);
    const rmLoss = inventoryLosses.filter(l => l.ingredientId).reduce((s, l) => s + (l.quantity * l.unitCost), 0);
    const fgLoss = inventoryLosses.filter(l => l.skuId).reduce((s, l) => s + (l.quantity * l.unitCost), 0);
    
    const totalRevenue = sales.reduce((s, x) => s + x.totalPrice, 0);
    const wasteRatio = totalRevenue > 0 ? (totalLossValue / totalRevenue) * 100 : 0;

    const defectMap: Record<string, number> = {};
    inventoryLosses.filter(l => l.reason === 'Defect' && l.defectType).forEach(l => {
      defectMap[l.defectType!] = (defectMap[l.defectType!] || 0) + (l.quantity * l.unitCost);
    });
    const defectChartData = Object.entries(defectMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);

    return { totalLossValue, rmLoss, fgLoss, wasteRatio, defectChartData };
  }, [inventoryLosses, sales]);

  const handleRunAiWasteAudit = async (intent: string) => {
    setIsAiProcessing(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as an Industrial Waste Management Auditor for a commercial bakery.
        WASTE LOGS: ${JSON.stringify(inventoryLosses.slice(-50))}
        DEFECT COST BREAKDOWN: ${JSON.stringify(stats.defectChartData)}
        
        USER INTENT: "${intent || 'Perform a defect-to-cost linkage audit'}"
        
        TASK:
        1. Link specific defect categories to financial leakage.
        2. Identify if "Under-baked" or "Proofing" issues are destroying more margin.
        3. Recommend a calibration strategy for the ovens or mixers.
        Limit to 150 words. Professional and firm.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiReport(response.text || "Audit complete. Lean manufacturing protocols verified.");
    } catch (e) {
      setAiReport("Neural audit failed. Verify defect taxonomy linkage.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase text-rose-400">Waste & Defect Command</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Internal Failure Cost Audit • Defect Ledger</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'Overview', label: 'Overview', icon: '📊' },
            { id: 'Defect_Audit', label: 'Defect Costing', icon: '🧪' },
            { id: 'RM_Spoilage', label: 'Material Loss', icon: '🌾' },
            { id: 'AI_Audit', label: 'Neural Diagnostic', icon: '🧠' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id ? 'bg-white text-rose-600 shadow-xl scale-105' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span> {tab.label.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'Overview' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl space-y-2">
                 <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Total Failure Cost</div>
                 <div className="text-4xl font-mono font-black text-white">{currency.formatCompact(stats.totalLossValue)}</div>
                 <p className="text-[8px] text-slate-500 font-bold uppercase italic">Period-to-Date Leakage</p>
              </div>
              <div className={`p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center text-center ${stats.wasteRatio > 3 ? 'bg-rose-600 animate-pulse' : 'bg-indigo-900'}`}>
                 <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Leakage Coefficient</div>
                 <div className="text-4xl font-mono font-black">{stats.wasteRatio.toFixed(1)}%</div>
                 <p className="text-[8px] font-bold uppercase mt-2">Waste as % of NSV</p>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                 <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Defect Scrap</div>
                 <div className="text-3xl font-mono font-black text-rose-600">{currency.formatCompact(stats.fgLoss)}</div>
                 <p className="text-[8px] text-slate-300 font-bold uppercase mt-2">Production Errors</p>
              </div>
              <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 shadow-sm text-center">
                 <div className="text-[10px] font-black text-emerald-600 uppercase mb-2">Quality Uptime</div>
                 <div className="text-3xl font-mono font-black text-emerald-700">{Math.max(0, 100 - stats.wasteRatio).toFixed(1)}%</div>
                 <p className="text-[8px] text-emerald-500 font-bold uppercase mt-2">First-Pass Yield</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Defect_Audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
           <div className="lg:col-span-7 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold font-serif text-slate-900 mb-10 uppercase tracking-tighter text-center">Defect Cost Impact Matrix</h3>
              <div className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.defectChartData} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} width={120} />
                       <Tooltip cursor={{ fill: '#fff1f2' }} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                       <Bar name="Loss Value" dataKey="value" fill="#ef4444" radius={[0, 10, 10, 0]} barSize={25} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="lg:col-span-5 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xl font-bold font-serif text-slate-900 uppercase tracking-tighter text-center">Cost Concentration</h3>
              <div className="space-y-4">
                 {stats.defectChartData.slice(0, 5).map((item, idx) => (
                   <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-rose-50 transition-all">
                      <div>
                         <div className="font-black text-xs uppercase text-slate-800">{item.name}</div>
                         <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Impact Level: {((item.value / stats.totalLossValue) * 100).toFixed(0)}% of Waste</div>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-mono font-black text-rose-600">{currency.formatCompact(item.value)}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'AI_Audit' && (
        <ModuleAiInteraction 
          title="Neural Defect Diagnostic"
          theme="rose"
          isLoading={isAiProcessing}
          onExecute={handleRunAiWasteAudit}
          suggestions={[
            "Link under-baked defects to diesel oven efficiency",
            "Audit crumb texture issues vs. floor temperature",
            "Suggest waste recovery for high-volume bread",
            "Identify the single most expensive quality failure"
          ]}
          response={aiReport}
        />
      )}

      {activeTab === 'RM_Spoilage' && (
        <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
           <div className="px-10 py-8 bg-slate-50 border-b">
              <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Industrial Loss Journal</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                       <th className="px-10 py-6">Date / Ref</th>
                       <th className="px-6 py-6">Item Identity</th>
                       <th className="px-6 py-6 text-center">Root Cause / Defect</th>
                       <th className="px-10 py-6 text-right">Magnitude Loss</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {inventoryLosses.map(loss => {
                       const name = loss.ingredientId 
                          ? ingredients.find(i => i.id === loss.ingredientId)?.name 
                          : skus.find(s => s.id === loss.skuId)?.name;
                       return (
                          <tr key={loss.id} className="hover:bg-rose-50/10 transition-all group">
                             <td className="px-10 py-5">
                                <div className="text-[9px] text-slate-400 font-bold uppercase">{new Date(loss.date).toLocaleDateString()}</div>
                                <div className="text-[7px] text-slate-300 font-mono">ID: {loss.id.slice(-6)}</div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="font-black text-slate-900 text-xs uppercase">{name}</div>
                                <div className="text-[8px] text-slate-400 font-bold uppercase">{loss.source}</div>
                             </td>
                             <td className="px-6 py-5 text-center">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${
                                  loss.defectType ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                   {loss.defectType || loss.reason}
                                </span>
                             </td>
                             <td className="px-10 py-5 text-right font-mono font-black text-rose-600 text-sm">
                                {currency.format(loss.quantity * loss.unitCost)}
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      <div className="p-12 bg-rose-950 rounded-[5rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-7xl opacity-30 grayscale shrink-0">📉</div>
         <div className="relative z-10">
            <h4 className="text-3xl font-bold font-serif text-rose-400 mb-4 uppercase">The Cost of Quality (CoQ)</h4>
            <p className="text-base text-rose-100/70 leading-relaxed max-w-4xl italic">
              "In industrial baking, profit is made in the oven but lost at the trash can. Every defect categorized as 'Internal Failure' (found before sale) is a coaching opportunity for your bakers. Every defect categorized as 'External Failure' (returned by customer) is a brand risk. Use this data to calibrate your machine cycles and floor SOPs to reach the industrial target of &lt;1.5% total scrap."
            </p>
         </div>
      </div>
    </div>
  );
};

export default WasteManager;
