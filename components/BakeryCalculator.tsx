
import React, { useState, useEffect, useMemo } from 'react';

type CalcType = 'Scaling' | 'Baker' | 'Conversion' | 'Basic';

const BakeryCalculator: React.FC = () => {
  const [type, setType] = useState<CalcType>('Scaling');
  
  // Scaling State
  const [scaleOriginal, setScaleOriginal] = useState(1);
  const [scaleTarget, setScaleTarget] = useState(1);
  const [scaleInput, setScaleInput] = useState(1000);
  const scalingFactor = useMemo(() => scaleOriginal > 0 ? scaleTarget / scaleOriginal : 1, [scaleOriginal, scaleTarget]);

  // Baker's % State
  const [flourWeight, setFlourWeight] = useState(1000);
  const [bpItems, setBpItems] = useState<{name: string, percent: number}[]>([
    { name: 'Water', percent: 65 },
    { name: 'Salt', percent: 2 },
    { name: 'Yeast', percent: 1.5 }
  ]);
  
  const totalPercent = useMemo(() => 100 + bpItems.reduce((s, i) => s + i.percent, 0), [bpItems]);
  const totalDoughWeight = useMemo(() => (flourWeight * totalPercent) / 100, [flourWeight, totalPercent]);

  // Conversion State
  const [convVal, setConvVal] = useState(1);
  const [convFrom, setConvFrom] = useState('kg');
  const [convTo, setConvTo] = useState('g');

  // Basic Calc State
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const calculateConversion = () => {
    const units: Record<string, number> = {
      'g': 1, 'kg': 1000, 'lb': 453.59, 'oz': 28.35, 
      'ml': 1, 'l': 1000, 'cup': 240, 'tbsp': 15, 'tsp': 5
    };
    if (!units[convFrom] || !units[convTo]) return 0;
    return (convVal * units[convFrom]) / units[convTo];
  };

  const handleBasicInput = (val: string) => {
    if (val === 'C') {
      setDisplay('0');
      setEquation('');
      return;
    }
    if (val === '=') {
      try {
        const res = Function(`'use strict'; return (${display})`)();
        setEquation(display + ' =');
        setDisplay(String(res));
      } catch {
        setDisplay('Error');
      }
      return;
    }
    if (display === '0' || display === 'Error') setDisplay(val);
    else setDisplay(display + val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (type !== 'Basic') return;
    const allowed = ['0','1','2','3','4','5','6','7','8','9','+','-','*','/','.','(',')'];
    if (allowed.includes(e.key)) {
      handleBasicInput(e.key);
    } else if (e.key === 'Enter') {
      handleBasicInput('=');
    } else if (e.key === 'Backspace') {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (e.key === 'Escape') {
      handleBasicInput('C');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-coffee-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold font-serif tracking-tight uppercase tracking-tighter">Kitchen Mathematics Hub</h2>
          <p className="text-amber-200 text-[10px] font-black uppercase tracking-widest pl-1 mt-1">Manual Input Enabled • Recipe Engineering • Unit Calibration</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-hide">
           {(['Scaling', 'Baker', 'Conversion', 'Basic'] as CalcType[]).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${
                type === t ? 'bg-white text-coffee-900 shadow-xl scale-105' : 'text-coffee-400 hover:text-white'
              }`}
            >
              {t === 'Scaling' && '⚖️ Scaling'}
              {t === 'Baker' && '🌾 Baker\'s %'}
              {t === 'Conversion' && '🔄 Units'}
              {t === 'Basic' && '🔢 Math'}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] shadow-sm border border-coffee-50 min-h-[500px]">
          {type === 'Scaling' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-coffee-50 pb-6">
                <h3 className="text-xl font-bold text-coffee-900 font-serif">Recipe Expansion & Reduction</h3>
                <div className="bg-amber-50 px-4 py-1 rounded-full text-[9px] font-black text-amber-700 uppercase tracking-widest border border-amber-100">
                  Multiplier: {scalingFactor.toFixed(4)}x
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Original Recipe Yield</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-mono font-black text-2xl text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                        value={scaleOriginal} 
                        onChange={e => setScaleOriginal(parseFloat(e.target.value) || 1)} 
                      />
                      <span className="text-xs font-bold text-slate-300 uppercase">PCS</span>
                    </div>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                    <label className="block text-[10px] font-black text-indigo-400 uppercase mb-3">Target Desired Yield</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        className="w-full bg-white border border-indigo-200 rounded-2xl px-5 py-4 font-mono font-black text-2xl text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                        value={scaleTarget} 
                        onChange={e => setScaleTarget(parseFloat(e.target.value) || 1)} 
                      />
                      <span className="text-xs font-bold text-indigo-300 uppercase">PCS</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center p-10 bg-coffee-900 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
                  <div className="w-full text-center">
                    <label className="block text-[10px] font-black text-amber-400 uppercase mb-4 tracking-widest">Base Ingredient Weight (g)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white/10 border border-white/10 rounded-[2rem] px-8 py-6 font-mono font-black text-5xl text-center text-white outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" 
                      value={scaleInput || ''} 
                      onChange={e => setScaleInput(parseFloat(e.target.value) || 0)} 
                      placeholder="0.00" 
                    />
                  </div>
                  <div className="w-full pt-8 border-t border-white/10 flex flex-col items-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Scaled Output</div>
                    <div className="text-4xl font-mono font-black text-amber-500">{(scaleInput * scalingFactor).toLocaleString()}g</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'Baker' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-coffee-50 pb-6">
                <h3 className="text-xl font-bold text-coffee-900 font-serif">Baker's Formulation Auditor</h3>
                <div className="text-right">
                  <div className="text-[9px] font-black text-slate-400 uppercase">Total Flour: 100%</div>
                  <div className="text-[9px] font-black text-indigo-600 uppercase">Total Mass: {totalPercent.toFixed(1)}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div className="p-8 bg-coffee-900 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl">
                    <label className="block text-[9px] font-black text-amber-400 uppercase mb-2 tracking-widest">Base Flour Weight (100.0%)</label>
                    <div className="flex items-end gap-3">
                       <input 
                        type="number" 
                        className="bg-transparent border-none p-0 text-5xl font-mono font-black outline-none w-full text-white placeholder:text-white/20" 
                        value={flourWeight || ''} 
                        onChange={e => setFlourWeight(parseFloat(e.target.value) || 0)} 
                       />
                       <span className="text-xl font-bold text-amber-400 pb-2">g</span>
                    </div>
                 </div>
                 <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-between">
                    <label className="block text-[9px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Calculated Total Dough Mass</label>
                    <div className="flex items-end gap-3">
                       <div className="text-5xl font-mono font-black text-indigo-900">{totalDoughWeight.toLocaleString()}</div>
                       <span className="text-xl font-bold text-indigo-400 pb-2">g</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                 {bpItems.map((item, idx) => (
                   <div key={idx} className="flex gap-4 items-center bg-slate-50 p-5 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                      <div className="flex-1">
                        <label className="block text-[7px] font-black text-slate-400 uppercase mb-1">Ingredient Identity</label>
                        <input className="w-full bg-white border border-slate-100 px-4 py-2 rounded-xl font-bold text-sm uppercase outline-none focus:ring-1 focus:ring-indigo-500" value={item.name} onChange={e => {
                          const newItems = [...bpItems];
                          newItems[idx].name = e.target.value;
                          setBpItems(newItems);
                        }} />
                      </div>
                      <div className="w-32">
                        <label className="block text-[7px] font-black text-indigo-400 uppercase mb-1 text-center">Percent (%)</label>
                        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-inner">
                           <input type="number" className="w-full bg-transparent border-none text-right font-mono font-black text-indigo-900 outline-none" value={item.percent} onChange={e => {
                              const newItems = [...bpItems];
                              newItems[idx].percent = parseFloat(e.target.value) || 0;
                              setBpItems(newItems);
                           }} />
                           <span className="text-[10px] font-bold text-slate-300">%</span>
                        </div>
                      </div>
                      <div className="w-40 text-right">
                         <label className="block text-[7px] font-black text-slate-400 uppercase mb-1">Required Weight</label>
                         <div className="text-lg font-mono font-black text-slate-900">
                            {((flourWeight * item.percent) / 100).toLocaleString()}g
                         </div>
                      </div>
                      <button onClick={() => setBpItems(bpItems.filter((_, i) => i !== idx))} className="w-10 h-10 rounded-full bg-white border border-slate-100 text-rose-300 hover:text-rose-500 font-bold transition-all flex items-center justify-center">✕</button>
                   </div>
                 ))}
                 <button onClick={() => setBpItems([...bpItems, {name: 'Additional Item', percent: 0}])} className="w-full py-5 border-2 border-dashed border-coffee-100 rounded-[2rem] text-coffee-400 text-xs font-black uppercase tracking-[0.2em] hover:bg-coffee-50 transition-all">+ Inject Component</button>
              </div>
            </div>
          )}

          {type === 'Conversion' && (
            <div className="space-y-12 animate-fadeIn py-10 flex flex-col justify-center h-full">
              <h3 className="text-3xl font-bold text-coffee-900 font-serif text-center mb-10">Cross-Unit Synchronizer</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center max-w-4xl mx-auto">
                 <div className="md:col-span-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Base Magnitude</label>
                    <input 
                      type="number" 
                      className="w-full bg-white border border-slate-200 rounded-[1.5rem] px-6 py-5 font-mono font-black text-4xl text-center text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                      value={convVal || ''} 
                      onChange={e => setConvVal(parseFloat(e.target.value) || 0)} 
                      placeholder="0.0" 
                    />
                    <select 
                      className="w-full mt-4 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs uppercase text-slate-500 outline-none" 
                      value={convFrom} 
                      onChange={e => setConvFrom(e.target.value)}
                    >
                       {['g', 'kg', 'lb', 'oz', 'ml', 'l', 'cup', 'tbsp', 'tsp'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                 </div>
                 <div className="md:col-span-2 text-center text-6xl text-coffee-100">⇄</div>
                 <div className="md:col-span-6 p-10 bg-indigo-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
                    <div className="relative z-10 text-center space-y-6">
                       <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest">Normalized Output</label>
                       <div className="text-7xl font-mono font-black text-white">{calculateConversion().toLocaleString(undefined, {maximumFractionDigits: 3})}</div>
                       <select 
                        className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl font-bold text-sm uppercase text-amber-400 outline-none" 
                        value={convTo} 
                        onChange={e => setConvTo(e.target.value)}
                       >
                          {['g', 'kg', 'lb', 'oz', 'ml', 'l', 'cup', 'tbsp', 'tsp'].map(u => <option key={u} value={u}>{u}</option>)}
                       </select>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {type === 'Basic' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn h-full">
               <div className="max-w-md w-full bg-coffee-950 p-10 rounded-[3.5rem] shadow-[0_40px_60px_-15px_rgba(38,26,19,0.5)] border border-white/5">
                  <div className="text-right h-32 mb-10 flex flex-col justify-end p-6 bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden">
                     <div className="text-amber-500 font-mono text-sm mb-2 truncate opacity-60">{equation}</div>
                     <input 
                      autoFocus
                      className="bg-transparent border-none p-0 text-white font-mono text-5xl font-black text-right outline-none w-full placeholder:text-white/5"
                      value={display}
                      onChange={e => setDisplay(e.target.value)}
                      placeholder="0"
                     />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                     {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'DEL', '='].map(btn => (
                       <button
                        key={btn}
                        onClick={() => btn === 'DEL' ? setDisplay(display.length > 1 ? display.slice(0, -1) : '0') : handleBasicInput(btn)}
                        className={`py-5 rounded-2xl font-black text-xl transition-all active:scale-90 flex items-center justify-center ${
                          btn === '=' ? 'bg-amber-500 text-coffee-950 col-span-1 shadow-lg shadow-amber-500/20' :
                          ['/', '*', '-', '+'].includes(btn) ? 'bg-white/10 text-amber-400 hover:bg-white/20' :
                          btn === 'C' ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30' : 'bg-white/5 text-slate-100 hover:bg-white/10'
                        }`}
                       >
                         {btn}
                       </button>
                     ))}
                  </div>
               </div>
               <p className="mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest animate-pulse italic">Manual Keyboard Entry Enabled</p>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-6">
           <div className="bg-coffee-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
              <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-8 relative z-10">Mathematics Audit</h4>
              
              <div className="space-y-10 relative z-10">
                 {type === 'Scaling' && (
                   <div className="space-y-6">
                      <div>
                         <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Recipe Efficiency</span>
                         <div className="text-xl font-mono font-black text-white">{(scalingFactor >= 1 ? 'Expansion' : 'Reduction')} Mode</div>
                      </div>
                      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                         <p className="text-xs text-slate-400 leading-relaxed italic">
                           "All scaling calculations are non-destructive. Adjusting the factor will automatically update the Ingredient Matrix across the production floor logs."
                         </p>
                      </div>
                   </div>
                 )}
                 {type === 'Baker' && (
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Dough Density</span>
                           <div className="text-lg font-mono font-black text-emerald-400">{totalPercent.toFixed(1)}%</div>
                        </div>
                        <div className="text-right">
                           <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Hydration</span>
                           <div className="text-lg font-mono font-black text-indigo-400">{bpItems.find(i => i.name.toLowerCase() === 'water')?.percent || 0}%</div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                         Formulation logic assumes flour as the 100% baseline. Adjusting flour weight recalibrates the entire dough scale.
                      </p>
                   </div>
                 )}
                 {type === 'Basic' && (
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">⌨️</div>
                        <div className="text-xs text-indigo-300 font-bold uppercase tracking-tighter">Keyboard Support Active</div>
                      </div>
                      <ul className="text-[9px] text-slate-500 space-y-2 font-bold uppercase">
                         <li className="flex justify-between"><span>Enter</span> <span className="text-slate-300">= Calculate</span></li>
                         <li className="flex justify-between"><span>Esc</span> <span className="text-slate-300">C Clear</span></li>
                         <li className="flex justify-between"><span>Backspace</span> <span className="text-slate-300">DEL Undo</span></li>
                      </ul>
                   </div>
                 )}
              </div>
           </div>

           <div className="p-10 bg-indigo-50 rounded-[3.5rem] border border-indigo-100 flex flex-col items-center justify-center text-center group transition-all hover:bg-white hover:shadow-xl">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform">💡</div>
              <h5 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4">Industrial Tip</h5>
              <p className="text-xs text-indigo-600 leading-relaxed italic">
                 {type === 'Scaling' && '"High-altitude bakeries should use 0.95 scaling on leaveners when expanding batch size by more than 2x."'}
                 {type === 'Baker' && '"Always keep salt at exactly 2% of flour weight to ensure crumb structural integrity and flavor normalization."'}
                 {type === 'Conversion' && '"Dry weight to liquid volume conversions are estimates. Always use mass (grams) for industrial consistency."'}
                 {type === 'Basic' && '"Use parentheses ( ) for complex margin calculations involving multiple material subtractions."'}
              </p>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default BakeryCalculator;
