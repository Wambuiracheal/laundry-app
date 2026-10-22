/**
 * One-off move of existing accounts into Supabase Auth, keeping their current passwords:
 * each user without a Supabase link gets a confirmed Supabase login created from their bcrypt
 * hash, and is linked to it. Safe to re-run; already-linked users are skipped.
 *
 *   npm run migrate-auth -- --dry-run   # list what would happen
 *   npm run migrate-auth
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Users whose password can't be imported are
 * still linked; they sign in with "Forgot password" or a social login.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { findAuthUserByEmail, getAdminClient } = require('../src/utils/supabaseAuth');

async function createAuthUser(user) {
  const admin = getAdminClient().auth.admin;
  const attributes = {
    email: user.email,
    email_confirm: true,
    user_metadata: { full_name: `${user.first_name} ${user.last_name}`.trim(), phone: user.phone },
  };

  if (user.password_hash) {
    const { data, error } = await admin.createUser({ ...attributes, password_hash: user.password_hash });
    if (!error) return { id: data.user.id, password: 'kept' };
    if (!/password/i.test(error.message)) throw error;
  }
  const { data, error } = await admin.createUser(attributes);
  if (error) throw error;
  return { id: data.user.id, password: 'reset needed' };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = new PrismaClient();
  const totals = { linked: 0, created: 0, failed: 0 };

  try {
    const users = await prisma.user.findMany({ where: { auth_id: null }, orderBy: { created_at: 'asc' } });
    console.log(`${users.length} account(s) to move${dryRun ? ' (dry run)' : ''}.`);

    for (const user of users) {
      try {
        const existing = await findAuthUserByEmail(user.email);
        if (dryRun) {
          console.log(`  ${user.email} (${user.role}): would ${existing ? 'link to the existing Supabase login' : 'create a Supabase login'}`);
          continue;
        }

        const auth = existing ? { id: existing.id, password: 'unchanged' } : await createAuthUser(user);
        await prisma.user.update({ where: { id: user.id }, data: { auth_id: auth.id } });
        totals[existing ? 'linked' : 'created'] += 1;
        console.log(`  ${user.email} (${user.role}): ${existing ? 'linked' : 'created'}, password ${auth.password}`);
      } catch (error) {
        totals.failed += 1;
        console.error(`  ${user.email}: failed (${error.message})`);
      }
    }

    if (!dryRun) console.log(`Done: ${totals.created} created, ${totals.linked} linked, ${totals.failed} failed.`);
    if (totals.failed) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
