
import React, { useState, useMemo } from 'react';
import { DailyTask } from '../types';

interface TaskManagerProps {
  tasks: DailyTask[];
  onToggle: (id: string) => void;
  onAdd: (title: string) => void;
  onRemove: (id: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onToggle, onAdd, onRemove }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAdd(newTaskTitle);
    setNewTaskTitle('');
  };

  const completionStats = useMemo(() => {
    if (tasks.length === 0) return { percent: 0, count: 0, total: 0 };
    const count = tasks.filter(t => t.completed).length;
    return {
      percent: Math.round((count / tasks.length) * 100),
      count,
      total: tasks.length
    };
  }, [tasks]);

  return (
    <div className="space-y-8">
      {/* SHIFT PROGRESS BAR */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Shift Completion Progress</span>
            <span className="text-xs font-mono font-black text-slate-900">{completionStats.percent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-indigo-600 transition-all duration-700 ease-out" 
              style={{ width: `${completionStats.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* INPUT AREA */}
      <div className="flex gap-2">
        <input 
          className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" 
          placeholder="Inject shift protocol task..." 
          value={newTaskTitle} 
          onChange={e => setNewTaskTitle(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleAdd()} 
        />
        <button 
          onClick={handleAdd} 
          className="bg-indigo-900 text-white px-8 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-black transition-all active:scale-95 whitespace-nowrap"
        >
          Add Task
        </button>
      </div>

      {/* TASK LIST */}
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all group ${
                task.completed 
                  ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                  : 'bg-white border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-5 overflow-hidden flex-1">
                <button 
                  onClick={() => onToggle(task.id)} 
                  className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 ${
                    task.completed 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'border-slate-100 bg-slate-50 text-transparent hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-400'
                  }`}
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                >
                  <span className={`text-xl leading-none transition-transform ${task.completed ? 'scale-100' : 'scale-0'}`}>✓</span>
                </button>
                <span className={`font-black text-xs uppercase tracking-tight transition-all truncate ${
                  task.completed ? 'line-through text-slate-400' : 'text-slate-700'
                }`}>
                  {task.title}
                </span>
              </div>
              
              <button 
                onClick={() => onRemove(task.id)} 
                className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-3 rounded-xl hover:bg-rose-50"
                title="Purge Task"
              >
                ✕
              </button>
            </div>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3.5rem] bg-slate-50/30">
            <div className="text-5xl mb-4 grayscale opacity-20">📋</div>
            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em]">Zero Protocols Assigned for this Shift</p>
          </div>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="pt-4 flex justify-center">
           <div className="px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                {completionStats.count} of {completionStats.total} Operations Verified
              </span>
           </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
