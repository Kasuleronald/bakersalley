
import React, { useState, useEffect, useMemo } from 'react';
import { WeighbridgeTicket, GatePass, User, Ingredient, SKU, DigitalSignature, SensorData } from '../types';
import DigitalSignatory from './DigitalSignatory';
import WeighbridgeAssistant from './WeighbridgeAssistant';

interface WeighbridgeHubProps {
  tickets: WeighbridgeTicket[];
  setTickets: (t: WeighbridgeTicket[]) => void;
  gatePasses: GatePass[];
  setGatePasses: (g: GatePass[]) => void;
  ingredients: Ingredient[];
  skus: SKU[];
  currentUser: User;
  currency: { format: (v: number) => string; formatCompact: (v: number) => string };
}

const WeighbridgeHub: React.FC<WeighbridgeHubProps> = ({ tickets, setTickets, gatePasses, setGatePasses, ingredients, skus, currentUser, currency }) => {
  const [activeTab, setActiveTab] = useState<'Active' | 'History' | 'GatePasses' | 'Assistant'>('Active');
  const [showWeighForm, setShowWeighForm] = useState(false);
  const [isWeighingOutId, setIsWeighingOutId] = useState<string | null>(null);
  const [liveScaleWeight, setLiveScaleWeight] = useState(0);

  // Digital Scale Simulator (IoT)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveScaleWeight(prev => {
        if (showWeighForm || isWeighingOutId) {
            // Jitter around a stable target for realism
            const target = 12500;
            return Math.round(target + (Math.random() * 10 - 5));
        }
        return Math.round(Math.random() * 50);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showWeighForm, isWeighingOutId]);

  const [newTicket, setNewTicket] = useState<Partial<WeighbridgeTicket>>({
    vehicleReg: '', driverName: '', commodityId: '', type: 'Inbound', grossWeight: 0, invoicedWeight: 0
  });

  const handleFirstWeigh = () => {
    const weight = liveScaleWeight || newTicket.grossWeight || 0;
    if (!newTicket.vehicleReg || !newTicket.commodityId || !weight) {
        alert("Verification failed. Please ensure vehicle is settled on the platform.");
        return;
    }
    
    const ticket: WeighbridgeTicket = {
      id: `WB-${Date.now()}`,
      vehicleReg: newTicket.vehicleReg!,
      driverName: newTicket.driverName || 'Unknown',
      commodityId: newTicket.commodityId!,
      type: newTicket.type as 'Inbound' | 'Outbound',
      grossWeight: weight,
      tareWeight: 0,
      netWeight: 0,
      invoicedWeight: newTicket.invoicedWeight || 0,
      timestampIn: new Date().toISOString(),
      status: 'Pending 2nd Weigh'
    };

    setTickets([ticket, ...tickets]);
    setShowWeighForm(false);
    setNewTicket({ vehicleReg: '', driverName: '', commodityId: '', type: 'Inbound', grossWeight: 0, invoicedWeight: 0 });
    alert("First weighing (Gross) recorded via Digital Interface.");
  };

  const handleSecondWeigh = (id: string, tare: number) => {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    const net = Math.abs(ticket.grossWeight - tare);
    const variance = ticket.invoicedWeight > 0 ? (Math.abs(net - ticket.invoicedWeight) / ticket.invoicedWeight) * 100 : 0;
    
    const status = variance > 2 ? 'Quarantined' : 'Completed';

    const updatedTicket: WeighbridgeTicket = {
      ...ticket,
      tareWeight: tare,
      netWeight: net,
      timestampOut: new Date().toISOString(),
      status
    };

    setTickets(tickets.map(t => t.id === id ? updatedTicket : t));
    setIsWeighingOutId(null);

    if (status === 'Completed') {
      generateGatePass(updatedTicket);
    }
  };

  const generateGatePass = (ticket: WeighbridgeTicket) => {
    const pass: GatePass = {
      id: `GP-${Date.now().toString().slice(-6)}`,
      ticketId: ticket.id,
      timestamp: new Date().toISOString(),
      securityPersonnel: currentUser.name,
      isCleared: true,
      vehicleReg: ticket.vehicleReg,
      direction: 'Exit'
    };
    setGatePasses([pass, ...gatePasses]);
  };

  const handleAuthorizeQuarantine = (ticketId: string) => {
    const signature: DigitalSignature = {
      signerId: currentUser.id,
      signerName: currentUser.name,
      signerRole: currentUser.role,
      timestamp: new Date().toISOString(),
      authorityHash: `WB-AUTH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      const updated = { ...ticket, status: 'Completed' as const, authorizedBy: signature };
      setTickets(tickets.map(t => t.id === ticketId ? updated : t));
      generateGatePass(updated);
      alert("Weight variance authorized under DoA protocol. Gate Pass generated.");
    }
  };

  return (
    <div className="space-y-8 animate-softFade pb-20">
      <header className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Weighbridge Command</h3>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Industrial Mass Verification • DoA Interlocks</p>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="bg-white/5 px-6 py-4 rounded-3xl border border-white/10 text-center animate-pulse">
              <div className="text-[8px] font-black text-indigo-400 uppercase mb-1">Live Digital Scale</div>
              <div className="text-3xl font-mono font-black text-emerald-400">{liveScaleWeight.toLocaleString()} <span className="text-xs uppercase">KG</span></div>
           </div>
        </div>
      </header>

      {activeTab === 'Assistant' && (
        <WeighbridgeAssistant tickets={tickets} ingredients={ingredients} skus={skus} currency={currency} />
      )}

      {activeTab === 'Active' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <button onClick={() => setShowWeighForm(true)} className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black">+ Record Entry (1st Weigh)</button>
              <div className="flex gap-6">
                 <div className="text-center">
                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Vehicles In-Yard</div>
                    <div className="text-2xl font-mono font-black text-indigo-900">{tickets.filter(t => t.status === 'Pending 2nd Weigh').length}</div>
                 </div>
                 <div className="text-center">
                    <div className="text-[8px] font-black text-rose-400 uppercase mb-1">Quarantined</div>
                    <div className="text-2xl font-mono font-black text-rose-600">{tickets.filter(t => t.status === 'Quarantined').length}</div>
                 </div>
              </div>
           </div>

           {showWeighForm && (
             <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-8">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-xl font-bold font-serif text-indigo-900 uppercase">First Weighing Intake</h4>
                   <div className="bg-emerald-50 px-4 py-2 rounded-xl text-emerald-700 font-mono font-black">STABLE: {liveScaleWeight}KG</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                   <div>
                      <label className="block text-[10px] font-black text-coffee-400 uppercase mb-2">Vehicle Reg #</label>
                      <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold uppercase" value={newTicket.vehicleReg} onChange={e => setNewTicket({...newTicket, vehicleReg: e.target.value})} placeholder="UBA 123X" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-coffee-400 uppercase mb-2">Commodity / SKU</label>
                      <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newTicket.commodityId} onChange={e => setNewTicket({...newTicket, commodityId: e.target.value})}>
                          <option value="">Select Item...</option>
                          <optgroup label="Ingredients (Inbound)">
                             {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </optgroup>
                          <optgroup label="Finished Goods (Outbound)">
                             {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </optgroup>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-coffee-400 uppercase mb-2">Gross Weight (Live Sync)</label>
                      <input type="number" disabled className="w-full p-4 bg-indigo-50 border-none rounded-2xl font-mono font-black text-lg text-indigo-900" value={liveScaleWeight} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-coffee-400 uppercase mb-2">Manifest Weight (KG)</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black text-lg" value={newTicket.invoicedWeight || ''} onChange={e => setNewTicket({...newTicket, invoicedWeight: parseFloat(e.target.value) || 0})} />
                   </div>
                </div>
                <div className="flex justify-end gap-3">
                   <button onClick={() => setShowWeighForm(false)} className="px-10 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
                   <button onClick={handleFirstWeigh} className="px-16 py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-black">Authorize Entry</button>
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.filter(t => t.status !== 'Completed').map(ticket => {
                const isWeighingOut = isWeighingOutId === ticket.id;
                const isQuarantined = ticket.status === 'Quarantined';
                return (
                  <div key={ticket.id} className={`bg-white p-8 rounded-[3rem] border-2 transition-all ${isQuarantined ? 'border-rose-300 bg-rose-50/10' : 'border-slate-100'}`}>
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{ticket.type} Transaction</div>
                           <h4 className="text-xl font-black text-slate-900 uppercase">{ticket.vehicleReg}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${isQuarantined ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-100 text-amber-700'}`}>
                           {ticket.status}
                        </span>
                     </div>

                     {isWeighingOut ? (
                       <div className="space-y-4 animate-fadeIn">
                          <div className="p-6 bg-slate-900 rounded-[2rem] text-center space-y-2 border border-white/5">
                             <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Digital Tare Sync</div>
                             <div className="text-5xl font-mono font-black text-white">{liveScaleWeight} <span className="text-lg">KG</span></div>
                          </div>
                          <button onClick={() => handleSecondWeigh(ticket.id, liveScaleWeight)} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl hover:bg-emerald-700 transition-all">Capture Tare & Authorize Exit</button>
                          <button onClick={() => setIsWeighingOutId(null)} className="w-full text-[9px] font-black text-slate-300 uppercase">Abort Exit</button>
                       </div>
                     ) : !isQuarantined ? (
                       <button onClick={() => setIsWeighingOutId(ticket.id)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl hover:bg-black transition-all">Record 2nd Weighing (Exit)</button>
                     ) : (
                        <div className="space-y-6">
                           <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                              <div className="text-[10px] font-black text-rose-700 uppercase mb-1">Audit Deviation</div>
                              <p className="text-xs italic font-medium leading-relaxed">Mass mismatch: {ticket.netWeight}kg vs {ticket.invoicedWeight}kg. Authorize release or hold for inspection.</p>
                           </div>
                           <DigitalSignatory 
                             status="Pending" 
                             amount={999999} 
                             currentUser={currentUser} 
                             onSign={() => handleAuthorizeQuarantine(ticket.id)} 
                             onReject={() => alert("Hold position confirmed.")} 
                             onEscalate={() => {}} 
                           />
                        </div>
                     )}
                  </div>
                );
              })}
           </div>
        </div>
      )}
    </div>
  );
};

export default WeighbridgeHub;
