
import React, { useState } from 'react';
// Fixed: Removed missing and unused JurisdictionID import from types
import { TaxConfig, CurrencyCode, User, IndustryProfile, Activity, SKU, SubscriptionTier, LanguageCode, CostingMethod, BusinessProfile } from '../types';
import { generateIndustryBlueprint } from '../services/geminiService';
import SubscriptionManager from './SubscriptionManager';
import GoogleDriveSync from './GoogleDriveSync';

interface SettingsHubProps {
  taxConfig: TaxConfig;
  setTaxConfig: (config: TaxConfig) => void;
  activeCurrency: CurrencyCode;
  setActiveCurrency: (code: CurrencyCode) => void;
  currentUser: User;
  subscriptionTier: SubscriptionTier;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  onNavigate: (tab: string) => void;
  setActivities?: (acts: Activity[]) => void;
  setSkus?: (skus: SKU[]) => void;
  businessProfile?: BusinessProfile;
  setBusinessProfile?: (profile: BusinessProfile) => void;
  allState: any;
  onImportData: (data: any) => void;
}

const SettingsHub: React.FC<SettingsHubProps> = ({ 
  taxConfig, setTaxConfig, activeCurrency, setActiveCurrency, currentUser, subscriptionTier, setSubscriptionTier, onNavigate, setActivities, setSkus,
  businessProfile, setBusinessProfile, allState, onImportData
}) => {
  const [activeTab, setActiveTab] = useState<'Profile' | 'Finance' | 'Nexus' | 'Billing'>('Profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isArchitectLoading, setIsArchitectLoading] = useState(false);
  const [customIndustryDesc, setCustomIndustryDesc] = useState('');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("System configuration synchronized and persisted locally.");
    }, 800);
  };

  const handleArchitectIndustry = async () => {
    if (taxConfig.industry === 'Bakery' && !customIndustryDesc) {
      setTaxConfig({
        ...taxConfig,
        industry: 'Bakery',
        industryStages: undefined,
        industryTerminology: undefined,
        industryQCSpecs: undefined
      });
      alert("System recalibrated to Native Bakery standards.");
      return;
    }

    const description = customIndustryDesc || taxConfig.industry;
    if (!description || !taxConfig.nation) {
      alert("Please select a target nation and describe your industry first.");
      return;
    }
    
    setIsArchitectLoading(true);
    const blueprint = await generateIndustryBlueprint(description as string, taxConfig.nation);
    
    if (blueprint) {
      setTaxConfig({
        ...taxConfig,
        industry: description as IndustryProfile,
        industryStages: blueprint.stages,
        industryTerminology: blueprint.terminology,
        industryQCSpecs: blueprint.qcSpecs,
        customLegalRegistry: [...(taxConfig.customLegalRegistry || []), ...blueprint.legalClauses],
      });

      if (setActivities && blueprint.suggestedActivities) {
        const newActivities: Activity[] = blueprint.suggestedActivities.map((a: any, i: number) => ({
          id: `ai-act-${Date.now()}-${i}`,
          name: a.name,
          rate: 0,
          driver: a.driver,
          department: 'Production',
          energyCategory: (a.energy || 'Other') as any
        }));
        setActivities(newActivities);
      }
      
      alert(`The AI Architect has deployed the ${description} blueprint.`);
      setCustomIndustryDesc('');
    }
    setIsArchitectLoading(false);
  };

  return (
    <div className="space-y-10 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-sm">
        <div>
          <h3 className="text-3xl font-bold font-serif text-white uppercase tracking-tighter">System Configuration</h3>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-1">Tenant Profile • Private Cloud • Compliance Nexus</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto scrollbar-hide">
          {['Profile', 'Finance', 'Nexus', 'Billing'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'Profile' && businessProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Business Identity</label>
                <input 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" 
                  value={businessProfile.name} 
                  onChange={e => setBusinessProfile?.({...businessProfile, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Primary City/Location</label>
                <input 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" 
                  value={businessProfile.primaryLocation} 
                  onChange={e => setBusinessProfile?.({...businessProfile, primaryLocation: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Detailed Business Address</label>
                <input 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" 
                  value={businessProfile.address || ''} 
                  onChange={e => setBusinessProfile?.({...businessProfile, address: e.target.value})}
                  placeholder="Plot #, Street Name, Area..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Official Contact Number</label>
                <input 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" 
                  value={businessProfile.phone || ''} 
                  onChange={e => setBusinessProfile?.({...businessProfile, phone: e.target.value})}
                  placeholder="+256 ..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Official Email</label>
                <input 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" 
                  value={businessProfile.email || ''} 
                  onChange={e => setBusinessProfile?.({...businessProfile, email: e.target.value})}
                  placeholder="contact@business.com"
                />
              </div>
            </div>
            <button onClick={handleSave} disabled={isSaving} className="bg-indigo-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all">
              {isSaving ? 'Synchronizing...' : 'Save Profile Updates'}
            </button>
          </div>
          <aside className="lg:col-span-4 bg-indigo-900 p-8 rounded-[3.5rem] text-white shadow-xl flex flex-col justify-center text-center space-y-6 border border-white/10">
            <div className="text-6xl">🏢</div>
            <h4 className="text-xl font-bold font-serif text-amber-400 uppercase">Institutional Branding</h4>
            <p className="text-xs text-indigo-100 italic leading-relaxed">
              "Your business profile defines the local jurisdiction and the branding headers for all transactional documents. Ensure your phone and address are accurate for your customers' records."
            </p>
          </aside>
        </div>
      )}

      {activeTab === 'Nexus' && (
        <GoogleDriveSync allState={allState} onImport={onImportData} businessProfile={businessProfile} setBusinessProfile={setBusinessProfile} />
      )}

      {activeTab === 'Billing' && (
        <SubscriptionManager currentTier={subscriptionTier} setTier={setSubscriptionTier} />
      )}
    </div>
  );
};

export default SettingsHub;
