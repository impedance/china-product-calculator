/**
 * Storage - Read/write latest scenario, theme, saved timestamp
 * Handles localStorage with error handling and versioning
 */

const STORAGE_KEYS = {
  LATEST_SCENARIO: 'landedCalc.latestScenario',
  THEME: 'landedCalc.theme',
  LAST_SAVED_AT: 'landedCalc.lastSavedAt',
  VERSION: 'landedCalc.version'
};

const CURRENT_VERSION = '1.0.0';

/**
 * Safely stores data in localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 * @returns {boolean} - True if successful
 */
function safeSetItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Safely retrieves data from localStorage with error handling
 * @param {string} key - Storage key
 * @returns {any|null} - Parsed value or null if not found/error
 */
function safeGetItem(key) {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return null;
    }
    return JSON.parse(serialized);
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Saves the current calculator scenario
 * @param {Object} scenario - Calculator input object
 * @returns {boolean} - True if successful
 */
function saveScenario(scenario) {
  const data = {
    ...scenario,
    _savedAt: new Date().toISOString(),
    _version: CURRENT_VERSION
  };
  
  const saved = safeSetItem(STORAGE_KEYS.LATEST_SCENARIO, data);
  
  if (saved) {
    safeSetItem(STORAGE_KEYS.LAST_SAVED_AT, new Date().toISOString());
    safeSetItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
  }
  
  return saved;
}

/**
 * Loads the saved calculator scenario
 * @returns {Object|null} - Saved scenario or null if not found
 */
function loadScenario() {
  const data = safeGetItem(STORAGE_KEYS.LATEST_SCENARIO);
  
  if (!data) {
    return null;
  }
  
  // Check version compatibility
  const savedVersion = data._version || '0.0.0';
  
  // Remove internal metadata before returning
  const { _savedAt, _version, ...scenario } = data;
  
  return scenario;
}

/**
 * Gets the timestamp of the last save
 * @returns {string|null} - ISO timestamp or null
 */
function getLastSavedAt() {
  return safeGetItem(STORAGE_KEYS.LAST_SAVED_AT);
}

/**
 * Saves the selected theme
 * @param {string} theme - Theme value ('light', 'dark', or 'system')
 * @returns {boolean} - True if successful
 */
function saveTheme(theme) {
  return safeSetItem(STORAGE_KEYS.THEME, theme);
}

/**
 * Loads the saved theme preference
 * @returns {string} - Saved theme or 'system' as default
 */
function loadTheme() {
  const theme = safeGetItem(STORAGE_KEYS.THEME);
  return theme || 'system';
}

/**
 * Clears all saved calculator data
 * @returns {boolean} - True if successful
 */
function clearAllData() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Checks if localStorage is available and working
 * @returns {boolean} - True if storage is available
 */
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets storage usage information
 * @returns {Object} - Storage info
 */
function getStorageInfo() {
  if (!isStorageAvailable()) {
    return { available: false, usage: 0, quota: 0 };
  }
  
  let totalSize = 0;
  
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length * 2; // UTF-16 encoding
      }
    }
  } catch (error) {
    // Ignore errors
  }
  
  return {
    available: true,
    usage: totalSize,
    quota: 5 * 1024 * 1024, // Typical localStorage limit ~5MB
    percentage: Math.round((totalSize / (5 * 1024 * 1024)) * 100)
  };
}
