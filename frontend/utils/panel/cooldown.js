//console.log('⏰ Cooldown utility loaded');

const COOLDOWN_DURATION = 60 * 1000; // 1 minute in milliseconds

/**
 * Safe localStorage wrapper to handle environments where
 * localStorage may be unavailable or restricted (e.g. mobile WebViews).
 * Falls back gracefully so the panel still loads without crashing.
 */
const safeStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    }
    catch (e) {
      console.warn('⚠️ localStorage.getItem unavailable:', e);
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    }
    catch (e) {
      console.warn('⚠️ localStorage.setItem unavailable:', e);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    }
    catch (e) {
      console.warn('⚠️ localStorage.removeItem unavailable:', e);
    }
  }
};

/**
 * Gets the cooldown key for localStorage
 * @param {string} channelId - Twitch channel ID
 * @returns {string} Cooldown key
 */
function getCooldownKey(channelId) {
  return `cat_cafe_cooldown_${channelId}`;
}

/**
 * Checks if user is currently on cooldown
 * @param {string} channelId - Twitch channel ID
 * @returns {number} Remaining cooldown time in ms, or 0 if not on cooldown
 */
function getRemainingCooldown(channelId) {
  const cooldownKey = getCooldownKey(channelId);
  const lastOrderTime = safeStorage.get(cooldownKey);

  if (!lastOrderTime) {
    return 0;
  }

  const elapsedTime = Date.now() - parseInt(lastOrderTime);
  const remainingTime = COOLDOWN_DURATION - elapsedTime;

  return remainingTime > 0 ? remainingTime : 0;
}

/**
 * Sets cooldown for current channel
 * @param {string} channelId - Twitch channel ID
 */
function setCooldown(channelId) {
  const cooldownKey = getCooldownKey(channelId);
  safeStorage.set(cooldownKey, Date.now().toString());
}

/**
 * Clears cooldown for current channel
 * @param {string} channelId - Twitch channel ID
 */
function clearCooldown(channelId) {
  const cooldownKey = getCooldownKey(channelId);
  safeStorage.remove(cooldownKey);
}

/**
 * Formats remaining time into human-readable string
 * @param {number} remainingTime - Time in milliseconds
 * @returns {string} Formatted time string (e.g., "1m 30s")
 */
function formatCooldownTime(remainingTime) {
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
