const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
  registerRules, loginRules, forgotPasswordRules, resetPasswordRules,
} = require('../middleware/validators');
const {
  register, login, getMe, forgotPassword, resetPassword, verifyEmail,
} = require('../controllers/authController');
const { verifyAndUpsertUser } = require('../controllers/googleController');

router.post('/register',        registerRules,    register);
router.post('/login',           loginRules,       login);
router.get('/me',               isAuthenticated,  getMe);
router.post('/forgot-password', forgotPasswordRules, forgotPassword);
router.put('/reset-password/:token', resetPasswordRules, resetPassword);
router.get('/verify-email/:token',  verifyEmail);

// ─── Google OAuth 2.0 Redirect Flow ──────────────────────────────────────────
// 1. User visits /api/auth/google → redirected to Google consent screen
router.get('/google', (req, res) => {
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.CLIENT_URL}/api/auth/google/callback`;
  const scope       = encodeURIComponent('profile email');
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.redirect(url);
});

// 2. Google redirects here with ?code=... → exchange for tokens → upsert user → redirect to client with JWT
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

  if (error || !code) {
    console.error('Google OAuth error:', error);
    return res.redirect(`${CLIENT_URL}/login?error=google_auth_failed`);
  }

  try {
    // Exchange auth code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  `${CLIENT_URL}/api/auth/google/callback`,
        grant_type:    'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error('Google token exchange failed:', body);
      return res.redirect(`${CLIENT_URL}/login?error=google_auth_failed`);
    }

    const tokens = await tokenRes.json();
    const idToken = tokens.id_token;

    if (!idToken) {
      return res.redirect(`${CLIENT_URL}/login?error=google_auth_failed`);
    }

    // Verify Google id_token and upsert user → get our own JWT
    const { token: jwtToken } = await verifyAndUpsertUser(idToken);

    // Redirect to /login so LoginPage can process the token
    res.redirect(`${CLIENT_URL}/login?google_token=${jwtToken}`);

  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    res.redirect(`${CLIENT_URL}/login?error=google_auth_failed`);
  }
});

module.exports = router;