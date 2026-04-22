
import React from 'react';
import { LanguageCode, BusinessProfile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { generateFullUserManualPDF } from '../utils/manualUtils';
import { generateSystemBlueprintPDF } from '../utils/blueprintUtils';
import { generateDeploymentPlanPDF } from '../utils/exportUtils';
import { HELP_SECTIONS, LAUNCH_CHECKLIST } from '../constants';

interface StatItem {
  label: string;
  value: number;
  icon: string;
  sub: string;
  targetTab: string;
  isUnits?: boolean;
}

interface DashboardProps {
  cashOnHand: number;
  totalRevenue: number;
  currency: { formatCompact: (v: number) => string };
  onNavigate: (tab: string) => void;
  activeLanguage?: LanguageCode;
  businessProfile?: BusinessProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ cashOnHand, totalRevenue, currency, onNavigate, activeLanguage = 'EN', businessProfile }) => {
  const { t } = useTranslation(activeLanguage as LanguageCode);

  const stats: StatItem[] = [
    { label: t('market_liquidity'), value: cashOnHand, icon: '🏦', sub: 'Verified Treasury', targetTab: 'banking' },
    { label: t('revenue_pool'), value: totalRevenue, icon: '💰', sub: 'Life-to-Date', targetTab: 'sales' },
    { label: t('in_transit'), value: 1250, icon: '🚚', sub: 'Factory to Branch', targetTab: 'logistics', isUnits: true },
    { label: t('burn_rate'), value: 450000, icon: '🔥', sub: 'Daily Outflow', targetTab: 'expenses' }
  ];

  const categories = [
    { 
      id: 'master-data', 
      name: 'Bread Mastery', 
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800', 
      desc: 'Recipe engineering for artisan & industrial loaves.' 
    },
    { 
      id: 'master-data', 
      name: 'Pâtisserie & Cakes', 
      img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800', 
      desc: 'Custom formulation and decoration costing.' 
    },
    { 
      id: 'master-data', 
      name: 'Pastry Precision', 
      img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800', 
      desc: 'Layered dough and laminated profit margins.' 
    }
  ];

  return (
    <div className="space-y-10 animate-softFade">
      {/* HERO SECTION - HARVEST THEME */}
      <section className="relative h-80 rounded-[4rem] overflow-hidden shadow-2xl group border-4 border-white ring-1 ring-black/5">
        <img 
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1600" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
          alt="Wheat Harvest"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bakery-950 via-bakery-950/40 to-transparent"></div>
        <div className="relative h-full flex flex-col justify-center px-12 space-y-4">
          <div className="flex items-center gap-3">
             <span className="px-4 py-1 bg-harvest-500 text-bakery-950 rounded-full text-[10px] font-black uppercase tracking-widest">Supply Chain Foundation</span>
          </div>
          <h2 className="text-6xl font-black font-serif text-white tracking-tighter leading-none">
            From the Field <br/>to the <span className="text-harvest-400 italic">Ledger.</span>
          </h2>
          <p className="text-bakery-100 max-w-md text-sm italic font-medium">
            Managing the transformation of harvest grains into industrial wealth with neural precision.
          </p>
        </div>
      </section>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate(stat.targetTab)}
            className="bg-white p-8 rounded-[3rem] border border-bakery-100 shadow-sm space-y-6 group hover:border-harvest-400 hover:shadow-xl transition-all text-left w-full active:scale-[0.98]"
          >
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl bg-bakery-50 flex items-center justify-center text-lg shadow-inner group-hover:bg-bakery-900 group-hover:text-white transition-colors`}>{stat.icon}</div>
                  <span className="text-[9px] font-black text-bakery-400 uppercase tracking-widest">{stat.label}</span>
                </div>
             </div>
             <div>
                <div className="text-3xl font-black font-mono tracking-tighter text-bakery-950">
                   {stat.isUnits ? `${stat.value.toLocaleString()} Pcs` : currency.formatCompact(stat.value)}
                </div>
                <div className="text-[8px] font-bold text-bakery-300 uppercase mt-1">{stat.sub}</div>
             </div>
          </button>
        ))}
      </div>

      {/* STRATEGIC FILING DESK */}
      <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5 group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10 blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="text-left space-y-3 flex-1">
            <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tight">Executive Filing Desk</h3>
            <p className="text-indigo-200 text-xs font-black uppercase tracking-widest opacity-80">Institutional Literature • Statutory Mapping • Deployment Guide</p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => generateFullUserManualPDF(HELP_SECTIONS)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-500 transition-all flex items-center gap-3 border border-indigo-400 active:scale-95"
            >
              <span>📘</span> User Manual
            </button>
            <button 
              onClick={generateSystemBlueprintPDF}
              className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-400 transition-all flex items-center gap-3 active:scale-95"
            >
              <span>📐</span> System Blueprint
            </button>
            <button 
              onClick={() => generateDeploymentPlanPDF(businessProfile?.name || 'Authorized Client', LAUNCH_CHECKLIST)}
              className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-500 transition-all flex items-center gap-3 border border-emerald-400 active:scale-95"
            >
              <span>🚀</span> Deployment Plan
            </button>
          </div>
        </div>
      </div>

      {/* VISUAL CATEGORY NAVIGATOR */}
      <div className="space-y-6">
        <h3 className="text-sm font-black text-bakery-400 uppercase tracking-[0.3em] ml-6">Specialized Formulation Labs</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {categories.map((cat, i) => (
            <button 
              key={i}
              onClick={() => onNavigate(cat.id)}
              className="relative h-96 rounded-[4rem] overflow-hidden group shadow-lg hover:shadow-2xl transition-all border-2 border-white"
            >
              <img src={cat.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={cat.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-bakery-950 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute inset-x-8 bottom-8 text-left space-y-2">
                <h4 className="text-3xl font-bold font-serif text-white uppercase tracking-tight">{cat.name}</h4>
                <p className="text-bakery-200 text-xs italic leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  {cat.desc}
                </p>
                <div className="pt-4 flex items-center gap-2">
                  <span className="text-[10px] font-black text-harvest-400 uppercase tracking-widest">Enter Module</span>
                  <span className="w-8 h-px bg-harvest-400"></span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
