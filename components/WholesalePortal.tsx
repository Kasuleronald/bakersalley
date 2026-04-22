
import React, { useState } from 'react';
import { Customer, SKU, Order, OrderItem } from '../types';

interface WholesalePortalProps {
  customers: Customer[];
  skus: SKU[];
  onOrderSubmit: (order: Order) => void;
  currency: { format: (v: number) => string };
}

const WholesalePortal: React.FC<WholesalePortalProps> = ({ customers, skus, onOrderSubmit, currency }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isIndependentView, setIsIndependentView] = useState(false);

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleUpdateCart = (skuId: string, qty: number) => {
    setCart(prev => ({ ...prev, [skuId]: Math.max(0, qty) }));
  };

  const calculateTotal = () => {
    return (Object.entries(cart) as [string, number][]).reduce((sum, [skuId, qty]) => {
      const sku = skus.find(s => s.id === skuId);
      const price = activeCustomer?.customPrices[skuId] || sku?.wholesalePrice || 0;
      return sum + (price * qty);
    }, 0);
  };

  const handleSubmit = () => {
    if (!selectedCustomerId || Object.keys(cart).length === 0) return;

    const items: OrderItem[] = (Object.entries(cart) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([skuId, qty]) => {
        const sku = skus.find(s => s.id === skuId)!;
        const price = activeCustomer?.customPrices[skuId] || sku.wholesalePrice;
        return {
          skuId,
          quantity: qty,
          unitPrice: price,
          totalPrice: price * qty
        };
      });

    const newOrder: Order = {
      id: `w-ord-${Date.now()}`,
      invoiceNumber: `W-REQ-${Math.floor(Math.random() * 9000 + 1000)}`,
      customerId: selectedCustomerId,
      items,
      totalPrice: calculateTotal(),
      totalPaid: 0,
      status: 'Pending',
      approvalStatus: 'Pending',
      date: new Date().toISOString(),
      productionLogged: false,
      submittedToAdmin: true,
      notes: 'Submitted via Wholesale Portal'
    };

    onOrderSubmit(newOrder);
    setCart({});
    alert("Wholesale Request Dispatched to Factory Admin.");
  };

  if (isIndependentView && activeCustomer) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#faf9f6] flex flex-col animate-softFade">
         <header className="bg-indigo-900 p-6 text-white flex justify-between items-center shadow-xl">
            <div className="flex items-center gap-4">
               <div className="text-2xl">📦</div>
               <div>
                  <h1 className="text-xl font-bold font-serif">{activeCustomer.name} Dashboard</h1>
                  <span className="text-[8px] font-black uppercase text-indigo-300">Wholesale Self-Service v1.0</span>
               </div>
            </div>
            <button onClick={() => setIsIndependentView(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-all">Back to Admin Hub</button>
         </header>
         <main className="flex-1 max-w-6xl mx-auto w-full p-8 md:p-12 overflow-y-auto">
            {/* Simple Grid View for Distributor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {skus.map(sku => {
                       const price = activeCustomer.customPrices[sku.id] || sku.wholesalePrice;
                       return (
                         <div key={sku.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                               <div className="font-black text-slate-900 uppercase text-sm">{sku.name}</div>
                               <div className="text-xs font-mono font-black text-indigo-600">{currency.format(price)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                               <button onClick={() => handleUpdateCart(sku.id, (cart[sku.id] || 0) - 1)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-black">-</button>
                               <span className="w-10 text-center font-mono font-black">{cart[sku.id] || 0}</span>
                               <button onClick={() => handleUpdateCart(sku.id, (cart[sku.id] || 0) + 1)} className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-900 flex items-center justify-center font-black">+</button>
                            </div>
                         </div>
                       )
                     })}
                  </div>
               </div>
               <div className="lg:col-span-4">
                  <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl sticky top-0 space-y-8">
                     <h3 className="text-2xl font-bold font-serif text-amber-400">Order Summary</h3>
                     <div className="space-y-4">
                        {(Object.entries(cart) as [string, number][]).filter(([_, q]) => q > 0).map(([id, q]) => {
                          const sku = skus.find(s => s.id === id)!;
                          return <div key={id} className="flex justify-between text-xs"><span>{sku.name} x{q}</span><span>{currency.format((activeCustomer.customPrices[id] || sku.wholesalePrice) * q)}</span></div>
                        })}
                     </div>
                     <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                        <span className="uppercase text-[10px] font-black text-slate-400">Grand Total</span>
                        <span className="text-3xl font-mono font-black">{currency.format(calculateTotal())}</span>
                     </div>
                     <button onClick={handleSubmit} disabled={Object.keys(cart).filter(id => cart[id] > 0).length === 0} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 disabled:opacity-30">Send Order to Factory</button>
                  </div>
               </div>
            </div>
         </main>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-4xl shadow-inner">🤝</div>
            <div>
               <h3 className="text-2xl font-bold font-serif text-amber-400">Wholesale Partner Portal</h3>
               <p className="text-indigo-100 text-sm">Self-service rapid ordering for bulk distributors.</p>
            </div>
         </div>
         <div className="flex gap-4 items-center">
           <select 
            className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm outline-none shadow-lg"
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
           >
              <option value="">Simulate as Partner...</option>
              {customers.filter(c => c.type === 'Wholesale' || c.type === 'Corporate').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
           </select>
           {selectedCustomerId && (
             <button onClick={() => setIsIndependentView(true)} className="px-6 py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase border border-white/20 hover:bg-white/20 transition-all">Go Independent View</button>
           )}
         </div>
      </div>

      {selectedCustomerId && !isIndependentView && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                          <th className="px-10 py-6">Product Item</th>
                          <th className="px-6 py-6 text-right">Standard Rate</th>
                          <th className="px-6 py-6 text-right">Your Contract Price</th>
                          <th className="px-10 py-6 text-center">Order Quantity</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {skus.map(sku => {
                         const contractPrice = activeCustomer?.customPrices[sku.id];
                         return (
                           <tr key={sku.id} className="hover:bg-indigo-50/5 transition-all">
                              <td className="px-10 py-5">
                                 <div className="font-black text-slate-900 text-sm uppercase">{sku.name}</div>
                                 <div className="text-[9px] text-slate-400 font-bold uppercase">{sku.category}</div>
                              </td>
                              <td className="px-6 py-5 text-right font-mono text-xs text-slate-300">
                                 {currency.format(sku.wholesalePrice)}
                              </td>
                              <td className="px-6 py-5 text-right font-mono font-black text-indigo-600">
                                 {currency.format(contractPrice || sku.wholesalePrice)}
                              </td>
                              <td className="px-10 py-5">
                                 <div className="flex justify-center items-center gap-3">
                                    <button onClick={() => handleUpdateCart(sku.id, (cart[sku.id] || 0) - 1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">-</button>
                                    <input 
                                      type="number"
                                      className="w-16 bg-slate-50 border-none text-center font-mono font-black text-sm p-1 rounded-lg"
                                      value={cart[sku.id] || ''}
                                      onChange={e => handleUpdateCart(sku.id, parseInt(e.target.value) || 0)}
                                      placeholder="0"
                                    />
                                    <button onClick={() => handleUpdateCart(sku.id, (cart[sku.id] || 0) + 1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors">+</button>
                                 </div>
                              </td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="lg:col-span-4 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col h-fit sticky top-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 border-b pb-4 text-center">Order Confirmation</h4>
              <div className="space-y-4 flex-1 mb-8">
                 {(Object.entries(cart) as [string, number][]).filter(([_, q]) => q > 0).map(([id, q]) => {
                   const sku = skus.find(s => s.id === id)!;
                   const price = activeCustomer?.customPrices[id] || sku.wholesalePrice;
                   return (
                     <div key={id} className="flex justify-between items-center text-xs">
                        <div className="font-bold text-slate-700 uppercase">{sku.name} <span className="text-[9px] text-slate-400">x{q}</span></div>
                        <div className="font-mono font-black">{currency.format(price * q)}</div>
                     </div>
                   );
                 })}
                 {Object.keys(cart).filter(id => cart[id] > 0).length === 0 && (
                   <p className="text-center text-[10px] text-slate-300 italic py-10">Your selection is empty.</p>
                 )}
              </div>
              <div className="pt-6 border-t border-slate-50 space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Request Value</span>
                    <span className="text-2xl font-mono font-black text-indigo-900">{currency.format(calculateTotal())}</span>
                 </div>
                 <button 
                  onClick={handleSubmit}
                  disabled={Object.keys(cart).filter(id => cart[id] > 0).length === 0}
                  className="w-full py-5 bg-indigo-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-30"
                 >
                    Submit Bulk Order
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WholesalePortal;
