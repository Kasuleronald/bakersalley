import React, { useState, useMemo } from 'react';
import { Employee, AppraisalRecord, PerformanceRating, AppraisalPeriod, Goal, GoalStatus, GoalPriority } from '../types';
import { generatePersonnelFeedback } from '../services/geminiService';

interface PersonnelAppraisalProps {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  managerName: string;
}

const PersonnelAppraisal: React.FC<PersonnelAppraisalProps> = ({ employees, setEmployees, managerName }) => {
  const [view, setView] = useState<'Audit' | 'Goals'>('Audit');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [aiResponseText, setAiResponseText] = useState("");
  const [isAiValidated, setIsAiValidated] = useState(false);

  /* Fixed: Added missing safetyAdherence property to ratings to satisfy AppraisalRecord type requirement */
  const [draft, setDraft] = useState<Partial<AppraisalRecord>>({
    period: 'H1',
    year: new Date().getFullYear(),
    ratings: { reliability: 3, efficiency: 3, quality: 3, teamwork: 3, safetyAdherence: 3 },
    managerNotes: ''
  });

  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: GoalPriority.Important,
    status: GoalStatus.Active,
    category: 'Quality',
    targetValue: 0,
    actualValue: 0,
    unit: '%'
  });

  const [scoringGoalId, setScoringGoalId] = useState<string | null>(null);
  const [goalAchievementScore, setGoalAchievementScore] = useState(5);

  const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmpId), [employees, selectedEmpId]);

  const handleStartAppraisal = (empId: string) => {
    setSelectedEmpId(empId);
    setIsAuditing(true);
    const month = new Date().getMonth();
    /* Fixed: Added missing safetyAdherence property to ratings to satisfy AppraisalRecord type requirement */
    setDraft({
      period: month >= 6 ? 'FY' : 'H1',
      year: new Date().getFullYear(),
      ratings: { reliability: 3, efficiency: 3, quality: 3, teamwork: 3, safetyAdherence: 3 },
      managerNotes: ''
    });
    setAiResponseText("");
    setIsAiValidated(false);
  };

  const handleAddGoal = () => {
    if (!selectedEmpId || !newGoal.title) return;
    
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: newGoal.title,
      description: newGoal.description || '',
      deadline: newGoal.deadline || '',
      priority: newGoal.priority as GoalPriority,
      status: GoalStatus.Active,
      category: newGoal.category as any,
      targetValue: newGoal.targetValue || 0,
      actualValue: newGoal.actualValue || 0,
      unit: newGoal.unit || '',
      createdAt: new Date().toISOString()
    };

    setEmployees(employees.map(e => 
      e.id === selectedEmpId ? { ...e, goals: [goal, ...(e.goals || [])] } : e
    ));
    setShowGoalForm(false);
    setNewGoal({ title: '', description: '', deadline: '', priority: GoalPriority.Important, category: 'Quality', targetValue: 0, actualValue: 0, unit: '%' });
  };

  const handleToggleGoal = (empId: string, goalId: string) => {
    setEmployees(employees.map(e => {
      if (e.id !== empId) return e;
      const goals = (e.goals || []).map(g => {
        if (g.id !== goalId) return g;
        const newStatus = g.status === GoalStatus.Completed ? GoalStatus.Active : GoalStatus.Completed;
        return { ...g, status: newStatus, achievementScore: newStatus === GoalStatus.Completed ? 5 : undefined };
      });
      return { ...e, goals };
    }));
  };

  const handleCompleteGoal = (empId: string, goalId: string) => {
    setEmployees(employees.map(e => {
      if (e.id !== empId) return e;
      return {
        ...e,
        goals: (e.goals || []).map(g => g.id === goalId ? { 
          ...g, 
          status: GoalStatus.Completed, 
          achievementScore: goalAchievementScore 
        } : g)
      };
    }));
    setScoringGoalId(null);
  };

  const handleRatingChange = (category: keyof AppraisalRecord['ratings'], value: number) => {
    setDraft(prev => ({
      ...prev,
      ratings: { ...prev.ratings!, [category]: value as PerformanceRating }
    }));
  };

  const handleGenerateAiCoaching = async () => {
    if (!selectedEmployee || !draft.ratings) return;
    setIsGeneratingAi(true);
    const overallScore = (Object.values(draft.ratings) as number[]).reduce((a, b) => a + b, 0) / 4;
    const result = await generatePersonnelFeedback(selectedEmployee, {
      ...draft,
      overallScore,
      managerName,
      id: '',
      date: '',
      ratings: draft.ratings as any
    } as AppraisalRecord, selectedEmployee.goals || []);
    
    setAiResponseText(result || "");
    setIsGeneratingAi(false);
  };

  const handleSaveAppraisal = async () => {
    if (!selectedEmployee || !draft.ratings) return;

    const overallScore = (Object.values(draft.ratings) as number[]).reduce((a, b) => a + b, 0) / 4;
    const goalsThisPeriod = selectedEmployee.goals || [];
    const completedThisPeriod = goalsThisPeriod.filter(g => g.status === GoalStatus.Completed).length;
    
    const record: AppraisalRecord = {
      id: `apr-${Date.now()}`,
      period: draft.period as AppraisalPeriod,
      year: draft.year || new Date().getFullYear(),
      date: new Date().toISOString(),
      ratings: draft.ratings as any,
      overallScore,
      managerNotes: draft.managerNotes || '',
      aiCoachingAdvice: aiResponseText,
      managerName,
      goalsReviewedCount: goalsThisPeriod.length,
      goalsCompletedCount: completedThisPeriod
    };

    setEmployees(employees.map(e => 
      e.id === selectedEmpId 
        ? { ...e, appraisalHistory: [record, ...(e.appraisalHistory || [])] }
        : e
    ));
    setIsAuditing(false);
    setSelectedEmpId(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setView('Audit')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'Audit' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400'}`}>Review Ledger</button>
        <button onClick={() => setView('Goals')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'Goals' ? 'bg-indigo-900 text-white shadow-sm' : 'text-slate-400'}`}>Goal Hub 🎯</button>
      </div>

      {!isAuditing ? (
        <>
          {view === 'Audit' ? (
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 font-serif">Staff Performance Registry</h3>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Active Headcount: {employees.filter(e => e.isActive).length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <th className="px-8 py-5">Personnel</th>
                      <th className="px-6 py-5 text-center">Last Review</th>
                      <th className="px-6 py-5 text-center">Goal Velocity</th>
                      <th className="px-8 py-5 text-right">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {employees.filter(e => e.isActive).map(emp => {
                      const lastReview = emp.appraisalHistory?.[0];
                      const totalGoals = (emp.goals || []).length;
                      const completedGoals = (emp.goals || []).filter(g => g.status === GoalStatus.Completed).length;
                      
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-8 py-5">
                            <div className="font-bold text-slate-900 uppercase text-xs">{emp.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{emp.role}</div>
                          </td>
                          <td className="px-6 py-5 text-center font-bold text-[10px] text-slate-500">
                            {lastReview ? `${lastReview.period} ${lastReview.year}` : '--'}
                          </td>
                          <td className="px-6 py-5 text-center">
                             <div className="flex flex-col items-center">
                                <div className="flex gap-2 items-center">
                                   <span className="text-xs font-mono font-black text-indigo-600">{completedGoals}</span>
                                   <span className="text-[10px] text-gray-300">/</span>
                                   <span className="text-xs font-mono font-black text-gray-400">{totalGoals}</span>
                                </div>
                                <span className="text-[7px] text-slate-300 font-black uppercase">KPIs Achieved</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => handleStartAppraisal(emp.id)} className="px-6 py-2 rounded-xl text-[10px] font-black uppercase bg-white border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">Perform Review</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-4">
                 <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl">
                    <h3 className="text-xl font-bold font-serif text-amber-400 mb-4">Strategic Goal Setting</h3>
                    <p className="text-xs text-indigo-100 leading-relaxed italic">
                      "Assign specific, measurable growth targets. Goal achievement data is automatically injected into formal appraisal records to ensure fact-based performance audits."
                    </p>
                 </div>
                 <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Staff Selector</h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
                       {employees.map(e => (
                         <button 
                          key={e.id}
                          onClick={() => setSelectedEmpId(e.id)}
                          className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedEmpId === e.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-50' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                         >
                            <div className="font-bold text-xs uppercase text-slate-900">{e.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{e.role}</div>
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-8">
                 {selectedEmployee ? (
                   <div className="space-y-8 animate-fadeIn">
                      <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
                         <div>
                            <h3 className="text-2xl font-bold font-serif text-slate-900">KPI Registry: {selectedEmployee.name}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Growth & Training Plan</p>
                         </div>
                         <button onClick={() => setShowGoalForm(true)} className="bg-indigo-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">+ Assign Objective</button>
                      </div>

                      {showGoalForm && (
                        <div className="bg-white p-10 rounded-[3rem] border border-indigo-100 shadow-2xl animate-fadeIn space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2">
                                 <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Goal Objective</label>
                                 <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} placeholder="e.g. Reduce waste by 5% on Sourdough shift" />
                              </div>
                              <div>
                                 <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Deadline</label>
                                 <input type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} />
                              </div>
                              <div>
                                 <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Priority</label>
                                 <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={newGoal.priority} onChange={e => setNewGoal({...newGoal, priority: e.target.value as GoalPriority})}>
                                    <option value={GoalPriority.Critical}>P1 - Critical (Business Impact)</option>
                                    <option value={GoalPriority.Important}>P2 - Important (Operational)</option>
                                    <option value={GoalPriority.Standard}>P3 - Standard (Developmental)</option>
                                 </select>
                              </div>
                           </div>
                           <div className="flex gap-2 justify-end pt-4">
                              <button onClick={handleAddGoal} className="bg-indigo-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-lg">Commit Objective</button>
                              <button onClick={() => setShowGoalForm(false)} className="bg-white border border-slate-200 text-slate-400 px-6 py-4 rounded-2xl font-bold uppercase text-[10px]">Cancel</button>
                           </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {(selectedEmployee.goals || []).map(goal => {
                           const variance = (goal.actualValue || 0) - (goal.targetValue || 0);
                           return (
                             <div key={goal.id} className={`p-8 rounded-[2.5rem] border bg-white shadow-sm transition-all group hover:shadow-md ${goal.status === GoalStatus.Completed ? 'border-emerald-200 bg-emerald-50/20 grayscale opacity-70' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-start mb-6">
                                   <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${goal.priority === GoalPriority.Critical ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{goal.priority}</span>
                                   <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${goal.status === GoalStatus.Completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {goal.status}
                                   </div>
                                </div>
                                <h4 className={`text-lg font-bold font-serif mb-2 leading-tight transition-all ${goal.status === GoalStatus.Completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{goal.title}</h4>
                                
                                {goal.targetValue !== undefined && (
                                   <div className="mb-4 grid grid-cols-3 gap-2 border-y border-slate-50 py-4 my-4">
                                      <div className="text-center">
                                         <div className="text-[7px] font-black text-slate-400 uppercase">Target</div>
                                         <div className="text-xs font-mono font-bold">{goal.targetValue} {goal.unit}</div>
                                      </div>
                                      <div className="text-center">
                                         <div className="text-[7px] font-black text-slate-400 uppercase">Actual</div>
                                         <div className="text-xs font-mono font-black text-indigo-600">{goal.actualValue || 0} {goal.unit}</div>
                                      </div>
                                      <div className="text-center">
                                         <div className="text-[7px] font-black text-slate-400 uppercase">Variance</div>
                                         <div className={`text-xs font-mono font-bold ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {variance > 0 ? '+' : ''}{variance} {goal.unit}
                                         </div>
                                      </div>
                                   </div>
                                )}

                                <p className="text-xs text-slate-500 line-clamp-2 italic mb-6">"{goal.description || 'Target defined for current performance period.'}"</p>
                                
                                <div className="pt-6 border-t border-slate-100/50 flex justify-between items-center">
                                   <div className="flex flex-col">
                                      <span className="text-[8px] text-slate-300 font-black uppercase">Deadline</span>
                                      <span className="text-[10px] font-mono font-bold text-slate-700">{new Date(goal.deadline).toLocaleDateString()}</span>
                                   </div>
                                   
                                   <div className="flex gap-2">
                                     <button 
                                      onClick={() => handleToggleGoal(selectedEmployee.id, goal.id)}
                                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${goal.status === GoalStatus.Completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-indigo-500 text-slate-200 hover:text-indigo-500'}`}
                                      title={goal.status === GoalStatus.Completed ? "Mark as Active" : "Mark as Completed"}
                                     >
                                        {goal.status === GoalStatus.Completed ? '✓' : '○'}
                                     </button>
                                     
                                     {goal.status === GoalStatus.Active && (
                                       <button 
                                        onClick={() => setScoringGoalId(goal.id)}
                                        className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all"
                                       >
                                         Score ★
                                       </button>
                                     )}
                                   </div>
                                </div>

                                {scoringGoalId === goal.id && (
                                  <div className="mt-6 pt-6 border-t border-dashed border-indigo-200 animate-fadeIn space-y-4">
                                     <div className="text-center">
                                        <div className="text-[9px] font-black text-indigo-400 uppercase mb-2">Assign Achievement Score (1-5)</div>
                                        <div className="flex justify-center gap-4">
                                           {[1, 2, 3, 4, 5].map(s => (
                                             <button 
                                              key={s} 
                                              onClick={() => setGoalAchievementScore(s)}
                                              className={`w-10 h-10 rounded-full font-black text-sm transition-all ${goalAchievementScore === s ? 'bg-indigo-900 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                                             >
                                               {s}
                                             </button>
                                           ))}
                                        </div>
                                     </div>
                                     <button 
                                      onClick={() => handleCompleteGoal(selectedEmployee.id, goal.id)}
                                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase shadow-md"
                                     >
                                        Finalize Achievement
                                     </button>
                                  </div>
                                )}
                             </div>
                           );
                         })}
                         {(selectedEmployee.goals || []).length === 0 && (
                           <div className="col-span-2 py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Professional Goals Defined</p>
                           </div>
                         )}
                      </div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 p-20">
                      <div className="text-7xl opacity-20 grayscale mb-6">🎯</div>
                      <h4 className="text-xl font-bold text-slate-800 font-serif">Staff Objective Center</h4>
                      <p className="text-sm text-slate-400 max-w-xs mt-2">Select personnel from the directory to assign or audit growth objectives.</p>
                   </div>
                 )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl animate-softFade space-y-10">
          <div className="flex justify-between items-start border-b border-slate-50 pb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-900 text-white rounded-3xl flex items-center justify-center text-3xl font-black shadow-xl">
                {selectedEmployee?.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 font-serif">{selectedEmployee?.name}</h3>
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Review Cycle: {draft.period} {draft.year} Performance Audit</div>
              </div>
            </div>
            <button onClick={() => setIsAuditing(false)} className="text-slate-300 hover:text-slate-900 font-bold uppercase text-xs">Exit Audit</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-10">
              <div className="space-y-8">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Assessment</h4>
                 {Object.entries(draft.ratings || {}).map(([key, value]) => (
                   <div key={key} className="space-y-4">
                     <div className="flex justify-between items-center">
                       <label className="text-xs font-black text-slate-700 uppercase tracking-widest">{key}</label>
                       <div className="flex gap-1">
                         {[1, 2, 3, 4, 5].map(star => (
                           <button 
                             key={star} 
                             onClick={() => handleRatingChange(key as any, star)}
                             className={`text-xl transition-all ${star <= (value as number) ? 'text-amber-400 scale-110' : 'text-slate-200'}`}
                           >
                             ★
                           </button>
                         ))}
                       </div>
                     </div>
                     <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((value as number) / 5) * 100}%` }}></div>
                     </div>
                   </div>
                 ))}
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Commentary</h4>
                 <textarea 
                  className="w-full p-6 bg-slate-50 border-none rounded-[2.5rem] text-sm font-medium h-48 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Summarize the employee's contribution to the bakery's operational stability and quality standards..."
                  value={draft.managerNotes}
                  onChange={e => setDraft({...draft, managerNotes: e.target.value})}
                 />
              </div>

              {/* AI INTERLOCK (EU AI ACT COMPLIANCE) */}
              <div className="pt-10 border-t border-slate-50 space-y-6">
                 <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Decision Support (High-Risk Category)</h4>
                    <button 
                      onClick={handleGenerateAiCoaching}
                      disabled={isGeneratingAi}
                      className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-md transition-all ${isGeneratingAi ? 'bg-indigo-100 text-indigo-400 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black'}`}
                    >
                      {isGeneratingAi ? 'Processing Neural Review...' : 'Generate AI Coaching Draft'}
                    </button>
                 </div>
                 
                 {aiResponseText && (
                   <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-200 space-y-6 animate-softFade">
                      <div className="text-sm italic font-medium leading-relaxed text-indigo-900 whitespace-pre-wrap">
                         "{aiResponseText}"
                      </div>
                      <div className="pt-6 border-t border-indigo-100 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              id="hitl-check" 
                              checked={isAiValidated} 
                              onChange={e => setIsAiValidated(e.target.checked)}
                              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="hitl-check" className="text-[9px] font-black text-indigo-400 uppercase">
                               Human Validation: I have reviewed this AI content for accuracy and bias (EU AI Act Requirement)
                            </label>
                         </div>
                         <span className="text-[7px] font-bold text-indigo-300 uppercase">Annex III, Clause 4 Compliance Active</span>
                      </div>
                   </div>
                 )}
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-6">
               <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 text-center">Factual Evidence: KPI Audit</h4>
                  <div className="space-y-4">
                     {(() => {
                        const total = (selectedEmployee?.goals || []).length;
                        const done = (selectedEmployee?.goals || []).filter(g => g.status === GoalStatus.Completed).length;
                        const percent = total > 0 ? Math.round((done/total)*100) : 0;
                        return (
                          <div className="text-center pb-6 border-b border-indigo-100 mb-6">
                             <div className="text-3xl font-mono font-black text-indigo-900">{percent}%</div>
                             <div className="text-[8px] font-black text-indigo-400 uppercase mt-1">Goal Fulfillment Rate</div>
                          </div>
                        );
                     })()}
                     {(selectedEmployee?.goals || []).slice(0, 8).map(g => (
                       <div key={g.id} className={`flex items-start gap-3 p-3 rounded-xl border ${g.status === GoalStatus.Completed ? 'bg-emerald-50 border-emerald-100 grayscale opacity-60' : 'bg-white/60 border-indigo-100/50'}`}>
                          <span className="mt-1">{g.status === GoalStatus.Completed ? '✅' : '🎯'}</span>
                          <div>
                             <div className={`text-[10px] font-bold transition-all ${g.status === GoalStatus.Completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{g.title}</div>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[7px] font-black text-indigo-400 uppercase">{g.status}</span>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </aside>
          </div>

          <div className="pt-10 border-t border-slate-50 flex justify-end">
            <button 
              onClick={handleSaveAppraisal}
              disabled={!isAiValidated && aiResponseText.length > 0}
              className={`px-12 py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all ${(!isAiValidated && aiResponseText.length > 0) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black active:scale-95'}`}
            >
              Finalize Performance Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelAppraisal;
