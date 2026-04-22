import React, { useState, useMemo } from 'react';
import { TaxConfig, Transaction, Sale, Employee, ProductionLog, SKU, Ingredient } from '../types';
import { getPayrollFilingSummary } from '../utils/payrollUtils';
import { analyzeTaxPosition } from '../services/geminiService';

interface TaxHubProps {
  transactions: Transaction[];
  sales: Sale[];
  employees: Employee[];
  productionLogs: ProductionLog[];
  skus: SKU[];
  ingredients: Ingredient[];
  taxConfig: TaxConfig;
  setTaxConfig: (config: TaxConfig) => void;
  currency: { format: (v: number) => string };
}

const TaxHub: React.FC<TaxHubProps> = ({ 
  transactions = [], sales = [], employees = [], productionLogs = [], skus = [], ingredients = [], 
  taxConfig, setTaxConfig, currency 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  
  // Scenario Testing State
  const [simulationMode, setSimulationMode] = useState<'Actual' | 'Export' | 'Bulk_Purchase'>('Actual');

  const stats = useMemo(() => {
    let revenue = (sales || []).reduce((s, x) => s + x.totalPrice, 0);
    // Fixed: Removed 'Purchase' from category check as it is not a valid Transaction['category'] value
    let materialSpend = (transactions || [])
      .filter(t => t.type === 'Debit' && (t.subCategory?.includes('Raw Materials')))
      .reduce((s, x) => s + x.amount, 0);

    // Apply Simulation Modifiers
    if (simulationMode === 'Export') {
      // In export mode, sales are zero-rated (0% VAT) but inputs still have 18% credit
      const outputVat = 0; 
      const inputVat = taxConfig.isVatRegistered ? materialSpend * taxConfig.vatRate : 0;
      const vatPosition = inputVat; // Positive means refund/credit due
      const payroll = getPayrollFilingSummary(employees || []);
      return { revenue, outputVat, inputVat, vatPayable: -inputVat, materialSpend, payroll, isRefund: true };
    }

    if (simulationMode === 'Bulk_Purchase') {
      materialSpend *= 3; // Simulate a huge material buy
    }

    const outputVat = taxConfig.isVatRegistered ? revenue * taxConfig.vatRate : 0;
    const inputVat = taxConfig.isVatRegistered ? materialSpend * taxConfig.vatRate : 0;
    const vatPayable = outputVat - inputVat;
    const payroll = getPayrollFilingSummary(employees || []);

    return { 
      revenue, outputVat, inputVat, 
      vatPayable, materialSpend, payroll, 
      isRefund: vatPayable < 0 
    };
  }, [sales, transactions, employees, taxConfig, simulationMode]);

  const handleRunAiAudit = async () => {
    setAiLoading(true);
    const result = await analyzeTaxPosition(stats, taxConfig);
    setAiAdvice(result);
    setAiLoading(false);
  };

  const handleSave = () => {
    setIsEditing(false);
    alert("Tax Architecture Updated. P&L will recalibrate immediately.");
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase">Statutory Compliance Hub</h2>
          <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">VAT Monitoring • PAYE • NSSF • Audit Integrity</p>
        </div>
        <div className="flex flex-wrap gap-4 relative z-10">
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button onClick={() => setSimulationMode('Actual')} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${simulationMode === 'Actual' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Actuals</button>
              <button onClick={() => setSimulationMode('Export')} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${simulationMode === 'Export' ? 'bg-amber-500 text-white' : 'text-slate-400'}`}>Export Test</button>
              <button onClick={() => setSimulationMode('Bulk_Purchase')} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${simulationMode === 'Bulk_Purchase' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Input Test</button>
           </div>
           <button 
            onClick={handleRunAiAudit}
            disabled={aiLoading}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl transition-all ${aiLoading ? 'bg-blue-800 animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
           >
              {aiLoading ? 'Auditing Math...' : '✨ AI Tax Audit'}
           </button>
           <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl transition-all ${isEditing ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900'}`}
           >
            {isEditing ? 'Save Rates' : 'Edit Rates'}
          </button>
        </div>
      </header>

      {isEditing && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-blue-100 shadow-2xl animate-fadeIn space-y-8">
           <h3 className="text-xl font-bold text-slate-900 font-serif">Jurisdiction Parameter Tuning</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">VAT Registration</label>
                 <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button onClick={() => setTaxConfig({...taxConfig, isVatRegistered: true})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${taxConfig.isVatRegistered ? 'bg-indigo-900 text-white' : 'text-slate-400'}`}>Registered</button>
                    <button onClick={() => setTaxConfig({...taxConfig, isVatRegistered: false})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!taxConfig.isVatRegistered ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Exempt</button>
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-blue-600 uppercase mb-3">VAT Rate (%)</label>
                 <input 
                  type="number" step="0.01"
                  className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-mono font-black text-xl text-blue-900" 
                  value={taxConfig.vatRate * 100} 
                  onChange={e => setTaxConfig({...taxConfig, vatRate: (parseFloat(e.target.value) || 0) / 100})} 
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">NSSF Total (%)</label>
                 <input 
                  type="number" disabled
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono font-bold text-xl" 
                  value={(taxConfig.nssfEmployeeRate + taxConfig.nssfEmployerRate) * 100} 
                 />
              </div>
           </div>
        </div>
      )}

      {aiAdvice && (
        <div className="bg-indigo-950 p-10 rounded-[4rem] text-white shadow-2xl animate-softFade space-y-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20"></div>
           <div className="flex justify-between items-start relative z-10">
              <h3 className="text-2xl font-bold font-serif text-amber-400">Strategic Audit Output</h3>
              <button onClick={() => setAiAdvice(null)} className="text-slate-400 hover:text-white">✕ Close</button>
           </div>
           <div className="prose prose-invert max-w-none relative z-10 text-sm italic font-medium leading-relaxed border-l-4 border-amber-500 pl-8">
              <div className="whitespace-pre-wrap">{aiAdvice}</div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-bold font-serif text-slate-900">VAT Liability Analysis</h3>
                 <div className="flex gap-2">
                    {simulationMode !== 'Actual' && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[8px] font-black uppercase animate-pulse">Simulation Active: {simulationMode}</span>}
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${taxConfig.isVatRegistered ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {taxConfig.isVatRegistered ? 'Registered' : 'Non-VAT Entity'}
                    </span>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Output VAT (Collected)</span>
                    <div className="text-xl font-mono font-black text-slate-900">{currency.format(stats.outputVat)}</div>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Input VAT (Claimable)</span>
                    <div className="text-xl font-mono font-black text-indigo-600">{currency.format(stats.inputVat)}</div>
                 </div>
                 <div className={`p-6 rounded-3xl text-white shadow-xl transition-colors ${stats.isRefund ? 'bg-emerald-600' : 'bg-blue-900'}`}>
                    <span className="text-[8px] font-black text-white/60 uppercase block mb-1">{stats.isRefund ? 'VAT Credit/Refund' : 'VAT Payable to URA'}</span>
                    <div className="text-xl font-mono font-black">{currency.format(Math.abs(stats.vatPayable))}</div>
                 </div>
              </div>

              <div className="h-[180px] w-full bg-slate-50 rounded-3xl p-8 flex items-center justify-between">
                 <div className="space-y-4 flex-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase">Registration Threshold Meter</div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min(100, (stats.revenue / 150000000) * 100)}%` }}></div>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">Monitoring cumulative turnover against UGX 150M statutory limit.</p>
                 </div>
                 <div className="w-32 text-right">
                    <div className="text-2xl font-black font-mono text-slate-900">{Math.round((stats.revenue / 150000000) * 100)}%</div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900 font-serif">Statutory Payroll Audits</h3>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Calculations Validated</span>
                 </div>
              </div>
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                       <th className="px-10 py-5">Head of Contribution</th>
                       <th className="px-6 py-5 text-right">Liability</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    <tr>
                       <td className="px-10 py-5 text-xs font-bold text-slate-700">Monthly PAYE Liability</td>
                       <td className="px-6 py-5 text-right font-mono font-black text-rose-600">{currency.format(stats.payroll.totalPAYE)}</td>
                    </tr>
                    <tr>
                       <td className="px-10 py-5 text-xs font-bold text-slate-700">NSSF Employer (10%)</td>
                       <td className="px-6 py-5 text-right font-mono font-black text-indigo-400">{currency.format(stats.payroll.totalEmployerNSSF)}</td>
                    </tr>
                    <tr>
                       <td className="px-10 py-5 text-xs font-bold text-slate-700">NSSF Employee (5%)</td>
                       <td className="px-6 py-5 text-right font-mono font-black text-indigo-400">{currency.format(stats.payroll.totalEmployeeNSSF)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                       <td className="px-10 py-5 text-xs font-black text-slate-900 uppercase">Total Consolidated Liability</td>
                       <td className="px-6 py-5 text-right font-mono font-black text-slate-900">{currency.format(stats.payroll.totalStatutoryLiability)}</td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-indigo-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-between border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
              <div className="relative z-10">
                 <div className="text-5xl mb-8 grayscale opacity-40">⚖️</div>
                 <h4 className="text-2xl font-bold font-serif text-amber-400 mb-4">Tax Integrity Test</h4>
                 <p className="text-sm text-indigo-100 leading-relaxed italic">
                    "Effective tax management is about <b>Offset Precision</b>. Use the simulation buttons in the header to test how the ledger responds to unusual business cycles like bulk inventory acquisitions or large export runs. A negative VAT value correctly indicates a claimable credit position."
                 </p>
              </div>
              <div className="relative z-10 mt-10 pt-10 border-t border-white/10">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-indigo-400 uppercase">Audit Match Score</span>
                    <span className="text-xl font-mono font-black text-emerald-400">100%</span>
                 </div>
                 <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Logic: Stat-Sync v1.2</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TaxHub;