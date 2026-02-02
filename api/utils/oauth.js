/**
 * OAuth Token Management Utility:
 * - Reactively responds to 401 errors (not proactive expiry checks)
 * - Safely stores new refresh tokens when Twitch sends them
 * - Handles refresh token invalidation gracefully
 */

let cachedAccessToken = null;
let cachedRefreshToken = null;
let tokenExpiry = null;

/**
 * Refresh the OAuth token using the refresh token
 */
export async function refreshAccessToken() {
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;

  // Use cached refresh token if available, otherwise load from .env. Typically, for cold start.
  if (!cachedRefreshToken) {
    cachedRefreshToken = process.env.BOT_REFRESH_TOKEN;
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !cachedRefreshToken) {
    throw new Error('Missing OAuth credentials');
  }

  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: cachedRefreshToken
      })
    });

    if (!response.ok) {
      const errorData = await response.text();

      // If refresh token is invalid, clear cache and throw
      if (response.status === 400 || response.status === 401) {
        cachedRefreshToken = null;
        throw new Error('Refresh token invalid - user may need to re-authorize');
      }

      throw new Error(`Token refresh failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    // Cache the new access token
    cachedAccessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 5 min safety margin

    // IMPORTANT: Twitch may send a new refresh token - we MUST cache it
    // "Because refresh tokens may change, your app should safely store the new refresh token"
    if (data.refresh_token) {
      if (data.refresh_token !== cachedRefreshToken) {
        console.log('⚠️  New refresh token received from Twitch');
        console.log('   Update .env with: BOT_REFRESH_TOKEN=' + data.refresh_token);
      }
      cachedRefreshToken = data.refresh_token;
    }

    console.log('✓ Token refreshed');

    // Verify scopes
    const requiredScopes = ['user:write:chat'];
    const hasRequiredScopes = requiredScopes.every(scope =>
      Array.isArray(data.scope)
        ? data.scope.includes(scope)
        : data.scope.split(' ').includes(scope)
    );

    if (!hasRequiredScopes) {
      throw new Error('Token missing required scopes: ' + requiredScopes.join(', '));
    }

    return {
      accessToken: cachedAccessToken,
      refreshToken: cachedRefreshToken,
      expiresIn: data.expires_in,
      scopes: Array.isArray(data.scope) ? data.scope : data.scope.split(' ')
    };
  }
  catch (error) {
    console.error('Token refresh error:', error.message);
    throw error;
  }
}

/**
 * Validate token (used only for oauth-setup.js testing)
 */
export async function validateToken(token) {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: {
        'Authorization': `OAuth ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Token valid');
      console.log('  User:', data.login);
      console.log('  Scopes:', data.scopes.join(', '));
      console.log('  Expires in:', Math.floor(data.expires_in / 86400), 'days');

      const requiredScopes = ['user:write:chat'];
      const hasRequiredScopes = requiredScopes.every(scope => data.scopes.includes(scope));

      if (!hasRequiredScopes) {
        console.warn('⚠️  Missing required scopes:', requiredScopes.join(', '));
      }

      return data;
    }

    return false;
  }
  catch (error) {
    console.error('Token validation error:', error.message);
    return false;
  }
}

/**
 * Get a valid access token using refresh token.
 */
export async function getValidToken() {
  // Use cached access token if available
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  console.log('No cached token, refreshing token...')
  const result = await refreshAccessToken();
  return result.accessToken;
}

/**
 * Force a token refresh (called when API returns 401)
 * This is the Twitch-recommended approach: react to 401s, don't predict expiry
 */
export async function forceRefreshToken() {
  console.log('Token invalid (401), refreshing...');
  const result = await refreshAccessToken();
  return result.accessToken;
}

/**
 * Clear cached tokens (useful for testing)
 */
export function clearTokenCache() {
  cachedAccessToken = null;
  cachedRefreshToken = null;
  tokenExpiry = null;
  console.log('Token cache cleared');
}