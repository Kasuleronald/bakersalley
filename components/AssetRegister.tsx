
import React, { useState, useMemo } from 'react';
import { Asset, Transaction, AccountType, EnergyCategory, MaintenanceRecord, PredictiveMaintenanceReport, ProductionLog } from '../types';
import { runPredictiveMaintenanceAudit } from '../services/geminiService';

interface AssetRegisterProps {
  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  productionLogs: ProductionLog[];
  currency: { active: any, format: (v: number) => string };
}

const ENERGY_SOURCES: EnergyCategory[] = ['Electricity', 'Firewood', 'Gas', 'Charcoal', 'Solar', 'Diesel (Gen)', 'Water'];

const AssetRegister: React.FC<AssetRegisterProps> = ({ assets, setAssets, transactions, setTransactions, productionLogs, currency }) => {
  const [activeTab, setActiveTab] = useState<'Registry' | 'Maintenance' | 'Intelligence'>('Registry');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [isAuditingId, setIsAuditingId] = useState<string | null>(null);
  const [predictiveReports, setPredictiveReports] = useState<Record<string, PredictiveMaintenanceReport>>({});
  
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceRecord[]>([]);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState<string | null>(null);

  // New Maintenance Form State
  const [maintEntry, setMaintEntry] = useState({
    cost: 0,
    description: '',
    type: 'Routine' as MaintenanceRecord['type']
  });

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '', category: 'Machinery', classification: 'Non-Current', purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0, depreciationRate: 20, usefulLifeYears: 5, maintenanceIntervalDays: 90,
    totalRepairSpend: 0, status: 'Active', capacityPerShift: 0, primaryEnergySource: 'Electricity'
  });

  const handleRunAiMaintenanceAudit = async (asset: Asset) => {
    setIsAuditingId(asset.id);
    const assetLogs = productionLogs.filter(l => l.skuId.includes(asset.name.toLowerCase())); 
    const report = await runPredictiveMaintenanceAudit(asset, assetLogs);
    if (report) {
      setPredictiveReports(prev => ({ ...prev, [asset.id]: report }));
    }
    setIsAuditingId(null);
  };

  const handleAddMaintenanceRecord = () => {
    if (!showMaintenanceForm) return;
    const assetId = showMaintenanceForm;
    const cost = maintEntry.cost;

    const record: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      assetId,
      date: new Date().toISOString().split('T')[0],
      description: maintEntry.description || 'Routine Service',
      cost,
      downtimeHours: 0,
      type: maintEntry.type
    };

    setMaintenanceLogs([record, ...maintenanceLogs]);
    
    setAssets(assets.map(a => a.id === assetId ? {
      ...a,
      totalRepairSpend: (a.totalRepairSpend || 0) + cost
    } : a));

    const asset = assets.find(a => a.id === assetId);
    const newTx: Transaction = {
      id: `tx-maint-${Date.now()}`,
      date: new Date().toISOString(),
      account: 'Bank',
      type: 'Debit',
      amount: cost,
      description: `Maintenance: ${asset?.name} (${maintEntry.type})`,
      category: 'Expense',
      subCategory: 'Repair & Maintenance'
    };
    setTransactions([newTx, ...transactions]);

    setShowMaintenanceForm(null);
    setMaintEntry({ cost: 0, description: '', type: 'Routine' });
    alert("Maintenance event archived.");
  };

  const calculateAssetMetrics = (asset: Asset) => {
    const pDate = new Date(asset.purchaseDate);
    const today = new Date();
    const yearsOwned = (today.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const accumulated = Math.min(asset.purchasePrice, (asset.purchasePrice * asset.depreciationRate * yearsOwned) / 100);
    const bookValue = asset.purchasePrice - accumulated;

    const assetLogs = maintenanceLogs.filter(l => l.assetId === asset.id);
    const lastService = assetLogs[0] ? new Date(assetLogs[0].date) : pDate;
    const daysSinceService = (today.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24);
    const healthScore = Math.max(0, 100 - (daysSinceService / asset.maintenanceIntervalDays) * 100);
    
    const simulatedDutyHours = (asset.activeHoursCounter || 0) + (productionLogs.length * 4.5); 

    return { accumulated, bookValue, healthScore, simulatedDutyHours };
  };

  const handleAddAsset = () => {
    if (newAsset.name && (newAsset.purchasePrice || 0) >= 0) {
      if (editingAssetId) {
        setAssets(assets.map(a => a.id === editingAssetId ? { ...a, ...newAsset } as Asset : a));
        alert("Asset details updated.");
      } else {
        const asset: Asset = {
          id: `ast-${Date.now()}`,
          name: newAsset.name!,
          category: newAsset.category as any || 'Machinery',
          classification: newAsset.classification as any || 'Non-Current',
          purchaseDate: newAsset.purchaseDate || new Date().toISOString().split('T')[0],
          purchasePrice: newAsset.purchasePrice || 0,
          depreciationRate: newAsset.depreciationRate || 20,
          usefulLifeYears: newAsset.usefulLifeYears || 5,
          maintenanceIntervalDays: newAsset.maintenanceIntervalDays || 90,
          totalRepairSpend: 0,
          status: 'Active',
          capacityPerShift: newAsset.capacityPerShift || 0,
          primaryEnergySource: (newAsset.primaryEnergySource as EnergyCategory) || 'Electricity',
          activeHoursCounter: 0
        };
        setAssets([...assets, asset]);
        alert("New capital asset enrolled.");
      }
      setShowAddForm(false);
      setEditingAssetId(null);
      setNewAsset({
        name: '', category: 'Machinery', classification: 'Non-Current', purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0, depreciationRate: 20, usefulLifeYears: 5, maintenanceIntervalDays: 90,
        totalRepairSpend: 0, status: 'Active', capacityPerShift: 0, primaryEnergySource: 'Electricity'
      });
    }
  };

  const handleStartEdit = (asset: Asset) => {
    setEditingAssetId(asset.id);
    setNewAsset({ ...asset });
    setShowAddForm(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter text-amber-400">Intelligent Asset Console</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Industry 4.0 Standard • Predicted Downtime Prevention</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10">
           <button onClick={() => setActiveTab('Registry')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Registry' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>Registry</button>
           <button onClick={() => setActiveTab('Intelligence')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Intelligence' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>AI Maintenance Audit</button>
        </div>
      </header>

      {showAddForm && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-8">
           <h4 className="text-xl font-bold font-serif text-indigo-900 uppercase">{editingAssetId ? 'Edit Asset Record' : 'Enroll New Capital Asset'}</h4>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="md:col-span-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Asset Name</label>
                 <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} placeholder="e.g. Rotary Oven B" />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Purchase Price (UGX)</label>
                 <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-bold" value={newAsset.purchasePrice || ''} onChange={e => setNewAsset({...newAsset, purchasePrice: parseFloat(e.target.value) || 0})} />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Depr. Rate (%)</label>
                 <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-bold" value={newAsset.depreciationRate || ''} onChange={e => setNewAsset({...newAsset, depreciationRate: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="flex gap-2">
                 <button onClick={handleAddAsset} className="flex-1 py-4 bg-indigo-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">
                    {editingAssetId ? 'Save Update' : 'Enroll Asset'}
                 </button>
                 <button onClick={() => { setShowAddForm(false); setEditingAssetId(null); }} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {/* Maintenance Record Modal */}
      {showMaintenanceForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
           <div className="bg-white max-w-lg w-full rounded-[4rem] p-12 shadow-2xl animate-softFade space-y-8">
              <div className="text-center space-y-2">
                 <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Log Maintenance Event</h3>
                 <p className="text-sm text-slate-400">Archiving technical work for {assets.find(a => a.id === showMaintenanceForm)?.name}</p>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Event Type</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold"
                      value={maintEntry.type}
                      onChange={e => setMaintEntry({...maintEntry, type: e.target.value as any})}
                    >
                       <option value="Routine">Routine Service</option>
                       <option value="Breakdown">Breakdown Repair</option>
                       <option value="Upgrade">Engineering Upgrade</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Repair Cost (UGX)</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black text-lg" 
                      placeholder="0"
                      value={maintEntry.cost || ''}
                      onChange={e => setMaintEntry({...maintEntry, cost: parseFloat(e.target.value) || 0})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Technical Description</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium text-sm h-24"
                      placeholder="Detail parts replaced or work performed..."
                      value={maintEntry.description}
                      onChange={e => setMaintEntry({...maintEntry, description: e.target.value})}
                    />
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowMaintenanceForm(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-[2rem] font-black text-xs uppercase">Discard</button>
                 <button onClick={handleAddMaintenanceRecord} className="flex-[2] py-4 bg-indigo-900 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl hover:bg-black transition-all">Archive Event</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Intelligence' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-10">
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner animate-pulse">🛠️</div>
              <div className="flex-1">
                 <h3 className="text-2xl font-bold font-serif text-slate-900">SAP-Style Predictive Audit</h3>
                 <p className="text-sm text-slate-500 leading-relaxed italic">
                    "Transition from fixed-interval maintenance to usage-based prediction. By analyzing active firing hours and throughput stress, the AI predicts component fatigue before a shutdown occurs."
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {assets.map(asset => {
                const metrics = calculateAssetMetrics(asset);
                const report = predictiveReports[asset.id];
                return (
                  <div key={asset.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                     <div className="flex justify-between items-center">
                        <h4 className="text-xl font-bold font-serif text-slate-900 uppercase">{asset.name}</h4>
                        <button 
                          onClick={() => handleRunAiMaintenanceAudit(asset)}
                          disabled={isAuditingId === asset.id}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm transition-all ${isAuditingId === asset.id ? 'bg-indigo-50 text-indigo-400 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black'}`}
                        >
                           {isAuditingId === asset.id ? 'Analyzing Duty Cycle...' : 'Run Prediction'}
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                           <span className="text-[8px] font-black text-slate-400 uppercase">Simulated Usage</span>
                           <div className="text-lg font-mono font-black text-slate-900">{Math.round(metrics.simulatedDutyHours)} Hrs</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                           <span className="text-[8px] font-black text-slate-400 uppercase">Health Coefficient</span>
                           <div className={`text-lg font-mono font-black ${metrics.healthScore > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{Math.round(metrics.healthScore)}%</div>
                        </div>
                     </div>

                     {report && (
                       <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 animate-softFade space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">AI Forecasted Event</span>
                             <span className="bg-white px-2 py-0.5 rounded text-[8px] font-black text-indigo-900 uppercase">{report.confidence}% Match</span>
                          </div>
                          <div className="text-sm font-bold text-indigo-900 italic leading-relaxed">
                             "Predicted failure of primary thermal unit near **{report.predictedFailureDate}**. Suggesting an **{report.maintenanceType}** to avoid unplanned downtime."
                          </div>
                          <div className="flex justify-between items-end border-t border-indigo-100 pt-3">
                             <div>
                                <span className="text-[7px] text-indigo-400 font-black uppercase">Projected Prevention Cost</span>
                                <div className="text-sm font-mono font-black text-indigo-900">{currency.format(report.estimatedCost)}</div>
                             </div>
                             <button className="px-4 py-1.5 bg-indigo-900 text-white rounded-lg text-[8px] font-black uppercase">Schedule Job</button>
                          </div>
                       </div>
                     )}
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {activeTab === 'Registry' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {assets.map(asset => {
             const metrics = calculateAssetMetrics(asset);
             return (
               <div key={asset.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-xl">
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${asset.status === 'Active' ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
                  
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl bg-indigo-50 text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                       {asset.category === 'Machinery' ? '⚙️' : asset.category === 'Vehicle' ? '🚛' : '🏛️'}
                     </div>
                     <div className="text-right">
                        <span className="text-[8px] font-black text-slate-300 uppercase">Book Value</span>
                        <div className="text-lg font-mono font-black text-indigo-900">{currency.format(metrics.bookValue)}</div>
                     </div>
                  </div>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-xl font-bold font-serif text-gray-900 truncate uppercase">{asset.name}</h4>
                    <button onClick={() => handleStartEdit(asset)} className="text-[9px] font-black text-indigo-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-6">{asset.status}</p>
                  
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Life-to-Date Repair Spend</span>
                      <div className="text-sm font-mono font-black text-rose-700">{currency.format(asset.totalRepairSpend || 0)}</div>
                  </div>

                  <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[8px] text-slate-400 font-black uppercase">Maintenance Drift</span>
                       <span className={`text-sm font-black font-mono ${metrics.healthScore > 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {Math.round(metrics.healthScore)}%
                       </span>
                    </div>
                    <button onClick={() => setShowMaintenanceForm(asset.id)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase">Log Event</button>
                  </div>
               </div>
             );
           })}
           <button onClick={() => { setShowAddForm(true); setEditingAssetId(null); setNewAsset({ name: '', category: 'Machinery', classification: 'Non-Current', purchaseDate: new Date().toISOString().split('T')[0], purchasePrice: 0, depreciationRate: 20, usefulLifeYears: 5, maintenanceIntervalDays: 90, status: 'Active', capacityPerShift: 0, primaryEnergySource: 'Electricity' }); }} className="p-8 rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-300 hover:text-indigo-600 transition-all flex flex-col items-center justify-center gap-2">
             <span className="text-4xl">+</span>
             <span className="text-[10px] font-black uppercase">Enroll Capital Asset</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AssetRegister;
