const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { getCachedValue, cacheValue, deleteCacheValue } = require('../utils/redis');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { ROLES } = require('../utils/roles');
const router = express.Router();
const prisma = new PrismaClient();

const SERVICES_CACHE_KEY = 'services:all';
const PRICE_TYPES = ['per_kg', 'per_item', 'fixed'];
const MAX_BASE_PRICE = 1000000;

// GET all services (Wash & Fold, etc.)
router.get('/', async (req, res) => {
  try {
    const cacheKey = SERVICES_CACHE_KEY;
    const cached = await getCachedValue(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    console.log("--- Request received for /api/services ---");
    console.log("Connecting to database...");
    const services = await prisma.service.findMany();
    console.log("Database query successful. Number of services:", services.length);

    await cacheValue(cacheKey, services, 60);
    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Failed to fetch services", details: error.message });
  }
});

// admin: change a service's rate, pricing unit or description. Items already weighed keep the
// price they were charged; the new rate applies to anything measured from now on.
router.patch('/:id', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const { base_price, price_type, description } = req.body;
    const data = {};

    if (base_price !== undefined) {
      const price = Number(base_price);
      if (!Number.isFinite(price) || price < 0 || price > MAX_BASE_PRICE) {
        return res.status(400).json({ error: `Price must be between 0 and ${MAX_BASE_PRICE} KES` });
      }
      data.base_price = Math.round(price * 100) / 100;
    }

    if (price_type !== undefined) {
      if (!PRICE_TYPES.includes(price_type)) {
        return res.status(400).json({ error: `Pricing unit must be one of: ${PRICE_TYPES.join(', ')}` });
      }
      data.price_type = price_type;
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.length > 191) {
        return res.status(400).json({ error: 'Description must be text of up to 191 characters' });
      }
      data.description = description.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = await prisma.service.update({ where: { id: existing.id }, data });
    // Customers must see the new rate immediately, not after the cache expires.
    await deleteCacheValue(SERVICES_CACHE_KEY);
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service', details: error.message });
  }
});

module.exports = router;