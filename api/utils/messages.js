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

const DEFAULT_FAIL_MESSAGES = {
  'Food': 'Oh no! @{username} dropped the {item} on the floor!',
  'Drink': '@{username}\'s {item} spilled everywhere! Better luck next time!',
  'Sub Combo': 'The kitchen ran out of ingredients for {item}! Sorry @{username}!'
};

/**
 * Fetches broadcaster's custom category messages from Twitch Configuration Service
 * @param {string} channelId - Broadcaster's channel ID
 * @returns {Promise<Object>} Category messages object or default messages
 */
export async function getCategoryMessages(channelId) {
  try {
    // console.log('=== Fetching Config ===');
    // console.log('Extension ID:', process.env.EXTENSION_ID);
    // console.log('Channel ID:', channelId);

    // Create signed JWT for extension API (uses EXTENSION_SECRET)
    const extensionJwt = createExtensionJWT();
    // console.log('Created Extension JWT (first 20 chars):', extensionJwt.substring(0, 20) + '...');

    const url = `https://api.twitch.tv/helix/extensions/configurations?extension_id=${process.env.EXTENSION_ID}&segment=broadcaster&broadcaster_id=${channelId}`;
    // console.log('Fetching from:', url);

    const configResponse = await fetch(url, {
      headers: {
        'Client-ID': process.env.EXTENSION_ID,
        'Authorization': `Bearer ${extensionJwt}`
      }
    });

    // console.log('Response status:', configResponse.status);
    // console.log('Response ok?:', configResponse.ok);

    if (!configResponse.ok) {
      // const errorText = await configResponse.text();
      // console.error('Config fetch failed:', errorText);
      console.warn('Config fetch failed, using default messages');
      return {
        success: DEFAULT_MESSAGES,
        failure: DEFAULT_FAIL_MESSAGES,
      }
    }

    const configData = await configResponse.json();
    // console.log('Config data received:', JSON.stringify(configData, null, 2));

    if (configData.data && configData.data.length > 0) {
      // console.log('Config content:', configData.data[0].content);

      const config = JSON.parse(configData.data[0].content);
      console.log('Parsed config:', JSON.stringify(config, null, 2));

      if (config.categoryMessages && config.failMessages) {
        console.log('✅ Using custom category messages from config');
        console.log('Custom messages:', JSON.stringify(config.categoryMessages, null, 2));
        return {
          success: config.categoryMessages || DEFAULT_MESSAGES,
          failure: config.failMessages || DEFAULT_FAIL_MESSAGES,
        };
      }
    }

    console.log('⚠️ No categoryMessages found in config');
    console.log('Using default messages (no custom config found)');
    return {
      success: DEFAULT_MESSAGES,
      failure: DEFAULT_FAIL_MESSAGES,
    };
  }
  catch (error) {
    console.error('❌ Error fetching config:', error);
    console.error('Error stack:', error.stack);
    console.warn('Using default messages');
    return {
      success: DEFAULT_MESSAGES,
      failure: DEFAULT_FAIL_MESSAGES,
    };
  }
}

/**
 * Formats a success message
 * @param {Object} successMessages - Success message templates
 * @param {string} category - Category name
 * @param {string} username - Viewer's username
 * @param {string} item - Item name
 * @returns {string} Formatted success message
 */
export function formatSuccessMessage(successMessages, category, username, item) {
  // Get template from twitch category message. Fallback to default category if failed.
  const template = successMessages[category] || DEFAULT_MESSAGES[category];

  return template
    .replace(/{username}/g, username)
    .replace(/{item}/g, item);
}

/**
 * Determines if order should fail (8% chance)
 * @returns {boolean} True if order fails
 */
export function shouldFail() {
  return Math.random() >= 0.92;
}

/**
 * Formats a fail message
 * @param {Object} failMessages - Fail message templates
 * @param {string} category - Category name
 * @param {string} username - Viewer's username
 * @param {string} item - Item name
 * @returns {string} Formatted fail message
 */
export function formatFailMessage(failMessages, category, username, item) {
  const template = failMessages[category] || DEFAULT_FAIL_MESSAGES[category];

  return template
    .replace(/{username}/g, username)
    .replace(/{item}/g, item);
}
