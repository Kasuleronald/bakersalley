
import React, { useState, useMemo } from 'react';
import { SKU, Ingredient, Activity, RecipeItem, Employee, Overhead, Transaction, ProductionLog, IndustryProfile, TaxConfig, SKUVariant } from '../types';
import { getConversionFactor } from '../utils/conversionUtils';
import { getIndustryTerms } from '../utils/industryUtils';
import FormulaLab from './FormulaLab';

interface RecipeBuilderProps {
  skus: SKU[];
  setSkus: (skus: SKU[]) => void;
  ingredients: Ingredient[];
  activities: Activity[];
  overheads: Overhead[];
  employees: Employee[];
  transactions: Transaction[];
  productionLogs: ProductionLog[];
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
  industry?: IndustryProfile;
  onNavigate?: (tab: string) => void;
  taxConfig: TaxConfig;
}

const RecipeBuilder: React.FC<RecipeBuilderProps> = ({ skus = [], setSkus, ingredients = [], activities = [], overheads = [], employees = [], transactions = [], productionLogs = [], currency, industry = 'Bakery', onNavigate, taxConfig }) => {
  const terms = useMemo(() => getIndustryTerms(taxConfig), [taxConfig]);
  const [viewMode, setViewMode] = useState<'Library' | 'Dashboard' | 'Lab'>('Library');
  const [editingSku, setEditingSku] = useState<Partial<SKU> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Baker's Percentage Logic
  const bakersPercentage = useMemo(() => {
    if (!editingSku || !editingSku.recipeItems) return [];
    
    const primaryFlourItem = editingSku.recipeItems.find(ri => {
      const ing = ingredients.find(i => i.id === ri.ingredientId);
      return ing?.name.toLowerCase().includes('flour');
    });

    const getGrams = (qty: number, unit: string) => {
      const u = unit.toLowerCase();
      if (u === 'kg') return qty * 1000;
      if (u === 'lb') return qty * 453.59;
      if (u === 'oz') return qty * 28.35;
      if (u === 'l') return qty * 1000;
      return qty; 
    };
    
    const flourWeightGrams = primaryFlourItem ? getGrams(primaryFlourItem.quantity, primaryFlourItem.unit) : 1;

    return editingSku.recipeItems.map(ri => {
      const ing = ingredients.find(i => i.id === ri.ingredientId);
      const itemGrams = getGrams(ri.quantity, ri.unit);
      const pct = (itemGrams / flourWeightGrams) * 100;
      return { id: ri.ingredientId, name: ing?.name || 'Unknown', pct };
    });
  }, [editingSku, ingredients]);

  // 2. Total Dough Mass Calculation
  const totalDoughMass = useMemo(() => {
    if (!editingSku) return 0;
    const baseItems = editingSku?.recipeItems || [];
    const decorationItems = editingSku?.cakeDecorationItems || [];
    const allItems = [...baseItems, ...decorationItems];
    
    return allItems.reduce((sum, item) => {
      if (!item || !item.unit) return sum;
      const u = item.unit.toLowerCase();
      let factor = 1;
      if (u === 'kg') factor = 1000;
      else if (u === 'lb') factor = 453.59;
      else if (u === 'oz') factor = 28.35;
      else if (u === 'l') factor = 1000;
      return sum + (item.quantity * factor);
    }, 0);
  }, [editingSku]);

  // 3. RECIPE COSTING ENGINE
  const costingAudit = useMemo(() => {
    if (!editingSku || !editingSku.recipeItems) return { materialCost: 0, unitCogs: 0, margin: 0, marginPct: 0 };
    
    const allItems = [
        ...(editingSku.recipeItems || []),
        ...(editingSku.cakeDecorationItems || [])
    ];

    const totalMaterialCost = allItems.reduce((sum, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (!ing) return sum;
      
      const factor = getConversionFactor(ing, item.unit);
      const cost = ing.costPerUnit * (item.quantity * factor);
      return sum + cost;
    }, 0);

    const yieldAmount = Math.max(1, editingSku.yield || 1);
    const unitCogs = (totalMaterialCost * 1.08) / yieldAmount; // Including 8% industrial waste factor
    const price = editingSku.retailPrice || 0;
    const margin = price - unitCogs;
    const marginPct = price > 0 ? (margin / price) * 100 : 0;

    return { totalMaterialCost, unitCogs, margin, marginPct };
  }, [editingSku, ingredients]);

  const handleSave = () => {
    if (!editingSku?.name) return;
    const final: SKU = {
      ...editingSku,
      id: editingSku.id || `SKU-${Date.now()}`,
      version: (editingSku.version || 0) + 1,
      recipeItems: editingSku.recipeItems || [],
      packagingItems: editingSku.packagingItems || [],
      activities: editingSku.activities || [],
      cakeDecorationItems: editingSku.cakeDecorationItems || [],
      variants: editingSku.variants || [],
    } as SKU;
    setSkus(editingSku.id ? skus.map(s => s.id === editingSku.id ? final : s) : [...skus, final]);
    setEditingSku(null);
  };

  const handleAddVariant = () => {
    const next = editingSku?.variants || [];
    setEditingSku({
      ...editingSku,
      variants: [...next, { id: `var-${Date.now()}`, name: 'New Size', weight: 1, price: editingSku?.retailPrice || 0 }]
    });
  };

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter">{terms.recipeLabel} Hub</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{terms.skuLabel} Engineering • Multi-Formulation Lab</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
          {['Library', 'Lab', 'Dashboard'].map(tab => (
            <button key={tab} onClick={() => setViewMode(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === tab ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
          ))}
        </div>
      </header>

      {viewMode === 'Lab' && <FormulaLab ingredients={ingredients} currency={currency} onImportRecipe={(r) => { setEditingSku(r); setViewMode('Library'); }} />}

      {viewMode === 'Library' && (editingSku ? (
        <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 animate-fadeIn space-y-10">
           <header className="flex justify-between items-start border-b border-slate-50 pb-8">
              <div className="flex-1">
                 <div className="flex items-center gap-4">
                    <input className="text-3xl font-bold font-serif text-slate-900 outline-none border-none placeholder:text-slate-200 uppercase w-full bg-transparent" placeholder={`${terms.skuLabel} Title`} value={editingSku.name || ''} onChange={e => setEditingSku({...editingSku, name: e.target.value})} />
                    <label className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-all">
                        <input type="checkbox" className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" checked={editingSku.isCake} onChange={e => setEditingSku({...editingSku, isCake: e.target.checked})} />
                        <span className="text-[10px] font-black text-amber-900 uppercase">Cake Line</span>
                    </label>
                 </div>
                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">{terms.recipeLabel} v{(editingSku.version || 0) + 1}</div>
              </div>
              <button onClick={() => setEditingSku(null)} className="text-slate-300 hover:text-slate-900 font-bold uppercase text-xs">Exit Builder ✕</button>
           </header>
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-12">
                 {/* CORE INGREDIENTS SECTION */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex justify-between items-center">
                        Base Formulation Components
                        <span className="bg-slate-100 px-3 py-0.5 rounded-full text-[8px] font-bold">Standard Mix</span>
                    </h4>
                    <div className="space-y-3">
                        {(editingSku.recipeItems || []).map((ri, idx) => {
                           const bp = bakersPercentage.find(p => p.id === ri.ingredientId);
                           const ing = ingredients.find(i => i.id === ri.ingredientId);
                           const factor = ing ? getConversionFactor(ing, ri.unit) : 1;
                           const itemCost = ing ? (ing.costPerUnit * ri.quantity * factor) : 0;
                           
                           return (
                             <div key={idx} className="flex flex-col md:flex-row gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 items-center">
                                <div className="flex-1 w-full">
                                  <label className="text-[7px] font-black text-slate-400 uppercase block mb-1">Material</label>
                                  <select className="w-full bg-transparent font-bold text-xs outline-none" value={ri.ingredientId} onChange={e => {
                                     const next = [...(editingSku.recipeItems || [])];
                                     next[idx].ingredientId = e.target.value;
                                     setEditingSku({...editingSku, recipeItems: next});
                                  }}>
                                     <option value="">Select Material...</option>
                                     {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                  </select>
                                </div>
                                
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                   <div className="text-right">
                                      <div className="text-[7px] font-black text-indigo-400 uppercase">Weight/Qty</div>
                                      <div className="flex gap-1">
                                        <input type="number" className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-mono font-bold text-right outline-none focus:ring-1 focus:ring-indigo-500" value={ri.quantity} onChange={e => {
                                           const next = [...(editingSku.recipeItems || [])];
                                           next[idx].quantity = parseFloat(e.target.value) || 0;
                                           setEditingSku({...editingSku, recipeItems: next});
                                        }} />
                                        <select className="bg-white border border-slate-200 rounded-xl px-1 text-[10px] font-bold outline-none" value={ri.unit} onChange={e => {
                                           const next = [...(editingSku.recipeItems || [])];
                                           next[idx].unit = e.target.value;
                                           setEditingSku({...editingSku, recipeItems: next});
                                        }}>
                                           {['g', 'kg', 'lb', 'oz', 'ml', 'l'].map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                      </div>
                                   </div>
                                   <div className="w-16 text-center">
                                      <div className="text-[7px] font-black text-slate-400 uppercase">Baker %</div>
                                      <div className="text-xs font-mono font-black text-slate-900">{bp?.pct.toFixed(1)}%</div>
                                   </div>
                                   <div className="w-24 text-right">
                                      <div className="text-[7px] font-black text-emerald-500 uppercase">Line Cost</div>
                                      <div className="text-xs font-mono font-bold text-emerald-700">{currency.format(itemCost)}</div>
                                   </div>
                                </div>
                                <button onClick={() => setEditingSku({...editingSku, recipeItems: (editingSku.recipeItems || []).filter((_, i) => i !== idx)})} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">✕</button>
                             </div>
                           );
                        })}
                        <button onClick={() => setEditingSku({...editingSku, recipeItems: [...(editingSku.recipeItems || []), {ingredientId: '', quantity: 0, unit: 'g'}]})} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-[9px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all">+ Add Ingredient Component</button>
                    </div>
                 </div>

                 {/* CAKE SPECIALIZATION SECTION */}
                 {editingSku.isCake && (
                   <div className="space-y-8 animate-fadeIn">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b pb-2 flex justify-between items-center">
                            Cake Decoration & Finish (Consumables)
                            <span className="bg-amber-100 px-3 py-0.5 rounded-full text-[8px] font-bold">Top-layer Costs</span>
                         </h4>
                         <div className="space-y-3">
                            {(editingSku.cakeDecorationItems || []).map((di, idx) => {
                               const ing = ingredients.find(i => i.id === di.ingredientId);
                               const factor = ing ? getConversionFactor(ing, di.unit) : 1;
                               const itemCost = ing ? (ing.costPerUnit * di.quantity * factor) : 0;
                               return (
                                 <div key={idx} className="flex flex-col md:flex-row gap-4 p-5 bg-amber-50/30 rounded-3xl border border-amber-100 items-center">
                                    <div className="flex-1 w-full">
                                      <select className="w-full bg-transparent font-bold text-xs outline-none" value={di.ingredientId} onChange={e => {
                                         const next = [...(editingSku.cakeDecorationItems || [])];
                                         next[idx].ingredientId = e.target.value;
                                         setEditingSku({...editingSku, cakeDecorationItems: next});
                                      }}>
                                         <option value="">Select Decor Material...</option>
                                         {ingredients.filter(i => i.category === 'Food' || i.category === 'Other').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                      </select>
                                    </div>
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                       <div className="flex gap-1">
                                          <input type="number" className="w-16 bg-white border border-amber-100 rounded-xl px-2 py-1 text-xs font-mono font-bold text-right outline-none" value={di.quantity} onChange={e => {
                                             const next = [...(editingSku.cakeDecorationItems || [])];
                                             next[idx].quantity = parseFloat(e.target.value) || 0;
                                             setEditingSku({...editingSku, cakeDecorationItems: next});
                                          }} />
                                          <select className="bg-white border border-amber-100 rounded-xl px-1 text-[10px] font-bold outline-none" value={di.unit} onChange={e => {
                                             const next = [...(editingSku.cakeDecorationItems || [])];
                                             next[idx].unit = e.target.value;
                                             setEditingSku({...editingSku, cakeDecorationItems: next});
                                          }}>
                                             {['g', 'kg', 'ml', 'l', 'pc'].map(u => <option key={u} value={u}>{u}</option>)}
                                          </select>
                                       </div>
                                       <div className="w-24 text-right">
                                          <div className="text-xs font-mono font-bold text-amber-700">{currency.format(itemCost)}</div>
                                       </div>
                                    </div>
                                    <button onClick={() => setEditingSku({...editingSku, cakeDecorationItems: (editingSku.cakeDecorationItems || []).filter((_, i) => i !== idx)})} className="p-2 text-amber-200 hover:text-rose-500 transition-colors">✕</button>
                                 </div>
                               );
                            })}
                            <button onClick={() => setEditingSku({...editingSku, cakeDecorationItems: [...(editingSku.cakeDecorationItems || []), {ingredientId: '', quantity: 0, unit: 'g'}]})} className="w-full py-4 border-2 border-dashed border-amber-200 rounded-3xl text-[9px] font-black uppercase text-amber-400 hover:bg-amber-50/50 transition-all">+ Add Decoration Consumable</button>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="p-8 bg-indigo-50/30 rounded-[3rem] border border-indigo-100">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 border-b border-indigo-100 pb-2">Variation Matrix (Sizes & Weights)</h4>
                            <div className="space-y-3 mb-6">
                               {(editingSku.variants || []).map((v, idx) => (
                                 <div key={v.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-2xl border border-indigo-100 items-center">
                                    <div className="col-span-1">
                                       <label className="text-[7px] font-black text-slate-400 uppercase">Variant Name</label>
                                       <input className="w-full text-xs font-bold bg-transparent border-none outline-none" value={v.name} onChange={e => {
                                          const next = [...(editingSku.variants || [])];
                                          next[idx].name = e.target.value;
                                          setEditingSku({...editingSku, variants: next});
                                       }} placeholder="e.g. 2kg Large" />
                                    </div>
                                    <div>
                                       <label className="text-[7px] font-black text-slate-400 uppercase">Target Weight (kg)</label>
                                       <input type="number" className="w-full text-xs font-mono font-bold bg-transparent border-none outline-none" value={v.weight} onChange={e => {
                                          const next = [...(editingSku.variants || [])];
                                          next[idx].weight = parseFloat(e.target.value) || 0;
                                          setEditingSku({...editingSku, variants: next});
                                       }} />
                                    </div>
                                    <div>
                                       <label className="text-[7px] font-black text-indigo-600 uppercase">Custom Price</label>
                                       <input type="number" className="w-full text-xs font-mono font-black bg-transparent border-none outline-none text-indigo-900" value={v.price} onChange={e => {
                                          const next = [...(editingSku.variants || [])];
                                          next[idx].price = parseFloat(e.target.value) || 0;
                                          setEditingSku({...editingSku, variants: next});
                                       }} />
                                    </div>
                                    <div className="flex justify-end">
                                       <button onClick={() => setEditingSku({...editingSku, variants: (editingSku.variants || []).filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-rose-500 font-bold">✕</button>
                                    </div>
                                 </div>
                               ))}
                            </div>
                            <button onClick={handleAddVariant} className="px-6 py-2 bg-indigo-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">+ Add Market Variant</button>
                         </div>

                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Base Design Specification</label>
                            <textarea 
                                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium h-32 outline-none focus:ring-2 focus:ring-indigo-500" 
                                placeholder="Detail the physical design template, required icing textures, and finishing tools..."
                                value={editingSku.baseDesign || ''}
                                onChange={e => setEditingSku({...editingSku, baseDesign: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-indigo-50/50 rounded-[3rem] border border-indigo-100 flex items-center justify-between">
                       <div>
                          <div className="text-[9px] font-black text-indigo-600 uppercase mb-1">Total Mass (Base + Decor)</div>
                          <div className="text-3xl font-mono font-black text-indigo-950">{Math.round(totalDoughMass).toLocaleString()} <span className="text-xs">g</span></div>
                       </div>
                       <div className="text-right">
                          <div className="text-[9px] font-black text-indigo-600 uppercase mb-1">Per Piece</div>
                          <div className="text-xl font-mono font-black text-indigo-800">
                             {Math.round(totalDoughMass / (editingSku.yield || 1))}g
                          </div>
                       </div>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-between">
                       <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Target Yield</div>
                          <div className="text-3xl font-mono font-black text-slate-900">{editingSku.yield || 0}</div>
                       </div>
                       <span className="text-2xl opacity-20">🥖</span>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[4rem] text-white shadow-2xl flex flex-col justify-between border border-white/5 relative overflow-hidden h-fit sticky top-4">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full translate-x-10 -translate-y-10 blur-3xl"></div>
                 
                 <div className="space-y-6 relative z-10">
                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest text-center border-b border-white/10 pb-4">Calibration & Margin Audit</h4>
                    
                    <div className="space-y-4">
                        <div>
                           <label className="block text-[8px] font-bold text-indigo-300 uppercase mb-2">Standard Retail Price</label>
                           <input type="number" className="w-full p-4 bg-white/10 rounded-2xl font-mono font-black text-xl text-white outline-none focus:ring-1 focus:ring-amber-500" value={editingSku.retailPrice || ''} onChange={e => setEditingSku({...editingSku, retailPrice: parseFloat(e.target.value) || 0})} placeholder="0" />
                        </div>
                        <div>
                           <label className="block text-[8px] font-bold text-indigo-300 uppercase mb-2">Target Yield per Batch</label>
                           <input type="number" className="w-full p-4 bg-white/10 rounded-2xl font-mono text-white outline-none focus:ring-1 focus:ring-amber-500" value={editingSku.yield || ''} onChange={e => setEditingSku({...editingSku, yield: parseFloat(e.target.value) || 1})} />
                        </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-white/5">
                        <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5 flex justify-between items-center">
                           <div>
                              <div className="text-[8px] font-bold text-slate-500 uppercase mb-1">Unit Material COGS</div>
                              <div className="text-xl font-mono font-black text-emerald-400">{currency.format(costingAudit.unitCogs)}</div>
                           </div>
                           <div className="text-right">
                              <div className="text-[8px] font-bold text-slate-500 uppercase mb-1">Batch Value</div>
                              <div className="text-xs font-mono font-bold text-slate-300">{currency.format(costingAudit.totalMaterialCost || 0)}</div>
                           </div>
                        </div>

                        <div className={`p-6 rounded-[2rem] border flex flex-col items-center justify-center text-center transition-all ${costingAudit.marginPct > 35 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Manufacturing Margin</div>
                           <div className={`text-4xl font-mono font-black ${costingAudit.marginPct > 35 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {costingAudit.marginPct.toFixed(1)}%
                           </div>
                           <p className="text-[8px] text-slate-500 uppercase mt-2 font-bold tracking-tighter">Profit per piece: {currency.format(costingAudit.margin)}</p>
                        </div>
                    </div>
                 </div>

                 <button onClick={handleSave} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl hover:bg-emerald-600 transition-all mt-10 relative z-10">Archive Formulation</button>
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 w-full max-w-md relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
              <input 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder={`Search catalog...`} 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <button 
              onClick={() => setEditingSku({ name: '', yield: 1, retailPrice: 0, recipeItems: [], activities: [], isCake: false, variants: [] })}
              className="px-8 py-3 bg-indigo-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all"
            >
              + New Product Concept
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skus.filter(s => s && s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(sku => (
              <div key={sku.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl group flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    {sku.isCake ? '🎂' : '🥖'}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-400 uppercase">v{sku.version}</span>
                    {sku.isCake && <span className="text-[7px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">Cake line</span>}
                  </div>
                </div>
                <h4 className="text-xl font-bold font-serif uppercase truncate text-slate-900">{sku.name}</h4>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">{sku.category}</div>
                
                <div className="mt-6 pt-6 border-t border-slate-50 space-y-4 flex-1">
                   <div className="flex justify-between">
                      <span className="text-[9px] font-black text-slate-300 uppercase">Batch Yield</span>
                      <span className="text-xs font-mono font-bold">{sku.yield} {sku.unit}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-[9px] font-black text-slate-300 uppercase">Retail Mag.</span>
                      <span className="text-xs font-mono font-black text-indigo-600">{currency.format(sku.retailPrice)}</span>
                   </div>
                   {sku.variants && sku.variants.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[9px] font-black text-amber-500 uppercase">Market Variants</span>
                        <span className="text-xs font-mono font-bold">{sku.variants.length} SKU(s)</span>
                      </div>
                   )}
                </div>

                <button 
                  onClick={() => setEditingSku(sku)}
                  className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-md"
                >
                  Inspect Formula
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecipeBuilder;
