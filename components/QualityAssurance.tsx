import React, { useState, useMemo } from 'react';
import { 
  SKU, QALog, Employee, QCParameters, QCParameterSpec, TaxConfig, 
  Ingredient, FinishedGood, Sale, Transaction, Overhead, Customer, 
  Order, Asset, Loan, SupplierInvoice, ProductionLog, InventoryLoss, DefectCategory
} from '../types';
import { analyzeQualityFailure } from '../services/geminiService';
import { generateNCR_ReportPDF } from '../utils/exportUtils';
import { financialEngine } from '../services/financialEngine';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';

interface QualityAssuranceProps {
  skus: SKU[];
  qaLogs: QALog[];
  setQaLogs: (logs: QALog[]) => void;
  employees: Employee[];
  taxConfig: TaxConfig;
  currency?: { format: (v: number) => string; formatCompact: (v: number) => string; active: any };
  ingredients?: Ingredient[];
  finishedGoods?: FinishedGood[];
  sales?: Sale[];
  transactions?: Transaction[];
  overheads?: Overhead[];
  customers?: Customer[];
  orders?: Order[];
  assets?: Asset[];
  loans?: Loan[];
  invoices?: SupplierInvoice[];
  productionLogs?: ProductionLog[];
  inventoryLosses?: InventoryLoss[];
}

const DEFAULT_BAKERY_SPECS: QCParameterSpec[] = [
  { id: 'p1', name: 'Actual Mass', type: 'Numeric', unit: 'g' },
  { id: 'p2', name: 'Internal Temp', type: 'Numeric', unit: '°C' },
  { id: 'p3', name: 'Color Quality', type: 'Selection', options: ['Pass', 'Variance', 'Reject'] },
  { id: 'p4', name: 'Structural Integrity', type: 'Selection', options: ['Firm', 'Loose', 'Defective'] }
];

const DEFECT_TYPES: DefectCategory[] = ['Crumb Texture', 'Crust Color', 'Shape/Form', 'Weight Variance', 'Internal Temp', 'Contamination', 'Packaging', 'Proofing', 'Under-baked', 'Over-baked'];

const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981', '#1e1b4b', '#64748b', '#db2777', '#7c3aed'];

const QualityAssurance: React.FC<QualityAssuranceProps> = ({ 
  skus, qaLogs, setQaLogs, employees, taxConfig, currency,
  ingredients = [], finishedGoods = [], sales = [], transactions = [], 
  overheads = [], customers = [], orders = [], assets = [], 
  loans = [], invoices = [], productionLogs = [], inventoryLosses = []
}) => {
  const [activeTab, setActiveTab] = useState<'Tests' | 'NCR' | 'Defect_Analytics' | 'Performance' | 'Financial_Ratios'>('Defect_Analytics');
  const [showLogForm, setShowLogForm] = useState(false);
  
  const activeSpecs = useMemo(() => {
    return taxConfig.industryQCSpecs && taxConfig.industryQCSpecs.length > 0 
      ? taxConfig.industryQCSpecs 
      : DEFAULT_BAKERY_SPECS;
  }, [taxConfig.industryQCSpecs]);

  const defectParetoData = useMemo(() => {
    const map: Record<string, number> = {};
    DEFECT_TYPES.forEach(d => map[d] = 0);
    
    qaLogs.filter(l => l.result === 'Fail' && l.defectType).forEach(l => {
      map[l.defectType!] += 1;
    });

    return Object.entries(map)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [qaLogs]);

  const [newLog, setNewLog] = useState<Partial<QALog>>({
    skuId: '',
    responsiblePersonnelId: '',
    result: 'Pass',
    defectType: undefined,
    parameters: {}
  });

  const ratioIntel = useMemo(() => {
    return financialEngine.calculateRatioIntelligence({
      ingredients, finishedGoods, skus, sales, transactions, employees, overheads, customers, orders, assets, loans, invoices, productionLogs, inventoryLosses
    });
  }, [ingredients, finishedGoods, skus, sales, transactions, employees, overheads, customers, orders, assets, loans, invoices, productionLogs, inventoryLosses]);

  const ratioChartData = useMemo(() => {
    const getRatioCategory = (name: string, value: number) => {
      if (name === 'Current Ratio') {
        if (value > 2.0) return { label: 'Good', color: '#10b981' };
        if (value >= 1.2) return { label: 'Average', color: '#f59e0b' };
        return { label: 'Poor', color: '#ef4444' };
      }
      if (name === 'Quick Ratio') {
        if (value > 1.0) return { label: 'Good', color: '#10b981' };
        if (value >= 0.7) return { label: 'Average', color: '#f59e0b' };
        return { label: 'Poor', color: '#ef4444' };
      }
      if (name === 'Debt-to-Equity') {
        if (value < 1.0) return { label: 'Good', color: '#10b981' };
        if (value <= 2.0) return { label: 'Average', color: '#f59e0b' };
        return { label: 'Poor', color: '#ef4444' };
      }
      if (name === 'ROA') {
        if (value > 10) return { label: 'Good', color: '#10b981' };
        if (value >= 5) return { label: 'Average', color: '#f59e0b' };
        return { label: 'Poor', color: '#ef4444' };
      }
      return { label: 'N/A', color: '#94a3b8' };
    };

    const data = [
      { name: 'Current Ratio', value: ratioIntel.liquidity.currentRatio },
      { name: 'Quick Ratio', value: ratioIntel.liquidity.quickRatio },
      { name: 'Debt-to-Equity', value: ratioIntel.leverage.debtToEquity },
      { name: 'ROA', value: ratioIntel.profitability.roa }
    ];

    return data.map(d => ({
      ...d,
      ...getRatioCategory(d.name, d.value)
    }));
  }, [ratioIntel]);

  const handleAddLog = () => {
    if (!newLog.skuId || !newLog.responsiblePersonnelId) return;

    const log: QALog = {
      id: `qa-${Date.now()}`,
      skuId: newLog.skuId!,
      responsiblePersonnelId: newLog.responsiblePersonnelId!,
      date: new Date().toISOString(),
      result: newLog.result as any,
      defectType: newLog.result === 'Fail' ? newLog.defectType as DefectCategory : undefined,
      parameters: newLog.parameters as QCParameters,
      notes: newLog.notes,
      ...(newLog.result === 'Fail' ? {
        ncrDetails: {
          rootCause: 'Pending Forensic Audit',
          disposition: 'Seconds / Scrap',
          actionTaken: 'Batch quarantined. Machine calibration required.'
        }
      } : {})
    };

    setQaLogs([log, ...qaLogs]);
    setShowLogForm(false);
    setNewLog({ skuId: '', responsiblePersonnelId: '', result: 'Pass', defectType: undefined, parameters: {} });
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter text-amber-400">Industrial Quality Lab</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
             Defect Categorization • Pareto Audit • ISO 9001 Alignment
          </p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
          {['Defect_Analytics', 'Financial_Ratios', 'Tests', 'NCR', 'Performance'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>{tab.replace(/_/g, ' ')}</button>
          ))}
        </div>
      </header>

      {activeTab === 'Defect_Analytics' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Defect Frequency (Pareto)</h3>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Root Cause Priority</span>
                 </div>
                 <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={defectParetoData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#cbd5e1'}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1.5rem', border: 'none'}} />
                          <Bar name="Failure Count" dataKey="count" radius={[10, 10, 0, 0]} barSize={50}>
                             {defectParetoData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                 <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl h-full flex flex-col justify-center">
                    <div className="text-5xl mb-6">📉</div>
                    <h4 className="text-xl font-bold font-serif text-amber-400 mb-4">Quality Cost Directives</h4>
                    <p className="text-sm text-indigo-100 leading-relaxed italic mb-8">
                       "Your most frequent defect is **{defectParetoData[0]?.name || 'N/A'}**. By resolving the root cause of this specific failure, you stand to recover an estimated {currency?.formatCompact(defectParetoData[0]?.count * 50000) || 'significant'} in wasted material value this month."
                    </p>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                       <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Defect Hierarchy</h5>
                       <div className="space-y-2">
                          {defectParetoData.slice(0, 3).map((d, i) => (
                            <div key={i} className="flex justify-between text-xs font-bold">
                               <span className="text-slate-400">#{i+1} {d.name}</span>
                               <span className="text-white">{d.count} Events</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Financial_Ratios' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                 <div>
                   <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Health Audit: Financial Ratios</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase mt-1">Cross-Functional Stability Metrics</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                       <span className="text-[8px] font-black uppercase text-slate-400">Good</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                       <span className="text-[8px] font-black uppercase text-slate-400">Average</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                       <span className="text-[8px] font-black uppercase text-slate-400">Poor</span>
                    </div>
                 </div>
              </div>
              
              <div className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratioChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                       <Tooltip 
                        cursor={{ fill: '#f8fafc' }} 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-white/10">
                                <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">{data.name}</div>
                                <div className="text-xl font-mono font-black">{data.value.toFixed(2)}</div>
                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></div>
                                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: data.color }}>Status: {data.label}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                       />
                       <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                          {ratioChartData.map((entry, index) => (
                             <Cell key={index} fill={entry.color} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ratioChartData.map(r => (
                <div key={r.name} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center text-center group hover:border-indigo-100 transition-all">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{r.name}</div>
                   <div className="text-3xl font-mono font-black text-slate-900 mb-2">{r.value.toFixed(2)}</div>
                   <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border`} style={{ backgroundColor: `${r.color}20`, color: r.color, borderColor: `${r.color}40` }}>
                      {r.label}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'Tests' && (
        <div className="space-y-6 animate-fadeIn">
           <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div>
                 <h3 className="text-xl font-bold font-serif text-slate-900">Forensic Testing Pad</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase mt-1">Detailed Defect Logging & Sample Verification</p>
              </div>
              <button onClick={() => setShowLogForm(true)} className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">+ Log Defect Test</button>
           </div>

           {showLogForm && (
             <div className="bg-white p-12 rounded-[4rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                   <div className="lg:col-span-4 space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Batch Context</h4>
                      <div className="space-y-4">
                         <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Subject SKU</label>
                            <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newLog.skuId} onChange={e => setNewLog({...newLog, skuId: e.target.value})}>
                              <option value="">Select SKU...</option>
                              {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Lead Technician</label>
                            <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newLog.responsiblePersonnelId} onChange={e => setNewLog({...newLog, responsiblePersonnelId: e.target.value})}>
                              <option value="">Choose personnel...</option>
                              {employees.filter(e => e.department === 'Production' || e.department === 'Quality Assurance').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                         </div>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-50 space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Final Verdict</h4>
                         <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newLog.result} onChange={e => setNewLog({...newLog, result: e.target.value as any})}>
                            <option value="Pass">VERIFIED PASS ✓</option>
                            <option value="Fail">DEFECT DETECTED ✕</option>
                         </select>
                         
                         {newLog.result === 'Fail' && (
                           <div className="animate-fadeIn">
                              <label className="block text-[8px] font-black text-rose-600 uppercase mb-2">Defect Primary Category</label>
                              <select className="w-full p-4 bg-rose-50 text-rose-900 border-none rounded-2xl font-black text-xs uppercase" value={newLog.defectType} onChange={e => setNewLog({...newLog, defectType: e.target.value as DefectCategory})}>
                                 <option value="">Identify Defect...</option>
                                 {DEFECT_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="lg:col-span-8 space-y-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Parameter Testing (Samples)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {activeSpecs.map(spec => (
                           <div key={spec.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-300 transition-all">
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-3">{spec.name} {spec.unit ? `(${spec.unit})` : ''}</label>
                              {spec.type === 'Numeric' ? (
                                <input type="number" className="w-full bg-white rounded-xl p-3 font-mono font-black text-xl outline-none shadow-inner" value={newLog.parameters?.[spec.id] || ''} onChange={e => setNewLog({...newLog, parameters: {...newLog.parameters!, [spec.id]: parseFloat(e.target.value) || 0}})} />
                              ) : (
                                <select className="w-full bg-white rounded-xl p-3 font-bold text-xs outline-none shadow-inner" value={newLog.parameters?.[spec.id] || ''} onChange={e => setNewLog({...newLog, parameters: {...newLog.parameters!, [spec.id]: e.target.value}})}>
                                   <option value="">Choose Observation...</option>
                                   {spec.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              )}
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="flex justify-end gap-3 pt-8 border-t border-slate-50">
                   <button onClick={() => setShowLogForm(false)} className="px-10 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Discard</button>
                   <button onClick={handleAddLog} className="px-20 py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-2xl hover:bg-black transition-all">Archive Test Record</button>
                </div>
             </div>
           )}

           <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <th className="px-10 py-5">Timestamp</th>
                      <th className="px-6 py-5">Product SKU</th>
                      <th className="px-6 py-5 text-center">Identified Defect</th>
                      <th className="px-6 py-5 text-center">Status</th>
                      <th className="px-10 py-5 text-right">Ledger Control</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {qaLogs.map(log => {
                      const sku = skus.find(s => s.id === log.skuId);
                      return (
                         <tr key={log.id} className="hover:bg-slate-50 transition-all">
                            <td className="px-10 py-5 text-xs font-mono font-bold text-slate-400">{new Date(log.date).toLocaleDateString()}</td>
                            <td className="px-6 py-5">
                               <div className="font-bold text-slate-900 uppercase text-xs">{sku?.name || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-5 text-center">
                               {log.defectType ? (
                                  <span className="text-[10px] font-black uppercase text-rose-500 italic">!! {log.defectType}</span>
                               ) : (
                                  <span className="text-[10px] font-bold text-slate-300 uppercase">None</span>
                               )}
                            </td>
                            <td className="px-6 py-5 text-center">
                               <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${log.result === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700 animate-pulse'}`}>
                                  {log.result}
                               </span>
                            </td>
                            <td className="px-10 py-5 text-right">
                               <button onClick={() => sku && generateNCR_ReportPDF(log, sku)} className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-900">Download NCR</button>
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default QualityAssurance;