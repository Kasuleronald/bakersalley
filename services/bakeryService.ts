import { apiClient } from './apiClient';
import { syncService } from './syncService';
import { getConversionFactor } from '../utils/conversionUtils';
import { 
  SKU, Ingredient, ProductionLog, InventoryMovement, 
  Transaction, FinishedGood, Batch, InventoryLoss, LossReason, Order, EnergyCategory
} from '../types';

const MATERIAL_WASTE_FACTOR = 1.08; // Industrial standard 8%

export const bakeryService = {
  async fetchAllData() {
    return await apiClient.getDb();
  },

  /**
   * Atomic Production Batch Finalization
   * Deducts RM (with FEFO batch deduction), Adds FG, Logs COGS, and Records Losses.
   */
  async finalizeProductionBatch(params: {
    skuId: string;
    rounds: number;
    actualYield: number;
    damagedUnits: number;
    packagingRejects: number;
    lossReason: LossReason;
    date: string;
    orderId?: string;
    energySource?: EnergyCategory;
  }) {
    const db = await apiClient.getDb();
    const sku = (db.skus as SKU[]).find(s => s.id === params.skuId);
    if (!sku) throw new Error("SKU not found");

    const date = params.date || new Date().toISOString().split('T')[0];
    
    // 1. Calculate Material Consumption with FEFO Batch Logic
    let totalMaterialCost = 0;
    const ingredients = [...(db.ingredients as Ingredient[])];
    const movements = [...(db.movements as InventoryMovement[])];

    sku.recipeItems.forEach(ri => {
      const ingIdx = ingredients.findIndex(i => i.id === ri.ingredientId);
      if (ingIdx === -1) return;
      
      const ing = { ...ingredients[ingIdx] };
      const factor = getConversionFactor(ing, ri.unit);
      const qtyToConsume = ri.quantity * factor * params.rounds * MATERIAL_WASTE_FACTOR;
      const cost = qtyToConsume * ing.costPerUnit;
      
      totalMaterialCost += cost;

      // --- FEFO BATCH DEDUCTION LOGIC ---
      let remainingToDeduct = qtyToConsume;
      const sortedBatches = [...(ing.batches || [])].sort((a, b) => 
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );

      const updatedBatches = sortedBatches.map(batch => {
        if (remainingToDeduct <= 0) return batch;
        const deduction = Math.min(batch.quantity, remainingToDeduct);
        remainingToDeduct -= deduction;
        return { ...batch, quantity: batch.quantity - deduction };
      }).filter(batch => batch.quantity > 0);

      ing.batches = updatedBatches;
      ing.currentStock = Math.max(0, ing.currentStock - qtyToConsume);
      ingredients[ingIdx] = ing;
      
      movements.unshift({
        id: `mov-rm-${Date.now()}-${ing.id}`,
        ingredientId: ing.id,
        type: 'Issued to Production',
        quantity: qtyToConsume,
        cost,
        date,
        notes: `FEFO batch deduction for ${sku.name}`
      });
    });

    // 2. Update Finished Goods
    const finishedGoods = [...(db.finishedGoods || []) as FinishedGood[]];
    const fgIdx = finishedGoods.findIndex(f => f.skuId === params.skuId);
    const batchId = `batch-${Date.now()}`;
    const newBatch: Batch = {
      id: batchId,
      quantity: params.actualYield,
      receivedDate: date,
      expiryDate: new Date(new Date(date).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    if (fgIdx > -1) {
      finishedGoods[fgIdx].stockLevel += params.actualYield;
      finishedGoods[fgIdx].batches.unshift(newBatch);
      finishedGoods[fgIdx].lastProductionDate = date;
    } else {
      finishedGoods.push({
        skuId: params.skuId,
        stockLevel: params.actualYield,
        reorderLevel: 20,
        lastProductionDate: date,
        batches: [newBatch]
      });
    }

    // 3. Account for Damages
    const losses = [...(db.inventoryLosses || []) as InventoryLoss[]];
    if (params.damagedUnits > 0) {
      losses.unshift({
        id: `loss-dmg-${Date.now()}`,
        date,
        skuId: params.skuId,
        quantity: params.damagedUnits,
        reason: params.lossReason,
        source: 'Production Floor',
        unitCost: sku.factoryPrice,
        notes: `Loss during ${params.energySource || 'Production'}`
      });
    }

    // 4. Record Manufacturing Transaction (Attributed to Energy Source)
    const transactions = [...(db.transactions || []) as Transaction[]];
    transactions.unshift({
      id: `tx-prod-${Date.now()}`,
      date,
      account: 'Cash',
      type: 'Debit',
      amount: totalMaterialCost,
      description: `Batch production (${params.energySource || 'Standard'}): ${params.actualYield}x ${sku.name}`,
      category: 'Expense',
      subCategory: 'Production Cost',
      costType: 'Direct',
      skuId: params.skuId
    });

    // 5. Update Order Status
    const orders = [...(db.orders || []) as Order[]];
    if (params.orderId) {
      const oIdx = orders.findIndex(o => o.id === params.orderId);
      if (oIdx > -1) {
        orders[oIdx].productionLogged = true;
        orders[oIdx].status = 'Completed';
        orders[oIdx].wipStep = 'Ready';
      }
    }

    // 6. Save State
    const productionLogs = [...(db.productionLogs || []) as ProductionLog[]];
    productionLogs.unshift({
      id: `log-${Date.now()}`,
      skuId: params.skuId,
      skuVersion: sku.version,
      roundsProduced: params.rounds,
      totalUnitsProduced: params.rounds * sku.yield,
      actualYield: params.actualYield,
      date,
      energyUsed: params.energySource,
      orderId: params.orderId,
      batchId,
      materialCost: totalMaterialCost
    });

    const newState = { 
      ingredients, 
      finishedGoods, 
      movements, 
      inventoryLosses: losses, 
      transactions, 
      productionLogs, 
      orders 
    };
    await apiClient.saveDb(newState);
    syncService.broadcast('STATE_UPDATE', newState);
    return newState;
  }
};