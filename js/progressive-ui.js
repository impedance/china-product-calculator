/**
 * Progressive UI Controller
 * Manages step-based interface with expand/collapse, sliders, and progressive disclosure
 */

import { 
  subscribe, 
  updateInput, 
  getState,
  isStepComplete,
  unlockStep,
  completeStep
} from './state.js';

import { formatRub, formatPercent } from './formatters.js';

// Last used values storage
const LAST_USED_KEY = 'china_calc_last_used';

// Step configuration
const STEPS = {
  1: { id: 'step-1', requiredFields: ['unitPriceCny', 'cnyRubRate'] },
  2: { id: 'step-2', requiredFields: ['unitWeightKg', 'cargoRateCnyPerKg'] },
  3: { id: 'step-3', requiredFields: [] },
  4: { id: 'step-4', requiredFields: [] }
};

// DOM element references
let elements = {};

/**
 * Initialize progressive UI
 */
export function initProgressiveUI() {
  cacheElements();
  setupStepPanels();
  setupSliders();
  setupSegmentedControls();
  setupToggleSliders();
  setupLastUsedButtons();
  setupStepNavigation();
  setupInlinePreviews();
  
  // Push default control values into state
  updateInput({ markupRate: 1, taxRate: 0, insuranceRate: 0 });
  
  // Subscribe to state changes
  subscribe(updateUI);
  
  // Initial UI update
  updateUI(getState());
}

/**
 * Cache DOM element references
 */
function cacheElements() {
  // Step panels
  elements.stepPanels = {};
  for (let i = 1; i <= 4; i++) {
    elements.stepPanels[i] = document.getElementById(`step-${i}`);
  }
  
  // Step indicators
  elements.stepIndicators = document.querySelectorAll('.step-indicator');
  elements.stepConnectors = document.querySelectorAll('.step-connector');
  
  // Step CTAs
  elements.btnExpandStep2 = document.getElementById('btn-expand-step-2');
  elements.btnExpandStep3 = document.getElementById('btn-expand-step-3');
  elements.btnExpandStep4 = document.getElementById('btn-expand-step-4');
  
  // Step summaries
  elements.summaryStep1 = document.getElementById('summary-step-1');
  elements.summaryStep2 = document.getElementById('summary-step-2');
  elements.summaryStep3 = document.getElementById('summary-step-3');
  
  // Inline previews
  elements.previewUnitPrice = document.getElementById('preview-unit-price');
  
  // Sliders
  elements.markupSlider = document.getElementById('markup-slider');
  elements.markupRange = document.getElementById('markup-range');
  elements.markupRate = document.getElementById('markup-rate');
  elements.markupPresets = document.querySelectorAll('.preset-btn');
  elements.markupPreview = document.getElementById('markup-preview');
  elements.previewRetail = document.getElementById('preview-retail');
  elements.previewProfit = document.getElementById('preview-profit');
  
  // Insurance toggle slider
  elements.insuranceSlider = document.getElementById('insurance-slider');
  elements.insuranceRate = document.getElementById('insurance-rate');
  
  // Tax control
  elements.taxControl = document.getElementById('tax-control');
  elements.taxRate = document.getElementById('tax-rate');
  elements.taxRateCustom = document.getElementById('tax-rate-custom');
  elements.customTaxContainer = document.getElementById('custom-tax-container');
  
  // Last used buttons
  elements.lastUsedButtons = document.querySelectorAll('.btn-last-used');
}

/**
 * Setup step panels (expand/collapse)
 */
function setupStepPanels() {
  Object.values(elements.stepPanels).forEach(panel => {
    if (!panel) return;

    const header = panel.querySelector('.step-panel-header');
    header?.addEventListener('click', () => {
      // Collapse all other panels
      Object.values(elements.stepPanels).forEach(p => {
        if (p && p !== panel) {
          p.classList.remove('expanded');
          p.classList.add('collapsed');
        }
      });

      // Toggle current panel
      panel.classList.toggle('expanded');
      panel.classList.toggle('collapsed');
    });
  });
}

/**
 * Setup step navigation buttons
 */
function setupStepNavigation() {
  elements.btnExpandStep2?.addEventListener('click', () => expandStep(2));
  elements.btnExpandStep3?.addEventListener('click', () => expandStep(3));
  elements.btnExpandStep4?.addEventListener('click', () => expandStep(4));
}

/**
 * Expand a specific step
 */
function expandStep(stepNum) {
  // Mark previous step as complete
  if (stepNum > 1) {
    const prevPanel = elements.stepPanels[stepNum - 1];
    if (prevPanel) {
      prevPanel.classList.add('completed');
      prevPanel.classList.remove('expanded');
      prevPanel.classList.add('collapsed');
    }
  }
  
  // Unlock and expand target step
  const targetPanel = elements.stepPanels[stepNum];
  if (targetPanel) {
    targetPanel.classList.remove('locked');
    targetPanel.classList.remove('collapsed');
    targetPanel.classList.add('expanded');
    targetPanel.classList.add('ready');
    
    // Remove ready state after animation
    setTimeout(() => {
      targetPanel.classList.remove('ready');
    }, 2000);
  }
  
  // Update step indicators
  updateStepIndicators(stepNum);
  
  // Scroll to target step
  setTimeout(() => {
    targetPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/**
 * Update step indicator states
 */
function updateStepIndicators(activeStep) {
  elements.stepIndicators.forEach(indicator => {
    const step = parseInt(indicator.dataset.step);
    indicator.classList.remove('active', 'completed', 'ready');
    
    if (step < activeStep) {
      indicator.classList.add('completed');
    } else if (step === activeStep) {
      indicator.classList.add('active');
    } else if (step === activeStep + 1) {
      indicator.classList.add('ready');
    }
  });
  
  // Update connectors
  elements.stepConnectors.forEach(connector => {
    const from = parseInt(connector.dataset.from);
    connector.classList.toggle('completed', from < activeStep);
  });
}

/**
 * Setup markup range slider
 */
function setupSliders() {
  if (!elements.markupSlider || !elements.markupRange) return;
  
  const sliderFill = elements.markupSlider.querySelector('.slider-fill');
  const sliderThumb = elements.markupSlider.querySelector('.slider-thumb');
  
  const updateSlider = (value) => {
    const percent = (value / 300) * 100;
    sliderFill.style.width = `${percent}%`;
    sliderThumb.style.left = `${percent}%`;
    elements.markupRate.value = value;
    
    // Update active preset
    elements.markupPresets.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.value) === parseInt(value));
    });
    
    // Update state
    updateInput({ markupRate: value / 100 });
    
    // Save last used
    saveLastUsed('markupRate', value / 100);
  };
  
  elements.markupRange.addEventListener('input', (e) => {
    updateSlider(parseInt(e.target.value));
  });
  
  elements.markupRate.addEventListener('input', (e) => {
    let value = parseInt(e.target.value) || 0;
    value = Math.max(0, Math.min(300, value));
    elements.markupRange.value = value;
    updateSlider(value);
  });
  
  // Preset buttons
  elements.markupPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      const value = parseInt(btn.dataset.value);
      elements.markupRange.value = value;
      updateSlider(value);
    });
  });
}

/**
 * Setup insurance toggle slider
 */
function setupToggleSliders() {
  if (!elements.insuranceSlider) return;
  
  const options = elements.insuranceSlider.querySelectorAll('.toggle-option');
  const thumb = elements.insuranceSlider.querySelector('.toggle-thumb');
  const values = elements.insuranceSlider.dataset.values.split(',').map(Number);
  const defaultValue = parseInt(elements.insuranceSlider.dataset.default);
  
  let currentValue = defaultValue;
  
  const updateToggle = (value) => {
    currentValue = value;
    const index = values.indexOf(value);
    const optionWidth = 100 / values.length;
    
    // Update thumb position
    thumb.style.width = `${optionWidth}%`;
    thumb.style.left = `${index * optionWidth}%`;
    
    // Update active option
    options.forEach((opt, i) => {
      opt.classList.toggle('active', i === index);
    });
    
    // Update hidden input and state
    elements.insuranceRate.value = value;
    updateInput({ insuranceRate: value / 100 });
    
    // Save last used
    saveLastUsed('insuranceRate', value / 100);
  };
  
  options.forEach((option, index) => {
    option.addEventListener('click', () => {
      updateToggle(values[index]);
    });
  });
  
  // Initialize
  updateToggle(defaultValue);
}

/**
 * Setup tax rate segmented control
 */
function setupSegmentedControls() {
  if (!elements.taxControl) return;
  
  const buttons = elements.taxControl.querySelectorAll('.segment-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const isCustom = btn.dataset.custom === 'true';
      
      if (isCustom) {
        // Show custom input
        elements.customTaxContainer.style.display = 'block';
        elements.taxRateCustom?.focus();
        
        // Remove active from others
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } else {
        // Hide custom input
        elements.customTaxContainer.style.display = 'none';
        
        // Update active state
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update state
        const value = parseFloat(btn.dataset.value);
        elements.taxRate.value = value;
        updateInput({ taxRate: value });
        
        // Save last used
        saveLastUsed('taxRate', value);
      }
    });
  });
  
  // Custom tax input
  elements.taxRateCustom?.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      const rate = value > 1 ? value / 100 : value;
      elements.taxRate.value = rate;
      updateInput({ taxRate: rate });
      saveLastUsed('taxRate', rate);
    }
  });
}

/**
 * Setup last used buttons
 */
function setupLastUsedButtons() {
  elements.lastUsedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const fieldId = btn.dataset.field;
      const lastValue = getLastUsed(fieldId);
      
      if (lastValue !== null) {
        // Find the input element
        const inputId = getInputElementId(fieldId);
        const input = document.getElementById(inputId);
        
        if (input) {
          input.value = lastValue;
          input.dispatchEvent(new Event('input'));
        }
      }
    });
  });
}

/**
 * Setup inline previews
 */
function setupInlinePreviews() {
  // Step 1 previews
  const unitPriceInput = document.getElementById('unit-price-cny');
  const cnyRateInput = document.getElementById('cny-rub-rate');
  
  const updateStep1Preview = () => {
    const unitPrice = parseFloat(unitPriceInput?.value) || 0;
    const cnyRate = parseFloat(cnyRateInput?.value) || 0;
    
    if (elements.previewUnitPrice) {
      const purchaseRub = unitPrice * cnyRate;
      elements.previewUnitPrice.querySelector('.preview-value').textContent = 
        purchaseRub > 0 ? formatRub(purchaseRub) : '—';
    }
    
    // Enable/disable CTA
    if (elements.btnExpandStep2) {
      const isValid = unitPrice > 0 && cnyRate > 0;
      elements.btnExpandStep2.disabled = !isValid;
      
      if (isValid) {
        elements.btnExpandStep2.classList.add('pulse');
        setTimeout(() => elements.btnExpandStep2.classList.remove('pulse'), 1500);
      }
    }
  };
  
  unitPriceInput?.addEventListener('input', updateStep1Preview);
  cnyRateInput?.addEventListener('input', updateStep1Preview);
}

/**
 * Update UI based on state
 */
function updateUI(state) {
  const { input, output } = state;
  
  // Update step 1 summary
  const summaryPurchase = document.getElementById('summary-purchase');
  if (summaryPurchase) {
    summaryPurchase.textContent = output.purchaseRub !== null 
      ? formatRub(output.purchaseRub) 
      : '—';
  }
  
  // Update step 2 summary
  const summaryCargo = document.getElementById('summary-cargo');
  const summaryTotalCost2 = document.getElementById('summary-total-cost-2');
  if (summaryCargo) {
    summaryCargo.textContent = output.cargoCostRub !== null 
      ? formatRub(output.cargoCostRub) 
      : '—';
  }
  if (summaryTotalCost2) {
    const step2Total = (output.purchaseRub || 0) + (output.cargoCostRub || 0) + 
                       (input.chinaDeliveryRub || 0) + (output.insuranceRub || 0);
    summaryTotalCost2.textContent = step2Total > 0 ? formatRub(step2Total) : '—';
  }
  
  // Update step 3 summary
  const summaryFinalCost = document.getElementById('summary-final-cost');
  if (summaryFinalCost) {
    summaryFinalCost.textContent = output.totalCostRub !== null 
      ? formatRub(output.totalCostRub) 
      : '—';
  }
  
  // Update markup slider preview
  if (elements.previewRetail && elements.previewProfit) {
    elements.previewRetail.textContent = output.retailPriceRub !== null 
      ? formatRub(output.retailPriceRub) 
      : '—';
    elements.previewProfit.textContent = output.profitRub !== null 
      ? formatRub(output.profitRub) 
      : '—';
  }
  
  // Check step unlock conditions
  checkStepUnlockConditions(input, output);
}

/**
 * Check and update step unlock conditions
 */
function checkStepUnlockConditions(input, output) {
  // Step 2: Unlock if step 1 has valid inputs
  const step1Valid = input.unitPriceCny > 0 && input.cnyRubRate > 0;
  if (step1Valid && elements.stepPanels[2]?.classList.contains('locked')) {
    elements.stepPanels[2].classList.remove('locked');
    elements.stepPanels[2].classList.add('ready');
    elements.stepIndicators[1]?.classList.add('ready');
  }
  
  // Step 3: Unlock if step 2 has valid inputs
  const step2Valid = input.unitWeightKg > 0 && input.cargoRateCnyPerKg > 0;
  if (step2Valid && elements.stepPanels[3]?.classList.contains('locked')) {
    elements.stepPanels[3].classList.remove('locked');
    elements.stepPanels[3].classList.add('ready');
  }
  
  // Step 4: Unlock when step 2 is complete (step 3 has no required fields)
  const step2Complete = input.unitWeightKg > 0 && input.cargoRateCnyPerKg > 0;
  if (step2Complete && elements.stepPanels[4]?.classList.contains('locked')) {
    elements.stepPanels[4].classList.remove('locked');
    elements.stepPanels[4].classList.add('ready');
  }
}

/**
 * Get input element ID from field ID
 */
function getInputElementId(fieldId) {
  const mapping = {
    unitPriceCny: 'unit-price-cny',
    cnyRubRate: 'cny-rub-rate',
    unitWeightKg: 'unit-weight',
    cargoRateCnyPerKg: 'cargo-rate-cny',
    chinaDeliveryRub: 'china-delivery-rub',
    insuranceRate: 'insurance-rate',
    reworkRub: 'rework-rub',
    packagingRub: 'packaging-rub',
    markupRate: 'markup-rate',
    taxRate: 'tax-rate'
  };
  return mapping[fieldId] || fieldId;
}

/**
 * Save last used value to localStorage
 */
function saveLastUsed(fieldId, value) {
  try {
    const lastUsed = JSON.parse(localStorage.getItem(LAST_USED_KEY) || '{}');
    lastUsed[fieldId] = { value, timestamp: Date.now() };
    localStorage.setItem(LAST_USED_KEY, JSON.stringify(lastUsed));
  } catch (e) {
    console.error('Failed to save last used:', e);
  }
}

/**
 * Get last used value from localStorage
 */
function getLastUsed(fieldId) {
  try {
    const lastUsed = JSON.parse(localStorage.getItem(LAST_USED_KEY) || '{}');
    const entry = lastUsed[fieldId];
    return entry ? entry.value : null;
  } catch (e) {
    return null;
  }
}

/**
 * Load all last used values into inputs
 */
export function loadLastUsedValues() {
  const fields = ['unitPriceCny', 'cnyRubRate', 'cargoRateCnyPerKg', 
                  'chinaDeliveryRub', 'insuranceRate', 'reworkRub', 'packagingRub'];
  
  fields.forEach(fieldId => {
    const value = getLastUsed(fieldId);
    if (value !== null) {
      const inputId = getInputElementId(fieldId);
      const input = document.getElementById(inputId);
      if (input && !input.value) {
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }
    }
  });
}

/**
 * Get all last used values for initialization
 */
export function getAllLastUsed() {
  try {
    return JSON.parse(localStorage.getItem(LAST_USED_KEY) || '{}');
  } catch (e) {
    return {};
  }
}
