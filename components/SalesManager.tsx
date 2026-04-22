
import React, { useState, useMemo } from 'react';
import { SKU, Sale, FinishedGood, Outlet, OutletStock, AccountType, Transaction, Customer, InventoryLoss, Ingredient, Activity, Overhead, Employee, ReturnLog, SalesAgent, PaymentMethod } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import SalesStrategyAudit from './SalesStrategyAudit';

interface SalesManagerProps {
  skus: SKU[];
  sales: Sale[];
  setSales: (sales: Sale[]) => void;
  finishedGoods: FinishedGood[];
  setFinishedGoods: (fg: FinishedGood[]) => void;
  outlets: Outlet[];
  outletStocks: OutletStock[];
  setOutletStocks: (os: OutletStock[]) => void;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  customers: Customer[];
  inventoryLosses: InventoryLoss[];
  setInventoryLosses: (losses: InventoryLoss[]) => void;
  ingredients: Ingredient[];
  activities: Activity[];
  overheads: Overhead[];
  employees: Employee[];
  agents: SalesAgent[];
  currency: { active: any, format: (v: number) => string };
  onManualCorrection?: (category: 'sales' | 'transactions', id: string, updates: Record<string, any>, reason: string) => void;
}

interface CartItem {
  skuId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

type SalesSubTab = 'POS' | 'Revenue_Audit' | 'Log' | 'Manual_Journal' | 'Velocity' | 'Stales' | 'Customer_History' | 'Strategy';

const MERCHANT_FEE_RATE = 0.025;

const SalesManager: React.FC<SalesManagerProps> = ({ 
  skus, sales, setSales, finishedGoods, setFinishedGoods, outlets, outletStocks, setOutletStocks, transactions, setTransactions, customers, inventoryLosses, setInventoryLosses,
  currency, agents, ingredients, activities, overheads, employees
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SalesSubTab>('POS');
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

  const addToCart = (sku: SKU) => {
    if (!selectedOutletId) {
      alert("Please select an Outlet first.");
      return;
    }
    const stock = outletStocks.find(os => os.outletId === selectedOutletId && os.skuId === sku.id)?.stockLevel || 0;
    const existing = cart.find(i => i.skuId === sku.id);
    const inCart = existing ? existing.quantity : 0;
    if (stock <= inCart) {
      alert("Insufficient branch stock.");
      return;
    }
    if (existing) setCart(cart.map(i => i.skuId === sku.id ? { ...i, quantity: i.quantity + 1 } : i));
    else setCart([...cart, { skuId: sku.id, quantity: 1, unitPrice: sku.retailPrice, discount: 0 }]);
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0), [cart]);

  return (
    <div className="space-y-8 animate-softFade pb-20">
      {/* THEMED RETAIL HEADER */}
      <section className="relative h-64 rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white group">
        <img 
          src="https://images.unsplash.com/photo-1544681280-d25a782adc9b?auto=format&fit=crop&q=80&w=1600" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
          alt="Fresh Bakery Counter"
        />
        <div className="absolute inset-0 bg-bakery-950/60 backdrop-blur-[1px]"></div>
        <div className="relative h-full flex flex-col justify-center px-12">
          <div className="flex items-center gap-3 mb-2">
             <span className="px-3 py-1 bg-amber-400 text-bakery-950 rounded-full text-[8px] font-black uppercase tracking-widest">Freshness Guaranteed</span>
          </div>
          <h2 className="text-4xl font-bold font-serif text-white uppercase tracking-tighter">Retail Terminal</h2>
          <p className="text-bakery-100 text-sm italic max-w-lg mt-2">Recording realized wealth and customer value exchange in real-time.</p>
        </div>
      </section>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex bg-white p-1.5 rounded-[2rem] border border-bakery-100 shadow-sm overflow-x-auto scrollbar-hide max-w-full">
          {[
            { id: 'POS', label: 'Terminal', icon: '🛒' },
            { id: 'Strategy', label: 'Strategy', icon: '🧠' },
            { id: 'Customer_History', label: 'History', icon: '📜' },
            { id: 'Log', label: 'Journal', icon: '🧾' },
            { id: 'Stales', label: 'Returns', icon: '♻️' },
            { id: 'Revenue_Audit', label: 'Audit', icon: '⚖️' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${activeSubTab === tab.id ? 'bg-bakery-950 text-white shadow-xl' : 'text-bakery-400 hover:text-bakery-600'}`}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeSubTab === 'POS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[70vh]">
          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
            <div className="bg-white p-6 rounded-[2.5rem] border border-bakery-100 shadow-sm flex flex-col md:flex-row gap-4 shrink-0">
               <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-bakery-400">🔍</span>
                  <input className="w-full pl-10 pr-4 py-3 bg-bakery-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-bakery-400" placeholder="Search catalog..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <select className="bg-bakery-950 text-white border-none rounded-xl px-6 py-2 font-black text-[9px] uppercase outline-none" value={selectedOutletId} onChange={e => setSelectedOutletId(e.target.value)}>
                  <option value="">Select Station...</option>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
               </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 scrollbar-hide flex-1">
              {skus.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(sku => {
                const stock = outletStocks.find(os => os.outletId === selectedOutletId && os.skuId === sku.id)?.stockLevel || 0;
                const inCart = cart.find(i => i.skuId === sku.id)?.quantity || 0;
                const available = stock - inCart;
                return (
                  <button key={sku.id} onClick={() => addToCart(sku)} disabled={available <= 0 || !selectedOutletId} className={`p-6 rounded-[2.5rem] border text-left transition-all relative group flex flex-col justify-between ${available <= 0 || !selectedOutletId ? 'bg-bakery-50 border-bakery-100 opacity-60' : 'bg-white border-bakery-100 shadow-sm hover:shadow-xl active:scale-95'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-bakery-50 text-bakery-600 flex items-center justify-center text-xl shadow-inner">{sku.isCake ? '🎂' : '🥖'}</div>
                        {inCart > 0 && <span className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black animate-softFade">{inCart}</span>}
                      </div>
                      <h4 className="font-black text-bakery-950 text-[11px] uppercase mb-1 leading-tight">{sku.name}</h4>
                    </div>
                    <div className="mt-6 pt-4 border-t border-bakery-50 flex justify-between items-end">
                       <div><div className="text-[8px] font-black text-bakery-300 uppercase">Rate</div><div className="text-xs font-mono font-black text-bakery-900">{currency.format(sku.retailPrice)}</div></div>
                       <div className="text-right"><div className="text-[8px] font-black text-bakery-300 uppercase">Avail</div><div className={`text-[10px] font-mono font-black ${available < 10 ? 'text-rose-600' : 'text-emerald-600'}`}>{available}</div></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 bg-bakery-950 rounded-[3.5rem] p-8 text-white flex flex-col shadow-2xl relative overflow-hidden h-full border-4 border-white">
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-xl font-bold font-serif text-amber-400 mb-8 shrink-0 uppercase tracking-widest">Checkout Registry</h3>
                <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pr-2">
                   {cart.map(item => {
                     const sku = skus.find(s => s.id === item.skuId)!;
                     return (
                       <div key={item.skuId} className="bg-white/5 p-4 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                          <div className="flex justify-between font-bold text-xs uppercase"><span>{sku.name}</span><span>x{item.quantity}</span></div>
                          <div className="text-right text-[10px] font-mono text-amber-400 mt-1">{currency.format(item.quantity * item.unitPrice)}</div>
                       </div>
                     );
                   })}
                   {cart.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-20"><span className="text-6xl mb-4">🛒</span><p className="text-[9px] font-black uppercase">Terminal Empty</p></div>}
                </div>

                <div className="pt-8 mt-6 border-t border-white/10 space-y-6 shrink-0">
                   <div className="flex justify-between items-center"><span className="text-[10px] font-black text-bakery-400 uppercase tracking-widest">Total Realizable</span><div className="text-4xl font-mono font-black text-white">{currency.format(cartTotal)}</div></div>
                   <button disabled={cart.length === 0 || !selectedOutletId} className="w-full py-5 bg-amber-500 text-bakery-950 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-white transition-all active:scale-95 disabled:opacity-30">
                      Print Voucher & Close
                   </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {activeSubTab === 'Strategy' && <SalesStrategyAudit sales={sales} skus={skus} agents={agents} outlets={outlets} returnLogs={[]} currency={currency} />}
    </div>
  );
};

export default SalesManager;
