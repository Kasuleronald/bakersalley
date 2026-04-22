
import React, { useState } from 'react';
import { SKU, Ingredient, Activity, Overhead, Employee, Transaction, MonthlyBudget, TaxConfig, InventoryLoss } from '../types';
import ProductCosting from './ProductCosting';
import CostAccountant from './CostAccountant';
import MarginalCosting from './MarginalCosting';

interface CostAccountantHubProps {
  skus: SKU[];
  setSkus: (skus: SKU[]) => void;
  ingredients: Ingredient[];
  setIngredients: (ings: Ingredient[]) => void;
  activities: Activity[];
  overheads: Overhead[];
  setOverheads: (overheads: Overhead[]) => void;
  employees: Employee[];
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  taxConfig: TaxConfig;
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
  inventoryLosses: InventoryLoss[];
}

const CostAccountantHub: React.FC<CostAccountantHubProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'ABC' | 'Standard' | 'Marginal'>('Standard');

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-fit shadow-inner border border-slate-200 overflow-x-auto scrollbar-hide max-w-full">
         {[
           { id: 'Standard', label: 'Breakeven (CVP)', icon: '📈' },
           { id: 'ABC', label: 'Detailed ABC Audit', icon: '⚖️' },
           { id: 'Marginal', label: 'Marginal Profitability', icon: '📊' }
         ].map((tab) => (
           <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <span>{tab.icon}</span> {tab.label}
           </button>
         ))}
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'ABC' && <ProductCosting {...props} />}
        {activeTab === 'Standard' && <CostAccountant {...props} />}
        {activeTab === 'Marginal' && <MarginalCosting {...props} />}
      </div>

      <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-7xl opacity-30 grayscale shrink-0">⚖️</div>
         <div className="relative z-10 space-y-4">
            <h4 className="text-2xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Cost-Accounting Integration</h4>
            <p className="text-base text-indigo-100/90 leading-relaxed max-w-4xl italic">
              "Industrial product costing is the cornerstone of bakery profitability. By isolating the three primary pillars—Materials, Activity, and Fixed Absorption—the **Cost Accountant** module reveals which products are actually funding your growth and which are silently eroding your capital reserves. These calculations are permanently reflected in your Financial Statements to ensure a closed-loop audit of manufacturing performance."
            </p>
         </div>
      </div>
    </div>
  );
};

export default CostAccountantHub;
