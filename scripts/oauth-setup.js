/**
 * OAuth Setup and Testing Script
 *
 * This script helps you:
 * 1. Generate the initial OAuth URL for authorization
 * 2. Exchange authorization code for tokens
 * 3. Test token refresh
 * 4. Validate tokens
 */

import dotenv from 'dotenv';
import { refreshAccessToken, validateToken, getValidToken } from '../api/utils/oauth.js';

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000';

// Required scopes for the bot
const SCOPES = [
  'user:write:chat',
  'user:bot',
  'channel:bot'
];

/**
 * Step 1: Generate OAuth Authorization URL
 */
function generateAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' ')
  });

  const url = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('STEP 1: GET AUTHORIZATION CODE');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('1. Visit this URL (while logged in as CafeCatBot):');
  console.log('\n' + url + '\n');
  console.log('2. Authorize the application');
  console.log('3. Copy the "code" parameter from the redirect URL');
  console.log('4. Run: node scripts/oauth-setup.js exchange YOUR_CODE_HERE');
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

/**
 * Step 2: Exchange authorization code for tokens
 */
async function exchangeCodeForToken(code) {
  if (!code) {
    console.error('❌ Error: No authorization code provided');
    console.log('Usage: node scripts/oauth-setup.js exchange YOUR_CODE_HERE');
    process.exit(1);
  }

  try {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('STEP 2: EXCHANGE CODE FOR TOKENS');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Exchanging authorization code for tokens...\n');

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${response.status} - ${error}`);
    }

    const data = await response.json();

    console.log('✓ Success! Tokens received.\n');
    console.log('Add these to your .env file:\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`BOT_TOKEN=${data.access_token}`);
    console.log(`BOT_REFRESH_TOKEN=${data.refresh_token}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`Access token expires in: ${data.expires_in} seconds (~${Math.floor(data.expires_in / 3600)} hours)`);
    console.log(`Scopes granted: ${data.scope.join(', ')}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Test token refresh - Returns the new tokens
 */
async function testRefresh() {
  try {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TESTING TOKEN REFRESH');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Call refresh which returns { accessToken, refreshToken }
    const result = await refreshAccessToken();

    console.log('\n✓ Token refresh successful!\n');
    console.log('Update your .env file with these new values:\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`BOT_TOKEN=${result.accessToken}`);
    if (result.refreshToken) {
      console.log(`BOT_REFRESH_TOKEN=${result.refreshToken}`);
    }
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test token validation
 */
async function testValidate() {
  try {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TESTING TOKEN VALIDATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    const token = await getValidToken();
    const isValid = await validateToken(token);

    if (isValid) {
      console.log('\n✓ Token is valid and ready to use!');
    } else {
      console.log('\n❌ Token validation failed');
    }

  } catch (error) {
    console.error('❌ Validation error:', error.message);
    process.exit(1);
  }
}

/**
 * Get bot user ID
 */
async function getBotId() {
  try {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('GETTING BOT USER ID');
    console.log('═══════════════════════════════════════════════════════════\n');

    const token = await getValidToken();

    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': CLIENT_ID
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    const data = await response.json();
    const user = data.data[0];

    console.log('✓ Bot information retrieved:\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Bot Username: ${user.login}`);
    console.log(`Bot Display Name: ${user.display_name}`);
    console.log(`Bot ID: ${user.id}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Add this to your .env file:\n');
    console.log(`BOT_ID=${user.id}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main command handler
const command = process.argv[2];
const arg = process.argv[3];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: CLIENT_ID and CLIENT_SECRET must be set in .env file');
  process.exit(1);
}

switch (command) {
  case 'url':
    generateAuthUrl();
    break;

  case 'exchange':
    exchangeCodeForToken(arg);
    break;

  case 'refresh':
    testRefresh();
    break;

  case 'validate':
    testValidate();
    break;

  case 'getid':
    getBotId();
    break;

  default:
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('CAT CAFE BOT - OAUTH SETUP');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Available commands:\n');
    console.log('  node scripts/oauth-setup.js url          - Generate OAuth URL');
    console.log('  node scripts/oauth-setup.js exchange CODE - Exchange code for tokens');
    console.log('  node scripts/oauth-setup.js refresh      - Test token refresh');
    console.log('  node scripts/oauth-setup.js validate     - Validate current token');
    console.log('  node scripts/oauth-setup.js getid        - Get bot user ID\n');
    console.log('═══════════════════════════════════════════════════════════\n');
}
