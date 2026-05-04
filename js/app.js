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
  expandStep,
  getState
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
  fetchUsdRate
} from './exchange-rate.js';

import {
  getRows, addRow, deleteRow, updateRow, getTotals, loadFromStorage, subscribe as subscribeSummary
} from './summary-state.js';

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
  elements.kpiTotalRevenue = document.getElementById('kpi-total-revenue');
  elements.kpiBatchProfit = document.getElementById('kpi-batch-profit');
  
  // Input fields
  elements.inputs = {
    productName: document.getElementById('product-name'),
    sku: document.getElementById('sku'),
    unitPriceUsd: document.getElementById('unit-price-usd'),
    usdRubRate: document.getElementById('usd-rub-rate'),
    chinaDeliveryRub: document.getElementById('china-delivery-rub'),
    densityKgM3: document.getElementById('density'),
    cargoRateUsdPerKg: document.getElementById('cargo-rate-usd'),
    unitWeightKg: document.getElementById('unit-weight'),
    insuranceRate: document.getElementById('insurance-rate'),
    reworkRub: document.getElementById('rework-rub'),
    packagingRub: document.getElementById('packaging-rub'),
    markupRate: document.getElementById('markup-rate'),
    taxRate: document.getElementById('tax-rate'),
    quantity: document.getElementById('quantity')
  };
  
  // Error messages
  elements.errors = {
    unitPriceUsd: document.getElementById('error-unit-price-usd'),
    usdRubRate: document.getElementById('error-usd-rub-rate'),
    chinaDeliveryRub: document.getElementById('error-china-delivery-rub'),
    cargoRateUsdPerKg: document.getElementById('error-cargo-rate-usd'),
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
      // markupRate is entered as percent (50) but stored as decimal (0.5)
      let parsedValue = parseNumber(value);
      if (fieldId === 'markupRate' && parsedValue !== null) {
        parsedValue = parsedValue / 100;
      }
      updateInput({ [fieldId]: parsedValue });
    });
    
    // Handle blur for validation display
    input.addEventListener('blur', (e) => {
      const value = e.target.value;
      // markupRate is entered as percent (50) but stored as decimal (0.5)
      let parsedValue = parseNumber(value);
      if (fieldId === 'markupRate' && parsedValue !== null) {
        parsedValue = parsedValue / 100;
      }
      updateInput({ [fieldId]: parsedValue });
    });
  });
  
  // Quantity input - special handling for integer values
  elements.inputs.quantity?.addEventListener('input', (e) => {
    const raw = parseFloat(e.target.value);
    setInputField('quantity', Number.isNaN(raw) ? null : Math.floor(raw));
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
  
  // Step panel accordion toggle handled by progressive-ui.js
  
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
    
    // Force clear all input fields in DOM
    Object.values(elements.inputs).forEach(input => {
      if (input) {
        input.value = '';
        input.classList.remove('error');
      }
    });
    
    // Reset specific UI elements
    const markupRange = document.getElementById('markup-range');
    if (markupRange) {
      markupRange.value = 100;
      const fill = document.querySelector('#markup-slider .slider-fill');
      const thumb = document.querySelector('#markup-slider .slider-thumb');
      if (fill) fill.style.width = '33.33%';
      if (thumb) thumb.style.left = '33.33%';
    }
    
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
 * Show instruction content in bottom sheet
 */
function showHelpSheet() {
  if (!elements.sheetTitle || !elements.sheetContent) return;
  
  elements.sheetTitle.textContent = 'Как пользоваться';
  
  elements.sheetContent.innerHTML = `
    <div class="instruction-content">
      <div class="instruction-step">
        <div class="instruction-step-header">
          <span class="instruction-step-icon">💱</span>
          <span class="instruction-step-title">Курс валют</span>
        </div>
        <div class="instruction-step-desc">
          Автоматически подгружается курс ЦБ РФ. Можно ввести свой курс USD/RUB.
        </div>
      </div>

      <div class="instruction-step">
        <div class="instruction-step-header">
          <span class="instruction-step-icon">💰</span>
          <span class="instruction-step-title">Шаг 1: Закупка</span>
        </div>
        <div class="instruction-step-desc">
          Введите цену товара в долларах ($). Поле обязательное — без него не рассчитается закупочная стоимость.
        </div>
      </div>

      <div class="instruction-step">
        <div class="instruction-step-header">
          <span class="instruction-step-icon">🚚</span>
          <span class="instruction-step-title">Шаг 2: Логистика</span>
        </div>
        <div class="instruction-step-desc">
          Укажите вес единицы (кг) и ставку карго ($/кг). Доставка по Китаю — опционально.
        </div>
      </div>
      
      <div class="instruction-step">
        <div class="instruction-step-header">
          <span class="instruction-step-icon">📦</span>
          <span class="instruction-step-title">Шаг 3: Доп. расходы</span>
        </div>
        <div class="instruction-step-desc">
          Страховка (выберите % на слайдере), переработка/брак, упаковка/маркировка — все поля опциональны.
        </div>
      </div>
      
      <div class="instruction-step">
        <div class="instruction-step-header">
          <span class="instruction-step-icon">🏷️</span>
          <span class="instruction-step-title">Шаг 4: Продажа</span>
        </div>
        <div class="instruction-step-desc">
          Установите наценку (слайдер или ввод %). Выберите налоговый режим: 0% (по умолчанию), 6% УСН, 7% АУСН, 15% УСН или 20% ОСНО.
        </div>
      </div>
      
      <div class="instruction-tips">
        <div class="instruction-tips-title">💡 Полезные фичи</div>
        <ul class="instruction-tips-list">
          <li><strong>Примеры A/B</strong> — быстрое заполнение тестовыми данными</li>
          <li><strong>↻ рядом с полем</strong> — загрузить последнее введённое значение</li>
          <li><strong>Автосохранение</strong> — данные не пропадут при закрытии страницы</li>
          <li><strong>Цифры сверху</strong> — итоговые показатели обновляются автоматически</li>
        </ul>
      </div>
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
      // markupRate is stored as decimal (0.5) but displayed as percent (50)
      if (fieldId === 'markupRate') {
        inputEl.value = Math.round(value * 100);
      } else if (fieldId === 'quantity') {
        inputEl.value = Math.floor(value);
      } else {
        inputEl.value = value;
      }
    } else {
      inputEl.value = '';
    }
  });
  
  // Sync markup slider with state
  const markupRange = document.getElementById('markup-range');
  const markupFill = document.querySelector('#markup-slider .slider-fill');
  const markupThumb = document.querySelector('#markup-slider .slider-thumb');
  if (input.markupRate !== null && markupRange) {
    // markupRate is stored as decimal, slider works with percent (0-300)
    const pct = Math.min(300, Math.max(0, Math.round((input.markupRate || 0) * 100)));
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
      // Active button: either known rate matches, or custom is selected for unknown rate
      btn.classList.toggle('active', (isKnown && btnVal === taxRate) || (!isKnown && isCustom));
    });
    const customContainer = document.getElementById('custom-tax-container');
    if (customContainer) {
      // Show custom input only for custom (non-known) rates
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
  updateKpiCard(elements.kpiMargin, output.marginRate, (v) => formatPercent(v, 1), marginClass);
  
  updateKpiCard(elements.kpiTaxes, output.taxRub, formatRub, 'cost');
  
  const totalRevenueClass = (output.totalRevenue || 0) >= 0 ? 'profit' : '';
  updateKpiCard(elements.kpiTotalRevenue, output.totalRevenue, formatRub, totalRevenueClass);
  
  const batchProfitClass = (output.batchProfit || 0) >= 0 ? 'profit' : '';
  updateKpiCard(elements.kpiBatchProfit, output.batchProfit, formatRub, batchProfitClass);
   
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
  const step1Complete = input.unitPriceUsd > 0 && input.usdRubRate > 0;
  const step2Complete = input.unitWeightKg > 0 && input.cargoRateUsdPerKg > 0;
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
    const purchaseRub = (input.unitPriceUsd || 0) * (input.usdRubRate || 0);
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

function formatNum(v) {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

function renderSummary() {
  const rows = getRows();
  const totals = getTotals();
  const tbody = document.getElementById('summary-tbody');
  const tfoot = document.getElementById('summary-tfoot');
  const emptyMsg = document.getElementById('summary-empty-msg');

  if (!tbody || !tfoot) return;

  if (emptyMsg) emptyMsg.style.display = rows.length === 0 ? 'block' : 'none';

  tbody.innerHTML = rows.map(row => {
    const totalCost = row.quantity * row.unitCost;
    const totalRevenue = row.quantity * row.retailPrice;
    const totalProfit = row.quantity * row.profitPerUnit;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : '—';

    return `
      <tr data-row-id="${row.id}">
        <td><input class="summary-input" data-field="productName" value="${row.productName}" /></td>
        <td><input class="summary-input summary-input--num" data-field="quantity" value="${row.quantity}" /></td>
        <td><input class="summary-input summary-input--num" data-field="unitCost" value="${row.unitCost}" /></td>
        <td class="summary-computed">${formatNum(totalCost)}</td>
        <td><input class="summary-input summary-input--num" data-field="retailPrice" value="${row.retailPrice}" /></td>
        <td><input class="summary-input summary-input--num" data-field="profitPerUnit" value="${row.profitPerUnit}" /></td>
        <td class="summary-computed">${formatNum(totalRevenue)}</td>
        <td class="summary-computed">${formatNum(totalProfit)}</td>
        <td class="summary-computed">${margin}%</td>
        <td><button class="btn-delete-row" data-row-id="${row.id}" aria-label="Удалить">✕</button></td>
      </tr>`;
  }).join('');

  tfoot.innerHTML = `
    <tr class="summary-totals-row">
      <td><strong>ИТОГО</strong></td>
      <td></td>
      <td></td>
      <td>${formatNum(totals.totalCost)}</td>
      <td></td>
      <td></td>
      <td>${formatNum(totals.totalRevenue)}</td>
      <td>${formatNum(totals.totalProfit)}</td>
      <td>${totals.totalRevenue > 0 ? (totals.margin * 100).toFixed(1) : '—'}%</td>
      <td></td>
    </tr>`;

  tbody.querySelectorAll('.btn-delete-row').forEach(btn => {
    btn.addEventListener('click', () => deleteRow(btn.dataset.rowId));
  });

  tbody.querySelectorAll('.summary-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const tr = e.target.closest('tr');
      const rowId = tr?.dataset.rowId;
      const field = e.target.dataset.field;
      if (!rowId || !field) return;
      const numFields = ['quantity', 'unitCost', 'retailPrice', 'profitPerUnit'];
      const value = numFields.includes(field)
        ? (parseFloat(e.target.value) || 0)
        : e.target.value;
      updateRow(rowId, { [field]: value });
    });
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
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('tab-btn--active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });

      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('tab-panel--hidden', panel.id !== `tab-${targetTab}`);
      });
    });
  });
  
  // Initialize summary state
  loadFromStorage();
  subscribeSummary(renderSummary);
  renderSummary();
  
  // Wire up summary buttons
  document.getElementById('btn-add-from-calc')?.addEventListener('click', () => {
    const { input, output } = getState();
    addRow({
      productName: input.productName || 'Товар',
      quantity: input.quantity || 0,
      unitCost: output.totalCostRub || 0,
      retailPrice: output.retailPriceRub || 0,
      profitPerUnit: output.profitRub || 0
    });
  });

  document.getElementById('btn-add-empty-row')?.addEventListener('click', () => {
    addRow({ productName: 'Новый товар', quantity: 0, unitCost: 0, retailPrice: 0, profitPerUnit: 0 });
  });
    
  // Fetch USD exchange rate from CBR API
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
 * Fetch and apply USD exchange rate
 */
async function loadExchangeRate() {
  try {
    const result = await fetchUsdRate();

    if (result !== null) {
      // Apply the fetched rate to state
      updateInput({ usdRubRate: result.rate });

      // Update UI indicator
      updateRateSourceIndicator(result);

      console.log(`[App] Exchange rate updated: ${result.rate} (${result.source})`);
    } else {
      // Use default rate if fetch failed and no cache available
      updateInput({ usdRubRate: 95 });
      updateRateSourceIndicator({ rate: 95, source: 'default', effectiveDate: null });

      console.log('[App] Using default exchange rate: 95');
    }
  } catch (error) {
    console.error('[App] Failed to load exchange rate:', error);

    // Fallback to default
    updateInput({ usdRubRate: 95 });
    updateRateSourceIndicator({ rate: 95, source: 'default', effectiveDate: null });
  }
}

/**
 * Update the rate source indicator in UI
 * Format: "Курс валюты" or "Курс валюты на DD.MM.YYYY" if data is from today
 */
function updateRateSourceIndicator(result) {
  const indicator = document.getElementById('rate-source');
  if (!indicator) return;

  // Format date as DD.MM.YYYY if available
  let formattedDate = '';
  if (result.effectiveDate) {
    try {
      const date = new Date(result.effectiveDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      formattedDate = `${day}.${month}.${year}`;
    } catch (e) {
      formattedDate = '';
    }
  }

  // Show date only if data is from today
  if (result.isToday && formattedDate) {
    indicator.textContent = `Курс валюты на ${formattedDate}`;
  } else {
    indicator.textContent = 'Курс валюты';
  }

  // Set CSS class based on source for styling
  if (result.source === 'MOEX' || result.source === 'MOEX (cached)') {
    indicator.className = 'rate-source moex';
  } else if (result.source === 'CBR' || result.source === 'CBR (cached)' || result.source === 'CBR (stale)') {
    indicator.className = 'rate-source cbr';
  } else {
    indicator.className = 'rate-source default';
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
