import React, { useState } from 'react';
import { SKU } from '../types';
import { GoogleGenAI } from "@google/genai";

interface AdStudioProps {
  skus: SKU[];
  currency: { format: (v: number) => string };
}

const AdStudio: React.FC<AdStudioProps> = ({ skus, currency }) => {
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [campaignVibe, setCampaignVibe] = useState('Artisanal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [adOutput, setAdOutput] = useState<any>(null);

  const handleGenerateAd = async () => {
    const sku = skus.find(s => s.id === selectedSkuId);
    if (!sku) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are a high-end Digital Marketing Director for "BakersAlley Industrial Bakery".
        
        PRODUCT DATA:
        - Name: ${sku.name}
        - Price: ${currency.format(sku.retailPrice)}
        - Category: ${sku.category}
        - Margin: ${sku.targetMargin}%
        
        CAMPAIGN PARAMETERS:
        - Platform: ${platform}
        - Vibe: ${campaignVibe}
        
        TASK: Generate a complete ad package in strictly valid JSON:
        {
          "headline": "Short punchy hook",
          "caption": "Social media caption with emojis",
          "visualPrompt": "Detailed description for an image generator (like Midjourney) to create the ad creative",
          "audioScript": "A 15-second script for a radio spot or social reel voiceover",
          "hashtags": ["list", "of", "5", "hashtags"]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setAdOutput(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error(e);
      alert("Neural synthesis failed. Check network connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
      <aside className="lg:col-span-4 space-y-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-4">Creative Parameters</h3>
           <div className="space-y-6">
              <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">1. Hero Product</label>
                 <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedSkuId} onChange={e => setSelectedSkuId(e.target.value)}>
                    <option value="">Select Product...</option>
                    {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">2. Channel</label>
                 <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={platform} onChange={e => setPlatform(e.target.value)}>
                    <option value="Instagram">Instagram (Visual Focus)</option>
                    <option value="TikTok">TikTok (Lo-Fi Video)</option>
                    <option value="Facebook">Facebook (Direct Sell)</option>
                    <option value="WhatsApp">WhatsApp (Status Update)</option>
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">3. Creative Vibe</label>
                 <div className="grid grid-cols-2 gap-2">
                    {['Artisanal', 'Discount', 'Luxury', 'Family'].map(v => (
                      <button key={v} onClick={() => setCampaignVibe(v)} className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${campaignVibe === v ? 'bg-indigo-900 border-indigo-900 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>{v}</button>
                    ))}
                 </div>
              </div>
              <button 
                onClick={handleGenerateAd}
                disabled={isGenerating || !selectedSkuId}
                className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all ${isGenerating ? 'bg-indigo-100 text-indigo-400 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black active:scale-95'}`}
              >
                {isGenerating ? 'Synthesizing...' : '✨ Generate Campaign'}
              </button>
           </div>
        </div>
      </aside>

      <main className="lg:col-span-8">
        {adOutput ? (
          <div className="space-y-6 animate-softFade">
             <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex justify-between items-start">
                   <h4 className="text-2xl font-bold font-serif text-slate-900 uppercase">AI Creative Asset</h4>
                   <span className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{platform} Protocol</span>
                </div>

                <div className="space-y-6">
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group relative">
                      <div className="text-[8px] font-black text-indigo-600 uppercase mb-2">Headline & Hook</div>
                      <div className="text-xl font-bold text-slate-900">{adOutput.headline}</div>
                      <button onClick={() => navigator.clipboard.writeText(adOutput.headline)} className="absolute top-4 right-4 text-[9px] font-black text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">COPY</button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 relative group">
                         <div className="text-[8px] font-black text-indigo-400 uppercase mb-3">Visual Creative Prompt</div>
                         <p className="text-xs text-indigo-900 font-medium leading-relaxed italic">"{adOutput.visualPrompt}"</p>
                         <button onClick={() => navigator.clipboard.writeText(adOutput.visualPrompt)} className="absolute top-4 right-4 text-[9px] font-black text-indigo-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100">COPY PROMPT</button>
                      </div>
                      <div className="p-6 bg-amber-50/30 rounded-3xl border border-amber-100 relative group">
                         <div className="text-[8px] font-black text-amber-400 uppercase mb-3">Audio/Voiceover Script</div>
                         <p className="text-xs text-amber-900 font-medium leading-relaxed">"{adOutput.audioScript}"</p>
                         <button onClick={() => navigator.clipboard.writeText(adOutput.audioScript)} className="absolute top-4 right-4 text-[9px] font-black text-amber-300 hover:text-amber-600 opacity-0 group-hover:opacity-100">COPY SCRIPT</button>
                      </div>
                   </div>

                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group">
                      <div className="text-[8px] font-black text-slate-400 uppercase mb-2">Full Caption</div>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{adOutput.caption}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                         {adOutput.hashtags.map((h: string) => <span key={h} className="text-[10px] font-bold text-indigo-500">#{h}</span>)}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="h-full py-32 bg-slate-100/50 rounded-[4rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
             <div className="text-7xl opacity-20 grayscale">🎨</div>
             <p className="text-sm text-slate-400 max-w-sm italic leading-relaxed font-medium">"Select a hero product to generate a neural marketing bundle including headlines, visual prompts, and voiceover scripts."</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdStudio;