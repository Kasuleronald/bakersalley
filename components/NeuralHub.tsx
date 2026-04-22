
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, SKU, Ingredient, Order, Sale, AccountType, User, AccountGroup, ProductionLog, InventoryLoss, Employee, SupplierInvoice, FinishedGood, InventoryMovement, Batch, SensorData } from '../types';
import { GoogleGenAI } from "@google/genai";
import ModuleAiInteraction from './ModuleAiInteraction';
import AIScanner from './AIScanner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { getConversionFactor } from '../utils/conversionUtils';

interface NeuralHubProps {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  skus: SKU[];
  ingredients: Ingredient[];
  setIngredients: (ings: Ingredient[]) => void;
  orders: Order[];
  sales: Sale[];
  productionLogs: ProductionLog[];
  inventoryLosses: InventoryLoss[];
  accountGroups: AccountGroup[];
  employees: Employee[];
  invoices: SupplierInvoice[];
  finishedGoods: FinishedGood[];
  movements: InventoryMovement[];
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
  currentUser: User;
  onNavigate: (tab: string) => void;
}

const MOCK_SCAN_HISTORY = [
  { id: 'scan-1', title: 'Handwritten Petty Cash', original: '✍️ "Paid 50k for charcoal to Mukasa - 12/05"', transcribed: { vendor: 'Mukasa', amount: 50000, category: 'Fuel/Charcoal', date: '2025-05-12' }, confidence: 98, status: 'Journalized' },
  { id: 'scan-2', title: 'Shift Production Card', original: '✍️ "Batch 4: White Loaf - Yield 412 (8 rejects)"', transcribed: { sku: 'Family White Loaf', yield: 412, rejects: 8, shift: 'Night' }, confidence: 94, status: 'Yield Reconciled' }
];

const NeuralHub: React.FC<NeuralHubProps> = ({ 
  transactions, setTransactions, skus, ingredients, setIngredients, orders, sales, productionLogs, inventoryLosses, accountGroups, employees, invoices, finishedGoods, movements, currency, currentUser, onNavigate 
}) => {
  const [activeMode, setActiveMode] = useState<'Command' | 'SageLedger' | 'InventoryNexus' | 'StressTest' | 'VisionIntake' | 'Edge'>('Command');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [revenueShock, setRevenueShock] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [scanHistory, setScanHistory] = useState(MOCK_SCAN_HISTORY);
  const [edgeSensors, setEdgeSensors] = useState<SensorData[]>([]);

  useEffect(() => {
    if (activeMode !== 'Edge') return;
    const interval = setInterval(() => {
        const data: SensorData[] = [
            { id: 'S1', type: 'Temperature', value: Math.round(180 + Math.random() * 20), unit: '°C', timestamp: new Date().toISOString(), status: 'Normal' },
            { id: 'S2', type: 'Vibration', value: Math.round(Math.random() * 5), unit: 'Hz', timestamp: new Date().toISOString(), status: 'Normal' },
            { id: 'S3', type: 'Mass', value: Math.round(Math.random() * 100), unit: 'kg', timestamp: new Date().toISOString(), status: 'Normal' },
            { id: 'S4', type: 'Humidity', value: Math.round(40 + Math.random() * 10), unit: '%', timestamp: new Date().toISOString(), status: 'Normal' }
        ];
        setEdgeSensors(data);
    }, 2000);
    return () => clearInterval(interval);
  }, [activeMode]);

  // Sage-Style Financial Summary
  const sageMetrics = useMemo(() => {
    const cash = transactions.filter(t => ['Bank', 'Cash'].includes(t.account)).reduce((s, t) => t.type === 'Credit' ? s + t.amount : s - t.amount, 0);
    const monthlyFixed = employees.reduce((s, e) => s + (e.salary || 0), 0) + 2000000;
    const dailyBurn = monthlyFixed / 30;
    const currentRunway = dailyBurn > 0 ? cash / dailyBurn : 999;
    return { cash, dailyBurn, currentRunway };
  }, [transactions, employees]);

  const stressTestData = useMemo(() => {
    const initialCash = sageMetrics.cash;
    const dailyBurn = sageMetrics.dailyBurn;
    const totalRecentSales = sales.slice(0, 30).reduce((sum, s) => sum + s.totalPrice, 0);
    const avgDailySales = totalRecentSales / 30;
    const shockedDailySales = avgDailySales * (1 - revenueShock / 100);

    return Array.from({ length: 30 }, (_, i) => {
      const balance = initialCash + (shockedDailySales * i) - (dailyBurn * i);
      return { day: i === 0 ? 'Today' : `D+${i}`, balance: Math.round(balance) };
    });
  }, [sales, revenueShock, sageMetrics]);

  const handleScanConfirm = (data: any) => {
    setShowScanner(false);
    const newTx: Transaction = {
        id: `ocr-${Date.now()}`,
        date: data.date || new Date().toISOString(),
        amount: data.totalAmount,
        description: `Vision Transcribed: ${data.vendorName} - ${data.notes || ''}`,
        type: 'Debit',
        account: 'Cash',
        category: 'Expense',
        isOcrVerified: true
    };
    setTransactions([newTx, ...transactions]);
    setAiResponse(`✅ Digitization Successful: Logged ${currency.format(data.totalAmount)}.`);
  };

  const handleNeuralCommand = async (command: string) => {
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Perform strategic audit for a commercial bakery. COMMAND: "${command}". Return JSON or advice.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiResponse(response.text || "Processed.");
    } catch (e) {
      setAiResponse("Audit failure.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {showScanner && <AIScanner docType="Invoice" onConfirm={handleScanConfirm} onClose={() => setShowScanner(false)} />}
      
      <header className="bg-slate-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border-l-8 border-indigo-500">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-center gap-10">
          <div className="space-y-2">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(79,70,229,0.5)] animate-pulse">🧠</div>
                <div>
                   <h2 className="text-4xl font-bold font-serif text-white uppercase tracking-tighter">Neural Hub</h2>
                   <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Vision, Voice & Edge Telemetry</p>
                </div>
             </div>
          </div>
          <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl overflow-x-auto scrollbar-hide">
             {['Command', 'VisionIntake', 'InventoryNexus', 'StressTest', 'Edge'].map(m => (
                <button key={m} onClick={() => setActiveMode(m as any)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeMode === m ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>
                   {m === 'Edge' ? 'Edge Telemetry 📡' : m === 'VisionIntake' ? 'Vision 📸' : m}
                </button>
             ))}
          </div>
        </div>
      </header>

      {activeMode === 'Command' && (
        <ModuleAiInteraction title="Neural Control Pad" theme="indigo" isLoading={isProcessing} onExecute={handleNeuralCommand} suggestions={["Predict stock depletion", "Log 500k cash sales", "Forecast cash in 10 days"]} response={aiResponse} />
      )}

      {activeMode === 'Edge' && (
        <div className="space-y-10 animate-fadeIn">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {edgeSensors.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center relative group hover:border-indigo-500 transition-all">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.type}</div>
                   <div className="text-4xl font-mono font-black text-indigo-900 group-hover:scale-110 transition-transform">{s.value}{s.unit}</div>
                   <div className="mt-4 flex justify-center items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                      <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Edge-Verified ✓</span>
                   </div>
                </div>
              ))}
           </div>

           <div className="bg-slate-900 p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
              <div className="relative z-10 space-y-6">
                 <h4 className="text-xl font-bold font-serif text-amber-400 uppercase">Shift Mechanical Health</h4>
                 <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={edgeSensors}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                          <XAxis dataKey="id" stroke="#ffffff40" />
                          <YAxis stroke="#ffffff40" />
                          <Area type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={3} fill="#fbbf24" fillOpacity={0.1} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <p className="text-xs text-indigo-200 italic">"Autonomous Edge Monitoring prevents mechanical breakdowns by linking thermal spikes to production rounds."</p>
              </div>
           </div>
        </div>
      )}

      {activeMode === 'StressTest' && (
        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm animate-fadeIn">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Liquidity Stress Analysis</h3>
              <div className="w-80 space-y-4 bg-slate-50 p-6 rounded-3xl border">
                 <div className="flex justify-between items-center"><label className="text-[10px] font-black text-rose-600 uppercase">Sales Shock</label><span className="text-sm font-mono font-black">-{revenueShock}%</span></div>
                 <input type="range" min="0" max="100" step="5" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600" value={revenueShock} onChange={e => setRevenueShock(parseInt(e.target.value))} />
              </div>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={stressTestData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" hide />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => currency.formatCompact(v)} />
                    <Area type="monotone" dataKey="balance" stroke={revenueShock > 40 ? "#e11d48" : "#4f46e5"} strokeWidth={4} fillOpacity={0.1} fill={revenueShock > 40 ? "#e11d48" : "#4f46e5"} />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </div>
      )}
    </div>
  );
};

export default NeuralHub;
