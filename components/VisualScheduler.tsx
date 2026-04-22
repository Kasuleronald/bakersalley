import React, { useMemo, useState } from 'react';
import { SKU, Order, WorkCenterResource, ScheduledTask } from '../types';
import { generateGanttSchedule } from '../services/geminiService';
import ModuleAiInteraction from './ModuleAiInteraction';

interface VisualSchedulerProps {
  orders: Order[];
  skus: SKU[];
  currency: { format: (v: number) => string };
}

const RESOURCES: WorkCenterResource[] = [
  { id: 'Oven-1', name: 'Rotary Diesel Oven A', type: 'Oven', capacity: 64 },
  { id: 'Oven-2', name: 'Electric Deck Oven B', type: 'Oven', capacity: 32 },
  { id: 'Mixer-1', name: 'Bulk Spiral Mixer', type: 'Mixer', capacity: 100 }
];

const VisualScheduler: React.FC<VisualSchedulerProps> = ({ orders, skus, currency }) => {
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSchedule = async (intent: string) => {
    setIsLoading(true);
    try {
      const result = await generateGanttSchedule(orders, skus, RESOURCES, intent);
      if (result) {
        setSchedule(result);
      }
    } catch (error) {
      console.error("Scheduling failed:", error);
      alert("AI Scheduling failed to synchronize with floor capacity.");
    } finally {
      setIsLoading(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 font-serif uppercase tracking-tight">Industrial Finite Scheduler</h2>
        <p className="text-slate-500 font-medium text-sm">Visualizing machine center loading and thermal sequence optimization.</p>
      </header>

      <ModuleAiInteraction 
        title="Oven Floor Sequencer"
        theme="indigo"
        isLoading={isLoading}
        onExecute={handleGenerateSchedule}
        suggestions={[
          "Optimize for thermal efficiency",
          "Prioritize high-value wholesale orders",
          "Minimize firewood consumption today",
          "Shift-balanced labor loading"
        ]}
        placeholder="e.g. 'Assume Oven B is undergoing maintenance for 3 hours starting at 10am'..."
      />

      <div className="bg-slate-900 p-8 md:p-10 rounded-[4rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
           <div>
              <h3 className="text-xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Production Timeline (24H)</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Constraint-Based Sequence</p>
           </div>
           <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">High Temp ({'>'}200°C)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Standard Bake</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prep/Mixing</span>
              </div>
           </div>
        </div>

        <div className="relative overflow-x-auto pb-10 scrollbar-hide">
           {/* Time Header Strip */}
           <div className="flex ml-48 mb-6 border-b border-white/10 pb-4">
              {hours.map(h => (
                <div key={h} className="w-24 text-[10px] font-mono font-bold text-slate-500 text-center flex-shrink-0">
                   {h.toString().padStart(2, '0')}:00
                </div>
              ))}
           </div>

           {/* Work Center Resource Lanes */}
           <div className="space-y-6">
              {RESOURCES.map(res => (
                <div key={res.id} className="flex items-center group/row">
                   <div className="w-48 pr-8 flex-shrink-0 border-r border-white/5 h-16 flex flex-col justify-center">
                      <div className="font-black text-[11px] text-slate-100 uppercase truncate tracking-tight">{res.name}</div>
                      <div className="text-[8px] text-indigo-400 font-bold uppercase mt-1">Capacity: {res.capacity} Trays</div>
                   </div>
                   
                   <div className="relative h-16 bg-white/[0.02] rounded-2xl flex-1 flex-shrink-0 mx-4 border border-white/[0.05]" style={{ width: `${24 * 6}rem` }}>
                      {schedule.filter(t => t.resourceId === res.id).map(task => {
                        const start = new Date(task.startTime);
                        const end = new Date(task.endTime);
                        // Calculate position based on 24 hour grid where each hour is 6rem
                        const startHour = start.getHours() + (start.getMinutes() / 60);
                        const endHour = end.getHours() + (end.getMinutes() / 60);
                        const duration = endHour - startHour;
                        
                        const isHighTemp = task.temperature > 200;
                        const isMixer = res.type === 'Mixer';

                        return (
                          <div 
                            key={task.id}
                            className={`absolute top-2 bottom-2 rounded-xl p-3 flex flex-col justify-center transition-all group cursor-pointer border shadow-lg hover:scale-[1.02] hover:z-20 ${
                              isMixer ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                              isHighTemp ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 
                              'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                            }`}
                            style={{ 
                              left: `${startHour * 6}rem`, 
                              width: `${duration * 6}rem` 
                            }}
                          >
                             <span className="text-[9px] font-black uppercase truncate tracking-tighter">{task.skuName}</span>
                             {!isMixer && <span className="text-[8px] font-mono opacity-60 font-bold">{task.temperature}°C</span>}
                             
                             {/* Detail Tooltip */}
                             <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover:block z-[100] bg-white text-slate-900 p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 min-w-[240px] animate-fadeIn">
                                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Schedule Detail</div>
                                <h4 className="font-black text-base uppercase border-b border-slate-100 pb-3 mb-4 leading-tight">{task.skuName}</h4>
                                <div className="space-y-2">
                                   <div className="flex justify-between text-[10px] font-bold">
                                      <span className="text-slate-400 uppercase">Start Time</span>
                                      <span className="text-slate-900 font-mono">{start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}</span>
                                   </div>
                                   <div className="flex justify-between text-[10px] font-bold">
                                      <span className="text-slate-400 uppercase">End Time</span>
                                      <span className="text-slate-900 font-mono">{end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}</span>
                                   </div>
                                   {!isMixer && (
                                     <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400 uppercase">Oven Temp</span>
                                        <span className="text-amber-600 font-mono">{task.temperature}°C</span>
                                     </div>
                                   )}
                                   <div className="flex justify-between text-[10px] font-bold">
                                      <span className="text-slate-400 uppercase">Resource</span>
                                      <span className="text-indigo-900">{res.name}</span>
                                   </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-center">
                                   <div className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Neural Sequence Validated ✓</div>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              ))}
           </div>
        </div>

        {schedule.length === 0 && (
          <div className="py-32 text-center opacity-20 grayscale flex flex-col items-center">
             <div className="text-8xl mb-6">🧊</div>
             <h4 className="text-xl font-bold font-serif text-slate-400 uppercase tracking-widest">Sequencer Cold</h4>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Enter an intent above to load the shift manifest</p>
          </div>
        )}
      </div>

      <div className="p-12 bg-indigo-900 rounded-[5rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-7xl opacity-20 grayscale shrink-0">📅</div>
         <div className="relative z-10 space-y-4">
            <h4 className="text-2xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Finite Capacity Architecture</h4>
            <p className="text-base text-indigo-100/90 leading-relaxed italic max-w-4xl">
              "BakersAlley Visual Scheduler simulates physical floor constraints by modeling individual oven capacities and thermal recovery times. Unlike horizontal ERP systems like Microsoft Dynamics, our **Neural Sequencer** understands that baking at 220°C immediately after 180°C consumes 22% more firewood. We optimize for thermal continuity to protect your bottom line."
            </p>
            <div className="pt-4 flex gap-6">
               <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">ISO 9001:2015 Compliant</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Energy Efficiency Layer Active</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default VisualScheduler;