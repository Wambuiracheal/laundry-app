const express = require('express');
const { V2 } = require("paseto");
const nacl = require("tweetnacl");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const { PrismaClient } = require('@prisma/client');
const {
  validateSignupRequest,
  validateLoginRequest,
  validateTokenIssueRequest,
  validateVerifyTokenRequest,
  validateRefreshTokenRequest,
} = require('../middlewares/validator');

const router = express.Router();
const prisma = new PrismaClient();

const REFRESH_TOKEN_EXPIRES_DAYS = 7;

/**
 * SECURITY WARNING: 
 * These keys change every time the server restarts. 
 * For Postman testing this is fine, but in production, 
 * save a fixed key to your .env file.
 */
const keyPair = nacl.sign.keyPair(); 
const privateKey = Buffer.from(keyPair.secretKey);
const publicKey = Buffer.from(keyPair.publicKey);


const signAccessToken = (userId, role) =>
  V2.sign({ userId, role }, privateKey, {
    issuer: "my-app",
    audience: "users",
    expiresIn: "1h",
  });

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

const revokeRefreshToken = async (raw) => {
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  await prisma.refreshToken.updateMany({
    where: { token_hash: hash },
    data: { revoked: true },
  });
};

// --- 1. Signup & Issue Token ---
router.post("/signup", validateSignupRequest, async (req, res) => {
  try {
    // Validation middleware already normalized and verified these fields.
    const {
      fullName,
      email,
      password,
      phone,
      role,
    } = req.validatedSignup;
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to Database
    const newUser = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        password_hash: hashedPassword,
        role: role,
      },
    });

    const accessToken = await signAccessToken(newUser.id, role || "user");
    const refreshToken = await createRefreshToken(newUser.id);

    res.status(201).json({
      message: "User created",
      accessToken,
      refreshToken,
      user: { id: newUser.id, fullName, email: newUser.email },
    });

  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("Signup failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Login route 
router.post("/login", validateLoginRequest, async (req, res) => {
  try {
    // Pull only middleware-validated credentials.
    const { email, password } = req.validatedLogin;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = await signAccessToken(user.id, user.role || "user");
    const refreshToken = await createRefreshToken(user.id);

    res.json({ accessToken, refreshToken });

  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- 2. Manual Token Generation (for testing) ---
router.post("/token", validateTokenIssueRequest, async (req, res) => {
  try {
    const { userId, role } = req.validatedTokenIssue;

    const token = await V2.sign(
      { userId, role }, 
      privateKey, 
      {
        issuer: "my-app",
        audience: "users",
        expiresIn: "1h",
      }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. Verify Token ---
router.post("/verify", validateVerifyTokenRequest, async (req, res) => {
  try {
    const { token } = req.validatedVerifyToken;

    const payload = await V2.verify(token, publicKey, {
      issuer: "my-app",
      audience: "users",
    });

    res.json({ valid: true, payload });
  } catch (err) {
    console.error(" Verification failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});


// --- 4. Refresh Access Token ---
router.post("/refresh", validateRefreshTokenRequest, async (req, res) => {
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

    // Rotate refresh tokens to reduce replay risk.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const accessToken = await signAccessToken(stored.user.id, stored.user.role || "user");
    const newRefreshToken = await createRefreshToken(stored.user.id);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error("Refresh failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- 5. Logout (revoke refresh token) ---
router.post("/logout", validateRefreshTokenRequest, async (req, res) => {
  try {
    const { refreshToken } = req.validatedRefreshToken;

    await revokeRefreshToken(refreshToken);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback for unknown auth endpoints under this router mount.
router.use((req, res) => {
  res.status(404).json({
    error: "Auth route not found",
    method: req.method,
    path: `${req.baseUrl}${req.path}`,
    availableEndpoints: [
      "POST /signup",
      "POST /login",
      "POST /token",
      "POST /verify",
      "POST /refresh",
      "POST /logout",
    ],
  });
});

module.exports = router;