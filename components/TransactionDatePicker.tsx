
import React from 'react';

interface TransactionDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  className?: string;
  dark?: boolean;
}

const TransactionDatePicker: React.FC<TransactionDatePickerProps> = ({ 
  value, 
  onChange, 
  label = "Transaction Date", 
  className = "",
  dark = false
}) => {
  // Ensure value is in YYYY-MM-DD format for the input
  const dateValue = value ? (value.includes('T') ? value.split('T')[0] : value) : '';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className={`text-[10px] font-black uppercase tracking-widest ${dark ? 'text-indigo-300' : 'text-slate-400'}`}>
          {label}
        </label>
      )}
      <div className="relative group">
        <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none text-lg ${dark ? 'text-indigo-400' : 'text-slate-300'}`}>
          📅
        </div>
        <input 
          type="date" 
          value={dateValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-12 pr-4 py-3.5 rounded-2xl font-bold text-sm outline-none transition-all border-2
            ${dark 
              ? 'bg-white/10 border-transparent text-white focus:bg-white/20 focus:border-indigo-500' 
              : 'bg-slate-50 border-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 shadow-inner focus:shadow-none'
            }
          `}
        />
      </div>
    </div>
  );
};

export default TransactionDatePicker;
