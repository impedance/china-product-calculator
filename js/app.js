/**
 * App - Main application entry point
 * Wires input events, button actions, render cycle
 */

import { 
  subscribe, 
  updateInput, 
  resetState, 
  loadPreset as loadStatePreset, 
  loadSavedScenario,
  getCalculationSummary,
  getBreakdownData,
  setLastSaved,
  isStepComplete,
  unlockStep,
  completeStep,
  expandStep
} from './state.js';

import { 
  formatRub, 
  formatPercent,
  parseNumber
} from './formatters.js';

import { 
  loadScenario, 
  getLastSavedAt 
} from './storage.js';

import { 
  initTheme, 
  setupThemeListeners 
} from './theme.js';

import { 
  getPreset, 
  getPresetDescription 
} from './example-data.js';

import {
  getMissingRequiredFields,
  getFieldIdFromElementId,
  getInputElementId
} from './validation.js';

import {
  initProgressiveUI,
  loadLastUsedValues
} from './progressive-ui.js';

import {
  fetchCnyRate,
  formatEffectiveDate
} from './exchange-rate.js';

// DOM element references
const elements = {};

/**
 * Cache DOM element references
 */
function cacheElements() {
  // Header
  elements.toast = document.getElementById('toast');
  
  // Action buttons
  elements.btnExampleA = document.getElementById('btn-example-a');
  elements.btnExampleB = document.getElementById('btn-example-b');
  elements.btnCalculate = document.getElementById('btn-calculate');
  elements.btnReset = document.getElementById('btn-reset');
  elements.btnHelp = document.getElementById('btn-help');
  
  // KPI cards
  elements.kpiTotalCost = document.getElementById('kpi-total-cost');
  elements.kpiRetailPrice = document.getElementById('kpi-retail-price');
  elements.kpiProfit = document.getElementById('kpi-profit');
  elements.kpiMargin = document.getElementById('kpi-margin');
  elements.kpiTaxes = document.getElementById('kpi-taxes');
  
  // Input fields
  elements.inputs = {
    productName: document.getElementById('product-name'),
    sku: document.getElementById('sku'),
    unitPriceCny: document.getElementById('unit-price-cny'),
    cnyRubRate: document.getElementById('cny-rub-rate'),
    chinaDeliveryRub: document.getElementById('china-delivery-rub'),
    densityKgM3: document.getElementById('density'),
    cargoRateCnyPerKg: document.getElementById('cargo-rate-cny'),
    unitWeightKg: document.getElementById('unit-weight'),
    insuranceRate: document.getElementById('insurance-rate'),
    reworkRub: document.getElementById('rework-rub'),
    packagingRub: document.getElementById('packaging-rub'),
    markupRate: document.getElementById('markup-rate'),
    taxRate: document.getElementById('tax-rate')
  };
  
  // Error messages
  elements.errors = {
    unitPriceCny: document.getElementById('error-unit-price-cny'),
    cnyRubRate: document.getElementById('error-cny-rub-rate'),
    chinaDeliveryRub: document.getElementById('error-china-delivery-rub'),
    cargoRateCnyPerKg: document.getElementById('error-cargo-rate-cny'),
    unitWeightKg: document.getElementById('error-unit-weight'),
    insuranceRate: document.getElementById('error-insurance-rate'),
    reworkRub: document.getElementById('error-rework-rub'),
    packagingRub: document.getElementById('error-packaging-rub'),
    markupRate: document.getElementById('error-markup-rate'),
    taxRate: document.getElementById('error-tax-rate')
  };
  
  // Result fields
  elements.results = {
    purchaseRub: document.getElementById('result-purchase'),
    cargoCostRub: document.getElementById('result-cargo'),
    insuranceRub: document.getElementById('result-insurance'),
    totalCostRub: document.getElementById('result-total-cost'),
    retailPriceRub: document.getElementById('result-retail'),
    taxRub: document.getElementById('result-taxes'),
    profitRub: document.getElementById('result-profit'),
    marginRate: document.getElementById('result-margin')
  };
  
  // Breakdown visualization
  elements.compositionBar = document.getElementById('composition-bar');
  elements.breakdownLegend = document.getElementById('breakdown-legend');
  elements.summaryText = document.getElementById('summary-text');
  
  // Bottom sheet
  elements.bottomSheetOverlay = document.getElementById('bottom-sheet-overlay');
  elements.sheetTitle = document.getElementById('sheet-title');
  elements.sheetContent = document.getElementById('sheet-content');
  elements.sheetClose = document.getElementById('sheet-close');
  
  // Step panels for progressive UI
  elements.stepPanels = {};
  for (let i = 1; i <= 4; i++) {
    elements.stepPanels[i] = document.getElementById(`step-${i}`);
  }
  elements.stepIndicators = document.querySelectorAll('.step-indicator');
  elements.stepConnectors = document.querySelectorAll('.step-connector');
  elements.btnExpandStep2 = document.getElementById('btn-expand-step-2');
  elements.btnExpandStep3 = document.getElementById('btn-expand-step-3');
  elements.btnExpandStep4 = document.getElementById('btn-expand-step-4');
  elements.resultsPanel = document.getElementById('section-results');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Input field change listeners
  Object.entries(elements.inputs).forEach(([fieldId, input]) => {
    if (!input) return;
    
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      const parsedValue = parseNumber(value);
      updateInput({ [fieldId]: parsedValue });
    });
    
    // Handle blur for validation display
    input.addEventListener('blur', (e) => {
      const value = e.target.value;
      const parsedValue = parseNumber(value);
      updateInput({ [fieldId]: parsedValue });
    });
  });
  
  // Button listeners
  elements.btnExampleA?.addEventListener('click', () => loadExample('example-a'));
  elements.btnExampleB?.addEventListener('click', () => loadExample('example-b'));
  elements.btnCalculate?.addEventListener('click', handleCalculate);
  elements.btnReset?.addEventListener('click', handleReset);
  elements.btnHelp?.addEventListener('click', showHelpSheet);
  
  // Bottom sheet close
  elements.sheetClose?.addEventListener('click', closeBottomSheet);
  elements.bottomSheetOverlay?.addEventListener('click', (e) => {
    if (e.target === elements.bottomSheetOverlay) {
      closeBottomSheet();
    }
  });
  
  // Step panel accordion toggle
  Object.entries(elements.stepPanels).forEach(([stepNum, panel]) => {
    if (!panel) return;
    const header = panel.querySelector('.step-panel-header');
    header?.addEventListener('click', () => {
      if (panel.classList.contains('locked')) return;
      
      // Collapse all panels
      Object.values(elements.stepPanels).forEach(p => {
        if (p) {
          p.classList.remove('expanded');
          p.classList.add('collapsed');
        }
      });
      
      // Expand clicked panel
      panel.classList.add('expanded');
      panel.classList.remove('collapsed');
      
      // Update active step in state
      expandStep(parseInt(stepNum));
    });
  });
  
  // Step CTA buttons
  elements.btnExpandStep2?.addEventListener('click', () => expandStepPanel(2));
  elements.btnExpandStep3?.addEventListener('click', () => expandStepPanel(3));
  elements.btnExpandStep4?.addEventListener('click', () => expandStepPanel(4));
  
  // Step indicator clicks
  elements.stepIndicators?.forEach(indicator => {
    indicator.addEventListener('click', () => {
      const stepNum = parseInt(indicator.dataset.step);
      const panel = elements.stepPanels[stepNum];
      if (panel && !panel.classList.contains('locked')) {
        expandStepPanel(stepNum);
      }
    });
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBottomSheet();
    }
  });
}

/**
 * Load example preset
 */
function loadExample(presetId) {
  const preset = getPreset(presetId);
  if (!preset) return;
  
  loadStatePreset(preset, presetId);
  showToast(`Загружен ${getPresetDescription(presetId)}`);
  
  // Scroll to results
  setTimeout(() => {
    elements.kpiTotalCost?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

/**
 * Handle calculate button click
 */
function handleCalculate() {
  const { input } = subscribe(() => {})(); // Get current state
  const missing = getMissingRequiredFields(input);
  
  if (missing.length > 0) {
    showMissingFieldsSheet(missing);
  } else {
    // Scroll to results and pulse KPI cards
    elements.kpiTotalCost?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
      pulseKpiCards();
    }, 300);
  }
}

/**
 * Expand a specific step panel
 */
function expandStepPanel(stepNum) {
  // Mark previous steps as complete
  for (let i = 1; i < stepNum; i++) {
    const panel = elements.stepPanels[i];
    if (panel) {
      panel.classList.add('completed');
      panel.classList.remove('expanded');
      panel.classList.add('collapsed');
    }
  }
  
  // Update step indicators
  elements.stepIndicators?.forEach(indicator => {
    const indicatorStep = parseInt(indicator.dataset.step);
    indicator.classList.remove('active', 'completed', 'ready');
    
    if (indicatorStep < stepNum) {
      indicator.classList.add('completed');
    } else if (indicatorStep === stepNum) {
      indicator.classList.add('active');
    }
  });
  
  // Update connectors
  elements.stepConnectors?.forEach(connector => {
    const from = parseInt(connector.dataset.from);
    connector.classList.toggle('completed', from < stepNum);
  });
  
  // Unlock and expand target step
  const targetPanel = elements.stepPanels[stepNum];
  if (targetPanel) {
    targetPanel.classList.remove('locked', 'collapsed');
    targetPanel.classList.add('expanded', 'ready');
    
    setTimeout(() => targetPanel.classList.remove('ready'), 2000);
  }
  
  // Update state
  completeStep(stepNum - 1);
  expandStep(stepNum);
  
  // Scroll to target
  setTimeout(() => {
    targetPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/**
 * Pulse animation for KPI cards
 */
function pulseKpiCards() {
  const cards = [
    elements.kpiTotalCost,
    elements.kpiRetailPrice,
    elements.kpiProfit,
    elements.kpiMargin,
    elements.kpiTaxes
  ];
  
  cards.forEach((card, index) => {
    if (!card) return;
    setTimeout(() => {
      card.classList.add('pulse');
      setTimeout(() => card.classList.remove('pulse'), 600);
    }, index * 50);
  });
}

/**
 * Handle reset button click
 */
function handleReset() {
  if (confirm('Очистить все данные?')) {
    resetState();
    
    // Clear input fields
    Object.values(elements.inputs).forEach(input => {
      if (input) input.value = '';
    });
    
    // Collapse results section
    const resultsPanel = elements.resultsPanel;
    if (resultsPanel) {
      resultsPanel.classList.remove('expanded');
      resultsPanel.classList.add('collapsed');
    }
    
    showToast('Данные очищены');
  }
}

/**
 * Show missing fields checklist in bottom sheet
 */
function showMissingFieldsSheet(missingFields) {
  if (!elements.sheetTitle || !elements.sheetContent) return;
  
  elements.sheetTitle.textContent = 'Что нужно заполнить';
  
  const list = document.createElement('ul');
  list.className = 'checklist';
  
  missingFields.forEach(field => {
    const item = document.createElement('li');
    item.className = 'checklist-item';
    item.innerHTML = `
      <span class="checklist-icon">!</span>
      <span class="checklist-text">${field.label}</span>
    `;
    
    item.addEventListener('click', () => {
      closeBottomSheet();
      const inputId = getInputElementId(field.fieldId);
      const input = document.getElementById(inputId);
      input?.focus();
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    list.appendChild(item);
  });
  
  elements.sheetContent.innerHTML = '';
  elements.sheetContent.appendChild(list);
  
  openBottomSheet();
}

/**
 * Show help content in bottom sheet
 */
function showHelpSheet() {
  if (!elements.sheetTitle || !elements.sheetContent) return;
  
  elements.sheetTitle.textContent = 'Справка';
  
  elements.sheetContent.innerHTML = `
    <div class="help-content">
      <p><strong>Формулы расчёта:</strong></p>
      <ul>
        <li>Закупка в ₽ = Цена (CNY) × Курс CNY/RUB</li>
        <li>Стоимость карго = Вес × Ставка (¥/кг) × Курс CNY/RUB</li>
        <li>Страховка = Закупка × Страховка %</li>
        <li>Себестоимость = Закупка + Доставка по Китаю + Карго + Страховка + Переработка + Упаковка</li>
        <li>Цена продажи = Себестоимость × (1 + Наценка %)</li>
        <li>Налоги = Цена продажи × Налог %</li>
        <li>Прибыль = Цена продажи − Себестоимость − Налоги</li>
        <li>Маржа = Прибыль / Цена продажи</li>
      </ul>
      
      <p><strong>Процентные поля:</strong></p>
      <ul>
        <li>Можно ввести <code>6</code> или <code>0.06</code> — оба варианта равны 6%</li>
        <li>Можно ввести <code>100</code> или <code>1.0</code> — оба варианта равны 100%</li>
      </ul>
      
      <p><strong>Примечания:</strong></p>
      <ul>
        <li>Плотность (кг/м³) сохраняется, но не используется в расчётах MVP</li>
        <li>Все данные сохраняются локально в браузере</li>
      </ul>
    </div>
  `;
  
  openBottomSheet();
}

/**
 * Open bottom sheet
 */
function openBottomSheet() {
  elements.bottomSheetOverlay?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Close bottom sheet
 */
function closeBottomSheet() {
  elements.bottomSheetOverlay?.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'default') {
  if (!elements.toast) return;
  
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.add('show');
  
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

/**
 * Render the current state to the UI
 */
function render(state) {
  const { input, output, ui } = state;
  
  // Update input fields (only if not focused to avoid cursor jumping)
  Object.entries(elements.inputs).forEach(([fieldId, inputEl]) => {
    if (!inputEl || document.activeElement === inputEl) return;
    
    const value = input[fieldId];
    if (value !== null && value !== undefined) {
      inputEl.value = value;
    } else {
      inputEl.value = '';
    }
  });
  
  // Sync markup slider with state
  const markupRange = document.getElementById('markup-range');
  const markupFill = document.querySelector('#markup-slider .slider-fill');
  const markupThumb = document.querySelector('#markup-slider .slider-thumb');
  if (input.markupRate !== null && markupRange) {
    const pct = Math.min(300, Math.max(0, (input.markupRate || 0) * 100));
    markupRange.value = pct;
    if (markupFill) markupFill.style.width = `${(pct / 300) * 100}%`;
    if (markupThumb) markupThumb.style.left = `${(pct / 300) * 100}%`;
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.value) === pct);
    });
  }
  
  // Sync tax segmented control with state
  const taxRate = input.taxRate;
  if (taxRate !== null) {
    const taxBtns = document.querySelectorAll('#tax-control .segment-btn');
    const knownRates = [0, 0.06, 0.07, 0.15, 0.20];
    const isKnown = knownRates.includes(taxRate);
    taxBtns.forEach(btn => {
      const btnVal = parseFloat(btn.dataset.value);
      const isCustom = btn.dataset.custom === 'true';
      btn.classList.toggle('active', isKnown && btnVal === taxRate);
    });
    const customContainer = document.getElementById('custom-tax-container');
    if (customContainer) {
      customContainer.style.display = isKnown ? 'none' : 'block';
      if (!isKnown && taxRate !== null) {
        const customInput = document.getElementById('tax-rate-custom');
        if (customInput) customInput.value = Math.round(taxRate * 10000) / 100;
      }
    }
  }
  
  // Update error messages
  Object.entries(elements.errors).forEach(([fieldId, errorEl]) => {
    if (!errorEl) return;
    
    const error = ui.fieldErrors[fieldId];
    if (error && ui.touchedFields[fieldId]) {
      errorEl.style.display = 'flex';
      errorEl.innerHTML = `<span>⚠</span> ${error}`;
      elements.inputs[fieldId]?.classList.add('error');
    } else {
      errorEl.style.display = 'none';
      elements.inputs[fieldId]?.classList.remove('error');
    }
  });
  
  // Update KPI cards
  updateKpiCard(elements.kpiTotalCost, output.totalCostRub, formatRub);
  updateKpiCard(elements.kpiRetailPrice, output.retailPriceRub, formatRub);
  
  const profitClass = (output.profitRub || 0) >= 0 ? 'profit' : 'cost';
  updateKpiCard(elements.kpiProfit, output.profitRub, formatRub, profitClass);
  
  const marginClass = (output.marginRate || 0) >= 0.2 ? 'profit' : '';
  updateKpiCard(elements.kpiMargin, output.marginRate, formatPercent.bind(null, undefined, 1), marginClass);
  
  updateKpiCard(elements.kpiTaxes, output.taxRub, formatRub, 'cost');
  
  // Update result details
  if (elements.results.purchaseRub) {
    elements.results.purchaseRub.textContent = formatRub(output.purchaseRub);
    elements.results.purchaseRub.className = `result-value ${output.purchaseRub === null ? 'empty' : ''}`;
  }
  
  if (elements.results.cargoCostRub) {
    elements.results.cargoCostRub.textContent = formatRub(output.cargoCostRub);
    elements.results.cargoCostRub.className = `result-value ${output.cargoCostRub === null ? 'empty' : ''}`;
  }
  
  if (elements.results.insuranceRub) {
    elements.results.insuranceRub.textContent = formatRub(output.insuranceRub);
    elements.results.insuranceRub.className = `result-value ${output.insuranceRub === null ? 'empty' : ''}`;
  }
  
  if (elements.results.totalCostRub) {
    elements.results.totalCostRub.textContent = formatRub(output.totalCostRub);
    elements.results.totalCostRub.className = `result-value ${output.totalCostRub === null ? 'empty' : ''}`;
  }
  
  if (elements.results.retailPriceRub) {
    elements.results.retailPriceRub.textContent = formatRub(output.retailPriceRub);
    elements.results.retailPriceRub.className = `result-value ${output.retailPriceRub === null ? 'empty' : ''}`;
  }
  
  if (elements.results.taxRub) {
    elements.results.taxRub.textContent = formatRub(output.taxRub);
    elements.results.taxRub.className = `result-value ${output.taxRub === null ? 'empty' : ''}`;
  }
  
  if (elements.results.profitRub) {
    elements.results.profitRub.textContent = formatRub(output.profitRub);
    elements.results.profitRub.className = `result-value ${output.profitRub === null ? 'empty' : ''}`;
  }
  
  if (elements.results.marginRate) {
    elements.results.marginRate.textContent = formatPercent(output.marginRate, 1);
    elements.results.marginRate.className = `result-value ${output.marginRate === null ? 'empty' : ''}`;
  }
  
  // Update breakdown visualization
  updateBreakdownVisualization();
  
  // Update summary text
  const summary = getCalculationSummary();
  if (elements.summaryText) {
    elements.summaryText.textContent = summary.summaryText;
  }
  
  // Update step panel states based on current state
  updateStepPanelStates(input, output, ui);
  
  // Auto-expand results section when there are computed values
  const hasAnyResult = output.purchaseRub !== null;
  const resultsPanel = elements.resultsPanel;
  if (resultsPanel && hasAnyResult && resultsPanel.classList.contains('collapsed') && !resultsPanel.classList.contains('locked')) {
    resultsPanel.classList.remove('collapsed');
    resultsPanel.classList.add('expanded');
  }
}

/**
 * Update step panel states based on current state
 */
function updateStepPanelStates(input, output, ui) {
  // Check step completion
  const step1Complete = input.unitPriceCny > 0 && input.cnyRubRate > 0;
  const step2Complete = input.unitWeightKg > 0 && input.cargoRateCnyPerKg > 0;
  const step3Complete = output.totalCostRub !== null;
  const step4Complete = output.retailPriceRub !== null;
  
  // Update step 1
  const panel1 = elements.stepPanels[1];
  if (panel1) {
    panel1.classList.toggle('completed', step1Complete);
    elements.stepIndicators[0]?.classList.toggle('completed', step1Complete);
  }
  
  // Unlock step 2
  const panel2 = elements.stepPanels[2];
  if (panel2 && step1Complete) {
    panel2.classList.remove('locked');
    panel2.classList.toggle('completed', step2Complete);
    elements.stepIndicators[1]?.classList.remove('locked');
    elements.stepIndicators[1]?.classList.toggle('completed', step2Complete);
    elements.stepConnectors[0]?.classList.toggle('completed', step1Complete);
    
    // Enable CTA button
    if (elements.btnExpandStep2) {
      elements.btnExpandStep2.disabled = false;
    }
  }
  
  // Unlock step 3
  const panel3 = elements.stepPanels[3];
  if (panel3 && step2Complete) {
    panel3.classList.remove('locked');
    panel3.classList.toggle('completed', step3Complete);
    elements.stepIndicators[2]?.classList.remove('locked');
    elements.stepIndicators[2]?.classList.toggle('completed', step3Complete);
    elements.stepConnectors[1]?.classList.toggle('completed', step2Complete);
  }
  
  // Unlock step 4 once steps 1+2 are done (step 3 has no required fields)
  const panel4 = elements.stepPanels[4];
  if (panel4 && step2Complete) {
    panel4.classList.remove('locked');
    panel4.classList.toggle('completed', step4Complete);
    elements.stepIndicators[3]?.classList.remove('locked');
    elements.stepIndicators[3]?.classList.toggle('completed', step4Complete);
    elements.stepConnectors[2]?.classList.toggle('completed', step2Complete);
  }
  
  // Update step summaries
  const summaryPurchase = document.getElementById('summary-purchase');
  if (summaryPurchase) {
    summaryPurchase.textContent = output.purchaseRub !== null ? formatRub(output.purchaseRub) : '—';
  }
  
  const summaryCargo = document.getElementById('summary-cargo');
  const summaryTotalCost2 = document.getElementById('summary-total-cost-2');
  if (summaryCargo) {
    summaryCargo.textContent = output.cargoCostRub !== null ? formatRub(output.cargoCostRub) : '—';
  }
  if (summaryTotalCost2) {
    const step2Total = (output.purchaseRub || 0) + (output.cargoCostRub || 0) + (input.chinaDeliveryRub || 0);
    summaryTotalCost2.textContent = step2Total > 0 ? formatRub(step2Total) : '—';
  }
  
  const summaryFinalCost = document.getElementById('summary-final-cost');
  if (summaryFinalCost) {
    summaryFinalCost.textContent = output.totalCostRub !== null ? formatRub(output.totalCostRub) : '—';
  }
  
  // Update inline previews
  const previewUnitPrice = document.getElementById('preview-unit-price');
  if (previewUnitPrice) {
    const purchaseRub = (input.unitPriceCny || 0) * (input.cnyRubRate || 0);
    previewUnitPrice.querySelector('.preview-value').textContent = purchaseRub > 0 ? formatRub(purchaseRub) : '—';
  }
}

/**
 * Update a single KPI card
 */
function updateKpiCard(card, value, formatter, extraClass = '') {
  if (!card) return;
  
  const valueEl = card.querySelector('.kpi-value');
  if (!valueEl) return;
  
  if (value === null || value === undefined) {
    valueEl.textContent = '—';
    valueEl.className = 'kpi-value empty';
  } else {
    valueEl.textContent = formatter(value);
    valueEl.className = `kpi-value ${extraClass}`;
  }
}

/**
 * Update breakdown visualization
 */
function updateBreakdownVisualization() {
  const breakdownData = getBreakdownData();
  
  if (!elements.compositionBar || !elements.breakdownLegend) return;
  
  if (!breakdownData) {
    elements.compositionBar.innerHTML = '';
    elements.breakdownLegend.innerHTML = '';
    return;
  }
  
  // Build composition bar
  elements.compositionBar.innerHTML = '';
  breakdownData.components.forEach(component => {
    if (component.percent < 1) return; // Skip very small segments
    
    const segment = document.createElement('div');
    segment.className = `composition-segment ${component.id}`;
    segment.style.width = `${component.percent}%`;
    segment.title = `${component.label}: ${formatRub(component.value)} (${formatPercent(component.percent / 100, 1)})`;
    elements.compositionBar.appendChild(segment);
  });
  
  // Build legend
  elements.breakdownLegend.innerHTML = '';
  breakdownData.components.forEach(component => {
    if (component.percent < 1) return;
    
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-color" style="background-color: ${component.color}"></span>
      <span>${component.label}: ${formatRub(component.value)}</span>
    `;
    elements.breakdownLegend.appendChild(item);
  });
}

/**
 * Initialize the application
 */
async function init() {
  // Cache DOM elements
  cacheElements();
  
  // Setup theme
  initTheme();
  setupThemeListeners();
  
  // Initialize progressive UI
  initProgressiveUI();
  
  // Subscribe to state changes
  subscribe(render);
  
  // Setup event listeners
  setupEventListeners();
  
  // Try to load saved scenario
  const savedScenario = loadScenario();
  if (savedScenario) {
    loadSavedScenario(savedScenario);
    const lastSaved = getLastSavedAt();
    if (lastSaved) {
      setLastSaved(lastSaved);
    }
  }
  
  // Load last used values
  loadLastUsedValues();
  
  // Fetch CNY exchange rate from CBR API
  // This will always update the rate (overriding any saved value)
  await loadExchangeRate();
  
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('[App] Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.error('[App] Service Worker registration failed:', error);
      });
  }
  
  console.log('[App] China Product Calculator initialized with progressive UI');
}

/**
 * Fetch and apply CNY exchange rate
 */
async function loadExchangeRate() {
  try {
    const result = await fetchCnyRate();
    
    if (result !== null) {
      // Apply the fetched rate to state
      updateInput({ cnyRubRate: result.rate });
      
      // Update UI indicator
      updateRateSourceIndicator(result);
      
      console.log(`[App] Exchange rate updated: ${result.rate} (${result.source})`);
    } else {
      // Use default rate if fetch failed and no cache available
      updateInput({ cnyRubRate: 13.5 });
      updateRateSourceIndicator({ rate: 13.5, source: 'default', effectiveDate: null });
      
      console.log('[App] Using default exchange rate: 13.5');
    }
  } catch (error) {
    console.error('[App] Failed to load exchange rate:', error);
    
    // Fallback to default
    updateInput({ cnyRubRate: 13.5 });
    updateRateSourceIndicator({ rate: 13.5, source: 'default', effectiveDate: null });
  }
}

/**
 * Update the rate source indicator in UI
 */
function updateRateSourceIndicator(result) {
  const indicator = document.getElementById('rate-source');
  if (!indicator) return;
  
  if (result.source === 'CBR' || result.source === 'CBR (cached)') {
    const date = formatEffectiveDate(result.effectiveDate);
    const staleText = result.stale ? ' (устаревший)' : '';
    indicator.textContent = `Курс ЦБ РФ${date ? ' на ' + date : ''}${staleText}`;
    indicator.className = 'rate-source cbr';
  } else if (result.source === 'default') {
    indicator.textContent = 'Дефолтный курс';
    indicator.className = 'rate-source default';
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
