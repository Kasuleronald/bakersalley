
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthSession, CurrencyCode, SubscriptionTier, LanguageCode, ConnectionState } from './types';
import FloatingAssistant from './components/FloatingAssistant';
import { useTranslation } from './hooks/useTranslation';

interface NavItem { id: string; label: string; icon: string; tier: SubscriptionTier; translationKey: string; }
interface NavGroup { label: string; items: NavItem[]; }
interface LayoutProps { children: React.ReactNode; activeTab: string; setActiveTab: (tab: string) => void; session: AuthSession; onLogout: () => void; onOpenSearch: () => void; isLoaded?: boolean; activeCurrency?: CurrencyCode; setActiveCurrency?: (code: CurrencyCode) => void; subscriptionTier?: SubscriptionTier; activeLanguage?: LanguageCode; isOutletRestricted?: boolean; }

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, session, onLogout, onOpenSearch, isLoaded, activeCurrency, setActiveCurrency, subscriptionTier = 'Demo' as SubscriptionTier, activeLanguage = 'EN', isOutletRestricted = false }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [connState, setConnState] = useState<ConnectionState>('Online');
  const { t } = useTranslation(activeLanguage as LanguageCode);

  useEffect(() => {
    const updateOnlineStatus = () => setConnState(navigator.onLine ? 'Online' : 'Offline');
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const navGroups: NavGroup[] = [
    {
      label: 'Strategy',
      items: [
        { id: 'dashboard', label: 'Overview', icon: '📊', tier: 'Essentials', translationKey: 'dashboard' },
        { id: 'media-hub', label: 'Media & Growth', icon: '🎬', tier: 'Pro', translationKey: 'media_hub' },
        { id: 'strategic-growth', label: 'Strategic Command', icon: '🚀', tier: 'Pro', translationKey: 'growth' },
        { id: 'scheduler', label: 'Visual Scheduler', icon: '📅', tier: 'Pro', translationKey: 'scheduler' },
      ]
    },
    {
      label: 'Operation',
      items: [
        { id: 'snop', label: 'Shop Floor', icon: '⚡', tier: 'Essentials', translationKey: 'production' },
        { id: 'sourcing-demand', label: 'Procurement Hub', icon: '🎯', tier: 'Pro', translationKey: 'sourcing_demand' },
        { id: 'stores', label: 'RM Inventory', icon: '🏛️', tier: 'Essentials', translationKey: 'stores' },
        { id: 'waste-hub', label: 'Waste Audit', icon: '♻️', tier: 'Pro', translationKey: 'waste_hub' },
        { id: 'weighbridge', label: 'Weighbridge', icon: '⚖️', tier: 'Pro', translationKey: 'weighbridge' },
        { id: 'logistics', label: 'Fleet & Dispatch', icon: '🚚', tier: 'Pro', translationKey: 'logistics' },
        { id: 'qa', label: 'Quality Hub', icon: '🧪', tier: 'Enterprise', translationKey: 'quality' },
      ]
    },
    {
      label: 'Commercial',
      items: [
        { id: 'sales', label: 'Sales & NSV', icon: '💵', tier: 'Essentials', translationKey: 'sales' },
        { id: 'customers', label: 'CRM & Invoicing', icon: '👥', tier: 'Essentials', translationKey: 'customers' },
        { id: 'support', label: 'Support Hub', icon: '🤖', tier: 'Pro', translationKey: 'support' },
      ]
    },
    {
      label: 'Finance & Treasury',
      items: [
        { id: 'mgmt-accountant', label: 'Financial Audit', icon: '🏦', tier: 'Pro', translationKey: 'finance' },
        { id: 'cost-accountant', label: 'Cost Accountant', icon: '⚖️', tier: 'Pro', translationKey: 'costing' },
        { id: 'debtors', label: 'Receivables Audit', icon: '📑', tier: 'Pro', translationKey: 'debtors' },
        { id: 'creditors', label: 'Payables Strategy', icon: '💳', tier: 'Pro', translationKey: 'creditors' },
        { id: 'banking', label: 'Cash & Banking', icon: '🏛️', tier: 'Pro', translationKey: 'banking' },
      ]
    },
    {
      label: 'People & Systems',
      items: [
        { id: 'pc', label: 'Personnel', icon: '👥', tier: 'Essentials', translationKey: 'people' },
        { id: 'payroll', label: 'Payroll & Statutory', icon: '💸', tier: 'Pro', translationKey: 'payroll' },
        { id: 'neural-hub', label: 'Neural Hub', icon: '🧠', tier: 'Enterprise', translationKey: 'neural_hub' },
        { id: 'settings', label: 'System Settings', icon: '⚙️', tier: 'Essentials', translationKey: 'settings' },
      ]
    }
  ];

  useEffect(() => {
    const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeTab));
    if (activeGroup) setExpandedGroup(activeGroup.label);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#faf9f6] overflow-x-hidden relative">
      {/* Swipe Handle for Mobile */}
      {!isMobileMenuOpen && (
        <div 
          className="md:hidden fixed top-0 left-0 w-8 h-full z-[100] cursor-e-resize"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            const startX = touch.clientX;
            const handleTouchMove = (moveEvent: TouchEvent) => {
              const currentX = moveEvent.touches[0].clientX;
              if (currentX - startX > 50) {
                setIsMobileMenuOpen(true);
                document.removeEventListener('touchmove', handleTouchMove);
              }
            };
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', () => {
              document.removeEventListener('touchmove', handleTouchMove);
            }, { once: true });
          }}
        />
      )}

      {/* Mobile Header */}
      <header className="md:hidden glass fixed top-0 left-0 right-0 h-16 border-b border-bakery-100 z-[80] px-4 flex items-center justify-between">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-bakery-800 bg-bakery-50 rounded-xl shadow-sm active:scale-95 transition-all">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
        <div className="text-sm font-black font-serif uppercase tracking-tight text-bakery-900">BakersAlley</div>
        <div className="flex items-center gap-3">
           <button onClick={onOpenSearch} className="p-2 text-bakery-400">🔍</button>
           <div className={`w-2 h-2 rounded-full ${connState === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-bakery-100 z-[80] px-6 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', label: 'Home', icon: '🏠' },
          { id: 'snop', label: 'Ops', icon: '⚡' },
          { id: 'sales', label: 'Sales', icon: '💵' },
          { id: 'mgmt-accountant', label: 'Finance', icon: '🏦' },
          { id: 'settings', label: 'System', icon: '⚙️' },
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => handleTabChange(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-harvest-600 scale-110' : 'text-bakery-300'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-bakery-950/60 backdrop-blur-sm z-[85]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
  initial={false}
  animate={{ 
    x: typeof window !== 'undefined' && window.innerWidth >= 768 
      ? 0 
      : isMobileMenuOpen ? 0 : '-100%',
    transition: { type: 'spring', damping: 25, stiffness: 200 }
  }}
  className={`fixed top-0 left-0 bottom-0 w-64 bg-bakery-950 text-white z-[90] md:relative md:translate-x-0`}
>
        <div className="flex flex-col h-full">
          <div className="p-8 space-y-4">
            <h1 className="text-2xl font-black font-serif tracking-tighter text-harvest-400">BakersAlley</h1>
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
               <div className="text-[7px] font-black uppercase tracking-widest text-harvest-500">Enterprise Node</div>
               <div className="text-[10px] font-bold truncate">{session.user?.name}</div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
              {navGroups.map(group => (
                <div key={group.label} className="space-y-1">
                  <button onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)} className="w-full flex items-center justify-between px-4 py-2 text-[9px] font-black text-bakery-400 uppercase tracking-widest hover:text-harvest-400 transition-colors">{group.label}</button>
                  {expandedGroup === group.label && (
                    <div className="space-y-1 animate-softFade">
                      {group.items.map(item => (
                        <button key={item.id} onClick={() => handleTabChange(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-bold ${activeTab === item.id ? 'bg-harvest-500 text-bakery-950 shadow-lg' : 'text-bakery-200 hover:bg-white/5'}`}>{item.icon} {t(item.translationKey)}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </nav>
          <div className="p-6 border-t border-white/5">
             <button onClick={onLogout} className="w-full py-3 bg-white/5 hover:bg-rose-900/40 text-bakery-300 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all">Sign Out</button>
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 min-w-0 overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-12">
          {/* Main Content Header */}
          <div className="hidden md:flex justify-between items-center mb-10">
            <div className="text-[9px] font-black text-bakery-300 uppercase tracking-[0.3em]">Institutional Ledger / Enterprise v3.2</div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onOpenSearch} 
                className="group flex items-center gap-3 px-6 py-2.5 bg-white border border-bakery-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-harvest-500 hover:shadow-lg transition-all"
              >
                 <span className="opacity-40 group-hover:opacity-100 group-hover:text-harvest-600">🔍</span>
                 <span className="text-bakery-900">Quick Search</span>
                 <span className="px-1.5 py-0.5 bg-bakery-50 text-bakery-300 rounded-lg text-[8px]">⌘K</span>
              </button>
              <div className="flex bg-bakery-100 p-1 rounded-xl border border-bakery-200">
                {(['UGX', 'USD'] as CurrencyCode[]).map(code => (
                   <button key={code} onClick={() => setActiveCurrency?.(code)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${activeCurrency === code ? 'bg-white text-bakery-950 shadow-sm' : 'text-bakery-400'}`}>{code}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="animate-softFade pb-20">{children}</div>
        </div>
      </main>
      <FloatingAssistant />
    </div>
  );
};

export default Layout;
