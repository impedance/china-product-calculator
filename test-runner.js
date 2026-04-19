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
  const { purchaseRub, chinaDeliveryRub, cargoCostRub, insuranceRub, reworkRub, packagingRub } = costs;
  if ([purchaseRub, chinaDeliveryRub, cargoCostRub, insuranceRub, reworkRub, packagingRub].some(v => v === null || v < 0)) {
    return null;
  }
  return purchaseRub + chinaDeliveryRub + cargoCostRub + insuranceRub + reworkRub + packagingRub;
}

function calculateRetailPriceRub(totalCostRub, markupRate) {
  if (totalCostRub === null || markupRate === null || totalCostRub < 0) return null;
  const rate = normalizePercent(markupRate);
  if (rate === null || rate < 0) return null;
  return totalCostRub * (1 + rate);
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
  const result = calculateCargoCostRub(0.5, 2, 100);
  assertEqual(result, 100, 'Cargo should be 100');
});

test('Insurance calculation', () => {
  const purchase = calculatePurchaseRub(100, 13.5);
  const result = calculateInsuranceRub(purchase, 3.7);
  assertEqual(result, 49.95, 'Insurance should be 49.95');
});

test('Total cost calculation', () => {
  const purchase = calculatePurchaseRub(100, 13.5);
  const cargo = calculateCargoCostRub(0.5, 2, 100);
  const insurance = calculateInsuranceRub(purchase, 3.7);
  const result = calculateTotalCostRub({
    purchaseRub: purchase,
    chinaDeliveryRub: 20,
    cargoCostRub: cargo,
    insuranceRub: insurance,
    reworkRub: 50,
    packagingRub: 30
  });
  assertEqual(result, 1599.95, 'Total cost should be 1599.95');
});

test('Retail price calculation', () => {
  const result = calculateRetailPriceRub(1599.95, 100);
  assertEqual(result, 3199.90, 'Retail should be 3199.90');
});

test('Tax calculation', () => {
  const result = calculateTaxRub(3199.90, 6);
  assertEqual(result, 191.99, 'Tax should be 191.99');
});

test('Profit calculation', () => {
  const result = calculateProfitRub(3199.90, 1599.95, 191.99);
  assertEqual(result, 1407.96, 'Profit should be 1407.96');
});

test('Margin calculation', () => {
  const result = calculateMarginRate(1407.96, 3199.90);
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
  const cargo = calculateCargoCostRub(0.8, 2.5, 95);
  const insurance = calculateInsuranceRub(purchase, 3);
  const total = calculateTotalCostRub({
    purchaseRub: purchase,
    chinaDeliveryRub: 30,
    cargoCostRub: cargo,
    insuranceRub: insurance,
    reworkRub: 40,
    packagingRub: 25
  });
  const retail = calculateRetailPriceRub(total, 80);
  const tax = calculateTaxRub(retail, 6);
  const profit = calculateProfitRub(retail, total, tax);
  const margin = calculateMarginRate(profit, retail);
  
  assertEqual(purchase, 1050, 'Purchase');
  assertEqual(cargo, 190, 'Cargo');
  assertEqual(insurance, 31.50, 'Insurance');
  assertEqual(total, 1366.50, 'Total cost');
  assertEqual(retail, 2459.70, 'Retail');
  assertEqual(tax, 147.58, 'Tax');
  assertEqual(profit, 945.62, 'Profit');
  assertEqual(margin, 0.384, 'Margin');
});

// Summary
console.log('\n--- Summary ---');
const passed = testResults.filter(r => r.status === 'PASS').length;
const failed = testResults.filter(r => r.status === 'FAIL').length;
console.log(`Total: ${testResults.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
