import React, { useState } from 'react';
import { DepartmentName, Organization, SubscriptionTier, User, UserRole } from '../types';

interface AdminConsoleProps {
  users: User[];
  setUsers: (users: User[]) => void;
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;
  persistChanges: (updates: { users?: User[]; organizations?: Organization[] }) => Promise<void>;
  currentUserId: string | null;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ users, setUsers, organizations, setOrganizations, persistChanges, currentUserId }) => {
  const [activeTab, setActiveTab] = useState<'Organizations' | 'Users'>('Organizations');
  const [orgName, setOrgName] = useState('');
  const [orgTier, setOrgTier] = useState<SubscriptionTier>('Essentials');
  const [statusMessage, setStatusMessage] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserIdentity, setNewUserIdentity] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserOrgId, setNewUserOrgId] = useState('org-default');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Staff');
  const [newUserDepartment, setNewUserDepartment] = useState<DepartmentName>('Administration');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editOrgId, setEditOrgId] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Staff');

  const roleOptions: UserRole[] = ['Platform Admin', 'Managing Director', 'Admin', 'Manager', 'Plant Manager', 'Finance', 'Store Keeper', 'Staff'];
  const departmentOptions: DepartmentName[] = ['Administration', 'Production', 'Distribution & Logistics', 'Quality Assurance', 'R&D', 'Sanitation', 'Welfare', 'Sales and Marketing', 'Stores', 'Finance', 'SuperAdmin', 'Security', 'Board of Directors'];

  const addOrganization = async () => {
    if (!orgName.trim()) {
      setStatusMessage('Enter an organization name first.');
      return;
    }

    if (organizations.some(org => org.name.toLowerCase() === orgName.trim().toLowerCase())) {
      setStatusMessage('That organization already exists.');
      return;
    }

    const org: Organization = {
      id: `org-${Date.now()}`,
      name: orgName.trim(),
      status: 'Active',
      subscriptionTier: orgTier,
      createdAt: new Date().toISOString(),
    };
    const nextOrganizations = [org, ...organizations];
    setOrganizations(nextOrganizations);
    await persistChanges({ organizations: nextOrganizations });
    setOrgName('');
    setOrgTier('Essentials');
    setStatusMessage(`Organization ${org.name} added.`);
  };

  const addUser = async () => {
    if (!newUserName.trim() || !newUserIdentity.trim() || !newUserPassword.trim()) {
      setStatusMessage('Name, identity, and password are required to create a user.');
      return;
    }

    if (newUserPassword.length < 8) {
      setStatusMessage('User password must be at least 8 characters.');
      return;
    }

    if (users.some(user => user.identity.toLowerCase() === newUserIdentity.trim().toLowerCase())) {
      setStatusMessage('That user identity already exists.');
      return;
    }

    const user: User = {
      id: `u-${Date.now()}`,
      name: newUserName.trim(),
      identity: newUserIdentity.trim(),
      passwordHash: newUserPassword,
      isActive: true,
      orgId: newUserOrgId || 'org-default',
      department: newUserDepartment,
      role: newUserRole,
      mfaEnabled: false,
      authorityLimit: 0,
      hasConsentedToPrivacy: true,
      seenFeatures: [],
      systemVersion: '0.0.0',
    };

    const nextUsers = [user, ...users];
    setUsers(nextUsers);
    await persistChanges({ users: nextUsers });
    setNewUserName('');
    setNewUserIdentity('');
    setNewUserPassword('');
    setNewUserOrgId('org-default');
    setNewUserRole('Staff');
    setNewUserDepartment('Administration');
    setStatusMessage(`User ${user.name} created.`);
  };

  const startEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditOrgId(user.orgId || '');
    setEditRole((user.role as UserRole) || 'Staff');
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditOrgId('');
    setEditRole('Staff');
  };

  const saveUserEdit = async (id: string) => {
    const nextUsers = users.map(user => (
      user.id === id
        ? { ...user, orgId: editOrgId || 'org-default', role: editRole }
        : user
    ));
    setUsers(nextUsers);
    await persistChanges({ users: nextUsers });
    setStatusMessage('User access updated.');
    cancelEditUser();
  };

  const toggleOrganizationStatus = async (id: string) => {
    const target = organizations.find(org => org.id === id);
    if (!target) return;

    if (id === 'org-default' && target.status === 'Active') {
      setStatusMessage('The default organization cannot be suspended.');
      return;
    }

    const nextOrganizations = organizations.map(org => (
      org.id === id ? { ...org, status: org.status === 'Active' ? 'Suspended' : 'Active' } : org
    ));
    setOrganizations(nextOrganizations);
    await persistChanges({ organizations: nextOrganizations });
    setStatusMessage(`Organization ${target.name} is now ${target.status === 'Active' ? 'Suspended' : 'Active'}.`);
  };

  const deleteOrganization = async (id: string) => {
    const target = organizations.find(org => org.id === id);
    if (!target) return;

    if (id === 'org-default') {
      setStatusMessage('The default organization cannot be deleted.');
      return;
    }

    if (users.some(user => user.orgId === id)) {
      setStatusMessage('Reassign or remove users before deleting this organization.');
      return;
    }

    const nextOrganizations = organizations.filter(org => org.id !== id);
    setOrganizations(nextOrganizations);
    await persistChanges({ organizations: nextOrganizations });
    setStatusMessage(`Organization ${target.name} deleted.`);
  };

  const toggleUserStatus = async (id: string) => {
    const target = users.find(user => user.id === id);
    if (!target) return;

    if (id === currentUserId) {
      setStatusMessage('You cannot disable the account currently in use.');
      return;
    }

    const nextUsers = users.map(user => (
      user.id === id ? { ...user, isActive: user.isActive === false ? true : false } : user
    ));
    setUsers(nextUsers);
    await persistChanges({ users: nextUsers });
    setStatusMessage(`User ${target.name} ${target.isActive === false ? 'enabled' : 'disabled'}.`);
  };

  const deleteUser = async (id: string) => {
    const target = users.find(user => user.id === id);
    if (!target) return;

    if (id === currentUserId) {
      setStatusMessage('You cannot delete the account currently in use.');
      return;
    }

    if (target.role === 'Platform Admin') {
      setStatusMessage('Delete of the Platform Admin account is blocked in local mode.');
      return;
    }

    const nextUsers = users.filter(user => user.id !== id);
    setUsers(nextUsers);
    await persistChanges({ users: nextUsers });
    if (editingUserId === id) {
      cancelEditUser();
    }
    setStatusMessage(`User ${target.name} deleted.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-serif">Platform Admin Console</h2>
          <p className="text-slate-500 text-sm">Manage organizations, users, role ranks, and tenant assignments.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['Organizations', 'Users'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${activeTab === t ? 'bg-white text-slate-900' : 'text-slate-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {statusMessage}
        </div>
      )}

      {activeTab === 'Organizations' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Organization Name</label>
                <input
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Bakery ABC"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tier</label>
                <select
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100"
                  value={orgTier}
                  onChange={e => setOrgTier(e.target.value as SubscriptionTier)}
                >
                  {(['Essentials', 'Pro', 'Enterprise', 'Demo'] as SubscriptionTier[]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <button type="button" onClick={addOrganization} className="w-full p-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase">
                  Add Organization
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500">
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Tier</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {organizations.map(org => (
                  <tr key={org.id}>
                    <td className="px-6 py-4 font-semibold">{org.name}</td>
                    <td className="px-6 py-4">{org.subscriptionTier}</td>
                    <td className="px-6 py-4">{org.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => toggleOrganizationStatus(org.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase text-slate-700">
                          {org.status === 'Active' ? 'Disable' : 'Enable'}
                        </button>
                        <button type="button" onClick={() => deleteOrganization(org.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold uppercase text-rose-700">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Full Name</label>
                <input
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Login Identity</label>
                <input
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100"
                  value={newUserIdentity}
                  onChange={e => setNewUserIdentity(e.target.value)}
                  placeholder="jane@local.dev"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Password</label>
                <input
                  type="password"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Organization</label>
                <select
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100"
                  value={newUserOrgId}
                  onChange={e => setNewUserOrgId(e.target.value)}
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Role</label>
                <select
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100"
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                >
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Department</label>
                <select
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100"
                  value={newUserDepartment}
                  onChange={e => setNewUserDepartment(e.target.value as DepartmentName)}
                >
                  {departmentOptions.map(department => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button type="button" onClick={addUser} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase">
                Create User
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.identity}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${u.isActive === false ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {u.isActive === false ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === u.id ? (
                        <select
                          className="p-2 rounded-lg bg-slate-50 border border-slate-100"
                          value={editOrgId}
                          onChange={e => setEditOrgId(e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{organizations.find(org => org.id === u.orgId)?.name || 'Unassigned'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === u.id ? (
                        <select
                          className="p-2 rounded-lg bg-slate-50 border border-slate-100"
                          value={editRole}
                          onChange={e => setEditRole(e.target.value as UserRole)}
                        >
                          {roleOptions.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{u.role}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {editingUserId === u.id ? (
                          <>
                            <button type="button" onClick={() => saveUserEdit(u.id)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold uppercase text-white">
                              Save
                            </button>
                            <button type="button" onClick={cancelEditUser} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase text-slate-600">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => startEditUser(u)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" aria-label={`Edit ${u.name}`}>
                              ✎
                            </button>
                            <button type="button" onClick={() => toggleUserStatus(u.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase text-slate-700">
                              {u.isActive === false ? 'Enable' : 'Disable'}
                            </button>
                            <button type="button" onClick={() => deleteUser(u.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold uppercase text-rose-700">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
