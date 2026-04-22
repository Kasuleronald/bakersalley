
import React, { useState, useMemo } from 'react';
import { ProductionLog, InventoryLoss, SKU, EnergyCategory } from '../types';
import { analyzeSustainability } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface SustainabilityHubProps {
  productionLogs: ProductionLog[];
  inventoryLosses: InventoryLoss[];
  skus: SKU[];
}

// Regional Emissions Factors (kg CO2e per unit of activity)
const EMISSION_FACTORS: Record<EnergyCategory, number> = {
  'Firewood': 1.8,    // Per kg wood burned (combustion footprint)
  'Charcoal': 3.2,    // High intensity due to kiln conversion
  'Electricity': 0.04, // Uganda Grid (primarily Hydro)
  'Gas': 2.1,
  'Solar': 0.0,
  'Diesel (Gen)': 2.6,
  'Water': 0.01,
  'Other': 1.5
};

const SustainabilityHub: React.FC<SustainabilityHubProps> = ({ productionLogs, inventoryLosses, skus }) => {
  const [activeTab, setActiveTab] = useState<'Emissions' | 'Waste' | 'Strategy'>('Emissions');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDirective, setAiDirective] = useState<string | null>(null);

  const metrics = useMemo(() => {
    let totalCO2 = 0;
    const sourceBreakdown: Record<string, number> = {};

    productionLogs.forEach(log => {
      const source = log.energyUsed || 'Other';
      // Mapped assumption: 1 batch round ~ 2kg firewood or 1kWh electricity
      const factor = EMISSION_FACTORS[source as EnergyCategory] || 1.0;
      const emissionValue = log.roundsProduced * factor;
      
      totalCO2 += emissionValue;
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + emissionValue;
    });

    const totalOutput = productionLogs.reduce((s, l) => s + (l.actualYield || l.totalUnitsProduced), 0);
    const intensity = totalOutput > 0 ? totalCO2 / totalOutput : 0;

    const totalLosses = inventoryLosses.reduce((s, l) => s + l.quantity, 0);
    const wasteRatio = totalOutput > 0 ? (totalLosses / totalOutput) * 100 : 0;

    const chartData = Object.entries(sourceBreakdown).map(([name, value]) => ({ name, value }));

    return { totalCO2, intensity, wasteRatio, chartData };
  }, [productionLogs, inventoryLosses]);

  const handleRunAiAudit = async () => {
    setIsAnalyzing(true);
    const summary = await analyzeSustainability(productionLogs, inventoryLosses, skus);
    setAiDirective(summary);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-emerald-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-emerald-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase text-emerald-400">Green Factory Command</h2>
          <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Industrial Carbon Ledger • ESG Compliance</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10">
          {['Emissions', 'Waste', 'Strategy'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-white text-emerald-900 shadow-xl' : 'text-emerald-400 hover:text-white'}`}>{t}</button>
          ))}
        </div>
      </header>

      {activeTab === 'Emissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white p-10 rounded-[3.5rem] border border-emerald-100 shadow-sm text-center space-y-2">
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Carbon Intensity</div>
                <div className="text-5xl font-mono font-black text-emerald-950">{metrics.intensity.toFixed(3)}</div>
                <p className="text-[9px] text-emerald-500 font-bold uppercase">kg CO2e / unit product</p>
             </div>
             <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 space-y-4">
                <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Sustainability Note</h4>
                <p className="text-xs text-emerald-900 leading-relaxed italic">
                  "Uganda's grid electricity is ~90% hydro-renewable. Transitioning high-temperature baking from Charcoal to Grid Electric could reduce your footprint by up to 98% per batch."
                </p>
             </div>
          </div>

          <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-emerald-100 shadow-sm flex flex-col justify-center">
             <h3 className="text-xl font-bold font-serif text-emerald-950 mb-10">Source-Wise Emission Distribution</h3>
             <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={metrics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#065f46'}} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${v}kg`} />
                      <Tooltip cursor={{fill: '#f0fdf4'}} contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                      <Bar name="kg CO2e" dataKey="value" fill="#059669" radius={[12, 12, 0, 0]} barSize={50} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Waste' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
           <div className="bg-white p-12 rounded-[4rem] border border-emerald-100 shadow-sm text-center flex flex-col justify-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resource Loss Ratio</div>
              <div className={`text-7xl font-mono font-black ${metrics.wasteRatio > 3 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                {metrics.wasteRatio.toFixed(1)}%
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-4">Units Wasted vs. Units Produced</p>
           </div>
           <div className="bg-emerald-950 p-12 rounded-[4rem] text-white shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20"></div>
              <h3 className="text-2xl font-bold font-serif text-emerald-400 relative z-10">Circularity Directives</h3>
              <ul className="space-y-4 relative z-10">
                 <li className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                    <span className="text-2xl">🚜</span>
                    <div className="text-xs font-bold leading-relaxed">Divert "Floor Scrap" to certified local poultry farms for upcycled feed.</div>
                 </li>
                 <li className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                    <span className="text-2xl">♻️</span>
                    <div className="text-xs font-bold leading-relaxed">Switch "HotLoaf Style Bags" to 100% biodegradable corn-starch polymers.</div>
                 </li>
              </ul>
           </div>
        </div>
      )}

      {activeTab === 'Strategy' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="bg-white p-12 rounded-[4rem] border border-emerald-100 shadow-sm flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-4xl shadow-inner animate-bounce">🌱</div>
              <div className="max-w-2xl space-y-4">
                 <h3 className="text-3xl font-bold font-serif text-emerald-950">AI Green Factory Auditor</h3>
                 <p className="text-slate-500 font-medium">Synthesize high-resolution operational data into a low-carbon growth roadmap.</p>
              </div>
              <button 
                onClick={handleRunAiAudit}
                disabled={isAnalyzing}
                className={`px-12 py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all ${isAnalyzing ? 'bg-emerald-100 text-emerald-400 animate-pulse' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'}`}
              >
                {isAnalyzing ? 'Performing Audit...' : 'Execute Neural ESG Audit'}
              </button>
           </div>

           {aiDirective && (
             <div className="bg-emerald-900 p-12 rounded-[4rem] text-white shadow-2xl animate-softFade space-y-6 relative overflow-hidden border border-emerald-700">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
                <div className="flex justify-between items-start relative z-10">
                   <h4 className="text-xl font-bold font-serif text-emerald-400 uppercase tracking-widest">Executive ESG Summary</h4>
                   <span className="text-[10px] font-black bg-emerald-800 px-3 py-1 rounded-full uppercase tracking-tighter">Gemini 3.1 Integrated</span>
                </div>
                <div className="prose prose-invert max-w-none text-lg font-medium italic leading-relaxed border-l-4 border-emerald-400 pl-8 relative z-10">
                   {aiDirective}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SustainabilityHub;
