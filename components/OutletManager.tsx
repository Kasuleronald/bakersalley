
import React, { useState } from 'react';
import { Outlet, SKU, OutletStock, FinishedGood, OutletType } from '../types';

interface OutletManagerProps {
  outlets: Outlet[];
  setOutlets: (o: Outlet[]) => void;
  outletStocks: OutletStock[];
  setOutletStocks: (os: OutletStock[]) => void;
  skus: SKU[];
  finishedGoods: FinishedGood[];
  setFinishedGoods: (fg: FinishedGood[]) => void;
}

const OUTLET_TYPES: OutletType[] = ['Factory Shop', 'Wholesale/Distributor', 'Retail Shop', 'Van Distribution'];

const OutletManager: React.FC<OutletManagerProps> = ({ 
  outlets, setOutlets, 
  outletStocks, setOutletStocks, 
  skus, 
  finishedGoods, setFinishedGoods 
}) => {
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [newOutlet, setNewOutlet] = useState<Partial<Outlet>>({ name: '', location: '', type: 'Retail Shop', isSemiIndependent: false });
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  
  const [transferSkuId, setTransferSkuId] = useState('');
  const [transferQty, setTransferQty] = useState(0);

  const activeOutlet = outlets.find(o => o.id === selectedOutletId);

  const handleAddOutlet = () => {
    if (newOutlet.name) {
      const outlet: Outlet = {
        id: `outlet-${Date.now()}`,
        name: newOutlet.name!,
        location: newOutlet.location || 'General',
        type: (newOutlet.type as any) || 'Retail Shop',
        isSemiIndependent: newOutlet.isSemiIndependent || false
      };
      setOutlets([...outlets, outlet]);
      setShowAddOutlet(false);
      setNewOutlet({ name: '', location: '', type: 'Retail Shop', isSemiIndependent: false });
    }
  };

  const handleTransfer = () => {
    if (!selectedOutletId || !transferSkuId || transferQty <= 0) return;

    const fg = finishedGoods.find(f => f.skuId === transferSkuId);
    if (!fg || fg.stockLevel < transferQty) {
      alert("Insufficient factory stock for transfer!");
      return;
    }

    setFinishedGoods(finishedGoods.map(f => 
      f.skuId === transferSkuId ? { ...f, stockLevel: f.stockLevel - transferQty } : f
    ));

    const existingOsIdx = outletStocks.findIndex(os => os.outletId === selectedOutletId && os.skuId === transferSkuId);
    if (existingOsIdx > -1) {
      const newOs = [...outletStocks];
      newOs[existingOsIdx].stockLevel += transferQty;
      setOutletStocks(newOs);
    } else {
      setOutletStocks([...outletStocks, { 
        outletId: selectedOutletId, 
        skuId: transferSkuId, 
        stockLevel: transferQty 
      }]);
    }

    setTransferSkuId('');
    setTransferQty(0);
  };

  const getOutletIcon = (type: string) => {
    switch (type) {
      case 'Retail Shop': return '🏪';
      case 'Wholesale/Distributor': return '🏗️';
      case 'Factory Shop': return '🏬';
      case 'Van Distribution': return '🚛';
      default: return '📍';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-coffee-900 font-serif">Distribution Hub</h2>
          <p className="text-coffee-500 font-medium">Manage multi-channel inventory across shops, distributors, and delivery vans.</p>
        </div>
        <button 
          onClick={() => setShowAddOutlet(true)}
          className="bg-coffee-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-black transition-all active:scale-95"
        >
          + Add Distribution Point
        </button>
      </header>

      {showAddOutlet && (
        <div className="bg-coffee-50 p-8 rounded-[2.5rem] border border-coffee-200 animate-fadeIn">
          <h3 className="font-bold text-coffee-900 mb-6 uppercase tracking-widest text-sm">Create New Point of Sale</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-bold text-coffee-600 mb-2 uppercase">Entity Name</label>
              <input 
                className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-coffee-500 font-bold"
                value={newOutlet.name}
                onChange={e => setNewOutlet({...newOutlet, name: e.target.value})}
                placeholder="e.g. Van No. 4"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-coffee-600 mb-2 uppercase">Zone / Route</label>
              <input 
                className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-coffee-500"
                value={newOutlet.location}
                onChange={e => setNewOutlet({...newOutlet, location: e.target.value})}
                placeholder="e.g. Kampala Metropolitan"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-coffee-600 mb-2 uppercase">Division Type</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-coffee-500 font-bold"
                value={newOutlet.type}
                onChange={e => setNewOutlet({...newOutlet, type: e.target.value as any})}
              >
                {OUTLET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pb-4">
               <input 
                type="checkbox" id="semi-ind" checked={newOutlet.isSemiIndependent} onChange={e => setNewOutlet({...newOutlet, isSemiIndependent: e.target.checked})} 
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
               />
               <label htmlFor="semi-ind" className="text-[9px] font-black uppercase text-indigo-900 cursor-pointer">Independent Mode</label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddOutlet} className="flex-1 bg-coffee-900 text-white py-3 rounded-xl font-bold shadow-md">Enroll Point</button>
              <button onClick={() => setShowAddOutlet(false)} className="px-4 py-3 bg-white text-coffee-900 rounded-xl font-bold border border-coffee-200">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outlets.map(outlet => {
          const isActive = selectedOutletId === outlet.id;
          const totalUnits = outletStocks
            .filter(os => os.outletId === outlet.id)
            .reduce((sum, os) => sum + os.stockLevel, 0);

          return (
            <button 
              key={outlet.id}
              onClick={() => setSelectedOutletId(outlet.id)}
              className={`text-left p-8 rounded-[2.5rem] border transition-all ${isActive ? 'bg-coffee-900 text-white shadow-2xl border-coffee-900 scale-105 z-10' : 'bg-white border-coffee-50 hover:border-coffee-200 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-6">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isActive ? 'bg-white/10 text-amber-400' : 'bg-coffee-50 text-coffee-600'}`}>
                   {getOutletIcon(outlet.type)}
                 </div>
                 <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${isActive ? 'bg-white/10' : 'bg-stone-100 text-stone-500'}`}>
                      {outlet.type}
                    </span>
                    {outlet.isSemiIndependent && (
                      <span className="text-[7px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Independent</span>
                    )}
                 </div>
              </div>
              <h4 className="text-xl font-bold font-serif mb-2">{outlet.name}</h4>
              <p className={`text-xs mb-6 ${isActive ? 'text-coffee-200' : 'text-stone-400'}`}>📍 {outlet.location}</p>
              
              <div className={`pt-6 border-t ${isActive ? 'border-white/10' : 'border-stone-50'}`}>
                 <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Total On-Hand</div>
                 <div className="text-2xl font-mono font-bold">{totalUnits.toLocaleString()} <span className="text-xs uppercase font-black">Units</span></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OutletManager;
