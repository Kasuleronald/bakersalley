
import React, { useState, useMemo } from 'react';
import IngredientManager from './IngredientManager';
import { 
  Ingredient, InventoryMovement, Requisition, Transaction, Unit, 
  FinishedGood, SKU, Overhead, Employee, InventoryMovementType, 
  Outlet, Order, Customer, Batch, InventoryLoss, LossReason, RMQALog
} from '../types';
import { getConversionFactor } from '../utils/conversionUtils';
import MaterialMassBalance from './MaterialMassBalance';
import ExpiryAudit from './ExpiryAudit';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface StoresManagerProps {
  ingredients: Ingredient[];
  setIngredients: (ings: Ingredient[]) => void;
  movements: InventoryMovement[];
  setMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
  requisitions: Requisition[];
  setRequisitions: (reqs: Requisition[]) => void;
  transactions?: Transaction[];
  setTransactions?: (txs: Transaction[]) => void;
  finishedGoods?: FinishedGood[];
  setFinishedGoods?: (fg: FinishedGood[]) => void;
  skus?: SKU[];
  overheads?: Overhead[];
  employees?: Employee[];
  outlets?: Outlet[];
  orders?: Order[];
  customers?: Customer[];
  inventoryLosses?: InventoryLoss[];
  setInventoryLosses?: (losses: InventoryLoss[]) => void;
  rmQaLogs?: RMQALog[];
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
  onManualCorrection?: (category: 'ingredients', id: string, updates: Record<string, any>, reason: string) => void;
}

const LOSS_REASONS: LossReason[] = ['Audit Variance', 'Damage', 'Theft', 'Wasted', 'Expired', 'Floor Scrap', 'Reject', 'Sample'];
const CHART_COLORS = ['#713f12', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fde047'];

const StoresManager: React.FC<StoresManagerProps> = ({ 
  ingredients, setIngredients, movements, setMovements, requisitions, setRequisitions, 
  skus = [], orders = [], inventoryLosses = [], setInventoryLosses, rmQaLogs = [], currency, onManualCorrection
}) => {
  const [activeTab, setActiveTab] = useState<'Registry' | 'Mass_Balance' | 'Expiry' | 'Yield_Issue' | 'Quick_Adjust' | 'Analytics'>('Mass_Balance');
  
  const movementAnalytics = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMovements = movements.filter(m => new Date(m.date) >= sevenDaysAgo);
    const typeTotals: Record<string, number> = {};
    recentMovements.forEach(m => {
      const type = m.type || 'Unknown';
      typeTotals[type] = (typeTotals[type] || 0) + Math.abs(m.quantity);
    });
    return Object.entries(typeTotals).map(([type, total]) => ({
      type: type.replace('from Supplier', '').replace('to Production', '').replace('to Outlet', '').trim(),
      quantity: total
    })).sort((a, b) => b.quantity - a.quantity);
  }, [movements]);

  const storesStats = useMemo(() => {
    const totalValue = ingredients.reduce((s, i) => s + (i.currentStock * i.costPerUnit), 0);
    const lowStock = ingredients.filter(i => i.currentStock <= i.reorderLevel).length;
    const sevenDaysOut = new Date();
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    let valueAtRisk = 0;
    ingredients.forEach(i => {
      const expiringBatches = (i.batches || []).filter(b => new Date(b.expiryDate) <= sevenDaysOut);
      valueAtRisk += expiringBatches.reduce((s, b) => s + (b.quantity * (b.unitCost || i.costPerUnit)), 0);
    });
    return { totalValue, lowStock, valueAtRisk };
  }, [ingredients]);

  return (
    <div className="space-y-10 animate-softFade pb-20">
      {/* THEMED HUB HEADER */}
      <section className="relative h-64 rounded-[4rem] overflow-hidden shadow-xl border-4 border-white">
        <img 
          src="https://images.unsplash.com/photo-1533241242398-20e408d65542?auto=format&fit=crop&q=80&w=1600" 
          className="absolute inset-0 w-full h-full object-cover"
          alt="Barley Ready to Harvest"
        />
        <div className="absolute inset-0 bg-harvest-950/60 backdrop-blur-[2px]"></div>
        <div className="relative h-full flex flex-col justify-center px-12">
          <div className="flex items-center gap-3 mb-2">
             <span className="px-3 py-1 bg-harvest-500 text-harvest-950 rounded-full text-[8px] font-black uppercase tracking-widest">Material Sovereignty</span>
          </div>
          <h2 className="text-4xl font-bold font-serif text-white uppercase tracking-tighter">Raw Material Verification</h2>
          <p className="text-harvest-100 text-sm italic max-w-lg mt-2">Managing the industrial flow of grains and essentials from harvest to bin.</p>
        </div>
      </section>

      {/* INDUSTRIAL HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-harvest-950 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center border border-harvest-800">
            <div className="text-[10px] font-black text-harvest-400 uppercase tracking-widest mb-1">Frozen Capital</div>
            <div className="text-3xl font-mono font-black">{currency.formatCompact(storesStats.totalValue)}</div>
            <p className="text-[8px] text-harvest-600 uppercase mt-2">Verified Ledger Value</p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-bakery-100 shadow-sm flex flex-col justify-center">
            <div className="text-[10px] font-black text-bakery-400 uppercase tracking-widest mb-1">Stock Criticality</div>
            <div className={`text-3xl font-mono font-black ${storesStats.lowStock > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
               {storesStats.lowStock} <span className="text-xs">SKUs</span>
            </div>
            <p className="text-[8px] text-bakery-300 uppercase mt-2">At or Below Reorder Floor</p>
        </div>
        <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 flex flex-col justify-center">
            <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">FEFO Risk (Value)</div>
            <div className="text-3xl font-mono font-black text-rose-700">{currency.formatCompact(storesStats.valueAtRisk)}</div>
            <p className="text-[8px] text-rose-400 uppercase mt-2">Expiring in 7 Days</p>
        </div>
        <div className="bg-harvest-500 p-8 rounded-[3rem] text-harvest-950 shadow-xl flex flex-col justify-center items-center text-center border-4 border-white">
            <div className="text-3xl mb-1">🌾</div>
            <div className="text-[10px] font-black uppercase tracking-widest">Store Status: Sealed</div>
        </div>
      </div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex bg-white p-1 rounded-[2rem] shadow-sm border border-bakery-100 overflow-x-auto scrollbar-hide max-w-full">
           {[
            { id: 'Mass_Balance', label: 'Mass Balance', icon: '⚖️' },
            { id: 'Analytics', label: 'Analytics', icon: '📊' },
            { id: 'Expiry', label: 'Expiry/FEFO', icon: '🍎' },
            { id: 'Registry', label: 'Registry', icon: '🏛️' },
            { id: 'Yield_Issue', label: 'Issue', icon: '📦' },
            { id: 'Quick_Adjust', label: 'Correction', icon: '✏️' }
           ].map(tab => (
             <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-harvest-900 text-white shadow-lg' : 'text-bakery-400 hover:text-bakery-600'}`}
             >
               <span>{tab.icon}</span> {tab.label}
             </button>
           ))}
        </div>
      </header>

      <main className="animate-fadeIn">
        {activeTab === 'Analytics' && (
          <div className="bg-white p-10 rounded-[4rem] border border-bakery-50 shadow-sm space-y-8">
            <h3 className="text-2xl font-bold font-serif text-bakery-950 uppercase">Movement Volume Audit</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementAnalytics} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#713f12' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a16207' }} />
                  <Tooltip cursor={{ fill: '#fefce8' }} contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar name="Total Units" dataKey="quantity" radius={[10, 10, 0, 0]} barSize={50}>
                    {movementAnalytics.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'Registry' && (
          <IngredientManager 
            ingredients={ingredients} 
            setIngredients={setIngredients} 
            skus={skus || []} 
            rmQaLogs={rmQaLogs}
            currency={currency} 
            onManualCorrection={onManualCorrection}
          />
        )}

        {activeTab === 'Expiry' && (
          <ExpiryAudit ingredients={ingredients} currency={currency} />
        )}

        {activeTab === 'Mass_Balance' && (
          <MaterialMassBalance 
            ingredients={ingredients}
            setIngredients={setIngredients}
            movements={movements}
            setMovements={setMovements}
            inventoryLosses={inventoryLosses}
            setInventoryLosses={setInventoryLosses || (() => {})}
            currency={currency}
          />
        )}
      </main>
    </div>
  );
};

export default StoresManager;
