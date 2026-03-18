/**
 * Cat Cafe Config - UI Rendering Utilities
 * Handles all DOM manipulation and rendering logic
 */

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

/**
 * Gets the CSS class for a category badge using a 5-color palette by index.
 * Categories are now dynamic so we cycle palette-0..palette-4 instead of
 * switching on hardcoded names.
 * @param {string} categoryId - Category ID
 * @returns {string} - CSS class name
 */
function getCategoryBadgeClass(categoryId) {
  // `categories` is the live array from config.js (same global scope)
  if (typeof categories !== 'undefined') {
    const index = categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
      return `palette-${index % 5}`;
    }
  }
  return 'palette-0';
}

/**
 * Renders the complete menu items list
 * Handles both normal view and edit mode
 */
function renderMenuItems() {
  const list = document.getElementById('menuItemsList');

  if (menuItems.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        No items added yet. Add your first menu item above!
      </div>
    `;
    return;
  }

  // Group items by category ID, following the categories array order
  const grouped = {};
  categories.forEach(cat => { grouped[cat.id] = []; });

  menuItems.forEach(item => {
    const catId = item.category;
    if (grouped[catId] !== undefined) {
      grouped[catId].push(item);
    }
    else {
      // Orphaned item (category deleted) — bucket into first category as fallback
      const firstId = categories[0]?.id;
      if (firstId) grouped[firstId].push(item);
    }
  });

  let html = '';

  // Render each category in order
  categories.forEach(cat => {
    (grouped[cat.id] || []).forEach(item => {
      const isEditing = editingItemId === item.id;

      if (isEditing) {
        html += renderEditForm(item);
      }
      else {
        html += renderMenuItem(item);
      }
    });
  });

  list.innerHTML = html;
  attachEventListeners(list);
}

/**
 * Renders a menu item in normal view mode
 * @param {Object} item - Menu item object
 * @returns {string} - HTML string
 */
function renderMenuItem(item) {
  const badgeClass = getCategoryBadgeClass(item.category);
  const label = typeof getCategoryLabel === 'function' ? getCategoryLabel(item.category) : item.category;

  return `
    <div class="menu-item-entry" data-item-id="${item.id}">
      <div class="item-info">
        <div class="item-info-header">
          <span class="item-info-name">${escapeHtml(item.name)}</span>
          <span class="item-category-badge ${badgeClass}">${escapeHtml(label)}</span>
        </div>
        <div class="item-info-desc">${escapeHtml(item.description)}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-edit edit-btn" data-id="${item.id}">
          Edit
        </button>
        <button class="btn btn-danger remove-btn" data-id="${item.id}">
          Remove
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders a menu item in edit mode.
 * Category <select> options are populated by populateCategorySelect() after render.
 * @param {Object} item - Menu item object
 * @returns {string} - HTML string
 */
function renderEditForm(item) {
  return `
    <div class="menu-item-entry editing" data-item-id="${item.id}">
      <div class="edit-form">
        <div class="edit-form-header">
          <span class="edit-form-title">✏️ Editing Item</span>
        </div>
        
        <div class="edit-form-group">
          <label class="edit-form-label">Category</label>
          <select id="edit-category-${item.id}" class="edit-form-select category-select">
            <!-- Populated by populateCategorySelect() after render -->
          </select>
        </div>

        <div class="edit-form-group">
          <label class="edit-form-label">Item Name</label>
          <input 
            type="text" 
            id="edit-name-${item.id}" 
            class="edit-form-input" 
            value="${escapeHtml(item.name)}"
            maxlength="50"
          >
        </div>

        <div class="edit-form-group">
          <label class="edit-form-label">Description</label>
          <textarea 
            id="edit-description-${item.id}" 
            class="edit-form-textarea"
            maxlength="150"
          >${escapeHtml(item.description)}</textarea>
        </div>

        <div class="edit-form-actions">
          <button class="btn btn-primary btn-save-edit" data-id="${item.id}">
            Save Changes
          </button>
          <button class="btn btn-secondary btn-cancel-edit">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attaches event listeners to dynamically rendered elements
 * @param {HTMLElement} list - The menu items list container
 */
function attachEventListeners(list) {
  // Edit buttons
  const editButtons = list.querySelectorAll('.edit-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      editMenuItem(id);
    });
  });

  // Save edit buttons
  const saveEditButtons = list.querySelectorAll('.btn-save-edit');
  saveEditButtons.forEach(button => {
    button.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      saveEdit(id);
    });
  });

  // Cancel edit buttons
  const cancelEditButtons = list.querySelectorAll('.btn-cancel-edit');
  cancelEditButtons.forEach(button => {
    button.addEventListener('click', cancelEdit);
  });

  // Remove buttons
  const removeButtons = list.querySelectorAll('.remove-btn');
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      removeMenuItem(id);
    });
  });
}

/**
 * Displays a status message to the user
 * @param {string} message - Message text
 * @param {string} type - Message type ('success' or 'error')
 */
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.className = type;
  status.textContent = message;

  // Auto-clear success messages
  if (type === 'success') {
    setTimeout(() => {
      status.textContent = '';
      status.className = '';
    }, 5000);
  }
}