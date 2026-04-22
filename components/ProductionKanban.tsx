
import React, { useMemo, useState } from 'react';
import { Order, SKU, OrderStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProductionKanbanProps {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  skus: SKU[];
  currency: { format: (v: number) => string };
}

const STAGES = [
  { id: 'Queue', label: 'Order Queue', icon: '📋', color: 'bg-slate-100', limit: 500 },
  { id: 'Mixing', label: 'Mixing Desk', icon: '🥣', color: 'bg-blue-50', limit: 100 },
  { id: 'Molding', label: 'Molding Table', icon: '👐', color: 'bg-indigo-50', limit: 100 },
  { id: 'Proofing', label: 'Proofer', icon: '🌬️', color: 'bg-amber-50', limit: 200 },
  { id: 'Baking', label: 'Oven Node', icon: '🔥', color: 'bg-orange-50', limit: 150 },
  { id: 'Frying', label: 'Fryer Station', icon: '🍳', color: 'bg-rose-50', limit: 100 },
  { id: 'Decoration', label: 'Decoration Lab', icon: '🎨', color: 'bg-pink-50', limit: 50 },
  { id: 'Packing', label: 'Packing Station', icon: '📦', color: 'bg-emerald-50', limit: 300 }
];

const ProductionKanban: React.FC<ProductionKanbanProps> = ({ orders, setOrders, skus, currency }) => {
  const [scaleFactor, setScaleFactor] = useState(1); // 1 = Actual, 2 = 2x Scaling, etc.
  
  const handleAdvance = (orderId: string, currentStep: string) => {
    const currentIndex = STAGES.findIndex(s => s.id === currentStep);
    if (currentIndex < STAGES.length - 1) {
      const nextStep = STAGES[currentIndex + 1].id;
      setOrders(orders.map(o => o.id === orderId ? { 
        ...o, 
        wipStep: nextStep,
        status: nextStep === 'Packing' ? 'Packed' : 'Processing' as OrderStatus
      } : o));
    }
  };

  const handleJumpToPacking = (orderId: string) => {
      setOrders(orders.map(o => o.id === orderId ? { 
        ...o, 
        wipStep: 'Packing',
        status: 'Packed' as OrderStatus
      } : o));
  };

  const flowAnalytics = useMemo(() => {
    const stageCounts = STAGES.map(s => {
      const stageOrders = orders.filter(o => (o.wipStep || 'Queue') === s.id && o.status !== 'Completed' && o.status !== 'Cancelled');
      const units = stageOrders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0) * scaleFactor;
      return {
        name: s.label,
        id: s.id,
        units,
        limit: s.limit,
        utilization: (units / s.limit) * 100,
        orderCount: stageOrders.length,
        value: stageOrders.reduce((sum, o) => sum + o.totalPrice, 0) * scaleFactor
      };
    });

    const bottleneck = [...stageCounts].sort((a, b) => b.utilization - a.utilization)[0];
    const totalWipValue = stageCounts.reduce((s, x) => s + x.value, 0);

    return { stageCounts, bottleneck, totalWipValue };
  }, [orders, scaleFactor]);

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <div>
                 <h3 className="text-xl font-bold font-serif text-slate-900 uppercase tracking-tighter">Capacity & WIP Simulator</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Measuring machine limits under industrial scale</p>
              </div>
              
              <div className="bg-indigo-50 p-2 rounded-2xl border border-indigo-100 flex items-center gap-3">
                 <span className="text-[8px] font-black text-indigo-400 uppercase ml-2">Load Simulation</span>
                 <div className="flex bg-white rounded-xl shadow-inner p-1">
                    {[1, 2, 3, 5].map(factor => (
                      <button 
                        key={factor}
                        onClick={() => setScaleFactor(factor)}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${scaleFactor === factor ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-slate-500'}`}
                      >
                         {factor === 1 ? 'ACTUAL' : `${factor}X`}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={flowAnalytics.stageCounts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#475569' }} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }} 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                           const data = payload[0].payload;
                           return (
                             <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-white/10 text-[10px] space-y-1">
                                <div className="font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-1 mb-1">{data.name}</div>
                                <div className="flex justify-between gap-4"><span>WIP Units:</span> <span className="font-mono">{data.units}</span></div>
                                <div className="flex justify-between gap-4"><span>Cap Limit:</span> <span className="font-mono text-slate-400">{data.limit}</span></div>
                                <div className="flex justify-between gap-4"><span>Saturation:</span> <span className={`font-mono ${data.utilization > 85 ? 'text-rose-400' : 'text-emerald-400'}`}>{data.utilization.toFixed(1)}%</span></div>
                             </div>
                           );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="units" radius={[8, 8, 0, 0]} barSize={45}>
                       {flowAnalytics.stageCounts.map((entry, index) => (
                         <Cell key={index} fill={entry.utilization > 90 ? '#f43f5e' : entry.utilization > 70 ? '#fbbf24' : '#6366f1'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className={`lg:col-span-4 p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-center relative overflow-hidden transition-all ${flowAnalytics.bottleneck?.utilization > 90 ? 'bg-rose-950' : 'bg-slate-900'}`}>
           <div className={`absolute top-0 right-0 w-32 h-32 rounded-full translate-x-10 -translate-y-10 blur-2xl ${flowAnalytics.bottleneck?.utilization > 90 ? 'bg-rose-500/20' : 'bg-indigo-500/10'}`}></div>
           <div className="relative z-10 space-y-6">
              <div className="text-center">
                 <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Scaling Stress Audit</div>
                 <div className="text-3xl font-bold font-serif text-white uppercase leading-tight">
                    {flowAnalytics.bottleneck?.utilization > 100 
                      ? `Breach: ${flowAnalytics.bottleneck.name}` 
                      : flowAnalytics.bottleneck?.utilization > 80 
                        ? `Warning: ${flowAnalytics.bottleneck.name}` 
                        : 'Scaling Ready'}
                 </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                 <p className="text-xs text-indigo-100 italic leading-relaxed">
                   {flowAnalytics.bottleneck?.utilization > 100 
                    ? `At ${scaleFactor}X scale, your ${flowAnalytics.bottleneck.name} will experience a 100% data and physical lock. New machinery or split shifts required.`
                    : scaleFactor > 1 
                      ? `System handles ${scaleFactor}X scale with minor congestion at ${flowAnalytics.bottleneck.name}. Procedural efficiency can mitigate.` 
                      : "The production floor is operating within standard nominals. Ready for scale."}
                 </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                 <div className="flex items-center gap-3 bg-amber-400 text-slate-900 p-4 rounded-2xl shadow-lg animate-pulse">
                    <span className="text-xl">✨</span>
                    <div>
                       <div className="text-[8px] font-black uppercase tracking-widest">Neural Prediction</div>
                       <div className="text-xs font-bold">"To achieve 5X scale, automate the {flowAnalytics.bottleneck.name} node."</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-10 scrollbar-hide">
        <div className="flex gap-6 min-w-max px-4">
          {STAGES.map(stage => {
            const stageOrders = orders.filter(o => (o.wipStep || 'Queue') === stage.id && o.status !== 'Completed' && o.status !== 'Cancelled');
            const totalUnits = stageOrders.reduce((s, o) => s + o.items.reduce((sum, i) => sum + i.quantity, 0), 0);
            const isFull = totalUnits >= stage.limit;
            
            return (
              <div key={stage.id} className="w-80 flex-shrink-0 space-y-4">
                <div className={`flex justify-between items-center px-5 py-3 bg-white rounded-2xl border transition-all ${isFull ? 'border-rose-300 ring-4 ring-rose-50 shadow-md' : 'border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{stage.icon}</span>
                    <div>
                       <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{stage.label}</h4>
                       <div className="text-[7px] font-bold text-slate-400 uppercase">Limit: {stage.limit} Units</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-mono font-black ${isFull ? 'text-rose-600' : 'text-indigo-900'}`}>{totalUnits}</div>
                    <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                       <div className={`h-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (totalUnits / stage.limit) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className={`${stage.color} rounded-[3.5rem] p-5 min-h-[600px] border border-slate-100 space-y-4 border-dashed relative`}>
                  {isFull && <div className="absolute inset-0 bg-rose-900/5 backdrop-blur-[1px] rounded-[3.5rem] z-0 pointer-events-none"></div>}
                  {stageOrders.map(order => {
                    const isCakeOrder = order.items.some(i => skus.find(s => s.id === i.skuId)?.isCake);
                    return (
                      <div 
                        key={order.id} 
                        className={`bg-white p-6 rounded-3xl border transition-all group cursor-default relative z-10 ${
                            isCakeOrder && stage.id === 'Decoration' ? 'ring-2 ring-pink-500 shadow-pink-100 shadow-xl' : 'border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{order.invoiceNumber}</span>
                          {isCakeOrder && <span className="bg-pink-500 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase">Cake</span>}
                        </div>
                        
                        <div className="space-y-1 mb-6">
                          {order.items.map((i, idx) => {
                            const sku = skus.find(s => s.id === i.skuId);
                            return (
                              <div key={idx} className="flex justify-between items-center">
                                <span className={`text-xs font-bold uppercase truncate pr-2 ${sku?.isCake ? 'text-pink-600' : 'text-slate-800'}`}>{sku?.name}</span>
                                <span className="text-xs font-mono font-black text-slate-400">x{i.quantity}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                          <div className="flex flex-col">
                             <span className="text-[8px] text-slate-300 font-black uppercase">Value</span>
                             <span className="text-[10px] font-mono font-bold text-slate-600">{currency.format(order.totalPrice)}</span>
                          </div>
                          <div className="flex gap-2">
                             {stage.id !== 'Packing' && (
                                <button 
                                  onClick={() => handleAdvance(order.id, stage.id)}
                                  className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all active:scale-90 group-hover:scale-105 ${
                                      isCakeOrder && stage.id === 'Frying' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-indigo-900 hover:bg-black'
                                  }`}
                                >
                                  <span className="text-xs">→</span>
                                </button>
                             )}
                             {(stage.id === 'Baking' || stage.id === 'Frying') && !isCakeOrder && (
                                 <button 
                                  onClick={() => handleJumpToPacking(order.id)}
                                  className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-all shadow-sm"
                                  title="Skip to Packing"
                                 >
                                    <span className="text-[10px]">⏩</span>
                                 </button>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductionKanban;
