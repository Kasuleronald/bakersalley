
import React, { useState, useMemo } from 'react';
import { BakeryDocument, AuthSession, DocCategory, User } from '../types';
import { INITIAL_USERS } from '../constants';

interface DocumentVaultProps {
  session: AuthSession;
  documents: BakeryDocument[];
  setDocuments: (docs: BakeryDocument[]) => void;
  users?: User[];
}

const CATEGORY_ICONS: Record<DocCategory, string> = {
  Financial: '💰',
  Operational: '⚙️',
  Compliance: '🛡️',
  Personnel: '👥',
  Recipe: '🥖',
  Logistics: '🚚',
  HACCP: '📋',
  'UNBS/ISO': '✅',
  // Fix: Added missing keys for exhaustive coverage of DocCategory type
  Technical: '📁',
  ISO: '📁',
  // Added Gate Control icon to satisfy Record<DocCategory, string>
  'Gate Control': '🚧'
};

const DocumentVault: React.FC<DocumentVaultProps> = ({ session, documents, setDocuments, users = INITIAL_USERS }) => {
  const [activeCategory, setActiveCategory] = useState<DocCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [sharingDocId, setSharingDocId] = useState<string | null>(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const user = session.user;
      if (!user) return false;

      // Access Logic: MD sees all, Department heads see their own, OR shared items
      const hasDirectAccess = user.role === 'Managing Director' || user.department === 'SuperAdmin' || doc.department === user.department;
      const isSharedWithMe = doc.sharedWith?.includes(user.id);
      
      if (!hasDirectAccess && !isSharedWithMe) return false;

      const matchesCategory = activeCategory === 'All' || doc.category === activeCategory;
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [documents, session.user, activeCategory, searchTerm]);

  const handleShare = (userId: string) => {
    if (!sharingDocId) return;
    setDocuments(documents.map(doc => {
      if (doc.id === sharingDocId) {
        const nextShared = doc.sharedWith || [];
        return { ...doc, sharedWith: nextShared.includes(userId) ? nextShared : [...nextShared, userId] };
      }
      return doc;
    }));
    alert("Document visibility granted to functional head.");
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h2 className="text-3xl font-bold text-gray-900 font-serif uppercase tracking-tighter">Enterprise Vault</h2>
             <span className="bg-indigo-900 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase">Access Level: {session.user?.role}</span>
          </div>
          <p className="text-gray-500 font-medium">Cross-Functional Document Hub & Delegation.</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">+ Upload Internal Document</button>
      </header>

      {sharingDocId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl animate-softFade">
              <h3 className="text-xl font-bold font-serif text-slate-900 mb-6">Delegate Document Access</h3>
              <div className="space-y-3 mb-10">
                 {users.filter(u => u.id !== session.user?.id).map(u => (
                   <button key={u.id} onClick={() => handleShare(u.id)} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all group">
                      <div className="text-left">
                         <div className="font-black text-xs uppercase group-hover:text-indigo-900">{u.name}</div>
                         <div className="text-[8px] text-slate-400 uppercase font-bold">{u.department} ({u.role})</div>
                      </div>
                      <span className="text-xs">➕</span>
                   </button>
                 ))}
              </div>
              <button onClick={() => setSharingDocId(null)} className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Close Sharing Pad</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
             <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-900 rounded-2xl flex items-center justify-center text-3xl">
                   {CATEGORY_ICONS[doc.category]}
                </div>
                <button onClick={() => setSharingDocId(doc.id)} className="p-2 text-slate-300 hover:text-indigo-600 group-hover:opacity-100 opacity-0 transition-opacity">
                   🔗 Share
                </button>
             </div>
             <h4 className="text-xl font-bold font-serif text-slate-900 mb-1 uppercase truncate">{doc.title}</h4>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{doc.category} • {doc.department}</div>
             
             <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-300 uppercase">Shared With</span>
                   <span className="text-[9px] font-bold text-indigo-400">{(doc.sharedWith?.length || 0)} Heads</span>
                </div>
                <button className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-sm">View Securely</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentVault;
