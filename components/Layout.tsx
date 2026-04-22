import React, { useState, useEffect, useMemo } from 'react';
import { AuthSession, CurrencyCode, SubscriptionTier } from '../types';

interface NavItem { id: string; label: string; icon: string; tier: SubscriptionTier; }
interface NavGroup { label: string; items: NavItem[]; }
interface LayoutProps { children: React.ReactNode; activeTab: string; setActiveTab: (tab: string) => void; session: AuthSession; onLogout: () => void; onOpenSearch: () => void; isLoaded?: boolean; activeCurrency?: CurrencyCode; setActiveCurrency?: (code: CurrencyCode) => void; subscriptionTier?: SubscriptionTier; }

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, session, onLogout, onOpenSearch, isLoaded, activeCurrency, setActiveCurrency, subscriptionTier = 'Demo' as SubscriptionTier }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define navigation groups
  const navGroups: NavGroup[] = [
    {
      label: 'Strategy',
      items: [
        { id: 'dashboard', label: 'Overview', icon: '📊', tier: 'Essentials' },
        { id: 'strategic-growth', label: 'Growth Center', icon: '🚀', tier: 'Pro' },
        { id: 'decision-hub', label: 'Decision HUB', icon: '🧠', tier: 'Enterprise' },
        { id: 'sourcing-demand', label: 'Procurement Hub', icon: '🎯', tier: 'Enterprise' },
        { id: 'demo-lab', label: 'Demo Lab', icon: '🎬', tier: 'Demo' },
        { id: 'risk-hub', label: 'Risk Hub', icon: '🛡️', tier: 'Enterprise' },
      ]
    },
    {
      label: 'Operation',
      items: [
        { id: 'inv-dash', label: 'Inventory Audit', icon: '📊', tier: 'Essentials' },
        { id: 'stores', label: 'RM Inventory', icon: '🏛️', tier: 'Essentials' },
        { id: 'finished-goods', label: 'Warehouse', icon: '🥖', tier: 'Essentials' },
        { id: 'branch-pos', label: 'Branch & POS Control', icon: '🏪', tier: 'Essentials' },
        { id: 'troubleshoot', label: 'Diagnostic Lab', icon: '🔬', tier: 'Enterprise' },
        { id: 'qa', label: 'Quality', icon: '🧪', tier: 'Enterprise' },
        { id: 'snop', label: 'Production Queue', icon: '🏗️', tier: 'Essentials' },
        { id: 'assets', label: 'Maintenance Desk', icon: '🛠️', tier: 'Pro' },
      ]
    },
    {
      label: 'HR & Personnel',
      items: [
        { id: 'hc', label: 'Personnel Management', icon: '👥', tier: 'Essentials' },
      ]
    },
    {
      label: 'Commercial',
      items: [
        { id: 'sales', label: 'Sales & NSV', icon: '💵', tier: 'Essentials' },
        { id: 'customers', label: 'CRM & Invoicing', icon: '👥', tier: 'Essentials' },
      ]
    },
    {
      label: 'Finance',
      items: [
        { id: 'mgmt-accountant', label: 'Financial Audit', icon: '🏦', tier: 'Pro' },
        { id: 'product-costing', label: 'Product Costing Hub', icon: '⚖️', tier: 'Pro' },
        { id: 'budgeting', label: 'Master Budgeting', icon: '📅', tier: 'Pro' },
        { id: 'banking', label: 'Banking & Treasury', icon: '🏛️', tier: 'Pro' },
        { id: 'expenses', label: 'Expense Ledger', icon: '🧾', tier: 'Essentials' },
      ]
    },
    {
      label: 'System & Data',
      items: [
        { id: 'reports', label: 'Reporting Hub', icon: '📈', tier: 'Essentials' },
        { id: 'master-data', label: 'Production BOMs & Recipes', icon: '📜', tier: 'Essentials' },
        { id: 'procurement', label: 'Sourcing', icon: '📦', tier: 'Essentials' },
        { id: 'settings', label: 'System Settings', icon: '⚙️', tier: 'Essentials' },
      ]
    },
    {
      label: 'Help & Support',
      items: [
        { id: 'help', label: 'System Manual', icon: '📖', tier: 'Essentials' },
      ]
    }
  ];

  useEffect(() => {
    const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeTab));
    if (activeGroup) {
      setExpandedGroup(activeGroup.label);
    } else {
      setExpandedGroup('Help & Support');
    }
  }, [activeTab]);

  const tierWeight: Record<SubscriptionTier, number> = { 
    Essentials: 1, 
    Pro: 2, 
    Enterprise: 3, 
    Demo: 3 
  };

  const filteredGroups = useMemo(() => {
    return navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => tierWeight[subscriptionTier] >= tierWeight[item.tier])
    })).filter(group => group.items.length > 0);
  }, [subscriptionTier]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const getTierStyles = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'Enterprise': return 'bg-coffee-900 text-coffee-100 border-coffee-800';
      case 'Demo': return 'bg-emerald-900 text-emerald-100 border-emerald-800';
      case 'Pro': return 'bg-coffee-100 text-coffee-900 border-coffee-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#faf9f6] overflow-x-hidden">
      <header className="md:hidden glass fixed top-0 left-0 right-0 h-16 border-b border-coffee-100 z-[80] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-coffee-800 hover:bg-coffee-50 rounded-xl transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <div className="text-sm font-bold text-coffee-900 font-serif tracking-tight">
            <span className="text-coffee-600">🏛️</span> BakersAlley
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => handleTabChange('help')} className={`p-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm ${activeTab === 'help' ? 'ring-2 ring-amber-500' : ''}`}>📖</button>
           <button onClick={() => handleTabChange('settings')} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border tracking-tighter shadow-sm ${getTierStyles(subscriptionTier)}`}>{subscriptionTier}</button>
        </div>
      </header>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-coffee-950/40 backdrop-blur-sm z-[85] md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-[90] transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full border-r border-coffee-100'}`}>
        <div className="flex flex-col h-full">
           <div className="p-8 hidden md:block space-y-4">
             <h1 className="text-xl font-semibold text-coffee-900 font-serif flex items-center gap-2 tracking-tight"><span className="text-coffee-600">🏛️</span> BakersAlley</h1>
             <button onClick={() => handleTabChange('settings')} className={`w-full flex items-center justify-between px-4 py-2 rounded-2xl border transition-all hover:scale-[1.02] shadow-sm group ${getTierStyles(subscriptionTier)}`}>
                <div className="text-left">
                  <div className="text-[7px] font-black uppercase tracking-widest opacity-60">Control Branch</div>
                  <div className="text-[10px] font-black uppercase tracking-tighter">Enterprise Master</div>
                </div>
                <span className="text-xs group-hover:translate-x-1 transition-transform">⚙️</span>
             </button>
           </div>
           <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide pb-10">
              {filteredGroups.map(group => (
                <div key={group.label} className="space-y-1">
                  <button onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-coffee-300 uppercase tracking-widest hover:text-coffee-600 transition-colors">{group.label}</button>
                  {expandedGroup === group.label && (
                    <div className="space-y-1 animate-softFade">
                      {group.items.map(item => (
                        <button key={item.id} onClick={() => handleTabChange(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-xl transition-all text-sm font-medium ${activeTab === item.id ? 'bg-coffee-50 text-coffee-900 border border-coffee-100 shadow-sm' : 'text-stone-500 hover:text-coffee-800'}`}><span className="text-base">{item.icon}</span>{item.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
           </nav>
           <div className="p-6 border-t border-coffee-50 space-y-3 bg-stone-50/50">
             <button onClick={() => handleTabChange('help')} className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${activeTab === 'help' ? 'bg-amber-600 text-white border-amber-600 shadow-lg' : 'bg-white border-amber-100 text-amber-600 hover:bg-amber-50'}`}><span>📖</span> System Manual</button>
             {/* Fixed: changed onLogout to standard onClick prop */}
             <button onClick={onLogout} className="w-full py-3 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-2xl text-xs font-bold transition-colors">Sign Out</button>
           </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-12">
          <div className="hidden md:flex justify-between items-center mb-10">
            <div className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em]">Enterprise Ledger / v3.1</div>
            <div className="flex items-center gap-6">
              <button onClick={() => handleTabChange('help')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase border transition-all shadow-sm ${activeTab === 'help' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-amber-100 text-amber-600 hover:bg-amber-50'}`}><span>📖</span> Help & Manual</button>
              {subscriptionTier === 'Enterprise' && setActiveCurrency && (
                <div className="hidden lg:flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  {(['UGX', 'USD', 'EUR'] as CurrencyCode[]).map(code => (
                    <button key={code} onClick={() => setActiveCurrency(code)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeCurrency === code ? 'bg-white text-coffee-900 shadow-sm' : 'text-stone-400'}`}>{code}</button>
                  ))}
                </div>
              )}
              <button onClick={onOpenSearch} className="text-sm font-medium px-4 py-2 bg-stone-50 rounded-xl border border-stone-100 hover:bg-stone-100 transition-colors">Search ⌘K</button>
            </div>
          </div>
          <div className="animate-softFade pb-20 md:pb-0">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Layout;