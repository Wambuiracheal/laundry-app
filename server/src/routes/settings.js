const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { ROLES } = require('../utils/roles');
const { PrismaClient } = require('@prisma/client');
const { getSettings, saveSettings } = require('../utils/settings');
const { backfillDeliveryFees } = require('../utils/deliveryFee');

const router = express.Router();
const prisma = new PrismaClient();

const MAX_RATE_PER_KM = 10000;

router.use(requireAuth, requireRole(ROLES.ADMIN));

// admin: rider pay rate and the shop location trips are measured from
router.get('/', async (req, res) => {
  try {
    res.json(await getSettings());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
  }
});

router.patch('/', async (req, res) => {
  try {
    const { rider_rate_per_km, shop } = req.body;
    const values = {};

    if (rider_rate_per_km !== undefined) {
      const rate = Number(rider_rate_per_km);
      if (!Number.isFinite(rate) || rate < 0 || rate > MAX_RATE_PER_KM) {
        return res.status(400).json({ error: `Rate must be between 0 and ${MAX_RATE_PER_KM} KES per km` });
      }
      values.rider_rate_per_km = Math.round(rate * 100) / 100;
    }

    if (shop !== undefined) {
      const lat = Number(shop?.lat);
      const lng = Number(shop?.lng);
      const address = typeof shop?.address === 'string' ? shop.address.trim() : '';
      if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180 || !address || address.length > 191) {
        return res.status(400).json({ error: 'Pick the shop address from the suggestions so we have its location' });
      }
      Object.assign(values, { shop_address: address, shop_lat: lat, shop_lng: lng });
    }

    if (Object.keys(values).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    const settings = await saveSettings(values);
    // Orders placed before the shop location was known get their delivery fee from the map now.
    const backfill = shop !== undefined ? await backfillDeliveryFees(prisma) : null;
    res.json({ ...settings, backfill });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings', details: error.message });
  }
});

module.exports = router;
