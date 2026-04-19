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
  setLastSaved
} from './state.js';

import { 
  formatRub, 
  formatPercent,
  parseNumber
} from './formatters.js';

import { 
  saveScenario, 
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
  elements.btnSave = document.getElementById('btn-save');
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
    cargoRateUsdPerKg: document.getElementById('cargo-rate-usd'),
    usdRubRate: document.getElementById('usd-rub-rate'),
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
    cargoRateUsdPerKg: document.getElementById('error-cargo-rate-usd'),
    usdRubRate: document.getElementById('error-usd-rub-rate'),
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
  
  // Cards for accordion
  elements.cards = document.querySelectorAll('.card');
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
  elements.btnSave?.addEventListener('click', handleSave);
  elements.btnHelp?.addEventListener('click', showHelpSheet);
  
  // Bottom sheet close
  elements.sheetClose?.addEventListener('click', closeBottomSheet);
  elements.bottomSheetOverlay?.addEventListener('click', (e) => {
    if (e.target === elements.bottomSheetOverlay) {
      closeBottomSheet();
    }
  });
  
  // Card accordion toggle
  elements.cards?.forEach(card => {
    const header = card.querySelector('.card-header');
    header?.addEventListener('click', () => {
      card.classList.toggle('expanded');
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
    
    showToast('Данные очищены');
  }
}

/**
 * Handle save button click
 */
function handleSave() {
  const { input } = subscribe(() => {})();
  const success = saveScenario(input);
  
  if (success) {
    setLastSaved(new Date().toISOString());
    showToast('Сохранено', 'success');
  } else {
    showToast('Ошибка сохранения');
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
        <li>Стоимость карго = Вес × Ставка (USD/кг) × Курс USD/RUB</li>
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
        <li>Курс USD/RUB обязателен для расчёта стоимости карго</li>
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
function init() {
  // Cache DOM elements
  cacheElements();
  
  // Setup theme
  initTheme();
  setupThemeListeners();
  
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
  
  console.log('[App] China Product Calculator initialized');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
