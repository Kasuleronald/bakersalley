import React, { useState, useMemo } from 'react';
import { SKU, Ingredient, Employee, Sale, Transaction, ProductionLog, InventoryMovement } from '../types';
import { downloadCSV, generateUniversalReportPDF } from '../utils/exportUtils';
import { generateSystemBlueprintPDF } from '../utils/blueprintUtils';
import { generateFullUserManualPDF } from '../utils/manualUtils';

interface ReportingCenterProps {
  skus: SKU[];
  ingredients: Ingredient[];
  employees: Employee[];
  sales: Sale[];
  transactions: Transaction[];
  productionLogs: ProductionLog[];
  movements: InventoryMovement[];
  currency: { active: any, format: (v: number) => string };
}

type ReportModule = 'Inventory' | 'Recipes' | 'Personnel' | 'Sales' | 'Production' | 'Financials' | 'System_Literature';

const ReportingCenter: React.FC<ReportingCenterProps> = ({ skus, ingredients, employees, sales, transactions, productionLogs, movements, currency }) => {
  const [activeModule, setActiveModule] = useState<ReportModule>('Inventory');

  const reportConfig = useMemo(() => {
    if (activeModule === 'System_Literature') return null;

    switch (activeModule) {
      case 'Inventory':
        return {
          title: 'Raw Materials & Stock Audit',
          filename: 'Inventory_Audit',
          headers: [['Material Name', 'Category', 'Unit', 'In Stock', 'Reorder Level', 'Unit Cost (UGX)', 'Valuation (UGX)', 'Supplier']],
          data: ingredients.map(i => [
            i.name, i.category, i.unit, i.currentStock.toLocaleString(), 
            i.reorderLevel.toLocaleString(),
            i.costPerUnit.toLocaleString(), (i.currentStock * i.costPerUnit).toLocaleString(),
            i.supplierName || 'Unassigned'
          ]),
          raw: ingredients.map(i => ({
            'Material Name': i.name,
            'Category': i.category,
            'Unit': i.unit,
            'Current Stock': i.currentStock,
            'Reorder Level': i.reorderLevel,
            'Unit Cost (UGX)': i.costPerUnit,
            'Valuation (UGX)': i.currentStock * i.costPerUnit,
            'Supplier': i.supplierName || 'Unassigned'
          })),
          total: ingredients.reduce((s, i) => s + (i.currentStock * i.costPerUnit), 0),
          totalLabel: 'Total Material Value'
        };
      case 'Recipes':
        return {
          title: 'Product Formulation Library',
          filename: 'Master_Formulations',
          headers: [['Product SKU', 'Category', 'Batch Yield', 'Retail Price (UGX)', 'Materials Used']],
          data: skus.map(s => [
            s.name, s.category, `${s.yield} ${s.unit}`, s.retailPrice.toLocaleString(), 
            s.recipeItems.length.toString()
          ]),
          raw: skus,
          total: skus.length,
          totalLabel: 'Active Formulations'
        };
      case 'Personnel':
        return {
          title: 'Human Capital & Payroll Audit',
          filename: 'Staff_Ledger',
          headers: [['Staff Name', 'Role', 'Department', 'Type', 'Base Monthly (UGX)']],
          data: employees.map(e => [
            e.name, e.role, e.department, e.employmentType, (e.salary || 0).toLocaleString()
          ]),
          raw: employees,
          total: employees.reduce((s, e) => s + (e.salary || 0), 0),
          totalLabel: 'Monthly Base Payroll'
        };
      case 'Sales':
        return {
          title: 'Commercial Sales Ledger',
          filename: 'Sales_Audit',
          headers: [['Date', 'Product', 'Quantity', 'Unit Price', 'Discount', 'Net Total (UGX)']],
          data: sales.map(s => [
            new Date(s.date).toLocaleDateString(), 
            skus.find(x => x.id === s.skuId)?.name || 'Unknown', 
            s.quantity.toLocaleString(), 
            s.unitPrice.toLocaleString(),
            (s.discountAmount || 0).toLocaleString(),
            s.totalPrice.toLocaleString()
          ]),
          raw: sales,
          total: sales.reduce((s, x) => s + x.totalPrice, 0),
          totalLabel: 'Consolidated GSV'
        };
      case 'Production':
        return {
          title: 'Daily Production Throughput',
          filename: 'Production_Audit',
          headers: [['Date', 'Product Formulation', 'Rounds', 'Target Yield', 'Actual Realized', 'Energy Source']],
          data: productionLogs.map(l => [
            new Date(l.date).toLocaleDateString(),
            skus.find(x => x.id === l.skuId)?.name || 'Unknown',
            l.roundsProduced.toString(),
            l.totalUnitsProduced.toLocaleString(),
            (l.actualYield || l.totalUnitsProduced).toLocaleString(),
            l.energyUsed || 'Standard'
          ]),
          raw: productionLogs,
          total: productionLogs.reduce((s, x) => s + (x.actualYield || x.totalUnitsProduced), 0),
          totalLabel: 'Total Units Produced'
        };
      case 'Financials':
        return {
          title: 'Expenditure & Treasury Ledger',
          filename: 'Financial_Journal',
          headers: [['Date', 'Account', 'Category', 'Description', 'Debit (UGX)', 'Credit (UGX)']],
          data: transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.account,
            t.category,
            t.description,
            t.type === 'Debit' ? t.amount.toLocaleString() : '',
            t.type === 'Credit' ? t.amount.toLocaleString() : ''
          ]),
          raw: transactions,
          total: transactions.reduce((s, x) => x.type === 'Credit' ? s + x.amount : s - x.amount, 0),
          totalLabel: 'Current Cash Position'
        };
      default: return null;
    }
  }, [activeModule, ingredients, skus, employees, sales, transactions, productionLogs]);

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter">Reporting & Registry</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Audit Readiness • Technical Blueprints • Statutory Filing</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
          {(['Inventory', 'Recipes', 'Personnel', 'Sales', 'Production', 'Financials', 'System_Literature'] as ReportModule[]).map(m => (
            <button 
              key={m} 
              onClick={() => setActiveModule(m)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeModule === m ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      {activeModule === 'System_Literature' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Executive Registry</h3>
            <p className="text-slate-500 leading-relaxed italic">"Documentation is the infrastructure of scale. Maintain professional versions of your system architecture and operating procedures for board audits and staff training."</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                  <div className="space-y-4">
                     <div className="text-5xl group-hover:scale-110 transition-transform">📘</div>
                     <h4 className="text-xl font-bold font-serif text-slate-900">Operator Manual</h4>
                     <p className="text-xs text-slate-500">Comprehensive guide covering all modules including Kanban MES and ABC Costing logic.</p>
                  </div>
                  <button 
                    onClick={() => generateFullUserManualPDF([])}
                    className="mt-8 w-full py-4 bg-indigo-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all"
                  >
                    Generate Manual (PDF)
                  </button>
               </div>

               <div className="p-10 bg-indigo-900 rounded-[3rem] border border-indigo-800 text-white flex flex-col justify-between group hover:shadow-2xl transition-all">
                  <div className="space-y-4">
                     <div className="text-5xl">📐</div>
                     <h4 className="text-xl font-bold font-serif text-amber-400">Technical Blueprints</h4>
                     <p className="text-xs text-indigo-200">Architectural map including Kanban Flow logic, capital recursion, and Zero-Knowledge security nexus.</p>
                  </div>
                  <button 
                    onClick={generateSystemBlueprintPDF}
                    className="mt-8 w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-amber-400 transition-all"
                  >
                    Generate Blueprints (PDF)
                  </button>
               </div>
            </div>
          </div>
          <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[3.5rem] text-white flex flex-col justify-center h-full shadow-2xl relative overflow-hidden border border-white/5">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10"></div>
             <h4 className="text-amber-400 font-black uppercase text-[10px] tracking-widest mb-6 border-b border-white/10 pb-4">Audit Standard Compliance</h4>
             <ul className="space-y-4">
                <li className="flex items-start gap-4">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></span>
                   <p className="text-xs text-slate-300">ISO 9001:2015 Operating Standard Literature</p>
                </li>
                <li className="flex items-start gap-4">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></span>
                   <p className="text-xs text-slate-300">MES Kanban Throughput Control Logic</p>
                </li>
                <li className="flex items-start gap-4">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></span>
                   <p className="text-xs text-slate-300">UNBS S-Mark Traceability Map Architecture</p>
                </li>
             </ul>
          </div>
        </div>
      ) : reportConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 space-y-6">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b pb-4">Report Definition</h3>
                
                <div className="space-y-6">
                   <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Active Dataset</label>
                      <div className="text-2xl font-bold font-serif text-slate-900">{reportConfig.title}</div>
                   </div>

                   <div className="p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                      <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">{reportConfig.totalLabel}</span>
                      <div className="text-2xl font-mono font-black text-indigo-900">
                         {typeof reportConfig.total === 'number' ? currency.format(reportConfig.total) : reportConfig.total}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <button 
                        onClick={() => generateUniversalReportPDF({
                          title: reportConfig.title,
                          subtitle: `BakersAlley Industrial Report - ${activeModule}`,
                          headers: reportConfig.headers,
                          data: reportConfig.data,
                          filename: reportConfig.filename
                        })}
                        className="w-full py-5 bg-indigo-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                      >
                        <span>📄</span> Export Audit PDF
                      </button>
                      <button 
                        onClick={() => downloadCSV(reportConfig.raw, reportConfig.filename)}
                        className="w-full py-5 bg-slate-100 text-slate-600 border border-slate-200 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                        <span>📊</span> Export Raw CSV
                      </button>
                   </div>
                </div>
             </div>

             <div className="p-8 bg-amber-50 rounded-[3rem] border border-amber-100 flex flex-col justify-center">
                <h4 className="text-amber-900 font-bold font-serif mb-2">Audit Compliance Note</h4>
                <p className="text-xs text-amber-700 leading-relaxed italic">
                   "Professional PDFs are generated with a non-editable timestamp and branding. Use these for formal URA tax audits or bank financing applications to demonstrate operational maturity."
                </p>
             </div>
          </aside>

          <main className="lg:col-span-8 bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-10 py-6 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 font-serif">Data Preview: {reportConfig.data.length} Records</h3>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Live Ledger View</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-gray-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b">
                         {reportConfig.headers[0].map((h, i) => (
                           <th key={i} className="px-6 py-4">{h}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {reportConfig.data.slice(0, 10).map((row, ridx) => (
                        <tr key={ridx} className="hover:bg-indigo-50/5 transition-all">
                          {row.map((cell, cidx) => (
                            <td key={cidx} className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-tighter">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {reportConfig.data.length > 10 && (
                        <tr>
                          <td colSpan={reportConfig.headers[0].length} className="px-10 py-4 bg-slate-50/50 text-center text-[9px] font-black text-slate-300 uppercase italic">
                             ... and {reportConfig.data.length - 10} additional rows in full report
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default ReportingCenter;
