
import React, { useState, useMemo } from 'react';
import DigitalSignatory from './DigitalSignatory';
import { SKU, Order, OrderItem, Customer, OrderStatus, AccountType, Payment, Transaction, User, DigitalSignature, ApprovalStatus, BusinessProfile } from '../types';
import { generateInvoicePDF, downloadCSV, exportOrderListCSV, exportSingleOrderCSV } from '../utils/exportUtils';

interface OrderManagerProps {
  skus: SKU[];
  customers: Customer[];
  setCustomers: (c: Customer[]) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  onCommitToProduction: (orderId: string) => void;
  currency: { active: any, format: (v: number) => string };
  currentUser: User;
  businessProfile?: BusinessProfile;
}

const OrderManager: React.FC<OrderManagerProps> = ({ 
  skus, customers, setCustomers, orders, setOrders, payments, setPayments, transactions, setTransactions,
  onCommitToProduction, currency, currentUser, businessProfile
}) => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);

  const handleSignOrder = (orderId: string) => {
    const signature: DigitalSignature = {
      signerId: currentUser.id,
      signerName: currentUser.name,
      signerRole: currentUser.role,
      timestamp: new Date().toISOString(),
      authorityHash: `ORDER-AUTH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };

    setOrders(orders.map(o => o.id === orderId ? { 
      ...o, 
      approvalStatus: 'Authorized', 
      signature 
    } : o));
  };

  const handleCreateOrder = () => {
    if (!selectedCustomerId || cart.length === 0) return;
    const cartTotal = cart.reduce((acc, i) => acc + i.totalPrice, 0);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerId: selectedCustomerId,
      items: [...cart],
      totalPrice: cartTotal,
      totalPaid: 0,
      status: 'Pending',
      approvalStatus: 'Draft',
      date: new Date().toISOString(),
      deliveryDate: deliveryDate || undefined,
      productionLogged: false,
      submittedToAdmin: true
    };

    setOrders([newOrder, ...orders]);
    setShowBuilder(false);
    setCart([]);
    setDeliveryDate('');
  };

  const handleBulkExport = () => {
    exportOrderListCSV(orders, customers);
  };

  const handleSingleOrderExport = (order: Order, type: 'PDF' | 'CSV') => {
    const customer = customers.find(c => c.id === order.customerId);
    if (!customer) return;

    if (type === 'PDF') {
      generateInvoicePDF(order, customer, skus, businessProfile);
    } else {
      exportSingleOrderCSV(order, skus);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-serif">Invoicing & Receivables</h2>
          <p className="text-slate-500 font-medium text-sm">DoA Controlled Revenue Verification.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleBulkExport}
            className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <span>📥</span> Export Ledger (CSV)
          </button>
          <button 
            onClick={() => setShowBuilder(true)} 
            className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all"
          >
            + New Wholesale Invoice
          </button>
        </div>
      </header>

      {showBuilder && (
        <div className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-xl animate-fadeIn space-y-6">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Draft New Order</h3>
              <button onClick={() => setShowBuilder(false)} className="text-slate-300 hover:text-rose-500 font-bold">✕</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Target Partner</label>
                <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                  <option value="">Select Partner...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Requested Delivery Date</label>
                <input 
                  type="date" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                />
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-48 overflow-y-auto scrollbar-hide pr-2">
             {skus.map(s => (
               <button key={s.id} onClick={() => {
                 const existing = cart.find(i => i.skuId === s.id);
                 if(existing) setCart(cart.map(i => i.skuId === s.id ? {...i, quantity: i.quantity+1, totalPrice: (i.quantity+1)*i.unitPrice} : i));
                 else setCart([...cart, {skuId: s.id, quantity: 1, unitPrice: s.retailPrice, totalPrice: s.retailPrice}]);
               }} className="p-4 bg-slate-50 rounded-2xl text-left border border-transparent hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex flex-col justify-between">
                  <div className="font-bold text-[11px] text-slate-800 uppercase truncate mb-1">{s.name}</div>
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] font-black text-slate-400">UGX {s.retailPrice}</span>
                    {cart.find(i => i.skuId === s.id) && <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">{cart.find(i => i.skuId === s.id)?.quantity}</span>}
                  </div>
               </button>
             ))}
           </div>
           <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
             <div className="mr-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Cart Value</span>
                <span className="text-xl font-mono font-black text-indigo-900">{currency.format(cart.reduce((s,x)=>s+x.totalPrice, 0))}</span>
             </div>
             <button onClick={() => setShowBuilder(false)} className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold uppercase text-[10px]">Discard</button>
             <button onClick={handleCreateOrder} disabled={cart.length === 0} className="bg-indigo-900 text-white px-10 py-3 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-black disabled:opacity-30">Prepare Draft Invoice</button>
           </div>
        </div>
      )}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between gap-8 items-center group relative overflow-hidden transition-all hover:border-indigo-100">
             <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center justify-between lg:justify-start gap-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg">📄</div>
                      <div>
                        <h4 className="text-lg font-mono font-black text-slate-900">{order.invoiceNumber}</h4>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(order.date).toLocaleDateString()}</div>
                      </div>
                   </div>
                   <div className="h-10 w-px bg-slate-100 hidden lg:block"></div>
                   <div>
                      <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">Partner Entity</span>
                      <span className="text-sm font-bold text-slate-700 uppercase">{customers.find(c => c.id === order.customerId)?.name || 'N/A'}</span>
                   </div>
                   <div className="h-10 w-px bg-slate-100 hidden lg:block"></div>
                   <div>
                      <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">Invoice Amount</span>
                      <span className="text-sm font-mono font-black text-indigo-600">{currency.format(order.totalPrice)}</span>
                   </div>
                   {order.deliveryDate && (
                     <>
                        <div className="h-10 w-px bg-slate-100 hidden lg:block"></div>
                        <div>
                          <span className="text-[8px] font-black text-amber-600 uppercase block mb-0.5">Delivery Target</span>
                          <span className="text-xs font-bold text-slate-900 uppercase">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                        </div>
                     </>
                   )}
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                   <button 
                    onClick={() => handleSingleOrderExport(order, 'PDF')}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600"
                   >
                     <span>📄</span> PDF Invoice
                   </button>
                   <button 
                    onClick={() => handleSingleOrderExport(order, 'CSV')}
                    className="px-4 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-slate-400 hover:text-slate-600"
                   >
                     <span>📊</span> CSV Data
                   </button>
                </div>
             </div>
             
             <div className="w-full lg:w-[400px]">
                <DigitalSignatory 
                  status={order.approvalStatus as ApprovalStatus} 
                  signature={order.signature} 
                  amount={order.totalPrice} 
                  currentUser={currentUser}
                  onSign={() => handleSignOrder(order.id)}
                  onReject={() => setOrders(orders.map(o => o.id === order.id ? { ...o, approvalStatus: 'Rejected' } : o))}
                  onEscalate={() => alert("Invoice escalated to MD for clearance.")}
                />
             </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
             <div className="text-6xl opacity-10 mb-4">🧾</div>
             <h4 className="text-slate-300 font-bold uppercase tracking-[0.2em]">No invoices on record</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManager;
