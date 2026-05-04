/**
 * Exchange Rate Service
 * Fetches USD/RUB rate from MOEX ISS API (primary) with CBR fallback
 * Implements simple in-memory caching with different TTL for each source
 */

// MOEX configuration - shorter TTL for intraday data
const MOEX_CACHE_TTL_MS = 60 * 1000; // 1 minute (MOEX intraday changes frequently)
const MOEX_API_URL = 'https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/USD000UTSTOM.json?iss.meta=off&iss.only=marketdata';

// CBR configuration - longer TTL for daily data
const CBR_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CBR_API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

const DEFAULT_RATE = 95;

// In-memory caches
let moexCache = {
  rate: null,
  timestamp: null,
  updatedAt: null // time from MOEX (e.g., "14:32:15")
};

let cbrCache = {
  rate: null,
  timestamp: null,
  effectiveDate: null // date from CBR (ISO string)
};

/**
 * Fetches USD exchange rate from MOEX ISS API
 * @returns {Promise<{rate: number, source: string, isToday: boolean}|null>}
 */
async function fetchMoexRate() {
  // Check MOEX cache first
  if (isMoexCacheValid()) {
    console.log('[ExchangeRate] MOEX cache hit');
    return {
      rate: moexCache.rate,
      source: 'MOEX (cached)',
      isToday: true
    };
  }

  try {
    console.log('[ExchangeRate] Fetching from MOEX API...');

    const response = await fetch(MOEX_API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    if (!data.marketdata || typeof data.marketdata !== 'object') {
      throw new Error('Invalid response: marketdata missing');
    }

    const marketData = data.marketdata;

    // Validate columns and data arrays exist
    if (!Array.isArray(marketData.columns) || !Array.isArray(marketData.data)) {
      throw new Error('Invalid response: marketdata structure invalid');
    }

    if (marketData.data.length === 0) {
      throw new Error('Invalid response: no market data available');
    }

    // Find indices for required columns
    const colIndices = {
      LAST: marketData.columns.indexOf('LAST'),
      MARKETPRICE: marketData.columns.indexOf('MARKETPRICE'),
      LCURRENTPRICE: marketData.columns.indexOf('LCURRENTPRICE'),
      UPDATETIME: marketData.columns.indexOf('UPDATETIME')
    };

    // Check if at least one price column exists
    if (colIndices.LAST === -1 && colIndices.MARKETPRICE === -1 && colIndices.LCURRENTPRICE === -1) {
      throw new Error('Invalid response: no price columns found');
    }

    // Get first data row
    const row = marketData.data[0];

    // Extract rate with priority: LAST -> MARKETPRICE -> LCURRENTPRICE
    let rate = null;
    if (colIndices.LAST !== -1 && row[colIndices.LAST] !== null && !isNaN(row[colIndices.LAST])) {
      rate = row[colIndices.LAST];
    } else if (colIndices.MARKETPRICE !== -1 && row[colIndices.MARKETPRICE] !== null && !isNaN(row[colIndices.MARKETPRICE])) {
      rate = row[colIndices.MARKETPRICE];
    } else if (colIndices.LCURRENTPRICE !== -1 && row[colIndices.LCURRENTPRICE] !== null && !isNaN(row[colIndices.LCURRENTPRICE])) {
      rate = row[colIndices.LCURRENTPRICE];
    }

    if (rate === null || isNaN(rate) || rate <= 0) {
      throw new Error('Invalid response: no valid rate found in any priority field');
    }

    // Round to 6 decimal places
    const roundedRate = Math.round(rate * 1000000) / 1000000;

    // Get update time
    const updatedAt = colIndices.UPDATETIME !== -1 ? row[colIndices.UPDATETIME] : null;

    // Update MOEX cache
    moexCache = {
      rate: roundedRate,
      timestamp: Date.now(),
      updatedAt: updatedAt
    };

    console.log(`[ExchangeRate] Fetched MOEX rate: ${roundedRate} RUB/USD`);

    return {
      rate: roundedRate,
      source: 'MOEX',
      isToday: true
    };

  } catch (error) {
    console.error('[ExchangeRate] MOEX fetch failed:', error.message);
    return null;
  }
}

/**
 * Fetches USD exchange rate from CBR API
 * @returns {Promise<{rate: number, source: string, effectiveDate: string, isToday: boolean}|null>}
 */
async function fetchCbrRate() {
  // Check CBR cache first
  if (isCbrCacheValid()) {
    console.log('[ExchangeRate] CBR cache hit');
    const isToday = isDateToday(cbrCache.effectiveDate);
    return {
      rate: cbrCache.rate,
      source: 'CBR (cached)',
      effectiveDate: cbrCache.effectiveDate,
      isToday: isToday
    };
  }

  try {
    console.log('[ExchangeRate] Fetching from CBR API...');

    const response = await fetch(`${CBR_API_URL}?t=${Date.now()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    if (!data.Valute || typeof data.Valute !== 'object') {
      throw new Error('Invalid response: Valute missing');
    }

    const usd = data.Valute.USD;

    if (!usd || typeof usd !== 'object') {
      throw new Error('Invalid response: USD data missing');
    }

    if (typeof usd.Value !== 'number' || typeof usd.Nominal !== 'number') {
      throw new Error('Invalid response: USD Value or Nominal missing or not numeric');
    }

    if (usd.Nominal <= 0) {
      throw new Error('Invalid response: USD Nominal must be > 0');
    }

    // Calculate rate: Value / Nominal
    const rate = usd.Value / usd.Nominal;

    // Round to 6 decimal places
    const roundedRate = Math.round(rate * 1000000) / 1000000;

    // Update CBR cache
    cbrCache = {
      rate: roundedRate,
      timestamp: Date.now(),
      effectiveDate: data.Date
    };

    const isToday = isDateToday(data.Date);

    console.log(`[ExchangeRate] Fetched CBR rate: ${roundedRate} RUB/USD, date: ${data.Date}`);

    return {
      rate: roundedRate,
      source: 'CBR',
      effectiveDate: data.Date,
      isToday: isToday
    };

  } catch (error) {
    console.error('[ExchangeRate] CBR fetch failed:', error.message);

    // Return stale cache if available
    if (cbrCache.rate !== null) {
      console.log('[ExchangeRate] Returning stale CBR cached rate');
      const isToday = isDateToday(cbrCache.effectiveDate);
      return {
        rate: cbrCache.rate,
        source: 'CBR (stale)',
        effectiveDate: cbrCache.effectiveDate,
        isToday: isToday,
        stale: true
      };
    }

    return null;
  }
}

/**
 * Fetches USD exchange rate with fallback chain: MOEX -> CBR -> default
 * @returns {Promise<{rate: number, source: string, effectiveDate: string|null, isToday: boolean, stale?: boolean}|null>}
 */
export async function fetchUsdRate() {
  // Try MOEX first (intraday, more current)
  const moexResult = await fetchMoexRate();
  if (moexResult !== null) {
    // MOEX data is always considered "today" - use current date as effectiveDate
    const today = new Date().toISOString();
    return {
      ...moexResult,
      effectiveDate: today
    };
  }

  // Fallback to CBR (daily official rate)
  const cbrResult = await fetchCbrRate();
  if (cbrResult !== null) {
    return cbrResult;
  }

  // No valid data available
  return null;
}

/**
 * Gets exchange rate with fallback to default
 * @returns {Promise<{rate: number, source: string, effectiveDate: string|null, isToday: boolean, stale?: boolean}>}
 */
export async function getUsdRateWithFallback() {
  const result = await fetchUsdRate();

  if (result !== null) {
    return {
      rate: result.rate,
      source: result.source,
      effectiveDate: result.effectiveDate || null,
      isToday: result.isToday,
      stale: result.stale || false
    };
  }

  // Fallback to default rate
  console.log(`[ExchangeRate] Using default rate: ${DEFAULT_RATE}`);
  return {
    rate: DEFAULT_RATE,
    source: 'default',
    effectiveDate: null,
    isToday: false,
    stale: false
  };
}

/**
 * Check if MOEX cache is still valid
 * @returns {boolean}
 */
function isMoexCacheValid() {
  if (moexCache.rate === null || moexCache.timestamp === null) {
    return false;
  }

  const age = Date.now() - moexCache.timestamp;
  return age < MOEX_CACHE_TTL_MS;
}

/**
 * Check if CBR cache is still valid
 * @returns {boolean}
 */
function isCbrCacheValid() {
  if (cbrCache.rate === null || cbrCache.timestamp === null) {
    return false;
  }

  const age = Date.now() - cbrCache.timestamp;
  return age < CBR_CACHE_TTL_MS;
}

/**
 * Check if a date string represents today
 * @param {string} isoDate - ISO date string
 * @returns {boolean}
 */
function isDateToday(isoDate) {
  if (!isoDate) return false;

  try {
    const date = new Date(isoDate);
    const today = new Date();

    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  } catch (e) {
    return false;
  }
}

/**
 * Clears all caches (useful for testing)
 */
export function clearCache() {
  moexCache = {
    rate: null,
    timestamp: null,
    updatedAt: null
  };
  cbrCache = {
    rate: null,
    timestamp: null,
    effectiveDate: null
  };
  console.log('[ExchangeRate] All caches cleared');
}

/**
 * Gets current cache state (for debugging/testing)
 * @returns {Object}
 */
export function getCacheState() {
  return {
    moex: {
      ...moexCache,
      isValid: isMoexCacheValid()
    },
    cbr: {
      ...cbrCache,
      isValid: isCbrCacheValid()
    }
  };
}

/**
 * Formats effective date for display
 * Returns formatted date if date is today, empty string otherwise
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date (DD.MM.YYYY) or empty string
 */
export function formatEffectiveDate(isoDate) {
  if (!isoDate) return '';

  try {
    const date = new Date(isoDate);
    const today = new Date();

    // Only format if date is today
    const isToday = date.getDate() === today.getDate() &&
                     date.getMonth() === today.getMonth() &&
                     date.getFullYear() === today.getFullYear();

    if (!isToday) {
      return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch (e) {
    return '';
  }
}
