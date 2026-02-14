/**
 * Tab Navigation Utility
 * Handles switching between Menu Items and Chat Messages tabs
 */

console.log('📑 Tabs utility loaded');

// Initialize tabs when DOM is ready
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

/**
 * Switch to a specific tab
 * @param {string} tabId - ID of the tab to show
 */
function switchTab(tabId) {
  // Hide all tab contents
  const allTabs = document.querySelectorAll('.tab-content');
  allTabs.forEach(tab => {
    tab.classList.remove('active');
  });

  // Remove active class from all buttons
  const allButtons = document.querySelectorAll('.tab-button');
  allButtons.forEach(button => {
    button.classList.remove('active');
  });

  // Show selected tab
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Activate corresponding button
  const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  }
}

// Auto-initialize when script loads
// This will run after DOM is ready since script is at bottom of HTML
initializeTabs();
