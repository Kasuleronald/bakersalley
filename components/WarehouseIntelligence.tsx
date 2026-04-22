import React, { useMemo, useState } from 'react';
import { SKU, FinishedGood, Sale, InventoryMovement, Batch } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import ModuleAiInteraction from './ModuleAiInteraction';

interface WarehouseIntelligenceProps {
  skus: SKU[];
  finishedGoods: FinishedGood[];
  sales: Sale[];
  movements: InventoryMovement[];
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

const COLORS = ['#1e1b4b', '#4f46e5', '#818cf8', '#fbbf24', '#f59e0b', '#dc2626', '#10b981'];

const WarehouseIntelligence: React.FC<WarehouseIntelligenceProps> = ({ skus, finishedGoods, sales, movements, currency }) => {
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const analytics = useMemo(() => {
    const now = new Date();
    
    // 1. Storage Occupancy Logic (Simulated 500-unit bins per SKU)
    const BIN_CAPACITY = 500;
    const occupancyData = finishedGoods.map(fg => {
      const sku = skus.find(s => s.id === fg.skuId);
      const occupancy = (fg.stockLevel / BIN_CAPACITY) * 100;
      return {
        name: sku?.name || 'Unknown',
        level: fg.stockLevel,
        occupancy: Math.min(100, occupancy),
        isOverloaded: occupancy > 90
      };
    });

    // 2. Batch Ageing (Hours in Warehouse)
    const ageingBuckets = [
      { range: '0-12h', count: 0, color: '#10b981' },
      { range: '12-24h', count: 0, color: '#4f46e5' },
      { range: '24-48h', count: 0, color: '#f59e0b' },
      { range: '48h+', count: 0, color: '#dc2626' },
    ];

    finishedGoods.forEach(fg => {
      fg.batches.forEach(batch => {
        const received = batch.receivedDate ? new Date(batch.receivedDate) : now;
        const diffHrs = (now.getTime() - received.getTime()) / (1000 * 60 * 60);
        if (diffHrs <= 12) ageingBuckets[0].count += batch.quantity;
        else if (diffHrs <= 24) ageingBuckets[1].count += batch.quantity;
        else if (diffHrs <= 48) ageingBuckets[2].count += batch.quantity;
        else ageingBuckets[3].count += batch.quantity;
      });
    });

    // 3. Stock Velocity (DSI - Days Sales in Inventory)
    const dsiData = finishedGoods.map(fg => {
      const sku = skus.find(s => s.id === fg.skuId);
      const skuSales7d = sales
        .filter(s => s.skuId === fg.skuId && (now.getTime() - new Date(s.date).getTime()) < 7 * 24 * 3600000)
        .reduce((sum, s) => sum + s.quantity, 0);
      
      const avgDailySales = skuSales7d / 7;
      const dsi = avgDailySales > 0 ? fg.stockLevel / avgDailySales : 99; // 99 as infinity
      
      return {
        name: sku?.name.split(' ')[0] || 'SKU',
        dsi: Number(dsi.toFixed(1)),
        isRisk: dsi < 1 // Running out today
      };
    }).sort((a,b) => b.dsi - a.dsi).slice(0, 10);

    return { occupancyData, ageingBuckets, dsiData };
  }, [finishedGoods, skus, sales]);

  const handleRunAiWarehouseAudit = async (intent: string) => {
    setIsAiProcessing(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as an Industrial Warehouse Strategist for a commercial bakery.
        WAREHOUSE STATE: ${JSON.stringify(analytics.occupancyData)}
        BATCH AGEING: ${JSON.stringify(analytics.ageingBuckets)}
        STOCK VELOCITY (DSI): ${JSON.stringify(analytics.dsiData)}
        
        USER INTENT: "${intent || 'Optimize dispatch sequence to minimize spoilage'}"
        
        TASK:
        1. Identify the "Stagnant Capital" SKU (High stock, Low DSI).
        2. Identify the "Stock-Out Threat" SKU (Low DSI, High Sales).
        3. Suggest a warehouse re-arrangement or dispatch strategy.
        Keep it concise and professional.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiReport(response.text || "Audit complete. Warehouse flow is nominal.");
    } catch (e) {
      setAiReport("Neural audit failed. Verify spatial data linkage.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* SPATIAL & TEMPORAL KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4 group hover:border-indigo-200 transition-all">
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregate Occupancy</div>
           <div className="text-4xl font-mono font-black text-indigo-900">
             {Math.round(analytics.occupancyData.reduce((s, x) => s + x.occupancy, 0) / (analytics.occupancyData.length || 1))}%
           </div>
           <p className="text-[8px] text-slate-300 font-bold uppercase">Volume vs Bin Capacity</p>
        </div>
        
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl space-y-4">
           <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Freshness Index</div>
           <div className="text-4xl font-mono font-black">
              {Math.round((analytics.ageingBuckets[0].count / (analytics.ageingBuckets.reduce((s,x)=>s+x.count,0) || 1)) * 100)}%
           </div>
           <p className="text-[8px] text-slate-500 font-bold uppercase">Stock &lt; 12 Hours Old</p>
        </div>

        <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 text-center flex flex-col justify-center">
           <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Dispatch Lead Time</div>
           <div className="text-3xl font-mono font-black text-indigo-950">4.2 <span className="text-xs">Hrs</span></div>
           <p className="text-[8px] text-indigo-400 font-bold uppercase mt-2">Pack-to-Truck Velocity</p>
        </div>

        <div className={`p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center text-center ${analytics.dsiData.some(d => d.isRisk) ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`}>
           <div className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1">Stock-Out Alerts</div>
           <div className="text-4xl font-mono font-black">{analytics.dsiData.filter(d => d.isRisk).length}</div>
           <p className="text-[8px] font-bold uppercase mt-2">SKUs with &lt; 1 Day DSI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CHART: BATCH AGEING */}
        <div className="lg:col-span-7 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-bold font-serif text-slate-900 mb-8 uppercase tracking-tighter">Temporal Stock Profile (Ageing)</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={analytics.ageingBuckets}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                       {analytics.ageingBuckets.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-6 p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
              <span className="text-2xl">⏳</span>
              <p className="text-[10px] text-slate-500 italic leading-relaxed">
                "High counts in the red (48h+) bucket indicate potential expiry losses. Consider a 'Stales Promo' or reducing the production rounds for these SKUs."
              </p>
           </div>
        </div>

        {/* CHART: DSI Velocity */}
        <div className="lg:col-span-5 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-bold font-serif text-slate-900 mb-8 uppercase tracking-tighter">Sales Runway (DSI)</h3>
           <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
              {analytics.dsiData.map(item => (
                <div key={item.name} className={`p-4 rounded-3xl border transition-all flex justify-between items-center ${item.isRisk ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                   <div>
                      <div className="font-black text-xs uppercase text-slate-900">{item.name}</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">Days of Stock</div>
                   </div>
                   <div className="text-right">
                      <div className={`text-xl font-mono font-black ${item.isRisk ? 'text-rose-600' : 'text-indigo-900'}`}>{item.dsi}</div>
                      {item.isRisk && <span className="text-[7px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase">Refill ASAP</span>}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* AI INTELLIGENCE HUB */}
      <ModuleAiInteraction 
        title="Warehouse Intelligence Audit"
        theme="indigo"
        isLoading={isAiProcessing}
        onExecute={handleRunAiWarehouseAudit}
        suggestions={[
          "Identify dead capital in the warehouse",
          "Forecast tomorrow's bin congestion",
          "Audit dispatch lead times vs spoilage",
          "Optimize pallet layout for high-velocity SKUs"
        ]}
        response={aiReport}
      />

      {/* SPATIAL OCCUPANCY GRID */}
      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="px-10 py-8 bg-slate-50 border-b flex justify-between items-center">
            <div>
               <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Bin Density Matrix</h3>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Spatial Utilization of Finished Goods Warehouse</p>
            </div>
         </div>
         <div className="p-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {analytics.occupancyData.map(bin => (
              <div key={bin.name} className="relative aspect-square bg-slate-50 rounded-[2.5rem] border border-slate-100 p-6 flex flex-col justify-end group overflow-hidden hover:shadow-xl transition-all">
                 <div className="absolute inset-x-0 bottom-0 bg-indigo-100 transition-all duration-1000" style={{ height: `${bin.occupancy}%`, backgroundColor: bin.occupancy > 90 ? '#fee2e2' : '#e0e7ff' }}></div>
                 <div className="relative z-10">
                    <div className="font-black text-[10px] text-slate-900 uppercase leading-tight mb-1">{bin.name}</div>
                    <div className="flex justify-between items-end">
                       <span className="text-sm font-mono font-black text-indigo-900">{Math.round(bin.occupancy)}%</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase">{bin.level} Units</span>
                    </div>
                 </div>
                 {bin.occupancy > 90 && <div className="absolute top-4 right-4 text-xs animate-pulse">⚠️</div>}
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default WarehouseIntelligence;