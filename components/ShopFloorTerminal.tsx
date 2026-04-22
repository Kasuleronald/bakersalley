
import React, { useState, useMemo, useEffect } from 'react';
import { SKU, Asset, Employee, ProductionLog, DowntimeEvent, EnergyCategory, DefectCategory, SensorData } from '../types';

interface ActiveSession {
  id: string;
  machineId: string;
  skuId: string;
  operatorId: string;
  startTime: string;
  status: 'EXECUTING' | 'SEALING';
}

interface ShopFloorTerminalProps {
  skus: SKU[];
  assets: Asset[];
  employees: Employee[];
  logs: ProductionLog[];
  onLogBatch: (log: ProductionLog, defects?: { type: DefectCategory, qty: number }[]) => void;
  downtime: DowntimeEvent[];
  onLogDowntime: (event: DowntimeEvent) => void;
  currency: { format: (v: number) => string };
}

const DEFECT_TYPES: DefectCategory[] = ['Crumb Texture', 'Crust Color', 'Shape/Form', 'Weight Variance', 'Internal Temp', 'Contamination', 'Packaging', 'Proofing', 'Under-baked', 'Over-baked'];

const ShopFloorTerminal: React.FC<ShopFloorTerminalProps> = ({ skus, assets, employees, logs, onLogBatch, downtime, onLogDowntime, currency }) => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [sensors, setSensors] = useState<SensorData[]>([]);
  
  // IoT Simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const newSensors: SensorData[] = assets.filter(a => a.category === 'Machinery').map(a => {
        const temp = 180 + Math.random() * 40;
        const vib = Math.random() * 10;
        return {
          id: a.id,
          type: 'Temperature',
          value: Math.round(temp),
          unit: '°C',
          timestamp: new Date().toISOString(),
          status: temp > 215 ? 'Critical' : temp > 200 ? 'Warning' : 'Normal'
        };
      });
      setSensors(newSensors);
    }, 3000);
    return () => clearInterval(interval);
  }, [assets]);
  
  // Form State for "New Batch"
  const [pendingMachineId, setPendingMachineId] = useState('');
  const [pendingSkuId, setPendingSkuId] = useState('');
  const [pendingOperatorId, setPendingOperatorId] = useState('');

  const [sealForm, setSealForm] = useState<{
    sessionId?: string;
    logId?: string;
    actualYield: number;
    defects: { type: DefectCategory, qty: number }[];
  } | null>(null);

  const handleStartBatch = () => {
    if (!pendingMachineId || !pendingSkuId || !pendingOperatorId) {
      alert("Select Machine, Product, and Operator to initiate firing.");
      return;
    }
    const newSession: ActiveSession = {
      id: `session-${Date.now()}`,
      machineId: pendingMachineId,
      skuId: pendingSkuId,
      operatorId: pendingOperatorId,
      startTime: new Date().toISOString(),
      status: 'EXECUTING'
    };
    setActiveSessions([...activeSessions, newSession]);
    setPendingSkuId('');
  };

  const handleOpenSealing = (session: ActiveSession) => {
    const sku = skus.find(s => s.id === session.skuId);
    setSealForm({
      sessionId: session.id,
      actualYield: sku?.yield || 0,
      defects: []
    });
  };

  const handleOpenEdit = (log: ProductionLog) => {
    setSealForm({
      logId: log.id,
      actualYield: log.actualYield || log.totalUnitsProduced,
      defects: []
    });
  };

  const handleAddDefect = (type: DefectCategory, qty: number) => {
    if (!sealForm || !type || qty <= 0) return;
    setSealForm({
      ...sealForm,
      defects: [...sealForm.defects, { type, qty }]
    });
  };

  const handleFinalizeSeal = () => {
    if (!sealForm) return;

    if (sealForm.sessionId) {
      const session = activeSessions.find(s => s.id === sealForm.sessionId)!;
      const sku = skus.find(s => s.id === session.skuId)!;
      const machine = assets.find(a => a.id === session.machineId);

      // Fixed: Ensure ProductionLog includes startTime to match extended interface
      const log: ProductionLog = {
        id: `batch-${Date.now()}`,
        skuId: session.skuId,
        skuVersion: sku.version,
        roundsProduced: 1,
        totalUnitsProduced: sku.yield,
        actualYield: sealForm.actualYield,
        date: new Date().toISOString().split('T')[0],
        startTime: session.startTime,
        endTime: new Date().toISOString(),
        machineId: session.machineId,
        operatorId: session.operatorId,
        energyUsed: machine?.primaryEnergySource
      };

      onLogBatch(log, sealForm.defects);
      setActiveSessions(activeSessions.filter(s => s.id !== sealForm.sessionId));
    } else if (sealForm.logId) {
      const log = logs.find(l => l.id === sealForm.logId)!;
      const updatedLog = { ...log, actualYield: sealForm.actualYield };
      onLogBatch(updatedLog, sealForm.defects);
    }

    setSealForm(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-4">Start New Process</h3>
            <div className="space-y-4">
               <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Work Center</label>
                  <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" value={pendingMachineId} onChange={e => setPendingMachineId(e.target.value)}>
                    <option value="">Select Oven/Mixer...</option>
                    {assets.filter(a => a.category === 'Machinery').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Product SKU</label>
                  <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" value={pendingSkuId} onChange={e => setPendingSkuId(e.target.value)}>
                    <option value="">Select SKU...</option>
                    {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Lead Operator</label>
                  <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" value={pendingOperatorId} onChange={e => setPendingOperatorId(e.target.value)}>
                    <option value="">Choose Personnel...</option>
                    {employees.filter(e => e.department === 'Production').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
               </div>
               <button onClick={handleStartBatch} className="w-full py-4 bg-indigo-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all active:scale-95">Initiate Batch Round</button>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl space-y-6">
             <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">Edge Sensor Node (IoT)</h4>
             <div className="space-y-4">
                {sensors.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                     <div className="overflow-hidden pr-2">
                        <div className="text-[10px] font-bold text-slate-300 truncate">{assets.find(a => a.id === s.id)?.name}</div>
                        <div className="text-[7px] font-black text-slate-500 uppercase">Telemetry: Active</div>
                     </div>
                     <div className="text-right">
                        <div className={`text-sm font-mono font-black ${s.status === 'Critical' ? 'text-rose-500 animate-pulse' : s.status === 'Warning' ? 'text-amber-500' : 'text-emerald-400'}`}>
                           {s.value}{s.unit}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </aside>

        <main className="lg:col-span-8 space-y-6">
           <div className="bg-slate-900 p-8 rounded-[4rem] text-white shadow-2xl relative overflow-hidden min-h-[500px]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold font-serif text-amber-400 uppercase">Active Shop Floor Manifest</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                       <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Real-time Stream</span>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {activeSessions.map(session => {
                      const sku = skus.find(s => s.id === session.skuId);
                      const machine = assets.find(a => a.id === session.machineId);
                      const sensor = sensors.find(s => s.id === machine?.id);
                      const startTime = new Date(session.startTime);
                      
                      return (
                        <div key={session.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col justify-between group hover:bg-white/10 transition-all border-l-4 border-l-emerald-500 relative overflow-hidden">
                           {sensor?.status === 'Critical' && <div className="absolute inset-0 bg-rose-900/20 backdrop-blur-[1px] pointer-events-none"></div>}
                           <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h4 className="text-lg font-black uppercase text-white truncate max-w-[180px]">{sku?.name}</h4>
                                    <span className="text-[9px] font-black text-indigo-400 uppercase">{machine?.name}</span>
                                 </div>
                                 <div className="text-right">
                                    <div className={`text-lg font-mono font-black ${sensor?.status === 'Critical' ? 'text-rose-500 animate-bounce' : 'text-emerald-400'}`}>
                                       {sensor?.value || '--'}{sensor?.unit || ''}
                                    </div>
                                    <span className="text-[7px] text-slate-500 uppercase font-black">Live Temp</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4 py-3 border-y border-white/5">
                                 <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-slate-500 uppercase">Started At</span>
                                    <span className="text-xs font-mono font-bold">{startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-slate-500 uppercase">Target Yield</span>
                                    <span className="text-xs font-mono font-bold">{sku?.yield} {sku?.unit}</span>
                                 </div>
                              </div>
                           </div>
                           <button onClick={() => handleOpenSealing(session)} className="w-full mt-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-amber-400 transition-all">Open Sealer Hub</button>
                        </div>
                      );
                    })}

                    {activeSessions.length === 0 && (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30 grayscale text-center space-y-4">
                         <div className="text-7xl">🔥</div>
                         <h4 className="text-xl font-bold font-serif uppercase tracking-widest">Ovens are Cold</h4>
                         <p className="text-xs max-w-xs italic leading-relaxed">Initiate a batch round from the left console to begin tracking production flow.</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </main>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="px-10 py-8 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Batch Audit & Correction</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                     <th className="px-10 py-6">Timestamp / Batch ID</th>
                     <th className="px-6 py-6">Product Item</th>
                     <th className="px-6 py-6 text-center">Rounds</th>
                     <th className="px-6 py-6 text-center">Actual Yield</th>
                     <th className="px-10 py-6 text-right">Operations</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {logs.slice(0, 10).map(log => {
                    const sku = skus.find(s => s.id === log.skuId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-all group">
                        <td className="px-10 py-5">
                          <div className="font-mono text-[10px] font-black text-indigo-600">#{log.id.slice(-8)}</div>
                          <div className="text-[9px] text-slate-400 font-bold">{new Date(log.startTime || log.date).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-black text-slate-900 text-xs uppercase">{sku?.name || 'Unknown'}</div>
                          <div className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">Work Center: {log.machineId || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-5 text-center font-mono font-bold text-slate-400 text-xs">{log.roundsProduced}</td>
                        <td className="px-6 py-5 text-center">
                           <div className="text-sm font-mono font-black text-slate-900">{log.actualYield ?? log.totalUnitsProduced}</div>
                        </td>
                        <td className="px-10 py-5 text-right">
                           <button onClick={() => handleOpenEdit(log)} className="px-6 py-2 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-900 hover:text-white transition-all shadow-sm">✎ Edit Entry</button>
                        </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {sealForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col animate-softFade border border-white/20">
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-bold font-serif text-amber-400 uppercase tracking-tighter">{sealForm.logId ? 'Retroactive Yield Recalibration' : 'Verification & Batch Sealing'}</h3>
                    <p className="text-indigo-300 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Audit Protocol v3.2</p>
                 </div>
                 <button onClick={() => setSealForm(null)} className="text-slate-400 hover:text-white text-2xl font-bold relative z-10">✕</button>
              </div>

              <div className="p-12 overflow-y-auto scrollbar-hide max-h-[70vh]">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                       <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actual Salable Units Reconciled</label>
                          <input type="number" autoFocus className="w-full bg-white border-none rounded-3xl p-8 text-center font-mono font-black text-6xl text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-inner" value={sealForm.actualYield || ''} onChange={e => setSealForm({...sealForm, actualYield: parseFloat(e.target.value) || 0})} />
                       </div>
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-4">Defect Classification Lab</h4>
                          <div className="grid grid-cols-2 gap-3">
                             <select id="defectType" className="bg-slate-100 border-none rounded-2xl p-4 font-bold text-xs outline-none">
                                <option value="">Select Defect...</option>
                                {DEFECT_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                             </select>
                             <input id="defectQty" type="number" className="bg-slate-100 border-none rounded-2xl p-4 font-mono font-black text-sm" placeholder="Qty" />
                          </div>
                          <button onClick={() => {
                              const type = (document.getElementById('defectType') as HTMLSelectElement).value;
                              const qty = parseFloat((document.getElementById('defectQty') as HTMLInputElement).value);
                              if (type && qty > 0) handleAddDefect(type as DefectCategory, qty);
                            }} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase border border-rose-100 hover:bg-rose-100 transition-all">+ Log Defective Units</button>
                       </div>
                    </div>
                    <div className="space-y-8">
                       <div className="bg-indigo-900/5 p-8 rounded-[3rem] border border-indigo-100 flex flex-col h-full overflow-hidden">
                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Wastage Manifest</h4>
                          <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                             {sealForm.defects.map((d, i) => (
                               <div key={i} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-indigo-50 group hover:border-rose-300 transition-all shadow-sm">
                                  <span className="text-xs font-black text-slate-900 uppercase">{d.type}</span>
                                  <div className="flex items-center gap-4">
                                     <span className="text-sm font-mono font-black text-rose-600">{d.qty}</span>
                                     <button onClick={() => setSealForm({...sealForm, defects: sealForm.defects.filter((_, idx) => idx !== i)})} className="text-slate-200 hover:text-rose-500">✕</button>
                                  </div>
                                </div>
                             ))}
                             {sealForm.defects.length === 0 && <div className="py-20 text-center text-slate-300 italic text-[10px] uppercase font-bold">Zero defects identified in this audit</div>}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                 <button onClick={() => setSealForm(null)} className="px-12 py-5 bg-white border border-slate-200 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Discard Changes</button>
                 <button onClick={handleFinalizeSeal} className="px-16 py-5 bg-indigo-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95">{sealForm.logId ? 'Authorize Recalibration' : 'Commit & Seal Batch'}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ShopFloorTerminal;
