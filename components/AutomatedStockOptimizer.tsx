import React, { useState, useMemo } from 'react';
import { SKU, Ingredient, DailyOutletForecast, Requisition } from '../types';
import { getConversionFactor } from '../utils/conversionUtils';
import { optimizeInventoryProcurement } from '../services/geminiService';

interface AutomatedStockOptimizerProps {
  skus: SKU[];
  ingredients: Ingredient[];
  outletForecasts: DailyOutletForecast[];
  requisitions: Requisition[];
  setRequisitions: (reqs: Requisition[]) => void;
  currency: { format: (v: number) => string };
}

const AutomatedStockOptimizer: React.FC<AutomatedStockOptimizerProps> = ({
  skus, ingredients, outletForecasts, requisitions, setRequisitions, currency
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // 1. Explode Predicted Retail Sales into Total Ingredient Requirement
  const totalRequirement = useMemo(() => {
    const map: Record<string, { name: string, needed: number, unit: string, cost: number }> = {};
    
    outletForecasts.forEach(f => {
      const sku = skus.find(s => s.id === f.skuId);
      if (!sku) return;
      
      const batches = f.forecastedQty / (sku.yield || 1);
      sku.recipeItems.forEach(ri => {
        const ing = ingredients.find(i => i.id === ri.ingredientId);
        if (!ing) return;
        
        const factor = getConversionFactor(ing, ri.unit);
        const qtyNeeded = ri.quantity * factor * batches * 1.08; // inc. 8% floor waste

        if (!map[ing.id]) {
          map[ing.id] = { name: ing.name, needed: 0, unit: ing.unit, cost: ing.costPerUnit };
        }
        map[ing.id].needed += qtyNeeded;
      });
    });

    return map;
  }, [outletForecasts, skus, ingredients]);

  const handleRunAiOptimizer = async () => {
    setIsOptimizing(true);
    const result = await optimizeInventoryProcurement(Object.values(totalRequirement), ingredients);
    setAiAnalysis(result);
    setIsOptimizing(false);
  };

  const handleCreateRequisition = (item: any) => {
    const ing = ingredients.find(i => i.name === item.ingredientName);
    if (!ing) return;

    const newReq: Requisition = {
      id: `auto-req-${Date.now()}-${ing.id}`,
      ingredientId: ing.id,
      quantityRequested: item.qtyToBuy,
      estimatedCost: item.estCost,
      status: 'Pending',
      date: new Date().toISOString()
    };

    setRequisitions([newReq, ...requisitions]);
    alert(`Requisition for ${item.qtyToBuy}${ing.unit} of ${ing.name} generated and sent to Sourcing Hub.`);
  };

  /**
   * Automated Procurement Engine
   * Scans for items below reorder levels or with projected shortfalls
   */
  const handleAutoGenerateAll = () => {
    const newReqs: Requisition[] = [];
    const timestamp = new Date().toISOString();

    ingredients.forEach(ing => {
      const neededForPlan = totalRequirement[ing.id]?.needed || 0;
      const shortfall = Math.max(0, neededForPlan - ing.currentStock);
      const isBelowReorder = ing.currentStock <= ing.reorderLevel;
      
      // If we are short for the plan OR below the safety reorder level
      if (shortfall > 0 || isBelowReorder) {
        // Check if an active requisition for this ingredient already exists to prevent duplication
        const alreadyPending = requisitions.some(r => r.ingredientId === ing.id && (r.status === 'Pending' || r.status === 'Draft'));
        if (alreadyPending) return;

        // Ordering Logic: Max(Shortfall, Reorder Gap) + 15% Safety Buffer
        const reorderGap = Math.max(0, (ing.reorderLevel * 2) - ing.currentStock);
        const baseQty = Math.max(shortfall, reorderGap, ing.reorderLevel);
        const finalQty = Math.ceil(baseQty * 1.15);

        newReqs.push({
          id: `smart-proc-${Date.now()}-${ing.id}`,
          ingredientId: ing.id,
          quantityRequested: finalQty,
          estimatedCost: finalQty * ing.costPerUnit,
          status: 'Pending',
          date: timestamp,
          notes: `Auto-generated: ${shortfall > 0 ? 'Plan Shortfall' : 'Reorder Level Breach'} detected.`
        });
      }
    });

    if (newReqs.length === 0) {
      alert("System Audit Complete: All material levels are within nominal safety thresholds.");
      return;
    }

    if (window.confirm(`Found ${newReqs.length} material risks. Proceed with automated bulk procurement?`)) {
      setRequisitions([...newReqs, ...requisitions]);
      alert(`Successfully dispatched ${newReqs.length} requisitions to the Sourcing Hub.`);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-coffee-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4">
           <h3 className="text-3xl font-bold font-serif text-coffee-100">Automated Stock Optimizer</h3>
           <p className="text-coffee-200 text-lg max-w-xl">Translating retail predictions and safety floors into precise purchase orders to protect your production uptime.</p>
        </div>
        <div className="relative z-10 flex flex-col gap-3">
          <button 
            onClick={handleAutoGenerateAll}
            className="px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 flex items-center justify-center gap-3"
          >
            <span>⚡</span> Execute Auto-Procure
          </button>
          <button 
            onClick={handleRunAiOptimizer}
            disabled={isOptimizing}
            className={`px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all border border-white/20 ${isOptimizing ? 'bg-coffee-800 text-coffee-400 animate-pulse' : 'bg-white/5 text-white hover:bg-white/10 active:scale-95'}`}
          >
            {isOptimizing ? 'Neural Audit Active...' : '🤖 Run AI Supply Audit'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-6">
           <div className="bg-white rounded-[4rem] shadow-sm border border-coffee-100 overflow-hidden">
              <div className="px-10 py-8 bg-coffee-50 border-b flex justify-between items-center">
                 <h4 className="text-xl font-bold font-serif text-coffee-900 uppercase">MRP Supply Integrity Ledger</h4>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase">Critical Shortfall</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase">Reorder Floor Breach</span>
                    </div>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[10px] font-black text-coffee-400 uppercase tracking-widest border-b bg-gray-50/30">
                          <th className="px-10 py-6">Material Identity</th>
                          <th className="px-6 py-6 text-center">Safety Floor</th>
                          <th className="px-6 py-6 text-center">Plan Demand</th>
                          <th className="px-6 py-6 text-center">Physical Stock</th>
                          <th className="px-10 py-6 text-right">Procurement Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-coffee-50">
                       {ingredients.map(ing => {
                          const needed = totalRequirement[ing.id]?.needed || 0;
                          const shortfall = Math.max(0, needed - ing.currentStock);
                          const isBelowReorder = ing.currentStock <= ing.reorderLevel;
                          const hasPendingReq = requisitions.some(r => r.ingredientId === ing.id && (r.status === 'Pending' || r.status === 'Draft'));

                          return (
                            <tr key={ing.id} className={`hover:bg-coffee-50/30 transition-all group ${shortfall > 0 ? 'bg-rose-50/20' : isBelowReorder ? 'bg-amber-50/20' : ''}`}>
                               <td className="px-10 py-5">
                                  <div className="font-bold text-coffee-900 text-sm uppercase">{ing.name}</div>
                                  <div className="text-[9px] text-coffee-400 font-bold uppercase">{ing.category}</div>
                               </td>
                               <td className="px-6 py-5 text-center font-mono font-bold text-amber-600">{ing.reorderLevel.toLocaleString()}</td>
                               <td className="px-6 py-5 text-center font-mono font-bold text-indigo-400">{Math.round(needed).toLocaleString()}</td>
                               <td className="px-6 py-5 text-center font-mono font-black text-slate-900">{ing.currentStock.toLocaleString()}</td>
                               <td className="px-10 py-5 text-right">
                                  {hasPendingReq ? (
                                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                       In Pipeline
                                    </span>
                                  ) : (shortfall > 0 || isBelowReorder) ? (
                                    <button 
                                      onClick={() => handleCreateRequisition({ ingredientName: ing.name, qtyToBuy: Math.ceil(Math.max(shortfall, ing.reorderLevel) * 1.15), estCost: Math.ceil(Math.max(shortfall, ing.reorderLevel) * 1.15) * ing.costPerUnit })}
                                      className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 transition-all"
                                    >
                                       Manual Req.
                                    </button>
                                  ) : (
                                    <span className="text-[9px] font-black text-emerald-500 uppercase opacity-40">Healthy</span>
                                  )}
                               </td>
                            </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-indigo-50 p-12 rounded-[4rem] border border-indigo-100 flex flex-col md:flex-row items-center gap-10 shadow-sm">
         <div className="text-6xl grayscale opacity-30 shrink-0">🏛️</div>
         <div>
            <h4 className="text-2xl font-bold font-serif text-indigo-900 mb-2 uppercase">Industrial Order Management</h4>
            <p className="text-sm text-indigo-700 leading-relaxed italic max-w-4xl">
              "The Auto-Procure engine automates the tedious math of restocking. It doesn't just look at what you have today; it looks at what your retailers are forecasted to sell tomorrow and ensures the flour is in the mixer before the first shift starts."
            </p>
         </div>
      </div>
    </div>
  );
};

export default AutomatedStockOptimizer;