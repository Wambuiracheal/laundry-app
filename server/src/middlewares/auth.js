const { verifyAccessToken } = require('../controllers/authController');

// Reads Authorization: Bearer <token>, verifies the PASETO access token, and
// attaches the caller's identity to req.user for downstream handlers.
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = await verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role,
      email: payload.email,
      fullName: payload.fullName,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
