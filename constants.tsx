
import { Ingredient, SKU, DepartmentName, Employee, User, TaxConfig, AccountGroup, Activity, FinishedGood, SKUVariant, RecipeItem, EnergyCategory } from './types';

export const SYSTEM_VERSION = "3.2.1";

export interface FeatureUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  icon: string;
  module: string;
}

export const SYSTEM_CHANGELOG: FeatureUpdate[] = [
  {
    id: 'procure-2',
    version: '3.2.1',
    title: 'Procurement Hub 2.0',
    description: 'Manual input of suppliers and service providers with custom credit and payment terms is now live.',
    icon: '🎯',
    module: 'Sourcing'
  },
  {
    id: 'kanban-alt',
    version: '3.2.0',
    title: 'Enhanced Kanban Flow',
    description: 'Added alternate Frying and Baking lanes with specialized Decoration stages for Cakes.',
    icon: '📊',
    module: 'Production'
  },
  {
    id: 'neural-audit',
    version: '3.1.5',
    title: 'Neural Process Auditor',
    description: 'AI-driven bottleneck diagnosis and yield recovery directives now active in the Shop Floor.',
    icon: '🧠',
    module: 'Neural Hub'
  }
];

export const DEPARTMENTS: DepartmentName[] = [
  'Administration',
  'Production',
  'Distribution & Logistics',
  'Quality Assurance',
  'R&D',
  'Sanitation',
  'Welfare',
  'Sales and Marketing',
  'Stores',
  'Finance',
  'Board of Directors'
];

export const INITIAL_USERS: User[] = [
  { id: 'u-md', name: 'Dr. David Kato', identity: 'md@nissi-industries.com', passwordHash: 'md123', department: 'Administration', role: 'Managing Director', authorityLimit: 1000000000, mfaEnabled: true, hasConsentedToPrivacy: true, seenFeatures: [], systemVersion: '0.0.0' },
  { id: 'u-ops', name: 'Sarah Nabukeera', identity: 'ops@nissi-industries.com', passwordHash: 'ops123', department: 'Production', role: 'Plant Manager', authorityLimit: 50000000, mfaEnabled: true, hasConsentedToPrivacy: true, seenFeatures: [], systemVersion: '0.0.0' }
  { id: 'u-dummy', name: 'Dummy Company', identity: 'dummy', passwordHash: 'dummy@123', department: 'Administration', role: 'Managing Director', authorityLimit: 1000000000, mfaEnabled: false, hasConsentedToPrivacy: true, seenFeatures: [], systemVersion: '0.0.0' }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Sarah Nabukeera', role: 'Plant Manager', department: 'Production', salary: 2500000, category: 'Permanent', shift: 'Day', isActive: true, joinedDate: '2023-01-10', weeklyHoursDedicated: 48, normalWeeklyHours: 48, goals: [], appraisalHistory: [], assignments: [], competencies: [], medicalCertExpiry: '2025-12-01', employmentType: 'Permanent' },
  { id: 'emp-2', name: 'John Okello', role: 'Head Baker', department: 'Production', salary: 1800000, category: 'Permanent', shift: 'Day', isActive: true, joinedDate: '2023-03-15', weeklyHoursDedicated: 48, normalWeeklyHours: 48, goals: [], appraisalHistory: [], assignments: [], competencies: [], employmentType: 'Permanent' },
  { id: 'emp-3', name: 'Temp-001 (Kasoma)', role: 'Mixer Assistant', department: 'Production', salary: 0, dailyRate: 15000, category: 'Outsourced/Agency', agencyName: 'Swift Labor Ltd', shift: 'Night', isActive: true, joinedDate: '2024-05-01', weeklyHoursDedicated: 40, normalWeeklyHours: 40, goals: [], appraisalHistory: [], assignments: [], competencies: [], employmentType: 'Temporary' }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Premium Silo Wheat Flour', unit: 'kg', costPerUnit: 3150, currentStock: 45000, reorderLevel: 5000, category: 'Food', storageRequirement: 'Dry/Dark', batches: [
    { id: 'bat-fl-01', quantity: 20000, expiryDate: '2026-05-01', receivedDate: '2025-01-01', unitCost: 3100 },
    { id: 'bat-fl-02', quantity: 25000, expiryDate: '2026-08-15', receivedDate: '2025-02-10', unitCost: 3150 }
  ]},
  { id: 'ing-2', name: 'Refined White Sugar', unit: 'kg', costPerUnit: 4800, currentStock: 12000, reorderLevel: 1500, category: 'Food', storageRequirement: 'Dry/Dark', batches: [] },
  { id: 'ing-3', name: 'Active Dry Yeast (Industrial)', unit: 'kg', costPerUnit: 12500, currentStock: 800, reorderLevel: 100, category: 'Food', storageRequirement: 'Chilled', batches: [
    { id: 'bat-ys-01', quantity: 400, expiryDate: '2025-06-01', unitCost: 12000 },
    { id: 'bat-ys-02', quantity: 400, expiryDate: '2025-12-15', unitCost: 12500 }
  ]},
  { id: 'ing-4', name: 'Iodized Salt', unit: 'kg', costPerUnit: 1800, currentStock: 5000, reorderLevel: 500, category: 'Food', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-5', name: 'Vegetable Margarine', unit: 'kg', costPerUnit: 9500, currentStock: 3000, reorderLevel: 300, category: 'Food', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-6', name: 'Powdered Milk (Bakery Grade)', unit: 'kg', costPerUnit: 22000, currentStock: 1500, reorderLevel: 200, category: 'Food', storageRequirement: 'Dry/Dark', batches: [] },
  { id: 'ing-8', name: 'Fresh Farm Eggs', unit: 'units', costPerUnit: 450, currentStock: 15000, reorderLevel: 1000, category: 'Food', storageRequirement: 'Chilled', batches: [{ id: 'bat-eg-01', quantity: 15000, expiryDate: '2025-03-25', receivedDate: '2025-02-25' }] },
  { id: 'ing-9', name: 'Liquid Glucose', unit: 'kg', costPerUnit: 7200, currentStock: 500, reorderLevel: 50, category: 'Food', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-10', name: 'Dark Chocolate Couverture', unit: 'kg', costPerUnit: 45000, currentStock: 250, reorderLevel: 25, category: 'Food', storageRequirement: 'Chilled', batches: [] },
  { id: 'ing-11', name: 'Butter (Unsalted)', unit: 'kg', costPerUnit: 35000, currentStock: 600, reorderLevel: 100, category: 'Food', storageRequirement: 'Frozen', batches: [] },
  { id: 'ing-12', name: 'Vanilla Essence', unit: 'l', costPerUnit: 18000, currentStock: 50, reorderLevel: 5, category: 'Food', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-13', name: 'Baking Powder', unit: 'kg', costPerUnit: 15000, currentStock: 300, reorderLevel: 30, category: 'Food', storageRequirement: 'Dry/Dark', batches: [] },
  { id: 'ing-14', name: 'Cocoa Powder', unit: 'kg', costPerUnit: 28000, currentStock: 400, reorderLevel: 40, category: 'Food', storageRequirement: 'Dry/Dark', batches: [] },
  { id: 'ing-15', name: 'Raisins / Sultanas', unit: 'kg', costPerUnit: 16500, currentStock: 200, reorderLevel: 20, category: 'Food', storageRequirement: 'Dry/Dark', batches: [] },
  { id: 'ing-16', name: 'Sesame Seeds', unit: 'kg', costPerUnit: 9000, currentStock: 150, reorderLevel: 15, category: 'Food', storageRequirement: 'Dry/Dark', batches: [] },
  { id: 'ing-17', name: 'Water (Mains Supply)', unit: 'l', costPerUnit: 12, currentStock: 100000, reorderLevel: 0, category: 'Food', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-18', name: 'Sourdough Starter', unit: 'kg', costPerUnit: 500, currentStock: 100, reorderLevel: 10, category: 'Food', storageRequirement: 'Chilled', batches: [] },
  { id: 'ing-19', name: 'Wholemeal Flour', unit: 'kg', costPerUnit: 3800, currentStock: 4000, reorderLevel: 500, category: 'Food', storageRequirement: 'Dry/Dark', batches: [] },
  { id: 'ing-20', name: 'Corn Flour', unit: 'kg', costPerUnit: 4200, currentStock: 1200, reorderLevel: 100, category: 'Food', storageRequirement: 'Dry/Dark', batches: [] },

  { id: 'ing-21', name: 'Bread Bags (800g Clear)', unit: 'units', costPerUnit: 85, currentStock: 250000, reorderLevel: 20000, category: 'Packaging', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-22', name: 'Cake Boxes (Large)', unit: 'units', costPerUnit: 1500, currentStock: 2000, reorderLevel: 200, category: 'Packaging', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-23', name: 'Muffin Liners (Paper)', unit: 'units', costPerUnit: 45, currentStock: 50000, reorderLevel: 5000, category: 'Packaging', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-24', name: 'Dispatch Labels (Self-Adhesive)', unit: 'units', costPerUnit: 25, currentStock: 100000, reorderLevel: 10000, category: 'Packaging', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-25', name: 'Plastic Wrap (Industrial Roll)', unit: 'roll', costPerUnit: 65000, currentStock: 80, reorderLevel: 10, category: 'Packaging', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-26', name: 'Pastry Tissue Paper', unit: 'kg', costPerUnit: 7000, currentStock: 300, reorderLevel: 30, category: 'Packaging', storageRequirement: 'Ambient', batches: [] },

  { id: 'ing-7', name: 'Eucalyptus Firewood (Standard Log)', unit: 'units', costPerUnit: 18000, currentStock: 850, reorderLevel: 150, category: 'Fuel', storageRequirement: 'Ambient', batches: [{ id: 'bat-fw-01', quantity: 850, expiryDate: '2028-01-01', receivedDate: '2024-01-01', unitCost: 18000 }] },
  { id: 'ing-27', name: 'Industrial Charcoal (Sack)', unit: 'units', costPerUnit: 45000, currentStock: 120, reorderLevel: 20, category: 'Fuel', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-28', name: 'Diesel Fuel (Backup Gen)', unit: 'l', costPerUnit: 5200, currentStock: 500, reorderLevel: 50, category: 'Fuel', storageRequirement: 'Hazardous', batches: [] },
  { id: 'ing-29', name: 'LPG Gas Cylinder (45kg)', unit: 'units', costPerUnit: 245000, currentStock: 15, reorderLevel: 2, category: 'Fuel', storageRequirement: 'Hazardous', batches: [] },

  { id: 'ing-30', name: 'Food-Grade Degreaser', unit: 'l', costPerUnit: 14000, currentStock: 200, reorderLevel: 20, category: 'Cleaning', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-31', name: 'Liquid Hand Soap', unit: 'l', costPerUnit: 8500, currentStock: 150, reorderLevel: 15, category: 'Cleaning', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-32', name: 'Chlorine Disinfectant', unit: 'l', costPerUnit: 11000, currentStock: 100, reorderLevel: 10, category: 'Cleaning', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-33', name: 'Industrial Scouring Sponges', unit: 'units', costPerUnit: 2500, currentStock: 500, reorderLevel: 50, category: 'Cleaning', storageRequirement: 'Ambient', batches: [] },

  { id: 'ing-34', name: 'Parchment Paper (Baking)', unit: 'roll', costPerUnit: 35000, currentStock: 45, reorderLevel: 5, category: 'Tooling', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-35', name: 'Cake Boards (12-inch)', unit: 'units', costPerUnit: 1200, currentStock: 800, reorderLevel: 100, category: 'Tooling', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-36', name: 'Disposable Piping Bags', unit: 'units', costPerUnit: 350, currentStock: 1500, reorderLevel: 200, category: 'Tooling', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-37', name: 'Latex Gloves (Box of 100)', unit: 'units', costPerUnit: 22000, currentStock: 300, reorderLevel: 30, category: 'Other', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-38', name: 'Hair Nets (Disposable)', unit: 'units', costPerUnit: 250, currentStock: 10000, reorderLevel: 1000, category: 'Other', storageRequirement: 'Ambient', batches: [] },
  { id: 'ing-39', name: 'Lubricant (Machine Grade)', unit: 'l', costPerUnit: 45000, currentStock: 20, reorderLevel: 2, category: 'Other', storageRequirement: 'Hazardous', batches: [] },
  { id: 'ing-40', name: 'Bread Ties (Plastic)', unit: 'roll', costPerUnit: 12000, currentStock: 60, reorderLevel: 5, category: 'Packaging', storageRequirement: 'Ambient', batches: [] }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  { id: 'act-mixing', name: 'Mixing (Machine)', rate: 0, driver: 'Minutes', department: 'Production', energyCategory: 'Electricity' },
  { id: 'act-weighing', name: 'Dough Weighing & Scaling', rate: 0, driver: 'Minutes', department: 'Production', energyCategory: 'Other' },
  { id: 'act-molding-h', name: 'Human Molding (Specialized)', rate: 0, driver: 'Minutes', department: 'Production', energyCategory: 'Other' },
  { id: 'act-molding-m', name: 'Manual Molding (General)', rate: 0, driver: 'Minutes', department: 'Production', energyCategory: 'Other' },
  { id: 'act-proofing', name: 'Proofing (Time)', rate: 0, driver: 'Minutes', department: 'Production', energyCategory: 'Other' },
  { id: 'act-decoration', name: 'Hand Decoration', rate: 0, driver: 'Minutes', department: 'Production', energyCategory: 'Other' },
  { id: 'act-packaging', name: 'Packaging & Labeling', rate: 0, driver: 'Minutes', department: 'Production', energyCategory: 'Other' }
];

const generateInitialSkus = (): SKU[] => {
  const categories = ['Bread', 'Cakes', 'Pastries', 'Savory'];
  const skus: SKU[] = [];
  
  for (let i = 1; i <= 55; i++) {
    const category = categories[i % categories.length];
    const isCake = category === 'Cakes';
    const name = isCake ? `Artisan Cake #${i}` : category === 'Bread' ? `Loaf Style #${i}` : `Treat #${i}`;
    
    skus.push({
      id: `sku-${i}`,
      name: name,
      category: category,
      unit: i % 10 === 0 ? 'Trays' : 'Pcs',
      yield: 120 + (i * 2),
      version: 1,
      recipeItems: [
        { ingredientId: 'ing-1', quantity: 25 + i, unit: 'kg' },
        { ingredientId: 'ing-2', quantity: 2 + (i / 10), unit: 'kg' },
        // Fixed: Removed 'id' property which is not part of the RecipeItem interface
        { ingredientId: 'ing-3', quantity: 500 + (i * 10), unit: 'g' }
      ],
      activities: [
        { activityId: 'act-mixing', quantity: 20 },
        { activityId: 'act-weighing', quantity: 30 },
        { activityId: 'act-molding-m', quantity: 60 },
        { activityId: 'act-packaging', quantity: 45 }
      ],
      factoryPrice: 2000 + (i * 100),
      wholesalePrice: 2500 + (i * 100),
      retailPrice: 3000 + (i * 100),
      targetMargin: 35,
      monthlyVolumeEstimate: 50000 + (i * 1000),
      primaryEnergySource: i % 2 === 0 ? 'Firewood' : 'Electricity',
      isCake: isCake,
      cakeDecorationItems: isCake ? [{ ingredientId: 'ing-10', quantity: 500, unit: 'g' }] : []
    });
  }
  return skus;
};

export const INITIAL_SKUS: SKU[] = generateInitialSkus();

export const INITIAL_ACCOUNT_GROUPS: AccountGroup[] = [
  { id: 'g-utils', name: 'Utilities', subCategories: ['Generator Fuel', 'Water (NWSC)', 'Electricity (Grid)', 'Waste Disposal'] },
  { id: 'g-admin', name: 'Administrative', subCategories: ['Stationery', 'Internet Data', 'Software Licenses', 'Legal Fees'] }
];

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  vatRate: 0.18,
  isVatRegistered: true,
  nssfEmployeeRate: 0.05,
  nssfEmployerRate: 0.10,
  payeThreshold: 235000,
  activeJurisdictions: ['UG_DPA_2019', 'GLOBAL_ISO_9001'],
  aiTransparencyEnabled: true,
  nation: 'Uganda',
  industry: 'Bakery',
  costingMethod: 'ABC'
};

export const INITIAL_OUTLETS = [
  { id: 'out-1', name: 'Factory Shop A', location: 'Industrial Park', type: 'Factory Shop', isSemiIndependent: false },
  { id: 'out-2', name: 'City Center Mall', location: 'Kampala Central', type: 'Retail Shop', isSemiIndependent: true }
];

export const INITIAL_FINISHED_GOODS: FinishedGood[] = INITIAL_SKUS.map(sku => ({
  skuId: sku.id,
  stockLevel: 500,
  reorderLevel: 100,
  lastProductionDate: new Date().toISOString().split('T')[0],
  batches: [
    { id: `bat-fg-${sku.id}-01`, quantity: 250, expiryDate: new Date(Date.now() + 3 * 24 * 3600000).toISOString().split('T')[0], receivedDate: new Date().toISOString().split('T')[0] },
    { id: `bat-fg-${sku.id}-02`, quantity: 250, expiryDate: new Date(Date.now() + 5 * 24 * 3600000).toISOString().split('T')[0], receivedDate: new Date().toISOString().split('T')[0] }
  ]
}));

export const INITIAL_CUSTOMERS = [];
export const INITIAL_ASSETS = [
  { id: 'ast-1', name: 'Rotary Diesel Oven', category: 'Machinery', classification: 'Non-Current', purchaseDate: '2023-05-10', purchasePrice: 45000000, depreciationRate: 15, usefulLifeYears: 10, maintenanceIntervalDays: 90, totalRepairSpend: 0, status: 'Active', capacityPerShift: 1000, primaryEnergySource: 'Diesel (Gen)', activeHoursCounter: 1200 }
];
export const INITIAL_TRANSACTIONS = [];
export const INITIAL_SALES = [];
export const INITIAL_PRODUCTION_LOGS = [];
export const INITIAL_OUTLET_STOCKS = [];
export const INITIAL_INVENTORY_LOSSES = [];
export const INITIAL_ORDERS = [];
export const INITIAL_OVERHEADS = [];
export const INITIAL_SUPPLIERS = [];
export const INITIAL_LOANS = [];
export const INITIAL_SUPPLIER_INVOICES = [];
export const INITIAL_AGENTS = [];

export const TERMS_AND_CONDITIONS = `1. ACCEPTANCE OF TERMS...`;
export const COMPLIANCE_DEFINITIONS: Record<string, { name: string; region: string; clauses: any[] }> = {
  'UG_DPA_2019': { name: 'Data Protection Act 2019', region: 'Uganda', clauses: [] },
  'GLOBAL_ISO_9001': { name: 'ISO 9001:2015', region: 'Global', clauses: [] }
};
export const DISCOUNT_RATE_WACC = 0.12;

export const LAUNCH_CHECKLIST = [
  { id: 'env', phase: 'Environment', task: 'Upload bakery_api.php to web server and verify folder permissions (755).', importance: 'Critical' },
  { id: 'sync', phase: 'Environment', task: 'Connect at least 2 different devices to the Cloud URL and verify real-time sync.', importance: 'Critical' },
  { id: 'data', phase: 'Master Data', task: 'Import real Material Price List (Ingredients) with current market rates.', importance: 'High' },
  { id: 'cost', phase: 'Master Data', task: 'Build core SKU Recipes and verify "Unit COGS" against manual paper records.', importance: 'High' },
  { id: 'over', phase: 'Finance', task: 'Input real monthly overheads (Rent, Power, Water) into the Registry.', importance: 'Medium' },
  { id: 'staff', phase: 'Personnel', task: 'Provision unique accounts for the Production Lead and Cashier.', importance: 'Medium' },
  { id: 'count', phase: 'Go-Live', task: 'Conduct 100% Physical stock take for the "Day 0" cut-over.', importance: 'Critical' }
];

export const HELP_SECTIONS = [
  {
    id: 'strategy',
    title: 'Executive Strategy & Growth',
    icon: '🧠',
    overview: 'This hub governs high-level capital deployment and market positioning. It is designed for the Managing Director to simulate scaling scenarios equivalent to the Ideation case study.',
    content: [
      { tool: 'Intelligence Dashboard', desc: 'Navigate here for a "Single Pane of Glass" view. Logic: Integrates live production logs with sales velocity.' },
      { tool: 'Scaling Simulator', desc: 'Step: Adjust the Volume Multiplier. Logic: Automatically tests if your current Oven/Staff Roster can handle the increased load without bottlenecking.' },
      { tool: 'Strategic Growth Lab', desc: 'Step: Select a "Hero SKU" and adjust the "Ad Spend" slider. Logic: Calculates Net ROI by subtracting CAC from unit contribution margin.' },
      { tool: 'Risk Hub & Resilience', desc: 'Step: Run "AI Risk Audit". Logic: Scans supplier dependencies and aged debt to generate a "Resilience Score" (0-100).' }
    ],
    transactionalDocs: ['Strategic ROI Report', 'Scale Readiness Audit', 'Product Mix Matrix', 'Growth Projection PDF']
  },
  {
    id: 'operations',
    title: 'Operations & Production Floor',
    icon: '🏗️',
    overview: 'Governs the conversion of raw materials into wealth. Replaces paper-based production sheets with a visual Manufacturing Execution System (MES).',
    content: [
      { tool: 'Production Queue (Kanban)', desc: 'Step: Click "Initiate Phase" to move an order from Prep to Bake. Logic: Replaces manual paper routing with real-time digital flow.' },
      { tool: 'Recipe Builder (BOM)', desc: 'Step: Input ingredients in grams/kg. Logic: Automatically calculates "Theoretical Yield" vs "Actual Realized" to detect material theft.' },
      { tool: 'Neural Vision (OCR)', desc: 'Step: Photograph a handwritten shift log. Logic: AI extracts the data and injects it into the production ledger, bypassing manual data entry bottlenecks.' }
    ],
    transactionalDocs: ['Production Job Card', 'Yield Variance Log', 'NCR Report', 'Sanitation Certificate']
  },
  {
    id: 'finance',
    title: 'Finance & Industrial Costing',
    icon: '🏦',
    overview: 'The Brain of the financial system. Moves from basic bookkeeping to advanced ABC Management Accounting.',
    content: [
      { tool: 'Financial Audit (PnL/BS)', desc: 'Step: View "Statement of Position". Logic: Accrual-basis accounting with real-time inventory valuation.' },
      { tool: 'Unit Costing Hub (ABC)', desc: 'Step: Inspect "Absorbed COGS". Logic: Links utility bills (Firewood/Power) directly to the individual price of a single loaf.' },
      { tool: 'Tax & Compliance Registry', desc: 'Step: Check "VAT Position". Logic: Calculates Input vs Output VAT for URA EFRIS audit readiness.' }
    ],
    transactionalDocs: ['Income Statement', 'Balance Sheet', 'Cash Flow Forecast', 'Budget Variance Analysis', 'Tax Schedule']
  }
];
