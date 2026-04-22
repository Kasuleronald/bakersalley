
import React, { useState, useMemo } from 'react';
import { SKU, Outlet, Sale, ProductionLog, InventoryLoss, Transaction, EnergyCategory } from '../types';

interface RetailReconcilerProps {
  skus: SKU[];
  outlets: Outlet[];
  sales: Sale[];
  productionLogs: ProductionLog[];
  inventoryLosses: InventoryLoss[];
  currency: { format: (v: number) => string };
}

const RetailReconciler: React.FC<RetailReconcilerProps> = ({ skus, outlets, sales, productionLogs, inventoryLosses, currency }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const reconAudit = useMemo(() => {
    return skus.map(sku => {
      // 1. What the Factory produced
      const factoryOutput = productionLogs
        .filter(l => l.skuId === sku.id && l.date === selectedDate)
        .reduce((sum, l) => sum + (l.actualYield || l.totalUnitsProduced), 0);

      // 2. What the Retail Channels (EzeeYPOS Style) reported as sold
      const reportedSales = sales
        .filter(s => s.skuId === sku.id && s.date.startsWith(selectedDate))
        .reduce((sum, s) => sum + s.quantity, 0);

      // 3. Known Stales/Damages
      const knownLoss = inventoryLosses
        .filter(l => l.skuId === sku.id && l.date === selectedDate)
        .reduce((sum, l) => sum + l.quantity, 0);

      const variance = factoryOutput - (reportedSales + knownLoss);
      const leakageValue = variance * sku.retailPrice;

      return {
        sku,
        factoryOutput,
        reportedSales,
        knownLoss,
        variance,
        leakageValue
      };
    });
  }, [skus, sales, productionLogs, inventoryLosses, selectedDate]);

  const totalLeakage = reconAudit.reduce((s, x) => s + (x.leakageValue > 0 ? x.leakageValue : 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Retail Revenue Auditor</h3>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Bridging Factory Output to POS Realization</p>
        </div>
        <div className="relative z-10">
          <input 
            type="date" 
            className="bg-white/10 text-white p-4 rounded-2xl font-bold border border-white/20 outline-none" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
            <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Unaccounted Revenue</div>
            <div className={`text-4xl font-mono font-black ${totalLeakage > 50000 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
               {currency.format(totalLeakage)}
            </div>
            <p className="text-[8px] text-slate-300 font-black uppercase mt-2">Potential Channel Theft</p>
         </div>
         <div className="md:col-span-2 bg-indigo-900 p-8 rounded-[3rem] text-white flex items-center gap-8 shadow-xl">
            <div className="text-5xl">⚖️</div>
            <div>
               <h4 className="text-xl font-bold font-serif text-amber-400">Why this matters more than EzeeYPOS</h4>
               <p className="text-sm text-indigo-100 italic leading-relaxed">
                  "Standard POS systems only track what the cashier enters. If your factory produces 1,000 loaves but the shop only reports 800 sold and 50 stales, EzeeYPOS says you're perfect. **BakersAlley** flags the missing 150 loaves immediately."
               </p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <th className="px-10 py-6">Product Item</th>
                  <th className="px-6 py-6 text-center">Factory Output</th>
                  <th className="px-6 py-6 text-center">POS Sales (Net)</th>
                  <th className="px-6 py-6 text-center">Logged Stales</th>
                  <th className="px-10 py-6 text-right">Leakage / Surplus</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {reconAudit.map(item => (
                  <tr key={item.sku.id} className="hover:bg-slate-50 transition-all">
                     <td className="px-10 py-5">
                        <div className="font-bold text-slate-900 text-sm uppercase">{item.sku.name}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{item.sku.category}</div>
                     </td>
                     <td className="px-6 py-5 text-center font-mono font-bold text-indigo-600">{item.factoryOutput}</td>
                     <td className="px-6 py-5 text-center font-mono font-bold text-emerald-600">{item.reportedSales}</td>
                     <td className="px-6 py-5 text-center font-mono font-bold text-amber-600">{item.knownLoss}</td>
                     <td className="px-10 py-5 text-right">
                        <div className={`text-lg font-mono font-black ${item.variance > 0 ? 'text-rose-600' : 'text-slate-100'}`}>
                           {item.variance > 0 ? `-${item.variance}` : '--'}
                        </div>
                        {item.variance > 0 && <div className="text-[8px] text-rose-400 font-black uppercase">Loss: {currency.format(item.leakageValue)}</div>}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default RetailReconciler;
