// /pages/api/submit-message.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tag_id, sender_name, message } = req.body;

  // Validate tag format: MJO-XXX-XXX with 34 safe chars
  const validTag = /^MJO-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(tag_id);
  if (!validTag) {
    return res.status(400).json({ error: 'Invalid tag format.' });
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const { error } = await supabase.from('messages').insert({
    tag_id,
    sender_name: sender_name || null,
    message,
  });

  if (error) {
    console.error('[Supabase Insert Error]', error);
    return res.status(500).json({ error: 'Failed to save message.' });
  }

  res.status(200).json({ success: true, message: 'Message saved!' });
}
