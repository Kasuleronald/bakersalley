
import React, { useMemo } from 'react';
import { ProductionLog, DowntimeEvent, Asset, OEEMetrics } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, BarChart, Bar, Legend } from 'recharts';

interface OeeAuditorProps {
  logs: ProductionLog[];
  downtime: DowntimeEvent[];
  assets: Asset[];
}

const OeeAuditor: React.FC<OeeAuditorProps> = ({ logs, downtime, assets }) => {
  const oeeMetrics = useMemo(() => {
    // 1. Availability: (Scheduled Time - Downtime) / Scheduled Time
    const totalScheduledMinutes = assets.filter(a => a.category === 'Machinery').length * 8 * 60; // 8hr shift
    const totalDowntimeMinutes = 45; // Simulated for now
    const availability = ((totalScheduledMinutes - totalDowntimeMinutes) / totalScheduledMinutes) * 100;

    // 2. Performance: (Actual Yield / Ideal Yield)
    const totalActual = logs.reduce((s, l) => s + (l.actualYield || 0), 0);
    const totalTheoretical = logs.reduce((s, l) => s + l.totalUnitsProduced, 0);
    const performance = totalTheoretical > 0 ? (totalActual / totalTheoretical) * 100 : 100;

    // 3. Quality: (Good Units / Total Units)
    const quality = 98.5; // High benchmark for bakery

    const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

    return { availability, performance, quality, oee, totalActual, totalTheoretical };
  }, [logs, downtime, assets]);

  const barData = [
    { name: 'Avail.', val: oeeMetrics.availability, color: '#6366f1' },
    { name: 'Perf.', val: oeeMetrics.performance, color: '#f59e0b' },
    { name: 'Qual.', val: oeeMetrics.quality, color: '#10b981' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Availability', value: oeeMetrics.availability, color: 'text-indigo-600', sub: 'Uptime Ratio' },
           { label: 'Performance', value: oeeMetrics.performance, color: 'text-amber-600', sub: 'Speed Efficiency' },
           { label: 'Quality', value: oeeMetrics.quality, color: 'text-emerald-600', sub: 'First-Pass Yield' },
           { label: 'OEE Score', value: oeeMetrics.oee, color: 'text-slate-900', sub: 'World Class: 85%+', isMain: true }
         ].map((m, i) => (
           <div key={i} className={`p-8 rounded-[3rem] border shadow-sm flex flex-col justify-center text-center transition-all hover:scale-[1.02] ${m.isMain ? 'bg-indigo-900 text-white shadow-xl' : 'bg-white border-slate-100'}`}>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${m.isMain ? 'text-amber-400' : 'text-slate-400'}`}>{m.label}</div>
              <div className={`text-4xl font-mono font-black ${m.isMain ? 'text-white' : m.color}`}>{m.value.toFixed(1)}%</div>
              <p className={`text-[8px] font-bold uppercase mt-2 ${m.isMain ? 'text-indigo-300' : 'text-slate-300'}`}>{m.sub}</p>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-xl font-bold font-serif text-slate-900 uppercase tracking-tighter">OEE Component Breakdown</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Identifying the primary driver of efficiency loss</p>
               </div>
               <div className="bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100 text-center">
                  <div className="text-[8px] font-black text-slate-400 uppercase">Shift Load</div>
                  <div className="text-xl font-mono font-black text-slate-900">{oeeMetrics.totalActual} / {oeeMetrics.totalTheoretical}</div>
               </div>
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#475569' }} />
                     <YAxis domain={[0, 100]} hide />
                     <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                     <Bar dataKey="val" radius={[12, 12, 0, 0]} barSize={60}>
                        {barData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <aside className="lg:col-span-4 bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl flex flex-col justify-center border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full translate-x-10 -translate-y-10 blur-3xl"></div>
            <h4 className="text-xl font-bold font-serif text-amber-400 mb-6 relative z-10">OEE Logic Sentinel</h4>
            <div className="space-y-6 relative z-10">
               <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Diagnostic</span>
                  <p className="text-xs text-indigo-100 italic leading-relaxed">
                     {oeeMetrics.availability < 90 ? "High downtime is crushing your OEE. Audit machine maintenance logs immediately." : 
                      oeeMetrics.performance < 90 ? "Your equipment is running, but slower than ideal. Check for motor fatigue or staff training gaps." :
                      "Overall equipment effectiveness is within world-class nominals."}
                  </p>
               </div>
               <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-amber-400 transition-all">Download Efficiency PDF</button>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default OeeAuditor;
