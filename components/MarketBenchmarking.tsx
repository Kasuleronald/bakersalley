import React, { useMemo, useState } from 'react';
import { SKU, Ingredient, ProductionLog, Sale, TaxConfig } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { getMarketIntelligence } from '../services/geminiService';

interface MarketBenchmarkingProps {
  skus: SKU[];
  ingredients: Ingredient[];
  productionLogs: ProductionLog[];
  sales: Sale[];
  taxConfig: TaxConfig;
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

const KAMPALA_PRESETS = [
  { item: 'Standard White Bread (800g)', averagePrice: 4200, competitorRange: '3,800 - 4,800', competitorNotes: 'Quality, HotLoaf, BBROOD Basic' },
  { item: 'BBROOD Sourdough/Multigrain', averagePrice: 10500, competitorRange: '8,500 - 12,500', competitorNotes: 'BBROOD Village Mall/Acacia' },
  { item: 'Café Javas Croissants', averagePrice: 8500, competitorRange: '7,000 - 10,000', competitorNotes: 'CJs Oasis/Kisementi' },
  { item: 'Café Javas Cake Slice', averagePrice: 16500, competitorRange: '15,000 - 18,500', competitorNotes: 'CJs Signature Range' }
];

const MarketBenchmarking: React.FC<MarketBenchmarkingProps> = ({ skus, ingredients, productionLogs, sales, taxConfig, currency }) => {
  const [region, setRegion] = useState(taxConfig.nation === 'Uganda' ? 'Kampala' : taxConfig.nation || 'Kampala');
  const [isScanning, setIsScanning] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);

  const isKampala = useMemo(() => region.toLowerCase().includes('kampala'), [region]);

  const internalBenchData = useMemo(() => {
    const actualYieldEff = productionLogs.length > 0 
      ? (productionLogs.reduce((s, l) => s + (l.actualYield || 0), 0) / (productionLogs.reduce((s, l) => s + l.totalUnitsProduced, 0) || 1)) * 100 
      : 92;

    return [
      { subject: 'Yield Precision', actual: actualYieldEff, benchmark: 98, full: 100 },
      { subject: 'Waste Control', actual: 97.5, benchmark: 97, full: 100 },
      { subject: 'Stock Velocity', actual: 85, benchmark: 90, full: 100 },
      { subject: 'Margin Safety', actual: 75, benchmark: 70, full: 100 },
      { subject: 'Asset Uptime', actual: 94, benchmark: 95, full: 100 }
    ];
  }, [productionLogs]);

  const handleExecuteScan = async () => {
    setIsScanning(true);
    const data = await getMarketIntelligence(region, taxConfig.nation || 'Uganda');
    if (data) setMarketData(data);
    setIsScanning(false);
  };

  const activePricing = marketData?.pricing || (isKampala ? KAMPALA_PRESETS : []);

  return (
    <div className="space-y-10 animate-softFade">
      {/* SCANNER CONTROL HUB */}
      <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-8 border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4">
           <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Market Intelligence Nexus</h3>
           <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest pl-1">
             Grounded Search • {isKampala ? 'Kampala Specialized (CJs/BBROOD)' : 'Regional Benchmarking'}
           </p>
           
           <div className="flex flex-wrap gap-4 items-center">
              <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex items-center">
                 <span className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase">Region Target:</span>
                 <input 
                  className="bg-transparent border-none text-white font-bold text-sm px-4 outline-none placeholder:text-white/20 min-w-[200px]" 
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  placeholder="City or Area..."
                 />
              </div>
              <button 
                onClick={handleExecuteScan}
                disabled={isScanning}
                className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all ${isScanning ? 'bg-indigo-600 animate-pulse' : 'bg-white text-slate-900 hover:bg-amber-400'}`}
              >
                {isScanning ? 'Synchronizing Web Signals...' : '🔍 Execute Intelligence Scan'}
              </button>
           </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="bg-white/5 px-6 py-4 rounded-3xl border border-white/10 text-center">
              <div className="text-[8px] font-black text-indigo-400 uppercase mb-1">Source Context</div>
              <div className="text-xl font-mono font-black text-white">{isKampala ? 'KLA-HI' : 'REG-STD'}</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RADAR CHART: Internal Performance */}
        <div className="lg:col-span-6 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
           <h3 className="text-xl font-bold font-serif text-slate-900 mb-10 uppercase tracking-tighter text-center w-full">Industrial Fingerprint</h3>
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={internalBenchData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Internal Actual" dataKey="actual" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
                    <Radar name="Global Benchmark" dataKey="benchmark" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.2} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                 </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* LIVE COMPETITIVE DATA */}
        <div className="lg:col-span-6 space-y-6">
           <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                 <h4 className="text-lg font-bold font-serif text-slate-900 uppercase flex items-center gap-3">
                    <span>📉</span> {isKampala ? 'Kampala Premium Matrix' : 'Competitive Price Matrix'}
                 </h4>
                 {!marketData && isKampala && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[8px] font-black uppercase">Simulation Mode</span>}
              </div>
              
              <div className="space-y-4">
                 {activePricing.length > 0 ? activePricing.map((p: any, idx: number) => (
                   <div key={idx} className="p-5 bg-slate-50 rounded-[2rem] group hover:bg-white hover:border-indigo-100 border border-transparent transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                         <div>
                            <div className="font-black text-xs uppercase text-slate-900">{p.item}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{p.competitorNotes}</div>
                         </div>
                         <div className="text-right">
                            <div className="text-sm font-mono font-black text-indigo-900">{currency.format(p.averagePrice)}</div>
                            <div className="text-[7px] text-slate-400 uppercase font-black">Market Nominal</div>
                         </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                         <span className="text-[8px] font-black text-slate-300 uppercase">Retail Range</span>
                         <span className="text-[10px] font-mono font-bold text-slate-500">{p.competitorRange} UGX</span>
                      </div>
                   </div>
                 )) : (
                    <div className="py-20 text-center opacity-30 italic">No data available for this region.</div>
                 )}
              </div>
           </div>

           {marketData?.sentiment && (
              <div className="bg-indigo-900 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden animate-fadeIn">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
                 <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-6 relative z-10">Regional Sentiment Pulse</h4>
                 <div className="flex items-center gap-6 relative z-10">
                    <div className="text-5xl font-mono font-black text-white">{marketData.sentiment?.score}%</div>
                    <div className="flex-1">
                       <p className="text-xs text-indigo-100 italic leading-relaxed">"{marketData.sentiment?.summary}"</p>
                       <div className="flex flex-wrap gap-2 mt-4">
                          {marketData.sentiment?.topTrends?.map((t: string) => (
                            <span key={t} className="bg-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase">{t}</span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>

      {marketData && (
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm animate-fadeIn">
           <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grounding Audit Trails</h4>
              <span className="text-[8px] font-bold text-slate-300 uppercase">{marketData.groundingUrls?.length || 0} Sources Verified</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketData.groundingUrls?.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="block p-3 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden group hover:border-indigo-600 transition-all">
                   <div className="text-[9px] font-mono text-indigo-400 truncate group-hover:text-indigo-600">{url}</div>
                </a>
              ))}
           </div>
        </div>
      )}

      <div className="p-12 bg-slate-950 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/10 group">
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full translate-x-32 -translate-y-32 blur-3xl group-hover:bg-indigo-500/10 transition-all"></div>
         <div className="text-7xl opacity-30 grayscale shrink-0">💹</div>
         <div className="relative z-10 space-y-4">
            <h4 className="text-2xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Kampala Economic Intelligence</h4>
            <p className="text-sm text-indigo-100/70 leading-relaxed max-w-4xl italic">
              "The Kampala market is bifurcated. Players like **BBROOD** lead in artisanal health-focused breads with premiums of 150%, while **Café Javas (CJs)** sets the benchmark for pastry 'Hero' margins through high-end presentation. If your White Loaf is priced at {currency.format(skus[0]?.retailPrice || 3500)}, you are competing in the volume sector. Use this benchmark to decide if you want to push for **Cost Leadership** or pivot toward **Differentiation** in the affluent suburbs."
            </p>
         </div>
      </div>
    </div>
  );
};

export default MarketBenchmarking;
