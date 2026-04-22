import { IndustryProfile, TaxConfig, IndustryTerminology } from '../types';

export interface IndustryTerms extends IndustryTerminology {
  stages: string[];
}

/**
 * Single source of truth for UI terminology and process stages.
 * Maintains hard-coded templates for Bakery ONLY.
 * All other industries rely on AI-generated metadata stored in TaxConfig.
 */
export const getIndustryTerms = (configOrProfile?: TaxConfig | IndustryProfile): IndustryTerms => {
  const profile = typeof configOrProfile === 'string' ? configOrProfile : (configOrProfile?.industry || 'Bakery');
  const config = typeof configOrProfile === 'object' ? configOrProfile as TaxConfig : null;

  // 1. HARD-CODED BAKERY TEMPLATE (Native Specialized Mode)
  if (profile === 'Bakery') {
    return {
      skuLabel: 'Product SKU',
      recipeLabel: 'Recipes & Formulations',
      ingredientLabel: 'Ingredients',
      productionUnit: 'Loaves / Pcs',
      workCenterLabel: 'Oven Floor',
      icon: '🥐',
      // Allow custom stages even in bakery mode if provided in config, otherwise default
      stages: config?.industryStages || ['Prep', 'Mix', 'Molding', 'Proof', 'Bake', 'Decoration', 'Ready']
    };
  }

  // 2. DYNAMIC AI-GENERATED OVERRIDES (For client's custom industry choice)
  if (config?.industryTerminology && config?.industryStages) {
    return {
      ...config.industryTerminology,
      stages: config.industryStages
    };
  }

  // 3. GENERIC FALLBACK (Before AI Architect is triggered for custom industries)
  return {
    skuLabel: 'Item SKU',
    recipeLabel: 'BOM / Process Spec',
    ingredientLabel: 'Materials',
    productionUnit: 'Units',
    workCenterLabel: 'Shop Floor',
    icon: '⚙️',
    stages: ['Setup', 'Execute', 'QA', 'Packing', 'Ready']
  };
};
