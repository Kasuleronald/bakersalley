import React, { useMemo, useState } from 'react';
import { SKU, Ingredient, Activity, Overhead, Employee, Transaction, MonthlyBudget, EnergyCategory, InventoryLoss, RecipeItem } from '../types';
import { getConversionFactor } from '../utils/conversionUtils';
import { getIndustryTerms } from '../utils/industryUtils';
import ModuleAiInteraction from './ModuleAiInteraction';
import { analyzeCompetitiveStrategy } from '../services/geminiService';

interface ProductCostingProps {
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
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
  inventoryLosses: InventoryLoss[];
}

interface SimulationState {
  ingredientCosts: Record<string, number>;
  activityRates: Record<string, number>;
  overheadAdd: number;
}

const MATERIAL_WASTE_FACTOR = 1.08; 
const PRODUCTION_DAYS = 26;

const ProductCosting: React.FC<ProductCostingProps> = ({ skus, setSkus, ingredients, activities, overheads, employees, transactions, currency }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  // DYNAMIC RATES ENGINE: Refined for Complexity & Intensity
  const dynamicRates = useMemo(() => {
    const productionStaff = employees.filter(e => e.isActive && e.department === 'Production');
    const totalMonthlyLaborCost = productionStaff.reduce((sum, e) => {
      const base = e.employmentType === 'Permanent' ? e.salary : (e.dailyRate || 0) * PRODUCTION_DAYS;
      return sum + base;
    }, 0);
    
    const totalScheduledManMinutes = productionStaff.reduce((sum, e) => sum + (e.weeklyHoursDedicated * 4.33 * 60), 0);
    const baseLaborRatePerMin = totalScheduledManMinutes > 0 ? totalMonthlyLaborCost / totalScheduledManMinutes : 0;

    // ENERGY POOL REFINEMENT
    const energyPools: Record<string, number> = {
      'Firewood': 0, 'Charcoal': 0, 'Electricity': 0, 'Gas': 0, 'Solar': 0, 'Diesel (Gen)': 0, 'Water': 0, 'Other': 0
    };
    
    overheads.forEach(oh => {
      const mult = oh.period === 'Weekly' ? 4.33 : oh.period === 'Daily' ? PRODUCTION_DAYS : 1;
      const cat = oh.energyCategory || 'Other';
      energyPools[cat] += (oh.amount * mult);
    });

    const energyUnitRates: Record<string, number> = {};
    Object.keys(energyPools).forEach(cat => {
      let totalDriverUsage = 0;
      skus.forEach(s => {
        const vol = s.monthlyVolumeEstimate || 1;
        const yieldVal = s.yield || 1;
        const batches = vol / yieldVal;
        s.activities.forEach(sa => {
          const act = activities.find(a => a.id === sa.activityId);
          if (act && act.energyCategory === cat) {
             // Differentiate between hours and minutes drivers
             totalDriverUsage += batches * (act.driver.includes('Hours') ? sa.quantity : sa.quantity / 60);
          }
        });
      });
      energyUnitRates[cat] = totalDriverUsage > 0 ? energyPools[cat] / totalDriverUsage : 0;
    });

    return { baseLaborRatePerMin, energyUnitRates };
  }, [employees, overheads, skus, activities]);

  // CORE COSTING LEDGER: The logic for true SKU attribution
  const costingLedger = useMemo(() => {
    // Explicitly type skus.map parameter as SKU to resolve potential 'unknown' type errors
    return skus.map((sku: SKU) => {
      const yieldVal = Math.max(1, sku.yield || 1);
      
      // 1. DIRECT MATERIALS (with waste factor)
      const materialBreakdown = sku.recipeItems.map((ri: RecipeItem) => {
        const ing = ingredients.find(i => i.id === ri.ingredientId);
        // Fixed: Ensure ri.unit is used (previously referred to non-existent 'item.unit')
        const factor = ing ? getConversionFactor(ing, ri.unit) : 1;
        return { 
          name: ing?.name || 'Unknown', 
          contribution: ((ing?.costPerUnit || 0) * ri.quantity * factor * MATERIAL_WASTE_FACTOR) / yieldVal 
        };
      });
      const unitMaterialTotal = materialBreakdown.reduce((s, x) => s + x.contribution, 0);

      // 2. WEIGHTED ACTIVITIES (Labor + Energy Intensity)
      const activityBreakdown = sku.activities.map(sa => {
        const act = activities.find(a => a.id === sa.activityId);
        if (!act) return { name: 'Unknown', cost: 0 };
        
        const unitUsageMinutes = sa.quantity / yieldVal;
        const unitUsageHours = unitUsageMinutes / 60;
        
        // Intensity Factor: Hand-work is 50% more expensive than machine-work per minute
        const isHandWork = act.name.toLowerCase().includes('hand') || act.name.toLowerCase().includes('manual') || act.name.toLowerCase().includes('decoration');
        const intensityFactor = isHandWork ? 1.5 : 1.0;
        
        const laborCost = unitUsageMinutes * dynamicRates.baseLaborRatePerMin * intensityFactor;
        const energyRate = dynamicRates.energyUnitRates[act.energyCategory] || 0;
        
        return { 
          name: act.name, 
          cost: laborCost + (unitUsageHours * energyRate),
          isHandWork 
        };
      });
      const unitActivityTotal = activityBreakdown.reduce((s, x) => s + x.cost, 0);

      // 3. FIXED BURDEN ABSORPTION
      const totalUnallocatedMonthly = overheads.filter(oh => !oh.energyCategory && oh.skuId !== sku.id).reduce((sum, oh) => {
        const mult = oh.period === 'Weekly' ? 4.33 : oh.period === 'Daily' ? PRODUCTION_DAYS : 1;
        return sum + (oh.amount * mult);
      }, 0);
      const totalProductionVol = skus.reduce((s, x) => s + (x.monthlyVolumeEstimate || 0), 0) || 1;
      const unitFixedBurden = totalUnallocatedMonthly / totalProductionVol;

      // 4. TOTALS & TARGETS
      const totalUnitCost = unitMaterialTotal + unitActivityTotal + unitFixedBurden;
      const targetPrice = totalUnitCost / (1 - (sku.targetMargin / 100));
      const priceGap = sku.retailPrice - targetPrice;
      const trueMargin = sku.retailPrice > 0 ? ((sku.retailPrice - totalUnitCost) / sku.retailPrice) * 100 : 0;

      return { 
        ...sku, 
        unitMaterialTotal, 
        unitActivityTotal, 
        unitFixedBurden, 
        totalUnitCost, 
        targetPrice, 
        priceGap, 
        trueMargin,
        materialBreakdown, 
        activityBreakdown 
      };
    });
  }, [skus, ingredients, activities, overheads, dynamicRates]);

  const handleRunAiAudit = async (intent: string) => {
    setIsAiAuditing(true);
    const result = await analyzeCompetitiveStrategy(intent, costingLedger, 5000000);
    if (result) setAiAdvice(result.verdict);
    setIsAiAuditing(false);
  };

  return (
    <div className="space-y-10 animate-softFade pb-20">
      {/* STRATEGIC AUDITOR BLOCK */}
      <ModuleAiInteraction 
        title="ABC Allocation Strategist"
        theme="indigo"
        isLoading={isAiAuditing}
        onExecute={handleRunAiAudit}
        suggestions={[
          "Analyze hand-molding labor burden",
          "Identify sub-marginal specialty cakes",
          "Suggest pricing correction for high-energy items",
          "Audit fixed cost absorption fairness"
        ]}
        response={aiAdvice}
        placeholder="How can we refine our activity drivers to better reflect the true cost of artisanal products?"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <aside className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl space-y-6 border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
               <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest text-center border-b border-white/10 pb-4 relative z-10">Labor Complexity Factors</h3>
               <div className="space-y-4 relative z-10">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                     <span className="text-[8px] font-black text-slate-400 uppercase">Standard Rate</span>
                     <div className="text-xl font-mono font-black text-white">{currency.format(dynamicRates.baseLaborRatePerMin)} <span className="text-[8px] text-slate-500">/min</span></div>
                  </div>
                  <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/30">
                     <span className="text-[8px] font-black text-indigo-400 uppercase">Artisanal Surcharge</span>
                     <div className="text-xl font-mono font-black text-indigo-300">1.50x <span className="text-[8px] text-slate-500">Mult</span></div>
                     <p className="text-[7px] text-slate-500 mt-1 uppercase">Applied to Manual/Hand Tasks</p>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-2">Thermal Base Loading</h4>
               <div className="space-y-3">
                  {/* Fixed: Explicitly cast 'v' to number to avoid unknown type comparison errors during filter */}
                  {Object.entries(dynamicRates.energyUnitRates).filter(([_,v]) => (v as number) > 0).map(([cat, rate]) => (
                    <div key={cat} className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-500 uppercase">{cat}</span>
                       <span className="font-mono font-black text-slate-900">{currency.format(rate)}/hr</span>
                    </div>
                  ))}
               </div>
               <p className="text-[8px] text-slate-400 italic text-center mt-4">Rates derived from monthly utility bills vs total floor cycle time.</p>
            </div>
         </aside>

         <main className="lg:col-span-9 space-y-6">
            <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <th className="px-10 py-6">Product Identity</th>
                      <th className="px-6 py-6 text-right">True Absorbed Cost</th>
                      <th className="px-6 py-6 text-right">True Net Margin</th>
                      <th className="px-6 py-6 text-right">Retail Master</th>
                      <th className="px-10 py-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Explicitly cast costingLedger to any[] to safely handle mapping in JSX */}
                    {(costingLedger as any[]).map((item: any) => {
                      const isExpanded = expandedId === item.id;
                      // Fixed: Explicitly cast trueMargin to number to fix operator comparison error and potential "unknown" type issue
                      const isHealthRisk = (item.trueMargin as number) < 25;
                      return (
                        <React.Fragment key={item.id}>
                          <tr className={`hover:bg-indigo-50/5 transition-all ${isExpanded ? 'bg-indigo-50/10' : ''}`}>
                            <td className="px-10 py-6">
                               <div className="font-bold text-slate-900 text-sm uppercase tracking-tighter">{item.name}</div>
                               <button onClick={() => setExpandedId(isExpanded ? null : item.id)} className="text-[8px] font-black text-indigo-400 uppercase hover:underline">{isExpanded ? 'Hide Stack' : 'Inspect Cost Stack'}</button>
                            </td>
                            <td className="px-6 py-6 text-right font-mono font-bold text-slate-400 text-xs">
                               {currency.format(item.totalUnitCost)}
                            </td>
                            <td className={`px-6 py-6 text-right font-mono font-black text-sm ${isHealthRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                               {/* Fixed: Use type assertion to ensure trueMargin is treated as a number for method calls */}
                               {(item.trueMargin as number).toFixed(1)}%
                            </td>
                            <td className="px-6 py-6 text-right font-mono font-bold text-slate-900 text-sm">
                               {currency.format(item.retailPrice)}
                            </td>
                            <td className="px-10 py-6 text-center">
                               <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${isHealthRisk ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {isHealthRisk ? 'Low Yield' : 'Healthy'}
                               </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/50 animate-fadeIn">
                               <td colSpan={5} className="px-10 py-10">
                                  <div className="bg-white rounded-[3rem] border border-indigo-100 shadow-2xl p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                                     <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Direct Materials</h4>
                                        <div className="space-y-2">
                                          {item.materialBreakdown.map((m: any, i: number) => (
                                            <div key={i} className="flex justify-between text-[10px]">
                                               <span className="font-bold text-slate-600 uppercase truncate pr-4">{m.name}</span>
                                               <span className="font-mono text-slate-400">{currency.format(m.contribution)}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 flex justify-between font-black text-indigo-900">
                                           <span className="uppercase text-[9px]">Subtotal (8% Waste Inc.)</span>
                                           <span className="text-xs">{currency.format(item.unitMaterialTotal)}</span>
                                        </div>
                                     </div>
                                     <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b pb-2 border-indigo-100">Activity Absorption</h4>
                                        <div className="space-y-2">
                                          {item.activityBreakdown.map((a: any, i: number) => (
                                            <div key={i} className="flex justify-between text-[10px]">
                                               <span className="font-bold text-slate-600 uppercase truncate pr-4">{a.name}</span>
                                               <span className="font-mono text-slate-400">{currency.format(a.cost)}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="pt-4 border-t border-indigo-50 flex justify-between font-black text-indigo-900">
                                           <span className="uppercase text-[9px]">Total Labor/Energy</span>
                                           <span className="text-xs">{currency.format(item.unitActivityTotal)}</span>
                                        </div>
                                     </div>
                                     <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b pb-2 border-amber-100">Fixed Burden & Target</h4>
                                        <div className="space-y-4">
                                          <div className="flex justify-between text-[10px]">
                                             <span className="font-bold text-slate-600 uppercase">Fixed Overhead Share</span>
                                             <span className="font-mono text-slate-400">{currency.format(item.unitFixedBurden)}</span>
                                          </div>
                                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-1">
                                             <span className="text-[8px] font-black text-amber-600 uppercase">ABC Calculated Target</span>
                                             <div className="text-lg font-mono font-black text-amber-900">{currency.format(item.targetPrice)}</div>
                                          </div>
                                          <p className="text-[8px] text-slate-400 italic">"Price required to achieve your {item.targetMargin}% margin goal at current floor efficiency."</p>
                                        </div>
                                     </div>
                                  </div>
                               </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
               </table>
            </div>
         </main>
      </div>
    </div>
  );
};

export default ProductCosting;