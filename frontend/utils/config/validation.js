/**
 * Validation utility for Cat Cafe configuration
 * Used by config.js to validate menu items and messages
 */

/**
 * Validate a menu item before adding or updating
 * @param {string} name - Item name
 * @param {string} description - Item description
 * @param {Array} existingItems - Current menu items
 * @param {number|null} editingId - ID of item being edited (null for new items)
 * @returns {Object} { isValid: boolean, error: string }
 */
function validateMenuItem(name, description, existingItems, editingId = null) {
  // Check for empty name
  if (!name || name.length === 0) {
    return {
      isValid: false,
      error: '❌ Item name is required'
    };
  }

  // Check name length
  if (name.length > 50) {
    return {
      isValid: false,
      error: '❌ Item name must be 50 characters or less'
    };
  }

  // Check for empty description
  if (!description || description.length === 0) {
    return {
      isValid: false,
      error: '❌ Description is required'
    };
  }

  // Check description length
  if (description.length > 150) {
    return {
      isValid: false,
      error: '❌ Description must be 150 characters or less'
    };
  }

  // Check for duplicate names (excluding item being edited)
  const duplicate = existingItems.find(item =>
    item.name.toLowerCase() === name.toLowerCase() &&
    item.id !== editingId
  );

  if (duplicate) {
    return {
      isValid: false,
      error: `❌ An item named "${name}" already exists`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validate a message template
 * @param {string} template - Message template string
 * @returns {Object} { isValid: boolean, error: string }
 */
function validateMessageTemplate(template) {
  // Check for empty template
  if (!template || template.trim().length === 0) {
    return {
      isValid: false,
      error: '❌ Message template cannot be empty'
    };
  }

  // Check template length
  if (template.length > 300) {
    return {
      isValid: false,
      error: '❌ Message template must be 300 characters or less'
    };
  }

  // Check for required placeholders
  if (!template.includes('{username}')) {
    return {
      isValid: false,
      error: '❌ Message must include {username} placeholder'
    };
  }

  if (!template.includes('{item}')) {
    return {
      isValid: false,
      error: '❌ Message must include {item} placeholder'
    };
  }

  // Check for invalid placeholders
  const validPlaceholders = ['{username}', '{item}'];
  const placeholderPattern = /\{([^}]+)\}/g;
  const matches = template.match(placeholderPattern);

  if (matches) {
    const invalidPlaceholders = matches.filter(
      placeholder => !validPlaceholders.includes(placeholder)
    );

    if (invalidPlaceholders.length > 0) {
      return {
        isValid: false,
        error: `❌ Invalid placeholder(s): ${invalidPlaceholders.join(', ')}. Only {username} and {item} are allowed`
      };
    }
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Preview what a message template will look like with sample data
 * @param {string} template - Message template
 * @param {string} sampleUsername - Sample username (default: "Viewer")
 * @param {string} sampleItem - Sample item name (default: "Green Tea")
 * @returns {string} Preview message
 */
function previewMessage(template, sampleUsername = "Viewer", sampleItem = "Green Tea") {
  return template
    .replace(/{username}/g, sampleUsername)
    .replace(/{item}/g, sampleItem);
}