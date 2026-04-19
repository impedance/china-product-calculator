/**
 * State - In-memory app state and update helpers
 * Central state management for the calculator
 */

import {
  calculatePurchaseRub,
  calculateCargoCostRub,
  calculateInsuranceRub,
  calculateTotalCostRub,
  calculateRetailPriceRub,
  calculateTaxRub,
  calculateProfitRub,
  calculateMarginRate
} from './formulas.js';
import { validateAllFields, isScenarioValid } from './validation.js';

// Initial empty state
const initialInputState = {
  productName: '',
  sku: '',
  unitPriceCny: null,
  cnyRubRate: null,
  chinaDeliveryRub: null,
  densityKgM3: null,
  cargoRateCnyPerKg: null,
  unitWeightKg: null,
  insuranceRate: 0,
  reworkRub: null,
  packagingRub: null,
  markupRate: 1,
  taxRate: 0.06
};

const initialOutputState = {
  purchaseRub: null,
  cargoCostRub: null,
  insuranceRub: null,
  totalCostRub: null,
  retailPriceRub: null,
  taxRub: null,
  profitRub: null,
  marginRate: null
};

const initialUiState = {
  theme: 'system',
  activePresetId: null,
  touchedFields: {},
  fieldErrors: {},
  lastSavedAt: null,
  hasValidCalculation: false,
  steps: {
    1: { unlocked: true, completed: false, expanded: true },
    2: { unlocked: false, completed: false, expanded: false },
    3: { unlocked: false, completed: false, expanded: false },
    4: { unlocked: false, completed: false, expanded: false }
  },
  activeStep: 1
};

// Current state (module-level singleton)
let currentState = {
  input: { ...initialInputState },
  output: { ...initialOutputState },
  ui: { ...initialUiState }
};

// Listeners for state changes
const listeners = new Set();

/**
 * Gets the current state
 * @returns {Object} - Current state copy
 */
export function getState() {
  return {
    input: { ...currentState.input },
    output: { ...currentState.output },
    ui: { ...currentState.ui }
  };
}

/**
 * Gets only the input state
 * @returns {Object} - Current input state
 */
export function getInputState() {
  return { ...currentState.input };
}

/**
 * Gets only the output state
 * @returns {Object} - Current output state
 */
export function getOutputState() {
  return { ...currentState.output };
}

/**
 * Gets only the UI state
 * @returns {Object} - Current UI state
 */
export function getUiState() {
  return { ...currentState.ui };
}

/**
 * Updates input state and recalculates outputs
 * @param {Object} updates - Partial input updates
 * @returns {Object} - New state
 */
export function updateInput(updates) {
  // Update input state
  currentState.input = {
    ...currentState.input,
    ...updates
  };
  
  // Mark touched fields
  Object.keys(updates).forEach(fieldId => {
    currentState.ui.touchedFields[fieldId] = true;
  });
  
  // Validate fields
  const validationResults = validateAllFields(currentState.input);
  currentState.ui.fieldErrors = {};
  
  for (const [fieldId, result] of Object.entries(validationResults)) {
    if (!result.isValid) {
      currentState.ui.fieldErrors[fieldId] = result.error;
    }
  }
  
  // Recalculate outputs
  recalculate();
  
  // Notify listeners
  notifyListeners();
  
  return getState();
}

/**
 * Sets a single input field value
 * @param {string} fieldId - Field identifier
 * @param {any} value - New value
 * @returns {Object} - New state
 */
export function setInputField(fieldId, value) {
  return updateInput({ [fieldId]: value });
}

/**
 * Recalculates all outputs based on current input
 * Uses partial calculation: computes whatever is possible
 */
export function recalculate() {
  const { input } = currentState;

  const purchaseRub = calculatePurchaseRub(input.unitPriceCny, input.cnyRubRate);
  const cargoCostRub = calculateCargoCostRub(input.unitWeightKg, input.cargoRateCnyPerKg, input.cnyRubRate);
  const insuranceRub = calculateInsuranceRub(purchaseRub, input.insuranceRate || 0);
  const totalCostRub = calculateTotalCostRub({
    purchaseRub,
    chinaDeliveryRub: input.chinaDeliveryRub || 0,
    cargoCostRub,
    insuranceRub,
    reworkRub: input.reworkRub || 0,
    packagingRub: input.packagingRub || 0
  });
  const retailPriceRub = calculateRetailPriceRub(totalCostRub, input.markupRate);
  const taxRub = calculateTaxRub(retailPriceRub, input.taxRate);
  const profitRub = calculateProfitRub(retailPriceRub, totalCostRub, taxRub);
  const marginRate = calculateMarginRate(profitRub, retailPriceRub);

  currentState.output = {
    purchaseRub,
    cargoCostRub,
    insuranceRub,
    totalCostRub,
    retailPriceRub,
    taxRub,
    profitRub,
    marginRate
  };

  const isValid = isScenarioValid(input);
  currentState.ui.hasValidCalculation = isValid;

  updateStepProgression();
}

/**
 * Update step progression based on current input
 */
function updateStepProgression() {
  const { input } = currentState;
  
  // Step 1: Complete if unit price and CNY rate are filled
  const step1Complete = input.unitPriceCny > 0 && input.cnyRubRate > 0;
  currentState.ui.steps[1].completed = step1Complete;
  
  // Unlock step 2 if step 1 is complete
  if (step1Complete) {
    currentState.ui.steps[2].unlocked = true;
  }
  
  // Step 2: Complete if weight and cargo rate are filled (CNY rate already validated in step 1)
  const step2Complete = input.unitWeightKg > 0 && input.cargoRateCnyPerKg > 0;
  currentState.ui.steps[2].completed = step2Complete;
  
  // Unlock step 3 if step 2 is complete
  if (step2Complete) {
    currentState.ui.steps[3].unlocked = true;
  }
  
  // Step 3: Always complete (optional fields)
  currentState.ui.steps[3].completed = step2Complete;
  
  // Unlock step 4 if step 3 is unlocked
  if (currentState.ui.steps[3].unlocked) {
    currentState.ui.steps[4].unlocked = true;
  }
}

/**
 * Updates UI state
 * @param {Object} updates - Partial UI updates
 * @returns {Object} - New UI state
 */
export function updateUi(updates) {
  currentState.ui = {
    ...currentState.ui,
    ...updates
  };
  
  notifyListeners();
  return getUiState();
}

/**
 * Sets the active preset ID
 * @param {string|null} presetId - Preset identifier or null
 */
export function setActivePreset(presetId) {
  currentState.ui.activePresetId = presetId;
  notifyListeners();
}

/**
 * Sets the theme
 * @param {string} theme - Theme value
 */
export function setTheme(theme) {
  currentState.ui.theme = theme;
  notifyListeners();
}

/**
 * Resets all state to initial values
 * @returns {Object} - New state
 */
export function resetState() {
  currentState = {
    input: { ...initialInputState },
    output: { ...initialOutputState },
    ui: {
      ...initialUiState,
      theme: currentState.ui.theme // Preserve theme
    }
  };
  
  notifyListeners();
  return getState();
}

/**
 * Loads a preset into the current state
 * @param {Object} preset - Preset data
 * @param {string} presetId - Preset identifier
 * @returns {Object} - New state
 */
export function loadPreset(preset, presetId) {
  currentState.input = {
    ...initialInputState,
    ...preset
  };
  
  currentState.ui.touchedFields = {};
  currentState.ui.fieldErrors = {};
  currentState.ui.activePresetId = presetId;
  
  // Recalculate
  recalculate();
  
  notifyListeners();
  return getState();
}

/**
 * Loads saved scenario into current state
 * @param {Object} scenario - Saved scenario data
 * @returns {Object} - New state
 */
export function loadSavedScenario(scenario) {
  if (!scenario) {
    return getState();
  }
  
  currentState.input = {
    ...initialInputState,
    ...scenario
  };
  
  currentState.ui.touchedFields = {};
  currentState.ui.fieldErrors = {};
  currentState.ui.activePresetId = null;
  
  // Recalculate
  recalculate();
  
  notifyListeners();
  return getState();
}

/**
 * Sets the last saved timestamp
 * @param {string} timestamp - ISO timestamp
 */
export function setLastSaved(timestamp) {
  currentState.ui.lastSavedAt = timestamp;
  notifyListeners();
}

/**
 * Subscribes to state changes
 * @param {Function} listener - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function subscribe(listener) {
  listeners.add(listener);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notifies all listeners of state change
 */
function notifyListeners() {
  const state = getState();
  listeners.forEach(listener => {
    try {
      listener(state);
    } catch (error) {
      console.error('State listener error:', error);
    }
  });
}

/**
 * Check if a step is complete (all required fields filled)
 * @param {number} stepNum - Step number (1-4)
 * @returns {boolean} - Is step complete
 */
export function isStepComplete(stepNum) {
  const { input } = currentState;
  
  const requiredFields = {
    1: ['unitPriceCny', 'cnyRubRate'],
    2: ['unitWeightKg', 'cargoRateCnyPerKg'],
    3: [],
    4: []
  };
  
  const fields = requiredFields[stepNum] || [];
  return fields.every(field => {
    const value = input[field];
    return value !== null && value !== undefined && value !== '' && value > 0;
  });
}

/**
 * Unlock a step
 * @param {number} stepNum - Step number to unlock
 */
export function unlockStep(stepNum) {
  if (currentState.ui.steps[stepNum]) {
    currentState.ui.steps[stepNum].unlocked = true;
    notifyListeners();
  }
}

/**
 * Complete a step
 * @param {number} stepNum - Step number to mark as complete
 */
export function completeStep(stepNum) {
  if (currentState.ui.steps[stepNum]) {
    currentState.ui.steps[stepNum].completed = true;
    currentState.ui.steps[stepNum].expanded = false;
    
    // Unlock next step
    const nextStep = stepNum + 1;
    if (currentState.ui.steps[nextStep]) {
      currentState.ui.steps[nextStep].unlocked = true;
      currentState.ui.activeStep = nextStep;
    }
    
    notifyListeners();
  }
}

/**
 * Expand a specific step
 * @param {number} stepNum - Step number to expand
 */
export function expandStep(stepNum) {
  // Collapse all steps
  Object.keys(currentState.ui.steps).forEach(key => {
    currentState.ui.steps[key].expanded = false;
  });
  
  // Expand target step
  if (currentState.ui.steps[stepNum]) {
    currentState.ui.steps[stepNum].expanded = true;
    currentState.ui.activeStep = stepNum;
  }
  
  notifyListeners();
}

/**
 * Gets the current calculation summary for display
 * @returns {Object} - Summary data
 */
export function getCalculationSummary() {
  const { input, output, ui } = currentState;
  
  // Find the main cost driver
  const costComponents = [
    { name: 'Закупка', value: output.purchaseRub || 0 },
    { name: 'Доставка по Китаю', value: input.chinaDeliveryRub || 0 },
    { name: 'Карго', value: output.cargoCostRub || 0 },
    { name: 'Страховка', value: output.insuranceRub || 0 },
    { name: 'Переработка', value: input.reworkRub || 0 },
    { name: 'Упаковка', value: input.packagingRub || 0 }
  ].filter(c => c.value > 0);
  
  const mainCostDriver = costComponents.length > 0
    ? costComponents.reduce((max, c) => c.value > max.value ? c : max)
    : null;
  
  // Generate summary text
  let summaryText = 'Заполните все обязательные поля для расчёта';
  
  if (ui.hasValidCalculation) {
    if (output.profitRub !== null) {
      if (output.profitRub > 0) {
        if (output.marginRate !== null && output.marginRate >= 0.3) {
          summaryText = 'Маржа выше 30% — хороший результат';
        } else if (output.marginRate !== null && output.marginRate >= 0.2) {
          summaryText = 'Маржа выше 20% — приемлемый результат';
        } else {
          summaryText = 'Маржа ниже 20% — низкая рентабельность';
        }
      } else {
        summaryText = 'Отрицательная прибыль — проверьте наценку';
      }
    }
    
    if (mainCostDriver && mainCostDriver.name !== 'Закупка') {
      const costRatio = output.totalCostRub > 0 
        ? (mainCostDriver.value / output.totalCostRub)
        : 0;
      if (costRatio > 0.15) {
        summaryText += `. Основная статья расходов (кроме закупки): ${mainCostDriver.name.toLowerCase()}`;
      }
    }
  }
  
  return {
    mainCostDriver,
    summaryText,
    costComponents,
    hasValidCalculation: ui.hasValidCalculation
  };
}

/**
 * Gets data for the visual breakdown composition bar
 * @returns {Object} - Breakdown data for visualization
 */
export function getBreakdownData() {
  const { input, output } = currentState;
  
  if (!output.totalCostRub || output.totalCostRub <= 0) {
    return null;
  }
  
  const components = [
    { id: 'purchase', label: 'Закупка', value: output.purchaseRub || 0, color: '#3b82f6' },
    { id: 'china-delivery', label: 'Доставка по Китаю', value: input.chinaDeliveryRub || 0, color: '#8b5cf6' },
    { id: 'cargo', label: 'Карго', value: output.cargoCostRub || 0, color: '#f59e0b' },
    { id: 'insurance', label: 'Страховка', value: output.insuranceRub || 0, color: '#10b981' },
    { id: 'rework', label: 'Переработка', value: input.reworkRub || 0, color: '#ef4444' },
    { id: 'packaging', label: 'Упаковка', value: input.packagingRub || 0, color: '#6b7280' }
  ];
  
  const totalWithProfit = (output.totalCostRub || 0) + (output.profitRub || 0) + (output.taxRub || 0);
  
  // Calculate percentages
  const componentsWithPercent = components
    .filter(c => c.value > 0)
    .map(c => ({
      ...c,
      percent: totalWithProfit > 0 ? (c.value / totalWithProfit) * 100 : 0
    }));
  
  // Add taxes and profit if they exist
  if (output.taxRub > 0) {
    componentsWithPercent.push({
      id: 'taxes',
      label: 'Налоги',
      value: output.taxRub,
      color: '#ec4899',
      percent: totalWithProfit > 0 ? (output.taxRub / totalWithProfit) * 100 : 0
    });
  }
  
  if (output.profitRub > 0) {
    componentsWithPercent.push({
      id: 'profit',
      label: 'Прибыль',
      value: output.profitRub,
      color: '#22c55e',
      percent: totalWithProfit > 0 ? (output.profitRub / totalWithProfit) * 100 : 0
    });
  }
  
  return {
    components: componentsWithPercent,
    total: totalWithProfit
  };
}
