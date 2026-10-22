// Supabase Auth: verifies the access tokens the web app gets from Supabase, and wraps the admin
// API used to link and create accounts. Configuration comes from the environment (.env.example).

const { createClient } = require('@supabase/supabase-js');
const { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } = require('jose');

class AuthConfigError extends Error {}

function supabaseUrl() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  if (!url) throw new AuthConfigError('SUPABASE_URL is not set on the server');
  return url;
}

let jwks = null;
let jwksUrl = null;

/** The project's public signing keys (current Supabase projects sign tokens with ES256/RS256). */
function signingKeys(url) {
  const target = `${url}/auth/v1/.well-known/jwks.json`;
  if (!jwks || jwksUrl !== target) {
    jwks = createRemoteJWKSet(new URL(target));
    jwksUrl = target;
  }
  return jwks;
}

/**
 * Checks a Supabase access token and returns who it belongs to. Throws on an invalid, expired or
 * anonymous token; throws AuthConfigError when the server isn't set up to check tokens.
 */
async function verifySupabaseToken(token) {
  const url = supabaseUrl();
  const { alg } = decodeProtectedHeader(token);
  const options = { issuer: `${url}/auth/v1`, audience: 'authenticated' };

  let result;
  if (alg === 'HS256') {
    // Projects still on the legacy shared JWT secret (Project settings > API > JWT secret).
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) throw new AuthConfigError('This Supabase project signs tokens with its JWT secret: set SUPABASE_JWT_SECRET');
    result = await jwtVerify(token, new TextEncoder().encode(secret), { ...options, algorithms: ['HS256'] });
  } else {
    result = await jwtVerify(token, signingKeys(url), { ...options, algorithms: ['ES256', 'RS256'] });
  }

  const { payload } = result;
  if (!payload.sub || payload.is_anonymous) throw new Error('Sign in with an account to continue');
  return {
    authId: payload.sub,
    email: typeof payload.email === 'string' && payload.email ? payload.email.toLowerCase() : null,
    metadata: payload.user_metadata && typeof payload.user_metadata === 'object' ? payload.user_metadata : {},
  };
}

let adminClient = null;

/** Service-role client for the Supabase admin API. Never expose this key to the browser. */
function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new AuthConfigError('SUPABASE_SERVICE_ROLE_KEY is not set on the server');
  if (!adminClient) {
    adminClient = createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return adminClient;
}

/** The Supabase user, straight from Supabase (tokens don't say whether the email was verified). */
async function getAuthUser(authId) {
  const { data, error } = await getAdminClient().auth.admin.getUserById(authId);
  if (error) throw error;
  return data.user;
}

/** Looks a Supabase user up by email (the admin API has no direct lookup, so this pages through). */
async function findAuthUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; ; page += 1) {
    const { data, error } = await getAdminClient().auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 1000) return null;
  }
}

module.exports = { AuthConfigError, findAuthUserByEmail, getAdminClient, getAuthUser, verifySupabaseToken };
