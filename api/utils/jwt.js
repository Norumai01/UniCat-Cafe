/**
 * Twitch Extension JWT Verification
 *
 * Verify that requests comes from Twitch extension legitimately
 *
 * Extension JWTs are signed through Extension Secret (base64-encoded)
 *
 * Docs: https://dev.twitch.tv/docs/extensions/building/#verifying-a-jwt-token
 * Tutorial: https://dev.twitch.tv/docs/tutorials/extension-101-tutorial-series/jwt/
 */

import jwt from 'jsonwebtoken'

/**
 * Verify a Twitch Extension JWT token
 *
 * Extension JWTs are signed by Twitch using your Extension Secret.
 * The secret is base64-encoded and must be decoded before verification.
 *
 * @param {string} token - The JWT token from the extension (via onAuthorized callback)
 * @returns {object} The decoded JWT payload with channel_id, user_id, role, etc.
 * @throws {Error} If token is invalid or expired
 */
export async function verifyJWT(token) {
  const EXTENSION_SECRET = process.env.EXTENSION_SECRET;

  if (!EXTENSION_SECRET) {
    throw new Error('EXTENSION_SECRET not configured');
  }

  try {
    // Secret must be decoded from base64 encoder
    const secret = Buffer.from(EXTENSION_SECRET, 'base64');

    // Twitch uses HS256 algorithm for extension JWTs
    const verified = jwt.verify(token, secret, {
      algorithms: ['HS256']
    });

    if (!verified.exp || Date.now() >= verified.exp * 1000) {
      throw new Error('Token expired');
    }

    return verified;
  }
  catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('JWT token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid JWT signature - check your EXTENSION_SECRET');
    }
    throw error;
  }
}

/**
 * Extract channel and user information from JWT payload
 *
 * @param {object} payload - The decoded JWT payload
 * @returns {object} Channel and user info
 */
export function extractChannelInfo(payload) {
  return {
    channelId: payload.channel_id,
    userId: payload.user_id || payload.opaque_user_id,
    role: payload.role, // 'broadcaster', 'moderator', or 'viewer'
    opaqueUserId: payload.opaque_user_id,
    isUnlinked: !payload.user_id // If user_id is missing, user hasn't shared identity
  };
}

/**
 * Create a signed JWT for making Extension API requests
 *
 * This is used when YOUR backend needs to call Twitch Extension APIs
 * (different from verifyJWT which verifies tokens FROM Twitch)
 *
 * @param {string} channelId - Broadcaster's channel ID
 * @returns {string} Signed JWT token
 */
export function createExtensionJWT(channelId) {
  const EXTENSION_SECRET = process.env.EXTENSION_SECRET;

  if (!EXTENSION_SECRET) {
    throw new Error('EXTENSION_SECRET not configured');
  }

  // Secret must be decoded from base64
  const secret = Buffer.from(EXTENSION_SECRET, 'base64');

  const payload = {
    exp: Math.floor(Date.now() / 1000) + 60, // Expires in 60 seconds
    user_id: channelId, // Broadcaster's user ID
    role: 'external' // Required for Extension Configuration API
  };

  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}


/**
 * Check if user is broadcaster or moderator
 */
export function isPrivileged(payload) {
  return payload.role === 'broadcaster' || payload.role === 'moderator';
}

