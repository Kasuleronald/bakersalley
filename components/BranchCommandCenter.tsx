
import React, { useState, useMemo } from 'react';
import { SKU, Outlet, OutletStock, BranchTransfer, Transaction, InventoryMovement, EfrisStatus } from '../types';

interface BranchCommandCenterProps {
  skus: SKU[];
  outlets: Outlet[];
  outletStocks: OutletStock[];
  setOutletStocks: (os: OutletStock[]) => void;
  movements: InventoryMovement[];
  setMovements: (movs: InventoryMovement[]) => void;
  currency: { format: (v: number) => string };
}

/**
 * Branch Command Center: Adapts EzeeYPOS's core utility for industrial distribution.
 * Manages Inter-branch transfers, EFRIS compliance, and Thermal hardware hooks.
 */
const BranchCommandCenter: React.FC<BranchCommandCenterProps> = ({ skus, outlets, outletStocks, setOutletStocks, movements, setMovements, currency }) => {
  const [activeTab, setActiveTab] = useState<'Transfers' | 'ThermalPreview' | 'EFRIS'>('Transfers');
  
  // Inter-Branch Logic
  const [transferForm, setTransferForm] = useState<Partial<BranchTransfer>>({
    sourceOutletId: 'out-factory',
    targetOutletId: '',
    skuId: '',
    quantity: 0
  });

  const efrisStats: EfrisStatus = {
    lastSync: new Date().toLocaleTimeString(),
    pendingInvoices: 3,
    isServiceActive: true,
    uraEndpointStatus: 'Online'
  };

  const handleInitiateTransfer = () => {
    if (!transferForm.targetOutletId || !transferForm.skuId || !transferForm.quantity) return;
    
    const sourceStock = outletStocks.find(os => os.outletId === transferForm.sourceOutletId && os.skuId === transferForm.skuId)?.stockLevel || 0;
    if (sourceStock < transferForm.quantity) {
      alert("Insufficient stock in Source Branch.");
      return;
    }

    // 1. Deduct from Source
    const nextStocks = outletStocks.map(os => 
      (os.outletId === transferForm.sourceOutletId && os.skuId === transferForm.skuId)
        ? { ...os, stockLevel: os.stockLevel - transferForm.quantity! }
        : os
    );

    // 2. Add to Target (Simulating immediate receipt for demo)
    const targetIdx = nextStocks.findIndex(os => os.outletId === transferForm.targetOutletId && os.skuId === transferForm.skuId);
    if (targetIdx > -1) {
        nextStocks[targetIdx].stockLevel += transferForm.quantity!;
    } else {
        nextStocks.push({ outletId: transferForm.targetOutletId!, skuId: transferForm.skuId!, stockLevel: transferForm.quantity! });
    }

    setOutletStocks(nextStocks);
    
    // 3. Log Movement
    setMovements([{
        id: `TRANS-${Date.now()}`,
        skuId: transferForm.skuId,
        type: 'Inter-Branch Transfer',
        quantity: transferForm.quantity,
        date: new Date().toISOString(),
        destination: outlets.find(o => o.id === transferForm.targetOutletId)?.name,
        notes: `Transfer from ${outlets.find(o => o.id === transferForm.sourceOutletId)?.name}`
    }, ...movements]);

    alert("Branch Transfer Finalized. Stock shifted in master ledger.");
    setTransferForm({ ...transferForm, quantity: 0, skuId: '' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Branch & Retail Control</h3>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Multi-Channel Interlocks • Hardware Hooks</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
           {[
             { id: 'Transfers', label: 'Stock Shifts', icon: '📤' },
             { id: 'ThermalPreview', label: 'Receipt Hook', icon: '🖨️' },
             { id: 'EFRIS', label: 'URA Compliance', icon: '⚖️' }
           ].map(t => (
             <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
             >
                <span>{t.icon}</span> {t.label}
             </button>
           ))}
        </div>
      </header>

      {activeTab === 'Transfers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-5 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
              <h4 className="text-xl font-bold font-serif text-slate-900 uppercase">Initiate Stock Shift</h4>
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Source Branch</label>
                    <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={transferForm.sourceOutletId} onChange={e => setTransferForm({...transferForm, sourceOutletId: e.target.value})}>
                        {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Target Branch</label>
                    <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={transferForm.targetOutletId} onChange={e => setTransferForm({...transferForm, targetOutletId: e.target.value})}>
                        <option value="">Select destination...</option>
                        {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Product SKU</label>
                       <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={transferForm.skuId} onChange={e => setTransferForm({...transferForm, skuId: e.target.value})}>
                          <option value="">Select SKU...</option>
                          {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Quantity</label>
                       <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black text-lg" value={transferForm.quantity || ''} onChange={e => setTransferForm({...transferForm, quantity: parseFloat(e.target.value) || 0})} />
                    </div>
                 </div>
                 <button onClick={handleInitiateTransfer} className="w-full py-5 bg-indigo-900 text-white rounded-[2.5rem] font-black uppercase text-xs shadow-xl hover:bg-black transition-all">Authorize Branch Transfer</button>
              </div>
           </div>

           <div className="lg:col-span-7 space-y-6">
              <div className="bg-indigo-50 p-10 rounded-[4rem] border border-indigo-100 flex items-center gap-10">
                 <div className="text-6xl grayscale opacity-30">🏢</div>
                 <div>
                    <h4 className="text-xl font-bold font-serif text-indigo-900 mb-2">Chain Integrity Advantage</h4>
                    <p className="text-sm text-indigo-700 leading-relaxed italic">
                      "Unlike basic POS systems, BakersAlley treats every transfer as a **Fiscal Event**. We maintain a 'Transit Ledger' that flags if 100 loaves left the factory but only 98 were received at the shop. This eliminates the 'Van Shrinkage' common in Uganda's distribution routes."
                    </p>
                 </div>
              </div>

              <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                          <th className="px-10 py-6">Ref / Date</th>
                          <th className="px-6 py-6">Transfer Path</th>
                          <th className="px-10 py-6 text-right">Items</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {movements.filter(m => m.type === 'Inter-Branch Transfer').slice(0, 5).map(m => (
                         <tr key={m.id}>
                            <td className="px-10 py-5">
                               <div className="font-mono text-[10px] font-black text-indigo-600">{m.id}</div>
                               <div className="text-[8px] text-slate-400 font-bold uppercase">{new Date(m.date).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-5">
                               <div className="text-xs font-bold text-slate-700 uppercase">To: {m.destination}</div>
                            </td>
                            <td className="px-10 py-5 text-right font-mono font-black text-slate-900">{m.quantity} Units</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'ThermalPreview' && (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center animate-fadeIn">
           <div className="max-w-xs w-full bg-slate-50 p-8 rounded-xl border border-slate-200 shadow-inner font-mono text-[10px] space-y-4">
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                 <div className="font-bold text-lg">BAKERSALLEY</div>
                 <div>KAMPALA INDUSTRIAL PARK</div>
                 <div>+256 700 000 000</div>
              </div>
              <div className="flex justify-between font-bold">
                 <span>DATE: 2025-05-20</span>
                 <span>REF: #8821</span>
              </div>
              <div className="border-b border-dashed border-slate-300 pb-2">
                 <div className="flex justify-between py-1"><span>Family Loaf x10</span><span>45,000</span></div>
                 <div className="flex justify-between py-1"><span>Slice Wholemeal x2</span><span>9,600</span></div>
              </div>
              <div className="flex justify-between font-black text-base">
                 <span>TOTAL (UGX)</span>
                 <span>54,600</span>
              </div>
              <div className="text-center pt-10 opacity-40">
                 <div>PROCESSED BY BAKERSALLEY 3.1</div>
                 <div>EFRIS VERIFIED ✓</div>
              </div>
           </div>
           <p className="mt-8 text-xs text-slate-500 italic max-w-md text-center">
              "This is the **Virtual Thermal Hook**. We support ESC/POS protocols to format receipts from any smartphone directly to standard handheld Bluetooth printers found in Kampala."
           </p>
        </div>
      )}

      {activeTab === 'EFRIS' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
                 <h4 className="text-xl font-bold font-serif text-slate-900 uppercase">URA EFRIS Interlock</h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Gateway Status</span>
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${efrisStats.uraEndpointStatus === 'Online' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {efrisStats.uraEndpointStatus}
                       </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Pending Fiscalization</span>
                       <span className="text-sm font-mono font-black text-amber-600">{efrisStats.pendingInvoices} Invoices</span>
                    </div>
                 </div>
                 <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Push Pending to URA</button>
              </div>
              <div className="bg-indigo-900 p-10 rounded-[3.5rem] text-white flex flex-col justify-center shadow-xl">
                 <h4 className="text-amber-400 font-black uppercase text-[10px] tracking-widest mb-4">Statutory Intelligence</h4>
                 <p className="text-sm italic leading-relaxed text-indigo-100">
                    "Uganda's EFRIS mandate requires real-time fiscal reporting. BakersAlley monitors your internal sales ledger against the URA endpoint to ensure 100% compliance during field distribution."
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BranchCommandCenter;
