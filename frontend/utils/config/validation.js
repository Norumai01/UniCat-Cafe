/**
 * Cat Cafe Config - Validation Utilities
 * Handles all form validation logic for menu items
 */

/**
 * Validates a menu item's name and description
 * @param {string} name - Item name
 * @param {string} description - Item description
 * @param {Array} menuItems - Current menu items array
 * @param {number|null} excludeId - ID to exclude from duplicate check (for editing)
 * @returns {Object} - { isValid: boolean, error: string }
 */
function validateMenuItem(name, description, menuItems, excludeId = null) {
  // Check for empty name
  if (!name) {
    return {
      isValid: false,
      error: 'Please enter an item name'
    };
  }

  // Check for empty description
  if (!description) {
    return {
      isValid: false,
      error: 'Please enter a description'
    };
  }

  // Check for duplicate names (excluding the item being edited if applicable)
  const isDuplicate = menuItems.some(item =>
    item.name.toLowerCase() === name.toLowerCase() && item.id !== excludeId
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: 'An item with this name already exists'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Helper function to escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}