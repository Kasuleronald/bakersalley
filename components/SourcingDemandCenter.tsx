import React, { useState } from 'react';
import { SKU, Ingredient, Activity, Employee, MonthlyForecast, Asset, InventoryMovement, Requisition, SupplierInvoice, Supplier, RMQALog, Sale, Outlet, OutletStock, DailyOutletForecast, Transaction, User } from '../types';
import DemandPlanner from './DemandPlanner';
import ProcurementManager from './ProcurementManager';
import RetailDemandPlanner from './RetailDemandPlanner';
import AutomatedStockOptimizer from './AutomatedStockOptimizer';
import SupplierManager from './SupplierManager';
import SourcingResilience from './SourcingResilience';
import ProcurementDashboard from './ProcurementDashboard';

interface SourcingDemandCenterProps {
  skus: SKU[];
  setSkus: (s: SKU[]) => void;
  forecasts: MonthlyForecast[];
  setForecasts: (f: MonthlyForecast[]) => void;
  employees: Employee[];
  activities: Activity[];
  assets: Asset[];
  ingredients: Ingredient[];
  setIngredients: (ings: Ingredient[]) => void;
  movements: InventoryMovement[];
  setMovements: (movs: InventoryMovement[]) => void;
  requisitions: Requisition[];
  setRequisitions: (reqs: Requisition[]) => void;
  invoices: SupplierInvoice[];
  setInvoices: (invs: SupplierInvoice[]) => void;
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  rmQaLogs: RMQALog[];
  sales: Sale[];
  outlets: Outlet[];
  outletStocks: OutletStock[];
  outletForecasts: DailyOutletForecast[];
  setOutletForecasts: (f: DailyOutletForecast[]) => void;
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
  currentUser: User;
}

type SupplyTab = 'Dashboard' | 'Demand' | 'Procurement' | 'Retail' | 'Optimize' | 'Resilience' | 'Vendors';

const SourcingDemandCenter: React.FC<SourcingDemandCenterProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<SupplyTab>('Dashboard');

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
             <span className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl shadow-lg">🎯</span>
             <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter">Supply Network Hub</h2>
          </div>
          <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest pl-1 mt-1">SAP Standard Resilience • MRP Intelligence</p>
        </div>

        <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/20 relative z-10 overflow-x-auto scrollbar-hide shadow-inner">
          {[
            { id: 'Dashboard', label: 'Monitor', icon: '📊' },
            { id: 'Demand', label: 'Demand Plan', icon: '🎯' },
            { id: 'Retail', label: 'Retail Forecast', icon: '🏪' },
            { id: 'Optimize', label: 'Stock Logic', icon: '🤖' },
            { id: 'Resilience', label: 'Network Risk', icon: '🛡️' },
            { id: 'Procurement', label: 'Requisitions', icon: '📦' },
            { id: 'Vendors', label: 'Vendor Master', icon: '🤝' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveSubTab(tab.id as SupplyTab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeSubTab === tab.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-emerald-200/60 hover:text-white hover:bg-white/5'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="animate-fadeIn">
        {activeSubTab === 'Dashboard' && (
          <ProcurementDashboard 
            skus={props.skus}
            suppliers={props.suppliers}
            requisitions={props.requisitions}
            movements={props.movements}
            ingredients={props.ingredients}
            transactions={props.transactions}
            currency={props.currency}
          />
        )}
        {activeSubTab === 'Resilience' && <SourcingResilience ingredients={props.ingredients} suppliers={props.suppliers} />}
        {activeSubTab === 'Demand' && (
          <DemandPlanner 
            skus={props.skus}
            forecasts={props.forecasts}
            setForecasts={props.setForecasts}
            employees={props.employees}
            activities={props.activities}
            assets={props.assets}
            ingredients={props.ingredients}
            requisitions={props.requisitions}
            setRequisitions={props.setRequisitions}
            currency={props.currency}
          />
        )}
        {activeSubTab === 'Retail' && (
          <RetailDemandPlanner 
            skus={props.skus}
            outlets={props.outlets}
            outletStocks={props.outletStocks}
            sales={props.sales}
            outletForecasts={props.outletForecasts}
            setOutletForecasts={props.setOutletForecasts}
            currency={props.currency}
          />
        )}
        {activeSubTab === 'Optimize' && (
          <AutomatedStockOptimizer 
            skus={props.skus}
            ingredients={props.ingredients}
            outletForecasts={props.outletForecasts}
            requisitions={props.requisitions}
            setRequisitions={props.setRequisitions}
            currency={props.currency}
          />
        )}
        {activeSubTab === 'Procurement' && (
          <ProcurementManager 
            ingredients={props.ingredients}
            setIngredients={props.setIngredients}
            skus={props.skus}
            setSkus={props.setSkus}
            movements={props.movements}
            setMovements={props.setMovements}
            requisitions={props.requisitions}
            setRequisitions={props.setRequisitions}
            invoices={props.invoices}
            setInvoices={props.setInvoices}
            suppliers={props.suppliers}
            setSuppliers={props.setSuppliers}
            transactions={props.transactions}
            setTransactions={props.setTransactions}
            rmQaLogs={props.rmQaLogs}
            currency={props.currency}
            currentUser={props.currentUser}
          />
        )}
        {activeSubTab === 'Vendors' && (
          <SupplierManager 
            suppliers={props.suppliers}
            setSuppliers={props.setSuppliers}
          />
        )}
      </div>
    </div>
  );
};

export default SourcingDemandCenter;