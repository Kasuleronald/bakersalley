
import React, { useState, useMemo } from 'react';
import { Employee, StaffCategory, SafetyIncident, TaskAllocation, SKU } from '../types';
import ModuleAiInteraction from './ModuleAiInteraction';
import { GoogleGenAI } from "@google/genai";

interface PeopleCultureManagerProps {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  skus: SKU[];
  currency: { format: (v: number) => string };
}

const BAKERY_TASKS = [
  'Oven Firing & Prep',
  'Mixer Deep Cleaning',
  'Inventory Bin Audit',
  'Weighbridge Oversight',
  'Dispatch Manifest Review',
  'Welfare/Meal Coordination',
  'Floor Sanitation Lead'
];

const PeopleCultureManager: React.FC<PeopleCultureManagerProps> = ({ employees, setEmployees, skus, currency }) => {
  const [activeTab, setActiveTab] = useState<'Intelligence' | 'Roster' | 'Allocations' | 'Safety'>('Intelligence');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);

  // Allocation Form State
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [allocTargetEmpId, setAllocTargetEmpId] = useState('');
  const [newAlloc, setNewAlloc] = useState<Partial<TaskAllocation>>({
    type: 'Product', targetId: '', priority: 'Routine'
  });

  const stats = useMemo(() => {
    const total = employees.length;
    const perm = employees.filter(e => e.category === 'Permanent').length;
    const agency = employees.filter(e => e.category === 'Outsourced/Agency').length;
    const dayLabor = employees.filter(e => e.category === 'Day Labor').length;
    const ltis = incidents.filter(i => i.type === 'LTI (Lost Time)').length;
    const medicalCompliance = employees.filter(e => e.medicalCertExpiry && new Date(e.medicalCertExpiry) > new Date()).length;
    
    return { total, perm, agency, dayLabor, ltis, medicalCompliancePercent: total > 0 ? (medicalCompliance / total) * 100 : 100 };
  }, [employees, incidents]);

  const handleRunPcAudit = async (intent: string) => {
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as a People and Culture Strategy Director for an industrial bakery.
        WORKFORCE DATA: ${JSON.stringify(employees.map(e => ({ name: e.name, role: e.role, assignments: e.assignments })))}
        TASK:
        1. Evaluate current workforce allocations.
        2. Identify if any critical tasks (Oven/Mixing) are underserved.
        3. Recommend a balanced shift roster strategy.
      `;
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
      setAiAnalysis(response.text || "Analysis failed.");
    } catch (e) {
      setAiAnalysis("Neural bridge failure.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAddAllocation = () => {
    if (!allocTargetEmpId || !newAlloc.targetId) return;

    const label = newAlloc.type === 'Product' 
      ? skus.find(s => s.id === newAlloc.targetId)?.name || 'Unknown SKU'
      : newAlloc.targetId!;

    const allocation: TaskAllocation = {
      id: `alloc-${Date.now()}`,
      type: newAlloc.type as 'Product' | 'Task',
      targetId: newAlloc.targetId!,
      label,
      status: 'Assigned',
      assignedAt: new Date().toISOString(),
      priority: newAlloc.priority as 'Routine' | 'Urgent'
    };

    setEmployees(employees.map(e => e.id === allocTargetEmpId 
      ? { ...e, assignments: [allocation, ...(e.assignments || [])] } 
      : e
    ));
    setShowAllocationForm(false);
    setNewAlloc({ type: 'Product', targetId: '', priority: 'Routine' });
  };

  const updateAllocationStatus = (empId: string, allocId: string, status: TaskAllocation['status']) => {
    setEmployees(employees.map(e => e.id === empId ? {
      ...e,
      assignments: (e.assignments || []).map(a => a.id === allocId ? { ...a, status } : a)
    } : e));
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 font-serif uppercase tracking-tight">People & Culture Hub</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Personnel Ledger • Task & Product Allocation</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto">
          {['Intelligence', 'Roster', 'Allocations', 'Safety'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
          ))}
        </div>
      </header>

      {activeTab === 'Intelligence' && (
        <div className="space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl text-center">
                 <div className="text-[10px] font-black text-indigo-400 uppercase mb-2">Workforce Capacity</div>
                 <div className="text-5xl font-mono font-black text-white">{stats.total}</div>
                 <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Active Floor Roster</p>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                 <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Active Allocations</div>
                 <div className="text-4xl font-mono font-black text-indigo-900">
                    {employees.reduce((s, e) => s + (e.assignments?.filter(a => a.status !== 'Completed').length || 0), 0)}
                 </div>
                 <p className="text-[8px] text-slate-300 font-black uppercase mt-2">Pending Responsibilities</p>
              </div>
              <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 shadow-sm text-center">
                 <div className="text-[10px] font-black text-emerald-600 uppercase mb-2">Utilization Score</div>
                 <div className="text-4xl font-mono font-black text-emerald-700">92.4%</div>
              </div>
              <div className="bg-rose-50 p-10 rounded-[3rem] border border-rose-100 shadow-sm text-center">
                 <div className="text-[10px] font-black text-rose-600 uppercase mb-2">Safety Buffer</div>
                 <div className="text-4xl font-mono font-black text-rose-700">100%</div>
              </div>
           </div>

           <ModuleAiInteraction 
             title="Workforce Distribution Audit"
             theme="indigo"
             isLoading={isAiProcessing}
             onExecute={handleRunPcAudit}
             suggestions={["Audit night-shift baking coverage", "Recommend training for Sourdough production"]}
             response={aiAnalysis}
           />
        </div>
      )}

      {activeTab === 'Allocations' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Responsibility Matrix</h3>
                <p className="text-sm text-slate-400 italic">"Assigning ownership for specific product lines or floor tasks."</p>
              </div>
              <button 
                onClick={() => setShowAllocationForm(true)}
                className="bg-indigo-900 text-white px-10 py-4 rounded-[2rem] font-black text-xs uppercase shadow-xl hover:bg-black transition-all"
              >
                + Create New Allocation
              </button>
           </div>

           {showAllocationForm && (
             <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">1. Select Staff</label>
                      <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={allocTargetEmpId} onChange={e => setAllocTargetEmpId(e.target.value)}>
                        <option value="">Choose Employee...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">2. Allocation Type</label>
                      <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={newAlloc.type} onChange={e => setNewAlloc({...newAlloc, type: e.target.value as any, targetId: ''})}>
                         <option value="Product">Product Focus (SKU)</option>
                         <option value="Task">Bakery Operation (Task)</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">3. Focus Target</label>
                      <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={newAlloc.targetId} onChange={e => setNewAlloc({...newAlloc, targetId: e.target.value})}>
                         <option value="">Select Item...</option>
                         {newAlloc.type === 'Product' 
                          ? skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                          : BAKERY_TASKS.map(t => <option key={t} value={t}>{t}</option>)
                         }
                      </select>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={handleAddAllocation} className="flex-1 py-4 bg-indigo-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Inject Focus</button>
                      <button onClick={() => setShowAllocationForm(false)} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase">✕</button>
                   </div>
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.filter(e => e.isActive && (e.assignments?.length || 0) > 0).map(emp => (
                <div key={emp.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl font-black">{emp.name.charAt(0)}</div>
                         <div>
                            <h4 className="font-bold text-slate-900 uppercase text-xs">{emp.name}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{emp.role}</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      {(emp.assignments || []).map(alloc => (
                        <div key={alloc.id} className={`p-5 rounded-3xl border transition-all flex flex-col gap-3 ${alloc.status === 'Completed' ? 'bg-emerald-50/50 border-emerald-100 grayscale opacity-60' : 'bg-slate-50 border-slate-100 group hover:border-indigo-200'}`}>
                           <div className="flex justify-between items-start">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border tracking-tighter ${alloc.type === 'Product' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                 {alloc.type === 'Product' ? '🥖 Product' : '⚙️ Task'}
                              </span>
                              <div className="flex gap-1">
                                 {['Assigned', 'In Progress', 'Completed'].map(s => (
                                   <button 
                                    key={s} 
                                    onClick={() => updateAllocationStatus(emp.id, alloc.id, s as any)}
                                    className={`w-4 h-4 rounded-full border transition-all ${alloc.status === s ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-sm' : 'bg-white border-slate-200'}`}
                                    title={s}
                                   />
                                 ))}
                              </div>
                           </div>
                           <div className="font-black text-xs uppercase text-slate-800 leading-tight">
                              {alloc.label}
                           </div>
                           <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>{alloc.status}</span>
                              <span>Assigned {new Date(alloc.assignedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
              {employees.every(e => (e.assignments?.length || 0) === 0) && (
                <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                   <div className="text-7xl opacity-10 mb-6 grayscale">📋</div>
                   <h4 className="text-xl font-bold font-serif text-slate-300 uppercase tracking-widest">No Active Allocations</h4>
                   <p className="text-sm text-slate-400 mt-2 italic max-w-sm mx-auto">Use the Enrollment Pad to assign products or operations to shift staff.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'Roster' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/50">
                    <th className="px-10 py-6">Staff Member</th>
                    <th className="px-6 py-6 text-center">Focus Area</th>
                    <th className="px-6 py-6 text-center">Shift Path</th>
                    <th className="px-10 py-6 text-right">Compensation Basis</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {employees.map(emp => (
                   <tr key={emp.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-10 py-6">
                         <div className="font-black text-slate-900 text-sm uppercase">{emp.name}</div>
                         <div className="text-[9px] text-slate-400 font-bold uppercase">{emp.role} • {emp.department}</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-mono font-black text-indigo-600">{emp.assignments?.filter(a => a.status !== 'Completed').length || 0}</span>
                            <span className="text-[7px] text-slate-300 font-black uppercase">Open Tasks</span>
                         </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">{emp.shift}</span>
                      </td>
                      <td className="px-10 py-6 text-right font-mono font-black text-slate-900">
                         {currency.format(emp.salary)}
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default PeopleCultureManager;
