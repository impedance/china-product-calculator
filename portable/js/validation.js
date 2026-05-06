/**
 * Validation - Field validation, scenario validation, required-field list generation
 * Pure functions, no UI dependencies
 */

// import { isValidNonNegativeNumber, isValidPositiveNumber, getRequiredFields, getFieldLabels } from './formulas.js';

/**
 * Validates a single field value based on its type and constraints
 * @param {string} fieldId - The field identifier
 * @param {any} value - The value to validate
 * @returns {Object} - Validation result { isValid: boolean, error: string|null }
 */
function validateField(fieldId, value) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Fields that must be positive (> 0)
  const positiveFields = ['usdRubRate'];
  
  // Fields that must be non-negative (>= 0)
  const nonNegativeFields = [
    'unitPriceUsd',
    'cargoRateUsdPerKg',
    'unitWeightKg',
    'markupRate',
    'taxRate'
  ];
  
  // Optional fields with defaults (validate only if filled)
  const optionalFields = [
    'localDeliveryRub',
    'insuranceRate',
    'reworkRub',
    'packagingRub'
  ];
  
  // Text fields (no numeric validation needed)
  const textFields = ['productName', 'sku'];
  
  // Check if field is a text field
  if (textFields.includes(fieldId)) {
    return { isValid: true, error: null };
  }
  
  // Check if value is null/undefined/empty
  if (value === null || value === undefined || value === '') {
    // Check if field is required
    const requiredFields = getRequiredFields();
    if (requiredFields.includes(fieldId)) {
      return { isValid: false, error: 'Обязательное поле' };
    }
    return { isValid: true, error: null };
  }
  
  // Optional fields: validate only if filled
  if (optionalFields.includes(fieldId)) {
    if (Number.isNaN(numericValue) || numericValue < 0) {
      return { isValid: false, error: 'Значение должно быть 0 или больше' };
    }
    return { isValid: true, error: null };
  }
  
  // Check if it's a valid number
  if (Number.isNaN(numericValue)) {
    return { isValid: false, error: 'Введите корректное число' };
  }
  
  // Validate positive fields
  if (positiveFields.includes(fieldId)) {
    if (!isValidPositiveNumber(numericValue)) {
      return { isValid: false, error: 'Курс должен быть больше 0' };
    }
    return { isValid: true, error: null };
  }
  
  // Validate non-negative fields
  if (nonNegativeFields.includes(fieldId)) {
    if (!isValidNonNegativeNumber(numericValue)) {
      return { isValid: false, error: 'Значение должно быть 0 или больше' };
    }
    return { isValid: true, error: null };
  }
  
  // Default: valid
  return { isValid: true, error: null };
}

/**
 * Validates all fields in an input object
 * @param {Object} input - The calculator input object
 * @returns {Object} - Validation results with field errors
 */
function validateAllFields(input) {
  const results = {};
  const requiredFields = getRequiredFields();
  
  // Check each required field
  for (const fieldId of requiredFields) {
    const value = input[fieldId];
    results[fieldId] = validateField(fieldId, value);
  }
  
  // Check optional fields if they have values
  const optionalFieldsList = ['productName', 'sku', 'densityKgM3', 'localDeliveryRub', 'insuranceRate', 'reworkRub', 'packagingRub'];
  for (const fieldId of optionalFieldsList) {
    if (input[fieldId] !== null && input[fieldId] !== undefined && input[fieldId] !== '') {
      results[fieldId] = validateField(fieldId, input[fieldId]);
    }
  }
  
  return results;
}

/**
 * Gets the list of missing required fields
 * @param {Object} input - The calculator input object
 * @returns {Array<Object>} - Array of missing fields with their labels
 */
function getMissingRequiredFields(input) {
  const requiredFields = getRequiredFields();
  const fieldLabels = getFieldLabels();
  const missing = [];
  
  for (const fieldId of requiredFields) {
    const value = input[fieldId];
    
    if (value === null || value === undefined || value === '' || Number.isNaN(value)) {
      missing.push({
        fieldId,
        label: fieldLabels[fieldId] || fieldId,
        isMissing: true
      });
    }
  }
  
  return missing;
}

/**
 * Checks if all required fields are present and valid
 * @param {Object} input - The calculator input object
 * @returns {boolean} - True if all required fields are valid
 */
function isScenarioValid(input) {
  const validationResults = validateAllFields(input);
  const requiredFields = getRequiredFields();
  
  for (const fieldId of requiredFields) {
    const result = validationResults[fieldId];
    if (!result || !result.isValid) {
      return false;
    }
  }
  
  return true;
}

/**
 * Gets the field ID for a given label (for checklist navigation)
 * @param {string} label - Human-readable label
 * @returns {string|null} - Field ID or null if not found
 */
function getFieldIdByLabel(label) {
  const fieldLabels = getFieldLabels();
  
  for (const [fieldId, fieldLabel] of Object.entries(fieldLabels)) {
    if (fieldLabel === label) {
      return fieldId;
    }
  }
  
  return null;
}

/**
 * Gets validation summary for display
 * @param {Object} input - The calculator input object
 * @returns {Object} - Summary with counts and details
 */
function getValidationSummary(input) {
  const missing = getMissingRequiredFields(input);
  const validationResults = validateAllFields(input);
  
  const errors = [];
  for (const [fieldId, result] of Object.entries(validationResults)) {
    if (!result.isValid && result.error) {
      errors.push({ fieldId, error: result.error });
    }
  }
  
  return {
    isValid: missing.length === 0 && errors.length === 0,
    missingCount: missing.length,
    errorCount: errors.length,
    missing,
    errors
  };
}

/**
 * Field ID to input element ID mapping
 * @param {string} fieldId - Internal field ID
 * @returns {string} - HTML element ID for the input
 */
function getInputElementId(fieldId) {
  const mapping = {
    productName: 'product-name',
    sku: 'sku',
    unitPriceUsd: 'unit-price-usd',
    usdRubRate: 'usd-rub-rate',
    localDeliveryRub: 'local-delivery-rub',
    densityKgM3: 'density',
    cargoRateUsdPerKg: 'cargo-rate-usd',
    unitWeightKg: 'unit-weight',
    insuranceRate: 'insurance-rate',
    reworkRub: 'rework-rub',
    packagingRub: 'packaging-rub',
    markupRate: 'markup-rate',
    taxRate: 'tax-rate'
  };

  return mapping[fieldId] || fieldId;
}

/**
 * Input element ID to field ID mapping (reverse)
 * @param {string} elementId - HTML element ID
 * @returns {string|null} - Internal field ID or null
 */
function getFieldIdFromElementId(elementId) {
  const mapping = {
    'product-name': 'productName',
    'sku': 'sku',
    'unit-price-usd': 'unitPriceUsd',
    'usd-rub-rate': 'usdRubRate',
    'local-delivery-rub': 'localDeliveryRub',
    'density': 'densityKgM3',
    'cargo-rate-usd': 'cargoRateUsdPerKg',
    'unit-weight': 'unitWeightKg',
    'insurance-rate': 'insuranceRate',
    'rework-rub': 'reworkRub',
    'packaging-rub': 'packagingRub',
    'markup-rate': 'markupRate',
    'tax-rate': 'taxRate'
  };

  return mapping[elementId] || null;
}
