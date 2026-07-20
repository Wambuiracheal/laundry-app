const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const validateEmailAndPhone = (email, phone) => {
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  if (phone && !phoneRegex.test(phone)) {
    throw new Error('Invalid phone number format');
  }
};

const validatePasswordStrength = (password) => {
  if (!passwordRegex.test(password)) {
    throw new Error('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
  }
};

const validateSignupRequest = (req, res, next) => {
  try {
    const fullName = req.body.fullName ?? req.body.full_name;
    const email = req.body.email;
    const password = req.body.password ?? req.body.password_hash;
    const confirmPassword = req.body.confirmPassword ?? req.body.confirm_password;
    const phone = req.body.phone;
    const role = req.body.role || 'customer';

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ error: 'fullName, email, password and phone are required' });
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
      phone,
      role,
    };

    return next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const validateLoginRequest = (req, res, next) => {
  try {
    const email = req.body.email;
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

const validateVerifyTokenRequest = (req, res, next) => {
  const token = req.body.token;

  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  req.validatedVerifyToken = { token };
  return next();
};

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
