
import React, { useState, useMemo } from 'react';
import { Activity, DepartmentName, SKU, Employee, Overhead, EnergyCategory } from '../types';
import { DEPARTMENTS } from '../constants';

interface ActivityManagerProps {
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  skus: SKU[];
  employees: Employee[];
  overheads: Overhead[];
}

const DRIVER_GROUPS = {
  'Labor & Time': ['Labor Hours', 'Labor Minutes', 'Man-Hours', 'Staff-Shift'],
  'Machine & Energy': ['Machine Hours', 'Oven Hours', 'Mixer Hours', 'Fryer Hours', 'Kilowatt Hours (kWh)'],
  'Volume & Throughput': ['Units Produced', 'Batches', 'Kilograms Processed', 'Sacks Flour', 'Trays Baked', 'Units Packaged'],
  'Logistics & Sales': ['Delivery Drops', 'Orders Picked', 'Customer Visits']
};

// Firewood and Charcoal promoted to the top of selection lists
const ENERGY_OPTIONS: EnergyCategory[] = ['Firewood', 'Charcoal', 'Electricity', 'Gas', 'Solar', 'Diesel (Gen)', 'Water', 'Other'];

const PRODUCTION_DAYS_PER_MONTH = 26;

const ActivityManager: React.FC<ActivityManagerProps> = ({ activities, setActivities, skus, employees, overheads }) => {
  const [newAct, setNewAct] = useState<Partial<Activity>>({ 
    name: '', 
    driver: 'Labor Hours',
    department: 'Production',
    energyCategory: 'Firewood',
    backupEnergyCategory: 'Charcoal',
    nightShiftWeight: 0.5,
    otherVariableCost: 0
  });

  const [showCustomDriver, setShowCustomDriver] = useState(false);
  const [customDriverName, setCustomDriverName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Activity> | null>(null);

  // 1. Calculate Departmental Hourly Labor Rates
  const departmentLaborRates = useMemo(() => {
    const map: Record<string, number> = {};
    DEPARTMENTS.forEach(dept => {
      const deptEmployees = employees.filter(e => e.isActive && e.department === dept);
      const totalMonthlyCost = deptEmployees.reduce((sum, e) => {
        // Fix: Use employmentType property
        const cost = e.employmentType === 'Permanent' ? e.salary : (e.dailyRate || 0) * PRODUCTION_DAYS_PER_MONTH;
        return sum + cost;
      }, 0);
      const totalMonthlyHours = deptEmployees.reduce((sum, e) => sum + (e.weeklyHoursDedicated * 4.33), 0);
      map[dept] = totalMonthlyHours > 0 ? totalMonthlyCost / totalMonthlyHours : 0;
    });
    return map;
  }, [employees]);

  // 2. Master Activity Derived Data
  const derivedData = useMemo(() => {
    return activities.map(act => {
      const deptLaborRate = departmentLaborRates[act.department] || 0;
      const laborComponent = deptLaborRate * (act.driver.includes('Hours') ? 1 : (1/60)); 
      
      const isManual = (act.rate || 0) > 0;
      // Fix: Use otherVariableCost property
      const effectiveRate = isManual ? act.rate : laborComponent + (act.otherVariableCost || 0);

      return {
        ...act,
        effectiveRate,
        laborPart: laborComponent
      };
    });
  }, [activities, departmentLaborRates]);

  const handleAdd = () => {
    const finalDriver = showCustomDriver ? customDriverName : newAct.driver;
    if (newAct.name && newAct.department && finalDriver) {
      setActivities([
        ...activities,
        { 
          id: `act-${Date.now()}`, 
          name: newAct.name, 
          rate: 0, 
          driver: finalDriver!,
          department: newAct.department as DepartmentName,
          energyCategory: newAct.energyCategory as EnergyCategory,
          // Fix: Ensure property mapping matches the new Activity interface
          backupEnergyCategory: newAct.backupEnergyCategory as EnergyCategory,
          nightShiftWeight: newAct.nightShiftWeight ?? 0.5,
          requiredSkills: [],
          otherVariableCost: newAct.otherVariableCost || 0
        },
      ]);
      setNewAct({ name: '', driver: 'Labor Hours', department: 'Production', energyCategory: 'Firewood', backupEnergyCategory: 'Charcoal', nightShiftWeight: 0.5, otherVariableCost: 0 });
      setCustomDriverName('');
      setShowCustomDriver(false);
    }
  };

  const handleStartEdit = (act: Activity) => {
    setEditingId(act.id);
    setEditForm({ ...act });
  };

  const handleSaveEdit = () => {
    if (editForm && editingId) {
      setActivities(activities.map(a => a.id === editingId ? { ...a, ...editForm } : a));
      setEditingId(null);
      setEditForm(null);
    }
  };

  const getEnergyIcon = (cat?: EnergyCategory) => {
    switch (cat) {
      case 'Electricity': return '⚡';
      case 'Firewood': return '🪵';
      case 'Gas': return '🔥';
      case 'Solar': return '☀️';
      case 'Diesel (Gen)': return '⛽';
      case 'Charcoal': return '🌑';
      case 'Water': return '💧';
      default: return '🔋';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif tracking-tight">Operation Activity Lab</h2>
          <p className="text-gray-500 font-medium text-sm">Configuring biomass energy as the permanent primary source for bakery floor activities.</p>
        </div>
      </header>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-amber-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full translate-x-16 -translate-y-16"></div>
        <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-2 relative z-10">
           <span className="p-2 bg-amber-100 rounded-xl">⚙️</span> Configure Permanent Energy Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start relative z-10">
          <div className="lg:col-span-3">
            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Activity Identity</label>
            <input 
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold transition-all" 
              value={newAct.name} 
              onChange={(e) => setNewAct({ ...newAct, name: e.target.value })} 
              placeholder="e.g. Bread Oven Firing"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[10px] font-bold text-indigo-600 mb-2 uppercase tracking-widest">Permanent Primary Source</label>
            <select className="w-full px-5 py-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 outline-none text-sm font-bold text-indigo-900 transition-all" value={newAct.energyCategory} onChange={e => setNewAct({ ...newAct, energyCategory: e.target.value as EnergyCategory })}>
              {ENERGY_OPTIONS.map(e => <option key={e} value={e}>{getEnergyIcon(e)} {e}</option>)}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Permanent Alternative</label>
            <select className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none text-sm font-bold text-slate-600 transition-all" value={newAct.backupEnergyCategory || ''} onChange={e => setNewAct({ ...newAct, backupEnergyCategory: e.target.value as EnergyCategory })}>
              {ENERGY_OPTIONS.map(e => <option key={e} value={e}>{getEnergyIcon(e)} {e}</option>)}
            </select>
          </div>

          <div className="lg:col-span-3 flex items-end h-full">
            <button onClick={handleAdd} className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95">
              Enroll Biomass Activity
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {derivedData.map((act) => {
          const isEditing = editingId === act.id;
          return (
            <div key={act.id} className={`bg-white rounded-[3.5rem] shadow-sm border transition-all hover:shadow-xl overflow-hidden relative flex flex-col ${isEditing ? 'border-amber-400 ring-4 ring-amber-50' : 'border-gray-100 hover:border-amber-200'}`}>
              <div className="p-10 flex-1">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex flex-col gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-inner bg-indigo-50 text-indigo-700`}>
                        {getEnergyIcon(act.energyCategory as EnergyCategory)} Primary: {act.energyCategory}
                      </span>
                      {act.backupEnergyCategory && (
                        <span className={`px-4 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50 text-slate-400`}>
                           Alternative: {act.backupEnergyCategory}
                        </span>
                      )}
                   </div>
                   {!isEditing && (
                     <div className="flex gap-2">
                        <button onClick={() => handleStartEdit(act)} className="text-gray-300 hover:text-amber-600">✎</button>
                        <button onClick={() => setActivities(activities.filter(a => a.id !== act.id))} className="text-gray-200 hover:text-red-500">✕</button>
                     </div>
                   )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold" value={editForm?.name || ''} onChange={e => setEditForm({...editForm!, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                       <select className="p-2 rounded-xl text-[9px] font-bold bg-gray-50" value={editForm?.energyCategory} onChange={e => setEditForm({...editForm!, energyCategory: e.target.value as EnergyCategory})}>
                          {ENERGY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                       </select>
                       <select className="p-2 rounded-xl text-[9px] font-bold bg-gray-50" value={editForm?.backupEnergyCategory || ''} onChange={e => setEditForm({...editForm!, backupEnergyCategory: e.target.value as EnergyCategory})}>
                          {ENERGY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                       </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                       <button onClick={handleSaveEdit} className="flex-1 bg-amber-600 text-white py-2 rounded-xl font-bold text-[10px] uppercase">Save</button>
                       <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-100 text-gray-400 rounded-xl font-bold text-[10px] uppercase">✕</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-2xl font-bold font-serif text-gray-900 mb-2 truncate uppercase">{act.name}</h4>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Driver: {act.driver}</div>
                    
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Biomass Adjusted Cost Load</div>
                       <div className="text-xl font-mono font-black text-slate-900">UGX {Math.round(act.effectiveRate).toLocaleString()} / unit</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityManager;
