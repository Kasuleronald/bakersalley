import { User } from '../types';

export const TAB_PERMISSIONS: Record<string, string[]> = {
  'admin-console': ['Platform Admin'],
  settings: ['Platform Admin', 'Admin', 'Managing Director', 'Manager'],
  'mgmt-accountant': ['Platform Admin', 'Admin', 'Managing Director', 'Manager', 'Finance'],
  debtors: ['Platform Admin', 'Admin', 'Managing Director', 'Manager', 'Finance'],
  creditors: ['Platform Admin', 'Admin', 'Managing Director', 'Manager', 'Finance'],
  banking: ['Platform Admin', 'Admin', 'Managing Director', 'Manager', 'Finance'],
  payroll: ['Platform Admin', 'Admin', 'Managing Director', 'Manager', 'Finance'],
  stores: ['Platform Admin', 'Admin', 'Managing Director', 'Manager', 'Store Keeper'],
  'sourcing-demand': ['Platform Admin', 'Admin', 'Managing Director', 'Manager', 'Store Keeper'],
  qa: ['Platform Admin', 'Admin', 'Managing Director', 'Manager'],
};

export const hasTabAccess = (user: User | null | undefined, tabId: string): boolean => {
  if (!user) return false;

  const allowed = TAB_PERMISSIONS[tabId];
  if (!allowed) return true;

  if (user.department === 'SuperAdmin') return true;
  return allowed.includes(user.role);
};
