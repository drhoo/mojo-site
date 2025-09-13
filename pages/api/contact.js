// /pages/api/contact.js

import { resend } from '../../lib/resend';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // 1. Store in Supabase
    const { error: dbError } = await supabase.from('contact_messages').insert({
      name,
      email,
      message,
      created: new Date().toISOString()
    });

    if (dbError) {
      console.error('[Supabase Insert Error]', dbError);
      // Don’t block user — continue to send email
    }

    // 2. Send email via Resend
    await resend.emails.send({
      from: 'Mojo Contact <hello@mojo.spot>',
      to: 'hello@mojo.spot', // your inbox
      reply_to: email,
      subject: `New contact from ${name}`,
      html: `
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <blockquote>${message}</blockquote>
      `
    });

    return res
      .status(200)
      .json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('[Contact Form Error]', err);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
}
