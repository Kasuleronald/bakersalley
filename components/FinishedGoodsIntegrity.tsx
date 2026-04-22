
import React, { useState, useMemo } from 'react';
import { SKU, ProductionLog, FinishedGood, InventoryLoss, LossReason, InventoryMovement, Batch } from '../types';

interface FinishedGoodsIntegrityProps {
  skus: SKU[];
  productionLogs: ProductionLog[];
  finishedGoods: FinishedGood[];
  setFinishedGoods: (fg: FinishedGood[]) => void;
  inventoryLosses: InventoryLoss[];
  setInventoryLosses: (losses: InventoryLoss[]) => void;
  movements: InventoryMovement[];
  setMovements: (movs: InventoryMovement[]) => void;
  currency: { format: (v: number) => string };
}

const LOSS_REASONS: LossReason[] = ['Damage', 'Reject', 'Floor Scrap', 'Theft', 'Audit Variance', 'Packaging Waste'];

const FinishedGoodsIntegrity: React.FC<FinishedGoodsIntegrityProps> = ({
  skus, productionLogs, finishedGoods, setFinishedGoods, inventoryLosses, setInventoryLosses, movements, setMovements, currency
}) => {
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualCounts, setActualCounts] = useState<Record<string, number>>({});
  const [reconReasons, setReconReasons] = useState<Record<string, LossReason>>({});
  const [expandedSkuId, setExpandedSkuId] = useState<string | null>(null);

  interface GroupedItem {
    sku: SKU;
    theoretical: number;
    bakerYield: number;
    logIds: string[];
  }

  const getExpiryStatus = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (diffDays < 0) return 'Expired';
    if (diffDays <= 3) return 'Nearing';
    return 'Safe';
  };

  const integrityLedger = useMemo(() => {
    const logs = productionLogs.filter(log => log.date === auditDate);
    
    const grouped = logs.reduce((acc, log) => {
      if (!acc[log.skuId]) {
        const skuFound = skus.find(s => s.id === log.skuId);
        if (!skuFound) return acc;
        acc[log.skuId] = {
          sku: skuFound,
          theoretical: 0,
          bakerYield: 0,
          logIds: [] as string[]
        };
      }
      acc[log.skuId].theoretical += log.totalUnitsProduced;
      acc[log.skuId].bakerYield += (log.actualYield ?? log.totalUnitsProduced);
      acc[log.skuId].logIds.push(log.id);
      return acc;
    }, {} as Record<string, GroupedItem>);

    return (Object.values(grouped) as GroupedItem[]).map(item => {
      const actual = actualCounts[item.sku.id] ?? item.bakerYield;
      const bakerVariance = actual - item.bakerYield;
      const targetVariance = actual - item.theoretical;
      const variancePercent = item.theoretical > 0 ? Math.abs(targetVariance) / item.theoretical : 0;
      const yieldEfficiency = item.theoretical > 0 ? (actual / item.theoretical) * 100 : 100;

      return {
        ...item,
        actual,
        bakerVariance,
        targetVariance,
        variancePercent,
        yieldEfficiency,
        lossValue: Math.abs(bakerVariance) * item.sku.factoryPrice
      };
    });
  }, [productionLogs, auditDate, skus, actualCounts]);

  const stats = useMemo(() => {
    const totalBakerYield = integrityLedger.reduce((sum, item) => sum + item.bakerYield, 0);
    const totalWarehouseIntake = integrityLedger.reduce((sum, item) => sum + item.actual, 0);
    const shrinkage = totalBakerYield - totalWarehouseIntake;
    const accuracy = totalBakerYield > 0 ? (totalWarehouseIntake / totalBakerYield) * 100 : 100;
    
    return { shrinkage, accuracy, totalWarehouseIntake, totalLossValue: integrityLedger.reduce((sum, item) => sum + (item.bakerVariance < 0 ? item.lossValue : 0), 0) };
  }, [integrityLedger]);

  const handleFinalizeIntake = () => {
    if (integrityLedger.length === 0) return;
    if (!window.confirm(`Finalize Warehouse Intake? This will confirm ${stats.totalWarehouseIntake} units into stock and write off ${currency.format(stats.totalLossValue)} in transition loss.`)) return;

    let nextFg = [...finishedGoods];
    let nextLosses = [...inventoryLosses];
    let nextMovements = [...movements];

    integrityLedger.forEach(item => {
      const fgIdx = nextFg.findIndex(f => f.skuId === item.sku.id);
      if (fgIdx > -1) {
        nextFg[fgIdx] = { 
          ...nextFg[fgIdx], 
          stockLevel: nextFg[fgIdx].stockLevel + item.bakerVariance 
        };
      }

      if (item.bakerVariance !== 0) {
        nextMovements.unshift({
          id: `fg-intake-adj-${Date.now()}-${item.sku.id}`,
          skuId: item.sku.id,
          type: 'Stock Count Adjustment',
          quantity: item.bakerVariance,
          date: new Date().toISOString(),
          notes: `Intake Audit Variance: ${reconReasons[item.sku.id] || 'Transition Loss'}`
        });

        if (item.bakerVariance < 0) {
          nextLosses.unshift({
            id: `loss-intake-${Date.now()}-${item.sku.id}`,
            date: auditDate,
            skuId: item.sku.id,
            quantity: Math.abs(item.bakerVariance),
            reason: reconReasons[item.sku.id] || 'Audit Variance',
            source: 'Warehouse Intake Gate',
            unitCost: item.sku.factoryPrice,
            notes: `Loss detected between Oven and Warehouse storage.`
          });
        }
      }
    });

    setFinishedGoods(nextFg);
    setInventoryLosses(nextLosses);
    setMovements(nextMovements);
    setActualCounts({});
    setReconReasons({});
    alert("Warehouse Intake Synchronized with Floor Production.");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-[3rem] border border-indigo-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Shift / Date</label>
            <input 
              type="date" 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              value={auditDate}
              onChange={e => setAuditDate(e.target.value)}
            />
          </div>
          <div className="text-center">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Reception Accuracy</div>
             <div className={`text-2xl font-mono font-black ${stats.accuracy > 99 ? 'text-emerald-500' : 'text-amber-500'}`}>
               {stats.accuracy.toFixed(1)}%
             </div>
          </div>
          <div className="text-center">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Transition Shrinkage</div>
             <div className={`text-2xl font-mono font-black ${stats.shrinkage > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
               {stats.shrinkage} <span className="text-xs uppercase font-black">Units</span>
             </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Financial Exposure</div>
             <div className={`text-2xl font-mono font-black text-rose-600`}>
               {currency.format(stats.totalLossValue)}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-50 overflow-hidden">
        <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center">
           <div>
              <h3 className="text-2xl font-bold font-serif">Oven-to-Intake Reconciliation</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Verifying production floor output vs. warehouse reception</p>
           </div>
           <button 
            disabled={integrityLedger.length === 0}
            onClick={handleFinalizeIntake}
            className="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all disabled:opacity-30"
           >
              💾 Lock Intake Ledger
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-10 py-6">Product Formulation</th>
                <th className="px-6 py-6 text-center">Recipe Target</th>
                <th className="px-6 py-6 text-center">Baker's Claim</th>
                <th className="px-6 py-6 text-center">Clerk's Intake</th>
                <th className="px-6 py-6 text-center">Audit Variance</th>
                <th className="px-6 py-6 text-center">Target Variance</th>
                <th className="px-10 py-6 text-right">Yield Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {integrityLedger.map(item => {
                const isOverThreshold = item.variancePercent > 0.05;
                const fg = finishedGoods.find(f => f.skuId === item.sku.id);
                const isExpanded = expandedSkuId === item.sku.id;

                return (
                  <React.Fragment key={item.sku.id}>
                    <tr className={`hover:bg-indigo-50/20 transition-all ${item.bakerVariance !== 0 ? 'bg-amber-50/10' : ''}`}>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setExpandedSkuId(isExpanded ? null : item.sku.id)}
                            className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            {isExpanded ? '−' : '＋'}
                          </button>
                          <div>
                            <div className="font-black text-slate-900 text-sm uppercase">{item.sku.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{item.sku.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                         <div className="text-xs font-mono font-bold text-slate-300">{item.theoretical}</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                         <div className="text-xs font-mono font-bold text-slate-400">{item.bakerYield}</div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                           <input 
                            type="number"
                            className="w-24 p-2 bg-slate-50 border border-slate-100 rounded-xl text-center font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={actualCounts[item.sku.id] ?? ''}
                            onChange={e => setActualCounts({...actualCounts, [item.sku.id]: parseFloat(e.target.value) || 0})}
                            placeholder={item.bakerYield.toString()}
                           />
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                         <div className={`text-sm font-mono font-black ${item.bakerVariance < 0 ? 'text-rose-600' : item.bakerVariance > 0 ? 'text-emerald-600' : 'text-slate-200'}`}>
                            {item.bakerVariance === 0 ? '--' : `${item.bakerVariance > 0 ? '+' : ''}${item.bakerVariance}`}
                         </div>
                         {item.bakerVariance !== 0 && (
                            <select 
                              className="mt-1 p-1 bg-transparent border-none text-[8px] font-black uppercase text-indigo-400 outline-none"
                              value={reconReasons[item.sku.id] || ''}
                              onChange={e => setReconReasons({...reconReasons, [item.sku.id]: e.target.value as LossReason})}
                            >
                                <option value="">Set Reason...</option>
                                {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                         )}
                      </td>
                      <td className="px-6 py-6 text-center">
                         <div className={`text-lg font-mono font-black ${isOverThreshold ? 'text-red-600 animate-pulse' : 'text-slate-400'}`}>
                            {item.targetVariance === 0 ? '--' : `${item.targetVariance > 0 ? '+' : ''}${item.targetVariance}`}
                         </div>
                         <div className={`text-[8px] font-black uppercase ${isOverThreshold ? 'text-red-500' : 'text-slate-300'}`}>
                            { (item.variancePercent * 100).toFixed(1) }% Dev.
                         </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <div className={`text-sm font-mono font-black ${item.yieldEfficiency >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {item.yieldEfficiency.toFixed(1)}%
                         </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/80 animate-softFade">
                        <td colSpan={7} className="px-10 py-6">
                           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-inner">
                              <div className="flex justify-between items-center mb-4">
                                 <h5 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Active Warehouse Batches</h5>
                                 <span className="text-[8px] font-bold text-slate-400 uppercase">Stock On-Hand: {fg?.stockLevel || 0}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {fg?.batches && fg.batches.length > 0 ? fg.batches.map((batch: Batch) => {
                                   const status = getExpiryStatus(batch.expiryDate);
                                   const colorClass = status === 'Expired' ? 'border-rose-200 bg-rose-50 text-rose-700' : status === 'Nearing' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700';
                                   
                                   return (
                                     <div key={batch.id} className={`p-4 rounded-2xl border transition-all ${colorClass} flex justify-between items-center`}>
                                        <div>
                                           <div className="text-[10px] font-mono font-black uppercase">{batch.id.slice(-8)}</div>
                                           <div className="text-[8px] font-bold uppercase opacity-60">Expires: {new Date(batch.expiryDate).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-right">
                                           <div className="text-sm font-mono font-black">{batch.quantity}</div>
                                           <div className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${status === 'Expired' ? 'bg-rose-600 text-white' : status === 'Nearing' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                              {status}
                                           </div>
                                        </div>
                                     </div>
                                   );
                                 }) : (
                                   <div className="col-span-full py-6 text-center text-[10px] text-slate-300 italic uppercase">No physical batches found in bin.</div>
                                 )}
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {integrityLedger.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest">No production logs found for this date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-indigo-950 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-6xl opacity-30 grayscale">🧾</div>
         <div className="relative z-10">
            <h4 className="text-2xl font-bold font-serif text-amber-400 mb-4">Target-vs-Physical Integrity</h4>
            <p className="text-sm text-indigo-100/70 leading-relaxed max-w-4xl italic">
              "The 5% variance threshold is a critical KPI for industrial consistency. While minor deviations are expected in artisanal baking, consistent red-flagging indicates issues with scaling accuracy, proofer timing, or oven calibration. Use the batch audit expansion to monitor expiry velocity and prevent spoilage losses."
            </p>
         </div>
      </div>
    </div>
  );
};

export default FinishedGoodsIntegrity;
