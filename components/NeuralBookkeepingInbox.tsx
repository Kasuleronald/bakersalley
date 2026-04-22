import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Transaction, AccountType, AccountGroup } from '../types';
import { processSmartBookkeeping } from '../services/geminiService';
import TransactionDatePicker from './TransactionDatePicker';

interface NeuralBookkeepingInboxProps {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  accountGroups: AccountGroup[];
  currency: { format: (v: number) => string };
}

const NeuralBookkeepingInbox: React.FC<NeuralBookkeepingInboxProps> = ({ transactions, setTransactions, accountGroups, currency }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [draftEntries, setDraftEntries] = useState<any[]>([]);
  const [auditSummary, setAuditSummary] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv' || extension === 'xlsx') {
        // 1. Spreadsheet Logic
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Send text-based table to Gemini for structural mapping
          const result = await processSmartBookkeeping({ text: JSON.stringify(json.slice(0, 50)) });
          if (result) {
            setDraftEntries(result.entries);
            setAuditSummary(result);
          }
          setIsProcessing(false);
        };
        reader.readAsBinaryString(file);
      } else {
        // 2. Visual Document Logic (PDF/Images)
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          const result = await processSmartBookkeeping({ base64, mimeType: file.type });
          if (result) {
            setDraftEntries(result.entries);
            setAuditSummary(result);
          }
          setIsProcessing(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to process document. Ensure it is a valid PDF or Spreadsheet.");
      setIsProcessing(false);
    }
  };

  const handlePostAll = () => {
    const newTxs: Transaction[] = draftEntries.map((e, i) => ({
      id: `auto-${Date.now()}-${i}`,
      date: e.date,
      description: e.description,
      amount: e.amount,
      type: e.category === 'Sale' ? 'Credit' : 'Debit',
      account: (e.accountHint as AccountType) || 'Bank',
      category: e.category as any,
      subCategory: e.subCategory,
      isOcrVerified: true
    }));

    setTransactions([...newTxs, ...transactions]);
    setDraftEntries([]);
    setAuditSummary(null);
    alert(`${newTxs.length} entries successfully journalized into the master ledger.`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10 border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4">
           <div className="flex items-center gap-3">
              <span className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center text-xl shadow-lg">📥</span>
              <h3 className="text-3xl font-bold font-serif text-white uppercase tracking-tighter">Neural Bookkeeping Inbox</h3>
           </div>
           <p className="text-indigo-200 text-lg max-w-xl italic leading-relaxed">
             "Drop your phone-stored PDFs, Receipts, or Excel Exports here. The AI will audit, categorize, and draft your ledger entries automatically."
           </p>
        </div>
        
        <div className="relative z-10">
           <input 
            type="file" 
            ref={fileInputRef} 
            onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} 
            className="hidden" 
            accept=".pdf,.csv,.xlsx,.jpg,.png,.jpeg"
           />
           <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className={`px-12 py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all ${isProcessing ? 'bg-white/10 text-indigo-400 animate-pulse' : 'bg-white text-slate-900 hover:bg-blue-400 active:scale-95'}`}
           >
             {isProcessing ? 'Neural Mapping...' : '⚡ Upload Source File'}
           </button>
        </div>
      </div>

      {draftEntries.length > 0 ? (
        <div className="space-y-8 animate-softFade">
           <div className="flex justify-between items-end bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div>
                 <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">AI Audit Result</div>
                 <h4 className="text-2xl font-bold font-serif text-slate-900 uppercase">{auditSummary?.docType} Detected</h4>
                 <p className="text-xs text-slate-400 font-medium">{auditSummary?.summary}</p>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setDraftEntries([])} className="px-8 py-3 bg-slate-100 text-slate-400 rounded-xl font-black uppercase text-[10px]">Discard Batch</button>
                 <button onClick={handlePostAll} className="px-12 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-black transition-all">Post {draftEntries.length} to Ledger</button>
              </div>
           </div>

           <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                       <th className="px-10 py-6">Extracted Date</th>
                       <th className="px-6 py-6">Description / Memo</th>
                       <th className="px-6 py-6">AI Classification</th>
                       <th className="px-10 py-6 text-right">Extracted Magnitude</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {draftEntries.map((entry, idx) => (
                       <tr key={idx} className="group hover:bg-blue-50/30 transition-colors">
                          <td className="px-10 py-5">
                             <input type="date" className="bg-transparent border-none font-bold text-xs outline-none" value={entry.date} onChange={e => {
                                const next = [...draftEntries];
                                next[idx].date = e.target.value;
                                setDraftEntries(next);
                             }} />
                          </td>
                          <td className="px-6 py-5">
                             <input className="w-full bg-transparent border-none font-bold text-xs uppercase text-slate-900 outline-none" value={entry.description} onChange={e => {
                                const next = [...draftEntries];
                                next[idx].description = e.target.value;
                                setDraftEntries(next);
                             }} />
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black uppercase text-blue-600 tracking-tighter">{entry.subCategory}</span>
                                <span className="text-[7px] font-bold text-slate-300 uppercase">Via: {entry.accountHint}</span>
                             </div>
                          </td>
                          <td className="px-10 py-5 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <span className="text-[9px] font-black text-slate-300">UGX</span>
                                <input type="number" className="w-32 bg-transparent border-none text-right font-mono font-black text-lg text-slate-900 outline-none" value={entry.amount} onChange={e => {
                                   const next = [...draftEntries];
                                   next[idx].amount = parseFloat(e.target.value) || 0;
                                   setDraftEntries(next);
                                }} />
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : !isProcessing && (
        <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-6">
           <div className="text-8xl mb-6 opacity-20 grayscale">📜</div>
           <h4 className="text-2xl font-bold font-serif text-slate-300 uppercase tracking-widest">Inbox Empty</h4>
           <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2 italic leading-relaxed">
             The neural intake engine supports high-speed classification of mobile PDF downloads and spreadsheet exports.
           </p>
        </div>
      )}

      <div className="p-10 bg-indigo-50 rounded-[4rem] border border-indigo-100 flex flex-col md:flex-row items-center gap-10">
         <div className="text-6xl grayscale opacity-30">🤖</div>
         <div>
            <h4 className="text-xl font-bold text-indigo-900 font-serif mb-2 uppercase">Neural Logic Advantage</h4>
            <p className="text-sm text-indigo-700 leading-relaxed italic max-w-4xl">
               "Automation isn't just about reading text; it's about context. Our AI identifies that 'NWSC' on a bank statement refers to 'Water Utilities' and 'Mtn MoMo' likely represents 'Mobile Banking' transfers, mapping them instantly to your chart of accounts."
            </p>
         </div>
      </div>
    </div>
  );
};

export default NeuralBookkeepingInbox;