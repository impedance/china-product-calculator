# Feature Plan: Quantity Field + Summary Tab

**Project:** china-product-calculator  
**Branch:** `feature/quantity-and-summary`  
**Author:** inozemtsev  
**Date:** 2026-04-27

---

## Context

The current app (Tab 1) calculates per-unit economics for one product at a time.
Two additions were requested based on an updated Excel workbook:

1. **Tab 1 addition:** A "Quantity" input field so the user can see total revenue and total profit for a batch, not just per-unit figures.
2. **Tab 2 — "Свод" (Summary):** A multi-row table where each row represents a product. Rows can be added manually or imported from the current Tab 1 calculation. The table auto-computes totals and shows an ИТОГО (Grand Total) row.

---

## Jobs To Be Done (JTBD)

| # | Who | Wants to | So that |
|---|-----|----------|---------|
| J-1 | Buyer | Enter how many units they plan to sell | They see total revenue and total profit for the whole batch |
| J-2 | Buyer | Compare several products side by side | They pick the most profitable SKU mix |
| J-3 | Buyer | Push the current calculator result into the summary table in one click | They don't have to re-type numbers |
| J-4 | Buyer | See totals and margin across all products combined | They understand portfolio economics at a glance |
| J-5 | Buyer | Delete a row from the summary | They can revise the plan without starting over |

---

## Definition of Done (DoD)

A task is **Done** when ALL of the following are true:

- [ ] The feature works as described in this document
- [ ] No `NaN`, `Infinity`, or `undefined` appears in the UI (check with DevTools)
- [ ] All existing unit tests in `tests.html` still pass (green)
- [ ] All new black-box tests defined at the bottom of this document pass
- [ ] The page works offline (open DevTools → Network → Offline → refresh)
- [ ] The page looks correct on a 375px-wide screen (iPhone SE) — no horizontal scroll
- [ ] localStorage persists all new data (refresh the page, data survives)
- [ ] Dark mode looks correct (toggle theme, check new elements)
- [ ] No JS console errors on page load or interaction

---

## Architecture Overview

```
index.html              ← add tab nav + Tab 2 markup
js/
  formulas.js           ← add calculateTotalRevenue, calculateBatchProfit
  state.js              ← add quantity field to input state + output state
  storage.js            ← add saveSummaryRows / loadSummaryRows
  summary-state.js      ← NEW: manages the rows array for Tab 2
  app.js                ← wire up tab switching + summary module init
css/
  styles.css            ← add tab nav styles + summary table styles
tests.html              ← add new test cases TC-11 … TC-16
```

**Key constraint:** `formulas.js` must stay pure (no DOM, no imports).  
**Key constraint:** `summary-state.js` must not import from `state.js` (avoid circular deps).

---

## Task Breakdown

---

### TASK 1 — Add quantity field to formulas

**File:** `js/formulas.js`  
**Type:** Pure logic, no UI

#### What to add

Append these two functions **at the bottom** of `formulas.js`, before the closing of the file:

```js
/**
 * Calculates total revenue for a batch
 * Formula: totalRevenue = quantity * retailPriceRub
 */
export function calculateTotalRevenue(quantity, retailPriceRub) {
  if (!isValidPositiveNumber(quantity) || !isValidNonNegativeNumber(retailPriceRub)) {
    return null;
  }
  const result = quantity * retailPriceRub;
  return Number.isFinite(result) ? result : null;
}

/**
 * Calculates total profit for a batch
 * Formula: totalBatchProfit = quantity * profitPerUnit
 */
export function calculateBatchProfit(quantity, profitPerUnit) {
  if (!isValidPositiveNumber(quantity) || !isValidNonNegativeNumber(profitPerUnit)) {
    return null;
  }
  const result = quantity * profitPerUnit;
  return Number.isFinite(result) ? result : null;
}
```

**DoD for TASK 1:**
- Both functions exported and callable from the browser console
- Returns `null` (not NaN) for any null/negative/zero input
- TC-11 and TC-12 pass (see Tests section below)

---

### TASK 2 — Add quantity to state

**File:** `js/state.js`

#### 2a. Add to `initialInputState`

Find the `initialInputState` object (line ~19) and add:

```js
quantity: null,
```

Place it after `taxRate: 0`.

#### 2b. Add to `initialOutputState`

Find `initialOutputState` (line ~35) and add:

```js
totalRevenue: null,
batchProfit: null,
```

#### 2c. Update `recalculate()`

Find the `recalculate()` function. Import the two new formulas at the top of the file:

```js
import {
  // ... existing imports ...
  calculateTotalRevenue,
  calculateBatchProfit
} from './formulas.js';
```

Inside `recalculate()`, after the `marginRate` line, add:

```js
const totalRevenue = calculateTotalRevenue(input.quantity, retailPriceRub);
const batchProfit = calculateBatchProfit(input.quantity, profitRub);
```

Then extend the `currentState.output = { ... }` assignment:

```js
currentState.output = {
  purchaseRub,
  cargoCostRub,
  insuranceRub,
  totalCostRub,
  retailPriceRub,
  taxRub,
  profitRub,
  marginRate,
  totalRevenue,   // ← add
  batchProfit,    // ← add
};
```

**DoD for TASK 2:**
- `getState().output.totalRevenue` returns the correct value after loading Example A with quantity 500
- `getState().output.batchProfit` returns the correct value
- Existing state tests still pass

---

### TASK 3 — Add quantity input to Tab 1 UI

**File:** `index.html`

#### Where to insert

Find the block for Step 4 (наценка/налоги). Add the quantity field **after the markup/tax inputs and before the KPI cards section**.

Look for a comment or section like `<!-- Step 4 -->` or the inputs for `markupRate`/`taxRate`. Add after their closing `</div>`:

```html
<!-- Quantity field -->
<div class="form-section">
  <h3 class="section-title">Партия</h3>
  <div class="field-row">
    <label class="field-label" for="quantity">Количество единиц</label>
    <div class="field-input-wrap">
      <input
        type="number"
        id="quantity"
        class="field-input"
        placeholder="например, 500"
        min="1"
        step="1"
      />
    </div>
  </div>
</div>
```

#### Wire up the input

In `js/app.js`, find where other inputs are wired to `setInputField`. Add the same pattern for `quantity`:

```js
document.getElementById('quantity')?.addEventListener('input', (e) => {
  const raw = parseFloat(e.target.value);
  setInputField('quantity', Number.isNaN(raw) ? null : Math.floor(raw));
});
```

#### Add two new KPI cards

Find the KPI cards section in `index.html`. There are currently 5 cards. Add two more:

```html
<div class="kpi-card" id="kpi-total-revenue">
  <div class="kpi-label">Выручка всего</div>
  <div class="kpi-value" id="kpi-total-revenue-value">—</div>
</div>

<div class="kpi-card" id="kpi-batch-profit">
  <div class="kpi-label">Прибыль всего</div>
  <div class="kpi-value" id="kpi-batch-profit-value">—</div>
</div>
```

#### Render the new KPI cards

In `js/app.js`, find the function that renders KPI cards (it likely updates `textContent` for each card). Add:

```js
const totalRevenueEl = document.getElementById('kpi-total-revenue-value');
if (totalRevenueEl) {
  totalRevenueEl.textContent = output.totalRevenue != null
    ? formatCurrency(output.totalRevenue)
    : '—';
}

const batchProfitEl = document.getElementById('kpi-batch-profit-value');
if (batchProfitEl) {
  batchProfitEl.textContent = output.batchProfit != null
    ? formatCurrency(output.batchProfit)
    : '—';
}
```

`formatCurrency` is already imported from `js/formatters.js` — check the exact import name used in `app.js`.

**DoD for TASK 3:**
- Quantity input visible on Tab 1 below the existing form fields
- Typing 500 into quantity → "Выручка всего" and "Прибыль всего" KPI cards update immediately
- Clearing the quantity → KPI cards show "—" (not NaN)
- Value saved to localStorage when user clicks Save
- TC-13 passes

---

### TASK 4 — Persist quantity in storage

**File:** `js/storage.js`

No code change needed — `saveScenario(scenario)` already serializes the whole input object, and `loadScenario()` restores it. Since `quantity` is now part of `initialInputState`, it will be included automatically.

**Verify only:**
- Save a scenario with quantity = 300 → reload page → quantity input shows 300

---

### TASK 5 — Create summary-state.js

**File:** `js/summary-state.js` ← **create this file**

This module manages the rows array for the Summary tab. Each row is a plain object.

```js
/**
 * summary-state.js
 * Manages the in-memory rows for the Summary (Свод) tab.
 * Persists to localStorage under key 'chinaCalc.summaryRows'.
 */

const STORAGE_KEY = 'chinaCalc.summaryRows';

// Each row shape:
// {
//   id: string,          // unique id, use crypto.randomUUID() or Date.now()
//   productName: string,
//   quantity: number,
//   unitCost: number,    // totalCostRub per unit
//   retailPrice: number, // retailPriceRub per unit
//   profitPerUnit: number
// }
// Derived (computed, not stored):
//   totalCost = quantity * unitCost
//   totalRevenue = quantity * retailPrice
//   totalProfit = quantity * profitPerUnit
//   margin = totalProfit / totalRevenue

let rows = [];

const listeners = new Set();

function notify() {
  listeners.forEach(fn => {
    try { fn(getRows()); } catch (e) { console.error(e); }
  });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getRows() {
  return rows.map(r => ({ ...r }));
}

export function addRow(row) {
  rows.push({
    id: String(Date.now()),
    productName: row.productName || 'Новый товар',
    quantity: row.quantity ?? 0,
    unitCost: row.unitCost ?? 0,
    retailPrice: row.retailPrice ?? 0,
    profitPerUnit: row.profitPerUnit ?? 0
  });
  _persist();
  notify();
}

export function deleteRow(id) {
  rows = rows.filter(r => r.id !== id);
  _persist();
  notify();
}

export function updateRow(id, updates) {
  rows = rows.map(r => r.id === id ? { ...r, ...updates } : r);
  _persist();
  notify();
}

export function getTotals() {
  const totalCost = rows.reduce((s, r) => s + r.quantity * r.unitCost, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.quantity * r.retailPrice, 0);
  const totalProfit = rows.reduce((s, r) => s + r.quantity * r.profitPerUnit, 0);
  const margin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
  return { totalCost, totalRevenue, totalProfit, margin };
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) rows = JSON.parse(raw);
  } catch (e) {
    rows = [];
  }
}

function _persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch (e) {
    console.warn('summary-state: failed to persist', e);
  }
}
```

**DoD for TASK 5:**
- `addRow` → `getRows()` returns array with the new row
- `deleteRow` → row is removed, `getRows()` length decreases by 1
- `getTotals()` returns correct sums
- After `addRow` + page reload + `loadFromStorage()`, rows are restored
- TC-14 and TC-15 pass

---

### TASK 6 — Add Tab 2 HTML

**File:** `index.html`

#### 6a. Add tab navigation bar

Find the top of the main content area (after `<body>` or after the app header). Add a tab bar:

```html
<nav class="tab-nav" role="tablist">
  <button class="tab-btn tab-btn--active" role="tab" data-tab="calculator" aria-selected="true">
    Калькулятор
  </button>
  <button class="tab-btn" role="tab" data-tab="summary" aria-selected="false">
    Свод
  </button>
</nav>
```

#### 6b. Wrap existing content in a tab panel

Wrap all existing Tab 1 content in:

```html
<div id="tab-calculator" class="tab-panel" role="tabpanel">
  <!-- ALL existing calculator HTML goes here -->
</div>
```

#### 6c. Add Tab 2 panel

After the closing `</div>` of `tab-calculator`, add:

```html
<div id="tab-summary" class="tab-panel tab-panel--hidden" role="tabpanel">
  <div class="summary-header">
    <h2 class="summary-title">Свод по товарам</h2>
    <button class="btn btn--primary" id="btn-add-from-calc">
      + Добавить из калькулятора
    </button>
    <button class="btn btn--secondary" id="btn-add-empty-row">
      + Добавить строку
    </button>
  </div>

  <div class="summary-table-wrap">
    <table class="summary-table" id="summary-table">
      <thead>
        <tr>
          <th>Товар</th>
          <th>Кол-во</th>
          <th>Себест. ед. ₽</th>
          <th>Общие затраты ₽</th>
          <th>Розн. цена ед. ₽</th>
          <th>Прибыль ед. ₽</th>
          <th>Выручка всего ₽</th>
          <th>Прибыль всего ₽</th>
          <th>Маржа %</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="summary-tbody">
        <!-- rows rendered by JS -->
      </tbody>
      <tfoot id="summary-tfoot">
        <!-- ИТОГО row rendered by JS -->
      </tfoot>
    </table>
  </div>

  <p class="summary-empty" id="summary-empty-msg">
    Добавьте товары, чтобы увидеть сводку
  </p>
</div>
```

**DoD for TASK 6:**
- Tab bar visible at top of page
- Clicking "Свод" tab shows Tab 2, hides Tab 1
- Clicking "Калькулятор" tab shows Tab 1, hides Tab 2
- Correct `aria-selected` toggles on tab buttons

---

### TASK 7 — Tab switching logic

**File:** `js/app.js`

Add at the bottom of the `init()` function (or after DOMContentLoaded):

```js
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
```

**CSS to add in `css/styles.css`:**

```css
.tab-nav {
  display: flex;
  gap: 4px;
  padding: 8px 16px 0;
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn--active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
  font-weight: 600;
}

.tab-panel--hidden {
  display: none;
}
```

---

### TASK 8 — Render summary table

**File:** `js/app.js`

Import summary-state at the top of `app.js`:

```js
import {
  getRows, addRow, deleteRow, updateRow, getTotals, loadFromStorage, subscribe as subscribeSummary
} from './summary-state.js';
```

Add a `renderSummary()` function:

```js
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

  // Toggle empty message
  if (emptyMsg) emptyMsg.style.display = rows.length === 0 ? 'block' : 'none';

  // Render rows
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

  // Render totals
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

  // Wire up delete buttons
  tbody.querySelectorAll('.btn-delete-row').forEach(btn => {
    btn.addEventListener('click', () => deleteRow(btn.dataset.rowId));
  });

  // Wire up inline edits
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
```

#### Wire up "Add from calculator" button

Inside `init()` or after DOMContentLoaded:

```js
document.getElementById('btn-add-from-calc')?.addEventListener('click', () => {
  const { input, output } = getState(); // getState is already imported from state.js
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
```

#### Subscribe summary to re-render

In `init()`:

```js
loadFromStorage();
subscribeSummary(renderSummary);
renderSummary(); // initial render
```

**DoD for TASK 8:**
- Table shows all rows with correct computed columns
- ИТОГО row shows correct sums
- Deleting a row removes it from table and updates ИТОГО immediately
- Editing a cell updates computed columns and ИТОГО on blur
- "Add from calculator" copies current calculator values into a new row
- TC-14, TC-15, TC-16 pass

---

### TASK 9 — Summary table styles

**File:** `css/styles.css`

Add at the bottom:

```css
.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  flex-wrap: wrap;
}

.summary-title {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.summary-table-wrap {
  overflow-x: auto;
  padding: 0 8px 16px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 700px;
}

.summary-table th,
.summary-table td {
  padding: 8px 6px;
  text-align: right;
  border-bottom: 1px solid var(--color-border);
}

.summary-table th:first-child,
.summary-table td:first-child {
  text-align: left;
}

.summary-input {
  width: 80px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 13px;
  text-align: right;
  background: var(--color-surface);
  color: var(--color-text);
}

.summary-input:first-child {
  width: 120px;
  text-align: left;
}

.summary-computed {
  color: var(--color-text-secondary);
}

.summary-totals-row td {
  border-top: 2px solid var(--color-border);
  font-weight: 600;
}

.btn-delete-row {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 14px;
  padding: 4px;
}

.btn-delete-row:hover {
  color: #ef4444;
}

.summary-empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 32px 16px;
}
```

---

## Test Cases

Add these to `tests.html` in the existing test runner format.

---

### TC-11 — calculateTotalRevenue: correct result

```js
{
  id: 'TC-11',
  description: 'calculateTotalRevenue: quantity × retail price',
  run() {
    const result = calculateTotalRevenue(500, 3364.40);
    return assertClose(result, 1682200, 1);
  }
}
```

---

### TC-12 — calculateBatchProfit: null for zero quantity

```js
{
  id: 'TC-12',
  description: 'calculateBatchProfit: returns null when quantity is 0 or null',
  run() {
    const r1 = calculateBatchProfit(0, 1480);
    const r2 = calculateBatchProfit(null, 1480);
    return r1 === null && r2 === null;
  }
}
```

---

### TC-13 — Tab 1: quantity KPI cards (black-box, DOM-based)

**Steps (manual / Playwright):**
1. Open the page
2. Load "Пример A" preset
3. Type `500` into the "Количество единиц" input
4. Assert KPI card "Выручка всего" shows a value ≥ 1 000 000
5. Assert KPI card "Прибыль всего" shows a value ≥ 500 000
6. Clear the quantity field
7. Assert both KPI cards show "—"

---

### TC-14 — Summary: add row and check totals (black-box, DOM-based)

**Steps:**
1. Open the page, navigate to "Свод" tab
2. Click "Добавить строку"
3. In the new row, set: Кол-во = 100, Себест = 1600, Розн цена = 3200, Прибыль ед = 1408
4. Blur/tab out of each field
5. Assert "Общие затраты" cell = 160 000
6. Assert "Выручка всего" cell = 320 000
7. Assert "Прибыль всего" cell = 140 800
8. Assert "Маржа" cell = 44.0%
9. Assert ИТОГО row shows same values (only one row)

---

### TC-15 — Summary: delete row updates totals (black-box)

**Steps:**
1. Add two rows (same values as TC-14)
2. Assert ИТОГО "Прибыль всего" = 281 600
3. Click ✕ on the first row
4. Assert ИТОГО "Прибыль всего" = 140 800
5. Assert only 1 row in tbody

---

### TC-16 — Summary: "Add from calculator" imports values (black-box)

**Steps:**
1. Load "Пример A" preset on Tab 1
2. Type `200` into "Количество единиц"
3. Switch to "Свод" tab
4. Click "Добавить из калькулятора"
5. Assert new row productName = "Product A"
6. Assert new row Кол-во = 200
7. Assert new row Себест ≈ 1682 (± 1 ₽)
8. Assert new row Прибыль ед ≈ 1480 (± 1 ₽)
9. Assert computed Прибыль всего ≈ 296 000 (± 200 ₽)

---

### TC-17 — Summary: persistence across reload (black-box)

**Steps:**
1. Add a row (Кол-во = 50, Себест = 800, Розн цена = 1600, Прибыль ед = 720)
2. Reload the page
3. Navigate to "Свод" tab
4. Assert the row is still there with original values
5. Assert ИТОГО shows correct totals

---

## Implementation Order

Do tasks in this order. Each task is independently testable before moving on.

```
TASK 1 → TASK 2 → TASK 5 → TASK 3 → TASK 4 → TASK 6 → TASK 7 → TASK 8 → TASK 9
  ↓         ↓        ↓        ↓
TC-11    TC-12    TC-14    TC-13
TC-12             TC-15
                  TC-16
                  TC-17
```

---

## Checklist Before PR

- [ ] `tests.html` opened in browser — all TC-01 through TC-17 green
- [ ] Loaded Пример A → entered quantity 500 → saw Выручка and Прибыль всего
- [ ] Added 3 rows to Свод, edited inline, deleted one — ИТОГО correct each time
- [ ] Clicked "Добавить из калькулятора" — row matches calculator output
- [ ] Refreshed page — Tab 1 data restored, Свод rows restored
- [ ] Opened DevTools → Application → localStorage — key `chinaCalc.summaryRows` present
- [ ] Opened DevTools → Console — zero errors
- [ ] Tested on 375px width (Chrome DevTools device toolbar) — no horizontal scroll on Tab 1
- [ ] Toggled dark mode — table looks readable
