import handleCORS from "./utils/cors.js";
import { getValidToken, forceRefreshToken } from "./utils/oauth.js";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
  if (handleCORS(req, res)) return;

  try {
    const CLIENT_ID = process.env.CLIENT_ID;
    const BOT_ID = process.env.BOT_ID;
    const STREAMER_ID = process.env.STREAMER_CHANNEL_ID;

    if (!CLIENT_ID || !BOT_ID || !STREAMER_ID) {
      return res.status(500).json({
        error: "Server configuration error.",
        details: "Missing required environment variables."
      });
    }

    const { item, username } = req.body;
    if (!item || !username) {
      return res.status(400).json({
        error: "Missing required parameters.",
        details: "Item and Username are required."
      });
    }

    // Get valid token (uses cached token if available)
    let botToken;
    try {
      botToken = await getValidToken();
    } catch (tokenError) {
      console.error('Failed to get valid token:', tokenError);
      return res.status(500).json({
        error: 'OAuth token error',
        details: tokenError.message
      });
    }

    const message = `☕ @${username} just ordered ${item}!`;
    console.log('📤 Sending message:', message);

    // First attempt with cached token
    let response;
    try {
      response = await fetch(`https://api.twitch.tv/helix/chat/messages`, {
        method: "POST",
        headers: {
          "Client-ID": CLIENT_ID,
          'Authorization': `Bearer ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "broadcaster_id": STREAMER_ID,
          "sender_id": BOT_ID,
          "message": message
        })
      });
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({
        error: 'Failed to connect to Twitch API',
        details: fetchError.message
      });
    }

    // Success!
    if (response.ok) {
      // IMPORTANT: Always consume the response body
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        await response.json();  // Consume JSON response
      } else {
        await response.text();  // Consume text/empty response
      }

      console.log('✅ Message sent successfully');
      return res.status(200).json({
        success: true,
        message: 'Order sent to chat!',
        retriedAfterRefresh: false,
      });
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      await response.text();  // Consume error response
      console.log('🔄 Token expired, refreshing and retrying...');

      try {
        const newToken = await forceRefreshToken();

        const retryResponse = await fetch(`https://api.twitch.tv/helix/chat/messages`, {
          method: "POST",
          headers: {
            "Client-ID": CLIENT_ID,
            'Authorization': `Bearer ${newToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "broadcaster_id": STREAMER_ID,
            "sender_id": BOT_ID,
            "message": message
          })
        });

        if (retryResponse.ok) {
          // Consume response
          const contentType = retryResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            await retryResponse.json();
          } else {
            await retryResponse.text();
          }

          console.log('✅ Message sent (after refresh)');
          return res.status(200).json({
            success: true,
            message: 'Order sent to chat!',
            retriedAfterRefresh: true,
          });
        }

        // Retry failed
        await retryResponse.text();
        return res.status(retryResponse.status).json({
          error: 'Failed to send message after token refresh',
          status: retryResponse.status
        });

      } catch (retryError) {
        console.error('Token refresh failed:', retryError);
        return res.status(500).json({
          error: 'Failed to refresh token and retry',
          details: retryError.message
        });
      }
    }

    // Other error
    await response.text();  // Consume response
    return res.status(response.status).json({
      error: 'Failed to send message to Twitch chat.',
      status: response.status
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error.",
      details: error.message || error.toString()
    });
  }
}