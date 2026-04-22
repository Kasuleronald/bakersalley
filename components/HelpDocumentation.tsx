
import React, { useState } from 'react';
import { generateSystemBlueprintPDF } from '../utils/blueprintUtils';
import { generateFullUserManualPDF, generateModuleSpecPDF } from '../utils/manualUtils';
import { TaxConfig } from '../types';
import { HELP_SECTIONS } from '../constants';

interface HelpDocumentationProps {
  taxConfig?: TaxConfig;
}

const COMPARISON_MATRIX = [
  { feature: 'Scaling Path', flexi: 'Manual Data Entry Shift', alley: 'Neural OCR Image Sync', icon: '🚀' },
  { feature: 'Costing', flexi: 'Standard Material Only', alley: 'ABC (Labor + Biomass Energy)', icon: '⚖️' },
  { feature: 'Flow Logic', flexi: 'Static Sheets', alley: 'Visual Kanban MES', icon: '🏗️' },
  { feature: 'Intelligence', flexi: 'Reporting Only', alley: 'Predictive S&OP Audit', icon: '🧠' },
  { feature: 'Data Nexus', flexi: 'Centralized DB Server', alley: 'Zero-Knowledge Private Cloud', icon: '☁️' },
];

const HelpDocumentation: React.FC<HelpDocumentationProps> = ({ taxConfig }) => {
  const [activeSectionId, setActiveSectionId] = useState(HELP_SECTIONS[0].id);
  const activeSection = HELP_SECTIONS.find(s => s.id === activeSectionId);

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-softFade pb-20">
      <header className="text-center space-y-8">
        <div className="inline-block px-4 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg animate-bounce">
           Immediate Assistance Active
        </div>
        <div className="w-24 h-24 bg-indigo-900 text-amber-400 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto shadow-2xl border-4 border-white ring-8 ring-indigo-50">📖</div>
        <div className="space-y-3">
          <h2 className="text-6xl font-bold text-slate-900 font-serif tracking-tight">Help & Manual Hub</h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg italic leading-relaxed">
            "BakersAlley isn't a kitchen utility. It is an industrial framework for Scaling Wealth."
          </p>
        </div>
        
        <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden border border-white/10 group">
           <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10 blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
           <div className="relative z-10 text-left space-y-3 flex-1">
              <h4 className="text-3xl font-bold font-serif text-amber-400">Executive PDF Library</h4>
              <p className="text-sm text-indigo-200 font-bold uppercase tracking-[0.2em] opacity-80">Generate formal system documentation for Board Review.</p>
           </div>
           <div className="relative z-10 flex flex-wrap gap-4 justify-center">
              <button 
                onClick={() => generateFullUserManualPDF(HELP_SECTIONS)}
                className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-500 transition-all flex items-center gap-4 border border-indigo-400 active:scale-95"
              >
                <span>📘</span> Full User Manual
              </button>
              <button 
                onClick={generateSystemBlueprintPDF}
                className="bg-white text-slate-900 px-12 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-amber-400 transition-all flex items-center gap-4 active:scale-95"
              >
                <span>📐</span> Technical Blueprints
              </button>
           </div>
        </div>
      </header>

      {/* COMPETITIVE COMPARISON MATRIX */}
      <section className="bg-white p-12 rounded-[5rem] border border-slate-100 shadow-sm overflow-hidden relative">
         <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
         <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="md:w-1/3 space-y-4">
               <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Legacy vs. Neural Framework</h3>
               <p className="text-sm text-slate-500 leading-relaxed italic">
                  "Traditional ERPs (FlexiBake) help you organize. BakersAlley helps you **predict**. Compare how we bridge the handwriting-to-ledger gap."
               </p>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
               {COMPARISON_MATRIX.map((item, i) => (
                 <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6 group hover:bg-indigo-50 transition-all">
                    <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{item.icon}</div>
                    <div>
                       <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{item.feature}</div>
                       <div className="text-[10px] font-bold text-slate-400 line-through mb-1">{item.flexi}</div>
                       <div className="text-xs font-black text-indigo-900 uppercase">{item.alley}</div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      <div className="flex bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide">
        {HELP_SECTIONS.map((sec) => (
          <button 
            key={sec.id} 
            onClick={() => setActiveSectionId(sec.id)}
            className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-3 ${activeSectionId === sec.id ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="text-lg">{sec.icon}</span> {sec.title.split(' ')[0]}
          </button>
        ))}
      </div>

      <main className="bg-white rounded-[5rem] p-12 md:p-20 shadow-sm border border-slate-50 min-h-[600px] relative overflow-hidden">
        {activeSection ? (
          <div className="space-y-16 animate-fadeIn relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10 border-b border-slate-50 pb-12">
              <div className="flex items-center gap-8">
                <div className="text-7xl p-6 bg-slate-50 rounded-[2.5rem] shadow-inner">{activeSection.icon}</div>
                <div>
                  <h3 className="text-4xl font-bold font-serif text-slate-900">{activeSection.title}</h3>
                  <p className="text-indigo-600 text-xs font-black uppercase tracking-[0.2em] mt-2">Functional Module Documentation</p>
                </div>
              </div>
              <button 
                onClick={() => generateModuleSpecPDF(activeSection)}
                className="px-10 py-4 bg-amber-50 text-amber-700 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-amber-200 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
              >
                📥 Export Unit Spec (PDF)
              </button>
            </div>

            <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                   <div className="h-px w-10 bg-slate-200"></div> Scaling Logic Overview
                </h4>
                <p className="text-xl text-slate-600 font-medium leading-relaxed italic max-w-4xl">
                   "{activeSection.overview}"
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {activeSection.content.map((item, idx) => (
                <div key={idx} className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:border-indigo-300 transition-all hover:bg-white hover:shadow-2xl">
                  <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-900 uppercase tracking-tight">{item.tool}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-indigo-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-20 -translate-y-20 transition-transform group-hover:scale-125"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="text-6xl grayscale opacity-40">📄</div>
                  <div className="flex-1 space-y-4">
                     <h4 className="text-amber-400 font-black uppercase text-[10px] tracking-[0.3em]">Mandatory Scaling Filing</h4>
                     <p className="text-lg text-indigo-100 leading-relaxed italic">
                        "Operation of the **{activeSection.title}** module generates the following outputs for the Board:"
                     </p>
                     <div className="flex flex-wrap gap-3 pt-4">
                        {activeSection.transactionalDocs.map((doc, idx) => (
                          <div key={idx} className="bg-white/10 px-5 py-2 rounded-xl text-[10px] font-black text-white border border-white/10 hover:bg-white/20 transition-all">
                            {doc}
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default HelpDocumentation;
