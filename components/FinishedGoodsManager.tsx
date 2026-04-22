
import React, { useState, useMemo } from 'react';
// Added 'Sale' to the imports from '../types' to fix 'Cannot find name Sale' error
import { SKU, FinishedGood, Employee, Batch, Outlet, OutletStock, InventoryLoss, InventoryMovement, LossReason, ProductionLog, Ingredient, Sale, BusinessProfile } from '../types';
import { generateDeliveryNotePDF } from '../utils/exportUtils';
import FinishedGoodsIntegrity from './FinishedGoodsIntegrity';
import WarehouseIntelligence from './WarehouseIntelligence';

interface FinishedGoodsManagerProps {
  skus: SKU[];
  finishedGoods: FinishedGood[];
  setFinishedGoods: (fg: FinishedGood[]) => void;
  employees: Employee[];
  outlets: Outlet[];
  outletStocks: OutletStock[];
  setOutletStocks: (os: OutletStock[]) => void;
  inventoryLosses: InventoryLoss[];
  setInventoryLosses: (losses: InventoryLoss[]) => void;
  movements: InventoryMovement[];
  setMovements: (movs: InventoryMovement[]) => void;
  productionLogs: ProductionLog[];
  ingredients: Ingredient[];
  sales: Sale[];
  currency: { active: any; format: (v: number) => string; formatCompact: (v: number) => string };
  businessProfile?: BusinessProfile;
}

const FinishedGoodsManager: React.FC<FinishedGoodsManagerProps> = ({ 
  skus, finishedGoods, setFinishedGoods, outlets, outletStocks, setOutletStocks, 
  inventoryLosses = [], setInventoryLosses, movements, setMovements, productionLogs, ingredients, sales, currency,
  businessProfile
}) => {
  const [activeTab, setActiveTab] = useState<'Warehouse' | 'Intake_Audit' | 'Packaging_Audit' | 'Dispatch' | 'Intelligence'>('Warehouse');
  
  // Packaging Audit Logic
  const packagingAudit = useMemo(() => {
    const totalUnitsProduced = productionLogs.reduce((s, l) => s + (l.actualYield || l.totalUnitsProduced), 0);
    const packagingIssued = movements
        .filter(m => {
            const ing = ingredients.find(i => i.id === m.ingredientId);
            return ing?.category === 'Packaging' && m.type === 'Issued to Production';
        })
        .reduce((s, m) => s + m.quantity, 0);

    const wasteFactor = totalUnitsProduced > 0 ? (packagingIssued / totalUnitsProduced) : 1;
    const leakageUnits = Math.max(0, packagingIssued - totalUnitsProduced);
    
    return { totalUnitsProduced, packagingIssued, wasteFactor, leakageUnits };
  }, [productionLogs, movements, ingredients]);

  // Dispatch State
  const [targetOutletId, setTargetOutletId] = useState('');
  const [dispatchSkuId, setDispatchSkuId] = useState('');
  const [dispatchQty, setDispatchQty] = useState(0);

  const handleDispatch = () => {
    if (!targetOutletId || !dispatchSkuId || dispatchQty <= 0) return;
    const fgIdx = finishedGoods.findIndex(f => f.skuId === dispatchSkuId);
    if (fgIdx === -1 || finishedGoods[fgIdx].stockLevel < dispatchQty) {
      alert("Insufficient stock.");
      return;
    }
    const sku = skus.find(s => s.id === dispatchSkuId);
    const outlet = outlets.find(o => o.id === targetOutletId);
    if (!sku || !outlet) return;

    const nextFG = [...finishedGoods];
    nextFG[fgIdx] = { ...nextFG[fgIdx], stockLevel: nextFG[fgIdx].stockLevel - dispatchQty };
    setFinishedGoods(nextFG);

    const osIdx = outletStocks.findIndex(os => os.outletId === targetOutletId && os.skuId === dispatchSkuId);
    if (osIdx > -1) {
      const nextOS = [...outletStocks];
      nextOS[osIdx] = { ...nextOS[osIdx], stockLevel: nextOS[osIdx].stockLevel + dispatchQty };
      setOutletStocks(nextOS);
    } else {
      setOutletStocks([...outletStocks, { outletId: targetOutletId, skuId: dispatchSkuId, stockLevel: dispatchQty }]);
    }

    setMovements([{ id: `DISP-${Date.now()}`, skuId: dispatchSkuId, type: 'Dispatched to Outlet', quantity: -dispatchQty, date: new Date().toISOString(), destination: outlet.name, notes: `Voucher Generated.` }, ...movements]);
    generateDeliveryNotePDF(outlet, sku, dispatchQty, businessProfile);
    setDispatchQty(0);
    alert(`Dispatch Finalized to ${outlet.name}.`);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 font-serif tracking-tight uppercase">Supply Chain Hub</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Industrial Movement Control</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto">
          {[
            { id: 'Warehouse', label: 'Availability', icon: '📦' },
            { id: 'Intelligence', label: 'Intelligence', icon: '📊' },
            { id: 'Intake_Audit', label: 'Oven Intake', icon: '⚖️' },
            { id: 'Packaging_Audit', label: 'Packaging Audit', icon: '🛍️' },
            { id: 'Dispatch', label: 'Route Dispatch', icon: '🚚' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'Intelligence' && (
        <WarehouseIntelligence 
          skus={skus}
          finishedGoods={finishedGoods}
          sales={sales}
          movements={movements}
          currency={currency}
        />
      )}

      {activeTab === 'Packaging_Audit' && (
        <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex flex-col justify-center text-center">
                    <div className="text-[10px] font-black text-indigo-400 uppercase mb-2">Packaging Waste Factor</div>
                    <div className={`text-5xl font-mono font-black ${packagingAudit.wasteFactor > 1.05 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                        {((packagingAudit.wasteFactor - 1) * 100).toFixed(1)}%
                    </div>
                    <p className="text-[8px] text-slate-500 mt-2 uppercase">Limit: 5% Variance</p>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Unaccounted Bags/Boxes</div>
                    <div className="text-4xl font-mono font-black text-slate-900">{packagingAudit.leakageUnits.toLocaleString()}</div>
                    <p className="text-[8px] text-rose-500 font-bold uppercase mt-2">Potential Floor Theft/Waste</p>
                </div>
                <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 flex flex-col justify-center items-center text-center">
                    <div className="text-4xl mb-2">🛍️</div>
                    <p className="text-[10px] text-indigo-900 leading-relaxed italic">
                        "If the packaging issued exceeds the units produced, materials are leaking. Audit the packing station SOPs."
                    </p>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'Warehouse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skus.map((sku) => {
            const fg = finishedGoods.find((f) => f.skuId === sku.id) || { stockLevel: 0, batches: [] };
            return (
              <div key={sku.id} className={`bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-inner">{sku.isCake ? '🎂' : '🥖'}</div>
                  <span className="text-[8px] font-black bg-slate-100 px-2 py-1 rounded text-slate-400 uppercase">Bin #{sku.id.slice(-4)}</span>
                </div>
                <h4 className="text-xl font-bold font-serif uppercase truncate">{sku.name}</h4>
                <div className="mt-6 pt-6 border-t border-slate-50">
                    <div className="text-[9px] font-black text-slate-300 uppercase mb-1">Stock On-Hand</div>
                    <div className="text-4xl font-mono font-black text-slate-900">{fg.stockLevel.toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'Intake_Audit' && <FinishedGoodsIntegrity skus={skus} productionLogs={productionLogs} finishedGoods={finishedGoods} setFinishedGoods={setFinishedGoods} inventoryLosses={inventoryLosses} setInventoryLosses={setInventoryLosses} movements={movements} setMovements={setMovements} currency={currency} />}
      
      {activeTab === 'Dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          <div className="lg:col-span-5 bg-white p-10 rounded-[3.5rem] border border-indigo-100 shadow-xl space-y-8">
            <h3 className="text-lg font-bold font-serif text-slate-900 uppercase">Dispatch Manifest Entry</h3>
            <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={targetOutletId} onChange={(e) => setTargetOutletId(e.target.value)}><option value="">Target Outlet/Route...</option>{outlets.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}</select>
            <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={dispatchSkuId} onChange={(e) => setDispatchSkuId(e.target.value)}><option value="">Select Product...</option>{skus.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select>
            <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black text-lg" value={dispatchQty || ''} onChange={(e) => setDispatchQty(parseFloat(e.target.value) || 0)} placeholder="Transfer Quantity" />
            <button onClick={handleDispatch} className="w-full py-5 bg-indigo-900 text-white rounded-[2.5rem] font-black uppercase text-xs shadow-xl hover:bg-black transition-all">Authorize Transfer</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinishedGoodsManager;
