# RFC — China Product Cost & Profit Calculator MVP

## Document status
Draft v1

## Audience
Frontend developer, product engineer, junior developer, QA

## Goal
Build a **mobile-first PWA calculator** that converts the current Excel draft into a usable prototype for daily product economics checks.

The RFC keeps the author’s current calculation logic intact and improves delivery quality in three ways:
- makes the logic explicit and testable;
- turns spreadsheet structure into a clean mobile interaction model;
- reduces user effort with guided input, presets, autofill patterns, and lightweight visual feedback.

---

## 1. Source of truth and preservation policy

### Source inputs used for this RFC
1. The uploaded MVP technical specification.
2. The uploaded Excel workbook draft.
3. The UX intent stated in the task: **minimum manual input, maximum clarity, modern UI, mobile first, light/dark theme, fake-data examples, and a guided “what should I fill in?” flow**.

### Preservation policy
This RFC does **not** invent new financial logic.

The implementation must preserve the current formula chain already documented in the source spec:
- Purchase in RUB = Unit price (CNY) × CNY/RUB rate
- Cargo cost = Unit weight × Cargo rate (USD/kg) × USD/RUB rate
- Insurance = Purchase in RUB × Insurance %
- Total cost = Purchase + China delivery + Cargo + Insurance + Rework + Packaging
- Retail price = Total cost × (1 + Markup %)
- Taxes = Retail price × Tax %
- Profit per unit = Retail price − Total cost − Taxes
- Margin % = Profit per unit / Retail price

### Important alignment note
The workbook visually implies cargo conversion via USD but does not expose a separate visible **USD/RUB** input field. The prototype **must include USD/RUB as an explicit editable input**.

### Important non-formula note
**Density (kg/m³)** remains in the data model and UI, but is **not used in MVP calculations**. It is stored for future logistics rules only.

---

## 2. Product outcome

The delivered prototype should let a user answer one core question fast:

> "If I source this product from China, what is my real unit cost, expected retail price, tax amount, profit, and margin in RUB?"

This is not a spreadsheet replacement. It is a **decision-support MVP** optimized for mobile use and demo readiness.

## 2.1 Language and target audience

**Primary language: Russian**

The application interface, labels, help text, and all user-facing content must be in **Russian**, tailored for Russian entrepreneurs and small business owners engaged in importing goods from China.

### Target user profile
- Small business owners importing from China
- Marketplace sellers (Wildberries, Ozon, Yandex Market)
- Sourcing managers and procurement specialists
- Individual entrepreneurs (ИП) and self-employed (самозанятые)

### Localization requirements
- All UI labels, buttons, and instructions in Russian
- Currency formatting: Russian ruble (₽) with proper spacing (e.g., "1 599,95 ₽")
- Number formatting: comma as decimal separator (e.g., "13,5" instead of "13.5")
- Date format: DD.MM.YYYY
- Terminology aligned with Russian business/accounting practices:
  - "Себестоимость" (Total cost)
  - "Наценка" (Markup)
  - "Налоги" (Taxes)
  - "Прибыль" (Profit)
  - "Маржа" (Margin)
  - "Страховка" (Insurance)
  - "Переработка" (Rework)
  - "Упаковка" (Packaging)

---

## 3. Product principles

### 3.1 MVP principles
- Preserve the author’s math.
- Reduce friction versus Excel.
- Keep the first screen calm and understandable.
- Show the most important signals first.
- Avoid hidden business assumptions.
- Work offline after first load.

### 3.2 UX principles
- One-screen flow by default.
- Auto-calculate on valid input change.
- Show only top KPIs at first glance.
- Put detail behind collapsible sections.
- Prefer inline help over long instructions.
- Prefer visual summaries over dense result tables.

### 3.3 Non-goals
The MVP must **not** include:
- live exchange-rate APIs;
- backend or user accounts;
- marketplace commissions;
- customs/VAT logic beyond current source formulas;
- multi-product scenarios;
- PDF export;
- scenario comparison tables.

---

## 4. User and primary jobs-to-be-done

### Primary users
- small importer;
- marketplace seller;
- sourcing manager;
- founder or operator validating product unit economics.

### Primary JTBD
- Understand full landed unit cost before ordering.
- Understand whether margin survives taxes and extra costs.
- Demo a product idea quickly using fake or sample data.
- Revisit the latest scenario later without re-entering everything.

---

## 5. UX concept

## 5.1 Interaction model
The calculator is a **single-screen mobile page** with 5 logical blocks:
1. Product
2. Logistics
3. Extra costs
4. Sales settings
5. Results

Each block is rendered as a clean card or accordion section.

## 5.2 First-screen hierarchy
The first viewport should show:
- page title;
- short one-line subtitle;
- 3 primary action buttons;
- top KPI row;
- first input group.

### Primary actions
1. **Load Example A**
2. **Load Example B**
3. **Calculate / What to fill**

### Why keep a Calculate button if the UI auto-calculates
Auto-calculation remains the default behavior.

The explicit button is kept for user confidence and onboarding:
- if required fields are missing, it opens a bottom sheet or inline checklist with missing fields;
- if fields are valid, it scrolls to Results and briefly highlights updated KPI cards;
- this matches the user expectation of a “calculate” action without introducing spreadsheet-style friction.

## 5.3 Required visual output
The app should highlight only these 5 KPI cards:
- Total cost
- Retail price
- Taxes
- Profit per unit
- Margin %

Below that, show one compact **cost breakdown visualization**.

### Recommended visualization
A simple **stacked horizontal composition bar** or segmented list with these parts:
- Purchase
- China delivery
- Cargo
- Insurance
- Rework
- Packaging
- Taxes
- Profit

No chart library is required. CSS-only bars are enough.

## 5.4 Minimal-manual-input features
The prototype should reduce user work with:
- example presets;
- local save/restore;
- auto-recalculation;
- percent normalization (`6` and `0.06` both supported);
- smart placeholders and units;
- a guided missing-input checklist;
- last-used scenario restore on reopen.

---

## 6. Screens and UI behavior

## 6.1 Main screen — Calculator

### Header area
- Title: `China Product Calculator`
- Subtitle: `Estimate landed cost, taxes, profit, and margin in RUB`
- Theme toggle: light / dark
- Optional small icon button: `?` for formula help

### Action strip
- `Load Example A`
- `Load Example B`
- `Calculate / What to fill`
- secondary text action: `Reset`
- secondary text action: `Save locally`

### KPI section
Five cards in priority order:
1. Total cost
2. Retail price
3. Profit per unit
4. Margin %
5. Taxes

### Input sections
#### Section A — Product
- Product name
- SKU / Article
- Unit price (CNY)
- CNY/RUB exchange rate

#### Section B — Logistics
- Delivery in China (RUB)
- Density (kg/m³)
- Cargo rate (USD/kg)
- USD/RUB exchange rate
- Unit weight (kg)
- Insurance (%)

#### Section C — Extra costs
- Rework / defects (RUB)
- Packaging / stickering (RUB)

#### Section D — Sales settings
- Markup (%)
- Taxes (%)

### Results details section
Read-only values:
- Purchase in RUB
- Cargo cost
- Insurance cost
- Total cost
- Retail price
- Taxes amount
- Profit per unit
- Margin %

### Visual breakdown section
After valid calculation, show:
- total composition bar;
- optional two-column key-value breakdown;
- one short text summary, for example:
  - `Main cost driver: purchase`
  - `Estimated profit remains positive after tax`

## 6.2 Bottom sheet / help modal
One reusable sheet component.

It serves 2 modes:

### Mode A — What to fill in
Shown when user taps `Calculate / What to fill` with invalid or missing required fields.

It lists missing required inputs in human language, for example:
- Enter unit price in CNY
- Enter CNY/RUB rate
- Enter cargo rate in USD/kg
- Enter USD/RUB rate
- Enter unit weight in kg
- Enter markup %
- Enter tax %

Tapping an item scrolls to the corresponding field.

### Mode B — Formula help
Shows brief formula explanations and notes:
- cargo uses USD/RUB;
- percent fields accept `6` or `0.06`;
- density is saved but not used yet.

---

## 7. Data model

## 7.1 Input model
```ts
interface CalculatorInput {
  productName: string;
  sku: string;
  unitPriceCny: number | null;
  cnyRubRate: number | null;
  chinaDeliveryRub: number | null;
  densityKgM3: number | null;
  cargoRateUsdPerKg: number | null;
  usdRubRate: number | null;
  unitWeightKg: number | null;
  insuranceRate: number | null;
  reworkRub: number | null;
  packagingRub: number | null;
  markupRate: number | null;
  taxRate: number | null;
}
```

## 7.2 Derived output model
```ts
interface CalculatorOutput {
  purchaseRub: number | null;
  cargoCostRub: number | null;
  insuranceRub: number | null;
  totalCostRub: number | null;
  retailPriceRub: number | null;
  taxRub: number | null;
  profitRub: number | null;
  marginRate: number | null;
}
```

## 7.3 UI state model
```ts
interface UiState {
  theme: 'light' | 'dark' | 'system';
  activePresetId: 'example-a' | 'example-b' | null;
  touchedFields: Record<string, boolean>;
  fieldErrors: Record<string, string | null>;
  lastSavedAt: string | null;
  hasValidCalculation: boolean;
}
```

---

## 8. Field-level specification

| Key | Label | Type | Required | Rules | Notes |
|---|---|---|---|---|---|
| productName | Product name | text | No | max 120 chars | Demo-friendly |
| sku | SKU / Article | text | No | max 80 chars | Optional |
| unitPriceCny | Unit price | number | Yes | >= 0 | CNY |
| cnyRubRate | CNY/RUB | number | Yes | > 0 | Editable input |
| chinaDeliveryRub | Delivery in China | number | Yes | >= 0 | RUB |
| densityKgM3 | Density | number | No | >= 0 | Saved only |
| cargoRateUsdPerKg | Cargo rate | number | Yes | >= 0 | USD/kg |
| usdRubRate | USD/RUB | number | Yes | > 0 | Explicit input |
| unitWeightKg | Unit weight | number | Yes | >= 0 | kg |
| insuranceRate | Insurance | number | Yes | >= 0 | Normalize percent |
| reworkRub | Rework / defects | number | Yes | >= 0 | RUB |
| packagingRub | Packaging / stickering | number | Yes | >= 0 | RUB |
| markupRate | Markup | number | Yes | >= 0 | Normalize percent |
| taxRate | Taxes | number | Yes | >= 0 | Normalize percent |

### UX formatting rules
- Use numeric keyboard on mobile.
- Show units inline on the right side of the field.
- Use placeholders, not default zeroes, for empty state.
- Empty required fields should display a placeholder result `—` for dependent outputs.

---

## 9. Formula engine

## 9.1 Normalization rule
Percent fields support both formats:
- `6` = `6%`
- `0.06` = `6%`

```ts
normalizePercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value > 1 ? value / 100 : value;
}
```

## 9.2 Core formulas
```ts
purchaseRub = unitPriceCny * cnyRubRate
cargoCostRub = unitWeightKg * cargoRateUsdPerKg * usdRubRate
insuranceRub = purchaseRub * insuranceRateNormalized

totalCostRub =
  purchaseRub +
  chinaDeliveryRub +
  cargoCostRub +
  insuranceRub +
  reworkRub +
  packagingRub

retailPriceRub = totalCostRub * (1 + markupRateNormalized)
taxRub = retailPriceRub * taxRateNormalized
profitRub = retailPriceRub - totalCostRub - taxRub
marginRate = retailPriceRub <= 0 ? 0 : profitRub / retailPriceRub
```

## 9.3 Calculation invariants
- No formula should return `NaN`.
- No formula should return `Infinity`.
- If any required dependency for an output is invalid, that output returns `null`.
- UI formatting converts `null` to `—`.
- Internal calculations keep JS number precision.
- Displayed monetary values are rounded to 2 decimals.

## 9.4 Workbook-to-app mapping
This mapping is important for preserving author logic while improving the UX.

| Workbook row meaning | App representation |
|---|---|
| Unit price (CNY) | editable input |
| CNY/RUB | editable input |
| Purchase in RUB | computed output |
| Delivery in China | editable input |
| Density | editable input, not used in math |
| Cargo rate | editable input |
| Unit weight | editable input |
| Cargo cost | computed output |
| Insurance % | editable input |
| Insurance amount | computed output |
| Rework / defects | editable input |
| Packaging | editable input |
| Total cost | computed output |
| Markup % | editable input |
| Retail price | computed output |
| Taxes (example 6%) | split into editable **tax rate** and computed **tax amount** |
| Profit | computed output |
| Margin % | computed output |

---

## 10. Validation behavior

## 10.1 Validation rules
- Reject non-numeric values in numeric fields.
- Negative values are not allowed.
- Exchange rates must be greater than zero.
- Weight may be zero.
- Required numeric blanks invalidate dependent outputs.

## 10.2 Validation messages
Use short, clear messages:
- `Required field`
- `Enter a valid number`
- `Value must be 0 or higher`
- `Rate must be greater than 0`

## 10.3 UX behavior on invalid state
- Do not show blocking alerts.
- Show inline errors under fields.
- Keep already-entered values.
- Show invalid results as `—`.
- When the main button is tapped, open the missing-input checklist.

---

## 11. Result formatting

## 11.1 Currency and number formatting
- RUB: `1 599.95 ₽`
- CNY: `100 ¥`
- Percent output: `44.0%`
- Weight: `0.5 kg`
- Rate: `2.00 USD/kg`

## 11.2 Rounding
- Internal math: unrounded JS numbers.
- UI output: rounded to 2 decimals.
- Optional future display rule: hide `.00` for cleaner demos.

## 11.3 Result summary copy
Below the KPI row, show one short generated sentence.

Examples:
- `Estimated margin is healthy for the current settings.`
- `Taxes materially reduce final profit.`
- `Cargo is the largest non-purchase cost in this scenario.`

This is display-only helper text and must not add any business logic.

---

## 12. Example presets

The prototype must include at least **2 fake-data presets**.

## 12.1 Example A — Spreadsheet baseline
This preset mirrors the source workbook example as closely as possible.

### Input values
- Product name: `Product A`
- SKU: `SKU-001`
- Unit price (CNY): `100`
- CNY/RUB: `13.5`
- Delivery in China (RUB): `20`
- Density (kg/m³): `250`
- Cargo rate (USD/kg): `2`
- USD/RUB: `100`
- Unit weight (kg): `0.5`
- Insurance (%): `3.7`
- Rework / defects (RUB): `50`
- Packaging / stickering (RUB): `30`
- Markup (%): `100`
- Taxes (%): `6`

### Expected outputs
- Purchase in RUB: `1350`
- Cargo cost: `100`
- Insurance: `49.95`
- Total cost: `1599.95`
- Retail price: `3199.90`
- Taxes: `191.99`
- Profit: `1407.96`
- Margin: `44.0%` approx.

## 12.2 Example B — Alternative fake scenario
This is a second demo preset for prototype presentations.

### Input values
- Product name: `Product B`
- SKU: `SKU-002`
- Unit price (CNY): `75`
- CNY/RUB: `14`
- Delivery in China (RUB): `30`
- Density (kg/m³): `180`
- Cargo rate (USD/kg): `2.5`
- USD/RUB: `95`
- Unit weight (kg): `0.8`
- Insurance (%): `3`
- Rework / defects (RUB): `40`
- Packaging / stickering (RUB): `25`
- Markup (%): `80`
- Taxes (%): `6`

### Expected outputs
- Purchase in RUB: `1050.00`
- Cargo cost: `190.00`
- Insurance: `31.50`
- Total cost: `1366.50`
- Retail price: `2459.70`
- Taxes: `147.58`
- Profit: `945.62`
- Margin: `38.4%` approx.

## 12.3 Preset behavior
- Loading a preset replaces current input values.
- It also clears validation errors.
- It sets `activePresetId`.
- It triggers immediate recalculation.
- It does not auto-save unless the user explicitly saves.

---

## 13. Theme system

## 13.1 Theme requirements
The app must support:
- light theme;
- dark theme;
- optional `system` mode if simple to ship.

## 13.2 Implementation rule
Use CSS custom properties for all visual tokens.

Example token groups:
- background
- surface
- text primary
- text secondary
- border
- accent
- success
- warning
- error
- card shadow

## 13.3 Theme persistence
Persist the selected theme in `localStorage`.

---

## 14. Architecture and module boundaries

## 14.1 Stack
Recommended MVP stack:
- HTML5
- CSS3
- Vanilla JavaScript with ES modules
- PWA manifest
- Service worker
- localStorage

Optional tooling:
- Vite for local dev/build convenience

## 14.2 Project structure
```text
/src
  index.html
  manifest.json
  service-worker.js
  /css
    styles.css
    tokens.css
  /js
    app.js
    state.js
    formulas.js
    validation.js
    formatters.js
    storage.js
    example-data.js
    theme.js
    ui/
      fields.js
      kpis.js
      breakdown.js
      bottom-sheet.js
      accordions.js
```

## 14.3 Module responsibilities
### `formulas.js`
Pure business math only.

### `validation.js`
Field validation, scenario validation, required-field list generation.

### `formatters.js`
Currency, percent, weight, and rate formatting helpers.

### `storage.js`
Read/write latest scenario, theme, saved timestamp.

### `state.js`
In-memory app state and update helpers.

### `app.js`
Wire input events, button actions, render cycle.

### `theme.js`
Theme toggle and persisted theme initialization.

### `ui/*`
DOM rendering and UI interactions only. No business math.

---

## 15. State and render flow

## 15.1 Render cycle
1. User edits field.
2. Raw value is parsed.
3. Field validation runs.
4. Scenario validation runs.
5. If valid dependencies exist, formulas run.
6. UI re-renders inputs, KPI cards, detail results, and visualization.
7. No page reload.

## 15.2 Button behaviors
### `Calculate / What to fill`
- invalid state: open checklist bottom sheet;
- valid state: scroll to results and pulse KPI cards for 400–600 ms.

### `Load Example A / B`
- load preset;
- recalculate;
- scroll results into view.

### `Save locally`
- save full input model, theme, active preset, timestamp.
- show lightweight inline confirmation.

### `Reset`
- clear all editable inputs;
- clear validation and outputs;
- keep theme unchanged.

---

## 16. Persistence and offline behavior

## 16.1 localStorage keys
```text
chinaCalc.latestScenario
chinaCalc.theme
chinaCalc.lastSavedAt
chinaCalc.version
```

## 16.2 Load rules
On app load:
1. initialize theme;
2. try to restore latest scenario;
3. if restore exists, populate inputs and recalculate;
4. otherwise show empty state with preset buttons.

## 16.3 Offline rules
After first successful load, user must be able to:
- reopen the calculator offline;
- use restored local data;
- switch presets;
- recalculate without network.

## 16.4 Service worker scope
Cache only:
- HTML shell;
- CSS;
- JS;
- icons;
- manifest.

Do not introduce complex runtime caching in MVP.

---

## 17. Accessibility requirements

- Every input has a visible label.
- Errors are text-based, not color-only.
- Tap targets are large enough for thumb interaction.
- Fields remain usable at narrow mobile width without horizontal scrolling.
- Theme contrast should remain readable in both light and dark modes.
- Accordion headers and buttons must be keyboard accessible.

---

## 18. Testing strategy

## 18.1 Unit tests
Minimum automated coverage:
- percent normalization;
- formula happy path;
- safe division;
- negative input rejection;
- empty required field behavior;
- preset loading;
- local storage read/write.

## 18.2 Required unit test cases
### TC-01 Spreadsheet baseline
Verify Example A matches the preserved source outputs within tolerance.

### TC-02 Percent whole-number normalization
`100 -> 1`, `6 -> 0.06`, `3.7 -> 0.037`

### TC-03 Percent decimal normalization
`1 -> 1`, `0.06 -> 0.06`, `0.037 -> 0.037`

### TC-04 Zero tax
Tax becomes `0`; profit updates correctly.

### TC-05 Zero markup
Retail equals total cost; profit may be negative after tax.

### TC-06 Safe division
Zero retail produces margin `0`, not an error.

### TC-07 Cargo dependency check
Weight × cargo rate × USD/RUB produces correct RUB cargo cost.

### TC-08 Total sum integrity
No cost line is omitted or duplicated.

### TC-09 Negative input rejected
Invalid field shows error and dependent outputs remain invalid.

### TC-10 Empty required field
Result cards show `—` for dependent outputs.

## 18.3 Manual smoke tests
1. Load Example A and verify all KPI cards populate.
2. Change markup and verify retail price, tax, profit, margin update immediately.
3. Tap `Calculate / What to fill` on empty form and confirm missing-input checklist appears.
4. Save locally, refresh, and verify scenario restores.
5. Switch to dark theme and refresh; theme remains applied.
6. Go offline after first load and verify calculator still opens.

---

## 19. Acceptance criteria

### Functional
- Calculator reproduces preserved source formulas.
- USD/RUB is available as a user input.
- Density is stored but not used in calculations.
- App supports 2 demo presets.
- Required values validate correctly.
- Results update automatically on valid input.

### UX
- Mobile viewport has no horizontal scrolling.
- Only 5 top KPIs dominate the first result level.
- A visible action helps users understand what must be filled in.
- Light and dark themes are both available.

### Technical
- Works offline after first load.
- Latest scenario can be saved and restored locally.
- No `NaN` or `Infinity` appears in UI.
- Formula logic is isolated from UI rendering.

---

## 20. Delivery plan

## Phase 1 — Shell and layout
Deliver:
- HTML structure
- mobile-first CSS
- theme tokens
- input cards
- KPI cards
- accordion sections

## Phase 2 — Formula engine
Deliver:
- pure formula module
- normalized percent handling
- derived outputs
- formatting helpers

## Phase 3 — Validation and guidance
Deliver:
- field validation
- dependent invalidation
- missing-input checklist
- calculate button behavior

## Phase 4 — Presets and persistence
Deliver:
- Example A/B presets
- save locally
- restore scenario
- reset behavior

## Phase 5 — PWA and offline
Deliver:
- manifest
- icons
- service worker
- offline shell

## Phase 6 — QA and polish
Deliver:
- unit tests
- smoke test pass
- animation polish
- responsive bug fixes

---

## 21. Junior-friendly task split

### Task 1
Build static screen with cards, fields, sections, and action strip.

### Task 2
Create `formulas.js` and `formatters.js` with pure functions.

### Task 3
Wire inputs to state and auto-calculation.

### Task 4
Implement validation and error messages.

### Task 5
Build bottom sheet for `What to fill` and formula help.

### Task 6
Implement Example A and Example B presets.

### Task 7
Add local save, restore, reset, and theme persistence.

### Task 8
Add service worker, manifest, and offline checks.

### Task 9
Write unit tests and run smoke checklist.

---

## 22. Open questions deliberately deferred from MVP

These should be explicitly deferred, not half-implemented:
- density-driven volumetric cargo pricing;
- customs / duty / VAT layers;
- marketplace fees and payout logic;
- multiple packaging lines;
- scenario compare mode;
- live FX rates;
- shareable links or export.

---

## 23. Final definition of done

The MVP is ready to demo when the team can show:
1. a one-screen mobile-first calculator;
2. formula parity with the preserved source logic;
3. a working `Calculate / What to fill` guidance flow;
4. 2 fake-data presets for demos;
5. clear KPI cards plus one compact cost visualization;
6. local save/restore;
7. light/dark theme toggle;
8. offline PWA behavior after first load;
9. Pareto-level automated tests for formulas and validation.

