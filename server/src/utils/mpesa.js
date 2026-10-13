// M-Pesa Express (STK push) via Safaricom's Daraja API.
// Credentials come from the environment (see .env.example); MPESA_ENV picks sandbox or production.

const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

// Daraja rejects localhost callback URLs. Without a public URL we send this unresolvable one
// (.invalid can never resolve, so no payment data goes anywhere) and learn each result by
// querying the STK status instead.
const UNREACHABLE_CALLBACK_URL = 'https://callback.invalid/api/payments/mpesa/callback';

// Query results that mean the customer hasn't finished with the prompt yet.
const PENDING_RESULT_CODES = new Set(['4999']);

let cachedToken = null;

function isMpesaConfigured() {
  const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE } = process.env;
  return Boolean(MPESA_CONSUMER_KEY && MPESA_CONSUMER_SECRET && MPESA_PASSKEY && MPESA_SHORTCODE);
}

function baseUrl() {
  return BASE_URLS[process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox'];
}

/** Public URL Daraja should POST results to, including the shared secret path segment. */
function callbackUrl() {
  const { MPESA_CALLBACK_BASE_URL, MPESA_CALLBACK_SECRET } = process.env;
  if (!MPESA_CALLBACK_BASE_URL || !MPESA_CALLBACK_SECRET) return UNREACHABLE_CALLBACK_URL;
  return `${MPESA_CALLBACK_BASE_URL.replace(/\/$/, '')}/api/payments/mpesa/callback/${MPESA_CALLBACK_SECRET}`;
}

class MpesaError extends Error {}

async function darajaRequest(path, options) {
  const response = await fetch(`${baseUrl()}${path}`, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new MpesaError(data?.errorMessage || `Daraja request failed with status ${response.status}`);
    error.code = data?.errorCode;
    throw error;
  }
  return data;
}

async function getAccessToken() {
  // Tokens last an hour; refresh a minute early.
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) return cachedToken.token;

  const credentials = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const data = await darajaRequest('/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${credentials}` },
  });
  cachedToken = { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in) * 1000 };
  return cachedToken.token;
}

/** Daraja timestamps are YYYYMMDDHHmmss in Kenyan time. */
function timestamp(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

function credentialsFor(time) {
  const shortcode = process.env.MPESA_SHORTCODE;
  return {
    BusinessShortCode: shortcode,
    Password: Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${time}`).toString('base64'),
    Timestamp: time,
  };
}

async function authorizedPost(path, body) {
  const token = await getAccessToken();
  return darajaRequest(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Normalises Kenyan mobile numbers (07…, 01…, +2547…, 2547…, 7…) to 2547XXXXXXXX / 2541XXXXXXXX.
 * Returns null when the number isn't a valid Safaricom-style mobile number.
 */
function normalizePhone(input) {
  const digits = String(input ?? '').replace(/\D/g, '');
  const local = digits.startsWith('254') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  return /^[71]\d{8}$/.test(local) ? `254${local}` : null;
}

/** Sends the PIN prompt to the customer's phone. Amount must be a whole number of shillings. */
async function stkPush({ phone, amount, accountReference, description }) {
  const data = await authorizedPost('/mpesa/stkpush/v1/processrequest', {
    ...credentialsFor(timestamp()),
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: callbackUrl(),
    // Daraja limits: AccountReference 12 chars, TransactionDesc 13 chars.
    AccountReference: accountReference.slice(0, 12),
    TransactionDesc: description.slice(0, 13),
  });
  return { checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID };
}

/**
 * Asks Daraja how an STK push ended. Returns { state: 'pending' | 'success' | 'failed', code, desc }.
 */
async function queryStkStatus(checkoutRequestId) {
  try {
    const data = await authorizedPost('/mpesa/stkpushquery/v1/query', {
      ...credentialsFor(timestamp()),
      CheckoutRequestID: checkoutRequestId,
    });
    const code = String(data.ResultCode);
    if (PENDING_RESULT_CODES.has(code)) return { state: 'pending', code, desc: data.ResultDesc };
    return { state: code === '0' ? 'success' : 'failed', code, desc: data.ResultDesc };
  } catch (error) {
    // Daraja answers 500.001.1001 "The transaction is being processed" while the prompt is open.
    if (error instanceof MpesaError && error.code === '500.001.1001') {
      return { state: 'pending', code: error.code, desc: error.message };
    }
    throw error;
  }
}

/** Pulls the fields we keep out of a Daraja STK callback body. */
function parseCallback(body) {
  const callback = body?.Body?.stkCallback;
  if (!callback) return null;
  const items = Object.fromEntries((callback.CallbackMetadata?.Item ?? []).map((item) => [item.Name, item.Value]));
  return {
    checkoutRequestId: callback.CheckoutRequestID,
    code: String(callback.ResultCode),
    desc: callback.ResultDesc,
    receipt: items.MpesaReceiptNumber ?? null,
    amount: items.Amount ?? null,
  };
}

module.exports = { MpesaError, isMpesaConfigured, normalizePhone, stkPush, queryStkStatus, parseCallback };
