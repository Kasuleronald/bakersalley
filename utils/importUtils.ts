import { Ingredient, Unit, Activity, FinishedGood, Supplier } from '../types';

export const parseIngredientCSV = (csvText: string): Partial<Ingredient>[] => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const ingredients: Partial<Ingredient>[] = [];

  const findIdx = (possibleNames: string[]) => 
    headers.findIndex(h => possibleNames.includes(h.replace(/[\s_]/g, '')));

  const nameIdx = findIdx(['name', 'ingredient', 'input', 'material']);
  const unitIdx = findIdx(['unit', 'uom', 'measure']);
  const costIdx = findIdx(['costperunit', 'unitcost', 'priceperunit', 'rate', 'cost', 'price']);
  const reorderIdx = findIdx(['reorder', 'reorderlevel', 'minstock']);
  const stockIdx = findIdx(['stock', 'currentstock', 'qty', 'quantity']);
  const categoryIdx = findIdx(['category', 'type', 'group']);

  if (nameIdx === -1) {
    console.error("CSV must contain at least a 'Name' column.");
    return [];
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
    
    const name = values[nameIdx];
    if (!name) continue; 

    const unit = (unitIdx !== -1 && values[unitIdx] ? values[unitIdx] : 'kg') as Unit;
    const cost = costIdx !== -1 ? parseFloat(values[costIdx]?.replace(/[^\d.-]/g, '') || '0') : 0;
    const reorder = reorderIdx !== -1 ? parseFloat(values[reorderIdx]?.replace(/[^\d.-]/g, '') || '0') : 0;
    const stock = stockIdx !== -1 ? parseFloat(values[stockIdx]?.replace(/[^\d.-]/g, '') || '0') : 0;
    const category = categoryIdx !== -1 ? values[categoryIdx] : 'Food';

    ingredients.push({
      name,
      unit,
      costPerUnit: isNaN(cost) ? 0 : cost,
      reorderLevel: isNaN(reorder) ? 0 : reorder,
      currentStock: isNaN(stock) ? 0 : stock,
      category: category as any
    });
  }

  return ingredients;
};

/**
 * Robust Supplier CSV Parser with intelligent column mapping
 */
export const parseSupplierCSV = (csvText: string): Partial<Supplier>[] => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const suppliers: Partial<Supplier>[] = [];

  const findIdx = (possibleNames: string[]) => 
    headers.findIndex(h => possibleNames.includes(h.replace(/[\s_]/g, '').replace(/[^a-z]/g, '')));

  // Field Mapping Aliases
  const nameIdx = findIdx(['name', 'supplier', 'vendor', 'business', 'company', 'entity']);
  const phoneIdx = findIdx(['phone', 'contact', 'telephone', 'mobile', 'tel', 'phone1']);
  const contactPersonIdx = findIdx(['contactperson', 'person', 'manager', 'rep', 'attention', 'primarycontact']);
  const emailIdx = findIdx(['email', 'mail', 'emailaddress']);
  const addressIdx = findIdx(['address', 'location', 'hq', 'office']);
  const categoryIdx = findIdx(['category', 'group', 'industry', 'primarycategory']);
  const typeIdx = findIdx(['type', 'class', 'tier', 'suppliertype']);
  const ratingIdx = findIdx(['rating', 'score', 'rank', 'performance', 'stars']);
  const creditLimitIdx = findIdx(['creditlimit', 'limit', 'credit', 'maxcredit']);
  
  // Performance Metric Aliases
  const deliveryTimeIdx = findIdx(['leadtime', 'deliverytime', 'avgdelivery', 'days', 'deliveryperformance']);
  const qualityScoreIdx = findIdx(['qualityscore', 'avgquality', 'qcscore', 'qualityrating']);
  const priceVarianceIdx = findIdx(['pricevariance', 'variance', 'ppv', 'costvariance']);
  const countIdx = findIdx(['deliveriescount', 'totaldeliveries', 'history', 'ordercount']);

  if (nameIdx === -1) {
    console.error("Supplier CSV is missing a mandatory 'Name' or 'Supplier' column.");
    return [];
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
    
    const name = values[nameIdx];
    if (!name) continue;

    const catValue = categoryIdx !== -1 ? values[categoryIdx] : 'Raw Materials';
    const typeValue = typeIdx !== -1 ? values[typeIdx] : catValue;

    suppliers.push({
      name,
      phone: phoneIdx !== -1 ? values[phoneIdx] : '',
      contactPerson: contactPersonIdx !== -1 ? values[contactPersonIdx] : '',
      email: emailIdx !== -1 ? values[emailIdx] : '',
      address: addressIdx !== -1 ? values[addressIdx] : '',
      category: catValue,
      type: typeValue,
      rating: ratingIdx !== -1 ? (parseFloat(values[ratingIdx]) || 5) : 5,
      creditLimit: creditLimitIdx !== -1 ? (parseFloat(values[creditLimitIdx]?.replace(/[^\d.-]/g, '') || '0')) : 0,
      isActive: true,
      averageDeliveryTime: deliveryTimeIdx !== -1 ? (parseFloat(values[deliveryTimeIdx]) || 0) : 0,
      averageQualityScore: qualityScoreIdx !== -1 ? (parseFloat(values[qualityScoreIdx]) || 5) : 5,
      averagePriceVariance: priceVarianceIdx !== -1 ? (parseFloat(values[priceVarianceIdx]) || 0) : 0,
      totalDeliveriesCount: countIdx !== -1 ? (parseInt(values[countIdx]) || 0) : 0
    });
  }

  return suppliers;
};

export const getSupplierTemplate = () => {
  return "Supplier Name,Contact Person,Phone,Email,Address,Primary Category,Supplier Type,Rating,Credit Limit,Avg Lead Time,Avg Quality,Price Variance,Total Orders\nNgetta Millers,John Doe,+256700000000,john@ngetta.com,Plot 1 Lira,Raw Materials,Wholesale,5,25000000,2,5,0,45\nPackaging Solutions Ltd,Grace Atim,+256780000000,info@psl.ug,Industrial Area,Packaging,Manufacturer,4,10000000,5,4.5,-2,120";
};

export const parseFinishedGoodsCSV = (csvText: string): Partial<FinishedGood & { skuName: string }>[] => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const results: any[] = [];

  const findIdx = (possibleNames: string[]) => 
    headers.findIndex(h => possibleNames.includes(h.replace(/[\s_]/g, '')));

  const skuIdIdx = findIdx(['skuid', 'id', 'code']);
  const stockIdx = findIdx(['stock', 'qty', 'quantity', 'stocklevel']);
  const reorderIdx = findIdx(['reorder', 'reorderlevel', 'min']);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
    
    results.push({
      skuId: skuIdIdx !== -1 ? values[skuIdIdx] : '',
      stockLevel: stockIdx !== -1 ? parseFloat(values[stockIdx] || '0') : 0,
      reorderLevel: reorderIdx !== -1 ? parseFloat(values[reorderIdx] || '0') : 0
    });
  }
  return results;
};

export const parseActivityCSV = (csvText: string): Partial<Activity>[] => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const activities: Partial<Activity>[] = [];

  const nameIdx = headers.findIndex(h => ['name', 'activity'].includes(h));
  const rateIdx = headers.findIndex(h => ['rate', 'cost', 'hourlyrate'].includes(h.replace(/\s+/g, '')));

  if (nameIdx === -1) return [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
    
    const name = values[nameIdx];
    const rate = parseFloat(values[rateIdx]?.replace(/[^\d.-]/g, '') || '0');

    if (name) {
      activities.push({
        name,
        rate: isNaN(rate) ? 0 : rate
      });
    }
  }

  return activities;
};
