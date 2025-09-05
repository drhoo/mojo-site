// File: /api/get-tag.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { tag } = req.query;

  if (!tag || !/^MJO-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(tag)) {
    return res.status(400).json({ success: false, message: 'Invalid tag format.' });
  }

  const { data, error } = await supabase
    .from('mojo_tags')
    .select('tag, workerName')
    .eq('tag', tag)
    .single();

  if (error || !data) {
    return res.status(404).json({ success: false, message: 'Tag not found.' });
  }

  return res.status(200).json({ success: true, ...data });
}
