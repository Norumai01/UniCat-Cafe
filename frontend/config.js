//console.log('🐱 Cat Cafe Config script loaded');

// ─── State ────────────────────────────────────────────────────────────────────

let menuItems = [];
let editingItemId = null; // Track which item is being edited

// categoryMessages, failMessages, categories, DEFAULT_CATEGORIES and
// buildDefaultMessages are declared in utils/config/categories.js

let categoryMessages = {};
let failMessages = {};

// ─── Init ─────────────────────────────────────────────────────────────────────

window.Twitch.ext.onAuthorized(() => {
  //console.log('✅ Authorized!');
  loadExisting();

  // Attach event listeners
  document.getElementById('addItemButton').addEventListener('click', addMenuItem);
  document.getElementById('saveButton').addEventListener('click', saveConfig);
  document.getElementById('resetMessagesButton').addEventListener('click', resetMessages);
  document.getElementById('addCategoryButton').addEventListener('click', addCategory);
});

/**
 * Loads existing config from Twitch Configuration Service.
 * Handles legacy migration and first-install seeding.
 */
function loadExisting() {
  const config = window.Twitch.ext.configuration.broadcaster;

  if (config && config.content) {
    const data = JSON.parse(config.content);
    //console.log('Existing config:', data);

    // ── Migrate legacy configs (no categories array = pre-dynamic-categories save) ──
    if (!data.categories) {
      categories = DEFAULT_CATEGORIES.map(c => ({ ...c }));

      const { success: defSuccess, fail: defFail } = buildDefaultMessages(categories);
      const labelToId = {};
      categories.forEach(c => { labelToId[c.label] = c.id; });

      categoryMessages = {};
      failMessages = {};

      // Remap label-keyed messages → ID-keyed
      if (data.categoryMessages) {
        Object.entries(data.categoryMessages).forEach(([label, msg]) => {
          const id = labelToId[label];
          if (id) categoryMessages[id] = msg;
        });
      }
      if (data.failMessages) {
        Object.entries(data.failMessages).forEach(([label, msg]) => {
          const id = labelToId[label];
          if (id) failMessages[id] = msg;
        });
      }

      // Fill any gaps with defaults
      categories.forEach(cat => {
        if (!categoryMessages[cat.id]) categoryMessages[cat.id] = defSuccess[cat.id];

        if (!failMessages[cat.id]) failMessages[cat.id] = defFail[cat.id];
      });

      // Remap legacy label-stored items → ID-stored items
      menuItems = (data.menuItems || []).map(item => ({
        ...item,
        category: labelToId[item.category] || 'cat_1'
      }));
    }
    else {
      // ── Normal load ───────────────────────────────────────────────────────
      categories = data.categories;
      menuItems = data.menuItems || [];

      const { success: defSuccess, fail: defFail } = buildDefaultMessages(categories);
      categoryMessages = data.categoryMessages || defSuccess;
      failMessages = data.failMessages || defFail;

      // Provision messages for any categories added since last save
      categories.forEach(cat => {
        if (!categoryMessages[cat.id]) categoryMessages[cat.id] = defSuccess[cat.id];

        if (!failMessages[cat.id]) failMessages[cat.id] = defFail[cat.id];
      });
    }
  }
  else {
    // No config yet, seed defaults for first install
    categories = DEFAULT_CATEGORIES.map(c => ({ ...c }));
    const { success: defSuccess, fail: defFail } = buildDefaultMessages(categories);
    categoryMessages = defSuccess;
    failMessages = defFail;
    menuItems = [];
  }

  renderCategoryManager();
  populateCategorySelect();
  renderMenuItems();
  renderMessageTemplates();
  renderFailMessageTemplates();
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

function addMenuItem() {
  const categoryInput = document.getElementById('itemCategory');
  const nameInput = document.getElementById('itemName');
  const descriptionInput = document.getElementById('itemDescription');

  const categoryId = categoryInput.value;
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();

  // Validation using utility function
  const validation = validateMenuItem(name, description, menuItems, editingItemId);
  if (!validation.isValid) {
    showStatus(validation.error, 'error');
    return;
  }

  const newItem = {
    id: Date.now(),
    name: name,
    description: description,
    category: categoryId,
    enabled: true
  };

  menuItems.push(newItem);
  //console.log('Added item:', newItem);

  // Clear inputs
  nameInput.value = '';
  descriptionInput.value = '';
  // Keep category selected for convenience

  renderMenuItems();
  renderCategoryManager();
  showStatus(`✅ "${name}" added to ${getCategoryLabel(categoryId)}! Remember to save your changes.`, 'success');
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
  // Populate the edit form's category select after render, then restore selection
  populateCategorySelect();
  const editSelect = document.getElementById(`edit-category-${id}`);
  if (editSelect) editSelect.value = item.category;

  showStatus(`Editing "${item.name}"`, 'success');
}

function saveEdit(id) {
  const categoryInput = document.getElementById(`edit-category-${id}`);
  const nameInput = document.getElementById(`edit-name-${id}`);
  const descriptionInput = document.getElementById(`edit-description-${id}`);

  const categoryId = categoryInput.value;
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();

  // Validation using utility function
  const validation = validateMenuItem(name, description, menuItems, id);
  if (!validation.isValid) {
    showStatus(validation.error, 'error');
    return;
  }

  // Find and update the item
  const itemIndex = menuItems.findIndex(item => item.id === id);
  if (itemIndex !== -1) {
    menuItems[itemIndex] = {
      ...menuItems[itemIndex],
      name: name,
      description: description,
      category: categoryId
    };

    //console.log('Updated item:', menuItems[itemIndex]);

    editingItemId = null;
    renderMenuItems();
    renderCategoryManager();
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

  //console.log('Removing item with ID:', id);
  menuItems = menuItems.filter(item => item.id !== id);
  //console.log('Remaining items:', menuItems);

  // Clear editing state if we're removing the item being edited
  if (editingItemId === id) {
    editingItemId = null;
  }

  renderMenuItems();
  renderCategoryManager();
  showStatus(`✅ "${itemName}" removed! Remember to save your changes.`, 'success');
}

// ─── Save ─────────────────────────────────────────────────────────────────────

function saveConfig() {
  // console.log('Saving config...');
  // console.log('Menu items to save:', menuItems);
  // console.log('Category messages to save:', categoryMessages);
  // console.log('Fail messages to save:', failMessages);

  if (categories.length === 0) {
    showStatus('⚠️ Add at least one category before saving', 'error');
    return;
  }

  if (menuItems.length === 0) {
    showStatus('⚠️ Add at least one menu item before saving', 'error');
    return;
  }

  // Don't allow saving while editing
  if (editingItemId !== null) {
    showStatus('⚠️ Please save or cancel your current edit first', 'error');
    return;
  }

  // Validate that all message templates have required placeholders
  let hasErrors = false;

  // Validate success messages
  categories.forEach(cat => {
    const template = categoryMessages[cat.id];
    if (!template || !template.includes('{username}') || !template.includes('{item}')) {
      showStatus(`⚠️ "${cat.label}" message must include {username} and {item}`, 'error');
      hasErrors = true;
    }
  });

  // Validate fail messages
  categories.forEach(cat => {
    const template = failMessages[cat.id];
    if (!template || !template.includes('{username}') || !template.includes('{item}')) {
      showStatus(`⚠️ "${cat.label}" fail message must include {username} and {item}`, 'error');
      hasErrors = true;
    }
  });

  if (hasErrors) return;

  const configData = {
    categories: categories,
    menuItems: menuItems,
    categoryMessages: categoryMessages,
    failMessages: failMessages,
    cooldown: 60, // 1 minute default
    timestamp: new Date().toISOString()
  };

  try {
    window.Twitch.ext.configuration.set(
      'broadcaster',
      '1.0',
      JSON.stringify(configData)
    );

    //console.log('✅ Config saved!');

    // Count items by category dynamically
    const counts = {};
    categories.forEach(cat => { counts[cat.id] = 0; });
    menuItems.forEach(item => {
      if (counts[item.category] !== undefined) counts[item.category]++;
    });

    const summary = categories
      .map(cat => `${counts[cat.id]} ${cat.label.toLowerCase()}`)
      .join(', ');
    showStatus(`✅ Saved ${menuItems.length} items (${summary}) and custom messages successfully!`, 'success');

    setTimeout(() => {
      const status = document.getElementById('status');
      status.textContent = '';
      status.className = '';
    }, 5000);
  }
  catch (error) {
    console.error('❌ Save failed:', error);
    showStatus('❌ Error: ' + error.message, 'error');
  }
}

//console.log('🐱 Cat Cafe Config ready!');