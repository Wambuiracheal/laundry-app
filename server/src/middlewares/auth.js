const { PrismaClient } = require('@prisma/client');
const { AuthConfigError, verifySupabaseToken } = require('../utils/supabaseAuth');

const prisma = new PrismaClient();

// Supabase user id -> { userId, role }, so each request doesn't hit the database. Kept short so a
// role changed on the backend applies within a minute.
const CACHE_MS = 60_000;
const userCache = new Map();

/** Drops a cached account, e.g. after its profile was created or its role changed. */
function forgetAuthUser(authId) {
  userCache.delete(authId);
}

async function appUserFor(authId) {
  const cached = userCache.get(authId);
  if (cached && cached.expires > Date.now()) return cached.user;

  const row = await prisma.user.findUnique({ where: { auth_id: authId }, select: { id: true, role: true } });
  if (!row) return null;
  const user = { userId: row.id, role: row.role };
  userCache.set(authId, { user, expires: Date.now() + CACHE_MS });
  return user;
}

/** Reads and verifies the `Authorization: Bearer <Supabase access token>` header; sends the error itself and returns null on failure. */
async function authenticate(req, res) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  try {
    return await verifySupabaseToken(token);
  } catch (error) {
    if (error instanceof AuthConfigError) {
      console.error('Auth is not configured:', error.message);
      res.status(500).json({ error: 'Sign-in is not set up on the server yet' });
    } else {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
    return null;
  }
}

// Signed in with Supabase, whether or not the app profile exists yet (used to create it).
// Attaches `{ authId, email, metadata }` as req.authUser.
const requireSupabaseUser = async (req, res, next) => {
  const authUser = await authenticate(req, res);
  if (!authUser) return undefined;
  req.authUser = authUser;
  return next();
};

// Signed in with a finished profile. Attaches `{ userId, role }` as req.user; the role always
// comes from the database, never from the token, so users can't grant themselves one.
const requireAuth = async (req, res, next) => {
  const authUser = await authenticate(req, res);
  if (!authUser) return undefined;

  try {
    const user = await appUserFor(authUser.authId);
    if (!user) {
      return res.status(403).json({ error: 'Finish setting up your account to continue', code: 'profile_required' });
    }
    req.authUser = authUser;
    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load your account', details: error.message });
  }
};

// Use after requireAuth. Rejects users whose role is not in the allowed list.
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have access to this resource' });
  }
  return next();
};

module.exports = { forgetAuthUser, requireAuth, requireRole, requireSupabaseUser };
