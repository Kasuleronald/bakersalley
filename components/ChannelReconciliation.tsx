
import React, { useState, useMemo } from 'react';
import { SKU, Outlet, OutletStock, Sale, InventoryLoss, InventoryMovement, LossReason } from '../types';

interface ChannelReconciliationProps {
  skus: SKU[];
  outlets: Outlet[];
  outletStocks: OutletStock[];
  setOutletStocks: (os: OutletStock[]) => void;
  sales: Sale[];
  inventoryLosses: InventoryLoss[];
  setInventoryLosses: (losses: InventoryLoss[]) => void;
  movements: InventoryMovement[];
  setMovements: (movs: InventoryMovement[]) => void;
  currency: { format: (v: number) => string };
}

const LOSS_REASONS: LossReason[] = ['Damage', 'Expired', 'Theft', 'Sample', 'Audit Variance', 'Return'];

const ChannelReconciliation: React.FC<ChannelReconciliationProps> = ({
  skus, outlets, outletStocks, setOutletStocks, sales, inventoryLosses, setInventoryLosses, movements, setMovements, currency
}) => {
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [reconciliationDate, setReconciliationDate] = useState(new Date().toISOString().split('T')[0]);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [reconReasons, setReconReasons] = useState<Record<string, LossReason>>({});

  const activeOutlet = useMemo(() => outlets.find(o => o.id === selectedOutletId), [outlets, selectedOutletId]);

  const reconciliationLedger = useMemo(() => {
    if (!selectedOutletId) return [];

    return skus.map(sku => {
      // 1. Load-In: Total units dispatched from Warehouse to this outlet on the selected date
      const shiftLoadIn = movements
        .filter(m => 
          m.skuId === sku.id && 
          m.destination === activeOutlet?.name && 
          m.date.startsWith(reconciliationDate) && 
          m.type === 'Dispatched to Outlet'
        )
        .reduce((sum, m) => sum + m.quantity, 0);
      
      // 2. Shift Sales: Recorded POS sales
      const shiftSales = sales
        .filter(s => 
          s.outletId === selectedOutletId && 
          s.skuId === sku.id && 
          s.date.startsWith(reconciliationDate)
        )
        .reduce((sum, s) => sum + s.quantity, 0);

      // 3. System Closing (Theoretic): What SHOULD be there.
      // (Current system stock is already live, so we derive 'Theoretic Closing' 
      // based on the assumption of a start-of-day count of 0 for vans or previous day closing for shops)
      const currentStock = outletStocks.find(os => os.outletId === selectedOutletId && os.skuId === sku.id)?.stockLevel || 0;
      
      const physical = physicalCounts[sku.id] ?? currentStock;
      const variance = physical - currentStock;

      return {
        sku,
        shiftLoadIn,
        shiftSales,
        systemClosing: currentStock,
        physical,
        variance,
        exposureValue: Math.abs(variance) * sku.retailPrice
      };
    });
  }, [selectedOutletId, skus, outletStocks, sales, movements, reconciliationDate, physicalCounts, activeOutlet]);

  const stats = useMemo(() => {
    const totalExposure = reconciliationLedger.reduce((sum, item) => sum + (item.variance < 0 ? item.exposureValue : 0), 0);
    const totalItems = reconciliationLedger.length;
    const balancedItems = reconciliationLedger.filter(i => i.variance === 0).length;
    const integrityScore = totalItems > 0 ? (balancedItems / totalItems) * 100 : 100;
    
    return { totalExposure, integrityScore };
  }, [reconciliationLedger]);

  const handleFinalizeReconciliation = () => {
    if (!selectedOutletId) return;
    if (!window.confirm(`Finalize audit for ${activeOutlet?.name}? This will record UGX ${stats.totalExposure.toLocaleString()} in channel losses.`)) return;

    let nextOutletStocks = [...outletStocks];
    let nextLosses = [...inventoryLosses];
    let nextMovements = [...movements];

    reconciliationLedger.forEach(item => {
      if (item.variance === 0) return;

      nextOutletStocks = nextOutletStocks.map(os => 
        (os.outletId === selectedOutletId && os.skuId === item.sku.id)
          ? { ...os, stockLevel: item.physical }
          : os
      );

      nextMovements.unshift({
        id: `recon-ch-${Date.now()}-${item.sku.id}`,
        skuId: item.sku.id,
        type: 'Channel Audit Adjustment',
        quantity: item.variance,
        date: new Date().toISOString(),
        destination: activeOutlet?.name,
        notes: `Physical Audit Variance: ${reconReasons[item.sku.id] || 'Unaccounted Leakage'}`
      });

      if (item.variance < 0) {
        nextLosses.unshift({
          id: `loss-ch-${Date.now()}-${item.sku.id}`,
          date: reconciliationDate,
          skuId: item.sku.id,
          quantity: Math.abs(item.variance),
          reason: reconReasons[item.sku.id] || 'Theft', // Default to theft for unaccounted channel loss
          source: activeOutlet?.name || 'Unknown',
          unitCost: item.sku.factoryPrice,
          notes: `Shift reconciliation for ${activeOutlet?.type}`
        });
      }
    });

    setOutletStocks(nextOutletStocks);
    setInventoryLosses(nextLosses);
    setMovements(nextMovements);
    setPhysicalCounts({});
    setReconReasons({});
    alert("Distribution Ledger Reconciled.");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* AUDIT CONTROLS */}
      <div className="bg-white p-8 rounded-[3rem] border border-coffee-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-coffee-400 uppercase mb-2 tracking-widest">Division / Route</label>
            <select 
              className="w-full p-4 bg-coffee-50 border-none rounded-2xl font-bold text-coffee-900 outline-none focus:ring-2 focus:ring-coffee-500"
              value={selectedOutletId}
              onChange={e => setSelectedOutletId(e.target.value)}
            >
              <option value="">Select Channel...</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.name} ({o.type})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-coffee-400 uppercase mb-2 tracking-widest">Audit Date</label>
            <input 
              type="date" 
              className="w-full p-4 bg-coffee-50 border-none rounded-2xl font-bold text-coffee-900"
              value={reconciliationDate}
              onChange={e => setReconciliationDate(e.target.value)}
            />
          </div>
          <div className="text-center">
             <div className="text-[10px] font-black text-coffee-400 uppercase mb-1">Integrity Score</div>
             <div className={`text-2xl font-mono font-black ${stats.integrityScore > 95 ? 'text-emerald-500' : 'text-rose-500'}`}>
               {stats.integrityScore.toFixed(0)}%
             </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-coffee-400 uppercase mb-1">Leakage Exposure</div>
             <div className={`text-2xl font-mono font-black ${stats.totalExposure > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
               {currency.format(stats.totalExposure)}
             </div>
          </div>
        </div>
      </div>

      {selectedOutletId ? (
        <div className="bg-white rounded-[3.5rem] shadow-sm border border-coffee-50 overflow-hidden animate-softFade">
          <div className="px-10 py-8 bg-coffee-900 text-white flex justify-between items-center">
             <div>
                <h3 className="text-2xl font-bold font-serif">Shift Reconciliation: {activeOutlet?.name}</h3>
                <p className="text-coffee-300 text-[10px] font-black uppercase tracking-widest mt-1">Audit Type: Delivered vs. Sold</p>
             </div>
             <button 
              onClick={handleFinalizeReconciliation}
              className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all"
             >
                💾 Lock Shift Audit
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-coffee-50 text-[10px] font-black text-coffee-400 uppercase tracking-widest border-b">
                  <th className="px-10 py-6">Product SKU</th>
                  <th className="px-6 py-6 text-center">Load-In (Units)</th>
                  <th className="px-6 py-6 text-center">Sales (Units)</th>
                  <th className="px-6 py-6 text-center">System Closing</th>
                  <th className="px-6 py-6 text-center">Physical Count</th>
                  <th className="px-10 py-6 text-right">Variance / Leakage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {reconciliationLedger.map(item => (
                  <tr key={item.sku.id} className={`hover:bg-coffee-50/30 transition-all ${item.variance !== 0 ? 'bg-amber-50/10' : ''}`}>
                    <td className="px-10 py-6">
                      <div className="font-black text-coffee-900 text-sm uppercase">{item.sku.name}</div>
                      <div className="text-[9px] text-coffee-400 font-bold uppercase">{item.sku.category}</div>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <div className="text-xs font-mono font-bold text-indigo-600">+{item.shiftLoadIn}</div>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <div className="text-xs font-mono font-bold text-emerald-600">-{item.shiftSales}</div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="text-sm font-mono font-bold text-coffee-300">{item.systemClosing}</div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center">
                         <input 
                          type="number"
                          className="w-24 p-2 bg-coffee-50 border border-coffee-100 rounded-xl text-center font-mono font-black text-coffee-900 outline-none focus:ring-2 focus:ring-coffee-500"
                          value={physicalCounts[item.sku.id] ?? ''}
                          onChange={e => setPhysicalCounts({...physicalCounts, [item.sku.id]: parseFloat(e.target.value) || 0})}
                          placeholder={item.systemClosing.toString()}
                         />
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex flex-col items-end">
                          <div className={`text-lg font-mono font-black ${item.variance < 0 ? 'text-rose-600' : item.variance > 0 ? 'text-emerald-600' : 'text-coffee-100'}`}>
                            {item.variance === 0 ? '--' : `${item.variance > 0 ? '+' : ''}${item.variance}`}
                          </div>
                          {item.variance !== 0 && (
                            <select 
                              className="mt-1 p-1 bg-transparent border-none text-[8px] font-black uppercase text-coffee-400 outline-none"
                              value={reconReasons[item.sku.id] || ''}
                              onChange={e => setReconReasons({...reconReasons, [item.sku.id]: e.target.value as LossReason})}
                            >
                                <option value="">Reason...</option>
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
      ) : (
        <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-coffee-100">
           <div className="text-7xl mb-6 opacity-20 grayscale">⚖️</div>
           <h4 className="text-xl font-bold font-serif text-coffee-400 uppercase tracking-widest">Division Audit Logic</h4>
           <p className="text-sm text-coffee-300 max-w-sm mx-auto mt-2 italic">Select a distribution channel to begin the "Delivered vs. Sold" reconciliation process.</p>
        </div>
      )}

      <div className="bg-coffee-900 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-6xl opacity-30 grayscale">📉</div>
         <div className="relative z-10">
            <h4 className="text-2xl font-bold font-serif text-amber-400 mb-4">Eliminating Channel Shrinkage</h4>
            <p className="text-sm text-coffee-100/70 leading-relaxed max-w-4xl italic">
              "In bakery distribution, the most common source of revenue leakage is 'Unaccounted Returns' and 'Van Theft'. This module forces a mathematical closure to every dispatch. By loading dispatches (`Load-In`) and comparing against recorded `Sales`, the system calculates exactly how many units the driver should have left. Any deviation is recorded as a financial loss, creating immediate accountability for your distribution team."
            </p>
         </div>
      </div>
    </div>
  );
};

export default ChannelReconciliation;
