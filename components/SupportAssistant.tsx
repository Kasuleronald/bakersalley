
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Customer, SKU, Order, Sale } from '../types';
import { GoogleGenAI } from "@google/genai";

interface SupportAssistantProps {
  customers: Customer[];
  skus: SKU[];
  orders: Order[];
  sales: Sale[];
  currency: { format: (v: number) => string };
}

interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  lastMessage: string;
  status: 'Open' | 'Pending' | 'Closed';
  timestamp: string;
  urgency: 'Low' | 'Medium' | 'High';
}

const MOCK_TICKETS: SupportTicket[] = [
  { id: 'TKT-101', customerId: 'c-1', subject: 'Late Delivery Inquiry', lastMessage: 'Our morning bread delivery is 2 hours late. Any update?', status: 'Open', timestamp: new Date().toISOString(), urgency: 'High' },
  { id: 'TKT-102', customerId: 'c-2', subject: 'Wholesale Pricing Correction', lastMessage: 'The wholemeal loaf price on the last invoice seems incorrect.', status: 'Pending', timestamp: new Date(Date.now() - 86400000).toISOString(), urgency: 'Medium' }
];

const SupportAssistant: React.FC<SupportAssistantProps> = ({ customers, skus, orders, sales, currency }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [draftResponse, setDraftResponse] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedTicketId), [tickets, selectedTicketId]);
  const customer = useMemo(() => customers.find(c => c.id === selectedTicket?.customerId), [customers, selectedTicket]);

  const customerContext = useMemo(() => {
    if (!customer) return null;
    const history = sales.filter(s => s.customerId === customer.id);
    const totalSpent = history.reduce((s, x) => s + x.totalPrice, 0);
    const lastOrder = orders.filter(o => o.customerId === customer.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return { totalSpent, orderCount: history.length, lastOrder };
  }, [customer, sales, orders]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [selectedTicketId, draftResponse]);

  const handleSuggestResponse = async () => {
    if (!selectedTicket || !customer) return;
    setIsAiDrafting(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are a Senior Customer Success Manager at "BakersAlley Industrial Bakery". 
        A customer has sent the following query: "${selectedTicket.lastMessage}"
        
        CUSTOMER DATA:
        - Name: ${customer.name}
        - LTV: ${currency.format(customerContext?.totalSpent || 0)}
        - Last Order Status: ${customerContext?.lastOrder?.status || 'Unknown'}
        
        TASK:
        Draft a professional, empathetic, and solution-oriented response. 
        If it's a delivery issue, mention we are checking with Fleet Intelligence.
        If it's pricing, mention we are auditing the contract ledger.
        Limit to 150 words. Use a warm but industrial tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setDraftResponse(response.text || "Unable to synthesize response.");
    } catch (e) {
      console.error(e);
      setDraftResponse("Error connecting to neural drafting engine.");
    } finally {
      setIsAiDrafting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[75vh] animate-fadeIn">
      {/* TICKET LIST */}
      <aside className="lg:col-span-4 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-8 bg-slate-50 border-b border-slate-100 shrink-0">
           <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Inbound Inbox</h3>
           <div className="flex gap-2 mt-4">
              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">2 Unresolved</span>
              <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">v3.2 Sync Active</span>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
           {tickets.map(t => (
             <button 
              key={t.id} 
              onClick={() => setSelectedTicketId(t.id)}
              className={`w-full text-left p-6 rounded-[2.5rem] border transition-all group ${selectedTicketId === t.id ? 'bg-indigo-900 border-indigo-900 shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-md'}`}
             >
                <div className="flex justify-between items-start mb-3">
                   <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${selectedTicketId === t.id ? 'bg-white/10 text-white' : t.urgency === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                      {t.urgency} Urgency
                   </span>
                   <span className={`text-[8px] font-mono ${selectedTicketId === t.id ? 'text-indigo-300' : 'text-slate-300'}`}>{new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <h4 className={`text-sm font-black uppercase mb-1 truncate ${selectedTicketId === t.id ? 'text-white' : 'text-slate-900'}`}>{t.subject}</h4>
                <p className={`text-[10px] line-clamp-2 italic ${selectedTicketId === t.id ? 'text-indigo-200' : 'text-slate-500'}`}>"{t.lastMessage}"</p>
             </button>
           ))}
        </div>
      </aside>

      {/* CHAT INTERFACE */}
      <main className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col relative">
        {selectedTicket ? (
          <>
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-indigo-500 rounded-3xl flex items-center justify-center text-2xl font-black shadow-lg">{customer?.name.charAt(0)}</div>
                  <div>
                     <h4 className="text-xl font-bold font-serif">{customer?.name}</h4>
                     <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Case Ref: {selectedTicket.id} • {customer?.type}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-right">
                     <span className="text-[7px] text-slate-500 uppercase block font-bold">LTV Contribution</span>
                     <span className="text-xs font-mono font-black text-emerald-400">{currency.format(customerContext?.totalSpent || 0)}</span>
                  </div>
               </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide bg-slate-50/50">
               <div className="flex justify-start">
                  <div className="max-w-[70%] p-6 bg-white rounded-[2rem] rounded-bl-none shadow-sm border border-slate-100 relative group">
                     <div className="text-[8px] font-black text-indigo-400 uppercase mb-3">Customer Signal</div>
                     <p className="text-sm font-medium text-slate-800 leading-relaxed italic">"{selectedTicket.lastMessage}"</p>
                     <span className="absolute -bottom-6 left-2 text-[8px] font-bold text-slate-300 uppercase">Inbound • {new Date(selectedTicket.timestamp).toLocaleString()}</span>
                  </div>
               </div>

               {draftResponse && (
                 <div className="flex justify-end animate-fadeIn">
                    <div className="max-w-[80%] p-8 bg-indigo-900 text-white rounded-[2.5rem] rounded-br-none shadow-2xl relative overflow-hidden border border-white/5">
                       <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl font-black pointer-events-none">AI</div>
                       <div className="flex justify-between items-center mb-4 relative z-10">
                          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Neural Drafted Response</span>
                          <button onClick={() => setDraftResponse('')} className="text-white/40 hover:text-white">✕</button>
                       </div>
                       <p className="text-sm font-medium leading-relaxed relative z-10 whitespace-pre-wrap">
                          {draftResponse}
                       </p>
                       <div className="mt-6 flex justify-end gap-3 relative z-10">
                          <button 
                            onClick={() => { navigator.clipboard.writeText(draftResponse); alert("Response copied to clipboard."); }}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all"
                          >
                            Copy to Clip
                          </button>
                          <button 
                            onClick={() => alert("Response dispatched via Unified Communication Bridge.")}
                            className="bg-amber-500 text-slate-900 px-6 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-white"
                          >
                            Dispatch Email / SMS
                          </button>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-8 bg-white border-t border-slate-100 shrink-0">
               <div className="flex gap-4">
                  <div className="flex-1 relative">
                     <textarea 
                      className="w-full p-5 bg-slate-50 border-none rounded-3xl text-sm font-medium h-24 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" 
                      placeholder="Type a manual reply or use AI to draft a strategic response..."
                      value={draftResponse}
                      onChange={e => setDraftResponse(e.target.value)}
                     />
                  </div>
                  <div className="flex flex-col gap-3">
                     <button 
                      onClick={handleSuggestResponse}
                      disabled={isAiDrafting}
                      className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all ${isAiDrafting ? 'bg-indigo-50 text-indigo-400 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black active:scale-95'}`}
                      title="AI Suggestion"
                     >
                        {isAiDrafting ? '⏳' : '🧠'}
                     </button>
                     <button className="h-14 w-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-90">
                        ↑
                     </button>
                  </div>
               </div>
               <div className="mt-4 flex justify-between items-center px-2">
                  <p className="text-[9px] text-slate-400 italic">"The AI uses 30-day LTV and Order History context to prioritize high-value partners."</p>
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Neural Support Active</span>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-20 grayscale">
             <div className="text-8xl mb-8">🤖</div>
             <h4 className="text-2xl font-bold font-serif text-slate-400 uppercase tracking-widest">Customer Support Workspace</h4>
             <p className="text-sm text-slate-300 max-w-sm mt-2">Select an inbound query from the sidebar to begin AI-assisted resolution.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SupportAssistant;
