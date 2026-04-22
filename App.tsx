
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './Layout';
import { 
  SKU, Ingredient, Activity, Overhead, Employee, Transaction, Sale, 
  ProductionLog, FinishedGood, Order, Customer, InventoryLoss, AccountGroup, 
  User, AuthSession, MonthlyForecast, DailyOutletForecast, Outlet, OutletStock, 
  Payment, LeaveApplication, Webhook, ExternalIntegration, SubscriptionTier, CurrencyCode,
  Requisition, Loan, SupplierInvoice, Asset, MonthlyBudget, Supplier, WeighbridgeTicket, GatePass, LanguageCode, InventoryMovement,
  QALog, RMQALog, SalesAgent, TaxConfig, BoardDirective, EnergyCategory, Lead, DefectCategory, BusinessProfile
} from './types';
import { 
  INITIAL_USERS, INITIAL_EMPLOYEES, INITIAL_INGREDIENTS, INITIAL_SKUS, 
  INITIAL_OUTLETS, INITIAL_CUSTOMERS, INITIAL_ASSETS, INITIAL_TRANSACTIONS, 
  INITIAL_SALES, INITIAL_PRODUCTION_LOGS, INITIAL_FINISHED_GOODS, 
  INITIAL_OUTLET_STOCKS, INITIAL_INVENTORY_LOSSES, INITIAL_ORDERS, 
  INITIAL_ACTIVITIES, INITIAL_OVERHEADS, INITIAL_SUPPLIERS, INITIAL_LOANS, 
  INITIAL_SUPPLIER_INVOICES, DEFAULT_TAX_CONFIG, INITIAL_AGENTS, INITIAL_ACCOUNT_GROUPS, SYSTEM_CHANGELOG
} from './constants';

import Dashboard from './components/Dashboard';
import RecipeBuilder from './components/RecipeBuilder';
import StoresManager from './components/StoresManager';
import DailyOperations from './components/DailyOperations';
import HumanCapitalManager from './components/HumanCapitalManager';
import SalesManager from './components/SalesManager';
import SourcingDemandCenter from './components/SourcingDemandCenter';
import ManagementAccountant from './components/ManagementAccountant';
import VisualScheduler from './components/VisualScheduler';
import SettingsHub from './components/SettingsHub';
import UnifiedCRMHub from './components/UnifiedCRMHub';
import StrategicGrowthCenter from './components/StrategicGrowthCenter';
import MediaHub from './components/MediaHub';
import DebtManager from './components/DebtManager';
import CreditorManager from './components/CreditorManager';
import BankingManager from './components/BankingManager';
import WeighbridgeHub from './components/WeighbridgeHub';
import LogisticsHub from './components/LogisticsHub';
import WasteManager from './components/WasteManager';
import NeuralHub from './components/NeuralHub';
import QualityAssurance from './components/QualityAssurance';
import GlobalSearch from './components/GlobalSearch';
import FeatureUpdatePortal from './components/FeatureUpdatePortal';
import SupportAssistant from './components/SupportAssistant';
import { bakeryService } from './services/bakeryService';
import { apiClient } from './services/apiClient';

const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession>({ user: INITIAL_USERS[0], token: 'fake' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('UGX');
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>('EN');
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('Enterprise');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFeaturePortal, setShowFeaturePortal] = useState(false);

  // SaaS Multitenancy Profile
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    id: 'BAK-8821-UG',
    name: 'Industrial Bakery Elite',
    primaryLocation: 'Kampala',
    address: 'Plot 12, Industrial Area, Kampala',
    phone: '+256 700 000 000',
    email: 'ops@elitebakery.ug',
    deploymentDate: new Date().toISOString(),
    privateCloudProvider: 'GoogleDrive',
    encryptionKeyHint: 'Sovereign Master Pass'
  });

  const [skus, setSkus] = useState<SKU[]>(INITIAL_SKUS);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [overheads, setOverheads] = useState<Overhead[]>(INITIAL_OVERHEADS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>(INITIAL_PRODUCTION_LOGS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>(INITIAL_FINISHED_GOODS);
  const [outlets, setOutlets] = useState<Outlet[]>(INITIAL_OUTLETS);
  const [outletStocks, setOutletStocks] = useState<OutletStock[]>(INITIAL_OUTLET_STOCKS);
  const [inventoryLosses, setInventoryLosses] = useState<InventoryLoss[]>(INITIAL_INVENTORY_LOSSES);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>(INITIAL_SUPPLIER_INVOICES);
  const [forecasts, setForecasts] = useState<MonthlyForecast[]>([]);
  const [outletForecasts, setOutletForecasts] = useState<DailyOutletForecast[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>(INITIAL_ACCOUNT_GROUPS);
  const [wbTickets, setWbTickets] = useState<WeighbridgeTicket[]>([]);
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [agents, setAgents] = useState<SalesAgent[]>(INITIAL_AGENTS);
  const [directives, setBoardDirectives] = useState<BoardDirective[]>([]);
  const [qaLogs, setQaLogs] = useState<QALog[]>([]);
  const [rmQaLogs, setRmQaLogs] = useState<RMQALog[]>([]);
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(DEFAULT_TAX_CONFIG);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const init = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
      const db = await apiClient.getDb();
      if (db && Object.keys(db).length > 0) {
        if (db.taxConfig) setTaxConfig(db.taxConfig);
        if (db.skus) setSkus(db.skus);
        if (db.ingredients) setIngredients(db.ingredients);
        if (db.activities) setActivities(db.activities);
        if (db.overheads) setOverheads(db.overheads);
        if (db.employees) setEmployees(db.employees);
        if (db.transactions) setTransactions(db.transactions);
        if (db.productionLogs) setProductionLogs(db.productionLogs);
        if (db.sales) setSales(db.sales);
        if (db.customers) setCustomers(db.customers);
        if (db.orders) setOrders(db.orders);
        if (db.finishedGoods) setFinishedGoods(db.finishedGoods);
        if (db.outlets) setOutlets(db.outlets);
        if (db.outletStocks) setOutletStocks(db.outletStocks);
        if (db.inventoryLosses) setInventoryLosses(db.inventoryLosses);
        if (db.requisitions) setRequisitions(db.requisitions);
        if (db.loans) setLoans(db.loans);
        if (db.invoices) setInvoices(db.invoices);
        if (db.forecasts) setForecasts(db.forecasts);
        if (db.outletForecasts) setOutletForecasts(db.outletForecasts);
        if (db.movements) setMovements(db.movements);
        if (db.assets) setAssets(db.assets);
        if (db.suppliers) setSuppliers(db.suppliers);
        if (db.budgets) setBudgets(db.budgets);
        if (db.accountGroups) setAccountGroups(db.accountGroups);
        if (db.wbTickets) setWbTickets(db.wbTickets);
        if (db.gatePasses) setGatePasses(db.gatePasses);
        if (db.users) setUsers(db.users);
        if (db.agents) setAgents(db.agents);
        if (db.directives) setBoardDirectives(db.directives);
        if (db.qaLogs) setQaLogs(db.qaLogs);
        if (db.rmQaLogs) setRmQaLogs(db.rmQaLogs);
        if (db.payments) setPayments(db.payments);
        if (db.leaveApplications) setLeaveApplications(db.leaveApplications);
        if (db.leads) setLeads(db.leads);
        if (db.businessProfile) setBusinessProfile(db.businessProfile);
      }
    };
    init();
  }, []);

  // Detect New Features for Registered Users
  useEffect(() => {
    if (session.user) {
        const userSeen = session.user.seenFeatures || [];
        const hasNew = SYSTEM_CHANGELOG.some(f => !userSeen.includes(f.id));
        if (hasNew) setShowFeaturePortal(true);
    }
  }, [session.user]);

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!session.user) return;
    const updatedUser = { ...session.user, ...updates };
    setSession({ ...session, user: updatedUser });
    setUsers(users.map(u => u.id === session.user?.id ? updatedUser : u));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); 
    }
  };

  useEffect(() => {
    const saveData = async () => {
      const fullState = {
        taxConfig, skus, ingredients, activities, overheads, employees,
        transactions, productionLogs, sales, customers, orders,
        finishedGoods, outletStocks, inventoryLosses,
        requisitions, loans, invoices, forecasts, outletForecasts,
        movements, assets, suppliers, budgets, accountGroups,
        wbTickets, gatePasses, users, agents, directives,
        qaLogs, rmQaLogs, payments, leaveApplications, leads, businessProfile
      };
      await apiClient.saveDb(fullState);
    };
    const debounceSave = setTimeout(saveData, 1500);
    return () => clearTimeout(debounceSave);
  }, [
    taxConfig, skus, ingredients, activities, overheads, employees,
    transactions, productionLogs, sales, customers, orders,
    finishedGoods, outletStocks, inventoryLosses,
    requisitions, loans, invoices, forecasts, outletForecasts,
    movements, assets, suppliers, budgets, accountGroups,
    wbTickets, gatePasses, users, agents, qaLogs, rmQaLogs, payments, leaveApplications, leads, businessProfile
  ]);

  const currencyConfig = {
    active: activeCurrency,
    format: (v: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: activeCurrency }).format(v),
    formatCompact: (v: number) => new Intl.NumberFormat('en-UG', { notation: 'compact', compactDisplay: 'short' }).format(v)
  };

  const handleLogProduction = async (log: ProductionLog, defects?: { type: DefectCategory, qty: number }[]) => {
    try {
      const result = await bakeryService.finalizeProductionBatch({
        skuId: log.skuId,
        rounds: log.roundsProduced,
        actualYield: log.actualYield || log.totalUnitsProduced,
        damagedUnits: 0,
        packagingRejects: 0,
        lossReason: 'Floor Scrap',
        date: log.date,
        orderId: log.orderId,
        energySource: log.energyUsed as EnergyCategory
      });
      
      if (result) {
        setIngredients(result.ingredients);
        setFinishedGoods(result.finishedGoods);
        setMovements(result.movements);
        
        if (defects && defects.length > 0) {
            const sku = skus.find(s => s.id === log.skuId);
            const newLosses: InventoryLoss[] = defects.map(d => ({
                id: `defect-${Date.now()}-${Math.random()}`,
                date: log.date,
                skuId: log.skuId,
                quantity: d.qty,
                reason: 'Defect',
                defectType: d.type,
                source: 'Production Sealing',
                unitCost: sku?.factoryPrice || 0,
                notes: `Identified on Shift`
            }));
            
            const newQaLogs: QALog[] = defects.map(d => ({
                id: `qa-${Date.now()}-${Math.random()}`,
                skuId: log.skuId,
                responsiblePersonnelId: log.operatorId || 'Floor Supervisor',
                date: log.date,
                result: 'Fail',
                defectType: d.type,
                parameters: {},
                notes: `Defect logged during sealing`
            }));

            setInventoryLosses([...newLosses, ...result.inventoryLosses]);
            setQaLogs([...newQaLogs, ...qaLogs]);
        } else {
            setInventoryLosses(result.inventoryLosses);
        }

        setTransactions(result.transactions);
        setProductionLogs(result.productionLogs);
        setOrders(result.orders);
        alert("Batch Sealed. Reconciled across ledgers.");
      }
    } catch (e) {
      console.error(e);
      alert("Ledger update failed.");
    }
  };

  const commonProps = {
    skus, setSkus, ingredients, setIngredients, activities, setActivities, overheads, setOverheads,
    employees, setEmployees, transactions, setTransactions, productionLogs, setProductionLogs, sales, setSales,
    customers, setCustomers, orders, setOrders, finishedGoods, setFinishedGoods, outlets, setOutlets,
    outletStocks, setOutletStocks, inventoryLosses, setInventoryLosses, requisitions, setRequisitions,
    loans, setLoans, invoices, setInvoices, forecasts, setForecasts, outletForecasts, setOutletForecasts,
    taxConfig, setTaxConfig, currency: currencyConfig, currentUser: session.user!, movements, setMovements,
    assets, setAssets, subscriptionTier, setSubscriptionTier, suppliers, setSuppliers, session, budgets, setBudgets, accountGroups, setAccountGroups,
    tickets: wbTickets, setTickets: setWbTickets, gatePasses, setGatePasses,
    activeLanguage, agents, setAgents,
    rmQaLogs, qaLogs, setQaLogs, directives, setBoardDirectives,
    payments, setPayments, leaveApplications, setLeaveApplications, leads, setLeads,
    businessProfile, setBusinessProfile,
    onLogProduction: handleLogProduction,
    allState: {
      taxConfig, skus, ingredients, activities, overheads, employees,
      transactions, productionLogs, sales, customers, orders,
      finishedGoods, outletStocks, inventoryLosses,
      requisitions, loans, invoices, forecasts, outletForecasts,
      movements, assets, suppliers, budgets, accountGroups,
      wbTickets, gatePasses, users, agents, qaLogs, rmQaLogs, payments, leaveApplications, leads, businessProfile
    },
    onImportData: (data: any) => {
        if (data.taxConfig) setTaxConfig(data.taxConfig);
        if (data.skus) setSkus(data.skus);
        if (data.ingredients) setIngredients(data.ingredients);
        if (data.employees) setEmployees(data.employees);
        if (data.transactions) setTransactions(data.transactions);
        if (data.productionLogs) setProductionLogs(data.productionLogs);
        if (data.sales) setSales(data.sales);
        if (data.customers) setCustomers(data.customers);
        if (data.orders) setOrders(data.orders);
        if (data.finishedGoods) setFinishedGoods(data.finishedGoods);
        if (data.outlets) setOutlets(data.outlets);
        if (data.outletStocks) setOutletStocks(data.outletStocks);
        if (data.inventoryLosses) setInventoryLosses(data.inventoryLosses);
        if (data.businessProfile) setBusinessProfile(data.businessProfile);
    }
  };

  const renderContent = () => {
    if (!hasApiKey) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-fadeIn">
          <div className="w-24 h-24 bg-indigo-900 text-amber-400 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl">🔑</div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-serif text-slate-900 uppercase">SaaS Deployment Activation</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Please activate your subscription layer by selecting a valid strategic API key.
            </p>
          </div>
          <button 
            onClick={handleSelectKey}
            className="px-12 py-5 bg-indigo-900 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
          >
            Select Strategic Key
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard cashOnHand={1000000} totalRevenue={5000000} currency={currencyConfig} onNavigate={setActiveTab} activeLanguage={activeLanguage} />;
      case 'mgmt-accountant': return <ManagementAccountant {...commonProps} />;
      case 'debtors': return <DebtManager {...commonProps} />;
      case 'creditors': return <CreditorManager {...commonProps} />;
      case 'banking': return <BankingManager {...commonProps} />;
      case 'weighbridge': return <WeighbridgeHub {...commonProps} />;
      case 'logistics': return <LogisticsHub {...commonProps} />;
      case 'waste-hub': return <WasteManager {...commonProps} />;
      case 'media-hub': return <MediaHub {...commonProps} location={taxConfig.nation} nation={taxConfig.nation} />;
      case 'stores': return <StoresManager {...commonProps} />;
      case 'snop': return <DailyOperations {...commonProps} dailyTasks={[]} setDailyTasks={() => {}} />;
      case 'pc': return <HumanCapitalManager {...commonProps} initialTab="Staff" />;
      case 'payroll': return <HumanCapitalManager {...commonProps} initialTab="Payroll" />;
      case 'sales': return <SalesManager {...commonProps} />;
      case 'customers': return <UnifiedCRMHub {...commonProps} onCommitToProduction={() => {}} onNavigate={setActiveTab} />;
      case 'scheduler': return <VisualScheduler orders={orders} skus={skus} currency={currencyConfig} />;
      case 'strategic-growth': return <StrategicGrowthCenter {...commonProps} />;
      case 'settings': return <SettingsHub {...commonProps} activeCurrency={activeCurrency} setActiveCurrency={setActiveCurrency} onNavigate={setActiveTab} />;
      case 'sourcing-demand': return <SourcingDemandCenter {...commonProps} />;
      case 'master-data': return <RecipeBuilder {...commonProps} />;
      case 'qa': return <QualityAssurance {...commonProps} />;
      case 'support': return <SupportAssistant {...commonProps} />;
      case 'neural-hub': return <NeuralHub {...commonProps} onNavigate={setActiveTab} />;
      default: return <Dashboard cashOnHand={0} totalRevenue={0} currency={currencyConfig} onNavigate={setActiveTab} activeLanguage={activeLanguage} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} setActiveTab={setActiveTab} session={session} onLogout={() => setSession({ user: null, token: null })} onOpenSearch={() => setIsSearchOpen(true)} 
      activeCurrency={activeCurrency} setActiveCurrency={setActiveCurrency} subscriptionTier={subscriptionTier}
      activeLanguage={activeLanguage}
    >
      {renderContent()}
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        skus={skus} 
        ingredients={ingredients} 
        onNavigate={(tab) => { setActiveTab(tab); setIsSearchOpen(false); }}
        location={taxConfig.nation}
      />
      {showFeaturePortal && session.user && (
        <FeatureUpdatePortal 
          user={session.user} 
          onUpdateUser={handleUpdateUser} 
          onClose={() => setShowFeaturePortal(false)} 
        />
      )}
    </Layout>
  );
};

export default App;
