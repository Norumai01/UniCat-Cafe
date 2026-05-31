import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.KV_REST_API_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN

/*
* Get a value from Redis
*/
export async function get(key) {
  const response = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`
    }
  });

  const data = await response.json();

  if (data.result === null) {
    console.log("Something went wrong with fetching to Redis.")
    return null
  }

  // Deserialize JSON
  return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
}

/*
* Set a value in Redis
*/
export async function set(key, value) {
  const response = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${REDIS_TOKEN}`
    },
    body: JSON.stringify(JSON.stringify(value)) // Double stringify so upstash stores it as a string
  })

  const data = await response.json();
  if (!data.ok) {
    console.log("Something went wrong with setting to Redis.")
    return false
  }

  return data.result === 'OK'
}