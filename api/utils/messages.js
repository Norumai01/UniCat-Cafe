/**
 * Message Template Utility
 * Handles fetching and formatting category-based chat messages
 */
import {createExtensionJWT} from "./jwt.js";

const DEFAULT_MESSAGES = {
  'Food': '@{username} has ordered {item}. Enjoy your meal!',
  'Drink': '@{username} has ordered {item}. Stay hydrated!',
  'Sub Combo': '@{username} ordered the special {item}!'
};

/**
 * Fetches broadcaster's custom category messages from Twitch Configuration Service
 * @param {string} clientId - Twitch Client ID
 * @param {string} channelId - Broadcaster's channel ID
 * @returns {Promise<Object>} Category messages object or default messages
 */
export async function getCategoryMessages(clientId, channelId) {
  try {
    console.log('=== Fetching Config ===');
    console.log('Extension ID:', process.env.EXTENSION_ID);
    console.log('Channel ID:', channelId);
    console.log('Client ID:', clientId);

    // Create signed JWT for extension API (uses EXTENSION_SECRET)
    const extensionJwt = createExtensionJWT(channelId);
    console.log('Created Extension JWT (first 20 chars):', extensionJwt.substring(0, 20) + '...');

    const url = `https://api.twitch.tv/helix/extensions/configurations?extension_id=${process.env.EXTENSION_ID}&segment=broadcaster&broadcaster_id=${channelId}`;
    console.log('Fetching from:', url);

    const configResponse = await fetch(url, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${extensionJwt}`
      }
    });

    console.log('Response status:', configResponse.status);
    console.log('Response ok?:', configResponse.ok);

    if (!configResponse.ok) {
      const errorText = await configResponse.text();
      console.error('Config fetch failed:', errorText);
      console.warn('Using default messages');
      return DEFAULT_MESSAGES;
    }

    const configData = await configResponse.json();
    console.log('Config data received:', JSON.stringify(configData, null, 2));

    if (configData.data && configData.data.length > 0) {
      console.log('Config content:', configData.data[0].content);

      const config = JSON.parse(configData.data[0].content);
      console.log('Parsed config:', JSON.stringify(config, null, 2));

      if (config.categoryMessages) {
        console.log('✅ Using custom category messages from config');
        console.log('Custom messages:', JSON.stringify(config.categoryMessages, null, 2));
        return config.categoryMessages;
      } else {
        console.log('⚠️ No categoryMessages found in config');
      }
    } else {
      console.log('⚠️ No config data returned');
    }

    console.log('Using default messages (no custom config found)');
    return DEFAULT_MESSAGES;
  }
  catch (error) {
    console.error('❌ Error fetching config:', error);
    console.error('Error stack:', error.stack);
    console.warn('Using default messages');
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
