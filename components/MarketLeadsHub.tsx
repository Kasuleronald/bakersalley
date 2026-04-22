
import React, { useState } from 'react';
import { MarketOpportunity, Lead, OpportunityStage } from '../types';
import { findLocalBakeryLeads, scanLocalConsumerDemand } from '../services/geminiService';

interface MarketLeadsHubProps {
  location: string;
  nation: string;
  onImportLead: (lead: Lead) => void;
  currency: { format: (v: number) => string };
}

const MarketLeadsHub: React.FC<MarketLeadsHubProps> = ({ location, nation, onImportLead, currency }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [leadType, setLeadType] = useState<'B2B' | 'Individual'>('B2B');
  const [results, setResults] = useState<{ opportunities: MarketOpportunity[], urls: string[] } | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>(['Cakes', 'Pizza', 'Bread']);

  const handleScan = async () => {
    setIsScanning(true);
    let data;
    if (leadType === 'B2B') {
      data = await findLocalBakeryLeads(location, nation);
    } else {
      data = await scanLocalConsumerDemand(location, nation, selectedItems);
    }
    
    if (data) setResults({ opportunities: data.opportunities, urls: data.groundingUrls });
    setIsScanning(false);
  };

  const toggleItem = (item: string) => {
    setSelectedItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const convertToLead = (opp: MarketOpportunity) => {
    const lead: Lead = {
      id: `lead-web-${Date.now()}`,
      companyName: opp.name,
      contactPerson: leadType === 'Individual' ? 'Individual Customer' : 'Purchasing Manager',
      phone: opp.contactHint || 'Check website',
      email: '',
      source: leadType === 'Individual' ? 'Neural Consumer Pulse' : 'AI Market Pulse',
      estimatedValue: opp.potentialValue,
      stage: 'Prospecting',
      activities: [],
      createdAt: new Date().toISOString(),
      winProbability: opp.relevanceScore,
      aiClosingAdvice: opp.strategicHook
    };
    onImportLead(lead);
    alert(`${opp.name} successfully injected into Sales Pipeline.`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-indigo-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
             <span className="px-4 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase animate-pulse">Neural Intelligence Active</span>
             <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Region: {location}, {nation}</span>
          </div>
          <h3 className="text-4xl font-bold font-serif text-amber-400">Local Opportunity Pulse</h3>
          <p className="text-indigo-100 text-lg leading-relaxed italic">
            "Stop waiting for customers to find you. Use the Neural Search Engine to scan for {leadType === 'B2B' ? 'hospitals, hotels, and schools' : 'individuals and community requests'} in <strong>{location}</strong> that are searching for high-volume products right now."
          </p>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
             <button onClick={() => setLeadType('B2B')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${leadType === 'B2B' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>B2B Leads</button>
             <button onClick={() => setLeadType('Individual')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${leadType === 'Individual' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Individual Demand 👤</button>
          </div>

          {leadType === 'Individual' && (
            <div className="flex flex-wrap gap-2 pt-4">
              {['Cakes', 'Pizza', 'Bread', 'Samosas', 'Pastries', 'Custom Catering'].map(item => (
                <button 
                  key={item} 
                  onClick={() => toggleItem(item)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${selectedItems.includes(item) ? 'bg-amber-400 border-amber-400 text-slate-900' : 'bg-transparent border-white/20 text-white/40'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className={`relative z-10 px-12 py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all ${isScanning ? 'bg-white/10 text-indigo-300 animate-pulse' : 'bg-white text-slate-900 hover:bg-amber-400 active:scale-95'}`}
        >
          {isScanning ? 'Scanning Web Signals...' : '🔍 Scan Local Market'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <main className="lg:col-span-8 space-y-6">
          {results ? (
            <div className="grid grid-cols-1 gap-6">
              {results.opportunities.map(opp => (
                <div key={opp.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${opp.type === 'Event' ? 'bg-amber-50' : leadType === 'Individual' ? 'bg-rose-50' : 'bg-indigo-50'}`}>
                            {opp.type === 'Event' ? '🎊' : leadType === 'Individual' ? '👤' : '🏢'}
                         </div>
                         <div>
                            <h4 className="text-xl font-bold font-serif text-slate-900 uppercase truncate max-w-md">{opp.name}</h4>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{opp.type} Request</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-mono font-black text-emerald-600">{currency.format(opp.potentialValue)}</div>
                         <div className="text-[8px] font-bold text-slate-300 uppercase">Est. Order Value</div>
                      </div>
                   </div>
                   
                   <p className="text-sm text-slate-600 leading-relaxed mb-8 italic">"{opp.description}"</p>
                   
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-8">
                      <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">Neural Strategy Angle</div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{opp.strategicHook}</p>
                   </div>

                   <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                      {opp.sourceUrl && (
                        <a href={opp.sourceUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 flex items-center gap-2">
                           <span>🔗</span> View Demand Signal
                        </a>
                      )}
                      <button 
                        onClick={() => convertToLead(opp)}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md"
                      >
                        Convert to Deal
                      </button>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
               <div className="text-7xl opacity-10 mb-6 grayscale">📡</div>
               <h4 className="text-xl font-bold font-serif text-slate-300 uppercase tracking-widest">Awaiting Command</h4>
               <p className="text-sm text-slate-400 mt-2 italic max-w-sm mx-auto">Initiate a market scan to identify local demand signals for {leadType === 'Individual' ? 'cakes, pizzas, and personalized treats' : 'B2B contracts and events'}.</p>
            </div>
          )}
        </main>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-4">Grounding Sources</h4>
             <div className="space-y-3">
                {results?.urls.map((url, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                     <div className="text-[10px] font-mono text-indigo-400 truncate">{url}</div>
                  </div>
                ))}
                {!results && <p className="text-[10px] text-slate-300 text-center italic">Connect to local web signals for real-time demand.</p>}
             </div>
          </div>

          <div className="p-8 bg-amber-50 rounded-[3rem] border border-amber-100">
             <h5 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-4">Market Pulse Strategy</h5>
             <p className="text-xs text-amber-700 leading-relaxed italic">
                {leadType === 'Individual' 
                  ? '"Direct consumer leads often come from social media platforms or community boards. Use the "Contact Hint" to engage directly or offer a location-based delivery discount to win the order."' 
                  : '"Local search grounding often identifies gaps where corporate buyers are unsatisfied with current delivery times. Highlight your Fleet Density when contacting these leads."'}
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MarketLeadsHub;
