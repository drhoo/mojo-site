
// /pages/api/confirm.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // At this stage, Mojo registration is immediate (no token flow).
  // So confirm just redirects to the static confirmation page.

  try {
    return res.redirect('/confirm.html');
  } catch (err) {
    console.error('[Confirm Error]', err);
    return res.redirect('/invalid.html');
  }
}
