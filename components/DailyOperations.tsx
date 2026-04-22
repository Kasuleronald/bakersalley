
import React, { useMemo, useState, useEffect } from 'react';
import { SKU, Activity, Employee, Order, ProductionLog, EnergyCategory, Asset, TaxConfig, DailyTask } from '../types';
import { getIndustryTerms } from '../utils/industryUtils';
import ShopFloorTerminal from './ShopFloorTerminal';
import OeeAuditor from './OeeAuditor';
import ProductionKanban from './ProductionKanban';
import ShiftIntelligenceHub from './ShiftIntelligenceHub';
import ProcessOptimizer from './ProcessOptimizer';

interface DailyOperationsProps {
  skus: SKU[];
  activities: Activity[];
  employees: Employee[];
  assets: Asset[];
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  onLogProduction?: (log: ProductionLog) => void;
  currency: { format: (v: number) => string; active: any };
  productionLogs: ProductionLog[];
  taxConfig: TaxConfig;
  dailyTasks: DailyTask[];
  setDailyTasks: (tasks: DailyTask[]) => void;
}

const DailyOperations: React.FC<DailyOperationsProps> = ({ 
  skus, activities, employees, assets = [], orders = [], setOrders, 
  onLogProduction, currency, productionLogs = [], taxConfig
}) => {
  const terms = useMemo(() => getIndustryTerms(taxConfig), [taxConfig]);
  const [opTab, setOpTab] = useState<'Execution' | 'OEE' | 'Kanban' | 'Intelligence' | 'Optimization'>('Kanban');

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* THEMED PRODUCTION HEADER */}
      <section className="relative h-64 rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white group">
        <img 
          src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1600" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
          alt="Baking Fresh Bread"
        />
        <div className="absolute inset-0 bg-bakery-950/70 backdrop-blur-[1px]"></div>
        <div className="relative h-full flex flex-col justify-center px-12">
          <div className="flex items-center gap-3 mb-2">
             <span className="px-3 py-1 bg-amber-500 text-bakery-950 rounded-full text-[8px] font-black uppercase tracking-widest">Artisan Forge Active</span>
          </div>
          <h2 className="text-4xl font-bold font-serif text-white uppercase tracking-tighter">Manufacturing Execution (MES)</h2>
          <p className="text-bakery-100 text-sm italic max-w-lg mt-2">Converting material mass into finished goods via thermal and manual labor cycles.</p>
        </div>
      </section>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-bakery-950 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter text-amber-400">Shift Command Hub</h2>
          <p className="text-bakery-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{terms.workCenterLabel} Control • Live Yield Tracking</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'Kanban', label: 'Flow Matrix', icon: '📊' },
            { id: 'Execution', label: 'Execution', icon: '⚡' },
            { id: 'Intelligence', label: 'Audit', icon: '🧠' },
            { id: 'Optimization', label: 'Optimize', icon: '🚀' },
            { id: 'OEE', label: 'OEE', icon: '🛡️' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setOpTab(tab.id as any)} 
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${opTab === tab.id ? 'bg-white text-bakery-950 shadow-xl scale-105' : 'text-bakery-400 hover:text-white'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="animate-fadeIn">
        {opTab === 'Kanban' && (
          <ProductionKanban orders={orders} setOrders={setOrders} skus={skus} currency={currency} />
        )}
        {opTab === 'Execution' && (
          <ShopFloorTerminal skus={skus} assets={assets} employees={employees} logs={productionLogs} onLogBatch={(log, defects) => onLogProduction?.(log)} downtime={[]} onLogDowntime={() => {}} currency={currency} />
        )}
        {opTab === 'Intelligence' && (
          <ShiftIntelligenceHub logs={productionLogs} skus={skus} assets={assets} currency={currency} />
        )}
        {opTab === 'Optimization' && (
          <ProcessOptimizer logs={productionLogs} assets={assets} orders={orders} employees={employees} />
        )}
        {opTab === 'OEE' && (
          <OeeAuditor logs={productionLogs} downtime={[]} assets={assets} />
        )}
      </div>
    </div>
  );
};

export default DailyOperations;
