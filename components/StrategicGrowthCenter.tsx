import React, { useState, useMemo } from 'react';
import { SKU, Ingredient, Activity, Overhead, Employee, Sale, Transaction, MonthlyBudget, Asset, Loan, SupplierInvoice, ProductionLog, TaxConfig } from '../types';
import ProductMixAnalysis from './ProductMixAnalysis';
import MarketingHub from './MarketingHub';
import RiskHub from './RiskHub';
import DecisionHub from './DecisionHub';
import CompetitiveStrategyHub from './CompetitiveStrategyHub';
import MarketBenchmarking from './MarketBenchmarking';
import SWOTAnalysis from './SWOTAnalysis';

interface StrategicGrowthCenterProps {
  skus: SKU[];
  ingredients: Ingredient[];
  activities: Activity[];
  overheads: Overhead[];
  employees: Employee[];
  sales: Sale[];
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  assets: Asset[];
  loans: Loan[];
  invoices: SupplierInvoice[];
  productionLogs: ProductionLog[];
  taxConfig: TaxConfig;
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
}

type GrowthTab = 'Portfolio' | 'Competitive' | 'MarketEdge' | 'Benchmarking' | 'GrowthLab' | 'Risk' | 'DecisionHub' | 'SWOT';

const COMPARISON_MATRIX = [
  { feature: 'Core Focus', pos: 'Retail Transactions', alley: 'Industrial Lifecycle & P&L', icon: '🎯' },
  { feature: 'Costing', pos: 'Stock Purchase Price', alley: 'ABC (Labor + Fuel Burn)', icon: '⚖️' },
  { feature: 'Traceability', pos: 'Simple Batch Expiry', alley: 'Full Lot-to-Invoice DNA', icon: '🧬' },
  { feature: 'Scale', pos: 'Single Shop View', alley: 'Multi-Route Fleet Control', icon: '🚛' },
  { feature: 'EFRIS Mode', pos: 'Standard Billing', alley: 'Batch-Linked Statutory Flow', icon: '✅' },
];

const StrategicGrowthCenter: React.FC<StrategicGrowthCenterProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<GrowthTab>('Portfolio');

  const vitalityMetrics = useMemo(() => {
    if (props.skus.length === 0) return 0;
    const totalEstVol = props.skus.reduce((s, x) => s + x.monthlyVolumeEstimate, 0) || 1;
    const weightedMargin = props.skus.reduce((s, x) => s + (x.targetMargin * (x.monthlyVolumeEstimate / totalEstVol)), 0);
    return Math.min(100, (weightedMargin / 50) * 100);
  }, [props.skus]);

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
          <div className="relative group">
             <div className="absolute -inset-2 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <svg className="w-24 h-24 transform -rotate-90 relative z-10">
                <circle className="text-white/10" strokeWidth="6" stroke="currentColor" fill="transparent" r="40" cx="48" cy="48" />
                <circle 
                  className={vitalityMetrics > 70 ? "text-emerald-400" : vitalityMetrics > 40 ? "text-amber-400" : "text-rose-400"} 
                  strokeWidth="6" 
                  strokeDasharray={2 * Math.PI * 40} 
                  strokeDashoffset={2 * Math.PI * 40 * (1 - vitalityMetrics / 100)} 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" r="40" cx="48" cy="48" 
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90 relative z-20 pointer-events-none">
                <span className="text-2xl font-black font-mono">{vitalityMetrics.toFixed(0)}</span>
                <span className="text-[6px] font-black uppercase text-indigo-300">Vitality Index</span>
             </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold font-serif tracking-tight text-white uppercase tracking-tighter">Strategic Command Center</h2>
            <p className="text-indigo-200 text-xs font-black uppercase tracking-widest pl-1 mt-2">Volume-Weighted Portfolio Health • Competitive Benchmarking</p>
          </div>
        </div>

        <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/20 relative z-10 overflow-x-auto scrollbar-hide shadow-inner">
          {[
            { id: 'Portfolio', label: 'Portfolio Mix', icon: '💎' },
            { id: 'MarketEdge', label: 'Market Edge', icon: '⚖️' },
            { id: 'Competitive', label: 'Positioning', icon: '📐' },
            { id: 'Benchmarking', label: 'Benchmarking', icon: '📊' },
            { id: 'GrowthLab', label: 'Growth Lab', icon: '🚀' },
            { id: 'Risk', label: 'Resilience', icon: '🛡️' },
            { id: 'SWOT', label: 'SWOT Audit', icon: '📋' },
            { id: 'DecisionHub', label: 'Playbook', icon: '🧠' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveSubTab(tab.id as GrowthTab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeSubTab === tab.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="animate-fadeIn">
        {activeSubTab === 'MarketEdge' && (
          <section className="bg-white p-12 rounded-[5rem] border border-slate-100 shadow-sm overflow-hidden relative animate-fadeIn">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
               <div className="md:w-1/3 space-y-4">
                  <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Competitive Edge: ERP vs. Retail POS</h3>
                  <p className="text-sm text-slate-500 leading-relaxed italic">
                     "While retail is built on simple POS tracking, industrial wealth is built on the **Mass Balance**. This matrix defines why BakersAlley is essential for protecting factory margins beyond what standard Ugandan POS systems can offer."
                  </p>
                  <div className="pt-6">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Efficiency Delta</div>
                      <p className="text-[11px] text-indigo-700 leading-relaxed font-bold">Estimated +14% Gross Margin gain through industrial waste control vs. transactional POS.</p>
                    </div>
                  </div>
               </div>
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {COMPARISON_MATRIX.map((item, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6 group hover:bg-indigo-50 transition-all">
                       <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{item.icon}</div>
                       <div>
                          <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{item.feature}</div>
                          <div className="text-[10px] font-bold text-slate-400 line-through mb-1">{item.pos}</div>
                          <div className="text-xs font-black text-indigo-900 uppercase">{item.alley}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </section>
        )}
        {activeSubTab === 'Portfolio' && (
          <ProductMixAnalysis 
            skus={props.skus} 
            sales={props.sales} 
            ingredients={props.ingredients} 
            activities={props.activities} 
            overheads={props.overheads} 
            employees={props.employees} 
            currency={props.currency} 
          />
        )}
        {activeSubTab === 'Competitive' && (
          <CompetitiveStrategyHub 
            skus={props.skus}
            sales={props.sales}
            ingredients={props.ingredients}
            activities={props.activities}
            overheads={props.overheads}
            employees={props.employees}
            currency={props.currency}
          />
        )}
        {activeSubTab === 'Benchmarking' && (
          <MarketBenchmarking 
            skus={props.skus}
            ingredients={props.ingredients}
            productionLogs={props.productionLogs}
            sales={props.sales}
            taxConfig={props.taxConfig}
            currency={props.currency}
          />
        )}
        {activeSubTab === 'GrowthLab' && (
          <MarketingHub 
            skus={props.skus} 
            sales={props.sales} 
            transactions={props.transactions} 
            currency={props.currency} 
          />
        )}
        {activeSubTab === 'Risk' && (
          <RiskHub 
            ingredients={props.ingredients}
            assets={props.assets}
            loans={props.loans}
            invoices={props.invoices}
            sales={props.sales}
            employees={props.employees}
          />
        )}
        {activeSubTab === 'DecisionHub' && (
          <DecisionHub 
            skus={props.skus}
            employees={props.employees}
            activities={props.activities}
            overheads={props.overheads}
            transactions={props.transactions}
            budgets={props.budgets}
            ingredients={props.ingredients}
            currency={props.currency}
          />
        )}
        {activeSubTab === 'SWOT' && (
          <SWOTAnalysis 
            skus={props.skus}
            ingredients={props.ingredients}
            assets={props.assets}
            sales={props.sales}
            productionLogs={props.productionLogs}
            employees={props.employees}
          />
        )}
      </div>
    </div>
  );
};

export default StrategicGrowthCenter;