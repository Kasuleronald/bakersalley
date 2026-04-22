
import React, { useState, useMemo } from 'react';
import { SKU, Sale, Transaction } from '../types';
import { generateMarketingStrategy } from '../services/geminiService';

interface MarketingHubProps {
  skus: SKU[];
  sales: Sale[];
  transactions: Transaction[];
  currency: { active: any, format: (v: number) => string };
}

type CampaignStrategy = 'Awareness' | 'Direct Conversion' | 'Loyalty / Retargeting';

const MarketingHub: React.FC<MarketingHubProps> = ({ skus, sales, transactions, currency }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketingAdvice, setMarketingAdvice] = useState<any>(null);
  
  // Simulator State
  const [promoBudget, setPromoBudget] = useState(500000);
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [strategyType, setStrategyType] = useState<CampaignStrategy>('Direct Conversion');
  const [estimatedReach, setEstimatedReach] = useState(5000);

  const selectedSku = skus.find(s => s.id === selectedSkuId);

  // Constants for simulation assumptions
  const STRATEGY_METRICS = {
    'Awareness': { convRate: 0.005, liftFactor: 1.1 },
    'Direct Conversion': { convRate: 0.03, liftFactor: 1.5 },
    'Loyalty / Retargeting': { convRate: 0.08, liftFactor: 1.2 }
  };

  const handleGeneratePlan = async () => {
    setIsAnalyzing(true);
    const result = await generateMarketingStrategy(skus, sales, promoBudget, strategyType);
    if (result) setMarketingAdvice(result);
    setIsAnalyzing(false);
  };

  const simulationMetrics = useMemo(() => {
    if (!selectedSku) return null;
    
    const settings = STRATEGY_METRICS[strategyType];
    const marginPerUnit = selectedSku.retailPrice * (selectedSku.targetMargin / 100);
    
    // Simulations
    const estimatedNewUnits = Math.floor(estimatedReach * settings.convRate);
    const estimatedIncrementalRevenue = estimatedNewUnits * selectedSku.retailPrice;
    const estimatedIncrementalProfit = estimatedNewUnits * marginPerUnit;
    const netROI = promoBudget > 0 ? ((estimatedIncrementalProfit - promoBudget) / promoBudget) * 100 : 0;
    const breakevenUnits = Math.ceil(promoBudget / Math.max(1, marginPerUnit));
    
    return { 
      marginPerUnit, 
      breakevenUnits, 
      estimatedNewUnits, 
      estimatedIncrementalRevenue, 
      estimatedIncrementalProfit, 
      netROI 
    };
  }, [selectedSku, promoBudget, strategyType, estimatedReach]);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif">Growth & Marketing Lab</h2>
          <p className="text-gray-500 font-medium">Convert marketing spend into future cash flow via ROI simulation.</p>
        </div>
        <button 
          onClick={handleGeneratePlan}
          disabled={isAnalyzing}
          className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${isAnalyzing ? 'bg-indigo-100 text-indigo-400 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black active:scale-95'}`}
        >
          {isAnalyzing ? 'Simulating ROI...' : '✨ Deep AI Strategy Audit'}
        </button>
      </header>

      {/* ROI SIMULATOR SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-5 bg-white p-10 rounded-[3.5rem] border border-amber-100 shadow-sm space-y-8">
            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] text-center border-b border-amber-50 pb-4">Campaign ROI Simulator</h3>
            
            <div className="space-y-6">
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">1. Target Hero SKU</label>
                  <select 
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    value={selectedSkuId}
                    onChange={e => setSelectedSkuId(e.target.value)}
                  >
                     <option value="">Select product to promote...</option>
                     {skus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.targetMargin}% Margin)</option>)}
                  </select>
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">2. Strategy Alignment</label>
                  <div className="grid grid-cols-1 gap-2">
                     {(['Awareness', 'Direct Conversion', 'Loyalty / Retargeting'] as CampaignStrategy[]).map(t => (
                       <button 
                        key={t}
                        onClick={() => setStrategyType(t)}
                        className={`p-4 rounded-2xl text-xs font-bold text-left transition-all border ${strategyType === t ? 'bg-indigo-900 text-white border-indigo-900 shadow-lg' : 'bg-gray-50 text-gray-500 border-transparent hover:border-indigo-200'}`}
                       >
                         {t === 'Awareness' && '📣 Awareness (High Reach, Low Conv)'}
                         {t === 'Direct Conversion' && '🎯 Direct Conversion (Ads to Sales)'}
                         {t === 'Loyalty / Retargeting' && '🔁 Loyalty (Existing Customers)'}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-2">3. Ad Spend (UGX)</label>
                    <input type="number" className="w-full p-4 bg-indigo-50/30 border-none rounded-2xl font-mono font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500" value={promoBudget} onChange={e => setPromoBudget(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-2">4. Target Reach</label>
                    <input type="number" className="w-full p-4 bg-indigo-50/30 border-none rounded-2xl font-mono font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500" value={estimatedReach} onChange={e => setEstimatedReach(parseInt(e.target.value) || 0)} />
                  </div>
               </div>
            </div>

            {simulationMetrics && (
              <div className="pt-8 border-t border-gray-100 space-y-6 animate-fadeIn">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                       <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Breakeven Units</span>
                       <span className="text-xl font-mono font-black text-slate-900">{simulationMetrics.breakevenUnits} pcs</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                       <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Est. Conversion</span>
                       <span className="text-xl font-mono font-black text-slate-900">{simulationMetrics.estimatedNewUnits} pcs</span>
                    </div>
                 </div>
                 
                 <div className={`p-6 rounded-[2rem] border flex items-center justify-between shadow-sm ${simulationMetrics.netROI > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Projected Net ROI</span>
                       <div className={`text-3xl font-mono font-black ${simulationMetrics.netROI > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {simulationMetrics.netROI > 0 ? '+' : ''}{simulationMetrics.netROI.toFixed(1)}%
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-bold text-gray-400 uppercase">Incremental Profit</span>
                       <div className="text-lg font-bold text-gray-900 font-mono">{currency.format(simulationMetrics.estimatedIncrementalProfit)}</div>
                    </div>
                 </div>
              </div>
            )}
         </div>

         {/* AI FEEDBACK AREA */}
         <div className="lg:col-span-7 space-y-6">
            {!marketingAdvice ? (
              <div className="h-full py-20 bg-slate-900 rounded-[4rem] text-white flex flex-col items-center justify-center text-center space-y-6">
                 <div className="text-6xl opacity-20 grayscale">📊</div>
                 <p className="text-sm text-slate-400 max-w-xs leading-relaxed italic">
                    "Select a Hero SKU and run a simulation. The AI Auditor will analyze your actual sales velocity vs. your simulated ROI to find the optimal growth path."
                 </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                 <div className="bg-indigo-950 p-10 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                       <h3 className="text-2xl font-bold font-serif text-amber-400">AI Strategy Insight</h3>
                       <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-center">
                          <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block mb-1">ROI Confidence</span>
                          <span className={`text-2xl font-black font-mono ${marketingAdvice.roiConfidenceScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                             {marketingAdvice.roiConfidenceScore}%
                          </span>
                       </div>
                    </div>
                    
                    <p className="text-indigo-100 text-lg leading-relaxed italic relative z-10 mb-8">"{marketingAdvice.strategy}"</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                       <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-2">Max Acquisition Limit (CAC)</span>
                          <div className="text-xl font-bold">{marketingAdvice.cacGuideline}</div>
                       </div>
                       <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-2">Recommended Products</span>
                          <div className="flex flex-wrap gap-2">
                             {marketingAdvice.heroProducts.map((p: string) => (
                               <span key={p} className="text-xs font-bold bg-white/10 px-3 py-1 rounded-lg">{p}</span>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">AI Ad Copy Generation</h4>
                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group relative">
                          <div className="text-[8px] font-black text-indigo-600 uppercase mb-3">📱 WhatsApp / SMS Copy</div>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{marketingAdvice.adCopy.sms}</p>
                          <button onClick={() => navigator.clipboard.writeText(marketingAdvice.adCopy.sms)} className="absolute top-4 right-4 text-[9px] font-black text-slate-300 hover:text-indigo-600 transition-colors">COPY</button>
                       </div>
                       <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 group relative">
                          <div className="text-[8px] font-black text-indigo-600 uppercase mb-3">📸 Social Media Caption</div>
                          <p className="text-sm text-slate-700 leading-relaxed italic">{marketingAdvice.adCopy.instagram}</p>
                          <button onClick={() => navigator.clipboard.writeText(marketingAdvice.adCopy.instagram)} className="absolute top-4 right-4 text-[9px] font-black text-slate-300 hover:text-indigo-600 transition-colors">COPY</button>
                       </div>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>

      <div className="bg-amber-900 p-12 rounded-[4rem] text-white flex items-center gap-10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-7xl grayscale opacity-30">💹</div>
         <div className="relative z-10">
            <h4 className="text-3xl font-bold font-serif text-amber-300 mb-4">Strategic ROI Modeling</h4>
            <p className="text-base text-amber-100/70 leading-relaxed max-w-4xl">
              "In a resource-constrained commercial bakery, every marketing Shilling must be deployed with intent. **Direct Conversion** campaigns work best for your 'Stars' (High Volume/High Margin), while **Loyalty** campaigns are essential to protect your 'Cash Cows'. Avoid spending budget on products where your unit contribution cannot absorb the cost of customer acquisition."
            </p>
         </div>
      </div>
    </div>
  );
};

export default MarketingHub;
