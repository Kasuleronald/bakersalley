
export const UGANDA_TAX_CONFIG = {
  PAYE_BRACKETS: [
    { threshold: 235000, taxBase: 0, rate: 0 },
    { threshold: 335000, taxBase: 0, rate: 0.10 },
    { threshold: 410000, taxBase: 10000, rate: 0.20 },
    { threshold: 10000000, taxBase: 25000, rate: 0.30 },
  ],
  HIGH_EARNER_SURCHARGE: {
    threshold: 10000000,
    rate: 0.10
  },
  NSSF_RATES: {
    employee: 0.05,
    employer: 0.10,
    total: 0.15
  },
  VAT_RATE: 0.18, // Uganda Standard Rate
  VAT_ZERO_RATE: 0.0,
  EXEMPT_THRESHOLD_ANNUAL: 150000000 // 150M UGX
};

export const DEFAULT_TAX_CONFIG = {
  vatRate: 0.18,
  isVatRegistered: true,
  nssfEmployeeRate: 0.05,
  nssfEmployerRate: 0.10,
  payeThreshold: 235000
};
