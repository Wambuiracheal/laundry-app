const express = require('express');
const {
  validateSignupRequest,
  validateLoginRequest,
  validateTokenIssueRequest,
  validateVerifyTokenRequest,
  validateRefreshTokenRequest,
} = require('../middlewares/validator');
const {
  signup,
  login,
  issueToken,
  verifyToken,
  refreshAccessToken,
  logout,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', validateSignupRequest, signup);
router.post('/login', validateLoginRequest, login);
router.post('/token', validateTokenIssueRequest, issueToken);
router.post('/verify', validateVerifyTokenRequest, verifyToken);
router.post('/refresh', validateRefreshTokenRequest, refreshAccessToken);
router.post('/logout', validateRefreshTokenRequest, logout);

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