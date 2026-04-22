import React, { useMemo } from 'react';
import { Ingredient, Batch } from '../types';

interface ExpiryAuditProps {
  ingredients: Ingredient[];
  currency: { format: (v: number) => string };
}

const ExpiryAudit: React.FC<ExpiryAuditProps> = ({ ingredients, currency }) => {
  const expiryData = useMemo(() => {
    const today = new Date();
    const list: { ingName: string, batch: Batch, status: 'Expired' | 'Critical' | 'Warning' | 'Safe' }[] = [];

    ingredients.forEach(ing => {
      (ing.batches || []).forEach(batch => {
        const exp = new Date(batch.expiryDate);
        const diffDays = (exp.getTime() - today.getTime()) / (1000 * 3600 * 24);
        
        let status: 'Expired' | 'Critical' | 'Warning' | 'Safe' = 'Safe';
        if (diffDays < 0) status = 'Expired';
        else if (diffDays <= 3) status = 'Critical';
        else if (diffDays <= 7) status = 'Warning';

        list.push({ ingName: ing.name, batch, status });
      });
    });

    return list.sort((a, b) => new Date(a.batch.expiryDate).getTime() - new Date(b.batch.expiryDate).getTime());
  }, [ingredients]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Expired': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Critical': return 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';
      case 'Warning': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-10 py-8 bg-rose-950 text-white flex justify-between items-center border-b-4 border-rose-500">
           <div>
              <h3 className="text-2xl font-bold font-serif">FEFO Spoilage Audit</h3>
              <p className="text-rose-300 text-[10px] font-black uppercase tracking-widest mt-1">First-Expiry, First-Out Enforcement</p>
           </div>
           <div className="text-right">
              <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Items at Risk</div>
              <div className="text-3xl font-mono font-black text-white">{expiryData.filter(x => x.status !== 'Safe').length}</div>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-10 py-6">Material Description</th>
                <th className="px-6 py-6">Batch ID</th>
                <th className="px-6 py-6 text-center">Remaining Vol</th>
                <th className="px-6 py-6 text-center">Expiry Date</th>
                <th className="px-10 py-6 text-right">Protection Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expiryData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-all">
                  <td className="px-10 py-5 font-black text-slate-900 text-sm uppercase">{item.ingName}</td>
                  <td className="px-6 py-5 font-mono text-xs text-indigo-400">#{item.batch.id.slice(-8)}</td>
                  <td className="px-6 py-5 text-center font-mono font-bold text-slate-900">{item.batch.quantity.toLocaleString()}</td>
                  <td className="px-6 py-5 text-center font-bold text-xs text-slate-500">{new Date(item.batch.expiryDate).toLocaleDateString()}</td>
                  <td className="px-10 py-5 text-right">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border ${getStatusStyles(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {expiryData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest">No active batches in storage bins.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-indigo-900 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-6xl opacity-30 grayscale shrink-0">🍎</div>
         <div className="relative z-10">
            <h4 className="text-2xl font-bold font-serif text-amber-400 mb-4 uppercase">Industrial Spoilage Shield</h4>
            <p className="text-sm text-indigo-100/70 leading-relaxed max-w-4xl italic">
              "Bakery ingredients have a terminal shelf life. The FEFO (First-Expiring, First-Out) logic ensures that your Storekeeper issues the oldest batches to the floor first. This audit view flags 'Value-at-Risk' to trigger emergency sales or promotional pushes for slow-moving ingredients before they expire."
            </p>
         </div>
      </div>
    </div>
  );
};

export default ExpiryAudit;