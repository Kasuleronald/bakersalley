import React, { useState, useMemo } from 'react';
import { Outlet, SKU, OutletStock, Sale, Transaction } from '../types';

interface OutletCommandProps {
  outlet: Outlet;
  skus: SKU[];
  outletStocks: OutletStock[];
  setOutletStocks: (os: OutletStock[]) => void;
  sales: Sale[];
  setSales: (s: Sale[]) => void;
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  currency: { format: (v: number) => string };
}

const OutletCommand: React.FC<OutletCommandProps> = ({ outlet, skus, outletStocks, setOutletStocks, sales, setSales, transactions, setTransactions, currency }) => {
  const [activeTab, setActiveTab] = useState<'Sales' | 'Inventory'>('Sales');

  const myStock = useMemo(() => {
    return skus.map(s => {
      const stock = outletStocks.find(os => os.outletId === outlet.id && os.skuId === s.id)?.stockLevel || 0;
      return { ...s, stock };
    });
  }, [skus, outletStocks, outlet.id]);

  const todayRevenue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales
      .filter(s => s.outletId === outlet.id && s.date.startsWith(today))
      .reduce((sum, s) => sum + s.totalPrice, 0);
  }, [sales, outlet.id]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🏪</div>
             <div>
                <h3 className="text-2xl font-bold font-serif text-amber-400 uppercase tracking-tighter">{outlet.name} Terminal</h3>
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1">Independent Outlet Platform Active</p>
             </div>
          </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="bg-white/10 px-6 py-2 rounded-2xl border border-white/10 text-center">
              <div className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Today's Revenue</div>
              <div className="text-xl font-mono font-black">{currency.format(todayRevenue)}</div>
           </div>
        </div>
      </header>

      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button onClick={() => setActiveTab('Sales')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Sales' ? 'bg-indigo-900 text-white shadow-lg' : 'text-slate-400'}`}>Local POS</button>
        <button onClick={() => setActiveTab('Inventory')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Inventory' ? 'bg-indigo-900 text-white shadow-lg' : 'text-slate-400'}`}>Stock Balance</button>
      </div>

      {activeTab === 'Sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-4">
              {myStock.map(sku => (
                <button 
                  key={sku.id}
                  disabled={sku.stock <= 0}
                  onClick={() => alert(`Redirecting to full POS for ${sku.name}.`)}
                  className={`p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm text-left hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col justify-between ${sku.stock <= 0 ? 'opacity-40 grayscale' : ''}`}
                >
                   <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shadow-inner">🥖</div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${sku.stock < 10 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {sku.stock} In Stock
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-xs uppercase mb-1 leading-tight">{sku.name}</h4>
                   </div>
                   <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-end">
                      <div className="text-sm font-mono font-black text-indigo-900">{currency.format(sku.retailPrice)}</div>
                      <span className="text-[8px] font-black text-slate-300 uppercase">Sell →</span>
                   </div>
                </button>
              ))}
           </div>
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl h-[500px] flex flex-col items-center justify-center text-center">
                 <div className="text-6xl mb-6 opacity-20">🛒</div>
                 <h4 className="text-lg font-bold font-serif text-amber-400 mb-2 uppercase">Ready for Scan</h4>
                 <p className="text-[10px] text-slate-400 uppercase font-black">Independent Checkout Instance</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <th className="px-10 py-5">Product SKU</th>
                    <th className="px-6 py-5 text-center">Branch Status</th>
                    <th className="px-10 py-5 text-right">On-Hand Ledger</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {myStock.map(sku => (
                    <tr key={sku.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-10 py-5 font-bold text-slate-900 uppercase text-xs">{sku.name}</td>
                       <td className="px-6 py-5 text-center">
                          <span className={`bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase`}>Independent</span>
                       </td>
                       <td className="px-10 py-5 text-right font-mono font-black text-indigo-900">{sku.stock} Units</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default OutletCommand;
