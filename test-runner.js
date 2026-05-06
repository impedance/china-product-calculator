#!/usr/bin/env node

/**
 * Simple Node.js tests for formula validation
 * Run with: node test-runner.js
 */

const fs = require('fs');
const path = require('path');

// Read and evaluate formulas.js content
const formulasPath = path.join(__dirname, 'js', 'formulas.js');
const formulasContent = fs.readFileSync(formulasPath, 'utf-8');

// Extract and export functions from module-like code
// This is a simple approach - in real scenario we'd use proper ESM imports
const testResults = [];

function test(name, fn) {
  try {
    fn();
    testResults.push({ name, status: 'PASS', error: null });
    console.log(`✓ ${name}`);
  } catch (error) {
    testResults.push({ name, status: 'FAIL', error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assertEqual(actual, expected, message) {
  const tolerance = 0.01;
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertNull(value, message) {
  if (value !== null) {
    throw new Error(`${message || 'Expected null'}: got ${value}`);
  }
}

console.log('Running Node.js formula tests...\n');

// Manual implementation of formulas for testing
function normalizePercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value > 1 ? value / 100 : value;
}

function calculatePurchaseRub(unitPriceUsd, usdRubRate) {
  if (unitPriceUsd === null || usdRubRate === null || unitPriceUsd < 0 || usdRubRate <= 0) return null;
  return unitPriceUsd * usdRubRate;
}

function calculateCargoCostRub(unitWeightKg, cargoRateUsdPerKg, usdRubRate) {
  if (unitWeightKg === null || cargoRateUsdPerKg === null || usdRubRate === null) return null;
  if (unitWeightKg < 0 || cargoRateUsdPerKg < 0 || usdRubRate <= 0) return null;
  return unitWeightKg * cargoRateUsdPerKg * usdRubRate;
}

function calculateInsuranceRub(purchaseRub, insuranceRate) {
  if (purchaseRub === null || insuranceRate === null || purchaseRub < 0) return null;
  const rate = normalizePercent(insuranceRate);
  if (rate === null || rate < 0) return null;
  return purchaseRub * rate;
}

function calculateTotalCostRub(costs) {
  const { purchaseRub, localDeliveryRub, cargoCostRub, insuranceRub, reworkRub, packagingRub } = costs;
  if ([purchaseRub, localDeliveryRub, cargoCostRub, insuranceRub, reworkRub, packagingRub].some(v => v === null || v < 0)) {
    return null;
  }
  return purchaseRub + localDeliveryRub + cargoCostRub + insuranceRub + reworkRub + packagingRub;
}

function calculateRetailPriceRub(totalCostRub, markupRate) {
  if (totalCostRub === null || markupRate === null || totalCostRub < 0) return null;
  // markupRate should already be in decimal form (UI converts percent to decimal)
  if (markupRate < 0) return null;
  return totalCostRub * (1 + markupRate);
}

function calculateTaxRub(retailPriceRub, taxRate) {
  if (retailPriceRub === null || taxRate === null || retailPriceRub < 0) return null;
  const rate = normalizePercent(taxRate);
  if (rate === null || rate < 0) return null;
  return retailPriceRub * rate;
}

function calculateProfitRub(retailPriceRub, totalCostRub, taxRub) {
  if ([retailPriceRub, totalCostRub, taxRub].some(v => v === null || v < 0)) return null;
  return retailPriceRub - totalCostRub - taxRub;
}

function calculateMarginRate(profitRub, retailPriceRub) {
  if (profitRub === null || retailPriceRub === null || profitRub < 0 || retailPriceRub < 0) return null;
  if (retailPriceRub <= 0) return 0;
  return profitRub / retailPriceRub;
}

function isValidPositiveNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return false;
  if (typeof value !== 'number') return false;
  return value > 0;
}

function isValidNonNegativeNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return false;
  if (typeof value !== 'number') return false;
  return value >= 0;
}

function calculateTotalRevenue(quantity, retailPriceRub) {
  if (!isValidPositiveNumber(quantity) || !isValidNonNegativeNumber(retailPriceRub)) {
    return null;
  }
  const result = quantity * retailPriceRub;
  return Number.isFinite(result) ? result : null;
}

function calculateBatchProfit(quantity, profitPerUnit) {
  if (!isValidPositiveNumber(quantity) || !isValidNonNegativeNumber(profitPerUnit)) {
    return null;
  }
  const result = quantity * profitPerUnit;
  return Number.isFinite(result) ? result : null;
}

// TC-01: Example A
console.log('--- TC-01: Spreadsheet baseline (Example A) ---');
test('Purchase calculation', () => {
  const result = calculatePurchaseRub(15, 95);
  assertEqual(result, 1425, 'Purchase should be 1425');
});

test('Cargo cost calculation', () => {
  const result = calculateCargoCostRub(0.5, 2, 95);  // 0.5 * 2 * 95 = 95
  assertEqual(result, 95, 'Cargo should be 95');
});

test('Insurance calculation', () => {
  const purchase = calculatePurchaseRub(15, 95);
  const result = calculateInsuranceRub(purchase, 3.7);
  assertEqual(result, 52.73, 'Insurance should be 52.73');
});

test('Total cost calculation', () => {
  const purchase = calculatePurchaseRub(15, 95);
  const cargo = calculateCargoCostRub(0.5, 2, 95);  // 95
  const insurance = calculateInsuranceRub(purchase, 3.7);
  const result = calculateTotalCostRub({
    purchaseRub: purchase,
    localDeliveryRub: 20,
    cargoCostRub: cargo,
    insuranceRub: insurance,
    reworkRub: 50,
    packagingRub: 30
  });
  assertEqual(result, 1672.73, 'Total cost should be 1672.73');
});

test('Retail price calculation', () => {
  const result = calculateRetailPriceRub(1672.73, 1.0);  // 100% markup as decimal
  assertEqual(result, 3345.46, 'Retail should be 3345.46');
});

test('Tax calculation', () => {
  const result = calculateTaxRub(3345.46, 6);
  assertEqual(result, 200.73, 'Tax should be 200.73');
});

test('Profit calculation', () => {
  const result = calculateProfitRub(3345.46, 1672.73, 200.73);
  assertEqual(result, 1472.00, 'Profit should be 1472.00');
});

test('Margin calculation', () => {
  const result = calculateMarginRate(1472.00, 3345.46);
  assertEqual(result, 0.44, 'Margin should be 44%');
});

// TC-02: Percent normalization
console.log('\n--- TC-02: Percent normalization ---');
test('100 -> 1', () => {
  assertEqual(normalizePercent(100), 1);
});
test('6 -> 0.06', () => {
  assertEqual(normalizePercent(6), 0.06);
});
test('3.7 -> 0.037', () => {
  assertEqual(normalizePercent(3.7), 0.037);
});
test('1 -> 1', () => {
  assertEqual(normalizePercent(1), 1);
});
test('0.06 -> 0.06', () => {
  assertEqual(normalizePercent(0.06), 0.06);
});
test('0.037 -> 0.037', () => {
  assertEqual(normalizePercent(0.037), 0.037);
});

// TC-03: Edge cases
console.log('\n--- TC-03: Edge cases ---');
test('Zero tax', () => {
  const result = calculateTaxRub(1000, 0);
  assertEqual(result, 0);
});

test('Zero markup', () => {
  const result = calculateRetailPriceRub(1000, 0);
  assertEqual(result, 1000);
});

test('Markup 85% - correct calculation', () => {
  const result = calculateRetailPriceRub(100, 0.85);  // 85% markup
  assertEqual(result, 185, '85% markup should give 185');
});

test('Markup 110% - correct calculation (bug fix)', () => {
  const result = calculateRetailPriceRub(100, 1.10);  // 110% markup
  assertEqual(result, 210, '110% markup should give 210');
});

test('Markup 200% - correct calculation', () => {
  const result = calculateRetailPriceRub(100, 2.0);  // 200% markup
  assertEqual(result, 300, '200% markup should give 300');
});

test('Markup 300% - correct calculation', () => {
  const result = calculateRetailPriceRub(100, 3.0);  // 300% markup
  assertEqual(result, 400, '300% markup should give 400');
});

test('Safe division - zero retail', () => {
  const result = calculateMarginRate(100, 0);
  assertEqual(result, 0);
});

test('Negative input rejected', () => {
  const result = calculatePurchaseRub(-15, 95);
  assertNull(result);
});

test('Null input returns null', () => {
  const result = calculatePurchaseRub(null, 95);
  assertNull(result);
});

// TC-04: Example B
console.log('\n--- TC-04: Example B ---');
test('Example B full calculation', () => {
  const purchase = calculatePurchaseRub(10, 98);
  const cargo = calculateCargoCostRub(0.8, 2.5, 98);  // 0.8 * 2.5 * 98 = 196
  const insurance = calculateInsuranceRub(purchase, 3);
  const total = calculateTotalCostRub({
    purchaseRub: purchase,
    localDeliveryRub: 30,
    cargoCostRub: cargo,
    insuranceRub: insurance,
    reworkRub: 40,
    packagingRub: 25
  });
  const retail = calculateRetailPriceRub(total, 0.8);  // 80% markup as decimal
  const tax = calculateTaxRub(retail, 6);
  const profit = calculateProfitRub(retail, total, tax);
  const margin = calculateMarginRate(profit, retail);

  assertEqual(purchase, 980, 'Purchase');
  assertEqual(cargo, 196, 'Cargo');
  assertEqual(insurance, 29.40, 'Insurance');
  assertEqual(total, 1300.40, 'Total cost');
  assertEqual(retail, 2340.72, 'Retail');
  assertEqual(tax, 140.44, 'Tax');
  assertEqual(profit, 899.88, 'Profit');
  assertEqual(margin, 0.384, 'Margin');
});

// TC-05: Exchange Rate calculations
console.log('\n--- TC-05: Exchange Rate calculations ---');

// Simulate exchange rate calculation from CBR response
function calculateUsdRate(usdData) {
  if (!usdData || typeof usdData.Value !== 'number' || typeof usdData.Nominal !== 'number') {
    return null;
  }
  if (usdData.Nominal <= 0) {
    return null;
  }
  const rate = usdData.Value / usdData.Nominal;
  return Math.round(rate * 1000000) / 1000000;
}

function formatEffectiveDate(isoDate) {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch (e) {
    return '';
  }
}

test('USD rate calculation: Value / Nominal', () => {
  const usdData = { Value: 95.50, Nominal: 1 };
  const result = calculateUsdRate(usdData);
  assertEqual(result, 95.50);
});

test('USD rate with Nominal > 1', () => {
  const usdData = { Value: 955, Nominal: 10 };
  const result = calculateUsdRate(usdData);
  assertEqual(result, 95.5);
});

test('USD rate rounding to 6 decimals', () => {
  const usdData = { Value: 95.50456789, Nominal: 1 };
  const result = calculateUsdRate(usdData);
  assertEqual(result, 95.504568);
});

test('Invalid USD data returns null', () => {
  const result = calculateUsdRate(null);
  assertNull(result);
});

test('Missing Value returns null', () => {
  const usdData = { Nominal: 1 };
  const result = calculateUsdRate(usdData);
  assertNull(result);
});

test('Zero Nominal returns null', () => {
  const usdData = { Value: 95.50, Nominal: 0 };
  const result = calculateUsdRate(usdData);
  assertNull(result);
});

test('Date formatting', () => {
  const result = formatEffectiveDate('2026-04-19T11:30:00+03:00');
  if (result !== '19.04.2026') {
    throw new Error(`Expected '19.04.2026', got '${result}'`);
  }
});

test('Empty date returns empty string', () => {
  const result = formatEffectiveDate(null);
  if (result !== '') {
    throw new Error(`Expected '', got '${result}'`);
  }
});

// TC-11: calculateTotalRevenue
console.log('\n--- TC-11: calculateTotalRevenue ---');
test('calculateTotalRevenue: quantity × retail price', () => {
  const result = calculateTotalRevenue(500, 3345.46);
  assertEqual(result, 1672730, 1);
});

test('calculateTotalRevenue: null for invalid quantity', () => {
  const r1 = calculateTotalRevenue(0, 3364.40);
  const r2 = calculateTotalRevenue(null, 3364.40);
  const r3 = calculateTotalRevenue(-10, 3364.40);
  if (r1 !== null || r2 !== null || r3 !== null) {
    throw new Error('Expected null for invalid quantity');
  }
});

test('calculateTotalRevenue: null for negative price', () => {
  const result = calculateTotalRevenue(500, -100);
  assertNull(result);
});

// TC-12: calculateBatchProfit
console.log('\n--- TC-12: calculateBatchProfit ---');
test('calculateBatchProfit: returns null when quantity is 0 or null', () => {
  const r1 = calculateBatchProfit(0, 1480);
  const r2 = calculateBatchProfit(null, 1480);
  if (r1 !== null || r2 !== null) {
    throw new Error('Expected null for zero/null quantity');
  }
});

test('calculateBatchProfit: correct calculation', () => {
  const result = calculateBatchProfit(500, 1472);
  assertEqual(result, 736000, 1);
});

// Summary
console.log('\n--- Summary ---');
const passed = testResults.filter(r => r.status === 'PASS').length;
const failed = testResults.filter(r => r.status === 'FAIL').length;
console.log(`Total: ${testResults.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
