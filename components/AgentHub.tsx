import React, { useState, useMemo } from 'react';
import { SalesAgent, Sale, SKU } from '../types';

interface AgentHubProps {
  agents: SalesAgent[];
  setAgents: (agents: SalesAgent[]) => void;
  sales: Sale[];
  skus: SKU[];
  currency: { format: (v: number) => string };
}

const AgentHub: React.FC<AgentHubProps> = ({ agents, setAgents, sales, skus, currency }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<SalesAgent>>({
    name: '', phone: '', email: '', baseCommissionRate: 5, isActive: true
  });

  const agentPerformance = useMemo(() => {
    return agents.map(agent => {
      const agentSales = sales.filter(s => s.agentId === agent.id);
      const totalSalesValue = agentSales.reduce((sum, s) => sum + s.totalPrice, 0);
      
      const currentCommission = agentSales.reduce((sum, s) => {
        const sku = skus.find(item => item.id === s.skuId);
        const rate = sku?.commissionRate ?? agent.baseCommissionRate;
        return sum + (s.totalPrice * (rate / 100));
      }, 0);

      return {
        ...agent,
        totalSalesValue,
        currentCommission,
        salesCount: agentSales.length
      };
    });
  }, [agents, sales, skus]);

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.phone) {
      alert("Name and Phone are mandatory.");
      return;
    }
    const agent: SalesAgent = {
      id: `agent-${Date.now()}`,
      name: newAgent.name!,
      phone: newAgent.phone!,
      email: newAgent.email,
      baseCommissionRate: newAgent.baseCommissionRate || 5,
      totalCommissionEarned: 0,
      isActive: true
    };
    setAgents([...agents, agent]);
    setShowAddForm(false);
    setNewAgent({ name: '', phone: '', email: '', baseCommissionRate: 5 });
  };

  const totalUnpaidCommission = agentPerformance.reduce((s, a) => s + a.currentCommission, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-serif uppercase tracking-tight">Sales Agent Hub</h2>
          <p className="text-slate-500 font-medium text-sm">Commission-based distribution management.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-indigo-50 px-6 py-2 rounded-2xl border border-indigo-100 text-center">
              <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Commission Liability</div>
              <div className="text-xl font-mono font-black text-indigo-900">{currency.format(totalUnpaidCommission)}</div>
           </div>
           <button 
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all"
           >
            + Enroll New Agent
           </button>
        </div>
      </header>

      {showAddForm && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-8">
          <h3 className="text-xl font-bold font-serif text-indigo-900 uppercase">Agent Enrollment</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Agent Name</label>
              <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} placeholder="e.g. Samuel Okello" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Phone</label>
              <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newAgent.phone} onChange={e => setNewAgent({...newAgent, phone: e.target.value})} placeholder="+256..." />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Base Commission (%)</label>
              <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black" value={newAgent.baseCommissionRate} onChange={e => setNewAgent({...newAgent, baseCommissionRate: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddAgent} className="flex-1 py-4 bg-indigo-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Register Agent</button>
              <button onClick={() => setShowAddForm(false)} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentPerformance.map(agent => (
          <div key={agent.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-900 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner">
                {agent.name.charAt(0)}
              </div>
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${agent.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {agent.isActive ? 'Active' : 'Dormant'}
              </span>
            </div>
            <h4 className="text-xl font-bold font-serif text-slate-900 uppercase truncate mb-1">{agent.name}</h4>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{agent.phone}</div>

            <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50 mb-6 bg-slate-50/30 -mx-8 px-8">
              <div>
                <div className="text-[7px] font-black text-slate-400 uppercase mb-1">Volume Built</div>
                <div className="text-sm font-mono font-black text-slate-900">{currency.format(agent.totalSalesValue)}</div>
              </div>
              <div className="text-right">
                <div className="text-[7px] font-black text-indigo-400 uppercase mb-1">Earned Comm.</div>
                <div className="text-sm font-mono font-black text-emerald-600">{currency.format(agent.currentCommission)}</div>
              </div>
            </div>

            <div className="mt-auto flex justify-between items-center">
              <div className="text-[8px] font-black text-slate-400 uppercase">Total Sales: {agent.salesCount}</div>
              <button className="px-5 py-2 bg-indigo-900 text-white rounded-xl text-[9px] font-black uppercase shadow-sm hover:bg-black transition-all">Payout History</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 p-10 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="text-6xl opacity-30 grayscale shrink-0">📈</div>
        <div className="relative z-10">
          <h4 className="text-2xl font-bold font-serif text-amber-400 mb-4 uppercase">Commercial Linkage Logic</h4>
          <p className="text-sm text-indigo-100 leading-relaxed max-w-4xl italic">
            "Sales agents act as the growth arm of the industrial bakery. By linking agents to specific retail outlets or wholesale routes, you can incentivize market penetration without adding fixed salary burdens. Payouts are reconciled against the **Finance Ledger** to ensure commissions are only paid on confirmed revenue."
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentHub;
