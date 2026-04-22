
import React, { useState, useMemo } from 'react';
import { Order, SKU, Customer, OrderItem } from '../types';
import { generatePackingSlipPDF, generateConsolidatedPickListPDF } from '../utils/exportUtils';

interface PackingStationProps {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  skus: SKU[];
  customers: Customer[];
}

const PackingStation: React.FC<PackingStationProps> = ({ orders, setOrders, skus, customers }) => {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [packedItems, setPackedItems] = useState<Record<string, Record<string, boolean>>>({});

  const pendingPacking = useMemo(() => {
    return orders.filter(o => o.status === 'Processing' || (o.status === 'Pending' && o.submittedToAdmin));
  }, [orders]);

  const consolidatedPickList = useMemo(() => {
    const totals: Record<string, { name: string; qty: number; unit: string }> = {};
    
    pendingPacking.filter(o => selectedOrderIds.includes(o.id)).forEach(order => {
      order.items.forEach(item => {
        const sku = skus.find(s => s.id === item.skuId);
        if (!sku) return;
        if (!totals[item.skuId]) {
          totals[item.skuId] = { name: sku.name, qty: 0, unit: sku.unit };
        }
        totals[item.skuId].qty += item.quantity;
      });
    });

    return Object.values(totals);
  }, [pendingPacking, selectedOrderIds, skus]);

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const handleTogglePacked = (orderId: string, skuId: string) => {
    setPackedItems(prev => {
      const orderPacked = prev[orderId] || {};
      return {
        ...prev,
        [orderId]: { ...orderPacked, [skuId]: !orderPacked[skuId] }
      };
    });
  };

  const handleMarkAsPacked = (orderId: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'Packed', wipStep: 'Packing' } : o));
    alert(`Order ${orderId} marked as Packed and ready for Dispatch.`);
  };

  const handlePrintMasterPickList = () => {
    if (consolidatedPickList.length === 0) {
      alert("Please select at least one order to generate a pick list.");
      return;
    }
    generateConsolidatedPickListPDF(consolidatedPickList);
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
        <div className="relative z-10 space-y-2">
           <h3 className="text-3xl font-bold font-serif text-amber-400">Picking & Packing Center</h3>
           <p className="text-slate-400 text-sm max-w-lg">Consolidate multiple orders into a single warehouse pick list and verify individual buckets before dispatch.</p>
        </div>
        <div className="relative z-10 flex gap-4">
           <button 
            onClick={handlePrintMasterPickList}
            className="bg-amber-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-amber-700 transition-all flex items-center gap-2"
           >
              <span>📋</span> Master Pick List ({selectedOrderIds.length})
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PICK LIST SIDEBAR (DESKTOP) */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Consolidated Fetch (Selected)</h4>
              <div className="space-y-4">
                 {consolidatedPickList.length > 0 ? consolidatedPickList.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="font-bold text-xs text-slate-800 uppercase truncate pr-4">{item.name}</span>
                      <span className="font-mono font-black text-indigo-600 whitespace-nowrap">{item.qty} {item.unit}</span>
                   </div>
                 )) : (
                   <div className="py-10 text-center text-slate-300 italic text-[10px]">Select orders on the right to build a pick list.</div>
                 )}
              </div>
           </div>
        </div>

        {/* ORDER BUCKETS GRID */}
        <div className="lg:col-span-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingPacking.map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                const isSelected = selectedOrderIds.includes(order.id);
                const orderPackedState = packedItems[order.id] || {};
                const packedCount = order.items.filter(i => orderPackedState[i.skuId]).length;
                const totalCount = order.items.length;
                const progress = (packedCount / totalCount) * 100;

                return (
                  <div key={order.id} className={`bg-white p-8 rounded-[3rem] border transition-all relative overflow-hidden ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-50 shadow-xl' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
                     <button 
                      onClick={() => toggleSelectOrder(order.id)}
                      className={`absolute top-6 right-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-transparent'}`}
                     >
                        ✓
                     </button>

                     <div className="mb-6">
                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{order.invoiceNumber}</div>
                        <h4 className="text-xl font-bold font-serif text-slate-900 truncate pr-8">{customer?.name}</h4>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Delivery: {order.deliveryDate || 'ASAP'}</div>
                     </div>

                     <div className="space-y-3 mb-8">
                        {order.items.map(item => {
                          const sku = skus.find(s => s.id === item.skuId);
                          const isPacked = orderPackedState[item.skuId];
                          return (
                            <button 
                              key={item.skuId}
                              onClick={() => handleTogglePacked(order.id, item.skuId)}
                              className={`w-full flex justify-between items-center p-3 rounded-xl transition-all ${isPacked ? 'bg-emerald-50 text-emerald-800 opacity-60' : 'bg-gray-50 text-slate-600 hover:bg-indigo-50'}`}
                            >
                               <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-md border-2 ${isPacked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}></div>
                                  <span className={`text-[11px] font-black uppercase ${isPacked ? 'line-through' : ''}`}>{sku?.name}</span>
                               </div>
                               <span className="font-mono font-black text-xs">{item.quantity}</span>
                            </button>
                          );
                        })}
                     </div>

                     <div className="space-y-4">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                           <div className="text-[8px] font-black text-slate-300 uppercase">{packedCount} of {totalCount} Packed</div>
                           <div className="flex gap-2">
                              <button onClick={() => customer && generatePackingSlipPDF(order, customer, skus)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors" title="Print Slip">📄</button>
                              <button 
                                onClick={() => handleMarkAsPacked(order.id)}
                                disabled={packedCount < totalCount}
                                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${packedCount === totalCount ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                              >
                                Ready
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
                );
              })}
              {pendingPacking.length === 0 && (
                <div className="col-span-2 py-32 text-center border-2 border-dashed border-slate-100 rounded-[4rem]">
                   <div className="text-6xl mb-4 opacity-10">📦</div>
                   <h4 className="text-slate-300 font-bold uppercase tracking-widest">No active orders for packing</h4>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PackingStation;
