//console.log('📋 Menu utility loaded');

// Categories are now loaded dynamically from config — no hardcoded array.
let currentCategory = null; // Default category - will be updated to first non-empty category ID
let isOnCooldown = false; // Track if user is currently on cooldown
let cooldownIntervalId = null; // Track the cooldown timer interval

/**
 * Loads menu configuration from Twitch Configuration Service
 * @returns {Object|null} { categories, menuItems } or null if not configured
 */
function loadMenuConfig() {
  //console.log('Loading config...');
  const config = window.Twitch.ext.configuration.broadcaster;

  if (config && config.content) {
    const data = JSON.parse(config.content);
    // console.log('📦 Config loaded:', data.menuItems?.length || 0, 'items');

    if (data.menuItems && data.menuItems.length > 0) {
      // Support legacy configs that have no categories array
      if (!data.categories) {
        data.categories = [
          { id: 'cat_1', label: 'Food' },
          { id: 'cat_2', label: 'Drink' },
          { id: 'cat_3', label: 'Sub Combo' }
        ];
        // Remap legacy label-based category values to IDs
        const labelToId = {};
        data.categories.forEach(c => { labelToId[c.label] = c.id; });
        data.menuItems = data.menuItems.map(item => ({
          ...item,
          category: labelToId[item.category] || 'cat_1'
        }));
      }

      return { categories: data.categories, menuItems: data.menuItems };
    }
  }

  return null;
}

/**
 * Groups menu items by category ID
 * @param {Array} items - Array of menu item objects
 * @param {Array} cats - Array of category objects { id, label }
 * @returns {Object} Items grouped by category ID
 */
function groupItemsByCategory(items, cats) {
  const grouped = {};
  cats.forEach(cat => { grouped[cat.id] = []; });

  items.forEach(item => {
    const catId = item.category;
    if (grouped[catId] !== undefined) {
      grouped[catId].push(item);
    }
    // Items with an unknown category ID are silently skipped on the panel
  });

  // console.log('📊 Items by category:', Object.fromEntries(
  //   cats.map(c => [c.label, grouped[c.id].length])
  // ));

  return grouped;
}

/**
 * Finds the first non-empty category to use as default
 * @param {Object} groupedItems - Items grouped by category ID
 * @param {Array} cats - Ordered categories array { id, label }
 * @returns {string|null} First category ID with items, or first category ID as fallback
 */
function findDefaultCategory(groupedItems, cats) {
  // Check each category in order
  for (const cat of cats) {
    if (groupedItems[cat.id] && groupedItems[cat.id].length > 0) {
      // console.log(`🎯 Default category set to: ${cat.label}`);
      return cat.id;
    }
  }

  // Fallback to first category if all are empty (shouldn't happen)
  console.log('🎯 Default category: first category (fallback)');
  return cats.length > 0 ? cats[0].id : null;
}

/**
 * Displays category tabs
 * @param {Object} groupedItems - Items grouped by category ID
 * @param {Array} cats - Ordered categories array { id, label }
 * @param {Function} onTabClick - Callback when tab is clicked, receives category ID
 */
function displayCategoryTabs(groupedItems, cats, onTabClick) {
  const tabsContainer = document.getElementById('categoryTabs');

  if (!tabsContainer) {
    console.error('❌ Category tabs container not found!');
    return;
  }

  tabsContainer.innerHTML = '';

  // Set default category to first non-empty category
  currentCategory = findDefaultCategory(groupedItems, cats);

  cats.forEach(cat => {
    const itemCount = (groupedItems[cat.id] || []).length;

    const tab = document.createElement('button');
    tab.className = 'category-tab';
    tab.setAttribute('data-category', cat.id);

    // Add active class to current category
    if (cat.id === currentCategory) {
      tab.classList.add('active');
    }

    // Create tab content with category name and count
    const tabText = document.createElement('div');
    tabText.className = 'tab-text';
    tabText.textContent = cat.label;

    const tabCount = document.createElement('div');
    tabCount.className = 'tab-count';
    tabCount.textContent = `(${itemCount})`;

    tab.appendChild(tabText);
    tab.appendChild(tabCount);

    tab.addEventListener('click', () => onTabClick(cat.id));

    tabsContainer.appendChild(tab);
  });

  //console.log('✅ Category tabs displayed');
}

/**
 * Displays menu items for the current category
 * @param {Array} items - Array of menu item objects for current category
 * @param {Function} onOrderClick - Callback function when order button is clicked
 */
function displayMenuItems(items, onOrderClick) {
  const menuDisplay = document.getElementById('menuDisplay');

  if (!menuDisplay) {
    console.error('❌ Menu display container not found!');
    return;
  }

  menuDisplay.innerHTML = ''; // Clear existing content

  // console.log(`📋 Displaying ${items.length} items in current category`);

  if (items.length === 0) {
    menuDisplay.innerHTML = `
      <div class="empty-category">
        <img 
          src="assets/UNICAT_mug.png"
          alt="UniCat Mug"
          class="empty-img-icon"  
        />
        <div class="empty-text">No items in this category yet</div>
      </div>
    `;
    return;
  }

  items.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'menu-item';

    // Apply disabled class if on cooldown
    if (isOnCooldown) {
      itemDiv.classList.add('disabled');
    }

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

    // Create order button - PASS THE FULL ITEM OBJECT
    const orderBtn = document.createElement('button');
    orderBtn.className = 'order-button';
    orderBtn.textContent = isOnCooldown ? 'ON COOLDOWN' : 'ORDER';
    orderBtn.disabled = isOnCooldown;
    orderBtn.addEventListener('click', () => onOrderClick(item, orderBtn)); // Pass full item and button ref

    // Add toggle functionality
    infoToggle.addEventListener('click', (e) => {
      e.stopPropagation();
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
}

/**
 * Updates the item count display
 * @param {number} totalItems - Total number of items across all categories
 * @param {number} categoryItems - Number of items in current category
 */
function updateItemCount(totalItems, categoryItems) {
  const itemCountElement = document.getElementById('itemCount');

  if (!itemCountElement) {
    console.error('❌ Item count element not found!');
    return;
  }

  itemCountElement.textContent = categoryItems === totalItems
    ? `${totalItems} items available`
    : `${categoryItems} of ${totalItems} items`;
}

/**
 * Switches to a different category
 * @param {string} category - Category name to switch to
 */
function setCurrentCategory(category) {
  // console.log(`📂 Setting current category to: ${category}`);
  currentCategory = category;
}

/**
 * Gets the current category
 * @returns {string} Current category name
 */
function getCurrentCategory() {
  return currentCategory;
}

/**
 * Disables all order buttons and shows cooldown UI
 * @param {number} remainingTime - Remaining cooldown time in milliseconds
 * @param {Function} onCooldownEnd - Callback when cooldown expires
 * @returns {number} Interval ID for the cooldown timer
 */
function disableOrdering(remainingTime, onCooldownEnd) {
  // Set cooldown state flag
  isOnCooldown = true;

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

  // Clear any existing interval
  if (cooldownIntervalId) {
    clearInterval(cooldownIntervalId);
  }

  // Update cooldown timer and store the interval ID
  cooldownIntervalId = updateCooldownTimer(remainingTime, onCooldownEnd);

  return cooldownIntervalId;
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
    }
    else {
      // Update display
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      if (cooldownTimeSpan) {
        cooldownTimeSpan.textContent = `${minutes}m ${seconds}s`;
      }
    }
  }, 1000);

  // Set initial display
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  if (cooldownTimeSpan) {
    cooldownTimeSpan.textContent = `${minutes}m ${seconds}s`;
  }

  return intervalId;
}

/**
 * Re-enables ordering after cooldown expires
 */
function enableOrdering() {
  //console.log('✅ Cooldown expired, re-enabling ordering');

  // Clear cooldown state flag
  isOnCooldown = false;

  // Clear interval if it exists
  if (cooldownIntervalId) {
    clearInterval(cooldownIntervalId);
    cooldownIntervalId = null;
  }

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

/**
 * Gets the current cooldown state
 * @returns {boolean} True if currently on cooldown
 */
function getIsOnCooldown() {
  return isOnCooldown;
}

/**
 * Sets all order buttons into a loading state while an order is in flight.
 * The clicked button shows the animated dots; all others are silently disabled.
 * @param {HTMLElement} clickedButton - The button the user clicked
 */
function setOrderButtonLoading(clickedButton) {
  const allButtons = document.querySelectorAll('.order-button');
  allButtons.forEach(btn => {
    btn.disabled = true;
    if (btn === clickedButton) {
      btn.textContent = '';
      btn.classList.add('loading-dots');
    }
  });
}

/**
 * Restores all order buttons after an order resolves.
 * @param {HTMLElement} clickedButton - The button that was originally clicked
 */
function clearOrderButtonLoading(clickedButton) {
  const allButtons = document.querySelectorAll('.order-button');
  allButtons.forEach(btn => {
    btn.disabled = false;
    if (btn === clickedButton) {
      btn.textContent = 'ORDER';
      btn.classList.remove('loading-dots');
    }
  });
}