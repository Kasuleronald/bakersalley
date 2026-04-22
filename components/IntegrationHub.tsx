
import React, { useState } from 'react';
import { Webhook, ExternalIntegration, SubscriptionTier } from '../types';
import AIScanner from './AIScanner';
import GoogleDriveSync from './GoogleDriveSync';

interface IntegrationHubProps {
  webhooks: Webhook[];
  setWebhooks: (w: Webhook[]) => void;
  integrations: ExternalIntegration[];
  setIntegrations: (i: ExternalIntegration[]) => void;
  subscriptionTier: SubscriptionTier;
  allState: any;
  onImportData: (data: any) => void;
}

const EVENT_OPTIONS: Webhook['event'][] = ['SALE_CREATED', 'ORDER_CREATED', 'LOW_STOCK', 'PRODUCTION_FINISHED', 'DELIVERY_DISPATCHED'];

const IntegrationHub: React.FC<IntegrationHubProps> = ({ webhooks, setWebhooks, integrations, setIntegrations, subscriptionTier, allState, onImportData }) => {
  const [activeTab, setActiveTab] = useState<'Webhooks' | 'Apps' | 'API' | 'CloudDrive'>('CloudDrive');
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState<Partial<Webhook>>({
    url: '',
    event: 'SALE_CREATED',
    isActive: true
  });

  const handleAddWebhook = () => {
    if (!newWebhook.url) return;
    const webhook: Webhook = {
      id: `wh-${Date.now()}`,
      url: newWebhook.url,
      event: newWebhook.event as any,
      isActive: true,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`
    };
    setWebhooks([...webhooks, webhook]);
    setShowWebhookForm(false);
    setNewWebhook({ url: '', event: 'SALE_CREATED', isActive: true });
  };

  const removeWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 font-serif tracking-tight">Integration Control Hub</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">E-Commerce & External Connectivity</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto">
          {[
            { id: 'CloudDrive', label: 'Cloud Drive Sync', icon: '☁️' },
            { id: 'Apps', label: 'Apps', icon: '🔌' },
            { id: 'Webhooks', label: 'Webhooks', icon: '📡' },
            { id: 'API', label: 'API', icon: '⚡' }
          ].map((tab: any) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'CloudDrive' && (
        <GoogleDriveSync allState={allState} onImport={onImportData} />
      )}

      {activeTab === 'Apps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6 group hover:shadow-xl transition-all">
            <div className="w-20 h-20 bg-purple-50 rounded-[2rem] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">🛒</div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 font-serif">WooCommerce</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Connect your WordPress store. Incoming orders will populate the **Commercial Inbox** automatically.</p>
            </div>
            <button className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-purple-700 transition-all">Configure Webhook</button>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6 group hover:shadow-xl transition-all">
            <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">🛍️</div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 font-serif">Shopify</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Sync Shopify retail orders with factory production. Maps SKUs based on internal identifiers.</p>
            </div>
            <button className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-green-700 transition-all">Map Shopify SKUs</button>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6 group hover:shadow-xl transition-all">
            <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">📦</div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 font-serif">Delivery Partners</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Push dispatch alerts to riders (SafeBoda, Glovo, Jumia) once an order is marked **Packed**.</p>
            </div>
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 transition-all">Manage API Keys</button>
          </div>
        </div>
      )}

      {activeTab === 'Webhooks' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-3xl font-bold font-serif text-amber-400">Outbound Webhooks</h3>
              <p className="text-indigo-100 text-lg max-w-lg">Alert external services (SMS, Delivery Apps, CRMs) when internal bakery events occur.</p>
            </div>
            <button 
              onClick={() => setShowWebhookForm(true)}
              className="relative z-10 px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-amber-400 transition-all"
            >
              + Register Endpoint
            </button>
          </div>

          {showWebhookForm && (
            <div className="bg-white p-10 rounded-[3rem] border border-indigo-100 shadow-2xl animate-softFade space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Payload URL</label>
                  <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                    placeholder="https://your-app.com/webhooks"
                    value={newWebhook.url}
                    onChange={e => setNewWebhook({...newWebhook, url: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Event Trigger</label>
                  <select 
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none"
                    value={newWebhook.event}
                    onChange={e => setNewWebhook({...newWebhook, event: e.target.value as any})}
                  >
                    {EVENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                <button onClick={() => setShowWebhookForm(false)} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase">Discard</button>
                <button onClick={handleAddWebhook} className="px-12 py-4 bg-indigo-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black">Activate Webhook</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <th className="px-10 py-6">Target Endpoint</th>
                  <th className="px-6 py-6 text-center">Trigger Event</th>
                  <th className="px-6 py-6 text-center">Security Secret</th>
                  <th className="px-10 py-6 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {webhooks.map(wh => (
                  <tr key={wh.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-10 py-5">
                      <div className="font-bold text-slate-900 text-xs truncate max-w-xs">{wh.url}</div>
                      <div className="text-[8px] text-slate-400 uppercase mt-0.5">ID: {wh.id}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-indigo-100">{wh.event}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <code className="text-[9px] bg-slate-100 px-2 py-1 rounded font-mono text-slate-500">{wh.secret}</code>
                    </td>
                    <td className="px-10 py-5 text-right">
                      <button onClick={() => removeWebhook(wh.id)} className="text-rose-300 hover:text-rose-600 font-bold uppercase text-[10px]">Deactivate ✕</button>
                    </td>
                  </tr>
                ))}
                {webhooks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-300 italic font-black uppercase text-[10px] tracking-[0.2em]">No custom webhooks configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'API' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
              <div className="space-y-4">
                 <h3 className="text-3xl font-bold font-serif text-slate-900">Push-API Explorer</h3>
                 <p className="text-slate-500 leading-relaxed max-w-3xl">
                   Integrate any third-party app with your bakery by pushing JSON payloads to your server.
                 </p>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2">Injecting Online Orders</h4>
                 <p className="text-xs text-slate-500">Post this payload to `bakery_api.php?action=write` to inject an e-commerce order:</p>
                 <div className="bg-slate-900 p-8 rounded-3xl">
                    <pre className="text-[11px] text-indigo-300 font-mono overflow-x-auto leading-relaxed">
{`{
  "resource": "orders",
  "data": {
    "isOnlineOrder": true,
    "platform": "WooCommerce",
    "totalPrice": 45000,
    "deliveryAddress": "Plot 12, Kololo, Kampala",
    "items": [
      { "skuId": "SKU-bread-1", "quantity": 10, "unitPrice": 4500 }
    ],
    "notes": "Gate code 1234"
  }
}`}
                    </pre>
                 </div>
              </div>

              <div className="p-8 bg-amber-50 rounded-[3rem] border border-amber-100">
                 <div className="flex gap-6 items-center">
                    <div className="text-4xl">🔑</div>
                    <div className="space-y-1">
                       <h5 className="font-bold text-amber-900 uppercase">Authorization Required</h5>
                       <p className="text-xs text-amber-700 leading-relaxed">
                         All e-commerce injections require the `SECRET_KEY` in the `Authorization` header to prevent unauthorized ledger writes.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationHub;
