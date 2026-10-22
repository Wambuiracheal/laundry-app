const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { ROLES } = require('../utils/roles');
const { normalizePhone } = require('../utils/mpesa');
const { isSmsConfigured } = require('../utils/sms');

const router = express.Router();
const prisma = new PrismaClient();

const FEED_LIMIT = 50;

// Order updates go to customers only.
router.use(requireAuth, requireRole(ROLES.CUSTOMER));

// customer: latest order updates, newest first, plus how many are unread
router.get('/mine', async (req, res) => {
  try {
    const where = { user_id: req.user.userId };
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        select: { id: true, order_id: true, event: true, message: true, sms_status: true, read_at: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: FEED_LIMIT,
      }),
      prisma.notification.count({ where: { ...where, read_at: null } }),
    ]);
    res.json({ notifications, unread });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
});

// customer: mark every update as read
router.post('/read', async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { user_id: req.user.userId, read_at: null }, data: { read_at: new Date() } });
    res.json({ unread: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications as read', details: error.message });
  }
});

const presentPreferences = (user) => ({
  phone: user.phone,
  sms_opt_in: user.sms_opt_in,
  // Lets the app warn when texts can't reach this number.
  phone_valid: normalizePhone(user.phone) !== null,
  sms_available: isSmsConfigured(),
});

// customer: SMS settings
router.get('/preferences', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { phone: true, sms_opt_in: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(presentPreferences(user));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch preferences', details: error.message });
  }
});

// customer: turn texts on/off and/or change the number they go to
router.patch('/preferences', async (req, res) => {
  try {
    const data = {};
    if (req.body.sms_opt_in !== undefined) {
      if (typeof req.body.sms_opt_in !== 'boolean') return res.status(400).json({ error: 'sms_opt_in must be true or false' });
      data.sms_opt_in = req.body.sms_opt_in;
    }
    if (req.body.phone !== undefined) {
      const phone = normalizePhone(req.body.phone);
      if (!phone) return res.status(400).json({ error: 'Enter a Kenyan mobile number, e.g. 0712 345 678' });
      data.phone = `+${phone}`;
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nothing to update' });

    const user = await prisma.user.update({ where: { id: req.user.userId }, data, select: { phone: true, sms_opt_in: true } });
    res.json(presentPreferences(user));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences', details: error.message });
  }
});

module.exports = router;
