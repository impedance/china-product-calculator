/**
 * Exchange Rate Service
 * Fetches CNY/RUB rate from CBR (Central Bank of Russia) JSON feed
 * Implements simple in-memory caching with 1-hour TTL
 */

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const CBR_API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
const DEFAULT_RATE = 13.5;

// In-memory cache
let cache = {
  rate: null,
  timestamp: null,
  effectiveDate: null
};

/**
 * Fetches CNY exchange rate from CBR API
 * @returns {Promise<{rate: number, source: string, effectiveDate: string}|null>}
 */
export async function fetchCnyRate() {
  // Check cache first
  if (isCacheValid()) {
    console.log('[ExchangeRate] Cache hit');
    return {
      rate: cache.rate,
      source: 'CBR (cached)',
      effectiveDate: cache.effectiveDate
    };
  }

  try {
    console.log('[ExchangeRate] Fetching from CBR API...');
    
    const response = await fetch(CBR_API_URL);
    
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
    
    const cny = data.Valute.CNY;
    
    if (!cny || typeof cny !== 'object') {
      throw new Error('Invalid response: CNY data missing');
    }
    
    if (typeof cny.Value !== 'number' || typeof cny.Nominal !== 'number') {
      throw new Error('Invalid response: CNY Value or Nominal missing or not numeric');
    }
    
    if (cny.Nominal <= 0) {
      throw new Error('Invalid response: CNY Nominal must be > 0');
    }
    
    // Calculate rate: Value / Nominal
    const rate = cny.Value / cny.Nominal;
    
    // Round to 6 decimal places
    const roundedRate = Math.round(rate * 1000000) / 1000000;
    
    // Update cache
    cache = {
      rate: roundedRate,
      timestamp: Date.now(),
      effectiveDate: data.Date || new Date().toISOString()
    };
    
    console.log(`[ExchangeRate] Fetched rate: ${roundedRate} RUB/CNY`);
    
    return {
      rate: roundedRate,
      source: 'CBR',
      effectiveDate: data.Date
    };
    
  } catch (error) {
    console.error('[ExchangeRate] Failed to fetch rate:', error.message);
    
    // Return stale cache if available
    if (cache.rate !== null) {
      console.log('[ExchangeRate] Returning stale cached rate');
      return {
        rate: cache.rate,
        source: 'CBR (stale)',
        effectiveDate: cache.effectiveDate,
        stale: true
      };
    }
    
    // Return null if no cache available - caller should use default
    return null;
  }
}

/**
 * Gets exchange rate with fallback to default
 * @returns {Promise<{rate: number, source: string, effectiveDate: string|null}>}
 */
export async function getCnyRateWithFallback() {
  const result = await fetchCnyRate();
  
  if (result !== null) {
    return {
      rate: result.rate,
      source: result.source,
      effectiveDate: result.effectiveDate || null,
      stale: result.stale || false
    };
  }
  
  // Fallback to default rate
  console.log(`[ExchangeRate] Using default rate: ${DEFAULT_RATE}`);
  return {
    rate: DEFAULT_RATE,
    source: 'default',
    effectiveDate: null,
    stale: false
  };
}

/**
 * Check if cache is still valid
 * @returns {boolean}
 */
function isCacheValid() {
  if (cache.rate === null || cache.timestamp === null) {
    return false;
  }
  
  const age = Date.now() - cache.timestamp;
  return age < CACHE_TTL_MS;
}

/**
 * Clears the cache (useful for testing)
 */
export function clearCache() {
  cache = {
    rate: null,
    timestamp: null,
    effectiveDate: null
  };
  console.log('[ExchangeRate] Cache cleared');
}

/**
 * Gets current cache state (for debugging/testing)
 * @returns {Object}
 */
export function getCacheState() {
  return {
    ...cache,
    isValid: isCacheValid()
  };
}

/**
 * Formats effective date for display
 * @param {string} isoDate - ISO date string from CBR
 * @returns {string} - Formatted date (DD.MM.YYYY)
 */
export function formatEffectiveDate(isoDate) {
  if (!isoDate) return '';
  
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch (e) {
    return '';
  }
}
