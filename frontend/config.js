console.log('🐱 Cat Cafe Config script loaded');

let menuItems = [];
let editingItemId = null; // Track which item is being edited

// Default category messages - ONE per category
const DEFAULT_MESSAGES = {
  'Food': '@{username} has ordered {item}. Enjoy your meal!',
  'Drink': '@{username} has ordered {item}. Stay hydrated!',
  'Sub Combo': '@{username} ordered the special {item}!'
};

let categoryMessages = { ...DEFAULT_MESSAGES };

window.Twitch.ext.onAuthorized(() => {
  console.log('✅ Authorized!');
  loadExisting();

  // Attach event listeners
  document.getElementById('addItemButton').addEventListener('click', addMenuItem);
  document.getElementById('saveButton').addEventListener('click', saveConfig);
  document.getElementById('resetMessagesButton').addEventListener('click', resetMessages);
});

function loadExisting() {
  const config = window.Twitch.ext.configuration.broadcaster;
  if (config && config.content) {
    const data = JSON.parse(config.content);
    console.log('Existing config:', data);
    menuItems = data.menuItems || [];

    // Load category messages or use defaults
    categoryMessages = data.categoryMessages || { ...DEFAULT_MESSAGES };

    renderMenuItems();
    renderMessageTemplates();
  }
  else {
    // No config yet, show defaults
    renderMessageTemplates();
  }
}

function addMenuItem() {
  const categoryInput = document.getElementById('itemCategory');
  const nameInput = document.getElementById('itemName');
  const descriptionInput = document.getElementById('itemDescription');

  const category = categoryInput.value;
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

function renderMessageTemplates() {
  const container = document.getElementById('messageTemplates');
  if (!container) return;

  container.innerHTML = '';

  Object.keys(categoryMessages).forEach(category => {
    const message = categoryMessages[category];

    const categorySection = document.createElement('div');
    categorySection.className = 'message-category-section';

    categorySection.innerHTML = `
      <div class="message-category-header">
        <span class="message-category-title">${category}</span>
      </div>
      <div class="message-template-item">
        <textarea 
          class="message-template-input"
          rows="2"
          maxlength="300"
          placeholder="e.g., @{username} ordered {item}!"
          data-category="${category}"
        >${message}</textarea>
        <div class="message-template-help">
          Use <code>{username}</code> for viewer name and <code>{item}</code> for menu item
        </div>
      </div>
    `;

    container.appendChild(categorySection);

    // Attach event listener to textarea
    const textarea = categorySection.querySelector('.message-template-input');
    textarea.addEventListener('change', function() {
      updateMessageTemplate(category, this.value);
    });
  });
}

function updateMessageTemplate(category, value) {
  const trimmed = value.trim();

  // Validate the template
  const validation = validateMessageTemplate(trimmed);
  if (!validation.isValid) {
    showStatus(validation.error, 'error');
    return;
  }

  categoryMessages[category] = trimmed;
  console.log(`Updated ${category} message:`, trimmed);
}

function resetMessages() {
  categoryMessages = { ...DEFAULT_MESSAGES };
  renderMessageTemplates();
  showStatus('✅ Messages reset to defaults! Remember to save your changes.', 'success');
}

function saveConfig() {
  console.log('Saving config...');
  console.log('Menu items to save:', menuItems);
  console.log('Category messages to save:', categoryMessages);

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
  Object.keys(categoryMessages).forEach(category => {
    const template = categoryMessages[category];
    if (!template.includes('{username}') || !template.includes('{item}')) {
      showStatus(`⚠️ ${category} message must include {username} and {item}`, 'error');
      hasErrors = true;
    }
  });

  if (hasErrors) return;

  const configData = {
    menuItems: menuItems,
    categoryMessages: categoryMessages,
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
    showStatus(`✅ Saved ${menuItems.length} items (${summary}) and custom messages successfully!`, 'success');

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

console.log('🐱 Cat Cafe Config ready!');