import handleCORS from "./utils/cors.js";
import {forceRefreshToken, getValidToken} from "./utils/oauth.js";
import dotenv from "dotenv";
import {extractChannelInfo, verifyJWT} from "./utils/jwt.js";

dotenv.config();

export default async function handler(req, res) {
  if (handleCORS(req, res)) return;

  try {
    /*
    ===================================================
    1. Verify JWT Token (Get targeted Channel ID from Extension)
    ===================================================
    */
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Unauthorized",
        details: "Missing token"
      });
    }

    // Extract and verify JWT
    const token = authHeader.replace(/^Bearer\s+/i, '');
    let jwtPayload;

    try {
      jwtPayload = await verifyJWT(token);
    }
    catch (error) {
      console.error('JWT verification failed:', error);
      return res.status(401).json({
        error: "Unauthorized",
        details: "Invalid or expired token"
      });
    }

    const { channelId, userId, opaqueUserId, isUnlinked } = extractChannelInfo(jwtPayload);

    if (!userId || userId.startsWith('U') || userId.startsWith('A')) {
      return res.status(403).json({
        error: "Identity link required",
        details: "You must link your Twitch account to place orders"
      });
    }

    console.log('Authenticated request:');
    console.log('Channel ID:', channelId);
    console.log('User ID:', userId);
    console.log('Opaque ID:', opaqueUserId);
    console.log('Account linked?', !isUnlinked);

    /*
    ===================================================
    2. GET BOT CREDENTIAL
    ===================================================
    */
    const CLIENT_ID = process.env.CLIENT_ID;
    const BOT_ID = process.env.BOT_ID;

    if (!CLIENT_ID || !BOT_ID) {
      return res.status(500).json({
        error: "Server configuration error.",
        details: "Missing required environment variables."
      });
    }

    // Obtain token for API Requests
    let botToken;
    try {
      botToken = await getValidToken();
    }
    catch (tokenError) {
      console.error('Failed to get valid token:', tokenError);
      return res.status(500).json({
        error: 'OAuth token error',
        details: tokenError.message
      });
    }

    /*
    ===================================================
    3. VALIDATE REQUEST BODY
    ===================================================
    */
    const { item, username } = req.body;
    if (!item || !username) {
      return res.status(400).json({
        error: "Missing required parameters.",
        details: "Item and Username are required."
      });
    }
    // Basic validation to prevent abuse
    if (item.length > 100) {
      return res.status(400).json({
        error: "Invalid item name",
        details: "Item name too long"
      });
    }

    if (username.length > 30) {
      return res.status(400).json({
        error: "Invalid username",
        details: "Username too long"
      });
    }

    /*
    ===================================================
    4. SEND MESSAGE TO TWITCH CHAT (WITH AUTO-RETRY)
    ===================================================
    */
    const message = `@${username} has ordered ${item}. Please enjoy!`;
    console.log('Sending message:', message);
    console.log('To channel:', channelId);

    const result = await sendMessageWithRetry(CLIENT_ID, botToken, channelId, BOT_ID, message);

    console.log('Message sent successfully');
    return res.status(200).json({
      success: true,
      message: 'Order sent to chat!',
      data: result
    });
  }
  catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error.",
      details: error.message || error.toString()
    });
  }
}

/*
 * Send chat message with automatic retry on 401 errors.
 * Throws on failure so the main handler's catch block handles it.
 */
async function sendMessageWithRetry(clientId, botToken, channelId, botId, message) {
  // First attempt
  let response = await sendChatMessage(clientId, botToken, channelId, botId, message);
  let data = await parseResponse(response);

  if (response.ok) {
    return data;
  }

  // Handle 401 with token refresh and retry
  if (response.status === 401) {
    console.log('Token expired, attempting refresh...');
    const newToken = await forceRefreshToken();

    // Retry with refreshed token
    response = await sendChatMessage(clientId, newToken, channelId, botId, message);
    data = await parseResponse(response);

    if (response.ok) {
      console.log('Message sent successfully after token refresh');
      return data;
    }

    console.error('Retry failed:', response.status, data);
    throw new Error(`Failed to send message after retry: ${response.status}`);
  }

  // Other errors
  console.error('Twitch API error:', response.status, data);
  throw new Error(`Twitch API error: ${response.status}`);
}

/*
 * Parse response handling both JSON and text content types.
 */
async function parseResponse(response) {
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
}

/*
 * Request to Twitch API Endpoint for bot to send chat messages.
 */
async function sendChatMessage(clientId, botToken, channelId, botId, message){
  return await fetch(`https://api.twitch.tv/helix/chat/messages`, {
    method: 'POST',
    headers: {
      "Client-ID": clientId,
      "Content-Type": "application/json",
      "Authorization": `Bearer ${botToken}`
    },
    body: JSON.stringify({
      "broadcaster_id": channelId,
      "sender_id": botId,
      "message": message
    })
  });
}