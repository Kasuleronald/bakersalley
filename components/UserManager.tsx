
import React, { useState } from 'react';
import { User, DepartmentName } from '../types';
import { DEPARTMENTS } from '../constants';

interface UserManagerProps {
  users: User[];
  setUsers: (users: User[]) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, setUsers }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    identity: '',
    department: 'Administration',
    role: 'Staff'
  });

  const handleAddUser = (sendInvite: boolean) => {
    if (!newUser.name || !newUser.identity) {
      alert("Name and Identity (Email/Phone) are required.");
      return;
    }

    const token = sendInvite ? `setup_${Math.random().toString(36).substr(2, 9)}` : undefined;

    // Fix: Added missing required hasConsentedToPrivacy property to User object
    const user: User = {
      id: `u-${Date.now()}`,
      name: newUser.name!,
      identity: newUser.identity!,
      passwordHash: '',
      department: newUser.department as DepartmentName,
      role: newUser.role as string,
      mfaEnabled: false,
      inviteToken: token,
      authorityLimit: 0,
      hasConsentedToPrivacy: false
    };

    setUsers([...users, user]);
    
    if (sendInvite) {
      setInvitationEmail(newUser.identity!);
    } else {
      setNewUser({ name: '', identity: '', department: 'Administration', role: 'Staff' });
      setShowAddForm(false);
    }
  };

  const removeUser = (id: string) => {
    if (window.confirm("Purge this user account? Access will be immediately revoked.")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const updateRole = (id: string, role: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-serif">Account Governance</h2>
          <p className="text-slate-500 font-medium">Provision access levels and manage departmental security clearances.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-black transition-all active:scale-95"
        >
          + Provision New Account
        </button>
      </header>

      {invitationEmail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white max-w-lg w-full rounded-[3rem] p-12 shadow-2xl animate-softFade relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
             <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto">📧</div>
                <h3 className="text-2xl font-bold text-slate-900 font-serif">Invitation Sent</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  A secure setup link has been generated for <span className="font-bold text-indigo-900">{invitationEmail}</span>. 
                  In a production environment, this would be sent via SMTP.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-[10px] text-slate-400 break-all">
                  https://bakersalley.io/setup?token={users.find(u => u.identity === invitationEmail)?.inviteToken}
                </div>
                <button 
                  onClick={() => { setInvitationEmail(null); setShowAddForm(false); setNewUser({ name: '', identity: '', department: 'Administration', role: 'Staff' }); }}
                  className="w-full py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl"
                >
                  Close Confirmation
                </button>
             </div>
          </div>
        </div>
      )}

      {showAddForm && !invitationEmail && (
        <div className="bg-white p-10 rounded-[3rem] border border-indigo-100 shadow-2xl animate-fadeIn space-y-8">
          <h3 className="text-xl font-bold text-slate-900 font-serif">Account Provisioning</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Full Name</label>
              <input 
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                placeholder="User Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Identity (Email)</label>
              <input 
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={newUser.identity}
                onChange={e => setNewUser({...newUser, identity: e.target.value})}
                placeholder="email@bakery.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Department</label>
              <select 
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-sm"
                value={newUser.department}
                onChange={e => setNewUser({...newUser, department: e.target.value as DepartmentName})}
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Initial Role</label>
              <select 
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-sm"
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t border-slate-50">
              <button onClick={() => setShowAddForm(false)} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold uppercase text-[10px]">Discard</button>
              <button onClick={() => handleAddUser(true)} className="px-12 py-4 bg-indigo-100 text-indigo-700 rounded-2xl font-bold shadow-sm uppercase text-[10px] hover:bg-indigo-200">Send Setup Link</button>
              <button onClick={() => handleAddUser(false)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl uppercase text-[10px]">Create Instantly</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="px-8 py-6">User Identity</th>
              <th className="px-6 py-6">Department</th>
              <th className="px-6 py-6 text-center">Clearance Level</th>
              <th className="px-8 py-6 text-right">Account Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-indigo-50/5 transition-all group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-slate-900 text-sm uppercase">{u.name}</div>
                    {u.inviteToken && <span className="bg-amber-100 text-amber-700 text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Pending Invite</span>}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-mono">{u.identity}</div>
                </td>
                <td className="px-6 py-5">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-lg uppercase">
                    {u.department}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <select 
                    className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border-none focus:ring-1 focus:ring-indigo-500 ${
                      u.role === 'Admin' ? 'bg-red-50 text-red-600' :
                      u.role === 'Manager' ? 'bg-amber-50 text-amber-700' :
                      'bg-green-50 text-green-700'
                    }`}
                    value={u.role}
                    onChange={e => updateRole(u.id, e.target.value)}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => removeUser(u.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-300 hover:text-red-500"
                  >
                    Purge Account
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic">No secondary accounts created yet. Use the Provision button to begin.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row gap-10 items-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="text-6xl opacity-50">🔐</div>
        <div>
          <h4 className="text-2xl font-bold font-serif text-amber-400 mb-3">Security & Segregation of Duties</h4>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Adding multiple accounts allows you to implement SoD (Segregation of Duties). 
            Staff members can record daily operations without seeing sensitive financial data, 
            while Managers can approve requisitions and oversee the shift plan. 
            Admins retain master control over recipes and pricing architectures.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
