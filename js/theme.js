/**
 * Theme - Theme toggle and persisted theme initialization
 * Handles light/dark/system theme switching
 */

import { saveTheme, loadTheme } from './storage.js';
import { setTheme as setStateTheme } from './state.js';

/**
 * Initializes theme based on saved preference
 * Should be called on app startup
 */
export function initTheme() {
  const savedTheme = loadTheme();
  applyTheme(savedTheme);
  setStateTheme(savedTheme);
  updateActiveButton(savedTheme);
}

/**
 * Applies the specified theme to the document
 * @param {string} theme - Theme to apply ('light', 'dark', or 'system')
 */
export function applyTheme(theme) {
  const validThemes = ['light', 'dark', 'system'];
  const themeToApply = validThemes.includes(theme) ? theme : 'system';
  
  // Set data-theme attribute on html element
  document.documentElement.setAttribute('data-theme', themeToApply);
  
  // Update meta theme-color for mobile browsers
  updateMetaThemeColor(themeToApply);
  
  // Save to storage
  saveTheme(themeToApply);
  
  // Update state
  setStateTheme(themeToApply);
  
  // Update UI
  updateActiveButton(themeToApply);
}

/**
 * Gets the currently applied effective theme
 * For 'system', checks prefers-color-scheme
 * @returns {string} - 'light' or 'dark'
 */
export function getEffectiveTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'system';
  
  if (currentTheme === 'system') {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  return currentTheme;
}

/**
 * Updates the theme-color meta tag
 * @param {string} theme - Current theme
 */
function updateMetaThemeColor(theme) {
  const effectiveTheme = getEffectiveTheme();
  const themeColor = effectiveTheme === 'dark' ? '#1a1a1e' : '#f5f5f7';
  
  // Find existing meta tag or create new one
  let metaTag = document.querySelector('meta[name="theme-color"]');
  
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTag);
  }
  
  metaTag.setAttribute('content', themeColor);
}

/**
 * Updates the active state of theme toggle buttons
 * @param {string} activeTheme - Currently active theme
 */
function updateActiveButton(activeTheme) {
  const buttons = document.querySelectorAll('.theme-btn');
  
  buttons.forEach(btn => {
    const btnTheme = btn.getAttribute('data-theme');
    if (btnTheme === activeTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Sets up event listeners for theme toggle buttons
 */
export function setupThemeListeners() {
  const buttons = document.querySelectorAll('.theme-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      if (theme) {
        applyTheme(theme);
      }
    });
  });
  
  // Listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'system') {
          updateMetaThemeColor('system');
        }
      });
    } else if (mediaQuery.addListener) {
      // Legacy browsers
      mediaQuery.addListener(() => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'system') {
          updateMetaThemeColor('system');
        }
      });
    }
  }
}

/**
 * Toggles between light and dark theme
 * If current is system, switches to opposite of system preference
 */
export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'system';
  const effectiveTheme = getEffectiveTheme();
  
  if (currentTheme === 'system') {
    // Switch to opposite of system preference
    applyTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  } else {
    // Toggle between light and dark
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }
}

/**
 * Gets theme-related CSS variable values
 * @returns {Object} - Current theme colors
 */
export function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  
  return {
    background: style.getPropertyValue('--color-bg').trim(),
    surface: style.getPropertyValue('--color-surface').trim(),
    textPrimary: style.getPropertyValue('--color-text-primary').trim(),
    textSecondary: style.getPropertyValue('--color-text-secondary').trim(),
    accent: style.getPropertyValue('--color-accent').trim(),
    success: style.getPropertyValue('--color-success').trim(),
    error: style.getPropertyValue('--color-error').trim()
  };
}
