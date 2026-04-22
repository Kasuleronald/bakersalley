
import React, { useState } from 'react';
import { 
  SKU, Ingredient, Sale, Transaction, Employee, Overhead, 
  Customer, Order, FinishedGood, Asset, Loan, SupplierInvoice, 
  ProductionLog, InventoryLoss, TaxConfig, InventoryMovement
} from '../types';
import RatioAnalysis from './RatioAnalysis';
import MaterialMassBalance from './MaterialMassBalance';
import QualityAssurance from './QualityAssurance';
import RiskHub from './RiskHub';

interface InternalAuditHubProps {
  skus: SKU[];
  ingredients: Ingredient[];
  sales: Sale[];
  transactions: Transaction[];
  employees: Employee[];
  overheads: Overhead[];
  customers: Customer[];
  orders: Order[];
  finishedGoods: FinishedGood[];
  assets: Asset[];
  loans: Loan[];
  invoices: SupplierInvoice[];
  productionLogs: ProductionLog[];
  inventoryLosses: InventoryLoss[];
  movements: InventoryMovement[];
  setMovements: (movs: InventoryMovement[]) => void;
  setIngredients: (ings: Ingredient[]) => void;
  setInventoryLosses: (losses: InventoryLoss[]) => void;
  taxConfig: TaxConfig;
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
}

const InternalAuditHub: React.FC<InternalAuditHubProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'Ratios' | 'Reconciliation' | 'Quality' | 'Risk' | 'Trail'>('Ratios');

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter text-emerald-400">Internal Audit Control</h2>
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Data Integrity • Fraud Detection • Operational Compliance</p>
        </div>
        <div className="flex bg-white/10 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'Ratios', label: 'Bakers Ratios', icon: '🧬' },
            { id: 'Reconciliation', label: 'Mass Balance', icon: '⚖️' },
            { id: 'Quality', label: 'NCR Audit', icon: '🧪' },
            { id: 'Risk', label: 'Resilience', icon: '🛡️' },
            { id: 'Trail', label: 'Audit Trail', icon: '🕒' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="animate-fadeIn">
        {activeTab === 'Ratios' && <RatioAnalysis {...props} />}
        
        {activeTab === 'Reconciliation' && (
          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <div className="border-b border-slate-50 pb-6">
                <h3 className="text-2xl font-bold font-serif text-slate-900">Physical Truth Reconciliation</h3>
                <p className="text-sm text-slate-400 font-medium">Verify system theoretical stock against physical floor reality.</p>
            </div>
            <MaterialMassBalance 
                ingredients={props.ingredients} 
                setIngredients={props.setIngredients}
                movements={props.movements}
                setMovements={props.setMovements as any}
                inventoryLosses={props.inventoryLosses}
                setInventoryLosses={props.setInventoryLosses}
                currency={props.currency}
            />
          </div>
        )}

        {activeTab === 'Quality' && (
          <QualityAssurance 
            {...props}
            qaLogs={[]} 
            setQaLogs={() => {}}
          />
        )}

        {activeTab === 'Risk' && (
          <RiskHub 
            ingredients={props.ingredients}
            assets={props.assets}
            loans={props.loans}
            invoices={props.invoices}
            sales={props.sales}
            employees={props.employees}
          />
        )}

        {activeTab === 'Trail' && (
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm animate-fadeIn">
             <div className="text-center py-20 opacity-20 grayscale">
                <div className="text-8xl mb-4">🕒</div>
                <h3 className="text-xl font-black uppercase tracking-widest">Central Audit Journal</h3>
                <p className="text-sm italic">Historical record of all manual ledger corrections.</p>
             </div>
          </div>
        )}
      </div>

      <div className="p-12 bg-rose-900 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-rose-800">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-6xl opacity-30 grayscale shrink-0">🛡️</div>
         <div className="relative z-10">
            <h4 className="text-2xl font-bold font-serif text-amber-400 mb-4 uppercase">Industrial Integrity Shield</h4>
            <p className="text-sm text-rose-100 leading-relaxed max-w-4xl italic">
              "Internal Audit is the gatekeeper of your bakery's truth. While the Accountant records performance, the Auditor verifies it by looking for gaps in Mass Balance, spikes in Floor Scrap, or missing digital signatures. Trust the numbers, but audit the process."
            </p>
         </div>
      </div>
    </div>
  );
};

export default InternalAuditHub;
