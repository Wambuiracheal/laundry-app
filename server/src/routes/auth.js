// Sign-up, login, social logins and password resets happen in Supabase Auth, directly from the
// web app. These routes connect a Supabase account to the app's own profile (name, phone, role).
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { forgetAuthUser, requireSupabaseUser } = require('../middlewares/auth');
const { normalizeSignupPhone, validateProfileRequest } = require('../middlewares/validator');
const { getAuthUser } = require('../utils/supabaseAuth');

const router = express.Router();
const prisma = new PrismaClient();

const presentProfile = (user) => ({
  id: user.id,
  fullName: `${user.first_name} ${user.last_name}`.trim(),
  email: user.email,
  phone: user.phone,
  role: user.role,
});

/**
 * An account created before the move to Supabase (or by an admin) may exist with this email but
 * no Supabase link yet. Link it, but only once Supabase confirms the person owns the email:
 * otherwise anyone could sign up with someone else's address and take over their account.
 */
async function linkByEmail(authUser) {
  if (!authUser.email) return null;
  const existing = await prisma.user.findUnique({ where: { email: authUser.email } });
  if (!existing || existing.auth_id) return null;

  const supabaseUser = await getAuthUser(authUser.authId);
  if (!supabaseUser?.email_confirmed_at) return null;

  return prisma.user.update({ where: { id: existing.id }, data: { auth_id: authUser.authId } });
}

/** What we know from sign-up or the social provider, to prefill the profile form. */
function suggestedProfile({ metadata }) {
  const fullName = [metadata.full_name, metadata.name].find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
  const phone = typeof metadata.phone === 'string' ? metadata.phone : '';
  const role = metadata.role === 'rider' ? 'rider' : 'customer';
  return { fullName, phone, phoneValid: normalizeSignupPhone(phone) !== null, role };
}

// The signed-in user's profile, or 404 `profile_required` with suggestions for the profile form.
router.get('/me', requireSupabaseUser, async (req, res) => {
  try {
    const user =
      (await prisma.user.findUnique({ where: { auth_id: req.authUser.authId } })) ?? (await linkByEmail(req.authUser));
    if (!user) {
      return res.status(404).json({ error: 'Finish setting up your account', code: 'profile_required', suggested: suggestedProfile(req.authUser) });
    }
    res.json(presentProfile(user));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load your account', details: error.message });
  }
});

// Completes a new account: creates the profile for the signed-in Supabase user.
router.post('/profile', requireSupabaseUser, validateProfileRequest, async (req, res) => {
  try {
    const { authId, email } = req.authUser;
    if (!email) {
      return res.status(400).json({ error: 'Your sign-in method did not share an email address. Sign up with email instead.' });
    }

    const existing = await prisma.user.findFirst({ where: { OR: [{ auth_id: authId }, { email }] } });
    if (existing?.auth_id === authId) {
      return res.status(409).json({ error: 'Your account is already set up' });
    }
    if (existing) {
      const linked = await linkByEmail(req.authUser);
      if (linked) return res.json(presentProfile(linked));
      return res.status(409).json({ error: 'An account with this email already exists. Confirm your email address, then log in again.' });
    }

    const { fullName, phone, role } = req.validatedProfile;
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const user = await prisma.user.create({
      data: { auth_id: authId, email, first_name: firstName, last_name: lastNameParts.join(' '), phone, role },
    });

    forgetAuthUser(authId);
    res.status(201).json(presentProfile(user));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to set up your account', details: error.message });
  }
});

// Fallback for unknown auth endpoints under this router mount.
router.use((req, res) => {
  res.status(404).json({
    error: 'Auth route not found',
    method: req.method,
    path: `${req.baseUrl}${req.path}`,
    availableEndpoints: ['GET /me', 'POST /profile'],
  });
});

module.exports = router;
