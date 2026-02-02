console.log('Config script loaded');

let menuItems = [];

window.Twitch.ext.onAuthorized((auth) => {
  console.log('✅ Authorized!', auth);
  loadExisting();

  // Attach event listeners
  document.getElementById('addItemButton').addEventListener('click', addMenuItem);
  document.getElementById('saveButton').addEventListener('click', saveConfig);
  console.log('✅ Event listeners attached');
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
  const nameInput = document.getElementById('itemName');
  const emojiInput = document.getElementById('itemEmoji');

  const name = nameInput.value.trim();
  const emoji = emojiInput.value.trim();

  if (!name) {
    alert('Please enter an item name');
    return;
  }

  const newItem = {
    id: Date.now(),
    name: name,
    emoji: emoji || '🍵',
    enabled: true
  };

  menuItems.push(newItem);
  console.log('Added item:', newItem);

  // Clear inputs
  nameInput.value = '';
  emojiInput.value = '';

  renderMenuItems();
}

function removeMenuItem(id) {
  console.log('Removing item with ID:', id);
  menuItems = menuItems.filter(item => item.id !== id);
  console.log('Remaining items:', menuItems);
  renderMenuItems();
}

function renderMenuItems() {
  const list = document.getElementById('menuItemsList');

  if (menuItems.length === 0) {
    list.innerHTML = '<p style="color: #999;">No items added yet. Add your first menu item above!</p>';
    return;
  }

  list.innerHTML = menuItems.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 4px;">
            <span>${item.emoji} ${item.name}</span>
            <button class="remove-btn" data-id="${item.id}" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
        </div>
    `).join('');

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

  const configData = {
    menuItems: menuItems,
    cooldown: 300,
    timestamp: new Date().toISOString()
  };

  try {
    window.Twitch.ext.configuration.set(
      'broadcaster',
      '1.0',
      JSON.stringify(configData)
    );

    console.log('✅ Config saved!', configData);

    const status = document.getElementById('status');
    status.className = 'success';
    status.textContent = `✅ Saved ${menuItems.length} menu items successfully!`;

    setTimeout(() => {
      status.textContent = '';
      status.className = '';
    }, 3000);

  } catch (error) {
    console.error('❌ Save failed:', error);
    const status = document.getElementById('status');
    status.className = 'error';
    status.textContent = '❌ Error: ' + error.message;
  }
}