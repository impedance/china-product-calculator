/**
 * Example Data - Preset scenarios for demo and testing
 * Includes Example A (spreadsheet baseline) and Example B (alternative)
 */

/**
 * Example A - Spreadsheet baseline
 * Mirrors the source workbook example as closely as possible
 */
export const EXAMPLE_A = {
  productName: 'Product A',
  sku: 'SKU-001',
  unitPriceCny: 100,
  cnyRubRate: 13.5,
  chinaDeliveryRub: 20,
  densityKgM3: 250,
  cargoRateUsdPerKg: 2,
  usdRubRate: 100,
  unitWeightKg: 0.5,
  insuranceRate: 3.7,
  reworkRub: 50,
  packagingRub: 30,
  markupRate: 100,
  taxRate: 6
};

/**
 * Expected outputs for Example A
 * Used for testing and verification
 */
export const EXAMPLE_A_EXPECTED = {
  purchaseRub: 1350,
  cargoCostRub: 100,
  insuranceRub: 49.95,
  totalCostRub: 1599.95,
  retailPriceRub: 3199.90,
  taxRub: 191.99,
  profitRub: 1407.96,
  marginRate: 0.44 // 44.0%
};

/**
 * Example B - Alternative fake scenario
 * Second demo preset for prototype presentations
 */
export const EXAMPLE_B = {
  productName: 'Product B',
  sku: 'SKU-002',
  unitPriceCny: 75,
  cnyRubRate: 14,
  chinaDeliveryRub: 30,
  densityKgM3: 180,
  cargoRateUsdPerKg: 2.5,
  usdRubRate: 95,
  unitWeightKg: 0.8,
  insuranceRate: 3,
  reworkRub: 40,
  packagingRub: 25,
  markupRate: 80,
  taxRate: 6
};

/**
 * Expected outputs for Example B
 * Used for testing and verification
 */
export const EXAMPLE_B_EXPECTED = {
  purchaseRub: 1050,
  cargoCostRub: 190,
  insuranceRub: 31.50,
  totalCostRub: 1366.50,
  retailPriceRub: 2459.70,
  taxRub: 147.58,
  profitRub: 945.62,
  marginRate: 0.384 // 38.4%
};

/**
 * Gets a preset by ID
 * @param {string} presetId - 'example-a' or 'example-b'
 * @returns {Object|null} - Preset data or null if not found
 */
export function getPreset(presetId) {
  const presets = {
    'example-a': EXAMPLE_A,
    'example-b': EXAMPLE_B
  };
  
  return presets[presetId] || null;
}

/**
 * Gets expected outputs for a preset (for testing)
 * @param {string} presetId - 'example-a' or 'example-b'
 * @returns {Object|null} - Expected outputs or null if not found
 */
export function getPresetExpected(presetId) {
  const expected = {
    'example-a': EXAMPLE_A_EXPECTED,
    'example-b': EXAMPLE_B_EXPECTED
  };
  
  return expected[presetId] || null;
}

/**
 * Gets all available presets
 * @returns {Array<Object>} - Array of preset info
 */
export function getAllPresets() {
  return [
    {
      id: 'example-a',
      name: 'Пример A',
      description: 'Базовый сценарий из Excel',
      data: EXAMPLE_A
    },
    {
      id: 'example-b',
      name: 'Пример B',
      description: 'Альтернативный сценарий',
      data: EXAMPLE_B
    }
  ];
}

/**
 * Gets a human-readable description of a preset
 * @param {string} presetId - Preset identifier
 * @returns {string} - Description
 */
export function getPresetDescription(presetId) {
  const descriptions = {
    'example-a': 'Базовый сценарий: наушники, цена 100¥, вес 0.5кг, наценка 100%',
    'example-b': 'Альтернативный сценарий: аксессуары, цена 75¥, вес 0.8кг, наценка 80%'
  };
  
  return descriptions[presetId] || 'Неизвестный пресет';
}
