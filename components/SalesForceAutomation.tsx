
import React, { useState, useMemo } from 'react';
import { Lead, OpportunityStage, ActivityType, User, Customer, SalesActivity } from '../types';
import { analyzeOpportunityScore } from '../services/geminiService';
import ModuleAiInteraction from './ModuleAiInteraction';

interface SalesForceAutomationProps {
  leads: Lead[];
  setLeads: (leads: Lead[]) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  currentUser: User;
  currency: { format: (v: number) => string };
}

const STAGES: OpportunityStage[] = ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const ACTIVITY_TYPES: ActivityType[] = ['Call', 'Meeting', 'Sample Sent', 'Site Visit', 'Email'];

const SalesForceAutomation: React.FC<SalesForceAutomationProps> = ({ leads = [], setLeads, customers, setCustomers, currentUser, currency }) => {
  const [view, setView] = useState<'Pipeline' | 'Leads'>('Pipeline');
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [inspectingLeadId, setInspectingLeadId] = useState<string | null>(null);
  const [isAnalyzingId, setIsAnalyzingId] = useState<string | null>(null);

  // New Lead Form State
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    companyName: '', contactPerson: '', phone: '', source: 'Referral', estimatedValue: 0, stage: 'Prospecting'
  });

  // Activity Log State
  const [newActivity, setNewActivity] = useState<Partial<SalesActivity>>({
    type: 'Call', notes: '', date: new Date().toISOString().split('T')[0]
  });

  const handleAddLead = () => {
    if (!newLead.companyName || !newLead.contactPerson) return;
    const lead: Lead = {
      ...newLead as Lead,
      id: `lead-${Date.now()}`,
      activities: [],
      createdAt: new Date().toISOString(),
      stage: 'Prospecting'
    };
    setLeads([lead, ...leads]);
    setIsAddingLead(false);
    setNewLead({ companyName: '', contactPerson: '', phone: '', source: 'Referral', estimatedValue: 0 });
  };

  const handleUpdateStage = (leadId: string, stage: OpportunityStage) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage } : l));
  };

  const handleAddActivity = (leadId: string) => {
    if (!newActivity.notes) return;
    const activity: SalesActivity = {
      id: `act-${Date.now()}`,
      type: newActivity.type as ActivityType,
      date: newActivity.date || new Date().toISOString(),
      notes: newActivity.notes,
      performedBy: currentUser.name
    };

    setLeads(leads.map(l => l.id === leadId ? { 
      ...l, 
      activities: [activity, ...l.activities] 
    } : l));
    setNewActivity({ type: 'Call', notes: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleAiScore = async (lead: Lead) => {
    setIsAnalyzingId(lead.id);
    const result = await analyzeOpportunityScore(lead);
    if (result) {
      setLeads(leads.map(l => l.id === lead.id ? { 
        ...l, 
        winProbability: result.winProbability, 
        aiClosingAdvice: result.closingHook 
      } : l));
    }
    setIsAnalyzingId(null);
  };

  const handleWinConversion = (lead: Lead) => {
    if (!window.confirm(`Convert ${lead.companyName} to a permanent Customer profile?`)) return;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: lead.companyName,
      phone: lead.phone,
      type: 'Corporate',
      balance: 0,
      creditLimit: 1000000,
      email: lead.email,
      customPrices: {}
    };

    setCustomers([...customers, newCustomer]);
    handleUpdateStage(lead.id, 'Closed Won');
    alert("New Partnership established in CRM Directory.");
  };

  const inspectingLead = leads.find(l => l.id === inspectingLeadId);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex bg-white p-1.5 rounded-2xl w-fit shadow-sm border border-slate-100">
        <button onClick={() => setView('Pipeline')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'Pipeline' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Visual Pipeline</button>
        <button onClick={() => setView('Leads')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'Leads' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Lead Directory</button>
      </div>

      {view === 'Pipeline' && (
        <div className="overflow-x-auto pb-6 scrollbar-hide">
          <div className="flex gap-6 min-w-max">
            {STAGES.map(stage => {
              const stageLeads = (leads || []).filter(l => l.stage === stage);
              const stageValue = stageLeads.reduce((s, l) => s + l.estimatedValue, 0);
              
              return (
                <div key={stage} className="w-72 flex-shrink-0 space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stage}</h4>
                      <div className="text-xs font-mono font-black text-indigo-600">{currency.format(stageValue)}</div>
                    </div>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[9px] font-black">{stageLeads.length}</span>
                  </div>

                  <div className="bg-slate-50 rounded-[2.5rem] p-4 min-h-[600px] border border-slate-100 space-y-4">
                    {stageLeads.map(lead => (
                      <div 
                        key={lead.id} 
                        onClick={() => setInspectingLeadId(lead.id)}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-4">
                           <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{lead.source}</span>
                           {lead.winProbability !== undefined && (
                             <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${lead.winProbability > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {lead.winProbability}% Prob.
                             </span>
                           )}
                        </div>
                        <h5 className="font-black text-slate-900 text-sm uppercase truncate mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{lead.companyName}</h5>
                        <p className="text-[10px] text-slate-400 font-bold mb-4">{lead.contactPerson}</p>
                        
                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                           <div className="text-[10px] font-mono font-black text-slate-900">{currency.format(lead.estimatedValue)}</div>
                           <div className="flex gap-1">
                              {lead.activities.length > 0 && <span className="text-xs">💬</span>}
                              {lead.winProbability !== undefined && <span className="text-xs">🧠</span>}
                           </div>
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="py-20 text-center opacity-20 grayscale text-[10px] font-black uppercase">Empty Stage</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'Leads' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Prospect Master Directory</h3>
              <button onClick={() => setIsAddingLead(true)} className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">+ Inject New Prospect</button>
           </div>

           {isAddingLead && (
             <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-8">
               <h4 className="text-lg font-bold font-serif text-indigo-900 uppercase">Lead Enrollment Pad</h4>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Company Identity</label>
                    <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newLead.companyName} onChange={e => setNewLead({...newLead, companyName: e.target.value})} placeholder="e.g. Imperial Hotel" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Primary Contact</label>
                    <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newLead.contactPerson} onChange={e => setNewLead({...newLead, contactPerson: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Est. Annual Value (UGX)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black" value={newLead.estimatedValue || ''} onChange={e => setNewLead({...newLead, estimatedValue: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="flex gap-2">
                     <button onClick={handleAddLead} className="flex-1 py-4 bg-indigo-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Archive Lead</button>
                     <button onClick={() => setIsAddingLead(false)} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase">✕</button>
                  </div>
               </div>
             </div>
           )}

           <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-50 overflow-hidden">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                   <th className="px-10 py-6">Target Entity</th>
                   <th className="px-6 py-6 text-center">Pipeline Stage</th>
                   <th className="px-6 py-6 text-right">Potential Value</th>
                   <th className="px-10 py-6 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {leads.map(lead => (
                   <tr key={lead.id} className="hover:bg-slate-50 transition-all">
                     <td className="px-10 py-5">
                       <div className="font-bold text-slate-900 text-sm uppercase">{lead.companyName}</div>
                       <div className="text-[10px] text-slate-400 font-bold uppercase">{lead.contactPerson} • {lead.source}</div>
                     </td>
                     <td className="px-6 py-5 text-center">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border border-indigo-100">{lead.stage}</span>
                     </td>
                     <td className="px-6 py-5 text-right font-mono font-black text-slate-900">
                        {currency.format(lead.estimatedValue)}
                     </td>
                     <td className="px-10 py-5 text-right">
                       <button onClick={() => setInspectingLeadId(lead.id)} className="text-indigo-600 font-bold text-[10px] uppercase hover:underline">Inspect Deal</button>
                     </td>
                   </tr>
                 ))}
                 {leads.length === 0 && (
                    <tr>
                       <td colSpan={4} className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">No active prospects in current ledger</td>
                    </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* LEAD DETAIL MODAL HUB */}
      {inspectingLeadId && inspectingLead && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
           <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl animate-softFade border border-indigo-50 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-10 text-white flex justify-between items-start shrink-0">
                 <div className="flex gap-6 items-center">
                    <div className="w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center text-3xl font-black shadow-xl">{inspectingLead.companyName.charAt(0)}</div>
                    <div>
                       <h3 className="text-3xl font-bold font-serif">{inspectingLead.companyName}</h3>
                       <div className="flex gap-4 mt-1">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{inspectingLead.stage}</span>
                          <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Potential: {currency.format(inspectingLead.estimatedValue)}</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setInspectingLeadId(null)} className="text-slate-400 hover:text-white font-bold text-xl transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-10">
                       {/* AI ADVICE PANEL */}
                       <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
                          <div className="flex justify-between items-center mb-6 relative z-10">
                             <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">SFA Intelligence Output</h4>
                             <button 
                              onClick={() => handleAiScore(inspectingLead)}
                              disabled={isAnalyzingId === inspectingLead.id}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${isAnalyzingId === inspectingLead.id ? 'bg-white/10 text-white/40 animate-pulse border-white/5' : 'bg-white text-indigo-900 border-white hover:bg-amber-400 hover:text-slate-900'}`}
                             >
                                {isAnalyzingId === inspectingLead.id ? 'Analyzing Deal...' : '🧠 Request Neural Audit'}
                             </button>
                          </div>
                          
                          {inspectingLead.aiClosingAdvice ? (
                            <div className="space-y-6 relative z-10 animate-fadeIn">
                               <p className="text-lg font-serif italic text-indigo-100 leading-relaxed">"{inspectingLead.aiClosingAdvice}"</p>
                               <div className="flex items-center gap-6">
                                  <div className="flex-1">
                                     <div className="text-[8px] font-bold text-indigo-400 uppercase mb-1">Win Probability Score</div>
                                     <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${inspectingLead.winProbability}%` }}></div>
                                     </div>
                                  </div>
                                  <span className="text-3xl font-mono font-black text-emerald-400">{inspectingLead.winProbability}%</span>
                               </div>
                            </div>
                          ) : (
                            <div className="py-10 text-center opacity-40 italic text-sm">Initiate an Intelligence Audit to generate win probability and strategic closing hooks.</div>
                          )}
                       </div>

                       {/* ACTIVITY LOGGING */}
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Touchpoint Log</h4>
                          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                             {ACTIVITY_TYPES.map(type => (
                               <button 
                                key={type} 
                                onClick={() => setNewActivity({...newActivity, type})}
                                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${newActivity.type === type ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                               >
                                 {type}
                               </button>
                             ))}
                          </div>
                          <div className="flex gap-2">
                             <input 
                              className="flex-1 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                              placeholder="Record summary of the call or visit..."
                              value={newActivity.notes}
                              onChange={e => setNewActivity({...newActivity, notes: e.target.value})}
                              onKeyDown={e => e.key === 'Enter' && handleAddActivity(inspectingLead.id)}
                             />
                             <button onClick={() => handleAddActivity(inspectingLead.id)} className="bg-indigo-900 text-white px-10 rounded-[2rem] font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all">Archive Log</button>
                          </div>

                          <div className="space-y-4 pt-6 border-t border-slate-50">
                             {inspectingLead.activities.map(act => (
                               <div key={act.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group transition-all hover:bg-white hover:border-indigo-100">
                                  <div className="flex justify-between items-start mb-2">
                                     <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase tracking-widest">{act.type}</span>
                                     <span className="text-[8px] text-slate-400 font-bold">{new Date(act.date).toLocaleDateString()} at {new Date(act.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <p className="text-xs font-medium text-slate-700 leading-relaxed italic">"{act.notes}"</p>
                                  <div className="text-[7px] font-black text-slate-300 uppercase mt-3">Logged by {act.performedBy}</div>
                               </div>
                             ))}
                             {inspectingLead.activities.length === 0 && (
                               <div className="py-20 text-center text-slate-300 italic text-[10px] uppercase font-bold tracking-widest">No activities logged for this prospect.</div>
                             )}
                          </div>
                       </div>
                    </div>

                    <aside className="lg:col-span-5 space-y-6">
                       <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-4">Operational Controls</h4>
                          
                          <div className="space-y-6">
                             <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Transition Deal Stage</label>
                                <div className="grid grid-cols-1 gap-2">
                                   {STAGES.map(stage => (
                                     <button 
                                      key={stage}
                                      onClick={() => handleUpdateStage(inspectingLead.id, stage)}
                                      className={`p-4 rounded-[1.5rem] text-[10px] font-black uppercase text-left transition-all border ${inspectingLead.stage === stage ? 'bg-indigo-900 border-indigo-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-white hover:border-indigo-100'}`}
                                     >
                                        {stage}
                                     </button>
                                   ))}
                                </div>
                             </div>

                             <div className="pt-8 border-t border-slate-50 space-y-4">
                                {inspectingLead.stage !== 'Closed Won' ? (
                                  <button 
                                   onClick={() => handleWinConversion(inspectingLead)}
                                   className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
                                  >
                                     🤝 Confirm Deal & Establish Partner
                                  </button>
                                ) : (
                                  <div className="p-8 bg-emerald-50 rounded-[3rem] border border-emerald-100 text-center space-y-3">
                                     <div className="text-4xl">🎉</div>
                                     <div className="text-sm font-black text-emerald-900 uppercase">Partnership Established</div>
                                     <p className="text-[10px] text-emerald-600 italic">This lead has been promoted to a Corporate Customer profile in the master directory.</p>
                                  </div>
                                )}
                             </div>
                          </div>
                       </div>
                       
                       <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-200">
                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Deal Context</h5>
                          <div className="space-y-2 text-[11px] font-bold text-slate-600">
                             <div className="flex justify-between"><span>Contact:</span> <span>{inspectingLead.phone}</span></div>
                             <div className="flex justify-between"><span>Source:</span> <span>{inspectingLead.source}</span></div>
                             <div className="flex justify-between"><span>Created:</span> <span>{new Date(inspectingLead.createdAt).toLocaleDateString()}</span></div>
                          </div>
                       </div>
                    </aside>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SalesForceAutomation;
