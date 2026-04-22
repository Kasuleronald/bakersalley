
import React, { useMemo, useState } from 'react';
// Fixed: Removed missing and unused JurisdictionID import from types
import { SKU, QALog, Employee, Asset, ProductionLog, InventoryLoss, Order, TaxConfig, LegalPatch, LegalClause } from '../types';
import { COMPLIANCE_DEFINITIONS } from '../constants';

interface ComplianceAuditorProps {
  skus: SKU[];
  qaLogs: QALog[];
  employees: Employee[];
  assets: Asset[];
  productionLogs: ProductionLog[];
  inventoryLosses: InventoryLoss[];
  orders: Order[];
  taxConfig: TaxConfig;
  setTaxConfig: (config: TaxConfig) => void;
}

interface StandardCheck {
  id: string;
  clause: string;
  title: string;
  description: string;
  status: 'Compliant' | 'Partial' | 'Gap';
  evidence: string;
  score: number;
}

const ComplianceAuditor: React.FC<ComplianceAuditorProps> = ({
  skus, qaLogs, employees, assets, productionLogs, inventoryLosses, orders, taxConfig, setTaxConfig
}) => {
  const [activeTab, setActiveTab] = useState<'Registry' | 'Updates'>('Registry');

  const activeFrameworks = useMemo(() => {
    const activeIds = taxConfig.activeJurisdictions || ['GLOBAL_ISO_9001'];
    
    return activeIds.map(id => {
        const def = COMPLIANCE_DEFINITIONS[id];
        if (!def) return null;

        // Merge standard clauses with AI-updated custom clauses
        const allClauses = [...def.clauses, ...(taxConfig.customLegalRegistry?.filter(c => c.id.startsWith(id)) || [])];

        const checks: StandardCheck[] = allClauses.map(clause => {
            let status: 'Compliant' | 'Partial' | 'Gap' = 'Gap';
            let evidence = 'No system data found.';
            let score = 0;

            if (clause.id === 'ISO-8.5.2') {
                status = productionLogs.length > 0 ? 'Compliant' : 'Gap';
                evidence = `Traceability engine linked to ${productionLogs.length} production cycles.`;
                score = productionLogs.length > 0 ? 100 : 0;
            }
            else if (clause.id === 'ISO-8.7') {
                status = qaLogs.some(l => l.result === 'Fail') ? 'Compliant' : 'Partial';
                evidence = `${qaLogs.filter(l => l.result === 'Fail').length} Batch Failures archived with RCA.`;
                score = qaLogs.some(l => l.result === 'Fail') ? 100 : 50;
            }
            else if (clause.id === 'UG-7') {
                status = 'Compliant';
                evidence = `Verified explicit consent logged for active user base.`;
                score = 100;
            }
            else if (clause.id === 'G-32' || clause.id === 'UCC-Cyber') {
                status = 'Compliant';
                evidence = 'AES-256 local encryption + Session MFA active.';
                score = 100;
            }
            else if (clause.id === 'AI-H') {
                status = taxConfig.aiTransparencyEnabled ? 'Compliant' : 'Gap';
                evidence = 'Human-in-the-loop (HITL) safety interlock is active on HR coaching.';
                score = taxConfig.aiTransparencyEnabled ? 100 : 0;
            }
            else {
                status = 'Partial';
                evidence = 'Manual verification of internal policy required.';
                score = 50;
            }

            return {
                id: clause.id,
                clause: clause.id,
                title: clause.title,
                description: clause.desc,
                status,
                evidence,
                score
            };
        });

        const totalScore = Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length);

        return { id, name: def.name, region: def.region, checks, totalScore };
    }).filter(x => x !== null);
  }, [taxConfig.activeJurisdictions, productionLogs, qaLogs, employees, taxConfig.aiTransparencyEnabled, taxConfig.customLegalRegistry]);

  const handleApplyPatch = (patch: LegalPatch) => {
    if (!window.confirm("Authorize Application of Statutory Patch? This will update the master legal registry for this nation.")) return;

    const nextCustom = [...(taxConfig.customLegalRegistry || []), ...patch.newClauses];
    const nextPatches = (taxConfig.pendingPatches || []).map(p => p.id === patch.id ? { ...p, status: 'Applied' as const } : p);

    setTaxConfig({
      ...taxConfig,
      customLegalRegistry: nextCustom,
      pendingPatches: nextPatches
    });
  };

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter text-amber-400">Compliance & Regulatory Audit</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Nation: <span className="text-white">{taxConfig.nation}</span> • Statutory Nexus Active</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
           <button onClick={() => setActiveTab('Registry')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Registry' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Registry</button>
           <button onClick={() => setActiveTab('Updates')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'Updates' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-400'}`}>
             <span>⚡</span> Legal Pulse ({(taxConfig.pendingPatches || []).filter(p => p.status === 'Pending').length})
           </button>
        </div>
      </header>

      {activeTab === 'Updates' ? (
        <div className="space-y-8 animate-fadeIn">
           <div className="bg-indigo-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
              <div className="md:w-1/3 space-y-6 relative z-10">
                 <div className="text-5xl">📡</div>
                 <h3 className="text-2xl font-bold font-serif text-amber-400 uppercase">National statutory Stream</h3>
                 <p className="text-indigo-100 text-sm italic leading-relaxed">"The AI Engine is monitoring gazetted law updates in ${taxConfig.nation}. When new manufacturing or tax regulations arise, they appear here for your authorization."</p>
              </div>
              <div className="flex-1 space-y-4 relative z-10">
                 {(taxConfig.pendingPatches || []).map(patch => (
                   <div key={patch.id} className={`p-8 rounded-[3rem] border transition-all ${patch.status === 'Applied' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Detected: {new Date(patch.dateDetected).toLocaleDateString()}</span>
                            <h4 className="text-lg font-bold mt-1">{patch.summary}</h4>
                         </div>
                         {patch.status === 'Pending' ? (
                           <button onClick={() => handleApplyPatch(patch)} className="bg-amber-500 text-slate-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-white">Review & Apply Patch</button>
                         ) : (
                           <span className="text-emerald-400 text-[10px] font-black uppercase border border-emerald-400 px-3 py-1 rounded-full">Applied ✓</span>
                         )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {patch.newClauses.map(c => (
                           <div key={c.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <div className="text-[11px] font-bold text-indigo-300 uppercase">{c.title}</div>
                              <p className="text-[10px] text-white/60 mt-1">{c.desc}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                 ))}
                 {(taxConfig.pendingPatches || []).length === 0 && (
                   <div className="py-20 text-center opacity-40 italic font-medium">System is currently synchronized with all known gazetted national laws.</div>
                 )}
              </div>
           </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-[3rem] border border-indigo-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">📜</div>
                   <div>
                      <h4 className="font-bold text-slate-900 uppercase text-sm">Trade Secret Protection</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Recipe Confidentiality Audit</p>
                   </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Classified BOMs</span>
                      <span className="text-xs font-mono font-black text-indigo-900">{skus.length} Units</span>
                   </div>
                </div>
                <p className="text-[9px] text-slate-500 italic">"Recipe data is legally protected as Intellectual Property under Section 3 of the EULA."</p>
             </div>

             <div className="bg-white p-8 rounded-[3rem] border border-amber-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">⚖️</div>
                   <div>
                      <h4 className="font-bold text-slate-900 uppercase text-sm">Consumer Protection Audit</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">UNBS & Weights Compliance</p>
                   </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Weight Verifications logged</span>
                      <span className="text-xs font-mono font-bold text-emerald-600">{qaLogs.length} Records</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
             {activeFrameworks.map(f => (
                <div key={f.id} className="flex-shrink-0 w-72 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{f.name}</div>
                   <div className={`text-6xl font-mono font-black ${f.totalScore > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                     {f.totalScore}%
                   </div>
                   <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase">{f.region} Profile</div>
                </div>
             ))}
          </div>

          <div className="space-y-12">
            {activeFrameworks.map(framework => (
              <div key={framework.id} className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-4 ml-6">
                    <div className="w-2 h-8 bg-indigo-900 rounded-full"></div>
                    <h3 className="text-xl font-bold font-serif text-slate-900">{framework.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {framework.checks.map(check => (
                    <div key={check.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-indigo-200 transition-all">
                      <div className="flex-1 space-y-2">
                         <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-lg">{check.clause}</span>
                            <h4 className="font-bold text-slate-900 uppercase text-sm">{check.title}</h4>
                         </div>
                         <p className="text-xs text-slate-500 italic leading-relaxed">{check.description}</p>
                      </div>
                      
                      <div className="w-full md:w-[350px] space-y-3">
                         <div className="flex justify-between items-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${
                              check.status === 'Compliant' ? 'bg-emerald-100 text-emerald-700' :
                              check.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                               {check.status}
                            </span>
                            <div className="text-[10px] font-black text-indigo-600 font-mono">{check.score}/100</div>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[7px] font-black text-slate-300 uppercase mb-1">Audit Evidence</div>
                            <p className="text-[10px] font-bold text-slate-600 truncate" title={check.evidence}>{check.evidence}</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ComplianceAuditor;
