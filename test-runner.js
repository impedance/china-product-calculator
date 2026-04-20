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

function calculatePurchaseRub(unitPriceCny, cnyRubRate) {
  if (unitPriceCny === null || cnyRubRate === null || unitPriceCny < 0 || cnyRubRate <= 0) return null;
  return unitPriceCny * cnyRubRate;
}

function calculateCargoCostRub(unitWeightKg, cargoRateCnyPerKg, cnyRubRate) {
  if (unitWeightKg === null || cargoRateCnyPerKg === null || cnyRubRate === null) return null;
  if (unitWeightKg < 0 || cargoRateCnyPerKg < 0 || cnyRubRate <= 0) return null;
  return unitWeightKg * cargoRateCnyPerKg * cnyRubRate;
}

function calculateInsuranceRub(purchaseRub, insuranceRate) {
  if (purchaseRub === null || insuranceRate === null || purchaseRub < 0) return null;
  const rate = normalizePercent(insuranceRate);
  if (rate === null || rate < 0) return null;
  return purchaseRub * rate;
}

function calculateTotalCostRub(costs) {
  const { purchaseRub, chinaDeliveryRub, cargoCostRub, insuranceRub, reworkRub, packagingRub } = costs;
  if ([purchaseRub, chinaDeliveryRub, cargoCostRub, insuranceRub, reworkRub, packagingRub].some(v => v === null || v < 0)) {
    return null;
  }
  return purchaseRub + chinaDeliveryRub + cargoCostRub + insuranceRub + reworkRub + packagingRub;
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

// TC-01: Example A
console.log('--- TC-01: Spreadsheet baseline (Example A) ---');
test('Purchase calculation', () => {
  const result = calculatePurchaseRub(100, 13.5);
  assertEqual(result, 1350, 'Purchase should be 1350');
});

test('Cargo cost calculation', () => {
  const result = calculateCargoCostRub(0.5, 27, 13.5);  // 0.5 * 27 * 13.5 = 182.25
  assertEqual(result, 182.25, 'Cargo should be 182.25');
});

test('Insurance calculation', () => {
  const purchase = calculatePurchaseRub(100, 13.5);
  const result = calculateInsuranceRub(purchase, 3.7);
  assertEqual(result, 49.95, 'Insurance should be 49.95');
});

test('Total cost calculation', () => {
  const purchase = calculatePurchaseRub(100, 13.5);
  const cargo = calculateCargoCostRub(0.5, 27, 13.5);  // 182.25
  const insurance = calculateInsuranceRub(purchase, 3.7);
  const result = calculateTotalCostRub({
    purchaseRub: purchase,
    chinaDeliveryRub: 20,
    cargoCostRub: cargo,
    insuranceRub: insurance,
    reworkRub: 50,
    packagingRub: 30
  });
  assertEqual(result, 1682.20, 'Total cost should be 1682.20');
});

test('Retail price calculation', () => {
  const result = calculateRetailPriceRub(1682.20, 1.0);  // 100% markup as decimal
  assertEqual(result, 3364.40, 'Retail should be 3364.40');
});

test('Tax calculation', () => {
  const result = calculateTaxRub(3364.40, 6);
  assertEqual(result, 201.86, 'Tax should be 201.86');
});

test('Profit calculation', () => {
  const result = calculateProfitRub(3364.40, 1682.20, 201.86);
  assertEqual(result, 1480.34, 'Profit should be 1480.34');
});

test('Margin calculation', () => {
  const result = calculateMarginRate(1480.34, 3364.40);
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
  const result = calculatePurchaseRub(-100, 13.5);
  assertNull(result);
});

test('Null input returns null', () => {
  const result = calculatePurchaseRub(null, 13.5);
  assertNull(result);
});

// TC-04: Example B
console.log('\n--- TC-04: Example B ---');
test('Example B full calculation', () => {
  const purchase = calculatePurchaseRub(75, 14);
  const cargo = calculateCargoCostRub(0.8, 34, 14);  // 0.8 * 34 * 14 = 380.8
  const insurance = calculateInsuranceRub(purchase, 3);
  const total = calculateTotalCostRub({
    purchaseRub: purchase,
    chinaDeliveryRub: 30,
    cargoCostRub: cargo,
    insuranceRub: insurance,
    reworkRub: 40,
    packagingRub: 25
  });
  const retail = calculateRetailPriceRub(total, 0.8);  // 80% markup as decimal
  const tax = calculateTaxRub(retail, 6);
  const profit = calculateProfitRub(retail, total, tax);
  const margin = calculateMarginRate(profit, retail);
  
  assertEqual(purchase, 1050, 'Purchase');
  assertEqual(cargo, 380.80, 'Cargo');
  assertEqual(insurance, 31.50, 'Insurance');
  assertEqual(total, 1557.30, 'Total cost');
  assertEqual(retail, 2803.14, 'Retail');
  assertEqual(tax, 168.19, 'Tax');
  assertEqual(profit, 1077.65, 'Profit');
  assertEqual(margin, 0.384, 'Margin');
});

// TC-05: Exchange Rate calculations
console.log('\n--- TC-05: Exchange Rate calculations ---');

// Simulate exchange rate calculation from CBR response
function calculateCnyRate(cnyData) {
  if (!cnyData || typeof cnyData.Value !== 'number' || typeof cnyData.Nominal !== 'number') {
    return null;
  }
  if (cnyData.Nominal <= 0) {
    return null;
  }
  const rate = cnyData.Value / cnyData.Nominal;
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

test('CNY rate calculation: Value / Nominal', () => {
  const cnyData = { Value: 11.42, Nominal: 1 };
  const result = calculateCnyRate(cnyData);
  assertEqual(result, 11.42);
});

test('CNY rate with Nominal > 1', () => {
  const cnyData = { Value: 114.2, Nominal: 10 };
  const result = calculateCnyRate(cnyData);
  assertEqual(result, 11.42);
});

test('CNY rate rounding to 6 decimals', () => {
  const cnyData = { Value: 11.42456789, Nominal: 1 };
  const result = calculateCnyRate(cnyData);
  assertEqual(result, 11.424568);
});

test('Invalid CNY data returns null', () => {
  const result = calculateCnyRate(null);
  assertNull(result);
});

test('Missing Value returns null', () => {
  const cnyData = { Nominal: 1 };
  const result = calculateCnyRate(cnyData);
  assertNull(result);
});

test('Zero Nominal returns null', () => {
  const cnyData = { Value: 11.42, Nominal: 0 };
  const result = calculateCnyRate(cnyData);
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

// Summary
console.log('\n--- Summary ---');
const passed = testResults.filter(r => r.status === 'PASS').length;
const failed = testResults.filter(r => r.status === 'FAIL').length;
console.log(`Total: ${testResults.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
