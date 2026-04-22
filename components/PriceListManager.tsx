
import React, { useState, useMemo } from 'react';
import { SKU, Customer } from '../types';

interface PriceListManagerProps {
  skus: SKU[];
  setSkus: (skus: SKU[]) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  currency: { format: (v: number) => string };
}

const PriceListManager: React.FC<PriceListManagerProps> = ({ skus, setSkus, customers, setCustomers, currency }) => {
  const [viewMode, setViewMode] = useState<'Base' | 'Contracts'>('Base');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSkus = useMemo(() => {
    return skus.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [skus, searchTerm]);

  const updateBasePrice = (skuId: string, field: 'factoryPrice' | 'wholesalePrice' | 'retailPrice', value: number) => {
    setSkus(skus.map(s => s.id === skuId ? { ...s, [field]: value } : s));
  };

  const updateCustomerPrice = (skuId: string, price: number) => {
    if (!selectedCustomerId) return;
    setCustomers(customers.map(c => {
      if (c.id === selectedCustomerId) {
        const prices = { ...(c.customPrices || {}) };
        if (price <= 0 || isNaN(price)) delete prices[skuId];
        else prices[skuId] = price;
        return { ...c, customPrices: prices };
      }
      return c;
    }));
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button 
          onClick={() => setViewMode('Base')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'Base' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
        >
          Base Price Master
        </button>
        <button 
          onClick={() => setViewMode('Contracts')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'Contracts' ? 'bg-indigo-900 text-white shadow-lg' : 'text-slate-400'}`}
        >
          Customer Contracts
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-10 py-8 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1 w-full max-w-md relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 grayscale opacity-40">🔍</span>
            <input 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 font-bold text-sm"
              placeholder="Filter products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {viewMode === 'Contracts' && (
            <select 
              className="px-6 py-3 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-2xl font-black uppercase text-[10px] outline-none shadow-sm focus:ring-2 focus:ring-indigo-500"
              value={selectedCustomerId || ''}
              onChange={e => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Select Target Customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-gray-50/30">
                <th className="px-10 py-6">Product Formulation</th>
                {viewMode === 'Base' ? (
                  <>
                    <th className="px-6 py-6 text-right">Factory (Cost+)</th>
                    <th className="px-6 py-6 text-right">Wholesale</th>
                    <th className="px-6 py-6 text-right">Retail Master</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-6 text-center">Standard Retail</th>
                    <th className="px-10 py-6 text-right">Contract Price Overwrite</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSkus.map(sku => {
                const customPrice = selectedCustomer?.customPrices?.[sku.id];
                return (
                  <tr key={sku.id} className={`hover:bg-slate-50/80 transition-all ${customPrice ? 'bg-indigo-50/10' : ''}`}>
                    <td className="px-10 py-6">
                      <div className="font-black text-slate-900 text-sm uppercase tracking-tighter">{sku.name}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">{sku.category}</div>
                    </td>
                    
                    {viewMode === 'Base' ? (
                      <>
                        <td className="px-6 py-6 text-right">
                          <input 
                            type="number" 
                            className="w-32 px-4 py-2 bg-white border border-slate-100 rounded-xl font-mono font-bold text-xs text-right focus:ring-1 focus:ring-amber-500"
                            value={sku.factoryPrice}
                            onChange={e => updateBasePrice(sku.id, 'factoryPrice', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-6 text-right">
                          <input 
                            type="number" 
                            className="w-32 px-4 py-2 bg-white border border-slate-100 rounded-xl font-mono font-bold text-xs text-right focus:ring-1 focus:ring-amber-500"
                            value={sku.wholesalePrice}
                            onChange={e => updateBasePrice(sku.id, 'wholesalePrice', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-6 text-right">
                          <input 
                            type="number" 
                            className="w-32 px-4 py-2 bg-white border border-slate-100 rounded-xl font-mono font-black text-sm text-right text-indigo-900 focus:ring-1 focus:ring-amber-500"
                            value={sku.retailPrice}
                            onChange={e => updateBasePrice(sku.id, 'retailPrice', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-6 text-center">
                          <div className="text-xs font-mono font-bold text-slate-400">{currency.format(sku.retailPrice)}</div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {customPrice && (
                              <span className="text-[7px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase animate-pulse">Contract Active</span>
                            )}
                            <input 
                              disabled={!selectedCustomerId}
                              type="number" 
                              className="w-40 px-6 py-3 bg-white border border-indigo-100 rounded-2xl font-mono font-black text-sm text-right text-indigo-600 focus:ring-2 focus:ring-indigo-500 disabled:opacity-30 outline-none"
                              placeholder={sku.retailPrice.toString()}
                              value={customPrice || ''}
                              onChange={e => updateCustomerPrice(sku.id, parseFloat(e.target.value))}
                            />
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-indigo-900 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-6xl opacity-30 grayscale">⚖️</div>
         <div className="relative z-10">
            <h4 className="text-2xl font-bold font-serif text-amber-400 mb-3">Industrial Pricing Strategy</h4>
            <p className="text-sm text-indigo-100/70 leading-relaxed max-w-4xl italic">
              "Centralized price management ensures that your sales team never quotes the wrong rate. By defining contractual overrides, you can reward high-volume partners with specialized pricing that is automatically applied at the point of invoice—protecting your revenue from manual discounting errors."
            </p>
         </div>
      </div>
    </div>
  );
};

export default PriceListManager;
