
import React from 'react';
import { SKU, Ingredient, Asset, Sale, ProductionLog, Employee } from '../types';

interface SWOTAnalysisProps {
  skus: SKU[];
  ingredients: Ingredient[];
  assets: Asset[];
  sales: Sale[];
  productionLogs: ProductionLog[];
  employees: Employee[];
}

const SWOTAnalysis: React.FC<SWOTAnalysisProps> = ({ skus, ingredients, assets, sales, productionLogs, employees }) => {
  const strengths = [
    { title: 'Advanced Tech Stack', desc: 'AI-driven Neural Hub and real-time ERP synchronization.', icon: '🧠' },
    { title: 'Granular Costing', desc: 'ABC costing links utility burn (Firewood/Power) to unit COGS.', icon: '⚖️' },
    { title: 'Operational MES', desc: 'Visual Kanban and yield variance tracking reduces floor scrap.', icon: '🏗️' },
    { title: 'Strategic Simulation', desc: 'Scaling and ROI simulators for data-backed capital deployment.', icon: '🚀' },
    { title: 'Multitenancy Ready', desc: 'Multi-currency and multi-language support for regional scale.', icon: '🌍' }
  ];

  const weaknesses = [
    { title: 'Data Dependency', desc: 'System efficacy relies heavily on master data accuracy.', icon: '📊' },
    { title: 'Complexity Barrier', desc: 'Advanced ABC costing may require specialized staff training.', icon: '🎓' },
    { title: 'Manual Onboarding', desc: 'Initial supplier and service provider setup remains manual.', icon: '✍️' },
    { title: 'Asset Redundancy', desc: 'Single points of failure in critical machinery (e.g., Rotary Oven).', icon: '⚠️' }
  ];

  const opportunities = [
    { title: 'Market Expansion', desc: 'Growth Lab tools can capture untapped demand in Greater Kampala.', icon: '📈' },
    { title: 'Product Innovation', desc: 'Recipe Builder allows rapid prototyping of Artisan/Sourdough lines.', icon: '🥖' },
    { title: 'Neural Optimization', desc: 'Using AI to recover yield from identified production bottlenecks.', icon: '⚡' },
    { title: 'Supply Chain Integration', desc: 'Digitalizing supplier relationships for better credit terms.', icon: '🤝' }
  ];

  const threats = [
    { title: 'Input Volatility', desc: 'Fluctuating wheat, sugar, and fuel prices erode margins.', icon: '📉' },
    { title: 'Regulatory Shifts', desc: 'Evolving VAT (EFRIS) and Data Protection compliance requirements.', icon: '📜' },
    { title: 'Scale Competition', desc: 'Established brands with massive marketing and logistics budgets.', icon: '🏢' },
    { title: 'Infrastructure Risk', desc: 'Dependency on grid stability and internet for real-time sync.', icon: '🔌' }
  ];

  return (
    <div className="space-y-12 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Strengths */}
        <div className="bg-emerald-50 p-10 rounded-[3.5rem] border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-10 -translate-y-10"></div>
          <h3 className="text-2xl font-bold font-serif text-emerald-900 uppercase mb-8 flex items-center gap-3">
            <span className="text-3xl">💪</span> Strengths
          </h3>
          <div className="space-y-6">
            {strengths.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl shrink-0">{s.icon}</div>
                <div>
                  <div className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">{s.title}</div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-amber-50 p-10 rounded-[3.5rem] border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full translate-x-10 -translate-y-10"></div>
          <h3 className="text-2xl font-bold font-serif text-amber-900 uppercase mb-8 flex items-center gap-3">
            <span className="text-3xl">📉</span> Weaknesses
          </h3>
          <div className="space-y-6">
            {weaknesses.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl shrink-0">{s.icon}</div>
                <div>
                  <div className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">{s.title}</div>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        <div className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-10 -translate-y-10"></div>
          <h3 className="text-2xl font-bold font-serif text-indigo-900 uppercase mb-8 flex items-center gap-3">
            <span className="text-3xl">🚀</span> Opportunities
          </h3>
          <div className="space-y-6">
            {opportunities.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl shrink-0">{s.icon}</div>
                <div>
                  <div className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-1">{s.title}</div>
                  <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Threats */}
        <div className="bg-rose-50 p-10 rounded-[3.5rem] border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full translate-x-10 -translate-y-10"></div>
          <h3 className="text-2xl font-bold font-serif text-rose-900 uppercase mb-8 flex items-center gap-3">
            <span className="text-3xl">⚠️</span> Threats
          </h3>
          <div className="space-y-6">
            {threats.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl shrink-0">{s.icon}</div>
                <div>
                  <div className="text-xs font-black text-rose-800 uppercase tracking-widest mb-1">{s.title}</div>
                  <p className="text-[11px] text-rose-700 leading-relaxed font-medium">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
         <div className="relative z-10 text-center space-y-6">
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">Executive Summary</div>
            <h4 className="text-3xl font-bold font-serif max-w-3xl mx-auto leading-tight">
               BakersAlley is positioned as a <span className="text-emerald-400 italic">High-Efficiency Industrial Player</span> with a significant technological moat.
            </h4>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
               The primary strategic objective should be to leverage the <span className="text-white font-bold">ABC Costing engine</span> to aggressively price against less sophisticated competitors while using <span className="text-white font-bold">Neural Hub directives</span> to maintain a 15-20% yield advantage.
            </p>
         </div>
      </div>
    </div>
  );
};

export default SWOTAnalysis;
