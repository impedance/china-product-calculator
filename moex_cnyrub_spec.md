# Technical Specification: CNY/RUB Exchange Rate Integration via MOEX ISS

## Goal
Integrate the current **CNY/RUB** exchange rate from **MOEX ISS API** into the calculator so the app can convert Chinese yuan amounts into Russian rubles.

## Scope
Implement a small exchange-rate layer that:
- fetches the latest **CNY/RUB** rate from MOEX,
- exposes a normalized value for the calculator,
- uses a fallback source if MOEX is unavailable,
- returns update timestamp and source metadata.

## Primary Data Source
Use **MOEX ISS API** with instrument:
- **Engine:** `currency`
- **Market:** `selt`
- **Board:** `CETS`
- **Security:** `CNYRUB_TOM`

### Endpoint
```text
https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/CNYRUB_TOM.json?iss.meta=off&iss.only=marketdata&marketdata.columns=SECID,LAST,MARKETPRICE,LCURRENTPRICE,UPDATETIME,SYSTIME
```

## Functional Requirements

### 1. Fetch current rate
The system must request MOEX market data for `CNYRUB_TOM`.

### 2. Parse response
The system must extract the rate using the following priority:
1. `LAST`
2. `MARKETPRICE`
3. `LCURRENTPRICE`

If all three values are empty or invalid, the request must be treated as failed.

### 3. Normalize output
The integration layer must return a normalized object:

```json
{
  "pair": "CNY/RUB",
  "rate": 11.23,
  "source": "MOEX",
  "updatedAt": "12:34:56"
}
```

### 4. Fallback
If MOEX is unavailable, returns invalid data, or times out, the system must use a fallback provider.

Recommended fallback:
- **CBR daily exchange rate**

### 5. Caching
To reduce load and improve stability, the system should cache the fetched rate.

Recommended TTL:
- **30 to 120 seconds** for MOEX-based data

### 6. Calculator usage
The calculator must use the normalized `rate` value to convert CNY amounts into RUB.

Formula:
```text
RUB = CNY * rate
```

## Non-Functional Requirements
- Keep the integration isolated in a dedicated module/service.
- Do not couple calculator business logic directly to MOEX response format.
- Handle network errors gracefully.
- Return clear source metadata (`MOEX` or fallback source).
- Prefer server-side fetching over direct browser calls.

## Recommended Architecture
Implement a small backend endpoint such as:

```text
GET /api/exchange-rate/cny-rub
```

This endpoint should:
1. fetch data from MOEX,
2. normalize the response,
3. apply fallback if needed,
4. return a simple JSON payload for the frontend.

## Suggested Response Contract
```json
{
  "pair": "CNY/RUB",
  "rate": 11.23,
  "source": "MOEX",
  "updatedAt": "12:34:56",
  "cached": true
}
```

## Error Handling
The integration should treat the following as failure cases:
- HTTP error from MOEX
- empty `marketdata.data`
- missing or non-numeric rate fields
- timeout

In failure cases:
1. try fallback provider,
2. return fallback response if successful,
3. otherwise return a controlled application error.

## Notes
- MOEX data may be delayed depending on access conditions.
- For production use, legal/commercial terms of MOEX market data should be reviewed separately.
- Showing `updatedAt` in the UI is recommended.

## Deliverables
- Exchange rate service/module
- Optional backend API endpoint
- Fallback handling
- CNY to RUB conversion wired into calculator
- Basic logging for source selection and failures
