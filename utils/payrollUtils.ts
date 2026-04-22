
import { UGANDA_TAX_CONFIG } from '../constants/statutory';

export const calculateNSSF = (grossSalary: number) => {
  const rates = UGANDA_TAX_CONFIG.NSSF_RATES;
  return {
    employee: grossSalary * rates.employee,
    employer: grossSalary * rates.employer,
    totalLiability: grossSalary * rates.total
  };
};

export const calculatePAYE = (grossSalary: number) => {
  const config = UGANDA_TAX_CONFIG;
  const brackets = config.PAYE_BRACKETS;
  
  // Rule 1: Below threshold = 0 tax
  if (grossSalary <= brackets[0].threshold) return 0;
  
  let tax = 0;
  // Rule 2: 235k - 335k (10%)
  if (grossSalary <= brackets[1].threshold) {
    tax = (grossSalary - brackets[0].threshold) * brackets[1].rate;
  } 
  // Rule 3: 335k - 410k (10k fixed + 20% of excess)
  else if (grossSalary <= brackets[2].threshold) {
    tax = 10000 + (grossSalary - brackets[1].threshold) * brackets[2].rate;
  } 
  // Rule 4: Over 410k (25k fixed + 30% of excess)
  else {
    tax = 25000 + (grossSalary - brackets[2].threshold) * brackets[3].rate;
  }
  
  // Rule 5: High earner surcharge (Over 10M, extra 10%)
  if (grossSalary > config.HIGH_EARNER_SURCHARGE.threshold) {
    tax += (grossSalary - config.HIGH_EARNER_SURCHARGE.threshold) * config.HIGH_EARNER_SURCHARGE.rate;
  }
  
  return Math.round(tax);
};

export const calculateNetPay = (grossSalary: number, deductPaye: boolean = true) => {
  const nssf = calculateNSSF(grossSalary);
  const paye = deductPaye ? calculatePAYE(grossSalary) : 0;
  return grossSalary - nssf.employee - paye;
};

export const getPayrollFilingSummary = (employees: any[] = []) => {
  return (employees || []).reduce((acc, e) => {
    if (!e || !e.isActive) return acc;
    const base = e.employmentType === 'Temporary' ? (e.dailyRate || 0) * 26 : (e.salary || 0);
    const gross = base + (e.bonus || 0);
    const nssf = calculateNSSF(gross);
    const paye = e.deductPAYE !== false ? calculatePAYE(gross) : 0;
    
    return {
      totalGross: acc.totalGross + gross,
      totalPAYE: acc.totalPAYE + paye,
      totalEmployeeNSSF: acc.totalEmployeeNSSF + nssf.employee,
      totalEmployerNSSF: acc.totalEmployerNSSF + nssf.employer,
      totalStatutoryLiability: acc.totalStatutoryLiability + paye + nssf.totalLiability
    };
  }, { totalGross: 0, totalPAYE: 0, totalEmployeeNSSF: 0, totalEmployerNSSF: 0, totalStatutoryLiability: 0 });
};
