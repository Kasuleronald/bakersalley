import React, { useState, useMemo } from 'react';
import { Customer, Sale, SKU } from '../types';
import { GoogleGenAI } from "@google/genai";

interface EngagementAutomatorProps {
  customers: Customer[];
  sales: Sale[];
  skus: SKU[];
  currency: { format: (v: number) => string };
}

const EngagementAutomator: React.FC<EngagementAutomatorProps> = ({ customers, sales, skus, currency }) => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [activeOffers, setActiveOffers] = useState<Record<string, string>>({});

  const highValuePartners = useMemo(() => {
    return customers.map(customer => {
      const history = sales.filter(s => s.customerId === customer.id);
      const totalVolume = history.reduce((sum, s) => sum + s.quantity, 0);
      const totalRevenue = history.reduce((sum, s) => sum + s.totalPrice, 0);
      const frequency = history.length;

      // Loyalty logic: Top 10% by revenue or frequency
      const isLoyal = frequency > 10 || totalRevenue > 2000000;
      
      const today = new Date();
      const bDate = customer.birthDate ? new Date(customer.birthDate) : null;
      let isBirthdaySoon = false;
      if (bDate) {
        const thisYearBirthday = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
        const diff = (thisYearBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24);
        isBirthdaySoon = diff >= 0 && diff <= 10;
      }

      return { ...customer, totalRevenue, frequency, isLoyal, isBirthdaySoon };
    }).filter(c => c.isLoyal || c.isBirthdaySoon).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [customers, sales]);

  const handleGenerateAutomatedMessage = async (customer: any) => {
    setIsGenerating(customer.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const type = customer.isBirthdaySoon ? 'Birthday Celebration' : 'Loyalty Appreciation';
      
      const prompt = `
        You are an automated Customer Success bot for "BakersAlley".
        Generate a warm, short (max 200 chars), professional ${type} message for ${customer.name}.
        
        Context:
        - Customer Type: ${customer.type}
        - Relationship History: ${customer.frequency} orders to date.
        - Strategic Goal: Encourage a repeat purchase with a special 1-time discount code.
        
        Return the raw message text only.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setActiveOffers(prev => ({ ...prev, [customer.id]: response.text || '' }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex-1 space-y-2">
           <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Growth Triggers</h3>
           <p className="text-sm text-slate-500 italic">"The system identifies customers who represent the highest growth opportunity or retention risk today."</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-indigo-50 px-6 py-2 rounded-2xl border border-indigo-100 text-center">
              <div className="text-[8px] font-black text-indigo-400 uppercase mb-1">Target Base</div>
              <div className="text-2xl font-mono font-black text-indigo-900">{highValuePartners.length}</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {highValuePartners.map(partner => {
          const offer = activeOffers[partner.id];
          return (
            <div key={partner.id} className={`bg-white p-8 rounded-[3rem] border transition-all hover:shadow-xl flex flex-col ${partner.isBirthdaySoon ? 'border-amber-200 ring-2 ring-amber-50' : 'border-slate-100'}`}>
               <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${partner.isBirthdaySoon ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {partner.isBirthdaySoon ? '🎂' : '💎'}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ${partner.isBirthdaySoon ? 'bg-amber-500 text-white animate-pulse' : 'bg-indigo-900 text-white'}`}>
                        {partner.isBirthdaySoon ? 'Milestone' : 'Wholesale Star'}
                     </span>
                     <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Score: {partner.frequency}x Orders</span>
                  </div>
               </div>

               <h4 className="text-xl font-black text-slate-900 uppercase truncate mb-1">{partner.name}</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{partner.phone}</p>

               {offer ? (
                 <div className="flex-1 bg-slate-900 p-6 rounded-[2rem] text-white relative animate-softFade mb-6">
                    <div className="text-[7px] font-black text-amber-400 uppercase tracking-widest mb-2">Preset SMS Draft</div>
                    <p className="text-xs italic leading-relaxed">"{offer}"</p>
                    <button onClick={() => navigator.clipboard.writeText(offer)} className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all">📋</button>
                 </div>
               ) : (
                 <div className="flex-1 border-2 border-dashed border-slate-100 rounded-[2rem] p-6 mb-6 flex flex-col items-center justify-center text-center opacity-40">
                    <div className="text-2xl mb-2">🧠</div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Neural Message Unbound</p>
                 </div>
               )}

               <button 
                onClick={() => handleGenerateAutomatedMessage(partner)}
                disabled={isGenerating === partner.id}
                className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all ${isGenerating === partner.id ? 'bg-slate-100 text-slate-300 animate-pulse' : 'bg-slate-900 text-white hover:bg-black active:scale-95'}`}
               >
                 {offer ? 'Regenerate Hook' : 'Generate Strategic Message'}
               </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EngagementAutomator;