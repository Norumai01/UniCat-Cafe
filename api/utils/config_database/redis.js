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

  if (!response.ok) {
    console.error("HTTP error reading from Redis:", response.status);
    return null;
  }

  const data = await response.json();
  // console.log("Response", response) Debugging
  // console.log("Data", data)

  if (!data) {
    console.error("Something went wrong with fetching from Redis.")
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
  if (!response.ok) {
    console.error("HTTP error writing to Redis:", response.status);
    return false;
  }

  const data = await response.json();
  return data.result === 'OK'
}