import handleCORS from "./utils/cors.js";
import { getValidToken, forceRefreshToken } from "./utils/oauth.js";
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

    const { channelId, userId, opaqueUserId, role, isUnlinked } = extractChannelInfo(jwtPayload);

    console.log('🔐 Authenticated request:');
    console.log('  Channel ID:', channelId);
    console.log('  User ID:', userId || opaqueUserId);
    console.log('  Role:', role);

    /*
    ===================================================
    2. CHECK RATE LIMITS (TO BE IMPLEMENTED)
    ===================================================
    */

    /*
    ===================================================
    3. GET BOT CREDENTIAL
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
    4. VALIDATE REQUEST BODY
    ===================================================
    */
    const { item, username } = req.body;
    if (!item || !username) {
      return res.status(400).json({
        error: "Missing required parameters.",
        details: "Item and Username are required."
      });
    }

    /*
    ===================================================
    5. CONSTRUCT MESSAGE FOR TWITCH CHAT
    ===================================================
    */
    const message = `☕ @${username} just ordered ${item}!`;
    console.log('📤 Sending message:', message);
    console.log('   To channel:', channelId);

    const response = await fetch(`https://api.twitch.tv/helix/chat/messages`, {
      method: 'POST',
      headers: {
        "Client-ID": CLIENT_ID,
        "Content-Type": "application/json",
        "Authorization": `Bearer ${botToken}`
      },
      body: JSON.stringify({
        "broadcaster_id": channelId,
        "sender_id": BOT_ID,
        "message": message
      })
    });

    /*
    ===================================================
    6. SEND MESSAGE AND HANDLE API
    ===================================================
    */

    const contentType = response.headers.get("content-type");
    let responseData;

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    }
    else {
      responseData = await response.text();
    }

    if (!response.ok) {
      console.error('Twitch API error:', response.status, responseData);

      // Handle retries when encounter error 401
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        try {
          botToken = await forceRefreshToken();

          // Retry the request with new token.
          const retryResponse = await fetch('https://api.twitch.tv/helix/chat/messages', {
            method: 'POST',
            headers: {
              'Client-ID': CLIENT_ID,
              'Authorization': `Bearer ${botToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              broadcaster_id: channelId,
              sender_id: BOT_ID,
              message: message
            })
          });

          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            console.error('Retry failed:', retryResponse.status, retryData);
            return res.status(500).json({
              error: 'Failed to send message to chat',
              details: retryData
            });
          }

          console.log("Message sent successfully (after retry)");
          return res.status(200).json({
            success: true,
            message: 'Order sent to chat!',
            data: retryData
          });
        }
        catch (retryError) {
          console.error('Retry failed:', retryError);
          return res.status(500).json({
            error: 'Failed to send message to chat',
            details: retryError.message
          })
        }
      }

      // Other errors
      return res.status(500).json({
        error: 'Failed to send message to chat',
        details: responseData,
        status: response.status
      });
    }

    console.log('✅ Message sent successfully');
    return res.status(200).json({
      success: true,
      message: 'Order sent to chat!',
      data: responseData
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