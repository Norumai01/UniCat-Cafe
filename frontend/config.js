console.log('🐱 Cat Cafe Config script loaded');

let menuItems = [];
let editingItemId = null; // Track which item is being edited

window.Twitch.ext.onAuthorized(() => {
  console.log('✅ Authorized!');
  loadExisting();

  // Attach event listeners
  document.getElementById('addItemButton').addEventListener('click', addMenuItem);
  document.getElementById('saveButton').addEventListener('click', saveConfig);
});

function loadExisting() {
  const config = window.Twitch.ext.configuration.broadcaster;
  if (config && config.content) {
    const data = JSON.parse(config.content);
    console.log('Existing config:', data);
    menuItems = data.menuItems || [];
    renderMenuItems();
  }
}

function addMenuItem() {
  const categoryInput = document.getElementById('itemCategory');
  const nameInput = document.getElementById('itemName');
  const descriptionInput = document.getElementById('itemDescription');

  const category = categoryInput.value;
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();

  // Validation
  if (!name) {
    showStatus('Please enter an item name', 'error');
    return;
  }

  if (!description) {
    showStatus('Please enter a description', 'error');
    return;
  }

  // Check for duplicate names (excluding the item being edited if applicable)
  const isDuplicate = menuItems.some(item =>
    item.name.toLowerCase() === name.toLowerCase() && item.id !== editingItemId
  );

  if (isDuplicate) {
    showStatus('An item with this name already exists', 'error');
    return;
  }

  const newItem = {
    id: Date.now(),
    name: name,
    description: description,
    category: category,
    enabled: true
  };

  menuItems.push(newItem);
  console.log('Added item:', newItem);

  // Clear inputs
  nameInput.value = '';
  descriptionInput.value = '';
  // Keep category selected for convenience

  renderMenuItems();
  showStatus(`✅ "${name}" added to ${category}! Remember to save your changes.`, 'success');
}

function editMenuItem(id) {
  const item = menuItems.find(item => item.id === id);

  if (!item) {
    showStatus('Item not found', 'error');
    return;
  }

  editingItemId = id;

  // Scroll to the item entry
  const itemEntry = document.querySelector(`[data-item-id="${id}"]`);
  if (itemEntry) {
    itemEntry.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  renderMenuItems();
  showStatus(`Editing "${item.name}"`, 'success');
}

function saveEdit(id) {
  const categoryInput = document.getElementById(`edit-category-${id}`);
  const nameInput = document.getElementById(`edit-name-${id}`);
  const descriptionInput = document.getElementById(`edit-description-${id}`);

  const category = categoryInput.value;
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();

  // Validation
  if (!name) {
    showStatus('Please enter an item name', 'error');
    return;
  }

  if (!description) {
    showStatus('Please enter a description', 'error');
    return;
  }

  // Check for duplicate names (excluding current item)
  const isDuplicate = menuItems.some(item =>
    item.name.toLowerCase() === name.toLowerCase() && item.id !== id
  );

  if (isDuplicate) {
    showStatus('An item with this name already exists', 'error');
    return;
  }

  // Find and update the item
  const itemIndex = menuItems.findIndex(item => item.id === id);
  if (itemIndex !== -1) {
    menuItems[itemIndex] = {
      ...menuItems[itemIndex],
      name: name,
      description: description,
      category: category
    };

    console.log('Updated item:', menuItems[itemIndex]);

    editingItemId = null;
    renderMenuItems();
    showStatus(`✅ "${name}" updated! Remember to save your changes.`, 'success');
  }
}

function cancelEdit() {
  editingItemId = null;
  renderMenuItems();
}

function removeMenuItem(id) {
  const item = menuItems.find(item => item.id === id);
  const itemName = item ? item.name : 'Item';

  console.log('Removing item with ID:', id);
  menuItems = menuItems.filter(item => item.id !== id);
  console.log('Remaining items:', menuItems);

  // Clear editing state if we're removing the item being edited
  if (editingItemId === id) {
    editingItemId = null;
  }

  renderMenuItems();
  showStatus(`✅ "${itemName}" removed! Remember to save your changes.`, 'success');
}

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
        const badgeClass = getCategoryBadgeClass(item.category || 'Food');

        if (isEditing) {
          // Render edit form
          html += `
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
        } else {
          // Render normal view
          html += `
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
      });
    }
  });

  list.innerHTML = html;

  // Attach event listeners to edit buttons
  const editButtons = list.querySelectorAll('.edit-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      editMenuItem(id);
    });
  });

  // Attach event listeners to save edit buttons
  const saveEditButtons = list.querySelectorAll('.btn-save-edit');
  saveEditButtons.forEach(button => {
    button.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      saveEdit(id);
    });
  });

  // Attach event listeners to cancel edit buttons
  const cancelEditButtons = list.querySelectorAll('.btn-cancel-edit');
  cancelEditButtons.forEach(button => {
    button.addEventListener('click', cancelEdit);
  });

  // Attach event listeners to remove buttons
  const removeButtons = list.querySelectorAll('.remove-btn');
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      removeMenuItem(id);
    });
  });
}

function saveConfig() {
  console.log('Saving config...');
  console.log('Menu items to save:', menuItems);

  if (menuItems.length === 0) {
    showStatus('⚠️ Add at least one menu item before saving', 'error');
    return;
  }

  // Don't allow saving while editing
  if (editingItemId !== null) {
    showStatus('⚠️ Please save or cancel your current edit first', 'error');
    return;
  }

  const configData = {
    menuItems: menuItems,
    cooldown: 60, // 1 minute default
    timestamp: new Date().toISOString()
  };

  try {
    window.Twitch.ext.configuration.set(
      'broadcaster',
      '1.0',
      JSON.stringify(configData)
    );

    console.log('✅ Config saved!');

    // Count items by category
    const counts = {
      'Food': 0,
      'Drink': 0,
      'Sub Combo': 0
    };

    menuItems.forEach(item => {
      const category = item.category || 'Food';
      if (counts[category] !== undefined) {
        counts[category]++;
      }
    });

    const summary = `${counts['Food']} food, ${counts['Drink']} drinks, ${counts['Sub Combo']} combos`;
    showStatus(`✅ Saved ${menuItems.length} items (${summary}) successfully!`, 'success');

    setTimeout(() => {
      const status = document.getElementById('status');
      status.textContent = '';
      status.className = '';
    }, 5000);

  } catch (error) {
    console.error('❌ Save failed:', error);
    showStatus('❌ Error: ' + error.message, 'error');
  }
}

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

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('🐱 Cat Cafe Config ready!');
