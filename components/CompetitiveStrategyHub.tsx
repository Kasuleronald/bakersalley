import React, { useState, useMemo } from 'react';
import { SKU, Sale, Ingredient, Activity, Overhead, Employee } from '../types';
import { analyzeCompetitiveStrategy } from '../services/geminiService';
import { getConversionFactor } from '../utils/conversionUtils';

interface CompetitiveStrategyHubProps {
  skus: SKU[];
  sales: Sale[];
  ingredients: Ingredient[];
  activities: Activity[];
  overheads: Overhead[];
  employees: Employee[];
  currency: { active: any, format: (v: number) => string };
}

const STRATEGIES = [
  { id: 'leadership', name: 'Cost Leadership', icon: '📉', focus: 'Low Unit Cost / Scale', desc: 'Winning by having the lowest production costs in the market.' },
  { id: 'differentiation', name: 'Differentiation', icon: '✨', focus: 'Unique Value / Premium', desc: 'Winning by being unique and justifying a higher price point.' },
  { id: 'cost-focus', name: 'Cost Focus', icon: '🎯', focus: 'Niche Efficiency', desc: 'Focusing on the lowest cost for a specific small segment.' },
  { id: 'diff-focus', name: 'Diff Focus', icon: '💎', focus: 'Niche Uniqueness', desc: 'Focusing on unique value for a very specific segment.' }
];

const CompetitiveStrategyHub: React.FC<CompetitiveStrategyHubProps> = ({ skus, sales, ingredients, activities, overheads, employees, currency }) => {
  const [selectedStrategy, setSelectedStrategy] = useState('differentiation');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Derived Financial Context for the AI
  const businessContext = useMemo(() => {
    const totalFixed = overheads.reduce((s, o) => s + (o.period === 'Monthly' ? o.amount : o.amount * 4.33), 0) + 
                       employees.reduce((s, e) => s + (e.employmentType === 'Permanent' ? e.salary : (e.dailyRate || 0) * 26), 0);

    const skuMetrics = skus.map(s => {
      const yieldVal = Math.max(1, s.yield || 1);
      const matCost = s.recipeItems.reduce((acc, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        const factor = ing ? getConversionFactor(ing, item.unit) : 1;
        return acc + (((ing?.costPerUnit || 0) * (item.quantity * factor)));
      }, 0) / yieldVal;
      
      const price = s.retailPrice;
      const marginPct = price > 0 ? ((price - matCost) / price) * 100 : 0;
      
      return { name: s.name, unitMatCost: matCost, retailPrice: price, marginPct };
    });

    return { totalFixed, skuMetrics };
  }, [skus, overheads, employees, ingredients]);

  const handleRunAudit = async () => {
    setIsAnalyzing(true);
    const intent = STRATEGIES.find(s => s.id === selectedStrategy)?.name || '';
    const result = await analyzeCompetitiveStrategy(intent, businessContext.skuMetrics, businessContext.totalFixed);
    if (result) setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* STRATEGY GRID */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="flex justify-between items-center mb-12">
              <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Porter's Matrix Selection</h3>
              <div className="bg-slate-50 px-4 py-1.5 rounded-2xl border border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Competitive Path</div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              {STRATEGIES.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedStrategy(s.id)}
                  className={`p-8 rounded-[3rem] border transition-all text-left relative group ${selectedStrategy === s.id ? 'bg-indigo-900 border-indigo-900 text-white shadow-2xl scale-[1.02] z-10' : 'bg-slate-50 border-transparent hover:bg-white hover:border-indigo-100'}`}
                >
                   <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${selectedStrategy === s.id ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                         {s.icon}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${selectedStrategy === s.id ? 'text-indigo-300' : 'text-slate-400'}`}>
                         {s.focus}
                      </span>
                   </div>
                   <h4 className="text-xl font-bold font-serif mb-2">{s.name}</h4>
                   <p className={`text-xs leading-relaxed ${selectedStrategy === s.id ? 'text-indigo-100' : 'text-slate-500 italic'}`}>{s.desc}</p>
                   
                   {selectedStrategy === s.id && (
                     <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-lg animate-pulse">ACTIVE INTENT</div>
                   )}
                </button>
              ))}
           </div>
        </div>

        {/* AI ACTION PANEL */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-full border border-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
              <div className="relative z-10 space-y-6">
                 <div className="text-center">
                    <div className="text-6xl mb-6 opacity-30 grayscale group-hover:grayscale-0 transition-all">🧠</div>
                    <h4 className="text-xl font-bold font-serif text-amber-400 mb-2">Neural Strategy Audit</h4>
                    <p className="text-xs text-indigo-100/70 leading-relaxed italic">
                       Does your actual production cost and retail price data support your intended competitive strategy?
                    </p>
                 </div>
                 
                 <button 
                  onClick={handleRunAudit}
                  disabled={isAnalyzing}
                  className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all ${isAnalyzing ? 'bg-indigo-100 text-slate-400 animate-pulse' : 'bg-white text-slate-900 hover:bg-amber-400'}`}
                 >
                    {isAnalyzing ? 'Evaluating Ledgers...' : 'Run Alignment Audit'}
                 </button>
              </div>

              {aiAnalysis && (
                <div className="relative z-10 pt-10 border-t border-white/10 space-y-6 animate-fadeIn">
                   <div className="text-center">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Alignment Score</span>
                      <div className={`text-5xl font-mono font-black ${aiAnalysis.fitScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{aiAnalysis.fitScore}%</div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10 animate-softFade">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Strategic Verdict</h4>
                 <p className="text-lg font-serif text-slate-900 italic leading-relaxed">"{aiAnalysis.verdict}"</p>
              </div>
              
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest border-b pb-2">Identification of Drift</h4>
                 <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{aiAnalysis.strategicDrift}"</p>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-2">Building the Moat</h4>
                 <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl">
                    <p className="text-xs text-emerald-900 font-bold leading-relaxed">{aiAnalysis.moatRecommendation}</p>
                 </div>
              </div>
           </div>

           <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 flex flex-col md:flex-row items-center gap-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">⚖️</div>
              <div className="flex-1">
                 <h5 className="font-bold text-lg text-indigo-900 mb-1">Recommended Strategy Trade-off</h5>
                 <p className="text-sm text-indigo-700 italic">"Strategy is about choosing what NOT to do. To win here, you must commit to this sacrifice:"</p>
                 <div className="mt-4 text-xl font-bold font-serif text-indigo-900 uppercase tracking-tight">
                    {aiAnalysis.primaryTradeOff}
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="p-12 bg-slate-100 rounded-[4rem] flex flex-col md:flex-row items-center gap-12 border border-slate-200 opacity-80 shadow-inner">
         <div className="text-6xl grayscale opacity-30">📐</div>
         <div className="space-y-4">
            <h4 className="text-2xl font-bold font-serif text-slate-900">The Strategy-Execution Gap</h4>
            <p className="text-sm text-slate-500 leading-relaxed italic max-w-4xl">
              "In industrial baking, being 'Stuck in the Middle' is fatal. If you use expensive premium ingredients (Differentiation) but operate with high waste and low volume (Poor Cost Leadership), you consume capital without building a brand premium. Use this audit to ensure your operational behavior aligns with your market intent."
            </p>
         </div>
      </div>
    </div>
  );
};

export default CompetitiveStrategyHub;