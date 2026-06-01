/*
* Get a value from Redis
*/
export async function get(key, REDIS_URL, REDIS_TOKEN) {
  const response = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`
    }
  });

  if (!response.ok) {
    console.log("HTTP error reading from Redis:", response.status);
    return null;
  }

  const data = await response.json();

  if (data.result === null || data.result === undefined) {
    console.log("Something went wrong with fetching from Redis.")
    return null
  }

  // Deserialize JSON
  return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
}

/*
* Set a value in Redis
*/
export async function set(key, value, REDIS_URL, REDIS_TOKEN) {
  const response = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${REDIS_TOKEN}`
    },
    body: JSON.stringify(JSON.stringify(value)) // Double stringify so upstash stores it as a string
  })
  if (!response.ok) {
    console.log("HTTP error writing to Redis:", response.status);
    return false;
  }

  const data = await response.json();
  return data.result === 'OK'
}