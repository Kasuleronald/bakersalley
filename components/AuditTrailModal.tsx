
import React from 'react';
import { AuditLogEntry } from '../types';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
  entityName: string;
}

const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose, logs, entityName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-indigo-50 overflow-hidden flex flex-col max-h-[80vh] animate-fadeIn">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold font-serif">Audit Trail: {entityName}</h3>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1">Manual Corrections History</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">✕ Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          {logs.length > 0 ? (
            <div className="relative pl-8 space-y-10">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-100"></div>
              {logs.map((log, idx) => (
                <div key={idx} className="relative">
                   <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-4 border-white shadow-sm"></div>
                   <div className="space-y-3">
                      <div className="flex justify-between items-start">
                         <div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter block">{log.user}</span>
                            <span className="text-[8px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                         </div>
                         <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-400 uppercase">Field: {log.field}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Old Value</span>
                            <span className="text-xs font-mono font-bold text-slate-500 line-through">{String(log.oldValue)}</span>
                         </div>
                         <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <span className="text-[7px] font-black text-emerald-400 uppercase block mb-1">New Value</span>
                            <span className="text-xs font-mono font-black text-emerald-900">{String(log.newValue)}</span>
                         </div>
                      </div>
                      <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                         <span className="text-[8px] font-black text-amber-600 uppercase block mb-1">Reason for Correction</span>
                         <p className="text-xs text-amber-900 italic font-medium leading-relaxed">"{log.reason}"</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-300 italic uppercase font-black text-[10px] tracking-widest">
               No manual corrections detected in the lifecycle of this record.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrailModal;
