const { V2 } = require('paseto');
const nacl = require('tweetnacl');

/**
 * SECURITY WARNING:
 * These keys change every time the server restarts.
 * For Postman testing this is fine, but in production,
 * save a fixed key to your .env file.
 */
const keyPair = nacl.sign.keyPair();
const privateKey = Buffer.from(keyPair.secretKey);
const publicKey = Buffer.from(keyPair.publicKey);

const TOKEN_OPTIONS = { issuer: 'my-app', audience: 'users' };

const signAccessToken = (userId, role) =>
  V2.sign({ userId, role }, privateKey, { ...TOKEN_OPTIONS, expiresIn: '1h' });

const verifyAccessToken = (token) => V2.verify(token, publicKey, TOKEN_OPTIONS);

module.exports = { privateKey, publicKey, signAccessToken, verifyAccessToken };
