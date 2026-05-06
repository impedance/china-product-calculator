# Landed Cost Calculator — MVP Technical Specification

## 1. Document purpose

This document defines an MVP technical specification for rebuilding the existing Excel draft as a **mobile-friendly PWA** using **HTML/CSS/JavaScript** while preserving the author’s current calculation logic.

The goal is **not** to redesign the business model.  
The goal is to make the current logic:

- explicit,
- testable,
- usable on mobile,
- available offline,
- easy to extend later.

---

## 2. Source baseline and preservation rule

The current Excel file is a **draft calculator structure** with example values and formula descriptions.

### Existing business blocks in the source
1. **Purchase**
2. **Logistics**
3. **Rework / defects / packaging**
4. **Cost total**
5. **Sales**
6. **Final profit metrics**

### Preservation rule
For MVP, implementation must preserve the author’s intended logic exactly where it is already defined:

- `Purchase in RUB = Unit price (CNY) × CNY/RUB rate`
- `Cargo cost = Unit weight × Cargo rate ($/kg) × USD/RUB rate`
- `Insurance = Purchase in RUB × Insurance %`
- `Total cost = Sum of all cost items above`
- `Retail price = Total cost × (1 + Markup %)`
- `Taxes = Retail price × Tax %`
- `Profit per unit = Retail price - Total cost - Taxes`
- `Margin % = Profit per unit / Retail price`

### Important gap resolved in this spec
The Excel draft references **USD/RUB exchange rate** inside the cargo formula, but this field is not exposed as a separate input in the visible draft table.

To preserve the author’s logic without guessing, MVP must include:

- **USD/RUB exchange rate** as an explicit input field.

### Important note on density
The Excel draft includes **Density (kg/m³)** as an input, but it is **not currently used in the shown cost formulas**.

For MVP:
- keep the field in the UI and in stored data;
- do **not** use it in calculations yet;
- label it as **reserved for future logistics logic**.

This preserves the author’s structure without inventing new pricing rules.

---

## 3. Product goal

Build a simple PWA that helps a user estimate the **real unit cost**, **retail price**, **tax burden**, **profit**, and **margin** of a product imported to Russia.

The MVP must be fast to open, easy to use on a phone, and usable offline after first load.

---

## 4. Recommended stack

## Recommended MVP stack
- **HTML5**
- **CSS3**
- **Vanilla JavaScript (ES modules)**
- **Web App Manifest**
- **Service Worker** for offline shell/assets
- **localStorage** for saving the latest scenario
- No backend
- No framework required for MVP

## Why this stack
This calculator is form-heavy and logic-driven.  
A framework is not necessary at MVP stage and would add setup overhead.

## Optional dev tooling
Use a very light bundler only if needed for developer comfort:
- Vite (optional, not required by product logic)

## Final recommendation
For MVP, use:

- static HTML,
- modular JS files,
- simple CSS,
- PWA manifest + service worker.

This is the fastest and lowest-risk path.

---

## 5. Target user

Primary user:

- small importer,
- marketplace seller,
- sourcing manager,
- business owner calculating unit economics before order.

User job to be done:

> “Before I buy a product, I want to understand the full landed unit cost and expected profit in rubles, so I can decide whether the product makes sense.”

---

## 6. MVP scope

## In scope
- One-screen mobile-first calculator
- Editable input fields
- Automatic calculation of all derived outputs
- Inline validation
- Local save of latest scenario
- Reset to defaults
- PWA installability
- Offline access after first load
- Basic “example scenario” prefill based on the current spreadsheet draft

## Out of scope
- Multi-product catalog
- User accounts
- Backend
- Supplier integrations
- Live FX APIs
- PDF export
- Marketplace commission logic
- Customs duty / VAT import modeling beyond the current author logic
- Density-based volumetric cargo pricing
- Scenario comparison tables
- Analytics dashboards

---

## 7. Mobile-first UX requirements

## UX principles
- Keep the interface minimal.
- Show only the top inputs and key outputs on the first level.
- Avoid dense tables from desktop Excel.
- Group fields into collapsible sections.
- Keep summary KPIs sticky or easy to reach.

## Main sections on screen
1. **Product**
2. **Logistics**
3. **Extra costs**
4. **Sales settings**
5. **Results**

## Top KPIs shown prominently
Show only these 5 outputs as highlighted KPI cards:
- Total cost
- Retail price
- Taxes
- Profit per unit
- Margin %

Everything else stays in expandable sections.

## Mobile behavior
- One-column layout on mobile
- Numeric keyboard for numeric inputs
- Visible unit labels (CNY, RUB, %, kg, $/kg)
- Sticky “Results” block on larger screens is optional, not required on mobile
- Buttons:
  - Load example
  - Save locally
  - Reset

---

## 8. Screens

## Screen 1 — Calculator
Single main screen with grouped sections.

### Section A — Product
Fields:
- Product name
- SKU / article
- Unit price (CNY)
- CNY/RUB exchange rate

### Section B — Logistics
Fields:
- Local delivery (RUB)
- Density (kg/m³) — saved only, not used in MVP formula
- Cargo rate (USD/kg)
- USD/RUB exchange rate
- Unit weight (kg)
- Insurance (%)

### Section C — Extra costs
Fields:
- Rework / defects (RUB)
- Packaging / stickering (RUB)

### Section D — Sales settings
Fields:
- Markup (%)
- Taxes (%)

### Section E — Results
Read-only outputs:
- Purchase in RUB
- Cargo cost
- Insurance cost
- Total cost
- Retail price
- Taxes amount
- Profit per unit
- Margin %

## Screen 2 — Optional lightweight About / Formula help
This can be a modal or bottom sheet, not a separate route.

Contains:
- short explanations of each formula,
- units,
- rounding rule,
- note that density is reserved for future use.

This should be lightweight and not required for first release if time is tight.

---

## 9. Field specification

| Field Key | Label | Type | Unit | Required | Editable | Notes |
|---|---|---:|---|---|---|---|
| productName | Product name | string | - | no | yes | free text |
| sku | SKU / Article | string | - | no | yes | free text |
| unitPriceCny | Unit price | number | CNY | yes | yes | >= 0 |
| cnyRubRate | CNY/RUB rate | number | RUB | yes | yes | > 0 |
| purchaseRub | Purchase in RUB | computed | RUB | - | no | formula |
| localDeliveryRub | Local delivery | number | RUB | yes | yes | >= 0 |
| densityKgM3 | Density | number | kg/m³ | no | yes | saved, not used in MVP |
| cargoRateUsdPerKg | Cargo rate | number | USD/kg | yes | yes | >= 0 |
| usdRubRate | USD/RUB rate | number | RUB | yes | yes | > 0 |
| unitWeightKg | Unit weight | number | kg | yes | yes | >= 0 |
| cargoCostRub | Cargo cost | computed | RUB | - | no | formula |
| insuranceRate | Insurance | number | % | yes | yes | normalize percent input |
| insuranceRub | Insurance cost | computed | RUB | - | no | formula |
| reworkRub | Rework / defects | number | RUB | yes | yes | >= 0 |
| packagingRub | Packaging / stickering | number | RUB | yes | yes | >= 0 |
| totalCostRub | Total cost | computed | RUB | - | no | formula |
| markupRate | Markup | number | % | yes | yes | normalize percent input |
| retailPriceRub | Retail price | computed | RUB | - | no | formula |
| taxRate | Taxes | number | % | yes | yes | normalize percent input |
| taxRub | Taxes amount | computed | RUB | - | no | formula |
| profitRub | Profit per unit | computed | RUB | - | no | formula |
| marginRate | Margin | computed | % | - | no | formula |

---

## 10. Calculation logic

## 10.1 Normalization rules
Percent inputs must support both styles:
- `6` meaning `6%`
- `0.06` meaning `6%`

Normalization rule:
- if value > 1, divide by 100;
- else use value as-is.

Applied to:
- insuranceRate
- markupRate
- taxRate

## 10.2 Core formulas

### Purchase in RUB
```text
purchaseRub = unitPriceCny * cnyRubRate
```

### Cargo cost
```text
cargoCostRub = unitWeightKg * cargoRateUsdPerKg * usdRubRate
```

### Insurance cost
```text
insuranceRub = purchaseRub * insuranceRateNormalized
```

### Total cost
```text
totalCostRub =
  purchaseRub +
  localDeliveryRub +
  cargoCostRub +
  insuranceRub +
  reworkRub +
  packagingRub
```

### Retail price
```text
retailPriceRub = totalCostRub * (1 + markupRateNormalized)
```

### Taxes amount
```text
taxRub = retailPriceRub * taxRateNormalized
```

### Profit per unit
```text
profitRub = retailPriceRub - totalCostRub - taxRub
```

### Margin
```text
marginRate = profitRub / retailPriceRub
```

### Safe division rule
If `retailPriceRub <= 0`, then:
```text
marginRate = 0
```

---

## 11. Rounding and display rules

To stay close to the spreadsheet examples and avoid confusing fractional rubles:

## Internal precision
- Keep calculations in JavaScript number format.
- Round displayed currency values to **2 decimals**.
- Optionally format whole rubles when decimals are `.00`.

## Display formatting
- RUB values: `1 600 ₽` or `1 600.00 ₽`
- CNY values: `100 ¥`
- Percent values: `44.0%`
- Weight: `0.5 kg`
- Rate: `2.00 USD/kg`

## Recommendation
Implement one formatting helper and use it everywhere.

---

## 12. Validation rules

## Numeric fields
- Must reject non-numeric characters except decimal separator.
- Empty required numeric field blocks final calculations and shows inline warning.
- Negative values are not allowed in MVP.
- Exchange rates must be greater than 0.
- Weight can be 0 only if cargo cost is intentionally zero.

## Validation behavior
- Show inline field error under the field.
- Do not use blocking modal alerts.
- Recalculate on every valid change.
- If invalid, dependent outputs should display:
  - placeholder `—`
  - or last valid value plus visible error state.

## Recommended simple validation messages
- “Enter a valid number”
- “Value must be 0 or higher”
- “Rate must be greater than 0”
- “Required field”

---

## 13. Data persistence

## Local save
Use `localStorage` to store:
- latest full scenario,
- timestamp of last save.

## Required actions
- `Save locally`
- `Load example`
- `Reset`

## Example scenario
Include a built-in example using the spreadsheet draft values.

### Example preset
- Product name = Product A
- Unit price (CNY) = 100
- CNY/RUB = 13.5
- Local delivery = 20
- Density = 250
- Cargo rate = 2
- USD/RUB = 100
- Unit weight = 0.5
- Insurance = 3.7%
- Rework / defects = 50
- Packaging / stickering = 30
- Markup = 100%
- Taxes = 6%

Expected approximate outputs:
- Purchase in RUB = 1350
- Cargo cost = 100
- Insurance = 49.95
- Total cost = 1599.95
- Retail price = 3199.90
- Taxes = 191.99
- Profit = 1407.96
- Margin ≈ 44.0%

Note: If UI displays rounded whole rubles, results can appear as:
- 1350 / 100 / 50 / 1600 / 3200 / 192 / 1408 / 44%

Both are acceptable if the rounding behavior is consistent and documented.

---

## 14. PWA requirements

## Must have
- `manifest.json`
- installable app metadata
- service worker
- offline app shell caching

## Offline behavior
After first successful load, user must be able to:
- open the calculator without internet,
- use the saved scenario,
- recalculate locally.

## Not required in MVP
- background sync
- push notifications
- API caching strategy
- multi-page offline routing

---

## 15. Suggested project structure

```text
/src
  /css
    styles.css
  /js
    app.js
    state.js
    formulas.js
    formatters.js
    validation.js
    storage.js
    example-data.js
    sw-register.js
  index.html
  manifest.json
  service-worker.js
```

---

## 16. Functional requirements

## FR-1 Input editing
The user can edit all business input fields from the calculator screen.

## FR-2 Auto recalculation
All computed values update automatically when valid input changes.

## FR-3 Author logic preservation
The implemented formulas must match the formulas listed in this specification.

## FR-4 Percentage normalization
Insurance, markup, and tax values must accept both `6` and `0.06`.

## FR-5 Example scenario
The user can populate the form with the built-in example scenario.

## FR-6 Local persistence
The user can save and restore the last scenario from local storage.

## FR-7 Offline availability
The calculator works offline after the first successful load.

## FR-8 Result visibility
The user sees the five main KPIs clearly:
- total cost,
- retail price,
- taxes,
- profit,
- margin.

## FR-9 Validation
The app must prevent silent calculation errors caused by empty or invalid inputs.

## FR-10 Reset
The user can reset the form to default empty state or default example state, depending on implementation choice.

---

## 17. Non-functional requirements

## Performance
- First screen should feel instant on a modern mobile phone.
- Calculator logic should run locally with no network dependency.

## Reliability
- No broken calculations on simple user input.
- No `NaN`, `Infinity`, or blank silent failures in results.

## Maintainability
- Formula logic must be isolated in a dedicated module.
- UI rendering must not duplicate business formulas.

## Accessibility
- Inputs have labels.
- Buttons are large enough for touch.
- Color alone must not be the only validation signal.

---

## 18. Pareto test plan

The goal is to test the author’s logic well **without overloading MVP**.

## 18.1 Unit test scope
Test only the highest-value logic:
- normalization,
- formula correctness,
- safe division,
- invalid input handling.

## 18.2 Recommended test files
```text
/tests
  formulas.test.js
  validation.test.js
  storage.test.js
```

## 18.3 Core formula tests

### TC-01 Happy path from spreadsheet example
Input:
- unitPriceCny = 100
- cnyRubRate = 13.5
- localDeliveryRub = 20
- cargoRateUsdPerKg = 2
- usdRubRate = 100
- unitWeightKg = 0.5
- insuranceRate = 0.037
- reworkRub = 50
- packagingRub = 30
- markupRate = 1
- taxRate = 0.06

Expected:
- purchaseRub = 1350
- cargoCostRub = 100
- insuranceRub = 49.95
- totalCostRub = 1599.95
- retailPriceRub = 3199.90
- taxRub = 191.994
- profitRub = 1407.956
- marginRate ≈ 0.43999875

Assertion rule:
- compare with tolerance `±0.01` for RUB results,
- compare margin with tolerance `±0.0001`.

### TC-02 Percent normalization using whole percent input
Input:
- markupRate = 100
- taxRate = 6
- insuranceRate = 3.7

Expected normalized:
- markup = 1
- tax = 0.06
- insurance = 0.037

### TC-03 Percent normalization using decimal input
Input:
- markupRate = 1
- taxRate = 0.06
- insuranceRate = 0.037

Expected:
- values remain unchanged after normalization.

### TC-04 Zero taxes
Given valid positive inputs and taxRate = 0  
Expected:
- taxRub = 0
- profitRub = retailPriceRub - totalCostRub

### TC-05 Zero markup
Given valid positive inputs and markupRate = 0  
Expected:
- retailPriceRub = totalCostRub
- profitRub = -taxRub
- margin can be negative

This is important because it reflects real math and should not be masked.

### TC-06 Zero retail safe division
Given:
- totalCostRub = 0
- markupRate = 0
- taxRate = 0

Expected:
- retailPriceRub = 0
- profitRub = 0
- marginRate = 0
- no division error

### TC-07 Cargo formula dependency
Given:
- unitWeightKg = 2
- cargoRateUsdPerKg = 1.5
- usdRubRate = 90

Expected:
- cargoCostRub = 270

### TC-08 Total cost sum integrity
Expected:
```text
totalCostRub =
purchaseRub + localDeliveryRub + cargoCostRub + insuranceRub + reworkRub + packagingRub
```
No missing or duplicated cost line items.

### TC-09 Invalid negative input
Given:
- unitWeightKg = -1

Expected:
- validation error,
- dependent results not shown as valid,
- no silent calculation.

### TC-10 Empty required field
Given:
- unitPriceCny empty

Expected:
- validation error,
- purchaseRub and dependent outputs show placeholder `—`.

## 18.4 Validation/UI smoke tests
Minimum manual smoke tests:
1. Load example and confirm KPIs are populated.
2. Change markup and confirm retail price, taxes, profit, margin update instantly.
3. Turn on airplane mode after first load and confirm app still opens.
4. Save locally, refresh, restore scenario.
5. Enter invalid text in numeric field and confirm visible validation.

---

## 19. Acceptance criteria

## AC-1 Formula parity
The implemented calculator reproduces the business formulas defined in this document.

## AC-2 Example parity
The built-in example produces outputs matching the current spreadsheet example within documented rounding tolerance.

## AC-3 Offline usability
After first load, the calculator is usable offline.

## AC-4 Mobile usability
The app is usable on a narrow mobile viewport without horizontal scrolling.

## AC-5 Validation quality
Invalid or missing inputs do not produce silent wrong numbers.

## AC-6 Persistence
The latest scenario can be saved locally and restored.

## AC-7 Simplicity
The first screen shows the five main KPI outputs without overwhelming the user.

---

## 20. Implementation notes for developers

## Business logic separation
All formulas must live in a single module such as:
- `formulas.js`

UI code must call formula helpers and never duplicate the math in event handlers.

## Suggested formula API
```js
normalizePercent(value)
calculatePurchaseRub(input)
calculateCargoCostRub(input)
calculateInsuranceRub(input)
calculateTotalCostRub(input)
calculateRetailPriceRub(input)
calculateTaxRub(input)
calculateProfitRub(input)
calculateMarginRate(input)
calculateAll(input)
```

## Validation API
```js
validateField(name, value)
validateScenario(input)
```

## Storage API
```js
saveScenario(input)
loadScenario()
clearScenario()
```

---

## 21. Junior-friendly implementation breakdown

## Phase 1 — Static shell
- Create `index.html`
- Add grouped form sections
- Add result cards
- Add mobile-first CSS

## Phase 2 — Formula engine
- Implement percent normalization
- Implement all calculation helpers
- Wire recalculation to input changes

## Phase 3 — Validation
- Add field-level validation
- Prevent invalid computed outputs

## Phase 4 — Persistence
- Add localStorage save/load/reset

## Phase 5 — PWA
- Add manifest
- Add service worker
- Verify offline shell

## Phase 6 — Tests
- Add formula tests
- Add validation smoke tests
- Run example scenario checks

---

## 22. Future extensions (not MVP)

These are deliberately excluded now, but the code should not block them later:

- density-based volumetric pricing,
- customs / import duty modeling,
- marketplace commissions,
- packaging split into multiple lines,
- multiple products,
- scenario comparison,
- CSV export,
- live exchange-rate fetch,
- multi-currency presets,
- shareable calculation links.

---

## 23. Final delivery definition

The MVP is complete when the team delivers:

1. a mobile-friendly PWA calculator,
2. the exact preserved author logic from this spec,
3. local save/load,
4. offline availability,
5. Pareto-level test coverage for the formulas and validation,
6. an example scenario matching the spreadsheet draft.

