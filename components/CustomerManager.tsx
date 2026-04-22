import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Sale, Order, SKU, Transaction, PartnerStatus } from '../types';
import { DISCOUNT_RATE_WACC } from '../constants';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { generateCustomerGrowthStrategy } from '../services/geminiService';

interface CustomerManagerProps {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  sales: Sale[];
  orders: Order[];
  skus: SKU[];
  transactions?: Transaction[];
  currency: { format: (v: number) => string };
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, setCustomers, sales, orders, skus, transactions = [], currency }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [priceBookCustomerId, setPriceBookCustomerId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
  
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '', phone: '', email: '', address: '', type: 'Individual', balance: 0, creditLimit: 500000, 
    customPrices: {}, birthDate: '', anniversaryDate: ''
  });

  const handleUpdateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const calculatePartnerStatus = (orderCount: number, totalSpend: number): PartnerStatus => {
    if (orderCount >= 50 || totalSpend >= 5000000) return 'Platinum';
    if (orderCount >= 25 || totalSpend >= 2000000) return 'Gold';
    if (orderCount >= 10) return 'Silver';
    return 'Bronze';
  };

  // Automatic Partner Status Synchronization
  useEffect(() => {
    const changes: Record<string, PartnerStatus> = {};
    let hasChanged = false;

    customers.forEach(customer => {
      const custSales = sales.filter(s => s.customerId === customer.id);
      const totalSpent = custSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const derivedStatus = calculatePartnerStatus(custSales.length, totalSpent);

      if (customer.partnerStatus !== derivedStatus) {
        changes[customer.id] = derivedStatus;
        hasChanged = true;
      }
    });

    if (hasChanged) {
      setCustomers(customers.map(c => changes[c.id] ? { ...c, partnerStatus: changes[c.id] } : c));
    }
  }, [sales, customers]);

  const handleRunAiAudit = async (customer: Customer) => {
    setIsAiLoading(customer.id);
    const history = sales.filter(s => s.customerId === customer.id);
    const result = await generateCustomerGrowthStrategy(customer, history, skus);
    if (result) {
      handleUpdateCustomer(customer.id, { 
        aiGrowthDirectives: result.strategy,
        aiFollowUpActions: result.followUp 
      });
    }
    setIsAiLoading(null);
  };

  const generateStatement = (customer: Customer) => {
    const doc = new jsPDF();
    const custOrders = orders.filter(o => o.customerId === customer.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const custCredits = transactions.filter(t => t.referenceId === customer.id && (t.category === 'Credit Note' || t.subCategory === 'Returns/Credit Note'));
    
    doc.setFontSize(22);
    doc.setTextColor(30, 27, 75);
    doc.text('STATEMENT OF ACCOUNT', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Partner: ${customer.name}`, 14, 30);
    doc.text(`Phone: ${customer.phone}`, 14, 35);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

    const tableData: any[] = [];
    let runningBalance = 0;

    const ledgerItems = [
      ...custOrders.map(o => ({ date: o.date, ref: o.invoiceNumber, desc: 'Invoice', debit: o.totalPrice, credit: 0 })),
      ...custCredits.map(c => ({ date: c.date, ref: c.id.slice(-8), desc: c.description, debit: 0, credit: c.amount }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    ledgerItems.forEach(item => {
      runningBalance += (item.debit - item.credit);
      tableData.push([
        new Date(item.date).toLocaleDateString(),
        item.ref,
        item.desc,
        item.debit > 0 ? `UGX ${item.debit.toLocaleString()}` : '--',
        item.credit > 0 ? `UGX ${item.credit.toLocaleString()}` : '--',
        `UGX ${runningBalance.toLocaleString()}`
      ]);
    });

    (doc as any).autoTable({
      startY: 50,
      head: [['Date', 'Ref #', 'Description', 'Debit', 'Credit', 'Balance']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 27, 75] },
      foot: [['', '', 'CURRENT BALANCE DUE', '', '', `UGX ${runningBalance.toLocaleString()}`]],
      footStyles: { fillColor: [249, 245, 235], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      const customer: Customer = {
        id: `cust-${Date.now()}`,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || '',
        address: newCustomer.address || '',
        type: newCustomer.type as 'Individual' | 'Wholesale' | 'Corporate',
        balance: 0,
        creditLimit: newCustomer.creditLimit || 0,
        customPrices: {},
        birthDate: newCustomer.birthDate,
        anniversaryDate: newCustomer.anniversaryDate,
        partnerStatus: 'Bronze'
      };
      setCustomers([...customers, customer]);
      setShowAddForm(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', type: 'Individual', balance: 0, creditLimit: 500000 });
    }
  };

  const calculateCustomerMetrics = (customer: Customer) => {
    const custSales = sales.filter(s => s.customerId === customer.id);
    const totalSpent = custSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const lastOrder = custSales.length > 0 ? new Date(Math.max(...custSales.map(s => new Date(s.date).getTime()))) : null;
    const avgMonthly = custSales.length > 0 ? totalSpent / Math.max(1, (new Date().getTime() - new Date(custSales[0].date).getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : 0;
    
    const churnDays = lastOrder ? Math.floor((new Date().getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    const today = new Date();
    
    const isMilestoneSoon = (dateStr?: string) => {
       if (!dateStr) return false;
       const d = new Date(dateStr);
       d.setFullYear(today.getFullYear());
       const diff = (d.getTime() - today.getTime()) / (1000 * 3600 * 24);
       return diff >= 0 && diff <= 14;
    };

    return { 
        totalSpent, avgMonthly, churnDays, 
        orderCount: custSales.length,
        milestoneAlert: isMilestoneSoon(customer.birthDate) || isMilestoneSoon(customer.anniversaryDate),
        status: customer.partnerStatus || 'Bronze'
    };
  };

  const getStatusColor = (status?: PartnerStatus) => {
    switch (status) {
      case 'Platinum': return 'bg-slate-900 text-white border-slate-700';
      case 'Gold': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Silver': return 'bg-slate-100 text-slate-800 border-slate-300';
      default: return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif uppercase tracking-tight">Predictive CRM & Lifetime Value</h2>
          <p className="text-gray-500 font-medium text-sm">Managing relationships through milestone intelligence and neural growth strategy.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-black transition-all active:scale-95">+ Register New Partner</button>
      </header>

      {showAddForm && (
        <div className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 shadow-xl animate-fadeIn space-y-8">
          <h3 className="font-bold text-indigo-900 uppercase tracking-widest text-sm border-b pb-4">Partner Enrollment Details (Knowledge Bank)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-2">Entity Name</label>
              <input className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Client Name" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-2">Category</label>
              <select className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newCustomer.type} onChange={e => setNewCustomer({...newCustomer, type: e.target.value as any})}>
                <option value="Individual">Individual (Walk-in)</option>
                <option value="Wholesale">Wholesale Distributor</option>
                <option value="Corporate">Corporate / Catering</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-2 tracking-widest">Phone Number</label>
              <input className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="+256..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-2 tracking-widest">Email Address</label>
              <input type="email" className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="client@example.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-2 tracking-widest">Client Location (Address)</label>
              <input className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="City, Plot, Area" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-2 tracking-widest">Birth Date</label>
              <input type="date" className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newCustomer.birthDate} onChange={e => setNewCustomer({...newCustomer, birthDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-2 tracking-widest">Anniversary</label>
              <input type="date" className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newCustomer.anniversaryDate} onChange={e => setNewCustomer({...newCustomer, anniversaryDate: e.target.value})} />
            </div>
            <div className="flex gap-2 lg:col-span-2">
              <button onClick={handleAddCustomer} className="flex-1 bg-indigo-900 text-white py-3 rounded-xl font-black uppercase text-[10px] shadow-md">Register Partner</button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-3 bg-white text-indigo-400 rounded-xl font-bold border border-indigo-100 uppercase text-[10px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {customers.map(customer => {
          const metrics = calculateCustomerMetrics(customer);
          const isAtRisk = metrics.churnDays > 30 && metrics.orderCount > 0;

          return (
            <div key={customer.id} className={`bg-white p-8 rounded-[3rem] border shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full ${metrics.milestoneAlert ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-50'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold ${metrics.milestoneAlert ? 'bg-amber-100 text-amber-600 animate-bounce' : 'bg-slate-50 text-slate-400'}`}>
                    {metrics.milestoneAlert ? '🎁' : customer.name.charAt(0)}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${getStatusColor(metrics.status)}`}>
                    {metrics.status} STATUS
                  </span>
                  {metrics.milestoneAlert && <span className="text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">MILESTONE SOON</span>}
                  {isAtRisk && <span className="text-[8px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">CHURN RISK</span>}
                </div>
              </div>

              <h4 className="text-xl font-bold font-serif text-gray-900 mb-1">{customer.name}</h4>
              <div className="text-xs text-gray-400 font-bold uppercase mb-4">{customer.phone}</div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] font-black text-slate-300 uppercase block">Birthday</span>
                    <span className="text-10px] font-bold text-slate-600">{customer.birthDate || '--'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-300 uppercase block">LTV Realized</span>
                    <span className="text-10px] font-bold text-slate-900">{currency.format(metrics.totalSpent)}</span>
                  </div>
              </div>

              {customer.aiFollowUpActions ? (
                <div className="space-y-4 mb-6">
                  <div className="p-5 bg-indigo-900 text-white rounded-[2rem] shadow-lg animate-softFade">
                    <div className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1">Neural Growth Directive</div>
                    <p className="text-[11px] font-medium leading-relaxed italic">"{customer.aiGrowthDirectives}"</p>
                  </div>
                  <div className="p-5 bg-emerald-50 text-emerald-900 rounded-[2rem] border border-emerald-100 animate-softFade">
                    <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Recommended Follow-up</div>
                    <p className="text-[11px] font-bold leading-relaxed">"{customer.aiFollowUpActions}"</p>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => handleRunAiAudit(customer)}
                  disabled={isAiLoading === customer.id}
                  className={`w-full py-4 mb-6 rounded-[2rem] border-2 border-dashed transition-all font-black uppercase text-[9px] tracking-widest ${isAiLoading === customer.id ? 'bg-slate-50 text-slate-300 border-slate-200 animate-pulse' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}
                >
                  {isAiLoading === customer.id ? 'Synthesizing roadmap...' : '🧠 Generate Growth Strategy'}
                </button>
              )}

              <div className="mt-auto space-y-3">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                    <span className="text-[9px] font-black text-indigo-400 uppercase">A/R Balance</span>
                    <span className="text-sm font-mono font-black text-indigo-900">{currency.format(customer.balance || 0)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPriceBookCustomerId(customer.id)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter">Contract Prices</button>
                    <button onClick={() => generateStatement(customer)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-slate-50">Statement</button>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerManager;