const { V2 } = require('paseto');
const crypto = require('node:crypto');
const nacl = require('tweetnacl');

/**
 * Signing keys for access tokens. With TOKEN_SIGNING_SEED (any random string of 32+ characters,
 * e.g. one Render generates) the keys are derived from it and stay the
 * same across restarts, so users stay signed in when the server restarts or wakes from sleep.
 * Without it, fresh keys are made on every start (fine for local development).
 * Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function loadKeyPair() {
  const seed = process.env.TOKEN_SIGNING_SEED;
  if (!seed) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('TOKEN_SIGNING_SEED is not set: everyone will be signed out whenever the server restarts.');
    }
    return nacl.sign.keyPair();
  }
  if (seed.length < 32) {
    throw new Error('TOKEN_SIGNING_SEED must be at least 32 characters');
  }
  // Hash to exactly the 32-byte seed Ed25519 needs, whatever the secret's format.
  return nacl.sign.keyPair.fromSeed(crypto.createHash('sha256').update(seed).digest());
}

const keyPair = loadKeyPair();
const privateKey = Buffer.from(keyPair.secretKey);
const publicKey = Buffer.from(keyPair.publicKey);

const TOKEN_OPTIONS = { issuer: 'my-app', audience: 'users' };

const signAccessToken = (userId, role) =>
  V2.sign({ userId, role }, privateKey, { ...TOKEN_OPTIONS, expiresIn: '1h' });

const verifyAccessToken = (token) => V2.verify(token, publicKey, TOKEN_OPTIONS);

module.exports = { privateKey, publicKey, signAccessToken, verifyAccessToken };
