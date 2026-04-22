
import React from 'react';
import { Activity, Overhead, DepartmentName } from '../types';
import { DEPARTMENTS } from '../constants';

interface DepartmentManagerProps {
  activities: Activity[];
  overheads: Overhead[];
  setActiveTab: (tab: string) => void;
}

interface DepartmentInfo {
  icon: string;
  color: string;
  responsibilities: string[];
  docs: string[];
  links: { label: string; tab: string }[];
}

const DEPARTMENT_META: Record<DepartmentName, DepartmentInfo> = {
  'Administration': {
    icon: '🏢',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    responsibilities: [
      'Strategic planning & Bakery policy enforcement',
      'Financial auditing & cash flow management',
      'Compliance with local food & labor regulations'
    ],
    docs: ['Policies & Procedures', 'Board Minutes', 'Industrial Licenses'],
    links: [
      { label: 'Manage Personnel', tab: 'hc' },
      { label: 'Banking & Treasury', tab: 'banking' },
      { label: 'System Setup', tab: 'reconstruction' }
    ]
  },
  'Production': {
    icon: '🥖',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    responsibilities: [
      'Core baking operations & batch fulfillment',
      'Daily capacity & shift throughput monitoring',
      'Operational cost control (ABC tracking)'
    ],
    docs: ['Production Job Cards', 'Batch SOPs', 'Daily Output Logs'],
    links: [
      { label: 'Daily Ops Plan', tab: 'snop' },
      { label: 'Production Library', tab: 'master-data' },
      { label: 'Scheduler', tab: 'calendar' }
    ]
  },
  'Distribution & Logistics': {
    icon: '🚚',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    responsibilities: [
      'Last-mile delivery to retail partners',
      'Vehicle maintenance & fuel consumption audit',
      'Outlet replenishment & van loading'
    ],
    docs: ['Delivery Notes', 'Dispatch Manifests', 'Fuel Vouchers'],
    links: [
      { label: 'Warehouse Hub', tab: 'finished-goods' },
      { label: 'Sales Registry', tab: 'sales' }
    ]
  },
  'Quality Assurance': {
    icon: '🧪',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    responsibilities: [
      'UNBS Compliance (Q-Mark/S-Mark)',
      'Batch testing & organoleptic auditing',
      'SOP enforcement & Technical File maintenance'
    ],
    docs: ['Compliance Certificates', 'Audit Reports', 'Testing Records'],
    links: [
      { label: 'QA Lab & Testing', tab: 'qa' },
      { label: 'Audit Hub', tab: 'qa' }
    ]
  },
  'R&D': {
    icon: '👨‍🍳',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    responsibilities: ['New recipe development', 'Raw material alternative tests', 'Yield optimization studies'],
    docs: ['Recipe Formulations', 'Trial Feedback', 'Product Specs'],
    links: [{ label: 'Recipe Lab', tab: 'master-data' }]
  },
  'Sanitation': {
    icon: '🧼',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    responsibilities: ['Plant hygiene schedules', 'Pest control management', 'Waste disposal coordination'],
    docs: ['Sanitation Logs', 'Cleaning SOPs', 'Pest Certs'],
    links: [{ label: 'Hygiene Hub', tab: 'qa' }]
  },
  'Welfare': {
    icon: '🍎',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    responsibilities: ['Staff meals & hydration', 'Uniform & protective gear', 'Staff motivation programs'],
    docs: ['Medical Certificates', 'Meal Rosters', 'PPE Register'],
    links: [{ label: 'Personnel Records', tab: 'hc' }]
  },
  'Sales and Marketing': {
    icon: '📈',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    responsibilities: ['Customer relationship management', 'Bulk order negotiation', 'Promotional campaigns'],
    docs: ['Sales Invoices', 'Commercial Receipts', 'Price Lists'],
    links: [
      { label: 'Customer CRM', tab: 'customers' },
      { label: 'Invoicing Hub', tab: 'orders' }
    ]
  },
  'Stores': {
    icon: '🏛️',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    responsibilities: ['Raw material receiving', 'Inventory reconciliation', 'Procurement requisitioning'],
    docs: ['GRN (Goods Received)', 'LPO (Purchase Orders)', 'Requisition Notes'],
    links: [
      { label: 'Stores Ledger', tab: 'stores' },
      { label: 'Sourcing Hub', tab: 'procurement' }
    ]
  },
  /**
   * Added Finance department meta to fix exhaustive Record error.
   */
  'Finance': {
    icon: '💰',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    responsibilities: [
      'Statutory filing & tax management',
      'Cost center auditing & ABC maintenance',
      'Treasury & multi-currency risk management'
    ],
    docs: ['Tax Returns', 'PnL Statements', 'Audit Workbooks'],
    links: [
      { label: 'Financial Audit', tab: 'mgmt-accountant' },
      { label: 'Master Budgeting', tab: 'budgeting' }
    ]
  },
  'SuperAdmin': {
    icon: '👑',
    color: 'bg-gray-900 text-amber-400 border-gray-800',
    responsibilities: ['System administration', 'Security protocols', 'Infrastructure sync'],
    docs: ['Audit Trails', 'User Provisioning', 'Database Exports'],
    links: [
      { label: 'System Overview', tab: 'dashboard' },
      { label: 'Risk Hub', tab: 'risk-hub' }
    ]
  },
  // Added Security department to satisfy type Record<DepartmentName, DepartmentInfo>
  'Security': {
    icon: '🛡️',
    color: 'bg-slate-200 text-slate-800 border-slate-300',
    responsibilities: [
      'Gate control & vehicle weighing oversight',
      'Loss prevention & asset protection',
      'Staff entry/exit verification'
    ],
    docs: ['Gate Pass Ledger', 'Incident Reports', 'Security Logs'],
    links: [
      { label: 'Weighbridge Hub', tab: 'weighbridge' },
      { label: 'Asset Register', tab: 'assets' }
    ]
  },
  // Fix: Added missing 'Board of Directors' to satisfy the Record constraint for DepartmentName
  'Board of Directors': {
    icon: '🏛️',
    color: 'bg-coffee-100 text-coffee-900 border-coffee-200',
    responsibilities: [
      'Strategic oversight & long-term capital allocation',
      'Approval of critical high-value directives',
      'Governance framework & risk appetite setting'
    ],
    docs: ['Board Resolutions', 'Strategic Charters', 'Dividend Policies'],
    links: [
      { label: 'Board Room', tab: 'board-room' },
      { label: 'Decision Hub', tab: 'decision-hub' },
      { label: 'Risk Hub', tab: 'risk-hub' }
    ]
  },
};

const DepartmentManager: React.FC<DepartmentManagerProps> = ({ activities, overheads, setActiveTab }) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header>
        <h2 className="text-3xl font-bold text-gray-900 font-serif">Bakery Departmental Hub</h2>
        <p className="text-gray-500 font-medium">Organizational structure and standardized transactional document flows.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DEPARTMENTS.map(dept => {
          const meta = DEPARTMENT_META[dept];
          return (
            <div key={dept} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-amber-500">
              <div className={`p-8 ${meta.color.split(' ')[0]} border-b ${meta.color.split(' ')[2]}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white/60 rounded-2xl flex items-center justify-center text-3xl shadow-sm">{meta.icon}</div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Control Unit</span>
                </div>
                <h4 className="text-xl font-bold font-serif">{dept}</h4>
              </div>
              
              <div className="p-8 flex-1 space-y-6">
                <div>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Standard Documents</h5>
                  <div className="flex flex-wrap gap-2">
                    {meta.docs.map((doc, i) => (
                      <span key={i} className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-bold uppercase border border-slate-100">
                        📄 {doc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 space-y-3">
                   <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Operational Modules</h5>
                   <div className="flex flex-wrap gap-2">
                     {meta.links.map(link => (
                       <button 
                        key={link.tab}
                        onClick={() => setActiveTab(link.tab)}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-900 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all border border-indigo-100"
                       >
                         {link.label}
                       </button>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col md:flex-row items-center gap-10 border border-white/5">
        <div className="text-6xl grayscale opacity-30">📋</div>
        <div>
           <h4 className="text-2xl font-bold font-serif text-amber-400 mb-3">Industrial Compliance Engine</h4>
           <p className="text-sm text-slate-400 leading-relaxed max-w-2xl italic">
             "A formal bakery is built on physical paper-trails that match digital records. Every department has a standard set of transactional documents (Invoices, DNs, GRNs, Job Cards) that must be generated and archived to maintain industrial standards and financial transparency."
           </p>
        </div>
      </div>
    </div>
  );
};

export default DepartmentManager;
