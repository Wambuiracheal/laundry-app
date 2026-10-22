const { SELF_SIGNUP_ROLES } = require('../utils/roles');
const { normalizePhone } = require('../utils/mpesa');

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// This function validates the email and phone number formats using regular expressions. It throws an error if the email format is invalid or if the phone number format is invalid (if provided).
// Emails are stored and looked up in lower case: PostgreSQL compares text case-sensitively.
const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : email);

// Kenyan mobiles in any common form (0712 345 678, 254712..., +254 712...) are stored as
// +2547XXXXXXXX so SMS and M-Pesa can reach them; other numbers must already be international.
const normalizeSignupPhone = (phone) => {
  const kenyan = normalizePhone(phone);
  if (kenyan) return `+${kenyan}`;
  const compact = String(phone ?? '').replace(/[\s()-]/g, '');
  return phoneRegex.test(compact) && compact.startsWith('+') ? compact : null;
};

const validateEmailAndPhone = (email, phone) => {
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  if (phone && !normalizeSignupPhone(phone)) {
    throw new Error('Enter a valid mobile number, e.g. 0712 345 678');
  }
};

// This function validates the strength of a password using a regular expression. It throws an error if the password does not meet the required criteria (at least 8 characters long, including uppercase, lowercase, number, and special character).
const validatePasswordStrength = (password) => {
  if (!passwordRegex.test(password)) {
    throw new Error('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
  }
};

// This middleware function validates the signup request payload. It checks for required fields, validates email and phone formats, checks password strength, and ensures that the full name contains at least two names. If validation passes, it normalizes the payload and attaches it to the request object for downstream handlers to use.
const validateSignupRequest = (req, res, next) => {
  try {
    const fullName = req.body.fullName ?? req.body.full_name;
    const email = normalizeEmail(req.body.email);
    const password = req.body.password ?? req.body.password_hash;
    const confirmPassword = req.body.confirmPassword ?? req.body.confirm_password;
    const phone = req.body.phone;
    // Public signup can only create customers and riders. Admin/staff accounts are created on
    // the backend (npm run create-user) so nobody can grant themselves a privileged role.
    const role = req.body.role || 'customer';

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ error: 'fullName, email, password and phone are required' });
    }

    if (!SELF_SIGNUP_ROLES.includes(role)) {
      return res.status(403).json({ error: 'This account type cannot be created through signup' });
    }

    validateEmailAndPhone(email, phone);
    validatePasswordStrength(password);

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const normalizedFullName = fullName.trim().replace(/\s+/g, ' ');
    if (normalizedFullName.split(' ').length < 2) {
      return res.status(400).json({
        error: 'Provide fullName with at least two names',
      });
    }

    // Downstream handlers should only consume this normalized payload.
    req.validatedSignup = {
      fullName: normalizedFullName,
      email,
      password,
      phone: normalizeSignupPhone(phone),
      role,
    };

    return next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// This middleware function validates the login request payload. It checks for required fields (email and password), reuses the email format validation, and attaches the validated payload to the request object for downstream handlers to use. If validation fails, it responds with a 400 status code and an error message.
const validateLoginRequest = (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Reuse the same format validation rules as signup.
    validateEmailAndPhone(email, null);
    req.validatedLogin = { email, password };

    return next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// This middleware function validates the token issue request payload. It checks for required fields (userId and role), and attaches the validated payload to the request object for downstream handlers to use. If validation fails, it responds with a 400 status code and an error message.
const validateTokenIssueRequest = (req, res, next) => {
  const userId = req.body.userId;
  const role = req.body.role || 'user';

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // Keep a consistent validated payload shape across auth middlewares.
  req.validatedTokenIssue = { userId, role };
  return next();
};

// This middleware function validates the verify token request payload. It checks for the required field (token), and attaches the validated payload to the request object for downstream handlers to use. If validation fails, it responds with a 400 status code and an error message.
const validateVerifyTokenRequest = (req, res, next) => {
  const token = req.body.token;

  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  req.validatedVerifyToken = { token };
  return next();
};

// This middleware function validates the refresh token request payload. It checks for the required field (refreshToken), and attaches the validated payload to the request object for downstream handlers to use. If validation fails, it responds with a 400 status code and an error message.
const validateRefreshTokenRequest = (req, res, next) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  req.validatedRefreshToken = { refreshToken };
  return next();
};

module.exports = {
  validateEmailAndPhone,
  validatePasswordStrength,
  validateSignupRequest,
  validateLoginRequest,
  validateTokenIssueRequest,
  validateVerifyTokenRequest,
  validateRefreshTokenRequest,
};
