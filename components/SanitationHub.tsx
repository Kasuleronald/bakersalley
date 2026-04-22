
import React, { useState, useMemo } from 'react';
import { SanitationLog, Employee } from '../types';

interface SanitationHubProps {
  employees: Employee[];
}

const CLEANING_ZONES = ['Oven Area', 'Mixing Room', 'Dispatch Gate', 'Storage/Bins', 'Staff Changing Room', 'Washroom Block'];

const SanitationHub: React.FC<SanitationHubProps> = ({ employees }) => {
  const [logs, setLogs] = useState<SanitationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'Checklist' | 'Medical' | 'PestControl'>('Checklist');

  const hygieneStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const cleanedToday = logs.filter(l => l.date.startsWith(today)).length;
    const pendingMedical = employees.filter(e => {
        if (!e.medicalCertExpiry) return true;
        const expiry = new Date(e.medicalCertExpiry);
        return expiry.getTime() < Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
    }).length;

    return { cleanedToday, pendingMedical };
  }, [logs, employees]);

  const handleLogCleaning = (area: string) => {
    const log: SanitationLog = {
      id: `clean-${Date.now()}`,
      area,
      performedBy: 'Shift Supervisor',
      date: new Date().toISOString(),
      type: 'Routine',
      status: 'Verified'
    };
    setLogs([log, ...logs]);
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase">Hygiene & HACCP Control</h2>
          <p className="text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Industrial Sanitation • Food Safety Interlocks</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-sm text-center">
            <div className="text-[10px] font-black text-emerald-600 uppercase mb-2">Zones Sanitized Today</div>
            <div className="text-4xl font-mono font-black text-emerald-700">{hygieneStats.cleanedToday} / {CLEANING_ZONES.length}</div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-rose-100 shadow-sm text-center">
            <div className="text-[10px] font-black text-rose-600 uppercase mb-2">Medical Cert Risks</div>
            <div className="text-4xl font-mono font-black text-rose-700">{hygieneStats.pendingMedical}</div>
            <p className="text-[8px] text-slate-400 mt-2">Expired or Expiring in 30 days</p>
        </div>
        <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center items-center">
            <div className="text-3xl mb-2">🧼</div>
            <div className="text-[10px] font-black text-indigo-300 uppercase">System Status: Sterile</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-xl font-bold font-serif text-slate-900">Floor Cleaning Checklist</h3>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Shift Reset Protocols</span>
           </div>
           <div className="grid grid-cols-1 gap-4">
              {CLEANING_ZONES.map(zone => {
                const isClean = logs.some(l => l.area === zone && l.date.startsWith(new Date().toISOString().split('T')[0]));
                return (
                  <div key={zone} className={`p-6 rounded-[2.5rem] border transition-all flex justify-between items-center ${isClean ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-slate-50 border-slate-100 hover:border-indigo-100'}`}>
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isClean ? 'bg-emerald-500 text-white' : 'bg-white border text-slate-300'}`}>
                           {isClean ? '✓' : '○'}
                        </div>
                        <div>
                           <div className="font-bold text-slate-900 uppercase text-xs">{zone}</div>
                           <p className="text-[9px] text-slate-400 uppercase">Interval: 24 Hours</p>
                        </div>
                     </div>
                     {!isClean && (
                       <button 
                        onClick={() => handleLogCleaning(zone)}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                       >
                         Certify Sanitized
                       </button>
                     )}
                  </div>
                );
              })}
           </div>
        </div>

        <aside className="lg:col-span-5 space-y-6">
           <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
              <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-6 relative z-10">Pest Control Schedule</h4>
              <div className="space-y-4 relative z-10">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase mb-1">Last Fumigation</div>
                    <div className="text-lg font-mono font-bold text-white">12 Dec 2025</div>
                    <div className="text-[8px] text-emerald-400 font-bold uppercase mt-1">Verified Certificate #22109</div>
                 </div>
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase mb-1">Next Inspection</div>
                    <div className="text-lg font-mono font-bold text-amber-400">12 Jan 2026</div>
                    <p className="text-[8px] text-slate-500 mt-2 italic leading-relaxed">Industrial bakeries require monthly professional audits to maintain UNBS S-Mark Certification.</p>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 flex flex-col justify-center items-center text-center">
              <div className="text-5xl mb-4">🛡️</div>
              <p className="text-[11px] text-indigo-900 leading-relaxed italic">
                "Sanitation is not just cleaning; it is defensive manufacturing. A single contamination event can lead to a total product recall, eroding years of brand equity in hours."
              </p>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default SanitationHub;
