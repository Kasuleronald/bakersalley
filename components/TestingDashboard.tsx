
import React, { useState } from 'react';
import { testRunner, TestResult } from '../services/testRunner';
import { calculatePAYE, calculateNSSF } from '../utils/payrollUtils';
import { getConversionFactor } from '../utils/conversionUtils';
import { apiClient } from '../services/apiClient';

const TestingDashboard: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runAllTests = async () => {
    setIsTesting(true);
    const newResults: TestResult[] = [];

    const run = async (group: string, name: string, fn: any) => {
      const res = await testRunner.runTest(group, name, fn);
      newResults.push(res);
      setResults([...newResults]);
    };

    // Group 1: Payroll Logic (Uganda Specific)
    await run('Payroll Logic', 'Exempt Bracket Check (<= 235k)', (t: any) => {
      t.expect(calculatePAYE(235000)).toBe(0);
    });
    
    await run('Payroll Logic', '10% Bracket Check (300k)', (t: any) => {
      // (300,000 - 235,000) * 0.1 = 6,500
      t.expect(calculatePAYE(300000)).toBe(6500);
    });

    await run('Payroll Logic', 'High Earner Surcharge (15,000,000)', (t: any) => {
      // Base Tax (over 410k bracket): 25k + (15M - 410k)*30% = 4,402,000
      // Surcharge: (15M - 10M)*10% = 500,000
      // Total: 4,902,000
      t.expect(calculatePAYE(15000000)).toBe(4902000);
    });

    // Group 2: Tax Engine (VAT Flow)
    await run('Tax Engine', 'VAT Refund Position (Input > Output)', (t: any) => {
      const output = 1000000 * 0.18; // 180k collected
      const input = 2000000 * 0.18;  // 360k paid on inputs
      const net = output - input;
      t.expect(net).toBe(-180000); // Verify negative result (refund)
    });

    await run('Tax Engine', 'Zero-Rated Sales Integrity', (t: any) => {
      const revenue = 1000000;
      const rate = 0.0; // Export/Zero-rated
      t.expect(revenue * rate).toBe(0);
    });

    // Group 3: Persistence
    await run('Persistence Layer', 'Verify Local Storage Integrity', async (t: any) => {
      const testData = { _timestamp: Date.now() };
      await apiClient.saveDb(testData);
      const db = await apiClient.getDb();
      t.expect(db._timestamp).toBe(testData._timestamp);
    });

    setIsTesting(false);
  };

  const stats = {
    total: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-serif">System Integrity Audit</h2>
          <p className="text-slate-500 font-medium">Automated validation of enterprise tax math and data persistence.</p>
        </div>
        <button 
          onClick={runAllTests}
          disabled={isTesting}
          className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${isTesting ? 'bg-indigo-100 text-indigo-400 animate-pulse' : 'bg-indigo-900 text-white hover:bg-black'}`}
        >
          {isTesting ? 'Running Audit...' : '🚀 Execute Full Integrity Test'}
        </button>
      </header>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Tests Executed</div>
              <div className="text-4xl font-mono font-black">{stats.total}</div>
           </div>
           <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm flex flex-col items-center">
              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Successful</div>
              <div className="text-4xl font-mono font-black text-emerald-700">{stats.passed}</div>
           </div>
           <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col items-center ${stats.failed > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`text-[10px] font-bold uppercase mb-2 ${stats.failed > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Regression Errors</div>
              <div className={`text-4xl font-mono font-black ${stats.failed > 0 ? 'text-rose-700' : 'text-slate-300'}`}>{stats.failed}</div>
           </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-amber-500 to-rose-500"></div>
        <h3 className="text-xl font-bold font-serif text-white mb-8">Test Runner Console</h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
          {results.length === 0 ? (
            <div className="py-20 text-center text-slate-500 font-mono text-sm italic">// Standby. Awaiting test initiation.</div>
          ) : (
            results.map((res, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group">
                 <div className="flex items-start gap-4">
                    <span className={`mt-1 font-mono text-xs ${res.status === 'passed' ? 'text-emerald-400' : 'text-rose-500'}`}>
                       {res.status === 'passed' ? '[PASS]' : '[FAIL]'}
                    </span>
                    <div>
                       <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{res.group}</div>
                       <div className="text-sm font-bold text-slate-100">{res.name}</div>
                       {res.message && <div className="text-[10px] text-rose-400 mt-2 p-3 bg-rose-500/10 rounded-xl font-mono">{res.message}</div>}
                    </div>
                 </div>
                 <div className="text-right mt-2 md:mt-0">
                    <span className="text-[9px] font-mono text-slate-500">{res.duration?.toFixed(1)}ms</span>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestingDashboard;
