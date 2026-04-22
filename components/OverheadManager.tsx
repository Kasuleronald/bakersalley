
import React, { useState, useMemo } from 'react';
import { Overhead, DepartmentName, Activity, SKU, EnergyCategory, Transaction, AccountType, AllocationMethod } from '../types';
import { DEPARTMENTS } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface OverheadManagerProps {
  overheads: Overhead[];
  setOverheads: (overheads: Overhead[]) => void;
  activities: Activity[];
  skus: SKU[];
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
}

// Added 'Water' to ENERGY_OPTIONS to match the type update and allow utility tracking
const ENERGY_OPTIONS: EnergyCategory[] = ['Electricity', 'Firewood', 'Gas', 'Charcoal', 'Solar', 'Diesel (Gen)', 'Water', 'Other'];
const ALLOCATION_METHODS: { label: string; value: AllocationMethod }[] = [
  { label: 'Per Unit Production Volume', value: 'Production Volume' },
  { label: 'Per Labor Hour / Time', value: 'Labor Hours' },
  { label: 'Manual Weight %', value: 'Manual Percentage' },
  { label: 'Manual Fixed Weight', value: 'Manual weight' }
];

const PRODUCTION_DAYS_PER_MONTH = 26;
const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const OverheadManager: React.FC<OverheadManagerProps> = ({ overheads, setOverheads, activities, skus, transactions, setTransactions }) => {
  const [activeSubTab, setActiveSubTab] = useState<'Registry' | 'EnergyPortfolio'>('Registry');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Overhead> | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAccount, setPayAccount] = useState<AccountType>('Bank');
  const [payAmount, setPayAmount] = useState<number>(0);

  const [newOh, setNewOh] = useState<Partial<Overhead>>({
    name: '',
    amount: 0,
    type: 'Fixed',
    period: 'Monthly',
    department: 'Administration',
    activityId: '',
    skuId: '',
    variablePercentage: 0.5,
    energyCategory: 'Electricity',
    allocationMethod: 'Production Volume',
    allocationValue: 100,
    skuWeights: {}
  });

  const energyAuditData = useMemo(() => {
    const map: Record<string, number> = {};
    ENERGY_OPTIONS.forEach(cat => map[cat] = 0);
    
    overheads.forEach(oh => {
      const mult = oh.period === 'Weekly' ? 4.33 : oh.period === 'Daily' ? 26 : 1;
      const cat = oh.energyCategory || 'Other';
      map[cat] += (oh.amount * mult);
    });

    const chartData = Object.entries(map)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));

    const totalVolume = skus.reduce((s, x) => s + x.monthlyVolumeEstimate, 0) || 1;
    const totalEnergySpend = Object.values(map).reduce((a, b) => a + b, 0);
    const energyDensity = totalEnergySpend / totalVolume;

    return { chartData, map, totalEnergySpend, energyDensity };
  }, [overheads, skus]);

  const handleAdd = () => {
    if (newOh.name && newOh.amount !== undefined) {
      setOverheads([
        ...overheads,
        {
          id: Date.now().toString(),
          name: newOh.name,
          amount: newOh.amount,
          type: (newOh.type as any) || 'Fixed',
          period: (newOh.period as any) || 'Monthly',
          department: (newOh.department as DepartmentName) || 'Administration',
          activityId: newOh.activityId || undefined,
          skuId: newOh.skuId || undefined,
          variablePercentage: newOh.type === 'Semi-Variable' ? (newOh.variablePercentage ?? 0.5) : undefined,
          energyCategory: (newOh.energyCategory as EnergyCategory) || 'Other',
          allocationMethod: newOh.allocationMethod as AllocationMethod || 'Production Volume',
          allocationValue: newOh.allocationValue ?? 100,
          skuWeights: newOh.skuWeights || {}
        },
      ]);
      setNewOh({ 
        name: '', amount: 0, type: 'Fixed', period: 'Monthly', department: 'Administration', 
        activityId: '', skuId: '', variablePercentage: 0.5, energyCategory: 'Electricity', 
        allocationMethod: 'Production Volume', allocationValue: 100, skuWeights: {}
      });
    }
  };

  const calculateMonthly = (oh: Overhead | Partial<Overhead>) => {
    if (!oh.amount) return 0;
    let multiplier = 1;
    if (oh.period === 'Weekly') multiplier = 4.33;
    if (oh.period === 'Daily') multiplier = PRODUCTION_DAYS_PER_MONTH;
    return oh.amount * multiplier;
  };

  const totalMonthlyOverhead = overheads.reduce((acc, oh) => acc + calculateMonthly(oh), 0);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 font-serif tracking-tight">Utilities & Overheads</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Multi-Source Energy Planning Hub</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
           <button onClick={() => setActiveSubTab('Registry')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeSubTab === 'Registry' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Bill Registry</button>
           <button onClick={() => setActiveSubTab('EnergyPortfolio')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeSubTab === 'EnergyPortfolio' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}>Energy Mix Audit ⚡</button>
        </div>
      </header>

      {activeSubTab === 'EnergyPortfolio' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
                 <h3 className="text-xl font-bold font-serif text-slate-900 mb-8">Fuel Source Distribution</h3>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={energyAuditData.chartData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                             {energyAuditData.chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip 
                            contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                            formatter={(v: any) => [`UGX ${v.toLocaleString()}`, 'Monthly Spend']}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-2 gap-4 w-full mt-10">
                    <div className="bg-slate-50 p-6 rounded-3xl text-center">
                       <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Portfolio Spend</div>
                       <div className="text-lg font-mono font-black text-slate-900">UGX {Math.round(energyAuditData.totalEnergySpend).toLocaleString()}</div>
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-3xl text-center">
                       <div className="text-[9px] font-black text-indigo-400 uppercase mb-1">Energy Intensity</div>
                       <div className="text-lg font-mono font-black text-indigo-900">UGX {Math.round(energyAuditData.energyDensity).toLocaleString()} / pc</div>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                 <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
                    <h3 className="text-2xl font-bold font-serif text-amber-400 mb-10 relative z-10">Source-Wise Monthly Burden</h3>
                    <div className="space-y-4 relative z-10">
                       {energyAuditData.chartData.sort((a,b) => b.value - a.value).map((item, idx) => (
                         <div key={item.name} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-2 h-8 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                               <span className="font-black text-xs uppercase tracking-widest">{item.name}</span>
                            </div>
                            <div className="text-right">
                               <div className="text-sm font-mono font-black">UGX {item.value.toLocaleString()}</div>
                               <div className="text-[8px] text-slate-500 uppercase font-bold">{((item.value / energyAuditData.totalEnergySpend) * 100).toFixed(1)}% of Mix</div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 flex items-center gap-6">
                    <div className="text-4xl">🌲</div>
                    <p className="text-xs text-indigo-900 leading-relaxed italic">
                      "By breaking down energy spend into discrete categories like **Firewood** vs **Electricity**, we can pinpoint which products are vulnerable to specific utility price spikes. Strategic planning for multiple sources allows for a balanced production load that maximizes biomass heat for heavy baking (Bread) and clean electricity for precision tasks (Cakes)."
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'Registry' && (
        <>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16"></div>
            <h3 className="text-sm font-semibold text-slate-800 mb-6 flex items-center gap-3 relative z-10">
              <span className="bg-slate-100 p-2 rounded-xl">🔌</span> Bill Enrollment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end relative z-10">
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Expense Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-medium focus:ring-1 focus:ring-slate-200 outline-none transition-all" placeholder="e.g. Bulk Firewood Purchase" value={newOh.name} onChange={e => setNewOh({ ...newOh, name: e.target.value })} />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold text-indigo-600 mb-2 uppercase tracking-widest">Energy Category</label>
                <select className="w-full px-4 py-3 rounded-xl border border-indigo-50 bg-indigo-50/20 text-[10px] font-black uppercase outline-none" value={newOh.energyCategory} onChange={e => setNewOh({ ...newOh, energyCategory: e.target.value as EnergyCategory })}>
                  {ENERGY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Amount (UGX)</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-mono font-bold" value={newOh.amount || ''} onChange={e => setNewOh({ ...newOh, amount: parseFloat(e.target.value) })} />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Period</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-black uppercase outline-none" value={newOh.period} onChange={e => setNewOh({ ...newOh, period: e.target.value as any })}>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div className="lg:col-span-2">
                <button onClick={handleAdd} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold text-xs shadow-lg transition-all active:scale-95">Enroll Bill</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {overheads.map(oh => (
              <div key={oh.id} className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start mb-6">
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase tracking-widest rounded-lg">
                     {oh.energyCategory || 'General'}
                   </span>
                   <button onClick={() => setOverheads(overheads.filter(x => x.id !== oh.id))} className="text-slate-200 hover:text-rose-500">✕</button>
                </div>
                <h4 className="text-lg font-bold font-serif text-slate-900 mb-1 uppercase">{oh.name}</h4>
                <div className="text-2xl font-mono font-black text-slate-900">UGX {calculateMonthly(oh).toLocaleString()}</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Monthly Burden Equivalent</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OverheadManager;
