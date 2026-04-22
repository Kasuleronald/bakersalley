
import React, { useState, useMemo, useRef } from 'react';
import SupplierManager from './SupplierManager';
import DigitalSignatory from './DigitalSignatory';
import AIScanner from './AIScanner';
import ModuleAiInteraction from './ModuleAiInteraction';
import { 
  Ingredient, InventoryMovement, Requisition, Unit, 
  SupplierInvoice, Supplier, RMQALog, SKU, IngredientCategory,
  Transaction, Batch, AuditLogEntry, StorageCondition, User, ApprovalStatus, DigitalSignature
} from '../types';
import { analyzeProcurement } from '../services/geminiService';
import { parseSupplierCSV, getSupplierTemplate } from '../utils/importUtils';

interface ProcurementManagerProps {
  ingredients: Ingredient[];
  setIngredients: (ings: Ingredient[]) => void;
  skus: SKU[];
  setSkus: (skus: SKU[]) => void;
  movements: InventoryMovement[];
  setMovements: (movs: InventoryMovement[]) => void;
  requisitions: Requisition[];
  setRequisitions: (reqs: Requisition[]) => void;
  invoices: SupplierInvoice[];
  setInvoices: (invs: SupplierInvoice[]) => void;
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  rmQaLogs: RMQALog[];
  currency: { active: any, format: (v: number) => string, formatCompact: (v: number) => string };
  currentUser: User;
}

const ProcurementManager: React.FC<ProcurementManagerProps> = ({ 
  ingredients, setIngredients, skus, setSkus, movements, setMovements,
  requisitions, setRequisitions, invoices, setInvoices, suppliers = [],
  setSuppliers, transactions, setTransactions, rmQaLogs = [], currency, currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'requisitions' | 'suppliers' | 'history'>('requisitions');
  const [showAddReq, setShowAddReq] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isAuditingId, setIsAuditingId] = useState<string | null>(null);
  const [aiAuditResults, setAiAuditResults] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newReq, setNewReq] = useState<Partial<Requisition>>({
    ingredientId: '', supplierId: '', quantityRequested: 0, estimatedCost: 0
  });

  const handleRunAiAudit = async (req: Requisition, intent?: string) => {
    const ing = ingredients.find(i => i.id === req.ingredientId);
    const supp = suppliers.find(s => s.id === req.supplierId);
    if (!ing) return;

    setIsAuditingId(req.id);
    const result = await analyzeProcurement(req, ing, supp, intent);
    if (result) {
      setAiAuditResults(prev => ({ ...prev, [req.id]: result }));
    }
    setIsAuditingId(null);
  };

  const handleScanConfirm = (data: any) => {
    const matchedSupplier = suppliers.find(s => 
      s.name.toLowerCase().includes(data.vendorName?.toLowerCase()) || 
      data.vendorName?.toLowerCase().includes(s.name.toLowerCase())
    );
    const firstItem = data.lineItems?.[0];
    const matchedIng = ingredients.find(i => 
      i.name.toLowerCase().includes(firstItem?.name?.toLowerCase())
    );
    setNewReq({
      supplierId: matchedSupplier?.id || '',
      ingredientId: matchedIng?.id || '',
      quantityRequested: firstItem?.qty || 1,
      estimatedCost: data.totalAmount || 0
    });
    setShowScanner(false);
    setShowAddReq(true);
  };

  const handleSignDocument = (reqId: string) => {
    const signature: DigitalSignature = {
      signerId: currentUser.id,
      signerName: currentUser.name,
      signerRole: currentUser.role,
      timestamp: new Date().toISOString(),
      authorityHash: `AUTH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
    setRequisitions(requisitions.map(r => r.id === reqId ? { ...r, status: 'Authorized', signature } : r));
  };

  const handleCreateRequisition = () => {
    if (!newReq.ingredientId || (newReq.quantityRequested || 0) <= 0) return;
    const ing = ingredients.find(i => i.id === newReq.ingredientId);
    const supp = suppliers.find(s => s.id === newReq.supplierId);
    const req: Requisition = {
      id: `REQ-${Date.now()}`,
      ingredientId: newReq.ingredientId!,
      supplierId: newReq.supplierId,
      supplierName: supp?.name || 'Manual/Unassigned',
      quantityRequested: newReq.quantityRequested!,
      estimatedCost: newReq.estimatedCost || (ing ? ing.costPerUnit * newReq.quantityRequested! : 0),
      status: 'Draft',
      date: new Date().toISOString()
    };
    setRequisitions([req, ...requisitions]);
    setShowAddReq(false);
    setNewReq({ ingredientId: '', supplierId: '', quantityRequested: 0, estimatedCost: 0 });
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5 ml-2">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-[10px] ${i < Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {showScanner && <AIScanner docType="Invoice" onConfirm={handleScanConfirm} onClose={() => setShowScanner(false)} />}
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={() => {}} />

      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-100 p-1.5 rounded-2xl w-full shadow-inner">
        <div className="flex gap-1">
          {['requisitions', 'suppliers', 'history'].map((t) => (
            <button key={t} onClick={() => setActiveSubTab(t as any)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === t ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>{t}</button>
          ))}
        </div>
      </header>

      {activeSubTab === 'requisitions' && (
        <div className="space-y-6">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-10">
             <div className="flex-1 space-y-2">
                <h3 className="text-2xl font-bold font-serif text-slate-900 uppercase">Procurement Workflow</h3>
                <p className="text-sm text-slate-500 italic">"Maximize buying power by correlating supplier reliability with price variance."</p>
             </div>
             <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setShowScanner(true)} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">📸 Scan Invoice</button>
                <button onClick={() => setShowAddReq(!showAddReq)} className="bg-indigo-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">✍️ Manual Entry</button>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {requisitions.map(req => {
              const ing = ingredients.find(i => i.id === req.ingredientId);
              const supp = suppliers.find(s => s.id === req.supplierId);
              const audit = aiAuditResults[req.id];
              const unitPriceActual = req.estimatedCost / (req.quantityRequested || 1);
              const priceDrift = ing ? ((unitPriceActual - ing.costPerUnit) / ing.costPerUnit) * 100 : 0;
              const isUnfavorable = priceDrift > 5;

              return (
                <div key={req.id} className={`bg-white p-8 rounded-[3.5rem] border transition-all ${isUnfavorable ? 'border-rose-300 ring-4 ring-rose-50 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
                   <div className="flex flex-col lg:flex-row justify-between gap-10">
                      <div className="flex-1 space-y-6">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">📦</div>
                                <div>
                                <div className="flex items-center">
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{ing?.name}</h4>
                                    {supp && renderStars(supp.rating)}
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.quantityRequested} {ing?.unit} • Vendor: {supp?.name}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-lg font-mono font-black ${isUnfavorable ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {priceDrift > 0 ? '+' : ''}{priceDrift.toFixed(1)}%
                                </div>
                                <span className="text-[8px] font-black text-slate-300 uppercase">Market Price Drift</span>
                            </div>
                         </div>
                         
                         <ModuleAiInteraction 
                            title="Line Audit"
                            theme={isUnfavorable ? 'rose' : 'indigo'}
                            isLoading={isAuditingId === req.id}
                            onExecute={(intent) => handleRunAiAudit(req, intent)}
                            suggestions={[
                              "Audit against last 3 delivery prices",
                              "Draft a negotiation script for this price",
                              "Verify supplier lead time performance"
                            ]}
                            placeholder="e.g. 'Can we find a cheaper alternative for this flour in Kampala?'"
                            response={audit && (
                              <div className={`flex items-center gap-3 p-4 rounded-3xl ${isUnfavorable ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                 <div className="text-center px-4 border-r border-current opacity-30">
                                    <span className="text-[8px] font-black uppercase">Variance</span>
                                    <div className="text-xs font-mono font-black">{currency.format(audit.ppvAmount)}</div>
                                 </div>
                                 <p className="text-xs font-bold leading-relaxed">{audit.recommendation}</p>
                              </div>
                            )}
                         />
                      </div>
                      
                      <div className="w-full lg:w-[400px]">
                         <DigitalSignatory 
                           status={req.status as any} 
                           signature={req.signature} 
                           amount={req.estimatedCost} 
                           currentUser={currentUser}
                           onSign={() => handleSignDocument(req.id)}
                           onReject={() => setRequisitions(requisitions.map(r => r.id === req.id ? { ...r, status: 'Rejected' } : r))}
                           onEscalate={() => alert("Requisition escalated.")}
                         />
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {activeSubTab === 'suppliers' && (
        <SupplierManager 
          suppliers={suppliers}
          setSuppliers={setSuppliers}
        />
      )}
    </div>
  );
};

export default ProcurementManager;
