const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { getCachedValue, cacheValue } = require('../lib/redis');
const router = express.Router();
const prisma = new PrismaClient();

// GET all services (Wash & Fold, etc.)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'services:all';
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

module.exports = router;