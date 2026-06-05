import dotenv from "dotenv";
import handleCORS from "./utils/cors.js";
import {get, set} from "./utils/config_database/redis.js";
import {extractChannelInfo, verifyJWT} from "./utils/jwt.js";

dotenv.config();

export default async function handler(req, res) {
  if (handleCORS(req, res)) return;

  const method = req.method;

  switch (method) {
    case 'GET':
      // GET: Load config from channel, retrieve data from Redis
      console.log("GET request received");
      return await getChannelConfig(req, res);
    case 'POST':
      // POST: Save config to channel, store data in Redis
      console.log("POST request received");
      return await saveChannelConfig(req, res);
    default:
      // Other methods are not allowed
      console.error(`Method ${method} not allowed`);
      return res.status(405).json({error: "Method not allowed"});
  }
}

async function getChannelConfig(req, res) {
  const { channelId } = req.query;

  if (!channelId) {
    console.error("Missing channel ID");
    return res.status(400).json({error: "Missing channel ID"});
  }

  const config = await get(`config:${channelId}`);
  if (!config) {
    console.error("Config not found");
    return res.status(404).json({error: "Config not found"});
  }

  console.log("Data retrieved successfully.")
  return res.status(200).json(config);
}

async function saveChannelConfig(req, res) {
  // Verify JWT so only the broadcaster can save
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    console.error("Missing parameters");
    return res.status(401).json({error: "Unauthorized: Missing token"});
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  let jwtPayload;

  try {
    jwtPayload = await verifyJWT(token);
  }
  catch (error) {
    console.error('Verification failed:', error);
    return res.status(401).json({error: "Unauthorized: Invalid token"});
  }

  const { channelId, role } = extractChannelInfo(jwtPayload);
  if (role !== 'broadcaster') {
    console.error("Forbidden Access");
    return res.status(403).json({error: "Forbidden Access"});
  }

  const configData = req.body;
  if (!configData || !configData.menuItems || !configData.categories) {
    console.error("Invalid request data");
    return res.status(400).json({error: "Invalid request data"});
  }

  const ok = await set(`config:${channelId}`, configData)
  if (!ok) {
    console.error("Failed to save config");
    return res.status(500).json({error: "Failed to save config"});
  }

  console.log("Config saved successfully.");
  return res.status(200).json({ success: true });
}


