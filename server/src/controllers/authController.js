const { V2 } = require("paseto");
const nacl = require("tweetnacl");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const prisma = require("../utils/prisma");

const REFRESH_TOKEN_EXPIRES_DAYS = 7; 

// Helper function to parse base64-encoded keys from environment variables and validate their length.
function parseKeyFromEnv(rawValue, expectedLength, label) {
  if (!rawValue) {
    return null;
  }

  try {
    const key = Buffer.from(rawValue, "base64");
    if (key.length !== expectedLength) {
      throw new Error(`${label} must decode to ${expectedLength} bytes`);
    }

    return key;
  } catch (error) {
    throw new Error(`Invalid ${label}: ${error.message}`);
  }
}

// Resolve PASETO keys from environment variables or generate ephemeral keys if not provided.
function resolvePasetoKeys() {
  const envPrivateKey = parseKeyFromEnv(process.env.PASETO_PRIVATE_KEY, 64, "PASETO_PRIVATE_KEY");
  const envPublicKey = parseKeyFromEnv(process.env.PASETO_PUBLIC_KEY, 32, "PASETO_PUBLIC_KEY");

  if (envPrivateKey && envPublicKey) {
    return { privateKey: envPrivateKey, publicKey: envPublicKey };
  }

  if (envPrivateKey || envPublicKey) {
    throw new Error("Both PASETO_PRIVATE_KEY and PASETO_PUBLIC_KEY are required together");
  }

  // SECURITY WARNING:
  // Ephemeral keys rotate on every restart, invalidating existing access tokens.
  // Configure PASETO_PRIVATE_KEY and PASETO_PUBLIC_KEY in production to keep tokens stable.
  const keyPair = nacl.sign.keyPair();
  return {
    privateKey: Buffer.from(keyPair.secretKey),
    publicKey: Buffer.from(keyPair.publicKey),
  };
}

// Resolve PASETO keys from environment variables or generate ephemeral keys if not provided.
const { privateKey, publicKey } = resolvePasetoKeys();

// Google OAuth login and signup URLs are configured via environment variables.
const GOOGLE_LOGIN_URL = process.env.GOOGLE_LOGIN_URL;
const GOOGLE_SIGNUP_URL = process.env.GOOGLE_SIGNUP_URL;

// Helper function to check if a given URL is allowed for redirection (must be HTTPS or localhost HTTP).
function isAllowedRedirectUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "https:") {
      return true;
    }

    return parsed.protocol === "http:" && parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

// Helper function to redirect users to Google OAuth login or signup URLs, ensuring the URLs are valid and secure.
function redirectToGoogle(res, redirectUrl, flow) {
  if (!redirectUrl) {
    return res.status(501).json({
      error: "Google auth is not configured",
      flow,
      requiredEnv: flow === "login" ? "GOOGLE_LOGIN_URL" : "GOOGLE_SIGNUP_URL",
    });
  }

  if (!isAllowedRedirectUrl(redirectUrl)) {
    return res.status(500).json({
      error: "Invalid Google auth redirect URL configuration",
      flow,
    });
  }

  return res.redirect(302, redirectUrl);
}

// SIGNIN ACCESS TOKEN AND REFRESH TOKEN MANAGEMENT
const signAccessToken = (user) =>
  V2.sign({ userId: user.id, role: user.role, fullName: user.fullName, email: user.email }, privateKey, {
    issuer: "my-app",
    audience: "users",
    expiresIn: "1h",
  });

// REFRESH TOKEN MANAGEMENT
const createRefreshToken = async (userId) => {
  const raw = crypto.randomBytes(40).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: { token_hash: hash, user_id: userId, expires_at: expiresAt },
  });

  return raw;
};

// Revoke refresh token by hashing the raw token and marking it as revoked in the database.
const revokeRefreshToken = async (raw) => {
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  await prisma.refreshToken.updateMany({
    where: { token_hash: hash },
    data: { revoked: true },
  });
};

// Sign and verify tokens using PASETO V2 with Ed25519 keys, and manage refresh tokens in the database.
async function signup(req, res) {
  try {
    const { fullName, email, password, phone, role } = req.validatedSignup;
    const [firstName, ...lastNameParts] = fullName.split(" ");
    const lastName = lastNameParts.join(" ");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName: `${firstName} ${lastName}`,
        email,
        phone,
        password_hash: hashedPassword,
        role,
      },
    });

    const accessToken = await signAccessToken(newUser);
    const refreshToken = await createRefreshToken(newUser.id);

    return res.status(201).json({
      message: "User created",
      accessToken,
      refreshToken,
    //   user: { id: newUser.id, fullName, email: newUser.email },      
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" });
    }

    console.error("Signup failed:", err);
    return res.status(500).json({ error: err.message });
  }
}

// Login, token issuance, verification, refresh, and logout functions follow similar patterns, using PASETO for access tokens and database-stored refresh tokens.
async function login(req, res) {
  try {
    const { email, password } = req.validatedLogin;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = await signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    return res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Login failed:", err);
    return res.status(500).json({ error: err.message });
  }
}

// Token issuance, verification, refresh, and logout functions follow similar patterns, using PASETO for access tokens and database-stored refresh tokens.
async function issueToken(req, res) {
  try {
    const { userId, role } = req.validatedTokenIssue;

    const token = await V2.sign(
      { userId, role },
      privateKey,
      {
        issuer: "my-app",
        audience: "users",
        expiresIn: "1h",
      },
    );

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// verifyToken, refreshAccessToken, and logout functions follow similar patterns, using PASETO for access tokens and database-stored refresh tokens.
async function verifyToken(req, res) {
  try {
    const { token } = req.validatedVerifyToken;

    const payload = await V2.verify(token, publicKey, {
      issuer: "my-app",
      audience: "users",
    });

    return res.json({ valid: true, payload });
  } catch (err) {
    console.error("Verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// refreshAccessToken and logout functions follow similar patterns, using PASETO for access tokens and database-stored refresh tokens.
async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.validatedRefreshToken;

    const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const stored = await prisma.refreshToken.findUnique({
      where: { token_hash: hash },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expires_at < new Date()) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const accessToken = await signAccessToken(stored.user);
    const newRefreshToken = await createRefreshToken(stored.user.id);

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error("Refresh failed:", err);
    return res.status(500).json({ error: err.message });
  }
}

// logout function follows similar patterns, using PASETO for access tokens and database-stored refresh tokens.
async function logout(req, res) {
  try {
    const { refreshToken } = req.validatedRefreshToken;

    await revokeRefreshToken(refreshToken);
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout failed:", err);
    return res.status(500).json({ error: err.message });
  }
}

// Google OAuth login and signup functions redirect users to the configured Google auth URLs, ensuring they are valid and secure.
function googleLogin(req, res) {
  return redirectToGoogle(res, GOOGLE_LOGIN_URL, "login");
}

// Google OAuth login and signup functions redirect users to the configured Google auth URLs, ensuring they are valid and secure.
function googleSignup(req, res) {
  return redirectToGoogle(res, GOOGLE_SIGNUP_URL, "signup");
}

// Export all authentication-related functions.
module.exports = {
  signup,
  login,
  issueToken,
  verifyToken,
  refreshAccessToken,
  logout,
  googleLogin,
  googleSignup,
};
