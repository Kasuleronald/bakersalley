import React, { useState } from 'react';

interface ModuleAiInteractionProps {
  title: string;
  onExecute: (intent: string) => Promise<void>;
  isLoading: boolean;
  suggestions: string[];
  placeholder?: string;
  response?: string | React.ReactNode;
  theme?: 'indigo' | 'emerald' | 'rose' | 'amber';
}

const ModuleAiInteraction: React.FC<ModuleAiInteractionProps> = ({ 
  title, onExecute, isLoading, suggestions, placeholder, response, theme = 'indigo' 
}) => {
  const [intent, setIntent] = useState('');

  const themes = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-100', button: 'bg-indigo-900', accent: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-100', button: 'bg-emerald-900', accent: 'text-emerald-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-100', button: 'bg-rose-900', accent: 'text-rose-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-100', button: 'bg-amber-900', accent: 'text-amber-600' },
  };

  const currentTheme = themes[theme];

  return (
    <div className={`${currentTheme.bg} p-10 rounded-[3.5rem] border ${currentTheme.border} shadow-sm space-y-8 animate-fadeIn`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${currentTheme.button} text-white rounded-2xl flex items-center justify-center text-xl shadow-lg`}>🧠</div>
            <div>
               <h3 className={`text-xl font-bold font-serif ${currentTheme.text} uppercase`}>{title}</h3>
               <p className={`text-[10px] font-black uppercase tracking-widest opacity-60`}>Industrial Neural Audit Engine</p>
            </div>
         </div>
         <button 
           onClick={() => onExecute(intent)}
           disabled={isLoading}
           className={`${currentTheme.button} text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all disabled:opacity-30 flex items-center gap-3`}
         >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Thinking...
              </>
            ) : 'Execute Neural Audit'}
         </button>
      </div>

      <div className="space-y-4">
         <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ${currentTheme.accent}`}>Custom Intent (Optional)</label>
         <textarea 
            className="w-full p-6 bg-white/50 border-none rounded-[2rem] text-sm font-medium h-24 outline-none focus:ring-2 focus:ring-current transition-all placeholder:text-slate-300 shadow-inner"
            placeholder={placeholder || "How should I focus the analysis? e.g. 'Focus on maximizing profit' or 'Consider fuel inflation'"}
            value={intent}
            onChange={e => setIntent(e.target.value)}
         />
         
         <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => setIntent(s)}
                className="bg-white px-4 py-2 rounded-xl text-[9px] font-black uppercase border border-slate-100 hover:border-indigo-400 transition-all text-slate-500 hover:text-indigo-600 shadow-sm"
              >
                💡 {s}
              </button>
            ))}
         </div>
      </div>

      {response && (
        <div className="pt-8 border-t border-white/50 animate-softFade">
           {typeof response === 'string' ? (
             <div className={`p-8 bg-white/40 rounded-[2.5rem] border border-white/50 italic text-sm font-medium leading-relaxed ${currentTheme.text} whitespace-pre-wrap`}>
                {response}
             </div>
           ) : (
             response
           )}
        </div>
      )}
    </div>
  );
};

export default ModuleAiInteraction;