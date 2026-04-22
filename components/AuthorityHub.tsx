
import React, { useState } from 'react';
import { User, DepartmentName } from '../types';
import { DEPARTMENTS } from '../constants';

interface AuthorityHubProps {
  users: User[];
  currency: { format: (v: number) => string };
}

const AuthorityHub: React.FC<AuthorityHubProps> = ({ users, currency }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '', identity: '', department: 'Finance', role: 'Staff', authorityLimit: 0
  });

  const handleEnrollUser = () => {
    if (!newUser.name || !newUser.identity) return;
    alert("In a real system, an invitation email would be sent to " + newUser.identity);
    setShowAddForm(false);
  };

  const getDeptColor = (dept: DepartmentName) => {
    switch (dept) {
      case 'Finance': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Production': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Stores': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Administration': return 'bg-slate-900 text-white border-slate-800';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter text-amber-400">Account Governance Hub</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Sub-Account Provisioning • DoA Limits • Hierarchy Management</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="relative z-10 bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-amber-400 transition-all">+ Provision Sub-Account</button>
      </header>

      {showAddForm && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-fadeIn space-y-8">
           <h3 className="text-xl font-bold font-serif text-indigo-900 uppercase">Provision New Ledger User</h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Full Name</label>
                 <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. Finance Officer" />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Login Identity (Email)</label>
                 <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newUser.identity} onChange={e => setNewUser({...newUser, identity: e.target.value})} placeholder="user@nissi-industries.com" />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Department Hub</label>
                 <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value as DepartmentName})}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Authority Limit (UGX)</label>
                 <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black" value={newUser.authorityLimit || ''} onChange={e => setNewUser({...newUser, authorityLimit: parseFloat(e.target.value) || 0})} />
              </div>
           </div>
           <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
              <button onClick={() => setShowAddForm(false)} className="px-10 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Discard</button>
              <button onClick={handleEnrollUser} className="px-16 py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-black transition-all">Send Activation Link</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.sort((a, b) => b.authorityLimit - a.authorityLimit).map(user => (
          <div key={user.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-xl">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${user.role === 'Managing Director' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                {user.role === 'Managing Director' ? '👑' : user.role === 'Admin' ? '🏦' : '💼'}
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getDeptColor(user.department)}`}>
                {user.department}
              </span>
            </div>

            <h4 className="text-xl font-bold font-serif text-slate-900 mb-1 truncate uppercase">{user.name}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{user.role}</p>
            
            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 mb-4">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Signatory Limit</div>
              <div className="text-xl font-mono font-black text-indigo-900">
                {user.authorityLimit > 100000000 ? 'UNLIMITED' : currency.format(user.authorityLimit)}
              </div>
            </div>

            <div className="flex gap-2">
               <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter hover:bg-indigo-600 transition-all">Audit Permissions</button>
               <button className="px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase hover:bg-slate-50 transition-all">Revoke</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 p-12 rounded-[4rem] text-indigo-900 flex flex-col md:flex-row items-center gap-12 shadow-inner relative overflow-hidden border border-indigo-100">
         <div className="text-6xl grayscale opacity-30">🛡️</div>
         <div>
            <h4 className="text-2xl font-bold font-serif text-indigo-900 mb-3 uppercase">Team Hierarchy Control</h4>
            <p className="text-sm text-indigo-700 leading-relaxed max-w-2xl italic">
              "Create a team structure that mirrors your actual factory flow. Assign Finance sub-accounts to handle reconciliation and payables, while Stores sub-accounts manage material intake. Each account's **Authority Limit** acts as a hard digital lock on high-value transactions."
            </p>
         </div>
      </div>
    </div>
  );
};

export default AuthorityHub;
