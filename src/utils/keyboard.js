/**
 * Keyboard Shortcuts Utility
 * Provides keyboard shortcut handling for IDE actions
 */

/**
 * Check if Ctrl/Cmd key is pressed with another key
 * @param {KeyboardEvent} e - Keyboard event
 * @param {string} key - The key to check (e.g., 'b', 'k')
 * @returns {boolean} True if Ctrl/Cmd + key is pressed
 */
export const isCtrlKey = (e, key) => {
  return (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === key.toLowerCase();
};

/**
 * Setup keyboard shortcuts for the IDE
 * @param {Object} callbacks - Object with shortcut callbacks
 * - callbacks.togglePrimarySidebar - Ctrl+B
 * - callbacks.toggleDetailsPanel - Ctrl+Shift+D
 * - callbacks.toggleSecondarySidebar - Ctrl+Shift+R
 * - callbacks.focusSearch - Ctrl+F
 */
export const setupKeyboardShortcuts = (callbacks) => {
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + B: Toggle Primary Sidebar (Course Explorer)
    if (isCtrlKey(e, 'b')) {
      e.preventDefault();
      callbacks.togglePrimarySidebar?.();
    }

    // Ctrl/Cmd + Shift + D: Toggle Details Panel
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      callbacks.toggleDetailsPanel?.();
    }

    // Ctrl/Cmd + Shift + R: Toggle Secondary Sidebar (AI Chat)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      callbacks.toggleSecondarySidebar?.();
    }

    // Ctrl/Cmd + F: Focus Search (future feature)
    if (isCtrlKey(e, 'f')) {
      e.preventDefault();
      callbacks.focusSearch?.();
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Keyboard shortcuts reference
 */
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_PRIMARY_SIDEBAR: 'Ctrl+B',
  TOGGLE_DETAILS_PANEL: 'Ctrl+Shift+D',
  TOGGLE_SECONDARY_SIDEBAR: 'Ctrl+Shift+R',
  FOCUS_SEARCH: 'Ctrl+F',
  SEND_MESSAGE: 'Ctrl+Enter',
};
