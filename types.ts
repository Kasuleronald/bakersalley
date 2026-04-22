
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export type DepartmentName = 'Administration' | 'Production' | 'Distribution & Logistics' | 'Quality Assurance' | 'R&D' | 'Sanitation' | 'Welfare' | 'Sales and Marketing' | 'Stores' | 'Finance' | 'SuperAdmin' | 'Security' | 'Board of Directors';
export type CurrencyCode = 'UGX' | 'USD' | 'EUR' | 'KES' | 'GBP';
export type LanguageCode = 'EN' | 'SW' | 'FR' | 'AR';
export type SubscriptionTier = 'Essentials' | 'Pro' | 'Enterprise' | 'Demo';
export type Unit = 'kg' | 'l' | 'ml' | 'g' | 'pc' | 'roll' | 'units' | 'tray' | 'Minutes' | 'Hours';
export type CostingMethod = 'ABC' | 'Standard';
export type StaffCategory = 'Permanent' | 'Contractor' | 'Outsourced/Agency' | 'Day Labor';
export type IngredientCategory = 'Food' | 'Raw Material' | 'Packaging' | 'Cleaning' | 'Fuel' | 'Tooling' | 'Finished Good' | 'Other';
export type StorageCondition = 'Ambient' | 'Chilled' | 'Frozen' | 'Dry/Dark' | 'Hazardous';
export type LossReason = 'Audit Variance' | 'Damage' | 'Theft' | 'Wasted' | 'Expired' | 'Floor Scrap' | 'Reject' | 'Sample' | 'Return' | 'Packaging Waste';
export type DefectCategory = 'Crumb Texture' | 'Crust Color' | 'Shape/Form' | 'Weight Variance' | 'Internal Temp' | 'Contamination' | 'Packaging' | 'Proofing' | 'Under-baked' | 'Over-baked';
export type AccountType = 'Bank' | 'Cash' | 'Mobile Banking' | 'Merchant Settlement' | 'Accounts Receivable' | 'Accounts Payable' | 'Equity' | 'Fixed Assets' | 'Depreciation Expense' | 'Bad Debt Provision';
export type InventoryMovementType = 'Received from Supplier' | 'Issued to Production' | 'Dispatched to Outlet' | 'Stock Count Adjustment' | 'Inter-Branch Transfer' | 'Channel Audit Adjustment';
export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Packed';
export type ApprovalStatus = 'Draft' | 'Pending' | 'Authorized' | 'Rejected' | 'Approved';
export type ForecastScenario = 'Conservative' | 'Expected' | 'Aggressive';
export type PartnerStatus = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
export type OutletType = 'Factory Shop' | 'Wholesale/Distributor' | 'Retail Shop' | 'Van Distribution';
export type ActivityType = 'Call' | 'Meeting' | 'Sample Sent' | 'Site Visit' | 'Email';
export type DeliveryStatus = 'Pending' | 'Awaiting Dispatch' | 'In Transit' | 'Delivered';
export type ConnectionState = 'Online' | 'Offline' | 'Syncing';
export type AllocationMethod = 'Production Volume' | 'Labor Hours' | 'Manual Percentage' | 'Manual weight';
export type PerformanceRating = 1 | 2 | 3 | 4 | 5;
export type AppraisalPeriod = 'H1' | 'FY' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type PaymentMethod = 'Cash' | 'Visa' | 'MasterCard' | 'Mobile Money' | 'Bank Transfer';

export type CRMTab = 'Directory' | 'Assurance' | 'Agents' | 'WholesalePortal' | 'Birthdays' | 'Pipeline' | 'Invoicing' | 'Packing';

export interface AuditLogEntry {
  user: string;
  timestamp: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

export interface SyncPulse {
  lastLocalSave: string;
  lastCloudSync: string;
  pendingChanges: number;
  status: 'Online' | 'Offline';
}

export interface BudgetLine {
  category: string;
  amount: number;
}

export interface FinancialPeriod {
  id: string;
  month: number;
  year: number;
  isClosed: boolean;
  closedBy: string;
  closedAt: string;
}

export interface AuditAnomaly {
  id: string;
  type: string;
  severity: 'High' | 'Medium';
  description: string;
  remedy: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  taxRegistrationNumber?: string;
  primaryLocation: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  deploymentDate: string;
  privateCloudProvider: 'GoogleDrive' | 'S3' | 'LocalHost';
  cloudFileId?: string;
  encryptionKeyHint: string;
}

export interface Transaction {
  id: string;
  date: string;
  account: AccountType;
  type: 'Debit' | 'Credit';
  amount: number;
  description: string;
  category: 'Sale' | 'Expense' | 'Transfer' | 'Adjustment' | 'Journal' | 'Credit Note';
  subCategory?: string;
  referenceId?: string;
  costType?: 'Direct' | 'Indirect' | 'Variable';
  isCleared?: boolean;
  skuId?: string;
  isOcrVerified?: boolean;
  auditLog?: AuditLogEntry[];
  isLocked?: boolean;
  auditRisk?: 'High' | 'Medium' | 'Low'; 
  auditReason?: string;
  merchantFee?: number;
}

export interface Sale {
  id: string;
  skuId: string;
  outletId: string;
  agentId?: string;
  customerId?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
}

export interface OrderItem {
  skuId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  totalPaid: number;
  status: string;
  approvalStatus: string;
  date: string;
  productionLogged: boolean;
  submittedToAdmin: boolean;
  wipStep?: string;
  deliveryDate?: string;
  notes?: string;
  signature?: DigitalSignature;
  isOnlineOrder?: boolean;
  platform?: string;
  deliveryAddress?: string;
  deliveryStatus?: DeliveryStatus;
  deliveryRiderName?: string;
}

export interface Batch {
  id: string;
  quantity: number;
  expiryDate: string;
  receivedDate?: string;
  unitCost?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  costPerUnit: number;
  currentStock: number;
  reorderLevel: number;
  category: string;
  storageRequirement: string;
  batches: Batch[];
  supplierName?: string;
  scientificBrief?: string;
  openingStock?: number;
  conversions?: { unit: string; factor: number }[];
}

export interface SKUVariant {
  id: string;
  name: string;
  weight: number;
  price: number;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface SKU {
  id: string;
  name: string;
  category: string;
  unit: string;
  yield: number;
  version: number;
  recipeItems: RecipeItem[];
  packagingItems?: RecipeItem[];
  activities: { activityId: string; quantity: number }[];
  retailPrice: number;
  factoryPrice: number;
  wholesalePrice: number;
  targetMargin: number;
  monthlyVolumeEstimate: number;
  primaryEnergySource: string;
  isCake?: boolean;
  cakeDecorationItems?: RecipeItem[];
  variants?: SKUVariant[];
  baseDesign?: string;
  targetOvenTemp?: number;
  targetBakeDuration?: number;
  commissionRate?: number;
}

export interface User {
  id: string;
  name: string;
  identity: string;
  passwordHash: string;
  department: DepartmentName;
  role: string;
  mfaEnabled: boolean;
  authorityLimit: number;
  hasConsentedToPrivacy: boolean;
  inviteToken?: string;
  seenFeatures?: string[];
  systemVersion?: string;
}

export interface AuthSession {
  user: User | null;
  token: string | null;
  businessId?: string;
}

export interface MonthlyBudget {
  id: string;
  month: number;
  year: number;
  lines: BudgetLine[];
}

export interface AccountGroup {
  id: string;
  name: string;
  subCategories: string[];
}

export interface LegalClause {
  id: string;
  title: string;
  desc: string;
}

export interface IndustryTerminology {
  skuLabel: string;
  recipeLabel: string;
  ingredientLabel: string;
  productionUnit: string;
  workCenterLabel: string;
  icon: string;
}

export interface QCParameterSpec {
  id: string;
  name: string;
  type: 'Numeric' | 'Selection';
  unit?: string;
  options?: string[];
}

export interface LegalPatch {
  id: string;
  nation: string;
  summary: string;
  newClauses: LegalClause[];
  dateDetected: string;
  status: 'Pending' | 'Applied';
}

export type JurisdictionID = string;

export interface TaxConfig {
  vatRate: number;
  isVatRegistered: boolean;
  nssfEmployeeRate: number;
  nssfEmployerRate: number;
  payeThreshold: number;
  activeJurisdictions: JurisdictionID[];
  aiTransparencyEnabled: boolean;
  nation?: string;
  industry?: IndustryProfile | string;
  costingMethod?: CostingMethod;
  language?: LanguageCode;
  customLegalRegistry?: LegalClause[];
  pendingPatches?: LegalPatch[];
  autoUpdateLegal?: boolean;
  industryStages?: string[];
  industryTerminology?: IndustryTerminology;
  industryQCSpecs?: QCParameterSpec[];
}

export interface ProductionLog {
  id: string;
  skuId: string;
  skuVersion: number;
  roundsProduced: number;
  totalUnitsProduced: number;
  actualYield?: number;
  date: string;
  materialCost?: number;
  energyUsed?: string;
  orderId?: string;
  batchId?: string;
  operatorId?: string;
  startTime?: string;
  endTime?: string;
  machineId?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  classification: string;
  purchaseDate: string;
  purchasePrice: number;
  depreciationRate: number;
  usefulLifeYears: number;
  maintenanceIntervalDays: number;
  totalRepairSpend: number;
  status: string;
  capacityPerShift: number;
  primaryEnergySource: string;
  activeHoursCounter?: number;
  accumulatedDepreciation?: number;
  lastDepreciationDate?: string;
}

export interface Loan {
  id: string;
  source: string;
  principal: number;
  balance: number;
  interestRate: number;
  term: 'Short-term' | 'Long-term' | string;
  startDate: string;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  interestRate?: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: DepartmentName;
  salary: number;
  category: StaffCategory;
  shift: string;
  isActive: boolean;
  joinedDate: string;
  weeklyHoursDedicated: number;
  normalWeeklyHours: number;
  goals: Goal[];
  appraisalHistory: AppraisalRecord[];
  assignments: TaskAllocation[];
  competencies: string[];
  medicalCertExpiry?: string;
  employmentType: 'Permanent' | 'Temporary' | 'Contractor';
  dailyRate?: number;
  agencyName?: string;
}

export interface Activity {
  id: string;
  name: string;
  rate: number;
  driver: string;
  department: DepartmentName;
  energyCategory: EnergyCategory | string;
  backupEnergyCategory?: EnergyCategory | string;
  nightShiftWeight?: number;
  requiredSkills?: string[];
  otherVariableCost?: number;
}

export interface FinishedGood {
  skuId: string;
  stockLevel: number;
  reorderLevel: number;
  lastProductionDate: string;
  batches: Batch[];
}

export type EnergyCategory = 'Firewood' | 'Charcoal' | 'Electricity' | 'Gas' | 'Solar' | 'Diesel (Gen)' | 'Water' | 'Other';

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: GoalPriority;
  status: GoalStatus;
  category: 'Quality' | 'Safety' | 'Efficiency' | 'Growth';
  targetValue?: number;
  actualValue?: number;
  unit?: string;
  createdAt: string;
  achievementScore?: number;
}

export enum GoalStatus {
  Active = 'Active',
  Completed = 'Completed'
}

export enum GoalPriority {
  Critical = 'Critical',
  Important = 'Important',
  Standard = 'Standard'
}

export interface AppraisalRecord {
  id: string;
  period: AppraisalPeriod;
  year: number;
  date: string;
  ratings: {
    reliability: PerformanceRating;
    efficiency: PerformanceRating;
    quality: PerformanceRating;
    teamwork: PerformanceRating;
    safetyAdherence: PerformanceRating;
  };
  overallScore: number;
  managerNotes: string;
  aiCoachingAdvice?: string;
  managerName: string;
  goalsReviewedCount: number;
  goalsCompletedCount: number;
}

export interface InventoryLoss {
  id: string;
  date: string;
  skuId?: string;
  ingredientId?: string;
  quantity: number;
  reason: LossReason | string;
  defectType?: DefectCategory;
  source: string;
  unitCost: number;
  notes?: string;
}

export interface Requisition {
  id: string;
  ingredientId: string;
  supplierId?: string;
  supplierName?: string;
  quantityRequested: number;
  estimatedCost: number;
  status: string;
  date: string;
  signature?: DigitalSignature;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  category: string;
  type: string;
  rating: number;
  isActive: boolean;
  creditLimit: number;
  paymentTerms?: string;
  averageDeliveryTime?: number;
  averageQualityScore?: number;
  averagePriceVariance?: number;
  totalDeliveriesCount?: number;
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  source: string;
  estimatedValue: number;
  stage: OpportunityStage;
  activities: SalesActivity[];
  createdAt: string;
  winProbability?: number;
  aiClosingAdvice?: string;
}

export type OpportunityStage = 'Prospecting' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface SalesActivity {
  id: string;
  type: ActivityType;
  date: string;
  notes: string;
  performedBy: string;
}

export interface IndustryProfile {
  industry: 'Bakery' | 'Other' | string;
}

export interface MarketOpportunity {
  id: string;
  name: string;
  type: 'Event' | 'B2B' | 'Individual' | string;
  potentialValue: number;
  description: string;
  strategicHook: string;
  sourceUrl?: string;
  contactHint?: string;
  relevanceScore: number;
}

export interface ScheduledTask {
  id: string;
  skuId: string;
  skuName: string;
  startTime: string;
  endTime: string;
  resourceId: string;
  status: string;
  temperature: number;
}

export interface WorkCenterResource {
  id: string;
  name: string;
  type: 'Oven' | 'Mixer' | 'Other';
  capacity: number;
}

export interface SalesAgent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  baseCommissionRate: number;
  totalCommissionEarned: number;
  isActive: boolean;
}

export interface ReturnLog {
  id: string;
  date: string;
  skuId: string;
  outletId: string;
  quantity: number;
  reason: 'Stale' | 'Damage' | 'Quality Issue';
  value: number;
}

export interface RMQALog {
  id: string;
  ingredientId: string;
  date: string;
  result: 'Pass' | 'Fail';
  notes?: string;
}

export interface Overhead {
  id: string;
  name: string;
  amount: number;
  type: 'Fixed' | 'Semi-Variable' | 'Variable';
  period: 'Daily' | 'Weekly' | 'Monthly';
  department: DepartmentName;
  activityId?: string;
  skuId?: string;
  variablePercentage?: number;
  energyCategory: EnergyCategory;
  allocationMethod: AllocationMethod;
  allocationValue: number;
  skuWeights: Record<string, number>;
}

export interface MonthlyForecast {
  skuId: string;
  month: number;
  year: number;
  unconstrainedDemand: number;
  plannedSupply: number;
  scenario: ForecastScenario;
  baseDemand: number;
  incrementalDemand: number;
}

export interface DailyOutletForecast {
  id: string;
  outletId: string;
  skuId: string;
  date: string;
  forecastedQty: number;
  confidenceScore?: number;
}

export interface DigitalSignature {
  signerId: string;
  signerName: string;
  signerRole: string;
  timestamp: string;
  authorityHash: string;
}

export interface SensorData {
  id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'Normal' | 'Warning' | 'Critical';
}

export interface GatePass {
  id: string;
  ticketId: string;
  timestamp: string;
  securityPersonnel: string;
  isCleared: boolean;
  vehicleReg: string;
  direction: 'Entry' | 'Exit';
}

export interface WeighbridgeTicket {
  id: string;
  vehicleReg: string;
  driverName: string;
  commodityId: string;
  type: 'Inbound' | 'Outbound';
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  invoicedWeight: number;
  timestampIn: string;
  timestampOut?: string;
  status: 'Pending 2nd Weigh' | 'Completed' | 'Quarantined';
  authorizedBy?: DigitalSignature;
}

export interface InventoryMovement {
  id: string;
  skuId?: string;
  ingredientId?: string;
  type: InventoryMovementType | string;
  quantity: number;
  cost?: number;
  date: string;
  notes?: string;
  destination?: string;
}

export interface Webhook {
  id: string;
  url: string;
  event: 'SALE_CREATED' | 'ORDER_CREATED' | 'LOW_STOCK' | 'PRODUCTION_FINISHED' | 'DELIVERY_DISPATCHED';
  isActive: boolean;
  secret: string;
}

export interface ExternalIntegration {
  id: string;
  name: string;
  type: string;
}

export interface BoardDirective {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  instruction: string;
  priority: 'Strategic' | 'Critical' | 'Operational';
  timestamp: string;
  status: 'Open' | 'Acknowledged' | 'Completed';
  targetDepartment: DepartmentName;
  managementResponse?: string;
  respondedBy?: string;
}

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface CategoryTimePreset {
  category: string;
  activityId: string;
  defaultMinutes: number;
}

export interface JournalLine {
  account: AccountType;
  debit: number;
  credit: number;
  memo: string;
}

export interface BranchTransfer {
  sourceOutletId: string;
  targetOutletId: string;
  skuId: string;
  quantity: number;
}

export interface EfrisStatus {
  lastSync: string;
  pendingInvoices: number;
  isServiceActive: boolean;
  uraEndpointStatus: 'Online' | 'Offline';
}

export interface TroubleshootingLog {
  id: string;
  timestamp: string;
  skuId: string;
  defectDescription: string;
  aiDiagnosis: string;
  remedialActions: string[];
}

export interface StrategicScenario {
  id: string;
  name: string;
  impact: number;
}

export interface SafetyIncident {
  id: string;
  type: string;
  description: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface TaskAllocation {
  id: string;
  type: 'Product' | 'Task';
  targetId: string;
  label: string;
  status: 'Assigned' | 'In Progress' | 'Completed';
  assignedAt: string;
  priority: 'Routine' | 'Urgent';
}

export interface DowntimeEvent {
  id: string;
  assetId: string;
  startTime: string;
  endTime?: string;
  reason: string;
}

export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  date: string;
  description: string;
  cost: number;
  downtimeHours: number;
  type: 'Routine' | 'Breakdown' | 'Upgrade';
}

export interface QCParameters {
  [key: string]: number | string;
}

export interface OptimizationReport {
  sequence: any[];
  projectedEfficiencyGain: number;
  bottleneckAlert: string;
  laborUtilization: number;
}

export interface RiskItem {
  id: string;
  title: string;
  category: string;
  description: string;
  mitigation: string;
}

export interface RiskReport {
  timestamp: string;
  overallScore: number;
  criticalRisks: RiskItem[];
  mitigationStrategy: string;
}

export interface SanitationLog {
  id: string; area: string; performedBy: string; date: string; type: 'Routine' | 'Deep' | 'Incident'; status: 'Verified' | 'Pending'; }

export interface ProductYieldUnit { skuId: string; quantity: number; }

export interface SourcingResilienceReport { criticalShortfalls: { ingredientName: string; riskLevel: 'Critical' | 'Standard'; alternativeSuppliersNeeded: number; }[]; diversificationScore: number; }

export interface Payment { id: string; orderId: string; amount: number; date: string; method: string; }

export interface LeaveApplication { id: string; employeeId: string; startDate: string; endDate: string; status: 'Pending' | 'Approved' | 'Rejected'; }

export interface BakeryDocument { id: string; title: string; category: DocCategory; department: DepartmentName; sharedWith?: string[]; }

export type DocCategory = 'Financial' | 'Operational' | 'Compliance' | 'Personnel' | 'Recipe' | 'Logistics' | 'HACCP' | 'UNBS/ISO' | 'Technical' | 'ISO' | 'Gate Control';

export interface Customer { id: string; name: string; phone: string; email?: string; address?: string; type: 'Individual' | 'Wholesale' | 'Corporate'; balance: number; creditLimit: number; customPrices: Record<string, number>; birthDate?: string; anniversaryDate?: string; partnerStatus?: PartnerStatus; aiGrowthDirectives?: string; aiFollowUpActions?: string; }

export interface Outlet { id: string; name: string; location: string; type: OutletType | string; isSemiIndependent: boolean; }

export interface OutletStock { outletId: string; skuId: string; stockLevel: number; }

export interface PredictiveMaintenanceReport { assetId: string; predictedFailureDate: string; confidence: number; maintenanceType: string; estimatedCost: number; }

export interface QALog { id: string; skuId: string; responsiblePersonnelId: string; date: string; result: 'Pass' | 'Fail'; defectType?: DefectCategory; parameters: QCParameters; notes?: string; ncrDetails?: { rootCause: string; disposition: string; actionTaken: string; }; }
