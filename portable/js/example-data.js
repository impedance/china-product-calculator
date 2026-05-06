/**
 * Example Data - Preset scenarios for demo and testing
 * Includes Example A (spreadsheet baseline) and Example B (alternative)
 */

/**
 * Example A - Spreadsheet baseline
 * Mirrors the source workbook example as closely as possible
 */
const EXAMPLE_A = {
  productName: 'Product A',
  sku: 'SKU-001',
  unitPriceUsd: 15,
  usdRubRate: 95,
  chinaDeliveryRub: 20,
  densityKgM3: 250,
  cargoRateUsdPerKg: 2,
  unitWeightKg: 0.5,
  insuranceRate: 0.037,
  reworkRub: 50,
  packagingRub: 30,
  markupRate: 1,
  taxRate: 0.06
};

/**
 * Expected outputs for Example A
 * Used for testing and verification
 */
const EXAMPLE_A_EXPECTED = {
  purchaseRub: 1425,
  cargoCostRub: 95,  // 0.5 * 2 * 95
  insuranceRub: 52.73,
  totalCostRub: 1672.73,  // 1425 + 20 + 95 + 52.73 + 50 + 30
  retailPriceRub: 3345.46, // 1672.73 * 2
  taxRub: 200.73,         // 3345.46 * 0.06
  profitRub: 1472.00,     // 3345.46 - 1672.73 - 200.73
  marginRate: 0.44        // 44.0%
};

/**
 * Example B - Alternative fake scenario
 * Second demo preset for prototype presentations
 */
const EXAMPLE_B = {
  productName: 'Product B',
  sku: 'SKU-002',
  unitPriceUsd: 10,
  usdRubRate: 98,
  chinaDeliveryRub: 30,
  densityKgM3: 180,
  cargoRateUsdPerKg: 2.5,
  unitWeightKg: 0.8,
  insuranceRate: 0.03,
  reworkRub: 40,
  packagingRub: 25,
  markupRate: 0.8,
  taxRate: 0.06
};

/**
 * Expected outputs for Example B
 * Used for testing and verification
 */
const EXAMPLE_B_EXPECTED = {
  purchaseRub: 980,
  cargoCostRub: 196,   // 0.8 * 2.5 * 98
  insuranceRub: 29.40,
  totalCostRub: 1300.40,  // 980 + 30 + 196 + 29.40 + 40 + 25
  retailPriceRub: 2340.72, // 1300.40 * 1.8
  taxRub: 140.44,         // 2340.72 * 0.06
  profitRub: 899.88,     // 2340.72 - 1300.40 - 140.44
  marginRate: 0.384       // 38.4%
};

/**
 * Gets a preset by ID
 * @param {string} presetId - 'example-a' or 'example-b'
 * @returns {Object|null} - Preset data or null if not found
 */
function getPreset(presetId) {
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
function getPresetExpected(presetId) {
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
function getAllPresets() {
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
function getPresetDescription(presetId) {
  const descriptions = {
    'example-a': 'Базовый сценарий: наушники, цена $15, вес 0.5кг, карго $2/кг, наценка 100%',
    'example-b': 'Альтернативный сценарий: аксессуары, цена $10, вес 0.8кг, карго $2.5/кг, наценка 80%'
  };

  return descriptions[presetId] || 'Неизвестный пресет';
}
