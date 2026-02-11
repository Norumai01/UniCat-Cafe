console.log('🐱 Cat Cafe Config script loaded');

let menuItems = [];

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

  // Check for duplicate names
  const isDuplicate = menuItems.some(item =>
    item.name.toLowerCase() === name.toLowerCase()
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

function removeMenuItem(id) {
  const item = menuItems.find(item => item.id === id);
  const itemName = item ? item.name : 'Item';

  console.log('Removing item with ID:', id);
  menuItems = menuItems.filter(item => item.id !== id);
  console.log('Remaining items:', menuItems);
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
        const badgeClass = getCategoryBadgeClass(item.category || 'Drink');
        html += `
          <div class="menu-item-entry">
            <div class="item-info">
              <div class="item-info-header">
                <span class="item-info-name">${escapeHtml(item.name)}</span>
                <span class="item-category-badge ${badgeClass}">${escapeHtml(item.category || 'Drink')}</span>
              </div>
              <div class="item-info-desc">${escapeHtml(item.description)}</div>
            </div>
            <button class="btn btn-danger remove-btn" data-id="${item.id}">
              Remove
            </button>
          </div>
        `;
      });
    }
  });

  list.innerHTML = html;

  // Attach event listeners to all remove buttons
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
      const category = item.category || 'Drink';
      if (counts[category] !== undefined) {
        counts[category]++;
      }
    });

    const summary = `${counts['Drink']} drinks, ${counts['Food']} food, ${counts['Sub Combo']} combos`;
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
