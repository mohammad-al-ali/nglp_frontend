/**
 * localStorage Utility Functions
 * Persists UI state across sessions
 */

const STORAGE_KEY_PREFIX = 'nglp_';

/**
 * Save UI state to localStorage
 * @param {string} key - State key
 * @param {any} value - State value
 */
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
};

/**
 * Load UI state from localStorage
 * @param {string} key - State key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Stored value or default value
 */
export const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
    return defaultValue;
  }
};

/**
 * Clear specific state from localStorage
 * @param {string} key - State key
 */
export const clearFromStorage = (key) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
  } catch (err) {
    console.warn('Failed to clear from localStorage:', err);
  }
};

/**
 * Clear all NGLP state from localStorage
 */
export const clearAllStorage = () => {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn('Failed to clear all localStorage:', err);
  }
};
