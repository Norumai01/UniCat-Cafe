console.log('🎨 UI utility loaded');

/**
 * Shows a notification message to the user
 * @param {string} message - Message to display
 * @param {string} type - Type of notification: 'success', 'error', 'warning', or 'info'
 */
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

/**
 * Shows the login required screen for anonymous users
 */
function showLoginRequired() {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="auth-required">
      <img 
        src="assets/UNICAT_cup.png"
        alt="UniCat Cup"
        class="auth-img-icon"
      />
      <div class="auth-title">Login Required</div>
      <div class="auth-message">
        Please log in to Twitch to order from the Cat Cafe!
      </div>
      <div class="auth-note">
        Only Twitch users can place orders
      </div>
    </div>
  `;
}

/**
 * Shows the identity linking screen for logged-in but unlinked users
 * @param {Function} onLinkClick - Callback function when link button is clicked
 */
function showIdentityRequired(onLinkClick) {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="auth-required">
      <img 
        src="assets/UNICAT_boba.png"
        alt="UniCat Cup"
        class="auth-img-icon"
      />
      <div class="auth-title">Link Your Account</div>
      <div class="auth-message">
        To order from the Cat Cafe, we need to know who you are!
      </div>
      <button id="link-identity-btn" class="auth-button">
        Link Twitch Account
      </button>
      <div class="auth-note">
        This lets us personalize your orders in the chat message
      </div>
    </div>
  `;

  document.getElementById('link-identity-btn').addEventListener('click', onLinkClick);
}

/**
 * Shows an error message in the menu display
 * @param {string} message - Error message to display
 */
function showError(message) {
  document.getElementById('menuDisplay').innerHTML = 
    `<div class="error-message">${message}</div>`;
}

/**
 * Shows a loading message in the menu display
 */
function showLoading() {
  document.getElementById('menuDisplay').innerHTML = 
    '<div class="loading-message">Loading menu...</div>';
}

/**
 * Shows error screen when username fetch fails
 */
function showUsernameFetchError() {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="auth-required">
      <div class="auth-icon">⚠️</div>
      <div class="auth-title">Connection Error</div>
      <div class="auth-message">
        We couldn't load your profile information. This might be a temporary issue.
      </div>
      <button id="refresh-btn" class="auth-button">
        Refresh Page
      </button>
      <div class="auth-note">
        If the problem persists, try logging out and back into Twitch
      </div>
    </div>
  `;

  document.getElementById('refresh-btn').addEventListener('click', () => {
    window.location.reload();
  });
}
