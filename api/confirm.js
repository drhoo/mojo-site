import { db } from '@/lib/db';  // Your Upstash or Supabase DB module
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.redirect('/invalid.html');
  }

  try {
    // Fetch token record
    const record = await db.get(`token:${token}`);
    if (!record) {
      return res.redirect('/invalid.html');
    }

    const { tag, email } = JSON.parse(record);

    // Update tag with owner info
    const tagRecord = await db.get(tag);
    if (!tagRecord) {
      return res.redirect('/invalid.html');
    }

    const updatedTag = {
      ...tagRecord,
      owner: email,
      registeredAt: Date.now()
    };

    await db.set(tag, updatedTag);

    // Delete token for one-time use
    await db.del(`token:${token}`);

    return res.redirect('/confirm.html');
  } catch (err) {
    console.error('Error confirming registration:', err);
    return res.redirect('/invalid.html');
  }
}
