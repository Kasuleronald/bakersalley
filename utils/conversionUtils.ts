
import { Ingredient } from '../types';

/**
 * Standard conversion factors.
 * The structure is: STANDARD_CONVERSIONS[BaseUnit][TargetUnit] = factor
 * Calculation: BaseQuantity = TargetQuantity * factor
 * 
 * Standards:
 * 1 kg = 1000 g
 * 1 l = 1000 ml
 * 1 lb = 453.592 g
 * 1 oz = 28.3495 g
 * 1 cup = 240 ml (Culinary standard)
 * 1 tbsp = 15 ml
 * 1 tsp = 5 ml
 */
export const STANDARD_CONVERSIONS: Record<string, Record<string, number>> = {
  'kg': {
    'kg': 1,
    'g': 0.001,
    'lb': 0.453592,
    'oz': 0.0283495,
    'l': 1, // Assumed density for simple kitchen calc
    'ml': 0.001
  },
  'g': {
    'g': 1,
    'kg': 1000,
    'lb': 453.592,
    'oz': 28.3495,
    'tsp': 5,
    'tbsp': 15,
    'cups': 240,
    'ml': 1
  },
  'l': {
    'l': 1,
    'ml': 0.001,
    'tsp': 0.005,
    'tbsp': 0.015,
    'cups': 0.24,
    'kg': 1,
    'lb': 0.453592
  },
  'ml': {
    'ml': 1,
    'l': 1000,
    'tsp': 5,
    'tbsp': 15,
    'cups': 240,
    'g': 1,
    'kg': 1000
  },
  'lb': {
    'lb': 1,
    'oz': 0.0625,
    'kg': 2.20462,
    'g': 0.00220462,
    'l': 2.20462
  },
  'oz': {
    'oz': 1,
    'lb': 16,
    'kg': 35.274,
    'g': 0.035274,
    'ml': 0.035274
  },
  'tsp': {
    'tsp': 1,
    'tbsp': 3,
    'cups': 48,
    'ml': 1,
    'l': 1000,
    'g': 1
  },
  'tbsp': {
    'tbsp': 1,
    'tsp': 0.333333,
    'cups': 16,
    'ml': 1,
    'l': 1000,
    'g': 1
  },
  'cups': {
    'cups': 1,
    'tsp': 0.0208333,
    'tbsp': 0.0625,
    'ml': 0.00416667,
    'l': 4.16667,
    'g': 0.00416667
  }
};

export const getConversionFactor = (ingredient: Ingredient, targetUnit: string): number => {
  const baseUnitLower = ingredient.unit.toLowerCase();
  const targetUnitLower = targetUnit.toLowerCase();
  
  if (baseUnitLower === targetUnitLower) return 1;
  
  // Check custom conversions first
  // Fix: Reference conversions property now defined on Ingredient interface
  const custom = ingredient.conversions?.find(c => c.unit.toLowerCase() === targetUnitLower);
  if (custom) return custom.factor;

  // Check standard conversions
  if (STANDARD_CONVERSIONS[baseUnitLower] && STANDARD_CONVERSIONS[baseUnitLower][targetUnitLower]) {
    return STANDARD_CONVERSIONS[baseUnitLower][targetUnitLower];
  }

  // Fallback for common weight/volume inverse if not explicitly mapped
  if (STANDARD_CONVERSIONS[targetUnitLower] && STANDARD_CONVERSIONS[targetUnitLower][baseUnitLower]) {
    return 1 / STANDARD_CONVERSIONS[targetUnitLower][baseUnitLower];
  }

  return 1;
};
