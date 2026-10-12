const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Defaults used until an admin saves a value.
const DEFAULTS = {
  rider_rate_per_km: '100',
  shop_address: '',
  shop_lat: '',
  shop_lng: '',
};

/** Typed view of the settings, e.g. { riderRatePerKm: 100, shop: { address, lat, lng } | null }. */
async function getSettings(db = prisma) {
  const rows = await db.setting.findMany();
  const values = { ...DEFAULTS, ...Object.fromEntries(rows.map((row) => [row.key, row.value])) };
  const lat = Number.parseFloat(values.shop_lat);
  const lng = Number.parseFloat(values.shop_lng);

  return {
    riderRatePerKm: Number(values.rider_rate_per_km),
    shop: Number.isFinite(lat) && Number.isFinite(lng) ? { address: values.shop_address, lat, lng } : null,
  };
}

/** Saves the given raw string values (keys must be known settings). */
async function saveSettings(values, db = prisma) {
  const entries = Object.entries(values).filter(([key]) => key in DEFAULTS);
  await Promise.all(
    entries.map(([key, value]) =>
      db.setting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } }),
    ),
  );
  return getSettings(db);
}

module.exports = { getSettings, saveSettings };
