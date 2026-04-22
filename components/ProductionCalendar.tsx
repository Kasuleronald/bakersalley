
import React, { useState, useMemo } from 'react';
import { SKU, ProductionLog, Sale, EnergyCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';

interface ProductionCalendarProps {
  skus: SKU[];
  productionLogs: ProductionLog[];
  sales: Sale[];
  onLogProduction: (skuId: string, rounds: number, date: string, actualYield?: number, orderId?: string, energyUsed?: EnergyCategory) => void;
}

const ProductionCalendar: React.FC<ProductionCalendarProps> = ({ skus, productionLogs, sales, onLogProduction }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [isLogging, setIsLogging] = useState(false);
  const [logForm, setLogForm] = useState<{ skuId: string; rounds: number; energyUsed: EnergyCategory }>({ 
    skuId: '', 
    rounds: 1, 
    energyUsed: 'Electricity' 
  });

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getLogsForDate = (dateStr: string) => productionLogs.filter(log => log.date === dateStr);

  const handleDayClick = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleLogSubmit = () => {
    if (logForm.skuId && selectedDate) {
      onLogProduction(logForm.skuId, logForm.rounds, selectedDate, undefined, undefined, logForm.energyUsed);
      setIsLogging(false);
      setLogForm({ skuId: '', rounds: 1, energyUsed: 'Electricity' });
    }
  };

  const selectedSku = useMemo(() => skus.find(s => s.id === logForm.skuId), [skus, logForm.skuId]);
  const calculatedTotalUnits = selectedSku ? selectedSku.yield * logForm.rounds : 0;

  const handleSkuChange = (id: string) => {
    const sku = skus.find(s => s.id === id);
    setLogForm({
      ...logForm,
      skuId: id,
      energyUsed: (sku?.primaryEnergySource || 'Electricity') as EnergyCategory
    });
  };

  // AUDIT ENGINE: Prepare data for the Bar Chart
  const throughputData = useMemo(() => {
    if (!selectedDate) return [];
    const logs = getLogsForDate(selectedDate);
    const agg: Record<string, { name: string; actual: number; theoretical: number }> = {};
    
    logs.forEach(log => {
      const sku = skus.find(s => s.id === log.skuId);
      if (!sku) return;
      if (!agg[log.skuId]) agg[log.skuId] = { name: sku.name, actual: 0, theoretical: 0 };
      
      // Ensure we count 0 as a valid actual yield if provided, otherwise fallback to theoretical
      const actualVal = log.actualYield !== undefined ? log.actualYield : log.totalUnitsProduced;
      agg[log.skuId].actual += actualVal;
      agg[log.skuId].theoretical += log.totalUnitsProduced;
    });

    return Object.values(agg).sort((a, b) => b.actual - a.actual);
  }, [selectedDate, productionLogs, skus]);

  const dailyTotalActual = useMemo(() => throughputData.reduce((s, x) => s + x.actual, 0), [throughputData]);

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif">Production Scheduler</h2>
          <p className="text-gray-500 font-medium">Tracking daily throughput and batch integrity.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-amber-100">
           <button onClick={prevMonth} className="p-2 hover:bg-amber-50 rounded-xl transition-colors">◀</button>
           <div className="px-6 py-2 font-bold text-amber-900 font-serif min-w-[150px] text-center">
             {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
           </div>
           <button onClick={nextMonth} className="p-2 hover:bg-amber-50 rounded-xl transition-colors">▶</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-white p-6 rounded-[2.5rem] shadow-sm border border-amber-50">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: startDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            {Array.from({ length: daysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
              const day = i + 1;
              const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateStr = d.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              const logs = getLogsForDate(dateStr);
              const totalUnits = logs.reduce((sum, l) => sum + (l.actualYield ?? l.totalUnitsProduced), 0);

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200 ring-offset-2' : 
                    'bg-white border-amber-50 hover:border-amber-200'
                  }`}
                >
                  <span className={`text-sm font-bold ${isSelected ? 'text-amber-900' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {totalUnits > 0 && <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-6 pt-6 border-t border-gray-50 text-[9px] font-bold uppercase tracking-wider text-gray-400">
             <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-600 rounded-full"></span> Production Logged</div>
             <div className="flex items-center gap-1.5"><span className="w-2 h-2 border border-amber-100 rounded-full"></span> Active Shift</div>
          </div>
        </div>

        {/* Date Details & Quick Log */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-900 rounded-[3rem] p-8 text-white shadow-2xl">
            <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-3">
              <span className="text-amber-400">📅</span>
              {selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : 'Select Date'}
            </h3>

            <div className="space-y-6">
              <div className="max-h-[200px] overflow-y-auto scrollbar-hide space-y-3">
                {selectedDate && getLogsForDate(selectedDate).map(log => {
                  const sku = skus.find(s => s.id === log.skuId);
                  return (
                    <div key={log.id} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10 group">
                      <div>
                        <span className="text-xs font-bold block group-hover:text-amber-400 transition-colors uppercase">{sku?.name}</span>
                        <span className="text-[9px] text-gray-500 uppercase">{log.roundsProduced} Rounds • {log.energyUsed || 'Electric'}</span>
                      </div>
                      <span className="font-mono text-amber-400 text-sm font-bold">
                        {(log.actualYield ?? log.totalUnitsProduced).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                {selectedDate && getLogsForDate(selectedDate).length === 0 && (
                  <div className="text-xs text-gray-500 italic text-center py-10 opacity-50">No logs for this date.</div>
                )}
              </div>

              {isLogging ? (
                <div className="bg-white/10 p-6 rounded-[2rem] border border-amber-500/30 space-y-4 animate-fadeIn">
                   <select 
                    className="w-full bg-gray-800 border-none rounded-xl p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500"
                    value={logForm.skuId}
                    onChange={e => handleSkuChange(e.target.value)}
                   >
                      <option value="">Select SKU...</option>
                      {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                   <div className="grid grid-cols-2 gap-3">
                      <input type="number" className="bg-gray-800 border-none rounded-xl p-3 text-xs font-mono font-bold" value={logForm.rounds} onChange={e => setLogForm({...logForm, rounds: parseInt(e.target.value) || 0})} placeholder="Rounds" />
                      <select className="bg-gray-800 border-none rounded-xl p-3 text-xs font-bold" value={logForm.energyUsed} onChange={e => setLogForm({...logForm, energyUsed: e.target.value as EnergyCategory})}>
                        <option value="Electricity">Electricity</option>
                        <option value="Firewood">Firewood</option>
                        <option value="Charcoal">Charcoal</option>
                        <option value="Gas">Gas</option>
                      </select>
                   </div>
                   <button onClick={handleLogSubmit} className="w-full bg-amber-600 hover:bg-amber-700 py-4 rounded-xl font-black text-[10px] uppercase transition-all shadow-lg">Commit Batch</button>
                   <button onClick={() => setIsLogging(false)} className="w-full text-[9px] font-bold text-gray-500 uppercase">Cancel</button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsLogging(true)}
                  className="w-full py-5 rounded-[2rem] border-2 border-dashed border-amber-500/30 text-amber-500 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/10 transition-all"
                >
                  + Manual Batch Log
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SKU VOLUME AUDIT CHART */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-amber-50 overflow-hidden animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-serif">Daily Volume Audit</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Analyzing units produced for {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          {dailyTotalActual > 0 && (
            <div className="bg-amber-50 px-8 py-4 rounded-[2rem] border border-amber-100 text-center">
               <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Cumulative Day Output</div>
               <div className="text-4xl font-mono font-black text-amber-900">{dailyTotalActual.toLocaleString()} <span className="text-xs uppercase">Units</span></div>
            </div>
          )}
        </div>
        
        {throughputData.length > 0 ? (
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={throughputData} 
                margin={{ top: 20, right: 30, left: 10, bottom: 100 }}
                barGap={12}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} 
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#fff8f0' }}
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)',
                    padding: '1.5rem' 
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 800, padding: '4px 0' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', marginBottom: '8px', paddingBottom: '4px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle" 
                  wrapperStyle={{ paddingBottom: '30px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                />
                <Bar 
                  name="Actual Yield" 
                  dataKey="actual" 
                  fill="#3d2b1f" 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                  animationDuration={1200}
                >
                   <LabelList 
                    dataKey="actual" 
                    position="top" 
                    style={{ fontSize: '10px', fontWeight: 800, fill: '#3d2b1f' }} 
                    formatter={(v: any) => v?.toLocaleString()}
                  />
                </Bar>
                <Bar 
                  name="Recipe Target" 
                  dataKey="theoretical" 
                  fill="#d97706" 
                  fillOpacity={0.15}
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[350px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[3.5rem] bg-slate-50/20">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-inner mb-6 opacity-40">📊</div>
             <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest text-center max-w-xs">
               Zero Throughput Logged for this Date Cycle
             </p>
             <button 
              onClick={() => setIsLogging(true)} 
              className="mt-6 px-8 py-3 bg-white border border-slate-200 text-[9px] font-black text-amber-600 uppercase tracking-widest rounded-xl hover:bg-amber-50 transition-all shadow-sm"
             >
               Start Shift Log
             </button>
          </div>
        )}

        <div className="mt-12 pt-10 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg shrink-0">📈</div>
              <div>
                 <h4 className="text-sm font-bold text-slate-900 uppercase">Yield Deviation Warning</h4>
                 <p className="text-xs text-slate-500 leading-relaxed italic">
                   "Consistent gaps between 'Recipe Target' and 'Actual Yield' indicate issues with floor scaling or oven calibration. Auditing this daily prevents long-term margin erosion."
                 </p>
              </div>
           </div>
           <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-lg shrink-0">🥖</div>
              <div>
                 <h4 className="text-sm font-bold text-slate-900 uppercase">Throughput Capacity</h4>
                 <p className="text-xs text-slate-500 leading-relaxed italic">
                   "Use the total day output to track against your plant's theoretical capacity. Ovens are your primary bottleneck; maximize their firing cycles for peak efficiency."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionCalendar;
