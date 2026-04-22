
import React, { useState } from 'react';
import { BoardDirective, User, DepartmentName } from '../types';
import { DEPARTMENTS } from '../constants';

interface ExecutiveDirectiveHubProps {
  directives: BoardDirective[];
  setDirectives: (d: BoardDirective[]) => void;
  currentUser: User;
}

const ExecutiveDirectiveHub: React.FC<ExecutiveDirectiveHubProps> = ({ directives, setDirectives, currentUser }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDir, setNewDir] = useState<Partial<BoardDirective>>({
    title: '', instruction: '', priority: 'Strategic', targetDepartment: 'Administration'
  });

  const isDirector = currentUser.department === 'Board of Directors' || currentUser.role === 'Managing Director';

  const handleAddDirective = () => {
    if (!newDir.title || !newDir.instruction) return;
    const directive: BoardDirective = {
      id: `dir-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      title: newDir.title,
      instruction: newDir.instruction,
      priority: newDir.priority as any,
      timestamp: new Date().toISOString(),
      status: 'Open',
      targetDepartment: newDir.targetDepartment as DepartmentName
    };
    setDirectives([directive, ...directives]);
    setShowAddForm(false);
    setNewDir({ title: '', instruction: '', priority: 'Strategic', targetDepartment: 'Administration' });
  };

  const handleRespond = (id: string, response: string) => {
    setDirectives(directives.map(d => d.id === id ? { 
      ...d, 
      managementResponse: response, 
      respondedBy: currentUser.name,
      status: 'Acknowledged'
    } : d));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
         <div>
            <h3 className="text-xl font-bold font-serif text-slate-900 uppercase">Board Action Directives</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">Closed-loop accountability between the Board and Management</p>
         </div>
         {isDirector && (
           <button onClick={() => setShowAddForm(true)} className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black">+ Issue Directive</button>
         )}
      </div>

      {showAddForm && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-softFade space-y-8">
           <h4 className="text-lg font-bold font-serif text-indigo-900 uppercase">Strategic Instruction Intake</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Directive Subject</label>
                    <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={newDir.title} onChange={e => setNewDir({...newDir, title: e.target.value})} placeholder="e.g. Debt Recovery Acceleration" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Priority</label>
                       <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" value={newDir.priority} onChange={e => setNewDir({...newDir, priority: e.target.value as any})}>
                          <option value="Strategic">Strategic (Quarterly)</option>
                          <option value="Critical">Critical (Immediate)</option>
                          <option value="Operational">Operational (Efficiency)</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Owner Dept.</label>
                       <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" value={newDir.targetDepartment} onChange={e => setNewDir({...newDir, targetDepartment: e.target.value as DepartmentName})}>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Detailed Instruction</label>
                 <textarea className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium text-sm h-32" value={newDir.instruction} onChange={e => setNewDir({...newDir, instruction: e.target.value})} placeholder="What must be achieved?" />
              </div>
           </div>
           <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
              <button onClick={() => setShowAddForm(false)} className="px-10 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Discard</button>
              <button onClick={handleAddDirective} className="px-16 py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Push to Management</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {directives.map(dir => (
          <div key={dir.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm group hover:border-indigo-100 transition-all flex flex-col lg:flex-row gap-10">
             <div className="flex-1 space-y-6">
                <div className="flex justify-between items-start">
                   <div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${dir.priority === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-700'}`}>{dir.priority}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued by {dir.authorName}</span>
                      </div>
                      <h4 className="text-xl font-bold font-serif text-slate-900 uppercase mt-2">{dir.title}</h4>
                   </div>
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${dir.status === 'Open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{dir.status}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic font-medium">"{dir.instruction}"</p>
                <div className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Target: {dir.targetDepartment} • Ref: {dir.id}</div>
             </div>

             <div className="w-full lg:w-[450px] bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Management Response</h5>
                {dir.managementResponse ? (
                  <div className="space-y-4 animate-fadeIn">
                     <p className="text-xs text-slate-700 font-bold leading-relaxed">"{dir.managementResponse}"</p>
                     <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Acknowledge By {dir.respondedBy}</span>
                        <button className="text-[9px] font-black text-indigo-600 uppercase hover:underline">Update Progress</button>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <textarea 
                      className="w-full p-4 bg-white border-none rounded-2xl text-xs font-medium h-24 shadow-inner"
                      placeholder="MD or Dept Head Response..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRespond(dir.id, (e.target as HTMLTextAreaElement).value);
                      }}
                     />
                     <div className="flex items-center gap-2 text-[8px] text-slate-400 uppercase font-black italic">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        Awaiting Official Feedback from Management
                     </div>
                  </div>
                )}
             </div>
          </div>
        ))}
        {directives.length === 0 && (
          <div className="py-20 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
             <div className="text-6xl opacity-10 mb-4">📢</div>
             <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No strategic instructions on current cycle.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveDirectiveHub;
