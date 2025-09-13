// /pages/api/get-tag.js

import { Redis } from '@upstash/redis';

// Upstash Redis client
const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// Only allow tags starting with MOJ-
const isValidMojoTag = (tag) => /^MOJ-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(tag);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { tag } = req.query;

  if (!tag || typeof tag !== 'string' || !isValidMojoTag(tag)) {
    return res.status(400).json({ success: false, message: 'Invalid tag format.' });
  }

  try {
    const email = await kv.get(tag);

    if (!email) {
      return res.status(404).json({ success: false, message: 'Tag not registered.' });
    }

    return res.status(200).json({ success: true, email });
  } catch (err) {
    console.error('[Upstash Error]', err);
    return res.status(500).json({ success: false, message: 'Internal error.' });
  }
}
