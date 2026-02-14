/**
 * Message Template Utility
 * Handles fetching and formatting category-based chat messages
 */

const DEFAULT_MESSAGES = {
  'Food': '@{username} has ordered {item}. Enjoy your meal!',
  'Drink': '@{username} has ordered {item}. Stay hydrated!',
  'Sub Combo': '@{username} ordered the special {item}!'
};

/**
 * Fetches broadcaster's custom category messages from Twitch Configuration Service
 * @param {string} clientId - Twitch Client ID
 * @param {string} botToken - Bot access token
 * @param {string} channelId - Broadcaster's channel ID
 * @returns {Promise<Object>} Category messages object or default messages
 */
export async function getCategoryMessages(clientId, botToken, channelId) {
  try {
    const configResponse = await fetch(
      `https://api.twitch.tv/helix/extensions/configurations?extension_id=${process.env.EXTENSION_ID}&segment=broadcaster&broadcaster_id=${channelId}`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${botToken}`
        }
      }
    );

    if (!configResponse.ok) {
      console.warn('Config fetch failed, using defaults');
      return DEFAULT_MESSAGES;
    }

    const configData = await configResponse.json();

    if (configData.data && configData.data.length > 0) {
      const config = JSON.parse(configData.data[0].content);

      if (config.categoryMessages) {
        console.log('Using custom category messages from config');
        return config.categoryMessages;
      }
    }

    return DEFAULT_MESSAGES;
  }
  catch (error) {
    console.warn('Could not fetch config, using defaults:', error.message);
    return DEFAULT_MESSAGES;
  }
}

/**
 * Generates a formatted chat message from category template
 * @param {Object} categoryMessages - Messages object (from config or defaults)
 * @param {string} category - Category name (Food, Drink, Sub Combo)
 * @param {string} username - Viewer's username
 * @param {string} item - Item name
 * @returns {string} Formatted chat message
 */
export function formatMessage(categoryMessages, category, username, item) {
  // Get template for category, fallback to defaults if missing
  const template = categoryMessages[category] || DEFAULT_MESSAGES[category];

  // Replace placeholders
  return template
    .replace(/{username}/g, username)
    .replace(/{item}/g, item);
}
