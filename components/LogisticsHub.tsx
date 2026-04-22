import React, { useState, useMemo } from 'react';
// Fixed: Removed non-existent and unused import 'DeliveryRoute'
import { Outlet, Order, SKU, Customer, Transaction, Asset } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

interface LogisticsHubProps {
  outlets: Outlet[];
  orders: Order[];
  skus: SKU[];
  customers: Customer[];
  assets: Asset[];
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

type LogisticsTab = 'Control' | 'Routes' | 'Fuel' | 'Drivers';

const LogisticsHub: React.FC<LogisticsHubProps> = ({ outlets, orders, skus, customers, assets, transactions, setTransactions, currency }) => {
  const [activeTab, setActiveTab] = useState<LogisticsTab>('Control');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Filter Assets for Vehicles
  const fleet = useMemo(() => assets.filter(a => a.category === 'Vehicle'), [assets]);

  // Derive Logistics Stats
  const metrics = useMemo(() => {
    const fuelSpend = transactions
      .filter(t => t.category === 'Expense' && (t.subCategory?.includes('Fuel') || t.description.toLowerCase().includes('petrol') || t.description.toLowerCase().includes('diesel')))
      .reduce((s, x) => s + x.amount, 0);

    const totalRevenue = orders.filter(o => o.status === 'Completed' || o.status === 'Packed').reduce((s, x) => s + x.totalPrice, 0);
    const lcr = totalRevenue > 0 ? (fuelSpend / totalRevenue) * 100 : 0;
    
    // Efficiency: Revenue per KM (Assuming 500km aggregate for the period)
    const revPerKm = totalRevenue / 500; 

    return { fuelSpend, lcr, revPerKm, totalRevenue };
  }, [transactions, orders]);

  const handleFuelLog = (vanName: string) => {
    const amount = prompt(`Enter Fuel Purchase amount for ${vanName}:`);
    if (!amount || isNaN(Number(amount))) return;

    const newTx: Transaction = {
      id: `fuel-${Date.now()}`,
      date: new Date().toISOString(),
      account: 'Cash',
      type: 'Debit',
      amount: Number(amount),
      description: `Fuel Purchase: ${vanName}`,
      category: 'Expense',
      subCategory: 'Energy/Fuel'
    };

    setTransactions([newTx, ...transactions]);
    alert("Fuel purchase journalized and linked to fleet ledger.");
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Fleet & Dispatch Control</h3>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time Density Logic • Fuel-per-Loaf Audit</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
           {[
             { id: 'Control', label: 'Monitor', icon: '📡' },
             { id: 'Routes', label: 'Route Map', icon: '🗺️' },
             { id: 'Fuel', label: 'Fuel Ledger', icon: '⛽' },
             { id: 'Drivers', label: 'Pilots', icon: '👨‍✈️' }
           ].map(t => (
             <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as LogisticsTab)} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
             >
                <span>{t.icon}</span> {t.label}
             </button>
           ))}
        </div>
      </header>

      {activeTab === 'Control' && (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fuel Burn Ratio (LCR)</div>
                 <div className={`text-4xl font-mono font-black ${metrics.lcr > 15 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {metrics.lcr.toFixed(1)}%
                 </div>
                 <p className="text-[8px] text-slate-300 font-bold uppercase italic">Industrial Limit: 12%</p>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue per KM</div>
                 <div className={`text-4xl font-mono font-black text-indigo-900`}>
                    {currency.formatCompact(metrics.revPerKm)}
                 </div>
                 <p className="text-[8px] text-slate-300 font-bold uppercase italic">Logistics Intensity Score</p>
              </div>
              <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl md:col-span-2 flex items-center justify-between relative overflow-hidden">
                 <div className="absolute right-0 bottom-0 text-8xl opacity-10 translate-x-10 translate-y-10 font-black">KM</div>
                 <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Fleet Uptime</h4>
                    <div className="text-4xl font-mono font-black">{Math.round((fleet.filter(v => v.status === 'Active').length / (fleet.length || 1)) * 100)}%</div>
                    <p className="text-[8px] text-indigo-300 font-bold uppercase mt-2">Active Vehicles: {fleet.filter(v => v.status === 'Active').length} of {fleet.length}</p>
                 </div>
                 <button onClick={() => setIsOptimizing(!isOptimizing)} className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-amber-400 transition-all">
                    {isOptimizing ? 'Audit Active...' : 'Run Density Audit'}
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
                 <h3 className="text-xl font-bold font-serif text-slate-900 mb-10 uppercase tracking-tighter">Active Route Velocity</h3>
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={outlets.slice(0, 8)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#cbd5e1' }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                          <Bar name="Route Demand" dataKey="id" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40}>
                             {outlets.map((_, index) => <Cell key={index} fill={index % 2 === 0 ? '#1e1b4b' : '#fbbf24'} />)}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              <div className="lg:col-span-4 bg-slate-50 p-8 rounded-[3.5rem] border border-slate-100 space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-4">Real-time Manifests</h4>
                 <div className="space-y-3">
                    {outlets.slice(0, 5).map(o => (
                       <div key={o.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-indigo-300 transition-all">
                          <div className="overflow-hidden">
                             <div className="text-xs font-bold uppercase truncate text-slate-800">{o.name}</div>
                             <div className="text-[8px] font-black text-slate-400 uppercase">{o.location}</div>
                          </div>
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase">Cleared</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
           <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">Topology Explorer</h4>
                 <div className="space-y-4">
                    {fleet.map(van => (
                      <button 
                        key={van.id} 
                        onClick={() => setSelectedRouteId(van.id)}
                        className={`w-full text-left p-6 rounded-[2rem] border transition-all flex flex-col gap-4 ${selectedRouteId === van.id ? 'bg-indigo-900 border-indigo-900 text-white shadow-xl' : 'bg-slate-50 border-transparent hover:bg-white hover:border-indigo-100'}`}
                      >
                         <div className="flex justify-between items-start">
                            <span className="text-2xl">{van.status === 'Active' ? '🚛' : '🛠️'}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${selectedRouteId === van.id ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-700'}`}>{van.status}</span>
                         </div>
                         <div>
                            <div className="font-black text-sm uppercase">{van.name}</div>
                            <div className={`text-[8px] font-bold uppercase ${selectedRouteId === van.id ? 'text-indigo-300' : 'text-slate-400'}`}>Capacity: {van.capacityPerShift} Units</div>
                         </div>
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden min-h-[500px] flex flex-col">
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              {selectedRouteId ? (
                <div className="relative z-10 flex-1 flex flex-col">
                   <div className="flex justify-between items-center mb-10">
                      <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Route Visualizer: {fleet.find(v => v.id === selectedRouteId)?.name}</h3>
                      <button className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-xl text-[9px] font-black uppercase border border-indigo-100 shadow-sm hover:bg-indigo-900 hover:text-white transition-all">Optimize Sequence</button>
                   </div>
                   
                   <div className="flex-1 flex items-center justify-center relative py-20">
                      <div className="absolute inset-x-20 top-1/2 h-px bg-slate-100 border-t-2 border-dashed border-slate-200"></div>
                      <div className="flex justify-between w-full px-20 relative z-20">
                         {/* Visual Stop representation */}
                         {['Factory', 'Entebbe Hub', 'Shoprite', 'Fuel Station', 'Bakery Store'].map((stop, i) => (
                           <div key={i} className="flex flex-col items-center gap-4 group">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition-all group-hover:scale-125 ${i === 0 ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-100 text-slate-400'}`}>
                                 {i === 0 ? '🏢' : i === 3 ? '⛽' : '📍'}
                              </div>
                              <div className="text-center">
                                 <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{stop}</div>
                                 <div className="text-[8px] text-slate-400 font-bold uppercase">{i === 0 ? 'Start' : `${i * 12} KM`}</div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 mt-10">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-inner">🧩</div>
                      <div className="flex-1">
                         <h5 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Neural Stop Grouping</h5>
                         <p className="text-xs text-slate-500 italic">"Grouping 3 deliveries within 2km of Entebbe Road adds 1.4% to the net manufacturing profit per loaf."</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 grayscale space-y-6">
                   <div className="text-8xl">🚛</div>
                   <h4 className="text-xl font-bold font-serif uppercase tracking-widest text-slate-400">Select a Van to Audit Route Map</h4>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'Fuel' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
                 <h4 className="text-xl font-bold font-serif text-slate-900 uppercase">Fleet Fuel Expenditure</h4>
                 <div className="space-y-3">
                    {fleet.map(van => (
                       <div key={van.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:border-amber-200 transition-all">
                          <div>
                             <div className="font-black text-slate-800 text-sm uppercase">{van.name}</div>
                             <div className="text-[9px] text-slate-400 font-bold uppercase">Balance Allocation: {currency.format(van.capacityPerShift * 100)}</div>
                          </div>
                          <button 
                            onClick={() => handleFuelLog(van.name)}
                            className="bg-white border border-slate-200 text-slate-400 px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
                          >
                             Log Receipt
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
                 <h4 className="text-amber-400 font-black uppercase text-[10px] tracking-widest mb-6">Efficiency Alert Hub</h4>
                 <div className="space-y-6 relative z-10">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-rose-300 uppercase">Van #001: High Consumption</span>
                          <span className="text-[10px] font-mono font-black text-rose-500">+18% Drift</span>
                       </div>
                       <p className="text-[10px] text-indigo-100/50 italic leading-relaxed">Fuel burn exceeds payload volume. Mechanical audit or driver training required.</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-emerald-300 uppercase">Route Density Optimized</span>
                          <span className="text-[10px] font-mono font-black text-emerald-500">Savings: {currency.format(45000)}</span>
                       </div>
                       <p className="text-[10px] text-indigo-100/50 italic leading-relaxed">Entebbe consolidation achieved maximum efficiency today.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
           {[
             { name: 'Samuel Kato', trips: 142, rating: 4.8, reliability: 98, status: 'On Route' },
             { name: 'Joseph Mukasa', trips: 89, rating: 4.2, reliability: 85, status: 'Idle' },
             { name: 'Ibrahim Ssali', trips: 210, rating: 4.9, reliability: 99, status: 'On Route' }
           ].map((driver, i) => (
             <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden flex flex-col">
                <div className={`absolute top-0 left-0 w-full h-1.5 ${driver.status === 'On Route' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner">{driver.name.charAt(0)}</div>
                   <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${driver.status === 'On Route' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{driver.status}</span>
                </div>
                <h4 className="text-xl font-bold font-serif text-slate-900 uppercase truncate mb-1">{driver.name}</h4>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Industrial Pilot</div>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                   <div>
                      <div className="text-[8px] font-black text-slate-300 uppercase">Reliability</div>
                      <div className={`text-lg font-mono font-black ${driver.reliability > 95 ? 'text-emerald-600' : 'text-amber-600'}`}>{driver.reliability}%</div>
                   </div>
                   <div className="text-right">
                      <div className="text-[8px] font-black text-slate-300 uppercase">Cumulative Trips</div>
                      <div className="text-lg font-mono font-black text-slate-900">{driver.trips}</div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className={`text-xs ${j < Math.floor(driver.rating) ? 'text-amber-400' : 'text-slate-100'}`}>★</span>
                      ))}
                   </div>
                   <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase shadow-md">Inspect Log</button>
                </div>
             </div>
           ))}
        </div>
      )}

      <div className="p-12 bg-amber-900 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-7xl opacity-30 grayscale shrink-0">🚛</div>
         <div className="space-y-4 relative z-10">
            <h4 className="text-3xl font-bold font-serif text-amber-300 uppercase tracking-tighter">Strategic Fleet Optimization</h4>
            <p className="text-base text-amber-100/70 leading-relaxed max-w-4xl italic">
              "The most expensive bread is the one stuck in a van. In a high-volume industrial bakery, logistics costs can erode up to 40% of the gross margin if route density isn't audited daily. Use the **Route Map** to consolidate stops and the **Fuel Ledger** to detect mechanical issues or fuel leakage before they impact the monthly P&L."
            </p>
         </div>
      </div>
    </div>
  );
};

export default LogisticsHub;
