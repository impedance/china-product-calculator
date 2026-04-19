# Micro-spec: Add CNY exchange-rate endpoint using CBR JSON feed

## Goal
Add a small backend endpoint that fetches the latest official **CNY to RUB** rate from the public CBR JSON feed and exposes it in a simple, stable format for the project frontend and internal services.

Source feed:
- `https://www.cbr-xml-daily.ru/daily_json.js`

## Business purpose
The endpoint will be used by the calculator to convert:
- **RUB -> CNY**
- optionally **CNY -> RUB**

The rate must be based on the **official Central Bank of Russia daily rate**.

---

## Scope
Implement **one project endpoint** that:
1. Requests the latest data from the CBR JSON feed.
2. Extracts the `CNY` object.
3. Calculates the rate for **1 CNY in RUB**.
4. Returns a normalized JSON response.
5. Handles temporary upstream errors safely.
6. Uses lightweight caching to avoid unnecessary repeated upstream calls.

---

## External source details
Upstream URL:
- `https://www.cbr-xml-daily.ru/daily_json.js`

Expected relevant payload fragment:
```json
{
  "Date": "2026-04-19T11:30:00+03:00",
  "PreviousDate": "2026-04-18T11:30:00+03:00",
  "Timestamp": "2026-04-18T20:00:00+03:00",
  "Valute": {
    "CNY": {
      "ID": "...",
      "NumCode": "156",
      "CharCode": "CNY",
      "Nominal": 1,
      "Name": "Chinese Yuan",
      "Value": 11.42,
      "Previous": 11.38
    }
  }
}
```

Important:
- `Value` is the amount of RUB for `Nominal` units of CNY.
- The normalized rate must be calculated as:

```text
rubPerCny = Value / Nominal
```

---

## Required endpoint

### Option A (preferred)
`GET /api/exchange-rate/cny`

### Response format
```json
{
  "success": true,
  "base": "CNY",
  "quote": "RUB",
  "rubPerCny": 11.42,
  "cnyPerRub": 0.08756567,
  "nominal": 1,
  "source": "CBR",
  "sourceUrl": "https://www.cbr-xml-daily.ru/daily_json.js",
  "effectiveDate": "2026-04-19T11:30:00+03:00",
  "timestamp": "2026-04-18T20:00:00+03:00"
}
```

### Calculation rules
- `rubPerCny = Value / Nominal`
- `cnyPerRub = 1 / rubPerCny`

Recommended rounding:
- `rubPerCny`: up to 6 decimal places
- `cnyPerRub`: up to 8 decimal places

---

## Functional requirements

### 1. Fetching
- Use server-side HTTP request to the upstream CBR JSON feed.
- Parse response as JSON.
- Extract `Valute.CNY`.

### 2. Validation
If any of the following is missing or invalid, return an internal error:
- top-level response is not valid JSON
- `Valute` is missing
- `Valute.CNY` is missing
- `Nominal` is missing or `<= 0`
- `Value` is missing or not numeric

### 3. Caching
Implement simple cache on the project side:
- cache TTL: **1 hour** minimum
- acceptable TTL: **1 to 6 hours**
- on repeated requests during TTL, serve cached value instead of requesting upstream again

Reason:
- CBR daily feed is not real-time
- no need to hit upstream on every calculator request

### 4. Error handling
If upstream request fails:
- if cached value exists and is not too old, return cached value with an additional flag:
```json
{
  "stale": true
}
```
- if no cached value exists, return:
```json
{
  "success": false,
  "error": "Failed to load CNY exchange rate"
}
```

Recommended HTTP status:
- `200` for successful response
- `200` for stale cached fallback
- `502` if upstream failed and no cached value is available
- `500` for unexpected internal parsing/runtime errors

### 5. Logging
Log only technical events:
- upstream request started/failed
- cache hit / cache miss
- invalid upstream structure

Do not log sensitive user data.

---

## Non-functional requirements
- Keep implementation minimal and easy to maintain.
- Do not add heavy dependencies if native fetch / existing HTTP client is already available.
- Endpoint must respond quickly on cache hit.
- Code should be clean and production-safe.
- Add basic unit or integration test if the project already has a test setup.

---

## Suggested implementation notes
Any stack is acceptable, but implementation should follow this logic:

1. Fetch upstream JSON.
2. Read:
   - `date = payload.Date`
   - `timestamp = payload.Timestamp`
   - `nominal = payload.Valute.CNY.Nominal`
   - `value = payload.Valute.CNY.Value`
3. Compute:
   - `rubPerCny = value / nominal`
   - `cnyPerRub = 1 / rubPerCny`
4. Return normalized response object.
5. Cache normalized response.

---

## Acceptance criteria
The task is done when:

- [ ] `GET /api/exchange-rate/cny` is available in the project
- [ ] endpoint fetches data from `https://www.cbr-xml-daily.ru/daily_json.js`
- [ ] endpoint returns normalized JSON with `rubPerCny` and `cnyPerRub`
- [ ] endpoint correctly uses `Value / Nominal`
- [ ] endpoint has caching
- [ ] endpoint handles upstream failure gracefully
- [ ] endpoint returns stale cached data if upstream is temporarily unavailable
- [ ] implementation does not break existing project routes

---

## Nice-to-have (optional)
If it is very easy within current project architecture, optionally add:
- query param support:
  - `GET /api/exchange-rate/cny?amountRub=1000`
- and return:
```json
{
  "convertedCny": 87.56
}
```

But this is **optional**.
Primary task is the normalized rate endpoint.

---

## Very short developer summary
Create one backend endpoint that fetches the latest `CNY` rate from `https://www.cbr-xml-daily.ru/daily_json.js`, calculates `rubPerCny = Value / Nominal`, returns normalized JSON, and uses simple caching plus safe fallback on upstream failure.
