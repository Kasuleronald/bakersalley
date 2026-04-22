import React, { useState, useMemo } from 'react';
import { SKU, Employee, Activity, Overhead, Transaction, MonthlyBudget, Ingredient, StrategicScenario, EnergyCategory } from '../types';
import { getConversionFactor } from '../utils/conversionUtils';

interface DecisionHubProps {
  skus: SKU[];
  employees: Employee[];
  activities: Activity[];
  overheads: Overhead[];
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  ingredients: Ingredient[];
  currency: { active: any, format: (v: number) => string };
}

const MATERIAL_WASTE_FACTOR = 1.08;
const ENERGY_OPTIONS: EnergyCategory[] = ['Firewood', 'Charcoal', 'Electricity', 'Gas', 'Solar', 'Diesel (Gen)'];

const DecisionHub: React.FC<DecisionHubProps> = ({ skus, employees, activities, overheads, transactions, budgets, ingredients, currency }) => {
  const [volumeScale, setVolumeScale] = useState(1.0); 
  const [materialInflation, setMaterialStress] = useState(0); 
  const [targetCategory, setTargetCategory] = useState('Bread');
  const [fuelTo, setFuelTo] = useState<EnergyCategory>('Firewood');
  const [isSwitchActive, setIsSwitchActive] = useState(false);

  const simulation = useMemo(() => {
    let totalNeededHours = 0;
    let totalBaseMaterialCost = 0;
    let totalRevenue = 0;

    skus.forEach(sku => {
      const simulatedVol = sku.monthlyVolumeEstimate * volumeScale;
      const yieldPerBatch = Math.max(1, sku.yield || 1);
      const batches = simulatedVol / yieldPerBatch;

      const unitMatCost = sku.recipeItems.reduce((s, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        const factor = ing ? getConversionFactor(ing, item.unit) : 1;
        const stressedCost = (ing?.costPerUnit || 0) * (1 + (materialInflation / 100));
        return s + ((stressedCost * (item.quantity * factor * MATERIAL_WASTE_FACTOR)) / yieldPerBatch);
      }, 0);
      
      totalBaseMaterialCost += simulatedVol * unitMatCost;
      totalRevenue += simulatedVol * sku.retailPrice;
    });

    let fuelSaving = 0;
    if (isSwitchActive) {
       const affectedSkus = skus.filter(s => s.category === targetCategory);
       const affectedVol = affectedSkus.reduce((s, x) => s + x.monthlyVolumeEstimate, 0) * volumeScale;
       // Biomass Saving: Approx 65% reduction in energy spend for high-volume baking
       fuelSaving = affectedVol * 80; 
    }

    const fixedCosts = overheads.reduce((s, o) => s + (o.period === 'Monthly' ? o.amount : o.amount * 4.33), 0);
    const netProfit = totalRevenue - (fixedCosts + totalBaseMaterialCost) + fuelSaving;

    return { totalRevenue, netProfit, totalBaseMaterialCost, fuelSaving };
  }, [skus, overheads, ingredients, volumeScale, materialInflation, isSwitchActive, fuelTo, targetCategory]);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight text-white uppercase tracking-tighter">Strategic War Room</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Biomass Strategy • Growth Simulation</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10">
           <div className="px-6 py-2 border-r border-white/10 text-center">
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Projected Monthly Net</div>
              <div className={`text-xl font-mono font-bold ${simulation.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currency.format(simulation.netProfit)}
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b pb-4">Simulation Rig</h3>
            
            <div className="space-y-6">
               <div className="space-y-4">
                  <div className="flex justify-between items-center"><label className="text-xs font-bold text-slate-700 uppercase">Volume Scale</label><span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">{Math.round(volumeScale * 100)}%</span></div>
                  <input type="range" min="0.5" max="3.0" step="0.1" className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" value={volumeScale} onChange={e => setVolumeScale(parseFloat(e.target.value))} />
               </div>

               <div className="space-y-4 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Biomass Switch Simulator</label>
                    <button onClick={() => setIsSwitchActive(!isSwitchActive)} className={`px-4 py-1.5 rounded-full text-[8px] font-black transition-all ${isSwitchActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                       {isSwitchActive ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>
                  {isSwitchActive && (
                    <div className="space-y-4 animate-fadeIn">
                       <select className="w-full p-3 rounded-xl text-xs font-bold bg-white border-none shadow-sm" value={targetCategory} onChange={e => setTargetCategory(e.target.value)}>
                          {['Bread', 'Cakes', 'Pastries'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                       </select>
                       <select className="w-full p-3 rounded-xl text-xs font-bold bg-white border-none shadow-sm" value={fuelTo} onChange={e => setFuelTo(e.target.value as EnergyCategory)}>
                          <option value="Firewood">Switch to Firewood</option>
                          <option value="Charcoal">Switch to Charcoal</option>
                       </select>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-8 space-y-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-4">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Revenue at Scale</h4>
                 <div className="text-4xl font-mono font-black text-slate-900">{currency.format(simulation.totalRevenue)}</div>
              </div>
              <div className="p-8 bg-indigo-950 rounded-[3rem] text-white shadow-xl flex flex-col justify-center">
                 <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2">Simulated Net Impact</h4>
                 <div className="text-3xl font-mono font-black">{currency.format(simulation.netProfit)}</div>
                 {simulation.fuelSaving > 0 && <p className="text-[10px] text-emerald-400 mt-2 font-bold uppercase">+ {currency.format(simulation.fuelSaving)} Biomass Efficiency Gain</p>}
              </div>
           </div>

           <div className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 shadow-sm flex items-center gap-10">
              <div className="text-6xl grayscale opacity-30">🪵</div>
              <div>
                 <h4 className="text-xl font-bold text-indigo-900 font-serif mb-2">Sustainable Resource Strategy</h4>
                 <p className="text-sm text-indigo-700 leading-relaxed italic">
                    "Reducing dependency on the electrical grid through biomass adoption provides industrial immunity to tariff spikes. For products like **{targetCategory}**, the thermal mass of wood-fired ovens reduces unit energy burden by up to 65%."
                 </p>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default DecisionHub;