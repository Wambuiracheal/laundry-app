const { verifyAccessToken } = require('../utils/tokens');

// Verifies the `Authorization: Bearer <token>` header and attaches `{ userId, role }` as req.user.
const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = await verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Use after requireAuth. Rejects users whose role is not in the allowed list.
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have access to this resource' });
  }
  return next();
};

module.exports = { requireAuth, requireRole };
