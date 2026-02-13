/**
 * Cat Cafe Config - UI Rendering Utilities
 * Handles all DOM manipulation and rendering logic
 */

/**
 * Gets the CSS class for a category badge
 * @param {string} category - Category name
 * @returns {string} - CSS class name
 */
function getCategoryBadgeClass(category) {
  switch(category) {
    case 'Drink':
      return 'drink';
    case 'Food':
      return 'food';
    case 'Sub Combo':
      return 'sub-combo';
    default:
      return 'food';
  }
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

  // Group items by category for organized display
  const grouped = {
    'Food': [],
    'Drink': [],
    'Sub Combo': []
  };

  menuItems.forEach(item => {
    const category = item.category || 'Food';
    if (grouped[category]) {
      grouped[category].push(item);
    }
  });

  let html = '';

  // Render each category
  ['Food', 'Drink', 'Sub Combo'].forEach(category => {
    const items = grouped[category];

    if (items.length > 0) {
      items.forEach(item => {
        const isEditing = editingItemId === item.id;

        if (isEditing) {
          html += renderEditForm(item);
        } else {
          html += renderMenuItem(item);
        }
      });
    }
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
  const badgeClass = getCategoryBadgeClass(item.category || 'Food');

  return `
    <div class="menu-item-entry" data-item-id="${item.id}">
      <div class="item-info">
        <div class="item-info-header">
          <span class="item-info-name">${escapeHtml(item.name)}</span>
          <span class="item-category-badge ${badgeClass}">${escapeHtml(item.category || 'Food')}</span>
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
 * Renders a menu item in edit mode
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
          <select id="edit-category-${item.id}" class="edit-form-select">
            <option value="Food" ${item.category === 'Food' ? 'selected' : ''}>Food</option>
            <option value="Drink" ${item.category === 'Drink' ? 'selected' : ''}>Drink</option>
            <option value="Sub Combo" ${item.category === 'Sub Combo' ? 'selected' : ''}>Sub Combo</option>
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
            💾 Save Changes
          </button>
          <button class="btn btn-secondary btn-cancel-edit">
            ✖️ Cancel
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