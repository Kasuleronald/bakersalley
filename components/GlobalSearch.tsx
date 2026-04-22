import React, { useState, useEffect, useMemo } from 'react';
import { SKU, Ingredient } from '../types';
import { getTrendingBakeryInsights } from '../services/geminiService';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  skus: SKU[];
  ingredients: Ingredient[];
  onNavigate: (tab: string, subTab?: string) => void;
  location?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, skus, ingredients, onNavigate, location = 'Kampala' }) => {
  const [query, setQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ suggestions: string[], urls: string[] } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // AI Discovery Trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
       if (query.length >= 3 && (query.toLowerCase().includes('cake') || query.toLowerCase().includes('bread') || query.toLowerCase().includes('bakery'))) {
          setIsAiLoading(true);
          const data = await getTrendingBakeryInsights(query, location);
          if (data) setAiSuggestions(data);
          setIsAiLoading(false);
       } else {
          setAiSuggestions(null);
       }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [query, location]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', type: 'Module', keywords: ['summary', 'analytics', 'home'] },
    { id: 'performance', label: 'Performance Analysis', icon: '📈', type: 'Module', keywords: ['trends', 'growth', 'charts'] },
    { id: 'snop', label: 'S & OP Hub', icon: '🎯', type: 'Module', keywords: ['planning', 'forecast', 'supply', 'demand'] },
    { id: 'mgmt-accountant', label: 'Management Accountant', icon: '🏦', type: 'Module', keywords: ['p&l', 'profit', 'loss', 'income', 'cashflow'] },
    { id: 'calendar', label: 'Production Scheduler', icon: '📅', type: 'Module', keywords: ['date', 'plan', 'timetable'] },
    { id: 'strategic-growth', label: 'Growth Center', icon: '🚀', type: 'Module', keywords: ['marketing', 'roi', 'portfolio', 'bcg', 'mix', 'breakeven', 'margin', 'bep', 'cvp', 'simulation'] },
    { id: 'sourcing-demand', label: 'Supply Planning', icon: '🎯', type: 'Module', keywords: ['procurement', 'sourcing', 'buying', 'suppliers', 'purchasing', 'vendor', 'demand', 'forecast', 'mrp', 'capacity'] },
    { id: 'master-data', label: 'Production Library', icon: '🥖', type: 'Module', keywords: ['recipes', 'formulations', 'skus', 'products'] },
    { id: 'hc', label: 'Human Capital', icon: '👥', type: 'Module', keywords: ['payroll', 'staff', 'employees', 'salaries', 'hiring'] },
    { id: 'stores', label: 'Raw Materials Inventory', icon: '🌾', type: 'Module', keywords: ['warehouse', 'stock', 'inventory', 'reconciliation'], subTab: 'raw' },
    { id: 'debtors', label: 'Debtors Registry', icon: '📑', type: 'Module', keywords: ['receivables', 'aged debt', 'credits', 'collections'] },
    { id: 'creditors', label: 'Creditors Hub', icon: '💳', type: 'Module', keywords: ['payables', 'loans', 'financing', 'debts'] },
    { id: 'assets', label: 'Asset Register', icon: '🏗️', type: 'Module', keywords: ['machinery', 'equipment', 'depreciation', 'valuation'] },
    { id: 'customers', label: 'CRM & Invoicing', icon: '🧾', type: 'Module', keywords: ['billing', 'sales orders', 'wholesale', 'customers', 'clients'] },
    { id: 'sales', label: 'Sales & POS', icon: '💵', type: 'Module', keywords: ['retail', 'cashier', 'shop', 'revenue'] },
    { id: 'qa', label: 'Quality Assurance', icon: '🧪', type: 'Module', keywords: ['qc', 'inspection', 'unbs', 'compliance', 'sops'] },
    { id: 'decision-hub', label: 'Strategic Decision HUB', icon: '🧠', type: 'Module', keywords: ['ai', 'optimization', 'what-if', 'simulation'] },
  ];

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const filteredNav = navItems.filter(i => 
      i.label.toLowerCase().includes(q) || 
      i.keywords.some(k => k.includes(q))
    );
    const filteredSkus = skus.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    const filteredIngs = ingredients.filter(i => i.name.toLowerCase().includes(q));

    return [
      ...filteredNav.map(i => ({ ...i, category: 'System Modules' })),
      ...filteredSkus.map(s => ({ id: s.id, label: s.name, icon: '🥖', type: 'Product SKU', category: 'Production Library', meta: s.category, subTab: 'products' })),
      ...filteredIngs.map(i => ({ id: i.id, label: i.name, icon: '🌾', type: 'Ingredient', category: 'Raw Materials', meta: `${i.currentStock} ${i.unit} in stock`, subTab: 'ingredients' })),
    ].slice(0, 8);
  }, [query, skus, ingredients]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl border border-indigo-100 overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
        <div className="p-8 border-b border-gray-100 flex items-center gap-6 shrink-0">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">🔍</div>
          <input
            autoFocus
            type="text"
            className="flex-1 text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-200"
            placeholder="Search catalog, clients, or trending products..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <span className="text-[10px] font-black text-slate-300 border border-slate-100 px-3 py-1 rounded-xl uppercase">Esc to Close</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-7 p-4 space-y-2 border-r border-slate-50">
            <div className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Database Matches</div>
            {results.length > 0 ? results.map((res: any, idx: number) => (
                <button
                  key={`${res.id}-${idx}`}
                  onClick={() => {
                    onNavigate(res.id, res.subTab);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-5 rounded-[2rem] hover:bg-indigo-50 transition-all group text-left"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-50 group-hover:border-indigo-200 transition-all">
                      {res.icon}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 group-hover:text-indigo-900 transition-colors uppercase tracking-tight">{res.label}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {res.type} {res.meta ? `• ${res.meta}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Audit →</span>
                </button>
            )) : query ? (
              <div className="p-20 text-center text-slate-300">
                <div className="text-5xl mb-4 grayscale opacity-20">🥐</div>
                <p className="font-bold uppercase text-xs">No local records for "{query}"</p>
              </div>
            ) : (
                <div className="p-10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: 'Growth Strategy', q: 'marketing', icon: '🚀' },
                          { name: 'Financial Audit', q: 'mgmt', icon: '🏦' },
                          { name: 'Price Masters', q: 'price', icon: '🏷️' },
                          { name: 'Oven Status', q: 'snop', icon: '🏗️' }
                        ].map(item => (
                          <button 
                            key={item.name}
                            onClick={() => setQuery(item.q)}
                            className="px-6 py-5 bg-slate-50 rounded-[2rem] text-left hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 group flex items-center gap-4"
                          >
                             <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                             <span className="text-xs font-black text-slate-700 uppercase group-hover:text-indigo-900">{item.name}</span>
                          </button>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-slate-50/50 p-8 space-y-8">
             <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Neural Discovery Pulse</h4>
                {isAiLoading && <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>}
             </div>

             {aiSuggestions ? (
               <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-3">
                     {aiSuggestions.suggestions.map((s, i) => (
                       <button 
                        key={i} 
                        onClick={() => setQuery(s)}
                        className="w-full p-5 bg-white rounded-3xl border border-indigo-100 shadow-sm text-left hover:border-indigo-600 hover:shadow-lg transition-all group"
                       >
                          <div className="text-[8px] font-black text-indigo-400 uppercase mb-1">Market Trend Suggestion</div>
                          <div className="text-sm font-black text-indigo-900 group-hover:text-indigo-600">{s}</div>
                       </button>
                     ))}
                  </div>
                  
                  {aiSuggestions.urls.length > 0 && (
                    <div className="pt-6 border-t border-slate-200">
                       <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Market Grounding Sources</h5>
                       <div className="space-y-2">
                          {aiSuggestions.urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block text-[10px] font-mono text-indigo-400 truncate hover:text-indigo-600">
                               {url}
                            </a>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center text-center py-20 opacity-30 grayscale space-y-4">
                  <div className="text-6xl">📡</div>
                  <p className="text-[10px] font-black uppercase tracking-widest max-w-[200px]">Type "cake", "bread" or "bakery" to scan local market trends via Neural Discovery</p>
               </div>
             )}
          </div>
        </div>
        <div className="p-4 bg-slate-900 border-t border-indigo-900 text-center">
           <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">BakersAlley Search Intelligence Platform v3.2</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
