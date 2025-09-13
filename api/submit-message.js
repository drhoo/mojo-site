// /pages/api/submit-message.js

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { resend } from '../lib/resend.js';


// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Upstash KV (Redis) setup
const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// Helper: sanitize tag input
function sanitizeTagId(raw) {
  return raw.toUpperCase().replace(/0/g, 'O').replace(/1/g, 'I');
}

// Helper: validate MOJ-XXX-XXX
const isValidMojoTag = (tag) => /^MOJ-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(tag);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    tag_id: rawTagId,
    sender_name,
    message,
    location,
    sender_email
  } = req.body;

  // Input validation
  if (!rawTagId || typeof rawTagId !== 'string') {
    return res.status(400).json({ error: 'Tag ID is required.' });
  }

  const tag_id = sanitizeTagId(rawTagId);

  if (!isValidMojoTag(tag_id)) {
    return res.status(400).json({ error: 'Invalid tag format.' });
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Look up tag owner
    const owner_email = await kv.get(tag_id);
    if (!owner_email) {
      return res.status(404).json({ error: 'Tag not registered.' });
    }

    // Store message in Supabase
    const { error: dbError } = await supabase.from('mojo_messages').insert({
      tag_id,
      sender_name: sender_name || null,
      message: message.trim(),
      location: location || null,
      sender_email: sender_email || null,
      created: new Date().toISOString()
    });

    if (dbError) {
      console.error('[Supabase Insert Error]', dbError);
      return res.status(500).json({ error: 'Failed to save message.' });
    }

    // Send email to tag owner
    try {
      await resend.emails.send({
        from: 'Mojo <hello@mojo.spot>',
        to: owner_email,
        subject: `Someone just thanked you!`,
        html: `
          <p>Hi there,</p>
          <p>You just received a thank-you message via your Mojo tag:</p>
          <blockquote>${message.trim()}</blockquote>
          ${
            sender_name
              ? `<p><b>From:</b> ${sender_name}</p>`
              : `<p><i>No name provided.</i></p>`
          }
          ${location ? `<p><b>Location:</b> ${location}</p>` : ''}
          <p><small>This message was sent through Mojo.spot. Replies are optional and your privacy is always respected.</small></p>
        `
      });
    } catch (err) {
      console.error('[Email Send Error]', err);
      // Still return success — message was saved
      return res.status(200).json({
        success: true,
        warning: 'Message saved, but email failed to send.'
      });
    }

    return res
      .status(200)
      .json({ success: true, message: 'Message sent and saved!' });
  } catch (err) {
    console.error('[Submit Message Error]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
