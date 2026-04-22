
import React, { useRef, useState, useEffect } from 'react';
import { SKU, Ingredient, Activity, Employee, Sale, Transaction } from '../types';
import { downloadCSV, exportFullBakeryWorkbook } from '../utils/exportUtils';
import { apiClient } from '../services/apiClient';

interface ExportManagerProps {
  skus: SKU[];
  ingredients: Ingredient[];
  activities: Activity[];
  employees: Employee[];
  sales: Sale[];
  transactions: Transaction[];
  onResetData: () => void;
  onImportData: (data: any) => void;
  allState: any;
}

interface Snapshot {
  id: string;
  timestamp: string;
  label: string;
  data: any;
}

const SNAPSHOT_KEY = 'bakemaster_internal_snapshots';
const CLOUD_CONFIG_KEY = 'bakemaster_cloud_config';

const ExportManager: React.FC<ExportManagerProps> = ({ skus, ingredients, activities, employees, sales, transactions, onResetData, onImportData, allState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  
  // Cloud Sync State
  const [cloudUrl, setCloudUrl] = useState('');
  const [cloudKey, setCloudKey] = useState('');
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [connStatus, setConnStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');

  useEffect(() => {
    const savedSnaps = localStorage.getItem(SNAPSHOT_KEY);
    if (savedSnaps) setSnapshots(JSON.parse(savedSnaps));

    const savedCloud = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (savedCloud) {
      const config = JSON.parse(savedCloud);
      setCloudUrl(config.url);
      setCloudKey(config.key);
      setCloudEnabled(config.enabled);
    }
  }, []);

  const saveCloudConfig = (url: string, key: string, enabled: boolean) => {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify({ url, key, enabled }));
    setCloudUrl(url);
    setCloudKey(key);
    setCloudEnabled(enabled);
  };

  const handleTestConnection = async () => {
    setConnStatus('testing');
    const isOk = await apiClient.testConnection(cloudUrl, cloudKey);
    setConnStatus(isOk ? 'success' : 'fail');
    if (isOk) {
      saveCloudConfig(cloudUrl, cloudKey, true);
    }
  };

  const saveSnapshotsToStorage = (list: Snapshot[]) => {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list));
    setSnapshots(list);
  };

  const handleCreateSnapshot = () => {
    const newSnapshot: Snapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: snapshotLabel || `Snapshot ${snapshots.length + 1}`,
      data: allState
    };
    const updated = [newSnapshot, ...snapshots].slice(0, 5); 
    saveSnapshotsToStorage(updated);
    setSnapshotLabel('');
    alert("Snapshot archived.");
  };

  const handleDownloadBackup = () => {
    const blob = new Blob([JSON.stringify(allState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bakery_data_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMasterExcelExport = () => {
    exportFullBakeryWorkbook(skus, ingredients, activities, employees, sales, transactions);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif">Cloud Sync & Recovery</h2>
          <p className="text-gray-500">Enable real-time persistence with your cPanel hosting.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${cloudEnabled && connStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
              <span className={`w-2 h-2 rounded-full ${cloudEnabled && connStatus === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
              {cloudEnabled ? 'Cloud Enabled' : 'Local Only'}
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-indigo-100">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">🌐</div>
                <div>
                   <h3 className="text-xl font-bold text-slate-900 font-serif">Enterprise Cloud Sync</h3>
                   <p className="text-xs text-slate-500">Connect to your cPanel PHP script for real persistence.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PHP API Endpoint URL</label>
                   <input 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="https://yourwebsite.com/bakery_api.php"
                    value={cloudUrl}
                    onChange={e => setCloudUrl(e.target.value)}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Secret Key</label>
                   <input 
                    type="password"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="Matches your PHP $SECRET_KEY"
                    value={cloudKey}
                    onChange={e => setCloudKey(e.target.value)}
                   />
                </div>
             </div>

             <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                   <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${connStatus === 'success' ? 'bg-emerald-100 text-emerald-700' : connStatus === 'fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                      {connStatus === 'idle' ? 'Ready to Test' : connStatus === 'testing' ? 'Connecting...' : connStatus === 'success' ? 'Connection Verified' : 'Connection Failed'}
                   </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => saveCloudConfig(cloudUrl, cloudKey, false)}
                    className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-xs uppercase"
                   >
                     Disable Sync
                   </button>
                   <button 
                    onClick={handleTestConnection}
                    disabled={connStatus === 'testing'}
                    className="px-10 py-4 bg-indigo-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all"
                   >
                     Test & Enable Cloud
                   </button>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[3rem] border border-gray-100 flex flex-col justify-between group">
                <div>
                   <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">💾</div>
                   <h4 className="text-lg font-bold text-gray-900 font-serif mb-2">System Export</h4>
                   <p className="text-xs text-gray-500 leading-relaxed mb-6">Download a full JSON backup of all ledger data, including ingredients, skus, sales, employees, and transactions.</p>
                </div>
                <button onClick={handleDownloadBackup} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Download bakery_data_backup.json</button>
             </div>
             <div className="bg-indigo-900 p-8 rounded-[3rem] border border-indigo-800 text-white flex flex-col justify-between group shadow-xl">
                <div>
                   <div className="text-3xl mb-4">📊</div>
                   <h4 className="text-lg font-bold text-indigo-100 font-serif mb-2">Spreadsheet Template</h4>
                   <p className="text-xs text-indigo-100/70 leading-relaxed mb-6">Export all modules into a single XLSX workbook with embedded formulas for COSTING and PAYROLL TAX.</p>
                </div>
                <button onClick={handleMasterExcelExport} className="w-full py-3 bg-white text-indigo-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all">Export XLSX Template</button>
             </div>
          </div>
        </div>

        {/* SNAPSHOTS SECTION */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
             <h3 className="text-xl font-bold font-serif mb-6 text-amber-400">Local Snapshots</h3>
             <div className="space-y-4">
                <div className="flex gap-2">
                   <input 
                    className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none" 
                    placeholder="Label..."
                    value={snapshotLabel}
                    onChange={e => setSnapshotLabel(e.target.value)}
                   />
                   <button onClick={handleCreateSnapshot} className="bg-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Snap</button>
                </div>
                
                <div className="space-y-2 mt-6">
                   {snapshots.map(s => (
                     <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10">
                        <div className="overflow-hidden mr-2">
                           <div className="text-[10px] font-bold text-gray-300 uppercase truncate">{s.label}</div>
                           <div className="text-[8px] text-gray-500">{new Date(s.timestamp).toLocaleDateString()}</div>
                        </div>
                        <button onClick={() => onImportData(s.data)} className="px-2 py-1 bg-indigo-600 rounded-lg text-[8px] font-black">REVERT</button>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-amber-50">
             <h4 className="text-[10px] font-black text-amber-600 uppercase mb-4 tracking-widest">Excel Integration Tip</h4>
             <ul className="text-[10px] text-gray-500 space-y-3 leading-relaxed">
                <li className="flex gap-2"><span>1.</span> <span><b>Formulas:</b> The exported XLSX contains real formulas for Ugandan PAYE and Margin checks.</span></li>
                <li className="flex gap-2"><span>2.</span> <span><b>Google Sheets:</b> Simply upload the .xlsx to Google Drive to continue modeling online.</span></li>
                <li className="flex gap-2"><span>3.</span> <span><b>Scalability:</b> The Inventory sheet acts as a central price source for the SKU Costing sheet.</span></li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportManager;
