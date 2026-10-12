const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { ROLES, SHOP_ROLES } = require('../utils/roles');
const { getSettings } = require('../utils/settings');
const { getRoute } = require('../utils/routing');

const router = express.Router();
const prisma = new PrismaClient();

// A position older than this is shown as "last seen" rather than live.
const STALE_AFTER_MS = 5 * 60 * 1000;
// Riders not heard from for this long are left off the admin map.
const OFFLINE_AFTER_MS = 30 * 60 * 1000;
const ACTIVE_STATUSES = ['pending_pickup', 'picked_up', 'processing', 'ready', 'out_for_delivery'];

const orderRef = (id) => `#PL-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
const customerPoint = (order) => (order.pickup_lat != null && order.pickup_lng != null ? { lat: order.pickup_lat, lng: order.pickup_lng } : null);

const presentLocation = (location) =>
  location
    ? {
        lat: location.lat,
        lng: location.lng,
        accuracy_m: location.accuracy_m,
        heading: location.heading,
        updated_at: location.updated_at,
        stale: Date.now() - location.updated_at.getTime() > STALE_AFTER_MS,
      }
    : null;

/**
 * Where the rider holding this order is heading: the customer to collect, the shop to fetch
 * clean clothes, or the customer to deliver.
 */
function riderDestination(order, shop) {
  if (order.status === 'pending_pickup') return { kind: 'customer', point: customerPoint(order) };
  if (order.status === 'ready') return { kind: 'shop', point: shop ? { lat: shop.lat, lng: shop.lng } : null };
  if (order.status === 'out_for_delivery') return { kind: 'customer', point: customerPoint(order) };
  return null;
}

function validPoint(lat, lng) {
  return Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lng) && Math.abs(lng) <= 180;
}

// rider: share the phone's current position (sent every few seconds while they have jobs)
router.put('/me/location', requireAuth, requireRole(ROLES.RIDER), async (req, res) => {
  try {
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (!validPoint(lat, lng)) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    const optional = (value) => (Number.isFinite(Number(value)) && value !== null ? Number(value) : null);
    const data = { lat, lng, accuracy_m: optional(req.body.accuracy_m), heading: optional(req.body.heading) };

    await prisma.riderLocation.upsert({ where: { rider_id: req.user.userId }, create: { rider_id: req.user.userId, ...data }, update: data });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to save location', details: error.message });
  }
});

// rider: stop sharing (goes off the maps straight away)
router.delete('/me/location', requireAuth, requireRole(ROLES.RIDER), async (req, res) => {
  try {
    await prisma.riderLocation.deleteMany({ where: { rider_id: req.user.userId } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop sharing location', details: error.message });
  }
});

// rider: road route with turn-by-turn steps from where they are to their next stop for a job.
// ?lat&lng = current position (falls back to the last shared one).
router.get('/jobs/:orderId/route', requireAuth, requireRole(ROLES.RIDER), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order || order.assigned_rider_id !== req.user.userId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const { shop } = await getSettings();
    const destination = riderDestination(order, shop);
    if (!destination?.point) {
      return res.status(400).json({ error: 'This job has no destination on the map yet' });
    }

    let from = { lat: Number(req.query.lat), lng: Number(req.query.lng) };
    if (!validPoint(from.lat, from.lng)) {
      const saved = await prisma.riderLocation.findUnique({ where: { rider_id: req.user.userId } });
      from = saved ? { lat: saved.lat, lng: saved.lng } : null;
    }
    if (!from) {
      return res.status(400).json({ error: 'Turn on location sharing to get directions' });
    }

    res.json({
      destination: { kind: destination.kind, ...destination.point, address: destination.kind === 'shop' ? shop.address : order.pickup_address },
      route: await getRoute(from, destination.point, { steps: true }),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get directions', details: error.message });
  }
});

// customer: live view of the rider coming to collect or deliver their order
router.get('/orders/:orderId', requireAuth, requireRole(ROLES.CUSTOMER), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { assignedRider: { select: { first_name: true, location: true } } },
    });
    if (!order || order.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { shop } = await getSettings();
    const home = customerPoint(order);
    const base = { home, shop: shop ? { lat: shop.lat, lng: shop.lng } : null };

    // The rider's position is only shared while they are on their way to this customer.
    const onTheWay = order.assigned_rider_id && ['pending_pickup', 'out_for_delivery'].includes(order.status);
    if (!onTheWay) {
      return res.json({ ...base, active: false });
    }

    const rider = presentLocation(order.assignedRider.location);
    const route = rider && home && !rider.stale ? await getRoute(rider, home) : null;
    res.json({
      ...base,
      active: true,
      phase: order.status === 'pending_pickup' ? 'pickup' : 'delivery',
      rider: { first_name: order.assignedRider.first_name, location: rider },
      route,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load tracking', details: error.message });
  }
});

// shop/admin: every rider on shift and every active order, for the dispatch map
router.get('/live', requireAuth, requireRole(...SHOP_ROLES), async (req, res) => {
  try {
    const [{ shop }, locations, orders] = await Promise.all([
      getSettings(),
      prisma.riderLocation.findMany({
        where: { updated_at: { gt: new Date(Date.now() - OFFLINE_AFTER_MS) } },
        include: { rider: { select: { id: true, first_name: true, last_name: true, phone: true } } },
      }),
      prisma.order.findMany({
        where: { status: { in: ACTIVE_STATUSES } },
        select: {
          id: true,
          status: true,
          pickup_address: true,
          pickup_lat: true,
          pickup_lng: true,
          assigned_rider_id: true,
          payment_status: true,
          user: { select: { first_name: true, last_name: true } },
        },
      }),
    ]);

    res.json({
      shop,
      riders: locations.map((location) => ({
        id: location.rider.id,
        name: `${location.rider.first_name} ${location.rider.last_name}`.trim(),
        phone: location.rider.phone,
        location: presentLocation(location),
        jobs: orders
          .filter((order) => order.assigned_rider_id === location.rider_id)
          .map((order) => ({ order_id: order.id, ref: orderRef(order.id), status: order.status })),
      })),
      orders: orders
        .filter((order) => customerPoint(order))
        .map((order) => ({
          id: order.id,
          ref: orderRef(order.id),
          status: order.status,
          payment_status: order.payment_status,
          address: order.pickup_address,
          customer: `${order.user.first_name} ${order.user.last_name}`.trim(),
          assigned_rider_id: order.assigned_rider_id,
          ...customerPoint(order),
        })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load live map', details: error.message });
  }
});

module.exports = router;
