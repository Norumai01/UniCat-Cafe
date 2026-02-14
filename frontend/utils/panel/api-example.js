console.log('🌐 API utility loaded');

// ⚙️ CONFIGURATION - UPDATE THIS WITH YOUR VERCEL URL
const BACKEND_URL = 'https://your-vercel-url.vercel.app';

/**
 * Sends an order request to the backend
 * @param {Object} auth - Twitch auth object
 * @param {string} itemName - Name of the item being ordered
 * @param {string} username - Display name of the viewer
 * @param {string} category - Category of the item (Food, Drink, Sub Combo).
 * @returns {Promise<Object>} Response object with success/error info
 */
async function sendOrder(auth, itemName, username, category) {
  try {
    console.log(`Placing order ${itemName} for ${username}...`);
    // console.log(`Making request to: ${BACKEND_URL}/api/order`)

    const response = await fetch(`${BACKEND_URL}/api/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        item: itemName,
        username: username,
        category: category
      })
    });

    const data = await response.json();
    // console.log('📥 Response:', response.status, data);

    if (response.ok) {
      console.log(`✅ Order placed successfully.`);
      return { success: true, data };
    }
    else if (response.status === 401) {
      return { 
        success: false, 
        error: `Authorization failed: ${data.details || data.error}` 
      };
    }
    else {
      return { 
        success: false, 
        error: data.error || 'Unknown error' 
      };
    }

  }
  catch (error) {
    console.error('💥 Order failed:', error);
    return { 
      success: false, 
      error: `Network error: ${error.message}` 
    };
  }
}

/**
 * Gets the configured backend URL
 * @returns {string} Backend URL
 */
function getBackendUrl() {
  return BACKEND_URL;
}
