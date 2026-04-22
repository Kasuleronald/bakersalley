
import React, { useState, useMemo } from 'react';
import { Employee, LeaveApplication, AuthSession, SKU, DepartmentName, Goal, GoalStatus, GoalPriority, Transaction, AccountType, DigitalSignature } from '../types';
import { getPayrollFilingSummary, calculatePAYE, calculateNSSF, calculateNetPay } from '../utils/payrollUtils';
import { DEPARTMENTS } from '../constants';

interface HumanCapitalManagerProps {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  skus: SKU[];
  leaveApplications: LeaveApplication[];
  setLeaveApplications: (leaves: LeaveApplication[]) => void;
  session: AuthSession;
  transactions?: Transaction[];
  setTransactions?: (txs: Transaction[]) => void;
  currency: { active: any; format: (v: number) => string };
  initialTab?: 'Staff' | 'Payroll' | 'Muster';
}

const HumanCapitalManager: React.FC<HumanCapitalManagerProps> = ({
  employees, setEmployees, session, currency, skus, initialTab = 'Staff',
  leaveApplications, setLeaveApplications
}) => {
  const [activeTab, setActiveTab] = useState<'Staff' | 'Payroll' | 'Muster'>(initialTab);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({
    name: '', role: '', department: 'Production', salary: 0, employmentType: 'Permanent', shift: 'Day', isActive: true
  });

  const payrollSummary = useMemo(() => getPayrollFilingSummary(employees), [employees]);

  const handleEnrollStaff = () => {
    if (!newEmp.name || !newEmp.role || !newEmp.salary) {
      alert("Please provide Name, Role, and Base Salary.");
      return;
    }

    if (editingEmployeeId) {
      setEmployees(employees.map(e => e.id === editingEmployeeId ? { ...e, ...newEmp } as Employee : e));
      alert("Personnel record updated.");
    } else {
      const employee: Employee = {
        id: `emp-${Date.now()}`,
        name: newEmp.name!,
        role: newEmp.role!,
        department: newEmp.department || 'Production',
        salary: newEmp.salary!,
        employmentType: newEmp.employmentType as 'Permanent' | 'Temporary' | 'Contractor',
        shift: newEmp.shift || 'Day',
        isActive: true,
        joinedDate: new Date().toISOString().split('T')[0],
        weeklyHoursDedicated: 48,
        normalWeeklyHours: 48,
        goals: [],
        appraisalHistory: [],
        competencies: [],
        assignments: [],
        category: (newEmp.employmentType === 'Permanent' ? 'Permanent' : 'Contractor') as any
      };
      setEmployees([...employees, employee]);
      alert("New Personnel successfully enrolled.");
    }

    setShowAddForm(false);
    setEditingEmployeeId(null);
    setNewEmp({ name: '', role: '', department: 'Production', salary: 0, employmentType: 'Permanent', shift: 'Day', isActive: true });
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setNewEmp({ ...emp });
    setShowAddForm(true);
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 font-serif tracking-tight uppercase">Human Capital Engine</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Workforce Ledger • Payroll Compliance</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          {['Staff', 'Muster', 'Payroll'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
          ))}
        </div>
      </header>

      {activeTab === 'Payroll' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
               <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Gross Monthly Liability</div>
               <div className="text-3xl font-mono font-black">{currency.format(payrollSummary.totalGross)}</div>
               <p className="text-[8px] text-slate-500 font-bold uppercase italic mt-2">Before Statutory Deductions</p>
            </div>
            <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 shadow-sm">
               <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Tax Burden (PAYE + NSSF)</div>
               <div className="text-3xl font-mono font-black text-rose-700">{currency.format(payrollSummary.totalStatutoryLiability)}</div>
               <p className="text-[8px] text-rose-400 font-bold uppercase mt-2">DUE TO URA / NSSF</p>
            </div>
            <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
               <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Net Realizable Payout</div>
               <div className="text-3xl font-mono font-black text-emerald-700">{currency.format(payrollSummary.totalGross - payrollSummary.totalPAYE - payrollSummary.totalEmployeeNSSF)}</div>
               <p className="text-[8px] text-emerald-500 font-bold uppercase mt-2">Verified Liquid Cash Need</p>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-10 py-6 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 font-serif uppercase tracking-tight">Industrial Muster Roll</h3>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-1 rounded-full border border-indigo-100">Statutory Audit v3.1</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <th className="px-10 py-6">Staff Member</th>
                      <th className="px-6 py-6 text-right">Gross (UGX)</th>
                      <th className="px-6 py-6 text-right text-rose-500">PAYE Tax</th>
                      <th className="px-6 py-6 text-right text-indigo-500">NSSF (5%)</th>
                      <th className="px-10 py-6 text-right text-emerald-600">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {employees.filter(e => e.isActive).map(emp => {
                      const nssf = calculateNSSF(emp.salary);
                      const paye = calculatePAYE(emp.salary);
                      const net = calculateNetPay(emp.salary);
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-all group">
                          <td className="px-10 py-5">
                            <div className="font-bold text-slate-900 text-sm uppercase">{emp.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{emp.role}</div>
                          </td>
                          <td className="px-6 py-5 text-right font-mono font-bold text-slate-600">
                             {currency.format(emp.salary)}
                          </td>
                          <td className="px-6 py-5 text-right font-mono font-black text-rose-500">
                             -{currency.format(paye)}
                          </td>
                          <td className="px-6 py-5 text-right font-mono font-black text-indigo-500">
                             -{currency.format(nssf.employee)}
                          </td>
                          <td className="px-10 py-5 text-right font-mono font-black text-emerald-600 text-base">
                             {currency.format(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Staff' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
             <div>
                <h3 className="text-xl font-bold font-serif text-slate-900">Personnel Registry</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Active Headcount: {employees.length}</p>
             </div>
             <button onClick={() => { setShowAddForm(true); setEditingEmployeeId(null); setNewEmp({ name: '', role: '', department: 'Production', salary: 0, employmentType: 'Permanent', shift: 'Day', isActive: true }); }} className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">+ Enroll New Staff</button>
          </div>

          {showAddForm && (
            <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-8">
               <h4 className="text-lg font-bold font-serif text-indigo-900 uppercase">{editingEmployeeId ? 'Update Personnel Record' : 'Personnel Enrollment Form'}</h4>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Full Name</label>
                    <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={newEmp.name || ''} onChange={e => setNewEmp({...newEmp, name: e.target.value})} placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Role / Title</label>
                    <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={newEmp.role || ''} onChange={e => setNewEmp({...newEmp, role: e.target.value})} placeholder="e.g. Senior Baker" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Department</label>
                    <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value as DepartmentName})}>
                       {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Base Monthly Pay (UGX)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black" value={newEmp.salary || ''} onChange={e => setNewEmp({...newEmp, salary: parseFloat(e.target.value) || 0})} />
                  </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button onClick={() => { setShowAddForm(false); setEditingEmployeeId(null); }} className="px-10 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Discard</button>
                  <button onClick={handleEnrollStaff} className="px-16 py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-black transition-all">
                    {editingEmployeeId ? 'Commit Update' : 'Add to Ledger'}
                  </button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map(emp => (
              <div key={emp.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl font-black">{emp.name.charAt(0)}</div>
                  <span className="text-[8px] font-black uppercase px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">{emp.department}</span>
                </div>
                <h4 className="text-xl font-bold font-serif">{emp.name}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase mb-8">{emp.role}</p>
                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                   <span className="text-[10px] font-mono font-black text-slate-900">{currency.format(emp.salary)}</span>
                   <button onClick={() => handleStartEdit(emp)} className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-indigo-700 transition-colors">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HumanCapitalManager;
