const { V2 } = require("paseto");
const nacl = require("tweetnacl");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const REFRESH_TOKEN_EXPIRES_DAYS = 7;

const keyPair = nacl.sign.keyPair();
const privateKey = Buffer.from(keyPair.secretKey);
const publicKey = Buffer.from(keyPair.publicKey);

const GOOGLE_LOGIN_URL = process.env.GOOGLE_LOGIN_URL;
const GOOGLE_SIGNUP_URL = process.env.GOOGLE_SIGNUP_URL;

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

async function signup(req, res) {
  try {
    const { fullName, email, password, phone, role } = req.validatedSignup;
    const [firstName, ...lastNameParts] = fullName.split(" ");
    const lastName = lastNameParts.join(" ");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password_hash: hashedPassword,
        role,
      },
    });

    const accessToken = await signAccessToken(newUser.id, role || "user");
    const refreshToken = await createRefreshToken(newUser.id);

    return res.status(201).json({
      message: "User created",
      accessToken,
      refreshToken,
      user: { id: newUser.id, fullName, email: newUser.email },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" });
    }

    console.error("Signup failed:", err);
    return res.status(500).json({ error: err.message });
  }
}

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

    const accessToken = await signAccessToken(user.id, user.role || "user");
    const refreshToken = await createRefreshToken(user.id);

    return res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Login failed:", err);
    return res.status(500).json({ error: err.message });
  }
}

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

    const accessToken = await signAccessToken(stored.user.id, stored.user.role || "user");
    const newRefreshToken = await createRefreshToken(stored.user.id);

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error("Refresh failed:", err);
    return res.status(500).json({ error: err.message });
  }
}

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

function googleLogin(req, res) {
  return redirectToGoogle(res, GOOGLE_LOGIN_URL, "login");
}

function googleSignup(req, res) {
  return redirectToGoogle(res, GOOGLE_SIGNUP_URL, "signup");
}

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
