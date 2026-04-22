import React, { useState } from 'react';
import { SKU, Customer, Sale, User } from '../types';
import AdStudio from './AdStudio';
import SocialDiscovery from './SocialDiscovery';
import EngagementAutomator from './EngagementAutomator';

interface MediaHubProps {
  skus: SKU[];
  customers: Customer[];
  sales: Sale[];
  currency: { format: (v: number) => string };
  currentUser: User;
  location?: string;
  nation?: string;
}

type MediaTab = 'Studio' | 'SocialPulse' | 'Automator';

const MediaHub: React.FC<MediaHubProps> = (props) => {
  const [activeTab, setActiveTab] = useState<MediaTab>('Studio');

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
             <span className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">🎬</span>
             <h2 className="text-3xl font-bold font-serif tracking-tight uppercase">Media & Growth Hub</h2>
          </div>
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest pl-1 mt-1">AI Ad Production • Social Discovery • CRM Automation</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'Studio', label: 'Ad Studio', icon: '🎨' },
            { id: 'SocialPulse', label: 'Web Pulse', icon: '📡' },
            { id: 'Automator', label: 'Engagement', icon: '🤖' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as MediaTab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="animate-fadeIn">
        {activeTab === 'Studio' && <AdStudio skus={props.skus} currency={props.currency} />}
        {activeTab === 'SocialPulse' && (
          <SocialDiscovery 
            location={props.location || 'Kampala'} 
            nation={props.nation || 'Uganda'} 
          />
        )}
        {activeTab === 'Automator' && (
          <EngagementAutomator 
            customers={props.customers} 
            sales={props.sales} 
            skus={props.skus}
            currency={props.currency}
          />
        )}
      </div>

      <div className="bg-indigo-50 p-10 rounded-[4rem] border border-indigo-100 flex flex-col md:flex-row items-center gap-10">
         <div className="text-5xl grayscale opacity-40 shrink-0">📈</div>
         <div>
            <h4 className="text-xl font-bold text-indigo-900 font-serif mb-2 uppercase">Strategic Visibility Note</h4>
            <p className="text-sm text-indigo-700 leading-relaxed italic">
              "Effective marketing is about <b>Relevance</b> and <b>Recurrence</b>. Use the Web Pulse to identify what your local community is craving, then use the Ad Studio to generate the visual and audio assets required to win their attention. The Engagement Automator ensures your best customers feel recognized, protecting your high-LTV revenue base."
            </p>
         </div>
      </div>
    </div>
  );
};

export default MediaHub;