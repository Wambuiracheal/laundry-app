// Outbound SMS through Africa's Talking (https://africastalking.com).
// Credentials come from the environment (see .env.example). AT_USERNAME=sandbox uses the
// sandbox API, whose messages show up in the Africa's Talking simulator instead of on phones.

const { normalizePhone } = require('./mpesa');

const API_URLS = {
  sandbox: 'https://api.sandbox.africastalking.com/version1/messaging',
  live: 'https://api.africastalking.com/version1/messaging',
};

// Recipient status codes Africa's Talking reports for an accepted message: processed, sent, queued.
const ACCEPTED_STATUS_CODES = new Set([100, 101, 102]);

function isSmsConfigured() {
  return Boolean(process.env.AT_USERNAME && process.env.AT_API_KEY);
}

/**
 * Sends one text. Returns { status: 'sent' | 'failed' | 'skipped', error? } and never throws,
 * so a messaging outage can't fail the order update that triggered it.
 */
async function sendSms(phone, message) {
  const number = normalizePhone(phone);
  if (!number) return { status: 'skipped', error: 'No valid Kenyan mobile number on the account' };

  if (!isSmsConfigured()) {
    // Local development: show what would have been sent.
    console.log(`[sms] (not configured) to +${number}: ${message}`);
    return { status: 'skipped', error: "SMS is not configured (AT_USERNAME / AT_API_KEY)" };
  }

  const { AT_USERNAME, AT_API_KEY, AT_SENDER_ID } = process.env;
  const body = new URLSearchParams({ username: AT_USERNAME, to: `+${number}`, message });
  // Sender IDs must be registered with Africa's Talking; without one the shared shortcode is used.
  if (AT_SENDER_ID) body.set('from', AT_SENDER_ID);

  try {
    const response = await fetch(AT_USERNAME === 'sandbox' ? API_URLS.sandbox : API_URLS.live, {
      method: 'POST',
      headers: { apiKey: AT_API_KEY, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json().catch(() => null);
    const recipient = data?.SMSMessageData?.Recipients?.[0];

    if (response.ok && recipient && ACCEPTED_STATUS_CODES.has(Number(recipient.statusCode))) {
      return { status: 'sent' };
    }
    const reason = recipient?.status || data?.SMSMessageData?.Message || `HTTP ${response.status}`;
    return { status: 'failed', error: String(reason).slice(0, 191) };
  } catch (error) {
    return { status: 'failed', error: String(error.message).slice(0, 191) };
  }
}

module.exports = { isSmsConfigured, sendSms };
