// /pages/api/register-tag.js

import { Redis } from '@upstash/redis';
import { resend } from '../lib/resend.js';


// Upstash client
const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// Validate tag format: MOJ-XXX-XXX
const isValidMojoTag = (tag) => /^MOJ-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(tag);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { tag, email, name } = req.body;

  // Input validation
  if (!tag || !isValidMojoTag(tag)) {
    return res.status(400).json({ message: 'Invalid tag format.' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email address.' });
  }

  try {
    // Check for existing tag
    const existing = await kv.get(tag);
    if (existing) {
      return res.status(409).json({ message: 'This tag is already registered.' });
    }

    // Store tag → email mapping
    await kv.set(tag, email);

    // Send confirmation email
    await resend.emails.send({
      from: 'Mojo <hello@mojo.spot>',
      to: email,
      subject: 'Your Mojo Tag is now active!',
      html: `
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>Your Mojo tag <strong>${tag}</strong> has been successfully registered.</p>
        <p>People can now scan it and send you kind messages.</p>
        <p>Mojo on ✨</p>
      `
    });

    return res.status(200).json({ success: true, message: 'Tag registered and email sent.' });
  } catch (err) {
    console.error('[Register Tag Error]', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
