
import React, { useState } from 'react';
import { Customer, Sale, Order, SKU, Payment, Transaction, InventoryLoss, User, Lead, CRMTab, SalesAgent } from '../types';
import CustomerManager from './CustomerManager';
import SalesForceAutomation from './SalesForceAutomation';
import BirthdayBank from './BirthdayBank';
import WholesalePortal from './WholesalePortal';
import AgentHub from './AgentHub';
import RevenueAssuranceHub from './RevenueAssuranceHub';
import OrderManager from './OrderManager';
import PackingStation from './PackingStation';

interface UnifiedCRMHubProps {
  customers: Customer[];
  setCustomers: (c: Customer[]) => void;
  sales: Sale[];
  orders: Order[];
  setOrders: (o: Order[]) => void;
  skus: SKU[];
  setSkus: (s: SKU[]) => void;
  payments: Payment[];
  setPayments: (p: Payment[]) => void;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  leads: Lead[];
  setLeads: (leads: Lead[]) => void;
  agents: SalesAgent[];
  setAgents: (agents: SalesAgent[]) => void;
  inventoryLosses?: InventoryLoss[];
  setInventoryLosses?: (l: InventoryLoss[]) => void;
  onCommitToProduction: (orderId: string) => void;
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
  currentUser: User;
  onNavigate: (tab: string) => void;
}

const UnifiedCRMHub: React.FC<UnifiedCRMHubProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<CRMTab>('Directory');

  return (
    <div className="space-y-10 animate-softFade pb-20">
      {/* THEMED CRM HEADER */}
      <section className="relative h-64 rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white group">
        <img 
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1600" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
          alt="Celebration Cakes"
        />
        <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-[1px]"></div>
        <div className="relative h-full flex flex-col justify-center px-12">
          <div className="flex items-center gap-3 mb-2">
             <span className="px-3 py-1 bg-pink-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Celebration Desk</span>
          </div>
          <h2 className="text-4xl font-bold font-serif text-white uppercase tracking-tighter">Engagement Hub</h2>
          <p className="text-indigo-100 text-sm italic max-w-lg mt-2">Managing the long-term lifetime value of your most loyal partners.</p>
        </div>
      </section>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-indigo-950 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase">Commercial Lounge</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest pl-1 mt-1">CRM • Milestone Marketing • Agency Management</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'Directory', label: 'Partners', icon: '👥' },
            { id: 'Birthdays', label: 'Birthdays', icon: '🎂' },
            { id: 'WholesalePortal', label: 'Portal', icon: '🛒' },
            { id: 'Pipeline', label: 'Sales Force', icon: '🚀' },
            { id: 'Agents', label: 'Agents', icon: '👨‍💼' },
            { id: 'Assurance', label: 'Audit', icon: '🛡️' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveSubTab(tab.id as CRMTab)}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeSubTab === tab.id ? 'bg-white text-indigo-950 shadow-xl scale-105' : 'text-indigo-400 hover:text-white'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="animate-fadeIn">
        {activeSubTab === 'Directory' && <CustomerManager {...props} />}
        {activeSubTab === 'Assurance' && <RevenueAssuranceHub {...props} onNavigate={props.onNavigate} />}
        {activeSubTab === 'Agents' && <AgentHub {...props} />}
        {activeSubTab === 'WholesalePortal' && <WholesalePortal customers={props.customers} skus={props.skus} onOrderSubmit={(ord) => props.setOrders([ord, ...props.orders])} currency={props.currency} />}
        {activeSubTab === 'Birthdays' && <BirthdayBank customers={props.customers} skus={props.skus} sales={props.sales} currency={props.currency} />}
        {activeSubTab === 'Pipeline' && <SalesForceAutomation leads={props.leads} setLeads={props.setLeads} customers={props.customers} setCustomers={props.setCustomers} currentUser={props.currentUser} currency={props.currency} />}
      </div>
    </div>
  );
};

export default UnifiedCRMHub;
