// /api/register-tag.js

import { resend } from '@/lib/resend';
import { db } from '@/lib/db'; // Supabase or Upstash wrapper
import { generateMagicLink } from '@/lib/magic'; // We'll define this if needed

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { tag, email, name } = req.body;

  // Basic validation
  if (!/^MOJ-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(tag)) {
    return res.status(400).json({ message: 'Invalid tag format.' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email address.' });
  }

  // Check if tag is already registered
  const existing = await db.get(tag);
  if (existing && existing.owner) {
    return res.status(409).json({ message: 'This tag is already registered.' });
  }

  // Store pending registration
  const record = {
    tag,
    email,
    name: name || '',
    status: 'pending',
    timestamp: Date.now(),
  };

  await db.set(tag, record);

  // Generate confirmation URL
  const confirmUrl = generateMagicLink(tag, email); // e.g., `/confirm.html?token=...`

  // Send confirmation email
  await resend.emails.send({
    from: 'Mojo <noreply@mojo.spot>',
    to: email,
    subject: 'Confirm your Mojo ID registration',
    html: `
      <p>Hello,</p>
      <p>Click the link below to confirm your Mojo ID registration:</p>
      <p><a href="${confirmUrl}">Confirm Registration</a></p>
      <p>If you didn’t request this, you can ignore this email.</p>
    `,
  });

  // Redirect to confirmation info page
  return res.redirect(303, '/confirm.html');
}
