console.log('🐱 Cat Cafe Panel script loaded');

// ⚙️ CONFIGURATION - UPDATE THIS WITH YOUR VERCEL URL
const BACKEND_URL = 'https://your-vercel-url.vercel.app';
const COOLDOWN_DURATION = 60 * 1000; // 1 minute in milliseconds

let twitchAuth = null;
let menuItems = [];
let viewerDisplayName = 'Viewer'; // Default fallback
let cooldownTimer = null;

window.Twitch.ext.onAuthorized(async (auth) => {
  console.log('✅ Authorized!');
  // DON'T UNCOMMENT BELOW IN PRODUCTION - exposes sensitive information.
  // console.log('✅ Authorized!', auth);
  // console.log('Channel ID:', auth.channelId);
  // console.log('User ID:', auth.userId);
  // console.log('Opaque ID:', window.Twitch.ext.viewer.opaqueId);
  // console.log('Viewer ID:', window.Twitch.ext.viewer.id);
  // console.log('Is Linked:', window.Twitch.ext.viewer.isLinked);
  twitchAuth = auth;

  // Check if user has a twitch account
  if (window.Twitch.ext.viewer.opaqueId.startsWith('A')) {
    console.log('🚫 User not logged in');
    showLoginRequired();
    return;
  }

  // Check if twitch account is linked, otherwise get permissions to share user id.
  // Note: Broadcaster ID are linked by default to the extension installed on their channel.
  if (!window.Twitch.ext.viewer.isLinked) {
    console.log('🔒 User logged in but identity not linked');
    showIdentityRequired();
    return;
  }

  console.log('✅ User linked');
  await fetchViewerName(auth);
  loadConfig();
  checkCooldown(); // Check if user is on cooldown
});

async function fetchViewerName(auth) {
  try {
    const endpointUrl = "https://api.twitch.tv/helix/users";
    const url = `${endpointUrl}?id=${window.Twitch.ext.viewer.id}`;

    const response = await fetch(url, {
      headers: {
        "Client-ID": auth.clientId,
        "Authorization": `Extension ${auth.helixToken}`
      }
    });

    if (!response.ok) {
      console.log('⚠️ Could not fetch username, returning...');
      return;
    }

    const body = await response.json();
    const displayName = body.data.at(0)?.display_name;

    // if (displayName) {
    //   viewerDisplayName = displayName;
    //   console.log('👤 Viewer name:', viewerDisplayName);
    // }
    if (displayName) {
      viewerDisplayName = displayName;
      console.log("Viewer name fetched successfully!");
    }
    else {
      console.log('⚠️ No display name found');
    }
  }
  catch (error) {
    console.error('❌ Error fetching viewer name:', error);
  }
}

// Show message for logged-out users
function showLoginRequired() {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="auth-required">
      <div class="auth-icon">🐱</div>
      <div class="auth-title">Login Required</div>
      <div class="auth-message">
        Please log in to Twitch to order from the Cat Cafe!
      </div>
      <div class="auth-note">
        Only Twitch users can place orders 😊
      </div>
    </div>
  `;
}

// Show message for logged-in users who haven't linked identity
function showIdentityRequired() {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="auth-required">
      <div class="auth-icon">🐱</div>
      <div class="auth-title">Link Your Account</div>
      <div class="auth-message">
        To order from the Cat Cafe, we need to know who you are!
      </div>
      <button id="link-identity-btn" class="auth-button">
        Link Twitch Account
      </button>
      <div class="auth-note">
        This lets us personalize your orders in chat 😊
      </div>
    </div>
  `;

  document.getElementById('link-identity-btn').addEventListener('click', () => {
    console.log('Requesting identity share...');
    window.Twitch.ext.actions.requestIdShare();
  });
}

function loadConfig() {
  console.log('Loading config...');
  const config = window.Twitch.ext.configuration.broadcaster;
  // console.log('Config object:', config);

  if (config && config.content) {
    const data = JSON.parse(config.content);
    // console.log('Parsed data:', data);

    if (data.menuItems && data.menuItems.length > 0) {
      menuItems = data.menuItems;
      displayMenuItems(data.menuItems);
    }
    else {
      document.getElementById('menuDisplay').innerHTML =
        '<div class="error-message">No menu items configured yet.</div>';
    }
  }
  else {
    console.log('No config set yet');
    document.getElementById('menuDisplay').innerHTML =
      '<div class="error-message">Streamer needs to configure menu items!</div>';
  }
}

function displayMenuItems(items) {
  const menuDisplay = document.getElementById('menuDisplay');
  menuDisplay.innerHTML = ''; // Clear existing content

  items.forEach((item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'menu-item';

    // Create item name
    const itemName = document.createElement('div');
    itemName.className = 'item-name';
    itemName.textContent = item.name;

    // Create item description
    const itemDesc = document.createElement('div');
    itemDesc.className = 'item-description';
    itemDesc.textContent = item.description || 'A delightful cafe item';

    // Create order button
    const orderBtn = document.createElement('button');
    orderBtn.className = 'order-button';
    orderBtn.textContent = 'ORDER';
    orderBtn.addEventListener('click', () => orderItem(item.name));

    itemDiv.appendChild(itemName);
    itemDiv.appendChild(itemDesc);
    itemDiv.appendChild(orderBtn);

    menuDisplay.appendChild(itemDiv);
  });

  document.getElementById('itemCount').textContent = `${items.length} items available`;
}

// Check if viewer is on cooldown
function checkCooldown() {
  const cooldownKey = `cat_cafe_cooldown_${twitchAuth.channelId}`;
  const lastOrderTime = localStorage.getItem(cooldownKey);

  if (lastOrderTime) {
    const elapsedTime = Date.now() - parseInt(lastOrderTime);
    const remainingTime = COOLDOWN_DURATION - elapsedTime;

    if (remainingTime > 0) {
      // Still on cooldown
      disableOrdering(remainingTime);
    }
    else {
      // Cooldown expired, clear it
      localStorage.removeItem(cooldownKey);
    }
  }
}

// Disable ordering and show cooldown timer
function disableOrdering(remainingTime) {
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
  updateCooldownTimer(remainingTime);
}

// Update cooldown timer display
function updateCooldownTimer(remainingTime) {
  const cooldownTimeSpan = document.getElementById('cooldownTime');

  // Clear existing timer if any
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
  }

  // Update timer every second
  cooldownTimer = setInterval(() => {
    remainingTime -= 1000;

    if (remainingTime <= 0) {
      // Cooldown expired
      clearInterval(cooldownTimer);
      enableOrdering();
    }
    else {
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
}

// Re-enable ordering after cooldown
function enableOrdering() {
  console.log('✅ Cooldown expired, re-enabling ordering');

  // Remove cooldown from localStorage
  const cooldownKey = `cat_cafe_cooldown_${twitchAuth.channelId}`;
  localStorage.removeItem(cooldownKey);

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

  showNotification('✅ You can order again!', 'success');
}

async function orderItem(itemName) {
  if (!twitchAuth) {
    showNotification('❌ Not authorized. Please refresh the page.', 'error');
    return;
  }

  // Check cooldown before ordering
  const cooldownKey = `cat_cafe_cooldown_${twitchAuth.channelId}`;
  const lastOrderTime = localStorage.getItem(cooldownKey);

  if (lastOrderTime) {
    const elapsedTime = Date.now() - parseInt(lastOrderTime);
    const remainingTime = COOLDOWN_DURATION - elapsedTime;

    if (remainingTime > 0) {
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      showNotification(`⏳ Wait ${minutes}m ${seconds}s before ordering again`, 'warning');
      return;
    }
  }

  // console.log(`📤 Ordering: ${itemName}`);
  // console.log('👤 Using username:', viewerDisplayName);

  try {
    console.log(`Placing order ${itemName} for ${viewerDisplayName}...`);
    // console.log(`Making request to: ${BACKEND_URL}/api/order`)

    const response = await fetch(`${BACKEND_URL}/api/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${twitchAuth.token}`
      },
      body: JSON.stringify({
        item: itemName,
        username: viewerDisplayName
      })
    });

    const data = await response.json();
    // console.log('📥 Response:', response.status, data);

    if (response.ok) {
      console.log(`✅ Order placed successfully.`);

      // Success! Set cooldown
      localStorage.setItem(cooldownKey, Date.now().toString());

      showNotification(`✅ ${itemName} ordered successfully!`, 'success');

      // Start cooldown timer
      disableOrdering(COOLDOWN_DURATION);
    }
    else if (response.status === 401) {
      // Unauthorized
      showNotification(`❌ Authorization failed: ${data.details || data.error}`, 'error');
    }
    else {
      // Other error
      showNotification(`❌ Failed to order: ${data.error || 'Unknown error'}`, 'error');
    }

  }
  catch (error) {
    console.error('💥 Order failed:', error);
    showNotification(`❌ Network error: ${error.message}`, 'error');
  }
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Listen for config changes
window.Twitch.ext.configuration.onChanged(() => {
  console.log('Config changed! Reloading...');
  loadConfig();
});

console.log('🐱 Cat Cafe Panel ready!');
//console.log('Backend URL:', BACKEND_URL);
//console.log('Cooldown Duration:', COOLDOWN_DURATION / 60000, 'minutes');
