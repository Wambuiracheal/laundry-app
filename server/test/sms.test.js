const test = require('node:test');
const assert = require('node:assert/strict');
const { sendSms } = require('../src/utils/sms');
const { buildMessage } = require('../src/utils/customerNotifications');

const ENV_KEYS = ['AT_USERNAME', 'AT_API_KEY', 'AT_SENDER_ID', 'CLIENT_URL'];
const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const realFetch = global.fetch;

test.afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  global.fetch = realFetch;
});

function configure() {
  process.env.AT_USERNAME = 'sandbox';
  process.env.AT_API_KEY = 'test-key';
  delete process.env.AT_SENDER_ID;
}

function stubFetch(status, body) {
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status });
  };
  return calls;
}

test('skips numbers that are not Kenyan mobiles', async () => {
  configure();
  const calls = stubFetch(201, {});
  assert.equal((await sendSms('+1 555 0100', 'hi')).status, 'skipped');
  assert.equal(calls.length, 0);
});

test('skips (and does not call out) when SMS is not configured', async () => {
  delete process.env.AT_USERNAME;
  delete process.env.AT_API_KEY;
  const calls = stubFetch(201, {});
  const originalLog = console.log;
  console.log = () => {};
  try {
    assert.equal((await sendSms('0712345678', 'hi')).status, 'skipped');
  } finally {
    console.log = originalLog;
  }
  assert.equal(calls.length, 0);
});

test("sends through Africa's Talking with a normalised number", async () => {
  configure();
  process.env.AT_SENDER_ID = 'PANDA';
  const calls = stubFetch(201, { SMSMessageData: { Recipients: [{ statusCode: 101, status: 'Success' }] } });

  assert.deepEqual(await sendSms('0712 345 678', 'Your order is ready'), { status: 'sent' });

  const [{ url, init }] = calls;
  assert.equal(url, 'https://api.sandbox.africastalking.com/version1/messaging');
  assert.equal(init.headers.apiKey, 'test-key');
  const body = new URLSearchParams(init.body.toString());
  assert.equal(body.get('to'), '+254712345678');
  assert.equal(body.get('username'), 'sandbox');
  assert.equal(body.get('from'), 'PANDA');
  assert.equal(body.get('message'), 'Your order is ready');
});

test('uses the live API for real accounts', async () => {
  configure();
  process.env.AT_USERNAME = 'pandalaundry';
  const calls = stubFetch(201, { SMSMessageData: { Recipients: [{ statusCode: 101 }] } });
  await sendSms('254712345678', 'hi');
  assert.equal(calls[0].url, 'https://api.africastalking.com/version1/messaging');
});

test('reports rejected recipients and network errors as failed', async () => {
  configure();
  stubFetch(201, { SMSMessageData: { Recipients: [{ statusCode: 405, status: 'InsufficientBalance' }] } });
  assert.deepEqual(await sendSms('0712345678', 'hi'), { status: 'failed', error: 'InsufficientBalance' });

  global.fetch = async () => {
    throw new Error('getaddrinfo ENOTFOUND');
  };
  assert.deepEqual(await sendSms('0712345678', 'hi'), { status: 'failed', error: 'getaddrinfo ENOTFOUND' });
});

const order = {
  id: '3f2a9c11-aaaa-bbbb-cccc-000000000000',
  pickup_time: new Date('2026-10-23T07:00:00Z'),
  total_amount: '1850',
  remaining_amount: '1850',
  payment_status: 'pending',
};

test('every status message fits in one SMS and names the order', () => {
  process.env.CLIENT_URL = 'https://panda-laundry.netlify.app';
  for (const event of ['order_placed', 'rescheduled', 'picked_up', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']) {
    const message = buildMessage(event, order);
    assert.match(message, /^Panda Laundry: /);
    assert.match(message, /PL-3F2A9C/);
    // Messages with the tracking link may run to two segments; the rest must fit in one.
    if (!message.includes('Track:')) assert.ok(message.length <= 160, `${event} is ${message.length} chars`);
  }
});

test('pickup times are shown in Kenyan time', () => {
  delete process.env.CLIENT_URL;
  assert.equal(buildMessage('order_placed', order), "Panda Laundry: Pickup booked for Fri 23 Oct, 10:00. Order PL-3F2A9C. We'll text you as it moves.");
});

test('adds the tracking link when the site URL is known', () => {
  process.env.CLIENT_URL = 'https://panda-laundry.netlify.app/, https://other.example';
  assert.match(buildMessage('ready', order), / Track: https:\/\/panda-laundry\.netlify\.app\/order-tracking\?id=3f2a9c11-/);
  assert.doesNotMatch(buildMessage('delivered', order), /Track:/);
});

test('ready and payment messages depend on what is still owed', () => {
  delete process.env.CLIENT_URL;
  assert.match(buildMessage('ready', order), /Pay KES 1,850 in the app/);
  assert.match(buildMessage('ready', { ...order, payment_status: 'paid' }), /A rider will bring it/);
  assert.match(buildMessage('payment_received', { ...order, remaining_amount: '850' }, { amount: '1000' }), /received KES 1,000.*Balance: KES 850/);
  assert.match(buildMessage('payment_received', { ...order, remaining_amount: '0' }, { amount: '1850' }), /fully paid/);
});

test('processing before pricing does not quote a total', () => {
  assert.doesNotMatch(buildMessage('processing', { ...order, total_amount: null }), /KES/);
});

test('ignores events customers are not told about', () => {
  assert.equal(buildMessage('pending_pickup', order), null);
});
