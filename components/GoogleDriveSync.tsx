
import React, { useState, useEffect } from 'react';
import { googleDriveService } from '../services/googleDriveService';
import { BusinessProfile } from '../types';

interface GoogleDriveSyncProps {
  allState: any;
  onImport: (data: any) => void;
  businessProfile?: BusinessProfile;
  setBusinessProfile?: (profile: BusinessProfile) => void;
}

const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ allState, onImport, businessProfile, setBusinessProfile }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [pairingLink, setPairingLink] = useState<string>('');

  useEffect(() => {
    setPairingLink(window.location.href);
    if (businessProfile?.cloudFileId) {
      setFileId(businessProfile.cloudFileId);
    }
  }, [businessProfile]);

  const handleConnect = () => {
    const token = prompt("Enter your Google Drive OAuth2 Access Token:\n(Get one from https://developers.google.com/oauthplayground for testing)");
    if (token) {
      googleDriveService.setToken(token);
      setIsConnected(true);
      checkDrive();
    }
  };

  const checkDrive = async () => {
    try {
      const id = await googleDriveService.findMasterFile();
      setFileId(id);
      if (id) {
        const data = await googleDriveService.downloadDb(id);
        onImport(data);
        setLastSync(new Date().toLocaleTimeString());
        
        if (setBusinessProfile && businessProfile) {
          setBusinessProfile({ ...businessProfile, cloudFileId: id });
        }
      }
    } catch (e) {
      console.error(e);
      setIsConnected(false);
    }
  };

  const handlePush = async () => {
    setIsSyncing(true);
    try {
      const newId = await googleDriveService.uploadDb(allState, fileId || undefined);
      setFileId(newId);
      setLastSync(new Date().toLocaleTimeString());
      
      if (setBusinessProfile && businessProfile) {
        setBusinessProfile({ ...businessProfile, cloudFileId: newId });
      }
      
      alert("Private Cloud Nexus synchronized. Your industrial data is now persisted in your sovereign storage.");
    } catch (e: any) {
      alert(`Nexus Sync Failed: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePull = async () => {
    if (!fileId) return;
    setIsSyncing(true);
    try {
      const data = await googleDriveService.downloadDb(fileId);
      onImport(data);
      setLastSync(new Date().toLocaleTimeString());
      alert("Master ledger pulled from Private Cloud storage.");
    } catch (e: any) {
      alert(`Pull Failed: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pb-10 border-b border-slate-50">
          <div className="flex items-center gap-8">
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl transition-all duration-700 ${isConnected ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-50 text-slate-300'}`}>
              {isConnected ? '📡' : '☁️'}
            </div>
            <div>
              <h3 className="text-3xl font-bold font-serif text-slate-900 uppercase tracking-tighter">Private Cloud Nexus</h3>
              <div className="flex items-center gap-3 mt-2">
                <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-slate-200'}`}></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {isConnected ? 'Sovereign Connection Established' : 'Standalone SaaS Mode (Local Data)'}
                </span>
              </div>
            </div>
          </div>
          
          {!isConnected ? (
            <button 
              onClick={handleConnect}
              className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
            >
              Link Sovereign Account
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
               <div className="text-left">
                  <div className="text-[8px] font-black text-indigo-400 uppercase">Tenant ID</div>
                  <div className="text-xs font-bold text-indigo-900 truncate max-w-[150px]">{businessProfile?.id || 'BAK-DEFAULT'}</div>
               </div>
               <button onClick={() => setIsConnected(false)} className="w-8 h-8 rounded-full bg-white text-rose-500 flex items-center justify-center shadow-sm hover:bg-rose-50 transition-all">✕</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  disabled={!isConnected || isSyncing}
                  onClick={handlePush}
                  className={`p-10 rounded-[3rem] border-2 text-left transition-all flex flex-col justify-between h-64 group ${isConnected ? 'bg-white border-indigo-100 hover:border-indigo-600 hover:shadow-2xl' : 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'}`}
                >
                   <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📤</div>
                   <div>
                      <h4 className="text-lg font-black text-slate-900 uppercase">Push Data to Cloud</h4>
                      <p className="text-xs text-slate-400 leading-relaxed italic mt-1">Sync your locally modified ledger with your private storage cluster.</p>
                   </div>
                </button>

                <button 
                  disabled={!isConnected || !fileId || isSyncing}
                  onClick={handlePull}
                  className={`p-10 rounded-[3rem] border-2 text-left transition-all flex flex-col justify-between h-64 group ${isConnected && fileId ? 'bg-white border-emerald-100 hover:border-emerald-600 hover:shadow-2xl' : 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'}`}
                >
                   <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📥</div>
                   <div>
                      <h4 className="text-lg font-black text-slate-900 uppercase">Pull Master State</h4>
                      <p className="text-xs text-slate-400 leading-relaxed italic mt-1">Restore your ERP state from your sovereign cloud backup.</p>
                   </div>
                </button>
             </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
             <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white space-y-6 shadow-xl flex-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10"></div>
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Nexus Health</h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold uppercase">Encryption</span>
                    <span className="text-emerald-400 font-mono font-black">AES-256 ACTIVE</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold uppercase">Storage Provider</span>
                    <span className="text-white font-mono font-black">{businessProfile?.privateCloudProvider || 'Standalone'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold uppercase">SaaS Heartbeat</span>
                    <span className="text-emerald-400 font-mono font-black">STABLE</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 mt-4">
                   <div className="text-[8px] font-black text-indigo-300 uppercase">Last Sync Timestamp</div>
                   <div className="text-sm font-mono font-black text-white">{lastSync || 'Never'}</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="p-12 bg-indigo-900 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
         <div className="text-7xl opacity-30 grayscale shrink-0">🏛️</div>
         <div className="space-y-4">
            <h4 className="text-3xl font-bold font-serif text-amber-400 uppercase">Hybrid Sovereign SaaS Philosophy</h4>
            <p className="text-base text-indigo-100/70 leading-relaxed max-w-4xl italic">
              "BakersAlley 3.1 combines the ease of SaaS with the security of a Private Cloud. While we provide the intelligence layer (AI audits, UI, and process math), your data never touches our servers. It stays in **your** Google Drive, encrypted with **your** local key. This is true data sovereignty for the industrial age."
            </p>
         </div>
      </div>
    </div>
  );
};

export default GoogleDriveSync;
