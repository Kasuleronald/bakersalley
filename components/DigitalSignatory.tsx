
import React from 'react';
import { DigitalSignature, User, ApprovalStatus } from '../types';

interface DigitalSignatoryProps {
  status: ApprovalStatus;
  signature?: DigitalSignature;
  amount: number;
  currentUser: User;
  onSign: () => void;
  onReject: () => void;
  onEscalate: () => void;
}

const DigitalSignatory: React.FC<DigitalSignatoryProps> = ({ 
  status, signature, amount, currentUser, onSign, onReject, onEscalate 
}) => {
  const hasAuthority = currentUser.role === 'Managing Director' || currentUser.authorityLimit >= amount;

  if (status === 'Authorized' && signature) {
    return (
      <div className="relative p-8 bg-slate-50 rounded-[2.5rem] border-2 border-indigo-100 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-9xl font-black rotate-12">AUTHORIZED</div>
        <div className="space-y-4">
          <div className="text-3xl font-serif text-indigo-900 italic" style={{ fontFamily: 'Georgia, serif' }}>
            {signature.signerName}
          </div>
          <div className="h-px w-48 bg-indigo-200 mx-auto"></div>
          <div className="space-y-1">
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{signature.signerRole}</div>
             <div className="text-[7px] text-indigo-400 font-mono">HASH: {signature.authorityHash}</div>
             <div className="text-[7px] text-slate-400 font-mono">TIMESTAMP: {new Date(signature.timestamp).toLocaleString()}</div>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 text-emerald-500 text-3xl opacity-20">✅</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center gap-6">
       <div className="text-center">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorization Control</h4>
          <p className="text-xs font-bold text-slate-800">
            {status === 'Draft' ? 'Prepare for approval' : 'Review & Sign Document'}
          </p>
       </div>

       <div className="flex gap-3 w-full max-w-md">
          {hasAuthority ? (
            <button 
              onClick={onSign}
              className="flex-1 py-4 bg-indigo-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all"
            >
              Authorize & Sign
            </button>
          ) : (
            <button 
              onClick={onEscalate}
              className="flex-1 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-white transition-all"
            >
              Escalate to Superior
            </button>
          )}
          <button onClick={onReject} className="px-6 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase border border-rose-100">Reject</button>
       </div>
       
       {!hasAuthority && (
         <p className="text-[8px] text-rose-400 font-bold uppercase tracking-widest text-center animate-pulse">
            ⚠️ Document amount ({amount.toLocaleString()}) exceeds your signatory limit ({currentUser.authorityLimit.toLocaleString()})
         </p>
       )}
    </div>
  );
};

export default DigitalSignatory;
