# Serverless Test

## Setup
- Make sure you created twitch bot account.

### Use this to find Bot account ID:
```js
const getBotInfoId = async () => {
  const response = await fetch("https://api.twitch.tv/helix/users", {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${BOT_TOKEN}`,
      "Client-Id": `${CLIENT_ID}`,
      'Accept': 'application/json'
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to fetch bot ID: ${response.status} - ${data.message}`);
  }

  const botInfo = data.data[0];
  console.log("Bot Info - Username:", botInfo.login, "| ID:", botInfo.id);
  return botInfo.id;
}
```
Then use that ID in the environment variable.

## Running it
- Use `vercel dev` to test it locally.
- Easy to set and connect it to Vercel.

