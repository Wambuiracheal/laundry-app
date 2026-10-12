/**
 * Creates (or updates) a privileged account from the backend. Public signup only makes
 * customers and riders, so this is the only way to get an admin or staff account.
 *
 *   npm run create-user -- --email admin@example.com --password 'Str0ng!Pass' [--role admin] [--name "First Last"] [--phone +254700000000]
 *
 * If the email already exists, that user's role and password are updated instead.
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { validateEmailAndPhone, validatePasswordStrength } = require('../src/middlewares/validator');

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = (args.email ?? '').trim().toLowerCase();
  const password = args.password ?? '';
  const role = args.role ?? 'admin';
  const phone = (args.phone ?? '').trim();
  const [firstName, ...rest] = (args.name ?? 'Panda Admin').trim().split(/\s+/);

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
    const password_hash = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { role, password_hash } });
      // Sign out existing sessions so the old password and role stop working.
      await prisma.refreshToken.updateMany({ where: { user_id: existing.id }, data: { revoked: true } });
      console.log(`Updated ${email}: role set to ${role}, password reset.`);
    } else {
      await prisma.user.create({
        data: { first_name: firstName, last_name: rest.join(' '), email, phone, password_hash, role },
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
