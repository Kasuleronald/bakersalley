import React, { useState, useMemo } from 'react';
import { Ingredient, InventoryMovement, InventoryLoss, LossReason } from '../types';

interface MaterialMassBalanceProps {
  ingredients: Ingredient[];
  setIngredients: (ings: Ingredient[]) => void;
  movements: InventoryMovement[];
  setMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
  inventoryLosses: InventoryLoss[];
  setInventoryLosses: (losses: InventoryLoss[]) => void;
  currency: { format: (v: number) => string };
}

const LOSS_REASONS: LossReason[] = ['Wasted', 'Theft', 'Expired', 'Audit Variance', 'Floor Scrap', 'Damage'];

const MaterialMassBalance: React.FC<MaterialMassBalanceProps> = ({
  ingredients, setIngredients, movements, setMovements, inventoryLosses, setInventoryLosses, currency
}) => {
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [reconReasons, setReconReasons] = useState<Record<string, LossReason>>({});

  const auditLedger = useMemo(() => {
    return ingredients.map(ing => {
      const received = movements
        .filter(m => m.ingredientId === ing.id && m.date.startsWith(auditDate) && m.type === 'Received from Supplier')
        .reduce((sum, m) => sum + m.quantity, 0);

      const issued = movements
        .filter(m => m.ingredientId === ing.id && m.date.startsWith(auditDate) && m.type === 'Issued to Production')
        .reduce((sum, m) => sum + m.quantity, 0);

      const theoretical = ing.currentStock;
      const physical = physicalCounts[ing.id] ?? theoretical;
      const variance = physical - theoretical;

      return {
        ing,
        received,
        issued,
        theoretical,
        physical,
        variance,
        exposure: Math.abs(variance) * ing.costPerUnit
      };
    });
  }, [ingredients, movements, auditDate, physicalCounts]);

  const stats = useMemo(() => {
    const shrinkage = auditLedger.reduce((sum, item) => sum + (item.variance < 0 ? item.exposure : 0), 0);
    const accuracy = ingredients.length > 0 
      ? (auditLedger.filter(i => Math.abs(i.variance) < 0.01).length / ingredients.length) * 100 
      : 100;
    return { shrinkage, accuracy };
  }, [auditLedger, ingredients]);

  const handleFinalize = () => {
    if (ingredients.length === 0) return;
    if (!window.confirm(`Commit audit data? Unaccounted variance: ${currency.format(stats.shrinkage)}`)) return;

    let nextIngs = [...ingredients];
    let nextLosses = [...inventoryLosses];
    let nextMovs = [...movements];

    auditLedger.forEach(item => {
      if (item.variance === 0) return;

      nextIngs = nextIngs.map(i => i.id === item.ing.id ? { ...i, currentStock: item.physical } : i);

      nextMovs.unshift({
        id: `rm-audit-${Date.now()}-${item.ing.id}`,
        ingredientId: item.ing.id,
        type: 'Stock Count Adjustment',
        quantity: item.variance,
        date: new Date().toISOString(),
        notes: `Physical Recon Audit: ${reconReasons[item.ing.id] || 'Variance'}`
      });

      if (item.variance < 0) {
        nextLosses.unshift({
          id: `rm-loss-${Date.now()}-${item.ing.id}`,
          date: auditDate,
          ingredientId: item.ing.id,
          quantity: Math.abs(item.variance),
          reason: reconReasons[item.ing.id] || 'Audit Variance',
          source: 'Mandatory Mass Balance Audit',
          unitCost: item.ing.costPerUnit,
          notes: 'Journalized Shrinkage'
        });
      }
    });

    setIngredients(nextIngs);
    setInventoryLosses(nextLosses);
    setMovements(nextMovs);
    setPhysicalCounts({});
    alert("Material Master Ledger Balanced & Sealed.");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Audit Cycle Date</label>
            <input 
              type="date" 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              value={auditDate}
              onChange={e => setAuditDate(e.target.value)}
            />
          </div>
          <div className="text-center">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Ledger Fidelity</div>
             <div className={`text-3xl font-mono font-black ${stats.accuracy > 98 ? 'text-emerald-500' : 'text-amber-500'}`}>
               {stats.accuracy.toFixed(0)}%
             </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Shrinkage Write-off</div>
             <div className={`text-3xl font-mono font-black ${stats.shrinkage > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-100'}`}>
               {currency.format(stats.shrinkage)}
             </div>
          </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center border-b-4 border-indigo-500">
           <div>
              <h3 className="text-2xl font-bold font-serif uppercase tracking-tighter">Inventory Integrity Verification</h3>
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-1">Reconciling Theoretic Ledger vs Physical Truth</p>
           </div>
           <button 
            onClick={handleFinalize}
            className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all"
           >
              Seal Ledger Audit
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-10 py-6">Material Unit</th>
                <th className="px-6 py-6 text-center">Receipts (+)</th>
                <th className="px-6 py-6 text-center">Issues (-)</th>
                <th className="px-6 py-6 text-center">Theoretic Cls.</th>
                <th className="px-6 py-6 text-center">Physical Reality</th>
                <th className="px-10 py-6 text-right">Audit Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {auditLedger.map(item => (
                <tr key={item.ing.id} className={`hover:bg-indigo-50/10 transition-all ${item.variance !== 0 ? 'bg-amber-50/5' : ''}`}>
                  <td className="px-10 py-5">
                    <div className="font-black text-slate-900 text-sm uppercase">{item.ing.name}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">{item.ing.unit}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                     <div className="text-xs font-mono font-bold text-emerald-600">+{item.received}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                     <div className="text-xs font-mono font-bold text-rose-600">-{item.issued}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="text-sm font-mono font-bold text-slate-300">{item.theoretical}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                       <input 
                        type="number"
                        className="w-24 p-2 bg-slate-50 border border-slate-100 rounded-xl text-center font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={physicalCounts[item.ing.id] ?? ''}
                        onChange={e => setPhysicalCounts({...physicalCounts, [item.ing.id]: parseFloat(e.target.value) || 0})}
                        placeholder={item.theoretical.toString()}
                       />
                    </div>
                  </td>
                  <td className="px-10 py-5 text-right">
                     <div className="flex flex-col items-end">
                        <div className={`text-lg font-mono font-black ${item.variance < 0 ? 'text-rose-600' : item.variance > 0 ? 'text-emerald-600' : 'text-slate-100'}`}>
                          {item.variance === 0 ? '--' : `${item.variance > 0 ? '+' : ''}${item.variance}`}
                        </div>
                        {item.variance !== 0 && (
                          <select 
                            className="mt-1 p-1 bg-transparent border-none text-[8px] font-black uppercase text-rose-400 outline-none"
                            value={reconReasons[item.ing.id] || ''}
                            onChange={e => setReconReasons({...reconReasons, [item.ing.id]: e.target.value as LossReason})}
                          >
                              <option value="">Choose Reason...</option>
                              {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialMassBalance;