console.log('Panel script loaded');

// ⚙️ CONFIGURATION - UPDATE THIS WITH YOUR VERCEL URL
const BACKEND_URL = 'https://your-vercel-url.vercel.app';

let twitchAuth = null;
let menuItems = [];
let viewerDisplayName = 'Viewer'; // Default fallback

window.Twitch.ext.onAuthorized(async (auth) => {
  console.log('✅ Authorized!', auth);
  console.log('Channel ID:', auth.channelId);
  console.log('User ID:', auth.userId);
  console.log('JWT Token:', auth.token.substring(0, 20) + '...');

  twitchAuth = auth;

  // Fetch viewer's display name if they're logged in
  if (!window.Twitch.ext.viewer.isLinked) {
    console.log('👤 Viewer not linked, using "Viewer"');
    viewerDisplayName = 'Viewer';
  } else {
    await fetchViewerName(auth);
  }

  loadConfig();
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
      console.log('⚠️ Could not fetch username, using "Viewer"');
      viewerDisplayName = 'Viewer';
      return;
    }

    const body = await response.json();
    const displayName = body.data.at(0)?.display_name;

    if (displayName) {
      viewerDisplayName = displayName;
      console.log('👤 Viewer name:', viewerDisplayName);
    } else {
      console.log('⚠️ No display name found, using "Viewer"');
      viewerDisplayName = 'Viewer';
    }
  } catch (error) {
    console.error('❌ Error fetching viewer name:', error);
    viewerDisplayName = 'Viewer';
  }
}

function loadConfig() {
  console.log('Loading config...');
  const config = window.Twitch.ext.configuration.broadcaster;
  console.log('Config object:', config);

  if (config && config.content) {
    const data = JSON.parse(config.content);
    console.log('Parsed data:', data);

    if (data.menuItems && data.menuItems.length > 0) {
      menuItems = data.menuItems;
      displayMenuItems(data.menuItems);
    } else {
      document.getElementById('menuDisplay').innerHTML =
        '<p style="color: #999;">No menu items configured yet.</p>';
    }
  } else {
    console.log('No config set yet');
    document.getElementById('menuDisplay').innerHTML =
      '<p style="color: #999;">Streamer needs to configure menu items!</p>';
  }
}

function displayMenuItems(items) {
  const menuDisplay = document.getElementById('menuDisplay');
  menuDisplay.innerHTML = ''; // Clear existing content

  items.forEach((item, index) => {
    // Create menu item element
    const itemDiv = document.createElement('div');
    itemDiv.className = 'menu-item';
    itemDiv.style.cssText = `
      padding: 10px;
      background: #f8f9fa;
      margin: 5px 0;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    `;

    // Add hover effects
    itemDiv.addEventListener('mouseenter', function() {
      this.style.background = '#e9ecef';
    });
    itemDiv.addEventListener('mouseleave', function() {
      this.style.background = '#f8f9fa';
    });

    // Add click handler
    itemDiv.addEventListener('click', function() {
      console.log('Item clicked:', item.name);
      orderItem(item.name, item.emoji);
    });

    // Create content
    itemDiv.innerHTML = `
      <span style="font-size: 24px;">${item.emoji}</span>
      <span style="margin-left: 10px; font-weight: bold;">${item.name}</span>
      <span style="float: right; color: #6441a5; font-size: 14px;">Click to order →</span>
    `;

    menuDisplay.appendChild(itemDiv);
  });

  document.getElementById('itemCount').textContent = `${items.length} items available`;
}

async function orderItem(itemName, emoji) {
  if (!twitchAuth) {
    alert('❌ Not authorized. Please refresh the page.');
    return;
  }

  console.log(`📤 Ordering: ${itemName}`);
  console.log('👤 Using username:', viewerDisplayName);

  // Show loading state
  const menuDisplay = document.getElementById('menuDisplay');
  const originalHTML = menuDisplay.innerHTML;
  menuDisplay.innerHTML = '<p style="color: #6441a5;">⏳ Sending order...</p>';

  try {
    console.log('Making request to:', `${BACKEND_URL}/api/order`);

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
    console.log('📥 Response:', response.status, data);

    // Restore menu
    menuDisplay.innerHTML = originalHTML;

    // Re-attach event listeners after restoring HTML
    loadConfig();

    if (response.ok) {
      // Success!
      showNotification(`✅ ${emoji} ${itemName} ordered successfully!`, 'success');
    } else if (response.status === 429) {
      // Rate limited
      const seconds = data.remainingTime || 300;
      const minutes = Math.floor(seconds / 60);
      showNotification(`⏳ Please wait ${minutes}m ${seconds % 60}s before ordering again`, 'warning');
    } else if (response.status === 401) {
      // Unauthorized
      showNotification(`❌ Authorization failed: ${data.details || data.error}`, 'error');
    } else {
      // Other error
      showNotification(`❌ Failed to order: ${data.error || 'Unknown error'}`, 'error');
    }

  } catch (error) {
    console.error('💥 Order failed:', error);
    menuDisplay.innerHTML = originalHTML;
    loadConfig(); // Re-attach event listeners
    showNotification(`❌ Network error: ${error.message}`, 'error');
  }
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  // Set colors based on type
  if (type === 'success') {
    notification.style.background = '#d4edda';
    notification.style.color = '#155724';
    notification.style.border = '1px solid #c3e6cb';
  } else if (type === 'error') {
    notification.style.background = '#f8d7da';
    notification.style.color = '#721c24';
    notification.style.border = '1px solid #f5c6cb';
  } else if (type === 'warning') {
    notification.style.background = '#fff3cd';
    notification.style.color = '#856404';
    notification.style.border = '1px solid #ffeeba';
  } else {
    notification.style.background = '#d1ecf1';
    notification.style.color = '#0c5460';
    notification.style.border = '1px solid #bee5eb';
  }

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

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

window.Twitch.ext.configuration.onChanged(() => {
  console.log('Config changed! Reloading...');
  loadConfig();
});

console.log('🐱 Cat Cafe Panel ready!');
console.log('Backend URL:', BACKEND_URL);