/**
 * Creates (or updates) a privileged account from the backend. Public signup only makes
 * customers and riders, so this is the only way to get an admin or staff account.
 *
 *   npm run create-user -- --email admin@example.com --password 'Str0ng!Pass' [--role admin] [--name "First Last"] [--phone +254700000000]
 *
 * The login lives in Supabase Auth (created already confirmed, so no email is sent); the role
 * lives in the app's database. If the email already exists, its role and password are updated.
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { validateEmailAndPhone, validatePasswordStrength } = require('../src/middlewares/validator');
const { findAuthUserByEmail, getAdminClient } = require('../src/utils/supabaseAuth');

const { ROLES: ALL_ROLES } = require('../src/utils/roles');

const ROLES = [ALL_ROLES.ADMIN, ALL_ROLES.STAFF, ALL_ROLES.RIDER];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    args[key.slice(2)] = value;
    i += 1;
  }
  return args;
}

/** Creates the Supabase login, or resets the password of an existing one. Returns its id. */
async function upsertAuthUser({ email, password, fullName }) {
  const admin = getAdminClient().auth.admin;
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    const { error } = await admin.updateUserById(existing.id, { password, email_confirm: true });
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = (args.email ?? '').trim().toLowerCase();
  const password = args.password ?? '';
  const role = args.role ?? 'admin';
  const phone = (args.phone ?? '').trim();
  const fullName = (args.name ?? 'Panda Admin').trim().replace(/\s+/g, ' ');
  const [firstName, ...rest] = fullName.split(' ');

  if (!email || !password) {
    throw new Error('Usage: npm run create-user -- --email <email> --password <password> [--role admin|staff|rider] [--name "First Last"] [--phone <phone>]');
  }
  if (!ROLES.includes(role)) {
    throw new Error(`--role must be one of: ${ROLES.join(', ')}`);
  }
  validateEmailAndPhone(email, phone);
  validatePasswordStrength(password);

  const prisma = new PrismaClient();
  try {
    const authId = await upsertAuthUser({ email, password, fullName });
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // The API re-reads roles at most a minute after they change.
      await prisma.user.update({ where: { id: existing.id }, data: { role, auth_id: authId } });
      console.log(`Updated ${email}: role set to ${role}, password reset.`);
    } else {
      await prisma.user.create({
        data: { auth_id: authId, first_name: firstName, last_name: rest.join(' '), email, phone, role },
      });
      console.log(`Created ${role} account for ${email}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
