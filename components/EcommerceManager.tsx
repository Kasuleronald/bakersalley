
import React, { useState, useMemo } from 'react';
import { Order, SKU, Customer, DeliveryStatus, User } from '../types';

interface EcommerceManagerProps {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  skus: SKU[];
  customers: Customer[];
  currentUser: User;
  currency: { format: (v: number) => string };
}

const EcommerceManager: React.FC<EcommerceManagerProps> = ({ orders, setOrders, skus, customers, currency }) => {
  const [activeTab, setActiveTab] = useState<'Inbox' | 'Logistics'>('Inbox');
  const [filterPlatform, setFilterPlatform] = useState<string>('All');

  const onlineOrders = useMemo(() => {
    return orders.filter(o => o.isOnlineOrder);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filterPlatform === 'All') return onlineOrders;
    return onlineOrders.filter(o => o.platform === filterPlatform);
  }, [onlineOrders, filterPlatform]);

  const handleUpdateDelivery = (orderId: string, status: DeliveryStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, deliveryStatus: status } : o));
  };

  const platforms = ['All', 'WooCommerce', 'Shopify', 'Direct Web'];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex bg-white p-1.5 rounded-2xl w-fit shadow-sm border border-slate-100">
        <button onClick={() => setActiveTab('Inbox')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Inbox' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}>Order Inbox</button>
        <button onClick={() => setActiveTab('Logistics')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Logistics' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}>Delivery Tracker</button>
      </div>

      {activeTab === 'Inbox' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div>
                 <h3 className="text-xl font-bold font-serif text-slate-900">E-Commerce Sync</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase mt-1">Live feed from external webhooks</p>
              </div>
              <div className="flex gap-2">
                 {platforms.map(p => (
                   <button 
                    key={p} 
                    onClick={() => setFilterPlatform(p)}
                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all border ${filterPlatform === p ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white text-slate-300 border-slate-100 hover:text-slate-600'}`}
                   >
                     {p}
                   </button>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                  <div key={order.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                     <div className="flex justify-between items-start mb-6">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{order.platform}</span>
                        <div className="text-right">
                           <div className="text-[10px] font-mono font-black text-slate-900">{currency.format(order.totalPrice)}</div>
                           <span className="text-[8px] font-bold text-slate-300 uppercase">Pre-Paid via Web</span>
                        </div>
                     </div>
                     
                     <h4 className="text-lg font-bold font-serif text-slate-900 uppercase truncate mb-1">{customer?.name || 'Guest User'}</h4>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mb-6 truncate">📍 {order.deliveryAddress || 'Pickup in Store'}</p>
                     
                     <div className="space-y-2 mb-8">
                        {order.items.map(i => (
                          <div key={i.skuId} className="flex justify-between text-[11px] font-bold text-slate-600 uppercase">
                             <span>{skus.find(s => s.id === i.skuId)?.name}</span>
                             <span>x{i.quantity}</span>
                          </div>
                        ))}
                     </div>

                     <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-300 uppercase">Sync Date</span>
                           <span className="text-[10px] font-mono font-bold text-slate-600">{new Date(order.date).toLocaleTimeString()}</span>
                        </div>
                        <button 
                          onClick={() => handleUpdateDelivery(order.id, 'Awaiting Dispatch')}
                          className="px-6 py-2 bg-indigo-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-black"
                        >
                          Confirm & Queue
                        </button>
                     </div>
                  </div>
                );
              })}
              {filteredOrders.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                   <div className="text-5xl opacity-10 mb-4">🛒</div>
                   <p className="text-sm text-slate-300 font-black uppercase tracking-[0.2em]">Zero web orders detected in current sync</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'Logistics' && (
        <div className="space-y-6">
           <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
              <div className="relative z-10 space-y-4">
                 <h3 className="text-3xl font-bold font-serif text-amber-400">Last-Mile Logistics</h3>
                 <p className="text-indigo-100 text-lg max-w-lg italic">"Connecting the oven gate to the customer's doorstep with digital Proof of Delivery (PoD)."</p>
              </div>
              <div className="relative z-10 grid grid-cols-2 gap-4">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                    <div className="text-[8px] font-black text-indigo-400 uppercase mb-1">In Transit</div>
                    <div className="text-3xl font-mono font-black">{onlineOrders.filter(o => o.deliveryStatus === 'In Transit').length}</div>
                 </div>
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                    <div className="text-[8px] font-black text-indigo-400 uppercase mb-1">Delivered Today</div>
                    <div className="text-3xl font-mono font-black">{onlineOrders.filter(o => o.deliveryStatus === 'Delivered').length}</div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                       <th className="px-10 py-6">Order ID / Destination</th>
                       <th className="px-6 py-6">Assigned Carrier</th>
                       <th className="px-6 py-6 text-center">Audit Status</th>
                       <th className="px-10 py-6 text-right">Operations</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {onlineOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-all">
                         <td className="px-10 py-5">
                            <div className="font-bold text-slate-900 text-sm uppercase">{order.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-400 font-bold truncate max-w-xs">{order.deliveryAddress || 'Pickup'}</div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="text-xs font-bold text-indigo-600 uppercase">{order.deliveryRiderName || 'Unassigned'}</div>
                         </td>
                         <td className="px-6 py-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                              order.deliveryStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                              order.deliveryStatus === 'In Transit' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                              'bg-slate-100 text-slate-400'
                            }`}>
                               {order.deliveryStatus || 'Pending'}
                            </span>
                         </td>
                         <td className="px-10 py-5 text-right">
                            <div className="flex justify-end gap-2">
                               {order.deliveryStatus !== 'In Transit' && order.deliveryStatus !== 'Delivered' && (
                                 <button onClick={() => handleUpdateDelivery(order.id, 'In Transit')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">Dispatch</button>
                               )}
                               {order.deliveryStatus === 'In Transit' && (
                                 <button onClick={() => handleUpdateDelivery(order.id, 'Delivered')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">Mark Delivered</button>
                               )}
                               <button className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-50 transition-all">📍</button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default EcommerceManager;
