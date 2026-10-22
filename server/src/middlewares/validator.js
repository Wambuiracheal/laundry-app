const { SELF_SIGNUP_ROLES } = require('../utils/roles');
const { normalizePhone } = require('../utils/mpesa');

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Kenyan mobiles in any common form (0712 345 678, 254712..., +254 712...) are stored as
// +2547XXXXXXXX so SMS and M-Pesa can reach them; other numbers must already be international.
const normalizeSignupPhone = (phone) => {
  const kenyan = normalizePhone(phone);
  if (kenyan) return `+${kenyan}`;
  const compact = String(phone ?? '').replace(/[\s()-]/g, '');
  return phoneRegex.test(compact) && compact.startsWith('+') ? compact : null;
};

// Throws when the email (or the phone, if given) isn't valid.
const validateEmailAndPhone = (email, phone) => {
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  if (phone && !normalizeSignupPhone(phone)) {
    throw new Error('Enter a valid mobile number, e.g. 0712 345 678');
  }
};

// Used by the create-user script; signup passwords are checked by Supabase and the web app.
const validatePasswordStrength = (password) => {
  if (!passwordRegex.test(password)) {
    throw new Error('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
  }
};

/**
 * Validates the details that complete a new account after Supabase sign-up: full name (at least
 * two names), phone, and a self-signup role (customer or rider). Attaches req.validatedProfile.
 */
const validateProfileRequest = (req, res, next) => {
  const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim().replace(/\s+/g, ' ') : '';
  const role = req.body.role || 'customer';

  if (fullName.split(' ').length < 2 || fullName.length > 191) {
    return res.status(400).json({ error: 'Enter your first and last name' });
  }
  // Public signup can only create customers and riders. Admin/staff accounts are created on
  // the backend (npm run create-user) so nobody can grant themselves a privileged role.
  if (!SELF_SIGNUP_ROLES.includes(role)) {
    return res.status(403).json({ error: 'This account type cannot be created through signup' });
  }
  const phone = normalizeSignupPhone(req.body.phone);
  if (!phone) {
    return res.status(400).json({ error: 'Enter a valid mobile number, e.g. 0712 345 678' });
  }

  req.validatedProfile = { fullName, phone, role };
  return next();
};

module.exports = {
  normalizeSignupPhone,
  validateEmailAndPhone,
  validatePasswordStrength,
  validateProfileRequest,
};
