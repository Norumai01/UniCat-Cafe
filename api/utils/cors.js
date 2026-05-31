export default function handleCORS(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // CORS preflight check
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  // GET or POST requests only allowed
  if (!['GET', 'POST'].includes(req.method)) {
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return true;
  }

  return false;
}