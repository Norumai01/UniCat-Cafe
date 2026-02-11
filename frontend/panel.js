console.log('🐱 Cat Cafe Panel script loaded');

// Global state
let twitchAuth = null;
let menuItems = [];
let viewerDisplayName = 'Viewer'; // Default fallback
let cooldownTimer = null;

// Initialize when Twitch authorizes the extension
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

  // Check if user has a Twitch account
  if (window.Twitch.ext.viewer.opaqueId.startsWith('A')) {
    console.log('🚫 User not logged in');
    showLoginRequired();
    return;
  }

  // Check if Twitch account is linked, otherwise get permissions to share user id.
  // Note: Broadcaster ID are linked by default to the extension installed on their channel.
  if (!window.Twitch.ext.viewer.isLinked) {
    console.log('🔒 User logged in but identity not linked');
    showIdentityRequired(requestIdentityShare);
    return;
  }

  console.log('✅ User linked');
  viewerDisplayName = await fetchViewerName(auth);

  // If username fetch failed, show error and prevent API calls
  if (viewerDisplayName === 'Viewer') {
    console.error("🚫 Error occurred: User not found or username fetch failed.");
    showUsernameFetchError();
    return;
  }
  loadAndDisplayMenu();
  checkInitialCooldown();
});

// Load menu configuration and display it
function loadAndDisplayMenu() {
  menuItems = loadMenuConfig();
  
  if (menuItems && menuItems.length > 0) {
    displayMenuItems(menuItems, handleOrderClick);
  }
  else if (menuItems === null) {
    showError('Streamer needs to configure menu items!');
  }
  else {
    showError('No menu items configured yet.');
  }
}

// Check if user is on cooldown when panel loads
function checkInitialCooldown() {
  const remainingTime = getRemainingCooldown(twitchAuth.channelId);
  
  if (remainingTime > 0) {
    // Still on cooldown
    startCooldownUI(remainingTime);
  }
  else {
    // Cooldown expired, clear it
    clearCooldown(twitchAuth.channelId);
  }
}

// Start cooldown UI and timer
function startCooldownUI(remainingTime) {
  cooldownTimer = disableOrdering(remainingTime, handleCooldownEnd);
}

// Handle when cooldown expires
function handleCooldownEnd() {
  clearCooldown(twitchAuth.channelId);
  enableOrdering();
  showNotification('✅ You can order again!', 'success');
}

// Handle order button clicks
async function handleOrderClick(itemName) {
  if (!twitchAuth) {
    showNotification('❌ Not authorized. Please refresh the page.', 'error');
    return;
  }

  // Check cooldown before ordering
  const remainingTime = getRemainingCooldown(twitchAuth.channelId);
  
  if (remainingTime > 0) {
    const formattedTime = formatCooldownTime(remainingTime);
    showNotification(`⏳ Wait ${formattedTime} before ordering again`, 'warning');
    return;
  }

  // console.log(`📤 Ordering: ${itemName}`);
  // console.log('👤 Using username:', viewerDisplayName);

  // Send order to backend
  const result = await sendOrder(twitchAuth, itemName, viewerDisplayName);
  
  if (result.success) {
    // Success! Set cooldown
    setCooldown(twitchAuth.channelId);
    showNotification(`✅ ${itemName} ordered successfully!`, 'success');
    
    // Start cooldown timer
    const cooldownDuration = 60 * 1000; // 1 minute
    startCooldownUI(cooldownDuration);
  }
  else {
    // Show error
    showNotification(`❌ Failed to order: ${result.error}`, 'error');
  }
}

// Listen for config changes
window.Twitch.ext.configuration.onChanged(() => {
  console.log('Config changed! Reloading...');
  loadAndDisplayMenu();
});

console.log('🐱 Cat Cafe Panel ready!');
// console.log('Backend URL:', getBackendUrl());
// console.log('Cooldown Duration:', 60 / 60, 'minutes');
