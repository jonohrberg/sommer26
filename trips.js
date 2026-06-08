const KEY = 'sommer26_trips';

// Upstash Redis REST API – bruker env-variabler satt automatisk av Vercel
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

async function getTrips() {
  const raw = await redis(['GET', KEY]);
  return raw ? JSON.parse(raw) : {};
}

async function setTrips(data) {
  await redis(['SET', KEY, JSON.stringify(data)]);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET – hent alle reiser
    if (req.method === 'GET') {
      const data = await getTrips();
      return res.status(200).json(data);
    }

    // POST – legg til / oppdater én reise  { id, trip }
    if (req.method === 'POST') {
      const { id, trip } = req.body;
      if (!id || !trip) return res.status(400).json({ error: 'Mangler id eller trip' });
      const data = await getTrips();
      data[id] = trip;
      await setTrips(data);
      return res.status(200).json({ ok: true });
    }

    // DELETE – slett én reise  ?id=xxx
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Mangler id' });
      const data = await getTrips();
      delete data[id];
      await setTrips(data);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Metode ikke tillatt' });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
