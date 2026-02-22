//console.log('🔐 Auth utility loaded');

/**
 * Fetches the viewer's display name from Twitch API
 * @param {Object} auth - Twitch auth object from onAuthorized
 * @returns {Promise<string>} Display name or 'Viewer' as fallback
 */
async function fetchViewerName(auth) {
  try {
    const endpointUrl = "https://api.twitch.tv/helix/users";
    const url = `${endpointUrl}?id=${window.Twitch.ext.viewer.id}`;

    const response = await fetch(url, {
      headers: {
        "Client-ID": auth.clientId,
        "Authorization": `Extension ${auth.helixToken}`
      }
    });

    if (!response.ok) {
      //console.warn('⚠️ Could not fetch username, returning...');
      return 'Viewer';
    }

    const body = await response.json();
    const displayName = body.data.at(0)?.display_name;

    if (displayName) {
      //console.log("Viewer name fetched successfully!");
      return displayName;
    }
    else {
      //console.warn('⚠️ No display name found');
      return 'Viewer';
    }
  }
  catch (error) {
    console.error('❌ Error fetching viewer name:', error);
    return 'Viewer';
  }
}

/**
 * Requests user to share their Twitch identity
 */
function requestIdentityShare() {
  //console.log('Requesting identity share...');
  window.Twitch.ext.actions.requestIdShare();
}
