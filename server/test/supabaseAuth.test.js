const test = require('node:test');
const assert = require('node:assert/strict');
const { SignJWT } = require('jose');
const { AuthConfigError, verifySupabaseToken } = require('../src/utils/supabaseAuth');
const { validateProfileRequest } = require('../src/middlewares/validator');

const URL_ = 'https://example-project.supabase.co';
const SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
const ENV_KEYS = ['SUPABASE_URL', 'SUPABASE_JWT_SECRET'];
const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

test.beforeEach(() => {
  process.env.SUPABASE_URL = URL_;
  process.env.SUPABASE_JWT_SECRET = SECRET;
});

test.after(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

function sign(claims = {}, { secret = SECRET, issuer = `${URL_}/auth/v1`, audience = 'authenticated', expiresIn = '1h' } = {}) {
  return new SignJWT({ email: 'Jane@Example.com', user_metadata: { full_name: 'Jane Wanjiru' }, ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub ?? '6f1c0d4e-0000-4000-8000-000000000001')
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
}

test('accepts a valid Supabase token and returns who it belongs to', async () => {
  const user = await verifySupabaseToken(await sign());
  assert.deepEqual(user, {
    authId: '6f1c0d4e-0000-4000-8000-000000000001',
    email: 'jane@example.com',
    metadata: { full_name: 'Jane Wanjiru' },
  });
});

test('rejects tokens signed with another secret, for another project, or expired', async () => {
  await assert.rejects(verifySupabaseToken(await sign({}, { secret: 'some-other-secret-that-is-also-long-enough!!' })));
  await assert.rejects(verifySupabaseToken(await sign({}, { issuer: 'https://other.supabase.co/auth/v1' })));
  await assert.rejects(verifySupabaseToken(await sign({}, { audience: 'anon' })));
  await assert.rejects(verifySupabaseToken(await sign({}, { expiresIn: '-1m' })));
});

test('rejects anonymous sign-ins', async () => {
  await assert.rejects(verifySupabaseToken(await sign({ is_anonymous: true })), /Sign in with an account/);
});

test('reports missing configuration as a config error, not a bad token', async () => {
  const token = await sign();
  delete process.env.SUPABASE_JWT_SECRET;
  await assert.rejects(verifySupabaseToken(token), AuthConfigError);
  delete process.env.SUPABASE_URL;
  await assert.rejects(verifySupabaseToken(token), AuthConfigError);
});

function runProfileValidation(body) {
  const req = { body };
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
  let passed = false;
  validateProfileRequest(req, res, () => {
    passed = true;
  });
  return { passed, req, res };
}

test('profile details: normalises Kenyan numbers and defaults to customer', () => {
  const { passed, req } = runProfileValidation({ fullName: '  Jane   Wanjiru ', phone: '0712 345 678' });
  assert.ok(passed);
  assert.deepEqual(req.validatedProfile, { fullName: 'Jane Wanjiru', phone: '+254712345678', role: 'customer' });
});

test('profile details: riders may sign themselves up, staff and admins may not', () => {
  assert.equal(runProfileValidation({ fullName: 'Ken Otieno', phone: '0712345678', role: 'rider' }).req.validatedProfile.role, 'rider');
  for (const role of ['admin', 'staff']) {
    const { passed, res } = runProfileValidation({ fullName: 'Ken Otieno', phone: '0712345678', role });
    assert.equal(passed, false);
    assert.equal(res.statusCode, 403);
  }
});

test('profile details: needs two names and a valid phone', () => {
  assert.equal(runProfileValidation({ fullName: 'Jane', phone: '0712345678' }).res.statusCode, 400);
  assert.equal(runProfileValidation({ fullName: 'Jane Wanjiru', phone: '12345' }).res.statusCode, 400);
});
