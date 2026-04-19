/**
 * Formula Engine - Pure business logic
 * No UI dependencies, no side effects
 */

/**
 * Normalizes percentage values
 * Supports both formats: 6 -> 0.06, 0.06 -> 0.06, 100 -> 1.0
 * @param {number|null|undefined} value - The percentage value to normalize
 * @returns {number|null} - Normalized value (0-1 range) or null if invalid
 */
export function normalizePercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  
  if (typeof value !== 'number') {
    return null;
  }
  
  if (value < 0) {
    return null;
  }
  
  // If value > 1, assume it's a whole number percentage (e.g., 6 means 6%)
  // If value <= 1, assume it's already in decimal form (e.g., 0.06 means 6%)
  return value > 1 ? value / 100 : value;
}

/**
 * Validates that a value is a non-negative number
 * @param {number|null|undefined} value - Value to validate
 * @returns {boolean} - True if valid
 */
export function isValidNonNegativeNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return false;
  }
  
  if (typeof value !== 'number') {
    return false;
  }
  
  return value >= 0;
}

/**
 * Validates that a value is a positive number (greater than 0)
 * @param {number|null|undefined} value - Value to validate
 * @returns {boolean} - True if valid
 */
export function isValidPositiveNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return false;
  }
  
  if (typeof value !== 'number') {
    return false;
  }
  
  return value > 0;
}

/**
 * Calculates purchase cost in RUB from CNY price
 * Formula: purchaseRub = unitPriceCny * cnyRubRate
 * @param {number|null} unitPriceCny - Unit price in CNY
 * @param {number|null} cnyRubRate - CNY to RUB exchange rate
 * @returns {number|null} - Purchase cost in RUB or null if inputs invalid
 */
export function calculatePurchaseRub(unitPriceCny, cnyRubRate) {
  if (!isValidNonNegativeNumber(unitPriceCny) || !isValidPositiveNumber(cnyRubRate)) {
    return null;
  }
  
  const result = unitPriceCny * cnyRubRate;
  return Number.isFinite(result) ? result : null;
}

/**
 * Calculates cargo cost in RUB
 * Formula: cargoCostRub = unitWeightKg * cargoRateCnyPerKg * cnyRubRate
 * @param {number|null} unitWeightKg - Unit weight in kg
 * @param {number|null} cargoRateCnyPerKg - Cargo rate in CNY per kg
 * @param {number|null} cnyRubRate - CNY to RUB exchange rate
 * @returns {number|null} - Cargo cost in RUB or null if inputs invalid
 */
export function calculateCargoCostRub(unitWeightKg, cargoRateCnyPerKg, cnyRubRate) {
  if (!isValidNonNegativeNumber(unitWeightKg) || 
      !isValidNonNegativeNumber(cargoRateCnyPerKg) || 
      !isValidPositiveNumber(cnyRubRate)) {
    return null;
  }
  
  const result = unitWeightKg * cargoRateCnyPerKg * cnyRubRate;
  return Number.isFinite(result) ? result : null;
}

/**
 * Calculates insurance cost in RUB
 * Formula: insuranceRub = purchaseRub * insuranceRateNormalized
 * @param {number|null} purchaseRub - Purchase cost in RUB
 * @param {number|null} insuranceRate - Insurance rate (will be normalized)
 * @returns {number|null} - Insurance cost in RUB or null if inputs invalid
 */
export function calculateInsuranceRub(purchaseRub, insuranceRate) {
  if (!isValidNonNegativeNumber(purchaseRub)) {
    return null;
  }
  
  const normalizedRate = normalizePercent(insuranceRate);
  if (normalizedRate === null) {
    return null;
  }
  
  const result = purchaseRub * normalizedRate;
  return Number.isFinite(result) ? result : null;
}

/**
 * Calculates total cost in RUB
 * Formula: totalCostRub = purchaseRub + chinaDeliveryRub + cargoCostRub + insuranceRub + reworkRub + packagingRub
 * @param {Object} costs - Object containing all cost components
 * @returns {number|null} - Total cost in RUB or null if any required input invalid
 */
export function calculateTotalCostRub({
  purchaseRub,
  chinaDeliveryRub,
  cargoCostRub,
  insuranceRub,
  reworkRub,
  packagingRub
}) {
  if (!isValidNonNegativeNumber(purchaseRub)) {
    return null;
  }
  
  const delivery = chinaDeliveryRub || 0;
  const cargo = cargoCostRub || 0;
  const insurance = insuranceRub || 0;
  const rework = reworkRub || 0;
  const packaging = packagingRub || 0;
  
  const result = purchaseRub + delivery + cargo + insurance + rework + packaging;
  return Number.isFinite(result) ? result : null;
}

/**
 * Calculates retail price in RUB
 * Formula: retailPriceRub = totalCostRub * (1 + markupRateNormalized)
 * @param {number|null} totalCostRub - Total cost in RUB
 * @param {number|null} markupRate - Markup rate (will be normalized)
 * @returns {number|null} - Retail price in RUB or null if inputs invalid
 */
export function calculateRetailPriceRub(totalCostRub, markupRate) {
  if (!isValidNonNegativeNumber(totalCostRub)) {
    return null;
  }
  
  const normalizedRate = normalizePercent(markupRate);
  if (normalizedRate === null) {
    return null;
  }
  
  const result = totalCostRub * (1 + normalizedRate);
  return Number.isFinite(result) ? result : null;
}

/**
 * Calculates tax amount in RUB
 * Formula: taxRub = retailPriceRub * taxRateNormalized
 * @param {number|null} retailPriceRub - Retail price in RUB
 * @param {number|null} taxRate - Tax rate (will be normalized)
 * @returns {number|null} - Tax amount in RUB or null if inputs invalid
 */
export function calculateTaxRub(retailPriceRub, taxRate) {
  if (!isValidNonNegativeNumber(retailPriceRub)) {
    return null;
  }
  
  const normalizedRate = normalizePercent(taxRate);
  if (normalizedRate === null) {
    return null;
  }
  
  const result = retailPriceRub * normalizedRate;
  return Number.isFinite(result) ? result : null;
}

/**
 * Calculates profit per unit in RUB
 * Formula: profitRub = retailPriceRub - totalCostRub - taxRub
 * @param {number|null} retailPriceRub - Retail price in RUB
 * @param {number|null} totalCostRub - Total cost in RUB
 * @param {number|null} taxRub - Tax amount in RUB
 * @returns {number|null} - Profit per unit or null if inputs invalid
 */
export function calculateProfitRub(retailPriceRub, totalCostRub, taxRub) {
  if (!isValidNonNegativeNumber(retailPriceRub) ||
      !isValidNonNegativeNumber(totalCostRub) ||
      !isValidNonNegativeNumber(taxRub)) {
    return null;
  }
  
  const result = retailPriceRub - totalCostRub - taxRub;
  return Number.isFinite(result) ? result : null;
}

/**
 * Calculates margin rate (as decimal)
 * Formula: marginRate = retailPriceRub <= 0 ? 0 : profitRub / retailPriceRub
 * @param {number|null} profitRub - Profit per unit
 * @param {number|null} retailPriceRub - Retail price in RUB
 * @returns {number|null} - Margin rate (0-1) or null if inputs invalid
 */
export function calculateMarginRate(profitRub, retailPriceRub) {
  if (!isValidNonNegativeNumber(profitRub) || !isValidNonNegativeNumber(retailPriceRub)) {
    return null;
  }
  
  // Safe division: if retail price is 0 or negative, margin is 0
  if (retailPriceRub <= 0) {
    return 0;
  }
  
  const result = profitRub / retailPriceRub;
  return Number.isFinite(result) ? result : 0;
}

/**
 * Main calculation function - runs the full formula chain
 * @param {Object} input - Calculator input values
 * @returns {Object} - All calculated outputs (null for any that couldn't be calculated)
 */
export function calculateAll(input) {
  // Step 1: Calculate purchase in RUB
  const purchaseRub = calculatePurchaseRub(input.unitPriceCny, input.cnyRubRate);
  
  // Step 2: Calculate cargo cost in RUB (using CNY rate)
  const cargoCostRub = calculateCargoCostRub(
    input.unitWeightKg,
    input.cargoRateCnyPerKg,
    input.cnyRubRate
  );
  
  // Step 3: Calculate insurance
  const insuranceRub = calculateInsuranceRub(purchaseRub, input.insuranceRate || 0);
  
  // Step 4: Calculate total cost (optional fields default to 0)
  const totalCostRub = calculateTotalCostRub({
    purchaseRub,
    chinaDeliveryRub: input.chinaDeliveryRub || 0,
    cargoCostRub,
    insuranceRub,
    reworkRub: input.reworkRub || 0,
    packagingRub: input.packagingRub || 0
  });
  
  // Step 5: Calculate retail price
  const retailPriceRub = calculateRetailPriceRub(totalCostRub, input.markupRate);
  
  // Step 6: Calculate taxes
  const taxRub = calculateTaxRub(retailPriceRub, input.taxRate);
  
  // Step 7: Calculate profit
  const profitRub = calculateProfitRub(retailPriceRub, totalCostRub, taxRub);
  
  // Step 8: Calculate margin
  const marginRate = calculateMarginRate(profitRub, retailPriceRub);
  
  return {
    purchaseRub,
    cargoCostRub,
    insuranceRub,
    totalCostRub,
    retailPriceRub,
    taxRub,
    profitRub,
    marginRate
  };
}

/**
 * Gets the list of required input fields
 * @returns {Array<string>} - Array of required field IDs
 */
export function getRequiredFields() {
  return [
    'unitPriceCny',
    'cnyRubRate',
    'cargoRateCnyPerKg',
    'unitWeightKg',
    'markupRate',
    'taxRate'
  ];
}

/**
 * Gets field labels for display
 * @returns {Object} - Map of field IDs to human-readable labels
 */
export function getFieldLabels() {
  return {
    productName: 'Название товара',
    sku: 'Артикул / SKU',
    unitPriceCny: 'Цена за единицу (CNY)',
    cnyRubRate: 'Курс CNY/RUB',
    chinaDeliveryRub: 'Доставка по Китаю (₽)',
    densityKgM3: 'Плотность (кг/м³)',
    cargoRateCnyPerKg: 'Ставка карго (¥/кг)',
    unitWeightKg: 'Вес единицы (кг)',
    insuranceRate: 'Страховка (%)',
    reworkRub: 'Переработка / брак (₽)',
    packagingRub: 'Упаковка / маркировка (₽)',
    markupRate: 'Наценка (%)',
    taxRate: 'Налоги (%)'
  };
}
