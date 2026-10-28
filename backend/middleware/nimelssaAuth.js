const { auth } = require('../config/firebase');

async function requireNimelssaAdmin(req, res, next) {
  if (!auth) {
    return res.status(503).json({ error: 'Firebase authentication is not configured.' });
  }

  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }

  try {
    const user = await auth.verifyIdToken(token, true);
    if (user.nimelssaAdmin !== true) {
      return res.status(403).json({ error: 'This account does not have NIMELSSA administrator access.' });
    }

    req.nimelssaUser = user;
    return next();
  } catch (error) {
    if (error.code === 'auth/id-token-revoked' || error.code === 'auth/id-token-expired' ||
        error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Your sign-in has expired. Please sign in again.' });
    }
    console.error('NIMELSSA token verification failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to verify administrator access.' });
  }
}

module.exports = { requireNimelssaAdmin };
