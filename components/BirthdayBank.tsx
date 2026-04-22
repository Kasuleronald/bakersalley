import React, { useState, useMemo } from 'react';
import { Customer, SKU, Sale } from '../types';
import { GoogleGenAI } from "@google/genai";

interface BirthdayBankProps {
  customers: Customer[];
  skus: SKU[];
  sales: Sale[];
  currency: { format: (v: number) => string };
}

const BirthdayBank: React.FC<BirthdayBankProps> = ({ customers, skus, sales, currency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Upcoming' | 'ThisMonth'>('Upcoming');
  const [isGeneratingOffer, setIsGeneratingOffer] = useState<string | null>(null);
  const [aiOffer, setAiOffer] = useState<{ customerId: string, text: string } | null>(null);

  const birthdayRegistry = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();

    return customers.filter(c => {
      if (!c.birthDate) return false;
      const bDate = new Date(c.birthDate);
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filter === 'ThisMonth') return bDate.getMonth() === currentMonth;
      if (filter === 'Upcoming') {
        const nextTwoWeeks = new Date();
        nextTwoWeeks.setDate(today.getDate() + 14);
        
        // Normalize years for comparison
        const thisYearBirthday = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
        return thisYearBirthday >= today && thisYearBirthday <= nextTwoWeeks;
      }
      return true;
    }).sort((a, b) => {
        const bdA = new Date(a.birthDate!);
        const bdB = new Date(b.birthDate!);
        return bdA.getMonth() - bdB.getMonth() || bdA.getDate() - bdB.getDate();
    });
  }, [customers, searchTerm, filter]);

  const handleGenerateOffer = async (customer: Customer) => {
    setIsGeneratingOffer(customer.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const history = sales.filter(s => s.customerId === customer.id);
      
      const prompt = `
        You are a Marketing Manager for "BakersAlley".
        Generate a personalized birthday offer message for ${customer.name}.
        Context:
        - Upcoming Birthday: ${customer.birthDate}
        - Purchase History: ${history.length} previous orders.
        - Location: ${customer.address || 'Local'}
        - Catalog: ${skus.map(s => s.name).join(', ')}
        
        Requirements:
        1. Suggest ONE specific product (Cake or Pizza) from the catalog.
        2. Offer a compelling but mathematically sound discount (e.g. 15% off).
        3. Keep it under 3 sentences. Professional and warm.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setAiOffer({ customerId: customer.id, text: response.text || "Contact us for a special birthday discount on your favorite treats!" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingOffer(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1 w-full max-w-md relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          <input 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="Search birthday bank..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
          {[
            { id: 'Upcoming', label: 'Next 14 Days', icon: '🎂' },
            { id: 'ThisMonth', label: 'This Month', icon: '📅' },
            { id: 'All', label: 'Full Registry', icon: '🗄️' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setFilter(t.id as any)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${filter === t.id ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400'}`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {birthdayRegistry.map(customer => {
          const bDate = new Date(customer.birthDate!);
          const isOfferActive = aiOffer?.customerId === customer.id;

          return (
            <div key={customer.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full border-b-4 border-b-transparent hover:border-b-amber-500">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">🎁</div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{bDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</div>
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Birthday Event</div>
                  </div>
               </div>

               <h4 className="text-xl font-bold font-serif text-slate-900 mb-1 uppercase truncate">{customer.name}</h4>
               <div className="space-y-3 mt-4 flex-1">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                     <span className="w-5 text-center">📞</span> {customer.phone}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium truncate">
                     <span className="w-5 text-center">✉️</span> {customer.email || 'No email registered'}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                     <span className="w-5 text-center">📍</span> {customer.address || 'Address unassigned'}
                  </div>
               </div>

               {isOfferActive && (
                 <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-softFade relative">
                    <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Generated Promo Offer (AI)</div>
                    <p className="text-xs text-indigo-900 font-medium italic leading-relaxed">"{aiOffer.text}"</p>
                    <button onClick={() => setAiOffer(null)} className="absolute top-2 right-2 text-[10px] text-slate-300 hover:text-rose-500 transition-colors">✕</button>
                 </div>
               )}

               <div className="pt-6 mt-6 border-t border-slate-50 flex gap-2">
                  <button 
                    onClick={() => handleGenerateOffer(customer)}
                    disabled={isGeneratingOffer === customer.id}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isGeneratingOffer === customer.id ? 'bg-slate-100 text-slate-300 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black shadow-lg'}`}
                  >
                    {isGeneratingOffer === customer.id ? 'Synthesizing Offer...' : '🧠 Generate Offer'}
                  </button>
                  <button className="px-4 py-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">💬</button>
               </div>
            </div>
          );
        })}
        {birthdayRegistry.length === 0 && (
          <div className="col-span-full py-32 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100">
             <div className="text-7xl opacity-10 mb-6 grayscale">🎂</div>
             <h4 className="text-xl font-bold font-serif text-slate-300 uppercase tracking-widest">No matching milestones</h4>
             <p className="text-sm text-slate-400 mt-2 italic">Capture more birthdays in the Partner Directory to build your bank.</p>
          </div>
        )}
      </div>

      <div className="p-12 bg-indigo-900 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-7xl opacity-30 grayscale shrink-0">🎁</div>
         <div className="relative z-10">
            <h4 className="text-3xl font-bold font-serif text-amber-400 mb-4">Milestone Marketing Logic</h4>
            <p className="text-base text-indigo-100/70 leading-relaxed max-w-4xl italic">
              "A customer's birthday is the single highest conversion opportunity in the bakery industry. By maintaining a structured **Birthday Knowledge Bank**, your commercial team can proactively reach out to partners with personalized offers for cakes and celebration catering, transforming a one-off retail walk-in into a loyal high-LTV partner."
            </p>
         </div>
      </div>
    </div>
  );
};

export default BirthdayBank;
