# Update Logs

## Version 0.0.1

- Initial release
- Panel with categorized menu (Food, Drink, Sub Combo)
- Streamer configuration page for menu items and chat messages
- CafeCatBot chat integration with success/failure messages
- 1-minute viewer cooldown per order

## Version 0.1.0

- Added mobile view for Twitch mobile app, including a landscape mode
- Adjusted cooldown timer to work with mobile app 
- Added a loading transition before the order is placed, so users will know if they have placed order or not
- Reduced the size of image assets to reduce storage sizes that bypass Twitch Mobile CDN limits.
- Self-hosted the font to increase initial load-up time.
- Updated policy guidelines and manual.

## Version 0.2.0

- Custom category system — streamers can create, rename, and delete their own menu categories instead of being locked to Food, Drink, and Sub Combo
- Category manager UI in the config page with rename and delete support
- Dynamic color palette for category badges (cycles through 5 colors instead of hardcoded per-category colors)
- Data schema changed to from hardcoded categories to a dynamic IDs category system
- Backend API changed to use category IDs and also migrate existing data to the new schema.
- Cleaned up the code to be more readable and maintainable.

## Version 0.3.0

- Integrated Upstash with Redis for storing streamer's configuration data, due to Twitch configuration size limit.
- Added Config API route that interface with Upstash to store and retrieve streamer's configuration data.
- Updated the UI to use the new Config API route.
- Updated privacy policy and terms of service.