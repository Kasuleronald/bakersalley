
import React, { useState, useMemo } from 'react';
import { Ingredient, Unit, Supplier, IngredientCategory, SKU, StorageCondition, Batch, RMQALog, LossReason } from '../types';
import { getConversionFactor } from '../utils/conversionUtils';
import { getIngredientScientificBrief } from '../services/geminiService';

interface IngredientManagerProps {
  ingredients: Ingredient[];
  setIngredients: (ingredients: Ingredient[]) => void;
  skus: SKU[];
  suppliers?: Supplier[];
  rmQaLogs?: RMQALog[];
  currency: { format: (v: number) => string };
  onManualCorrection?: (category: 'ingredients', id: string, updates: Record<string, any>, reason: string) => void;
}

const CATEGORY_COLORS: Record<IngredientCategory, string> = {
  Food: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Raw Material': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Packaging: 'bg-blue-50 text-blue-700 border-blue-100',
  Cleaning: 'bg-rose-50 text-rose-700 border-rose-100',
  Fuel: 'bg-amber-50 text-amber-700 border-amber-100',
  Tooling: 'bg-slate-50 text-slate-700 border-slate-100',
  'Finished Good': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  Other: 'bg-gray-50 text-gray-700 border-gray-100'
};

const UNITS: Unit[] = ['kg', 'l', 'ml', 'g', 'pc', 'roll', 'units', 'tray'];
const CATEGORIES: IngredientCategory[] = ['Food', 'Raw Material', 'Packaging', 'Cleaning', 'Fuel', 'Tooling', 'Finished Good', 'Other'];
const STORAGE: StorageCondition[] = ['Ambient', 'Chilled', 'Frozen', 'Dry/Dark', 'Hazardous'];
const LOSS_REASONS: LossReason[] = ['Audit Variance', 'Damage', 'Theft', 'Wasted', 'Expired', 'Floor Scrap', 'Reject', 'Sample'];

const IngredientManager: React.FC<IngredientManagerProps> = ({ ingredients, setIngredients, skus, suppliers = [], rmQaLogs = [], currency, onManualCorrection }) => {
  const [activeView, setActiveView] = useState<'Catalog' | 'Enrollment' | 'Adjust' | 'BatchEntry'>('Catalog');
  const [activeFilter, setActiveFilter] = useState<IngredientCategory | 'All'>('All');
  const [viewScienceId, setViewScienceId] = useState<string | null>(null);
  const [viewBatchesId, setViewBatchesId] = useState<string | null>(null);
  const [isScienceLoading, setIsScienceLoading] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  
  // Correction State
  const [adjId, setAdjId] = useState('');
  const [adjDelta, setAdjDelta] = useState(0);
  const [adjReason, setAdjReason] = useState<LossReason>('Audit Variance');
  const [adjMemo, setAdjMemo] = useState('');

  // Batch Receipt State
  const [batchIngId, setBatchIngId] = useState('');
  const [batchQty, setBatchQty] = useState(0);
  const [batchCost, setBatchCost] = useState(0);
  const [batchExpiry, setBatchExpiry] = useState('');

  // New Item State
  const [newIng, setNewIng] = useState<Partial<Ingredient>>({
    name: '', category: 'Raw Material', unit: 'kg', costPerUnit: 0, reorderLevel: 0, currentStock: 0, storageRequirement: 'Ambient', supplierName: ''
  });

  const handleFetchScience = async (ing: Ingredient) => {
    if (ing.scientificBrief) {
        setViewScienceId(ing.id);
        setViewBatchesId(null);
        return;
    }
    setIsScienceLoading(true);
    const brief = await getIngredientScientificBrief(ing.name);
    if (brief) {
        setIngredients(ingredients.map(i => i.id === ing.id ? { ...i, scientificBrief: brief } : i));
        setViewScienceId(ing.id);
        setViewBatchesId(null);
    }
    setIsScienceLoading(false);
  };

  const handleAddIngredient = () => {
    if (!newIng.name || !newIng.unit || !newIng.category) {
      alert("Name, Unit, and Category are mandatory for enrollment.");
      return;
    }

    if (editingIngredientId) {
      setIngredients(ingredients.map(i => i.id === editingIngredientId ? { ...i, ...newIng } as Ingredient : i));
      alert(`${newIng.name} master data updated.`);
    } else {
      const ingredient: Ingredient = {
        id: `ing-${Date.now()}`,
        name: newIng.name,
        unit: newIng.unit as Unit,
        costPerUnit: newIng.costPerUnit || 0,
        currentStock: newIng.currentStock || 0,
        reorderLevel: newIng.reorderLevel || 0,
        category: newIng.category as IngredientCategory,
        storageRequirement: newIng.storageRequirement as StorageCondition,
        supplierName: newIng.supplierName,
        batches: [],
        openingStock: newIng.currentStock || 0
      };
      setIngredients([ingredient, ...ingredients]);
      alert(`${newIng.name} has been enrolled in the material ledger.`);
    }

    setActiveView('Catalog');
    setEditingIngredientId(null);
    setNewIng({ name: '', category: 'Raw Material', unit: 'kg', costPerUnit: 0, reorderLevel: 0, currentStock: 0, storageRequirement: 'Ambient', supplierName: '' });
  };

  const handleStartEdit = (ing: Ingredient) => {
    setEditingIngredientId(ing.id);
    setNewIng({ ...ing });
    setActiveView('Enrollment');
  };

  const handleLogBatch = () => {
    if (!batchIngId || batchQty <= 0 || !batchExpiry || batchCost <= 0) {
      alert("Ingredient, Quantity, Expiry, and Unit Cost are required for batch logging.");
      return;
    }

    const ing = ingredients.find(i => i.id === batchIngId);
    if (!ing) return;

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      quantity: batchQty,
      expiryDate: batchExpiry,
      unitCost: batchCost,
      receivedDate: new Date().toISOString().split('T')[0]
    };

    const updatedIngredients = ingredients.map(i => {
      if (i.id === batchIngId) {
        return {
          ...i,
          currentStock: i.currentStock + batchQty,
          batches: [newBatch, ...(i.batches || [])],
          costPerUnit: batchCost 
        };
      }
      return i;
    });

    setIngredients(updatedIngredients);
    setBatchIngId('');
    setBatchQty(0);
    setBatchCost(0);
    setBatchExpiry('');
    setActiveView('Catalog');
    alert(`Batch of ${batchQty} ${ing.unit} logged for ${ing.name}.`);
  };

  const handleApplyAdjustment = () => {
    if (!adjId || !adjReason) return;
    const ing = ingredients.find(i => i.id === adjId);
    if (!ing) return;

    const nextStock = Math.max(0, ing.currentStock + adjDelta);
    
    if (onManualCorrection) {
      onManualCorrection('ingredients', adjId, { currentStock: nextStock }, `[Manual Adjust] ${adjReason}: ${adjMemo}`);
    } else {
      setIngredients(ingredients.map(i => i.id === adjId ? { ...i, currentStock: nextStock } : i));
    }
    
    setAdjId('');
    setAdjDelta(0);
    setAdjMemo('');
    setActiveView('Catalog');
    alert("Material balance recalibrated.");
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-3xl font-bold text-slate-900 font-serif uppercase tracking-tighter">Material Master Ledger</h3>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Governance of raw materials, consumables, and industrial energy inputs.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner border border-slate-200 overflow-x-auto scrollbar-hide">
           <button onClick={() => setActiveView('Catalog')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'Catalog' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Ledger</button>
           <button onClick={() => { setActiveView('BatchEntry'); setEditingIngredientId(null); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'BatchEntry' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>Log Batch 📦</button>
           <button onClick={() => { setActiveView('Adjust'); setEditingIngredientId(null); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'Adjust' ? 'bg-amber-50 text-white shadow-md' : 'text-slate-400'}`}>Manual Adjust</button>
           <button onClick={() => { setActiveView('Enrollment'); setEditingIngredientId(null); setNewIng({ name: '', category: 'Raw Material', unit: 'kg', costPerUnit: 0, reorderLevel: 0, currentStock: 0, storageRequirement: 'Ambient', supplierName: '' }); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'Enrollment' && !editingIngredientId ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}>+ Enroll Item</button>
        </div>
      </header>

      {activeView === 'Catalog' && (
        <div className="space-y-8">
           <div className="flex bg-white p-1 rounded-2xl border border-slate-100 w-fit overflow-x-auto scrollbar-hide max-w-full shadow-sm">
              <button onClick={() => setActiveFilter('All')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeFilter === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>All Items</button>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeFilter === cat ? 'bg-indigo-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{cat}</button>
              ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {ingredients.filter(i => activeFilter === 'All' || i.category === activeFilter).map((ing) => {
               const isLow = ing.currentStock <= ing.reorderLevel;
               const isViewingScience = viewScienceId === ing.id;
               const isViewingBatches = viewBatchesId === ing.id;

               return (
                 <div key={ing.id} className={`bg-white rounded-[2.5rem] p-8 border transition-all relative group flex flex-col ${isLow ? 'border-rose-200 bg-rose-50/5' : 'border-slate-100 shadow-sm hover:shadow-xl'}`}>
                    <div className="flex justify-between items-start mb-6">
                       <span className={`px-4 py-1 rounded-xl text-[8px] font-black uppercase border tracking-widest ${CATEGORY_COLORS[ing.category as IngredientCategory]}`}>
                          {ing.category}
                       </span>
                       <button onClick={() => handleStartEdit(ing)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-600 transition-opacity">✎ Edit</button>
                    </div>

                    {isViewingScience ? (
                        <div className="flex-1 space-y-4 animate-fadeIn">
                           <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Cereal Science Brief</h4>
                              <button onClick={() => setViewScienceId(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-900">BACK</button>
                           </div>
                           <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 max-h-[300px] overflow-y-auto scrollbar-hide text-[10px] leading-relaxed text-indigo-900 prose-sm prose-indigo italic">
                              {ing.scientificBrief}
                           </div>
                        </div>
                    ) : isViewingBatches ? (
                      <div className="flex-1 space-y-4 animate-fadeIn">
                         <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Active Batches (FEFO)</h4>
                            <button onClick={() => setViewBatchesId(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-900">BACK</button>
                         </div>
                         <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
                            {[...(ing.batches || [])].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map(b => {
                              const today = new Date();
                              today.setHours(0,0,0,0);
                              const exp = new Date(b.expiryDate);
                              const isExpired = exp < today;
                              const isNear = exp < new Date(today.getTime() + 3 * 24 * 3600000);
                              return (
                                <div key={b.id} className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${isExpired ? 'bg-rose-50 border-rose-100' : isNear ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-700">Exp: {new Date(b.expiryDate).toLocaleDateString()}</div>
                                    <div className="text-[8px] text-slate-400 font-mono">Lot: {b.id.slice(-8)}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-mono font-black text-indigo-900">{b.quantity} {ing.unit}</div>
                                    {isExpired ? <span className="text-[7px] font-black uppercase text-rose-600">Expired</span> : isNear ? <span className="text-[7px] font-black uppercase text-amber-600">Near Expiry</span> : null}
                                  </div>
                                </div>
                              );
                            })}
                         </div>
                      </div>
                    ) : (
                        <>
                            <h4 className="text-xl font-bold font-serif text-slate-900 mb-2 truncate uppercase tracking-tight">{ing.name}</h4>
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Unit: {ing.unit} • Store: {ing.storageRequirement}</div>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                               <button 
                                onClick={() => handleFetchScience(ing)}
                                disabled={isScienceLoading}
                                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${isScienceLoading ? 'bg-indigo-100 text-indigo-300 animate-pulse' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'}`}
                               >
                                 ✨ {ing.scientificBrief ? 'View Science' : 'Science Audit'}
                               </button>
                               <button onClick={() => { setViewBatchesId(ing.id); setViewScienceId(null); }} className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">🔍 View Batches</button>
                               <button onClick={() => { setBatchIngId(ing.id); setBatchCost(ing.costPerUnit); setActiveView('BatchEntry'); }} className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white transition-all">📦 Log Batch</button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50 items-center mt-auto">
                               <div>
                                  <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">On-Hand Ledger</span>
                                  <span className={`text-xl font-mono font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{ing.currentStock.toLocaleString()}</span>
                               </div>
                               <div className="text-right">
                                  <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Master Price</span>
                                  <span className="text-sm font-mono font-bold text-indigo-600">{currency.format(ing.costPerUnit)}</span>
                               </div>
                            </div>
                        </>
                    )}
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {activeView === 'BatchEntry' && (
        <div className="max-w-4xl mx-auto bg-slate-900 p-12 rounded-[4rem] shadow-2xl animate-softFade space-y-10 border-l-8 border-emerald-500">
           <div className="flex justify-between items-center border-b border-white/10 pb-6">
              <div>
                 <h3 className="text-2xl font-bold font-serif text-emerald-400 uppercase">Log Material Batch Receipt</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase mt-1">Industrial Stock Intake with Cost Interlock</p>
              </div>
              <button onClick={() => setActiveView('Catalog')} className="text-white/40 hover:text-white transition-colors uppercase font-black text-[10px]">✕ Abort</button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">1. Select Material Identity</label>
                    <select className="w-full p-5 bg-white/10 border-none rounded-2xl font-black text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" value={batchIngId} onChange={e => {
                        setBatchIngId(e.target.value);
                        const ing = ingredients.find(i => i.id === e.target.value);
                        if (ing) setBatchCost(ing.costPerUnit);
                    }}>
                       <option value="" className="text-slate-900">Choose Ingredient...</option>
                       {ingredients.map(i => <option key={i.id} value={i.id} className="text-slate-900">{i.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">2. Intake Quantity ({ingredients.find(i => i.id === batchIngId)?.unit || 'Units'})</label>
                    <input 
                      type="number" 
                      className="w-full p-6 bg-white/10 border-none rounded-3xl font-mono font-black text-4xl text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" 
                      value={batchQty || ''} 
                      onChange={e => setBatchQty(parseFloat(e.target.value) || 0)} 
                      placeholder="0"
                    />
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-emerald-400 uppercase mb-3 tracking-widest">3. Batch Unit Cost (UGX)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/40 font-mono font-bold">UGX</span>
                        <input 
                            type="number" 
                            className="w-full p-5 pl-14 bg-white/10 border-none rounded-2xl font-mono font-black text-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" 
                            value={batchCost || ''} 
                            onChange={e => setBatchCost(parseFloat(e.target.value) || 0)} 
                            placeholder="Price per unit"
                        />
                    </div>
                    <p className="text-[8px] text-slate-500 mt-2 italic">Current Master Rate: {currency.format(ingredients.find(i => i.id === batchIngId)?.costPerUnit || 0)}</p>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">4. Expiry Date (FEFO)</label>
                    <input 
                      type="date" 
                      className="w-full p-5 bg-white/10 border-none rounded-2xl font-bold text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      value={batchExpiry}
                      onChange={e => setBatchExpiry(e.target.value)}
                    />
                 </div>
              </div>
           </div>

           <div className="pt-10 border-t border-white/10 flex justify-end">
              <button 
                onClick={handleLogBatch}
                disabled={!batchIngId || batchQty <= 0 || !batchExpiry || batchCost <= 0}
                className="px-20 py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-white hover:text-emerald-900 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                Commit Batch to Storage
              </button>
           </div>
        </div>
      )}

      {activeView === 'Adjust' && (
        <div className="max-w-4xl mx-auto bg-slate-900 p-12 rounded-[4rem] shadow-2xl animate-softFade space-y-10 border-l-8 border-amber-500">
           <div className="flex justify-between items-center border-b border-white/10 pb-6">
              <div>
                 <h3 className="text-2xl font-bold font-serif text-amber-400 uppercase">Manual Stock Recalibration</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase mt-1">Manual Bypass for Non-Scanner Environments</p>
              </div>
              <button onClick={() => setActiveView('Catalog')} className="text-white/40 hover:text-white transition-colors uppercase font-black text-[10px]">✕ Abort</button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">1. Select Subject Material</label>
                    <select className="w-full p-5 bg-white/10 border-none rounded-2xl font-black text-sm text-white outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" value={adjId} onChange={e => setAdjId(e.target.value)}>
                       <option value="" className="text-slate-900">Choose Ingredient...</option>
                       {ingredients.map(i => <option key={i.id} value={i.id} className="text-slate-900">{i.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">2. Count Offset (+ or -)</label>
                    <div className="relative">
                       <input 
                        type="number" 
                        className="w-full p-6 bg-white/10 border-none rounded-3xl font-mono font-black text-5xl text-white text-center outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" 
                        value={adjDelta || ''} 
                        onChange={e => setAdjDelta(parseFloat(e.target.value) || 0)} 
                        placeholder="0"
                       />
                       <div className="absolute top-1/2 -translate-y-1/2 left-6 text-2xl font-black text-white/20">±</div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">3. Statutory Audit Reason</label>
                    <select className="w-full p-5 bg-white/10 border-none rounded-2xl font-bold text-sm text-white outline-none focus:ring-2 focus:ring-amber-500" value={adjReason} onChange={e => setAdjReason(e.target.value as any)}>
                       {LOSS_REASONS.map(r => <option key={r} value={r} className="text-slate-900">{r}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">4. Internal Narrative (Memo)</label>
                    <textarea 
                      className="w-full p-5 bg-white/10 border-none rounded-2xl text-sm font-medium text-white h-28 outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Explain the variance..."
                      value={adjMemo}
                      onChange={e => setAdjMemo(e.target.value)}
                    />
                 </div>
              </div>
           </div>

           <div className="pt-10 border-t border-white/10 flex justify-end">
              <button 
                onClick={handleApplyAdjustment}
                disabled={!adjId || adjDelta === 0}
                className="px-20 py-6 bg-amber-500 text-slate-950 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-white transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                Apply Adjustments to Ledger
              </button>
           </div>
        </div>
      )}

      {activeView === 'Enrollment' && (
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 animate-softFade space-y-12">
          <div className="flex justify-between items-center border-b border-slate-50 pb-8">
            <div>
              <h3 className="text-3xl font-bold font-serif text-slate-900">{editingIngredientId ? 'Update Material Data' : 'New Material Enrollment'}</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Specify technical parameters for the industrial ledger.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Item Name (Identity)</label>
                <input 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                  placeholder="e.g. Sacks of Winter Wheat Flour"
                  value={newIng.name}
                  onChange={e => setNewIng({...newIng, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Category</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    value={newIng.category}
                    onChange={e => setNewIng({...newIng, category: e.target.value as IngredientCategory})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Measurement Unit</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    value={newIng.unit}
                    onChange={e => setNewIng({...newIng, unit: e.target.value as Unit})}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase mb-3 tracking-widest">Master Cost (per unit)</label>
                  <input 
                    type="number"
                    className="w-full px-6 py-4 bg-indigo-50/30 border-none rounded-2xl font-mono font-black text-xl text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                    placeholder="0"
                    value={newIng.costPerUnit || ''}
                    onChange={e => setNewIng({...newIng, costPerUnit: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-rose-400 uppercase mb-3 tracking-widest">Reorder Floor</label>
                  <input 
                    type="number"
                    className="w-full px-6 py-4 bg-rose-50/30 border-none rounded-2xl font-mono font-black text-xl text-rose-900 outline-none focus:ring-2 focus:ring-rose-500 shadow-inner" 
                    placeholder="0"
                    value={newIng.reorderLevel || ''}
                    onChange={e => setNewIng({...newIng, reorderLevel: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Current Physical Stock</label>
                <input 
                  type="number"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-mono font-black text-xl text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                  placeholder="0"
                  value={newIng.currentStock || ''}
                  onChange={e => setNewIng({...newIng, currentStock: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-end gap-4">
            <button 
              onClick={() => { setActiveView('Catalog'); setEditingIngredientId(null); }}
              className="px-12 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
            >
              Abort
            </button>
            <button 
              onClick={handleAddIngredient}
              className="px-20 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-indigo-900 transition-all active:scale-95"
            >
              {editingIngredientId ? 'Commit Update' : 'Authorize Enrollment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientManager;
