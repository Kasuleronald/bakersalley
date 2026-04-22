import { SKU, Ingredient, Activity, Overhead, Employee, Sale, Transaction, FinishedGood, Order, Customer, Asset, Loan, SupplierInvoice, ProductionLog, InventoryLoss } from '../types';
import { getConversionFactor } from '../utils/conversionUtils';

const MATERIAL_WASTE_FACTOR = 1.08; 
const PRODUCTION_DAYS_PER_MONTH = 26;

export const financialEngine = {
  /**
   * Calculates the full financial ratio suite with emphasis on Bakers Ratios and CCC
   */
  calculateRatioIntelligence: (params: {
    ingredients: Ingredient[];
    finishedGoods: FinishedGood[];
    skus: SKU[];
    sales: Sale[];
    transactions: Transaction[];
    employees: Employee[];
    overheads: Overhead[];
    customers: Customer[];
    orders: Order[];
    assets: Asset[];
    loans: Loan[];
    invoices: SupplierInvoice[];
    productionLogs: ProductionLog[];
    inventoryLosses: InventoryLoss[];
  }) => {
    const { 
      ingredients, finishedGoods, skus, sales, transactions, 
      employees, overheads, customers, orders, assets, 
      loans, invoices, productionLogs, inventoryLosses 
    } = params;

    // 1. VALUATION BASICS
    const cashBalance = transactions.reduce((s, t) => t.type === 'Credit' ? s + t.amount : s - t.amount, 0);
    const rmValue = ingredients.reduce((s, i) => s + (i.currentStock * i.costPerUnit), 0);
    const fgValue = finishedGoods.reduce((s, f) => {
      const sku = skus.find(x => x.id === f.skuId);
      return s + (f.stockLevel * (sku?.factoryPrice || 0));
    }, 0);
    
    const arValue = orders.reduce((s, o) => o.status !== 'Completed' ? s + (o.totalPrice - o.totalPaid) : s, 0);
    const inventoryTotalValue = rmValue + fgValue;
    const fixedAssetValue = assets.reduce((s, a) => s + a.purchasePrice, 0);
    const currentAssets = cashBalance + rmValue + fgValue + arValue;
    const totalAssets = currentAssets + fixedAssetValue;

    // 2. LIABILITY & RESERVES
    const apValue = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    const loanDebt = loans.reduce((s, l) => s + l.balance, 0);
    const totalLaborCost = employees.filter(e => e.isActive).reduce((s, e) => {
      const monthly = e.employmentType === 'Permanent' ? e.salary : (e.dailyRate || 0) * PRODUCTION_DAYS_PER_MONTH;
      return s + monthly;
    }, 0);
    
    const totalLiabilities = apValue + loanDebt;
    const currentLiabilities = apValue + (totalLaborCost * 0.15) + 1000000; 

    // 3. PERFORMANCE & RESERVES
    const totalRevenue = sales.reduce((s, x) => s + x.totalPrice, 0);
    const avgMonthlyRevenue = totalRevenue > 0 ? totalRevenue / Math.max(1, (new Date().getMonth() + 1)) : 0;
    const savingsReserveTotal = totalRevenue * 0.10;

    // 4. INCOME & COGS
    let cogs = 0;
    productionLogs.forEach(log => {
      const sku = skus.find(s => s.id === log.skuId);
      if (!sku) return;
      sku.recipeItems.forEach(item => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        if (!ing) return;
        const factor = getConversionFactor(ing, item.unit);
        cogs += (ing.costPerUnit * (item.quantity * factor * log.roundsProduced)) * 1.08;
      });
    });
    const avgDailyCogs = cogs / 30 || 1;

    // 5. CASH CONVERSION CYCLE (CCC) PILLARS
    const dso = totalRevenue > 0 ? (arValue / totalRevenue) * 30 : 0;
    const dsi = avgDailyCogs > 0 ? inventoryTotalValue / avgDailyCogs : 0;
    const dpo = cogs > 0 ? (apValue / cogs) * 30 : 0;
    const ccc = dso + dsi - dpo;

    // 6. PROFITABILITY
    const fixedCostsMonthly = overheads.reduce((sum, oh) => {
      const mult = oh.period === 'Weekly' ? 4.33 : oh.period === 'Daily' ? 26 : 1;
      return sum + (oh.amount * mult);
    }, 0) + totalLaborCost;
    const netIncome = totalRevenue - cogs - fixedCostsMonthly;

    // 7. BAKERS RATIOS
    const totalActualYield = productionLogs.reduce((s, l) => s + (l.actualYield || l.totalUnitsProduced), 0);
    const totalTheoreticalTarget = productionLogs.reduce((s, l) => s + l.totalUnitsProduced, 0);
    const yieldEfficiency = totalTheoreticalTarget > 0 ? (totalActualYield / totalTheoreticalTarget) * 100 : 0;
    
    const totalLostUnits = inventoryLosses.reduce((s, l) => s + l.quantity, 0);
    const floorScrapRatio = totalActualYield > 0 ? (totalLostUnits / totalActualYield) * 100 : 0;

    return {
      liquidity: {
        currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
        quickRatio: currentLiabilities > 0 ? (currentAssets - inventoryTotalValue) / currentLiabilities : 0,
        netWorkingCapital: currentAssets - currentLiabilities,
      },
      // Fixed: Added missing leverage metrics
      leverage: {
        debtToEquity: (totalAssets - totalLiabilities) !== 0 ? totalLiabilities / (totalAssets - totalLiabilities) : 0
      },
      reserves: {
        totalSavings: savingsReserveTotal,
        availableCashAfterSavings: cashBalance - savingsReserveTotal
      },
      cashCycle: {
        dso,
        dsi,
        dpo,
        ccc,
        dailyBurn: avgDailyCogs + (fixedCostsMonthly / 30)
      },
      profitability: {
        roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
        netMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
      },
      bakersRatios: {
        yieldEfficiency,
        floorScrapRatio,
        laborBurden: totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0
      }
    };
  }
};
