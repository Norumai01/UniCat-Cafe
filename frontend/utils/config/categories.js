/**
 * Cat Cafe Config - Category Utilities
 * Handles category state, defaults, and category manager UI
 */

//console.log('📂 Categories utility loaded');

// ─── Default State ────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { id: 'cat_1', label: 'Food' },
  { id: 'cat_2', label: 'Drink' },
  { id: 'cat_3', label: 'Sub Combo' }
];

let categories = DEFAULT_CATEGORIES.map(c => ({ ...c }));

/**
 * Builds default message objects keyed by category ID.
 * Falls back to generic templates for any custom category IDs.
 * @param {Array} cats - Array of category objects { id, label }
 * @returns {Object} { success, fail } message maps
 */
function buildDefaultMessages(cats) {
  const defaultSuccessTemplates = {
    'cat_1': '@{username} has ordered {item}. Enjoy your meal!',
    'cat_2': '@{username} has ordered {item}. Stay hydrated!',
    'cat_3': '@{username} ordered the special {item}!'
  };
  const defaultFailTemplates = {
    'cat_1': 'Oh no! @{username} dropped the {item} on the floor!',
    'cat_2': '@{username}\'s {item} spilled everywhere! Better luck next time!',
    'cat_3': 'The kitchen ran out of ingredients for {item}! Sorry @{username}!'
  };

  const success = {};
  const fail = {};

  cats.forEach(cat => {
    success[cat.id] = defaultSuccessTemplates[cat.id]
      || `@{username} ordered {item} from the ${cat.label} menu!`;
    fail[cat.id] = defaultFailTemplates[cat.id]
      || `Oh no! Something went wrong with @{username}'s {item}!`;
  });

  return { success, fail };
}

// ─── Category Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the display label for a category ID
 * @param {string} id - Category ID
 * @returns {string} Label or the ID itself as fallback
 */
function getCategoryLabel(id) {
  const cat = categories.find(c => c.id === id);
  return cat ? cat.label : id;
}

/**
 * Generates a unique category ID using the current timestamp
 * @returns {string} Category ID
 */
function generateCategoryId() {
  return 'cat_' + Date.now();
}

// ─── Category Manager UI ──────────────────────────────────────────────────────

/**
 * Renders the category manager list in the Categories tab
 */
function renderCategoryManager() {
  const list = document.getElementById('categoryList');
  if (!list) return;

  list.innerHTML = '';

  if (categories.length === 0) {
    list.innerHTML = '<div class="empty-state">No categories yet. Add one below!</div>';
    return;
  }

  categories.forEach((cat, index) => {
    const itemCount = menuItems.filter(item => item.category === cat.id).length;

    const entry = document.createElement('div');
    entry.className = 'category-entry';
    entry.dataset.catId = cat.id;

    entry.innerHTML = `
      <div class="category-entry-info">
        <span class="category-color-dot color-index-${index % 5}"></span>
        <input
          type="text"
          class="category-label-input"
          value="${escapeHtml(cat.label)}"
          maxlength="20"
          data-id="${cat.id}"
        />
        <span class="category-item-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="category-entry-actions">
        <button class="btn btn-sm btn-secondary save-cat-label-btn" data-id="${cat.id}">
          Rename
        </button>
        <button
          class="btn btn-sm btn-danger delete-cat-btn"
          data-id="${cat.id}"
          ${itemCount > 0 ? `title="Also deletes ${itemCount} item${itemCount !== 1 ? 's' : ''} in this category"` : ''}
        >
          Delete
        </button>
      </div>
    `;

    list.appendChild(entry);
  });

  list.querySelectorAll('.save-cat-label-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      renameCategoryLabel(this.getAttribute('data-id'));
    });
  });

  list.querySelectorAll('.delete-cat-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      deleteCategory(this.getAttribute('data-id'));
    });
  });
}

/**
 * Adds a new category from the input field
 */
function addCategory() {
  const input = document.getElementById('newCategoryName');
  const label = input.value.trim();

  if (!label) {
    showStatus('❌ Category name cannot be empty', 'error');
    return;
  }
  if (label.length > 20) {
    showStatus('❌ Category name must be 20 characters or less', 'error');
    return;
  }
  if (categories.find(c => c.label.toLowerCase() === label.toLowerCase())) {
    showStatus(`❌ A category named "${label}" already exists`, 'error');
    return;
  }

  const newCat = { id: generateCategoryId(), label };
  categories.push(newCat);

  // Provision default messages for the new category
  categoryMessages[newCat.id] = `@{username} ordered {item} from the ${label} menu!`;
  failMessages[newCat.id] = `Oh no! Something went wrong with @{username}'s {item}!`;

  input.value = '';

  renderCategoryManager();
  populateCategorySelect();
  renderMessageTemplates();
  renderFailMessageTemplates();

  showStatus(`✅ Category "${label}" added! Remember to save your changes.`, 'success');
}

/**
 * Renames a category by ID using the current input value
 * @param {string} id - Category ID
 */
function renameCategoryLabel(id) {
  const input = document.querySelector(`.category-label-input[data-id="${id}"]`);
  if (!input) return;

  const newLabel = input.value.trim();

  if (!newLabel) {
    showStatus('❌ Category name cannot be empty', 'error');
    return;
  }
  if (newLabel.length > 20) {
    showStatus('❌ Category name must be 20 characters or less', 'error');
    return;
  }
  if (categories.find(c => c.label.toLowerCase() === newLabel.toLowerCase() && c.id !== id)) {
    showStatus(`❌ A category named "${newLabel}" already exists`, 'error');
    return;
  }

  const cat = categories.find(c => c.id === id);
  if (!cat) return;

  const oldLabel = cat.label;
  cat.label = newLabel;

  renderCategoryManager();
  populateCategorySelect();
  renderMenuItems();
  renderMessageTemplates();
  renderFailMessageTemplates();

  showStatus(`✅ "${oldLabel}" renamed to "${newLabel}". Remember to save.`, 'success');
}

/**
 * Deletes a category and all items belonging to it
 * @param {string} id - Category ID
 */
function deleteCategory(id) {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;

  const itemCount = menuItems.filter(item => item.category === id).length;

  // Remove all items belonging to this category
  menuItems = menuItems.filter(item => item.category !== id);

  categories = categories.filter(c => c.id !== id);
  delete categoryMessages[id];
  delete failMessages[id];

  renderCategoryManager();
  populateCategorySelect();
  renderMenuItems();
  renderMessageTemplates();
  renderFailMessageTemplates();

  const itemNote = itemCount > 0 ? ` and ${itemCount} item${itemCount !== 1 ? 's' : ''}` : '';
  showStatus(`✅ Category "${cat.label}"${itemNote} deleted. Remember to save.`, 'success');
}

// ─── Category Select Population ───────────────────────────────────────────────

/**
 * Populates all .category-select elements with the current categories.
 * Targets both the Add Item form select and any edit form selects in DOM.
 */
function populateCategorySelect() {
  const selects = document.querySelectorAll('.category-select');
  selects.forEach(select => {
    const currentVal = select.value;
    select.innerHTML = categories.map(cat =>
      `<option value="${escapeHtml(cat.id)}">${escapeHtml(cat.label)}</option>`
    ).join('');

    // Restore selection if still valid
    if (categories.find(c => c.id === currentVal)) {
      select.value = currentVal;
    }
  });
}
