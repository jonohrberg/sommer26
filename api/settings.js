const KEY = 'sommer26_settings';

async function redis(command) {
  const res = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', KEY]);
      return res.status(200).json(raw ? JSON.parse(raw) : null);
    }

    if (req.method === 'POST') {
      const { name, start, end } = req.body;
      if (!name || !start || !end) return res.status(400).json({ error: 'Mangler felt' });
      await redis(['SET', KEY, JSON.stringify({ name, start, end })]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Metode ikke tillatt' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
