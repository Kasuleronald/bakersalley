import React, { useState, useMemo } from 'react';
import { SKU, Outlet, ReturnLog, Sale, InventoryLoss } from '../types';

interface StalesManagerProps {
  skus: SKU[];
  outlets: Outlet[];
  returnLogs: ReturnLog[];
  setReturnLogs: (logs: ReturnLog[]) => void;
  inventoryLosses: InventoryLoss[];
  setInventoryLosses?: (losses: InventoryLoss[]) => void;
  currency: { format: (v: number) => string };
}

const StalesManager: React.FC<StalesManagerProps> = ({ 
  skus, outlets, returnLogs, setReturnLogs, inventoryLosses, setInventoryLosses, currency 
}) => {
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [newReturn, setNewReturn] = useState<Partial<ReturnLog>>({
    skuId: '', quantity: 0, reason: 'Stale'
  });

  const handleAddReturn = () => {
    if (!selectedOutletId || !newReturn.skuId || !newReturn.quantity) return;
    
    const sku = skus.find(s => s.id === newReturn.skuId)!;
    const value = (newReturn.quantity as number) * sku.factoryPrice;
    
    const log: ReturnLog = {
      id: `ret-${Date.now()}`,
      date: new Date().toISOString(),
      skuId: newReturn.skuId!,
      outletId: selectedOutletId,
      quantity: newReturn.quantity!,
      reason: newReturn.reason as any,
      value
    };

    setReturnLogs([log, ...returnLogs]);

    // Also record as a financial loss
    const loss: InventoryLoss = {
      id: `loss-ret-${Date.now()}`,
      date: log.date,
      skuId: log.skuId,
      quantity: log.quantity,
      reason: 'Return',
      source: outlets.find(o => o.id === selectedOutletId)?.name || 'Channel Return',
      unitCost: sku.factoryPrice,
      notes: `Stale/Return Reason: ${log.reason}`
    };
    /* Added: existence check for optional setter and spread current state */
    if (setInventoryLosses) {
      setInventoryLosses([loss, ...inventoryLosses]);
    }

    setNewReturn({ skuId: '', quantity: 0, reason: 'Stale' });
    alert("Return Archived. Impact recorded in wastage ledger.");
  };

  const stalesStats = useMemo(() => {
    const totalValue = returnLogs.reduce((s, x) => s + x.value, 0);
    const reasonSplit = returnLogs.reduce((acc, log) => {
        acc[log.reason] = (acc[log.reason] || 0) + log.value;
        return acc;
    }, {} as Record<string, number>);

    return { totalValue, reasonSplit };
  }, [returnLogs]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-rose-950 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl font-black">!</div>
            <div className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1">Cumulative Returns Value</div>
            <div className="text-4xl font-mono font-black text-white">{currency.format(stalesStats.totalValue)}</div>
            <p className="text-[8px] text-rose-400 mt-2 uppercase font-bold">Margin Erosion Detected</p>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Reason Classification</h5>
            <div className="space-y-2">
               {Object.entries(stalesStats.reasonSplit).map(([reason, val]) => (
                 <div key={reason} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase">{reason}</span>
                    <span className="font-mono font-black text-slate-900">{currency.format(val)}</span>
                 </div>
               ))}
            </div>
         </div>
         <div className="bg-amber-50 p-8 rounded-[3rem] border border-amber-100 flex flex-col justify-center items-center text-center">
            <div className="text-4xl mb-2">🥖</div>
            <p className="text-[10px] text-amber-800 leading-relaxed italic">
               "High stale rates indicate over-production. Adjust the S&OP plan to lower 'Conservative' targets for this route."
            </p>
         </div>
      </div>

      <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
         <div className="flex justify-between items-center border-b pb-6 border-slate-50">
            <h3 className="text-xl font-bold font-serif text-slate-900">Log Return Manifest</h3>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Digital Stales Control</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Delivery Channel</label>
               <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={selectedOutletId} onChange={e => setSelectedOutletId(e.target.value)}>
                  <option value="">Choose Van/Shop...</option>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">SKU Returned</label>
               <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={newReturn.skuId} onChange={e => setNewReturn({...newReturn, skuId: e.target.value})}>
                  <option value="">Select Item...</option>
                  {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Qty</label>
               <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black" value={newReturn.quantity || ''} onChange={e => setNewReturn({...newReturn, quantity: parseInt(e.target.value) || 0})} />
            </div>
            <button onClick={handleAddReturn} className="py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-rose-700">Archive Return</button>
         </div>
      </div>
    </div>
  );
};

export default StalesManager;
