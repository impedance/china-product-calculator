/**
 * Formatters - Currency, percent, weight, and rate formatting helpers
 * All pure functions, no side effects
 */

/**
 * Formats a number as Russian Ruble currency
 * Format: "1 599,95 ₽" with proper spacing
 * @param {number|null|undefined} value - Value to format
 * @param {boolean} showZero - Whether to show 0 instead of placeholder
 * @returns {string} - Formatted string or placeholder
 */
export function formatRub(value, showZero = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  
  if (value === 0 && !showZero) {
    return '—';
  }
  
  // Round to 2 decimal places
  const rounded = Math.round(value * 100) / 100;
  
  // Format with Russian locale
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rounded);
}

/**
 * Formats a number as US Dollar
 * Format: "100 $"
 * @param {number|null|undefined} value - Value to format
 * @param {boolean} showZero - Whether to show 0 instead of placeholder
 * @returns {string} - Formatted string or placeholder
 */
export function formatUsd(value, showZero = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  if (value === 0 && !showZero) {
    return '—';
  }

  const rounded = Math.round(value * 100) / 100;

  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rounded) + ' $';
}

/**
 * Formats a number as USD
 * Format: "100 $"
 * @param {number|null|undefined} value - Value to format
 * @param {boolean} showZero - Whether to show 0 instead of placeholder
 * @returns {string} - Formatted string or placeholder
 */
export function formatUsd(value, showZero = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  
  if (value === 0 && !showZero) {
    return '—';
  }
  
  const rounded = Math.round(value * 100) / 100;
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rounded) + ' $';
}

/**
 * Formats a number as percentage
 * Format: "44,0%" (uses comma as decimal separator for Russian locale)
 * @param {number|null|undefined} value - Value to format (0-1 range)
 * @param {number} decimals - Number of decimal places
 * @param {boolean} showZero - Whether to show 0 instead of placeholder
 * @returns {string} - Formatted string or placeholder
 */
export function formatPercent(value, decimals = 1, showZero = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  
  if (value === 0 && !showZero) {
    return '—';
  }
  
  // Convert from decimal to percentage
  const percentage = value * 100;
  const rounded = Math.round(percentage * Math.pow(10, decimals)) / Math.pow(10, decimals);
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(rounded) + '%';
}

/**
 * Formats weight in kg
 * Format: "0,5 кг"
 * @param {number|null|undefined} value - Value to format
 * @param {boolean} showZero - Whether to show 0 instead of placeholder
 * @returns {string} - Formatted string or placeholder
 */
export function formatWeight(value, showZero = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  
  if (value === 0 && !showZero) {
    return '—';
  }
  
  const rounded = Math.round(value * 100) / 100;
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rounded) + ' кг';
}

/**
 * Formats cargo rate in USD/kg
 * Format: "2,00 USD/кг"
 * @param {number|null|undefined} value - Value to format
 * @param {boolean} showZero - Whether to show 0 instead of placeholder
 * @returns {string} - Formatted string or placeholder
 */
export function formatCargoRate(value, showZero = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  
  if (value === 0 && !showZero) {
    return '—';
  }
  
  const rounded = Math.round(value * 100) / 100;
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rounded) + ' USD/кг';
}

/**
 * Formats density in kg/m³
 * Format: "250 кг/м³"
 * @param {number|null|undefined} value - Value to format
 * @param {boolean} showZero - Whether to show 0 instead of placeholder
 * @returns {string} - Formatted string or placeholder
 */
export function formatDensity(value, showZero = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  
  if (value === 0 && !showZero) {
    return '—';
  }
  
  const rounded = Math.round(value);
  
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' кг/м³';
}

/**
 * Formats an exchange rate
 * Format: "13,50" (just the number)
 * @param {number|null|undefined} value - Value to format
 * @param {boolean} showZero - Whether to show 0 instead of placeholder
 * @returns {string} - Formatted string or placeholder
 */
export function formatRate(value, showZero = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  
  if (value === 0 && !showZero) {
    return '—';
  }
  
  const rounded = Math.round(value * 100) / 100;
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rounded);
}

/**
 * Formats a plain number with Russian locale
 * Uses comma as decimal separator
 * @param {number|null|undefined} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @param {boolean} showZero - Whether to show 0 instead of placeholder
 * @returns {string} - Formatted string or placeholder
 */
export function formatNumber(value, decimals = 2, showZero = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  
  if (value === 0 && !showZero) {
    return '—';
  }
  
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.round(value * multiplier) / multiplier;
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(rounded);
}

/**
 * Formats a date in Russian format DD.MM.YYYY
 * @param {Date|string|number} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  if (!date) {
    return '—';
  }
  
  const d = new Date(date);
  
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}.${month}.${year}`;
}

/**
 * Rounds a number to specified decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} - Rounded value
 */
export function round(value, decimals = 2) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Safely parses a string to number
 * Handles both comma and dot as decimal separators
 * @param {string|number} value - Value to parse
 * @returns {number|null} - Parsed number or null if invalid
 */
export function parseNumber(value) {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  
  // Replace comma with dot for parsing
  const normalized = value.replace(',', '.').trim();
  const parsed = parseFloat(normalized);
  
  return Number.isNaN(parsed) ? null : parsed;
}
