import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface SocialDiscoveryProps {
  location: string;
  nation: string;
}

const SocialDiscovery: React.FC<SocialDiscoveryProps> = ({ location, nation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [trends, setTrends] = useState<any>(null);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: `Search for trending bakery flavors, bread demands, and pastry social media trends in ${location}, ${nation} for 2025. 
        Identify specific "Web Words" (SEO keywords) that have high volume locally.
        
        Return a strictly valid JSON object:
        {
          "trends": ["list of 5 current trends"],
          "keywords": ["list of 10 high-value local keywords"],
          "sentiment": "Summary of local competitor sentiment",
          "opportunities": ["3 specific product opportunities"]
        }
        Wrap the JSON in a single markdown code block.
        `,
        config: { tools: [{googleSearch: {}}] }
      });

      // Robustly extract JSON from potentially grounded markdown text
      let text = response.text || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) text = jsonMatch[0];
      
      const data = JSON.parse(text);
      setTrends(data);
    } catch (e) {
      console.error(e);
      alert("Web Pulse synchronization failed. Please ensure a valid Pro-tier API key is selected.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-indigo-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4 max-w-2xl">
           <h3 className="text-3xl font-bold font-serif text-amber-400">Neural Web Pulse</h3>
           <p className="text-indigo-100 text-lg leading-relaxed italic">
             "Crawl local search signals to find what ${location} is craving. Use these 'Web Words' in your Instagram captions to trigger local recommendation algorithms."
           </p>
        </div>
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className={`relative z-10 px-12 py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all ${isScanning ? 'bg-indigo-800 text-indigo-400 animate-pulse' : 'bg-white text-slate-900 hover:bg-amber-400'}`}
        >
          {isScanning ? 'Crawling Local Signals...' : '🔍 Scan Local Market'}
        </button>
      </div>

      {trends ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-softFade">
           <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
              <div>
                 <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2 mb-6">High-Velocity Keywords (Web Words)</h4>
                 <div className="flex flex-wrap gap-3">
                    {trends.keywords?.map((k: string) => (
                      <span key={k} className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-700 hover:border-indigo-600 hover:bg-white transition-all cursor-copy" onClick={() => navigator.clipboard.writeText(k)}>
                         {k}
                      </span>
                    ))}
                 </div>
              </div>

              <div>
                 <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b pb-2 mb-6">Market Opportunities Identified</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {trends.opportunities?.map((o: string, idx: number) => (
                      <div key={idx} className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100">
                         <div className="text-2xl mb-2">💡</div>
                         <p className="text-xs font-bold text-amber-900 leading-relaxed italic">"{o}"</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl h-full flex flex-col">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Sentiment Analysis</h4>
                 <p className="text-sm text-indigo-100/70 leading-relaxed italic flex-1">"{trends.sentiment}"</p>
                 <div className="pt-6 border-t border-white/10 mt-6">
                    <div className="text-[8px] font-black text-slate-500 uppercase">Top Search Trends</div>
                    <div className="space-y-2 mt-3">
                       {trends.trends?.map((t: string) => (
                         <div key={t} className="text-xs font-bold text-slate-100 flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> {t}
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="py-20 text-center opacity-30 grayscale">
           <div className="text-8xl mb-4">📡</div>
           <p className="text-[10px] font-black uppercase tracking-widest">Connect to local web signals to begin</p>
        </div>
      )}
    </div>
  );
};

export default SocialDiscovery;