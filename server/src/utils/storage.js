// Private Firebase Storage bucket for order photos (e.g. damage found at intake).
// Uploads go through the API with the Admin SDK; browsers only ever get short-lived signed URLs.
const crypto = require('node:crypto');

const SIGNED_URL_TTL_MS = 60 * 60 * 1000;
// Reuse a signed URL until it is this close to expiring, so polling clients keep the same
// URL (and their cached image) instead of re-downloading the photo on every refresh.
const SIGNED_URL_REFRESH_MARGIN_MS = 10 * 60 * 1000;

const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

let bucket = null;
const signedUrlCache = new Map();

function isStorageConfigured() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET } = process.env;
  return Boolean(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY && FIREBASE_STORAGE_BUCKET);
}

function getBucket() {
  if (bucket) return bucket;
  if (!isStorageConfigured()) {
    throw new Error('Firebase Storage is not configured');
  }

  // Loaded lazily so the API starts (and everything else works) without Firebase set up.
  const { initializeApp, cert } = require('firebase-admin/app');
  const { getStorage } = require('firebase-admin/storage');

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // .env files store the key on one line with literal "\n" sequences.
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  bucket = getStorage(app).bucket();
  return bucket;
}

/** Uploads an image under `folder` and returns its object path. */
async function uploadImage(folder, buffer, contentType) {
  const extension = IMAGE_TYPES[contentType];
  if (!extension) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }

  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  await getBucket().file(path).save(buffer, {
    contentType,
    resumable: false,
    metadata: { cacheControl: 'private, max-age=3600' },
  });
  return path;
}

async function getSignedImageUrl(path) {
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt - Date.now() > SIGNED_URL_REFRESH_MARGIN_MS) {
    return cached.url;
  }

  const expiresAt = Date.now() + SIGNED_URL_TTL_MS;
  const [url] = await getBucket().file(path).getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt });
  signedUrlCache.set(path, { url, expiresAt });
  return url;
}

async function deleteImage(path) {
  signedUrlCache.delete(path);
  await getBucket().file(path).delete({ ignoreNotFound: true });
}

module.exports = { IMAGE_TYPES, isStorageConfigured, uploadImage, getSignedImageUrl, deleteImage };
