
import React from 'react';
import { User } from '../types';
import { SYSTEM_CHANGELOG, SYSTEM_VERSION, FeatureUpdate } from '../constants';

interface FeatureUpdatePortalProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onClose: () => void;
}

const FeatureUpdatePortal: React.FC<FeatureUpdatePortalProps> = ({ user, onUpdateUser, onClose }) => {
  const missedFeatures = SYSTEM_CHANGELOG.filter(f => !user.seenFeatures?.includes(f.id));

  if (missedFeatures.length === 0) return null;

  const handleAcknowledge = () => {
    const allIds = SYSTEM_CHANGELOG.map(f => f.id);
    onUpdateUser({
      seenFeatures: allIds,
      systemVersion: SYSTEM_VERSION
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6">
      <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-softFade border border-white/20">
        <div className="bg-indigo-950 p-10 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
          <div className="relative z-10 flex items-center gap-6">
             <div className="w-20 h-20 bg-amber-500 text-slate-900 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl animate-bounce">⚡</div>
             <div>
                <h2 className="text-3xl font-black font-serif tracking-tighter uppercase">Automated Feature Push</h2>
                <div className="flex items-center gap-3 mt-1">
                   <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-white/10 text-indigo-200">System v{SYSTEM_VERSION}</span>
                   <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">{missedFeatures.length} New Modules Ready</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
           <p className="text-slate-500 font-medium italic text-sm leading-relaxed">
             "Your workspace has been automatically upgraded with the latest industrial logic. Review the new capabilities deployed to your registered account below."
           </p>

           <div className="space-y-4">
              {missedFeatures.map((feat: FeatureUpdate) => (
                <div key={feat.id} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:border-indigo-200 transition-all flex items-start gap-8">
                   <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {feat.icon}
                   </div>
                   <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                         <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{feat.title}</h4>
                         <span className="text-[8px] font-black text-indigo-400 uppercase bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{feat.module} Hub</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic">"{feat.description}"</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
           <div className="text-left">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signed By</div>
              <div className="text-sm font-bold text-slate-900">{user.name} ({user.role})</div>
           </div>
           <button 
            onClick={handleAcknowledge}
            className="w-full md:w-auto px-16 py-5 bg-indigo-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95"
           >
              Update My Workspace
           </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureUpdatePortal;
