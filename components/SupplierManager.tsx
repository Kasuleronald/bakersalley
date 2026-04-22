
import React, { useState, useMemo } from 'react';
import { Supplier } from '../types';

interface SupplierManagerProps {
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
}

const COMMON_CATEGORIES = ['Raw Materials', 'Packaging', 'Utilities', 'Equipment', 'Services', 'Others'];

const SupplierManager: React.FC<SupplierManagerProps> = ({ suppliers, setSuppliers }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: 'Raw Materials',
    type: 'Raw Materials',
    rating: 5,
    isActive: true,
    creditLimit: 5000000,
    paymentTerms: '',
    averageDeliveryTime: 0,
    averageQualityScore: 5,
    averagePriceVariance: 0
  });

  const handleAdd = () => {
    if (newSupplier.name && newSupplier.phone) {
       if (editingSupplierId) {
          setSuppliers(suppliers.map(s => s.id === editingSupplierId ? { ...s, ...newSupplier } as Supplier : s));
          alert("Partner data updated.");
       } else {
          const supplier: Supplier = {
            id: `sup-${Date.now()}`,
            name: newSupplier.name!,
            contactPerson: newSupplier.contactPerson,
            phone: newSupplier.phone!,
            email: newSupplier.email,
            address: newSupplier.address,
            category: newSupplier.category || 'Raw Materials',
            type: newSupplier.type || newSupplier.category || 'Raw Materials',
            rating: newSupplier.rating || 5,
            isActive: true,
            creditLimit: newSupplier.creditLimit || 5000000,
            paymentTerms: newSupplier.paymentTerms || '',
            averageDeliveryTime: 0,
            averageQualityScore: 5,
            averagePriceVariance: 0
          };
          setSuppliers([...suppliers, supplier]);
          alert("New Partner successfully enrolled in the directory.");
       }
       setShowAddForm(false);
       setEditingSupplierId(null);
       setNewSupplier({ name: '', contactPerson: '', phone: '', email: '', address: '', category: 'Raw Materials', type: 'Raw Materials', rating: 5, isActive: true, creditLimit: 5000000, paymentTerms: '' });
    }
  };

  const handleStartEdit = (sup: Supplier) => {
    setEditingSupplierId(sup.id);
    setNewSupplier({ ...sup });
    setShowAddForm(true);
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategoryFilter === 'All' || s.category === activeCategoryFilter || s.type === activeCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [suppliers, searchTerm, activeCategoryFilter]);

  return (
    <div className="space-y-8 animate-fadeIn">
       <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex-1 w-full max-w-md relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
             <input 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Search supplier or service provider..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
             />
          </div>
          <button onClick={() => { setShowAddForm(true); setEditingSupplierId(null); setNewSupplier({ name: '', contactPerson: '', phone: '', email: '', address: '', category: 'Raw Materials', type: 'Raw Materials', rating: 5, isActive: true, creditLimit: 5000000, paymentTerms: '' }); }} className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">+ Enroll Partner</button>
       </div>

       {showAddForm && (
         <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-8">
            <h3 className="text-xl font-bold font-serif text-indigo-900 uppercase">{editingSupplierId ? 'Update Partner Details' : 'Partner Enrollment Pad'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
               <div className="md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Entity Name</label>
                  <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="e.g. Acme Millers or Security Plus" />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Primary Contact</label>
                  <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newSupplier.contactPerson} onChange={e => setNewSupplier({...newSupplier, contactPerson: e.target.value})} />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Phone / Mobile</label>
                  <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Classification</label>
                  <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" value={newSupplier.type} onChange={e => setNewSupplier({...newSupplier, type: e.target.value, category: e.target.value})}>
                     {COMMON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-indigo-600 uppercase mb-2 tracking-widest">Payment & Credit Terms</label>
                  <input className="w-full p-4 bg-indigo-50/50 border-none rounded-2xl font-bold text-sm placeholder:text-indigo-200" value={newSupplier.paymentTerms} onChange={e => setNewSupplier({...newSupplier, paymentTerms: e.target.value})} placeholder="e.g. Net 30, Pay on Delivery, 15% Late Fee..." />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Credit Limit (UGX)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono font-black" value={newSupplier.creditLimit || ''} onChange={e => setNewSupplier({...newSupplier, creditLimit: parseFloat(e.target.value) || 0})} />
               </div>
               <div className="flex gap-2">
                  <button onClick={handleAdd} className="flex-1 py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-black transition-all">
                    {editingSupplierId ? 'Commit Update' : 'Archive Partner'}
                  </button>
                  <button onClick={() => { setShowAddForm(false); setEditingSupplierId(null); }} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase transition-all">Cancel</button>
               </div>
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(sup => (
             <div key={sup.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full border-b-4 border-b-transparent hover:border-b-indigo-500">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-14 h-14 bg-indigo-50 text-indigo-900 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      {sup.type === 'Services' ? '🛠️' : '🤝'}
                   </div>
                   <div className="text-right">
                      <div className="flex gap-1 mb-1">
                         {[...Array(5)].map((_, i) => <span key={i} className={`text-[10px] ${i < sup.rating ? 'text-amber-400' : 'text-slate-100'}`}>★</span>)}
                      </div>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{sup.type || sup.category}</span>
                   </div>
                </div>
                <h4 className="text-xl font-bold font-serif text-slate-900 uppercase truncate mb-1">{sup.name}</h4>
                <div className="text-[10px] font-bold text-indigo-400 mb-6">{sup.contactPerson} • {sup.phone}</div>
                
                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                   <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Terms of Engagement</div>
                   <p className="text-[10px] text-slate-600 italic leading-relaxed">
                      {sup.paymentTerms || 'Standard trading terms apply.'}
                   </p>
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-300 uppercase">Balance Limit</span>
                      <span className="text-[10px] font-mono font-black text-slate-600">UGX {sup.creditLimit.toLocaleString()}</span>
                   </div>
                   <button onClick={() => handleStartEdit(sup)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-sm hover:bg-indigo-600 transition-colors">Edit Master</button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

export default SupplierManager;
