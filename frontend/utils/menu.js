console.log('📋 Menu utility loaded');

/**
 * Loads menu configuration from Twitch Configuration Service
 * @returns {Array|null} Array of menu items or null if not configured
 */
function loadMenuConfig() {
  console.log('Loading config...');
  const config = window.Twitch.ext.configuration.broadcaster;
  // console.log('Config object:', config);

  if (config && config.content) {
    const data = JSON.parse(config.content);
    // console.log('Parsed data:', data);

    if (data.menuItems && data.menuItems.length > 0) {
      return data.menuItems;
    }
  }
  
  return null;
}

/**
 * Displays menu items in the UI
 * @param {Array} items - Array of menu item objects
 * @param {Function} onOrderClick - Callback function when order button is clicked
 */
function displayMenuItems(items, onOrderClick) {
  const menuDisplay = document.getElementById('menuDisplay');
  menuDisplay.innerHTML = ''; // Clear existing content

  items.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'menu-item';

    // Create header with name and info toggle
    const headerDiv = document.createElement('div');
    headerDiv.className = 'item-header';

    const itemName = document.createElement('div');
    itemName.className = 'item-name';
    itemName.textContent = item.name;

    const infoToggle = document.createElement('button');
    infoToggle.className = 'info-toggle';
    infoToggle.textContent = '[?]';
    infoToggle.setAttribute('data-index', index);

    headerDiv.appendChild(itemName);
    headerDiv.appendChild(infoToggle);

    // Create item description (hidden by default)
    const itemDesc = document.createElement('div');
    itemDesc.className = 'item-description hidden';
    itemDesc.textContent = item.description || 'A delightful cafe item';
    itemDesc.setAttribute('data-index', index);

    // Create order button
    const orderBtn = document.createElement('button');
    orderBtn.className = 'order-button';
    orderBtn.textContent = 'ORDER';
    orderBtn.addEventListener('click', () => onOrderClick(item.name));

    // Add toggle functionality
    infoToggle.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent any parent handlers
      const desc = itemDesc;
      const isHidden = desc.classList.contains('hidden');

      if (isHidden) {
        desc.classList.remove('hidden');
        infoToggle.textContent = '[-]';
      }
      else {
        desc.classList.add('hidden');
        infoToggle.textContent = '[?]';
      }
    });

    itemDiv.appendChild(headerDiv);
    itemDiv.appendChild(itemDesc);
    itemDiv.appendChild(orderBtn);

    menuDisplay.appendChild(itemDiv);
  });

  document.getElementById('itemCount').textContent = `${items.length} items available`;
}

/**
 * Disables all order buttons and shows cooldown UI
 * @param {number} remainingTime - Remaining cooldown time in milliseconds
 * @param {Function} onCooldownEnd - Callback when cooldown expires
 * @returns {number} Interval ID for the cooldown timer
 */
function disableOrdering(remainingTime, onCooldownEnd) {
  // Disable all order buttons
  const orderButtons = document.querySelectorAll('.order-button');
  orderButtons.forEach(btn => {
    btn.disabled = true;
    btn.textContent = 'ON COOLDOWN';
  });

  // Add disabled class to menu items
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => item.classList.add('disabled'));

  // Show cooldown display
  const cooldownDisplay = document.getElementById('cooldownDisplay');
  cooldownDisplay.innerHTML = `
    <div class="cooldown-info">
      Cooldown: <span id="cooldownTime">Calculating...</span>
    </div>
  `;

  // Update cooldown timer
  return updateCooldownTimer(remainingTime, onCooldownEnd);
}

/**
 * Updates the cooldown timer display
 * @param {number} remainingTime - Remaining time in milliseconds
 * @param {Function} onCooldownEnd - Callback when cooldown expires
 * @returns {number} Interval ID
 */
function updateCooldownTimer(remainingTime, onCooldownEnd) {
  const cooldownTimeSpan = document.getElementById('cooldownTime');

  // Update timer every second
  const intervalId = setInterval(() => {
    remainingTime -= 1000;

    if (remainingTime <= 0) {
      // Cooldown expired
      clearInterval(intervalId);
      onCooldownEnd();
    } else {
      // Update display
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      cooldownTimeSpan.textContent = `${minutes}m ${seconds}s`;
    }
  }, 1000);

  // Set initial display
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  cooldownTimeSpan.textContent = `${minutes}m ${seconds}s`;

  return intervalId;
}

/**
 * Re-enables ordering after cooldown expires
 */
function enableOrdering() {
  console.log('✅ Cooldown expired, re-enabling ordering');

  // Re-enable all order buttons
  const orderButtons = document.querySelectorAll('.order-button');
  orderButtons.forEach(btn => {
    btn.disabled = false;
    btn.textContent = 'ORDER';
  });

  // Remove disabled class from menu items
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => item.classList.remove('disabled'));

  // Hide cooldown display
  const cooldownDisplay = document.getElementById('cooldownDisplay');
  cooldownDisplay.innerHTML = '';
}
