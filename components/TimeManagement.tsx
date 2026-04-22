
import React, { useState, useEffect, useMemo } from 'react';
import { SKU, Activity, CategoryTimePreset, ProductionLog } from '../types';

interface TimeManagementProps {
  skus: SKU[];
  activities: Activity[];
  timePresets: CategoryTimePreset[];
  setTimePresets: (p: CategoryTimePreset[]) => void;
  productionLogs: ProductionLog[];
  setProductionLogs: (l: ProductionLog[]) => void;
  initialTab?: 'Presets' | 'Live' | 'History';
}

const TimeManagement: React.FC<TimeManagementProps> = ({ skus, activities, timePresets, setTimePresets, productionLogs, setProductionLogs, initialTab = 'Presets' }) => {
  const [activeTab, setActiveTab] = useState<'Presets' | 'Live' | 'History'>(initialTab);
  const [timers, setTimers] = useState<Record<string, { startTime: number; elapsed: number; isRunning: boolean }>>({});
  
  // Update internal tab if prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [editingKey, setEditingKey] = useState<string | null>(null); // "category-activityId"
  const [editValue, setEditValue] = useState<number>(0);

  const categories = useMemo(() => [...new Set(skus.map(s => s.category))], [skus]);
  const timeBasedActivities = useMemo(() => activities.filter(a => a.driver === 'Minutes' || a.driver.includes('Hours')), [activities]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          if (next[key].isRunning) {
            next[key] = { ...next[key], elapsed: Date.now() - next[key].startTime };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTimer = (id: string) => {
    setTimers(prev => ({
      ...prev,
      [id]: { startTime: Date.now() - (prev[id]?.elapsed || 0), elapsed: prev[id]?.elapsed || 0, isRunning: true }
    }));
  };

  const handleStopTimer = (id: string) => {
    setTimers(prev => ({
      ...prev,
      [id]: { ...prev[id], isRunning: false }
    }));
  };

  const handleResetTimer = (id: string) => {
    setTimers(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startEditing = (cat: string, actId: string, currentVal: number) => {
    setEditingKey(`${cat}-${actId}`);
    setEditValue(currentVal);
  };

  const savePreset = (cat: string, actId: string) => {
    const exists = timePresets.findIndex(p => p.category === cat && p.activityId === actId);
    const updatedPreset: CategoryTimePreset = { category: cat, activityId: actId, defaultMinutes: editValue };
    
    if (exists > -1) {
      const next = [...timePresets];
      next[exists] = updatedPreset;
      setTimePresets(next);
    } else {
      setTimePresets([...timePresets, updatedPreset]);
    }
    setEditingKey(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {activeTab === 'Presets' && (
        <div className="space-y-6">
           <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-amber-50">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-serif">Bakery Standard Times</h3>
                  <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Click any duration to edit category presets</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {categories.map(cat => (
                   <div key={cat} className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 group hover:border-amber-200 transition-all hover:bg-white hover:shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-xs font-bold text-amber-900 uppercase tracking-widest">{cat}</div>
                      </div>
                      <div className="space-y-4">
                         {timeBasedActivities.map(act => {
                           const preset = timePresets.find(p => p.category === cat && p.activityId === act.id);
                           const isEditing = editingKey === `${cat}-${act.id}`;
                           const hasValue = (preset?.defaultMinutes || 0) > 0;
                           return (
                             <div key={act.id} className="flex justify-between items-center group/row">
                                <span className="text-[10px] font-bold text-gray-400 uppercase group-hover/row:text-gray-900 transition-colors">{act.name}</span>
                                {isEditing ? (
                                  <div className="flex items-center gap-1 animate-fadeIn">
                                    <input type="number" autoFocus className="w-16 px-2 py-1 bg-white border border-amber-500 rounded-lg text-xs font-mono font-bold outline-none" value={editValue} onChange={e => setEditValue(parseInt(e.target.value) || 0)} onKeyDown={e => e.key === 'Enter' && savePreset(cat, act.id)} />
                                    <button onClick={() => savePreset(cat, act.id)} className="text-green-600 font-bold text-xs hover:scale-110">✓</button>
                                  </div>
                                ) : (
                                  <button onClick={() => startEditing(cat, act.id, preset?.defaultMinutes || 0)} className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${hasValue ? 'bg-amber-100 text-amber-800 hover:bg-amber-900 hover:text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                    {preset?.defaultMinutes || 0}m
                                  </button>
                                )}
                             </div>
                           );
                         })}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Live' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-50">
              <h3 className="text-xl font-bold text-gray-900 font-serif mb-6">Interactive Production Timers</h3>
              <div className="space-y-6">
                 {skus.slice(0, 5).map(sku => (
                   <div key={sku.id} className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                         <h4 className="font-bold text-gray-900 text-sm uppercase">{sku.name}</h4>
                         <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{sku.category}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                         {sku.activities.filter(sa => activities.find(a => a.id === sa.activityId)?.driver.includes('Minutes') || activities.find(a => a.id === sa.activityId)?.driver.includes('Hours')).map(sa => {
                           const act = activities.find(a => a.id === sa.activityId);
                           const timerId = `${sku.id}-${act?.id}`;
                           const timer = timers[timerId];
                           return (
                             <div key={sa.activityId} className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-2">
                                <span className="text-[8px] font-bold text-gray-400 uppercase text-center h-4">{act?.name}</span>
                                <div className="text-xl font-mono font-bold text-gray-900">
                                   {timer ? formatTime(timer.elapsed) : '0:00'}
                                </div>
                                <div className="flex gap-1">
                                   {!timer?.isRunning ? (
                                     <button onClick={() => handleStartTimer(timerId)} className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">▶</button>
                                   ) : (
                                     <button onClick={() => handleStopTimer(timerId)} className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs">⏸</button>
                                   )}
                                   <button onClick={() => handleResetTimer(timerId)} className="w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs">↺</button>
                                </div>
                             </div>
                           );
                         })}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl flex flex-col">
              <h3 className="text-xl font-bold text-amber-400 font-serif mb-6">Efficiency Impact (Real-Time)</h3>
              <div className="flex-1 space-y-8">
                 <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                    <p className="text-xs text-gray-400 leading-relaxed italic">
                      "Every minute beyond standard duration adds variable cost to unit COGS."
                    </p>
                 </div>
                 <div className="space-y-6">
                    <div className="flex justify-between items-end"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Floor Activity</span><span className="text-2xl font-mono font-bold text-amber-400">NOMINAL</span></div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden"><div className="bg-amber-500 h-full" style={{ width: '45%' }}></div></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'History' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-amber-50 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-gray-50">
                 <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-8 py-5">Date / Product</th>
                    <th className="px-6 py-5 text-center">Batch Vol</th>
                    <th className="px-8 py-5 text-right">Drift Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {productionLogs.slice(0, 10).map(log => {
                    const sku = skus.find(s => s.id === log.skuId);
                    return (
                      <tr key={log.id}>
                         <td className="px-8 py-5"><div className="font-bold text-gray-900">{sku?.name}</div><div className="text-[9px] text-gray-400 font-mono">{log.date}</div></td>
                         <td className="px-6 py-5 text-center font-mono font-bold text-gray-500">{log.totalUnitsProduced}</td>
                         <td className="px-8 py-5 text-right font-mono font-bold text-green-600">Within Standard</td>
                      </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default TimeManagement;
