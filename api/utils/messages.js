/**
 * Message Template Utility
 * Handles fetching and formatting category-based chat messages
 */
import {createExtensionJWT} from "./jwt.js";

const DEFAULT_MESSAGES = {
  'cat_1': '@{username} has ordered {item}. Enjoy your meal!',
  'cat_2': '@{username} has ordered {item}. Stay hydrated!',
  'cat_3': '@{username} ordered the special {item}!'
};

const DEFAULT_FAIL_MESSAGES = {
  'cat_1': 'Oh no! @{username} dropped the {item} on the floor!',
  'cat_2': '@{username}\'s {item} spilled everywhere! Better luck next time!',
  'cat_3': 'The kitchen ran out of ingredients for {item}! Sorry @{username}!'
};

// Generic fallback used when a custom category ID has no matching default
const GENERIC_SUCCESS = '@{username} ordered {item}!';
const GENERIC_FAIL    = 'Oh no! Something went wrong with @{username}\'s {item}!';

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
      // console.log('Parsed config:', JSON.stringify(config, null, 2));

      if (config.categoryMessages || config.failMessages) {
        // ── Migrate legacy configs (label-keyed → ID-keyed) ───────────────────
        // Old configs used label strings ('Food', 'Drink', 'Sub Combo') as keys.
        // If we find those, remap them to IDs transparently.
        const legacyLabelToId = { 'Food': 'cat_1', 'Drink': 'cat_2', 'Sub Combo': 'cat_3' };

        const remapIfLegacy = (messages) => {
          if (!messages) return null;
          const remapped = {};
          Object.entries(messages).forEach(([key, val]) => {
            const mappedKey = legacyLabelToId[key] || key;
            remapped[mappedKey] = val;
          });
          return remapped;
        };

        const successMessages = remapIfLegacy(config.categoryMessages) || DEFAULT_MESSAGES;
        const failureMessages = remapIfLegacy(config.failMessages) || DEFAULT_FAIL_MESSAGES;

        console.log('✅ Using custom category messages from config');
        return { success: successMessages, failure: failureMessages };
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
  const template = successMessages[category] || DEFAULT_MESSAGES[category] || GENERIC_SUCCESS;

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
  const template = failMessages[category] || DEFAULT_FAIL_MESSAGES[category] || GENERIC_FAIL;

  return template
    .replace(/{username}/g, username)
    .replace(/{item}/g, item);
}
