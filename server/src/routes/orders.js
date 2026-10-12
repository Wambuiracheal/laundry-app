const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth');
const multer = require('multer');
const { publishEvent } = require('../utils/redis');
const { IMAGE_TYPES, isStorageConfigured, uploadImage, getSignedImageUrl, deleteImage } = require('../utils/storage');
const { ROLES, SHOP_ROLES } = require('../utils/roles');

const router = express.Router();
const prisma = new PrismaClient();

const ORDER_STATUSES = ['pending_pickup', 'picked_up', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
const MAX_WEIGHT_KG = 500;
const MAX_ITEM_COUNT = 1000;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_DAMAGE_NOTE_LENGTH = 1000;
const MAX_HOUSE_DETAILS_LENGTH = 191;
const MAX_DELIVERY_INSTRUCTIONS_LENGTH = 500;
// Damage must be recorded at intake, before (or while) the clothes are washed.
const DAMAGE_LOG_STATUSES = ['picked_up', 'processing'];

const trackedOrderInclude = {
  orderItems: { include: { service: true } },
  statusHistory: { orderBy: { timestamp: 'asc' } },
  damages: { orderBy: { created_at: 'asc' } },
};

// Rider jobs: pickups waiting at the customer, and priced orders waiting to go back.
const RIDER_CLAIMABLE_STATUSES = ['pending_pickup', 'ready'];
const RIDER_ACTIVE_STATUSES = ['pending_pickup', 'ready', 'out_for_delivery'];
const RIDER_TRANSITIONS = { pending_pickup: 'picked_up', ready: 'out_for_delivery', out_for_delivery: 'delivered' };

const riderJobInclude = {
  orderItems: { include: { service: true } },
  user: { select: { first_name: true, last_name: true, phone: true } },
};

// Open jobs are visible to every rider, so customer contact details stay hidden until one accepts.
const openJobInclude = {
  orderItems: { include: { service: true } },
  user: { select: { first_name: true } },
};

// Shop queue: order details plus the customer and the rider holding it.
const queueInclude = {
  ...trackedOrderInclude,
  user: { select: { first_name: true, last_name: true, phone: true, email: true } },
  assignedRider: { select: { id: true, first_name: true, last_name: true, phone: true } },
};

// Damage photos are private: swap each stored path for a short-lived signed URL.
async function presentOrder(order) {
  if (!order?.damages) return order;
  const damages = await Promise.all(
    order.damages.map(async ({ photo_path, ...damage }) => ({
      ...damage,
      photo_url: photo_path && isStorageConfigured() ? await getSignedImageUrl(photo_path).catch(() => null) : null,
    })),
  );
  return { ...order, damages };
}

const presentOrders = (orders) => Promise.all(orders.map(presentOrder));

// Single image upload for damage reports, held in memory and passed on to Firebase.
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_TYPES[file.mimetype]) return cb(null, true);
    return cb(new Error('Photos must be JPEG, PNG or WebP images'));
  },
}).single('photo');

const parsePhotoUpload = (req, res, next) =>
  photoUpload(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE' ? `Photos must be under ${MAX_PHOTO_BYTES / 1024 / 1024} MB` : error.message;
    return res.status(400).json({ error: message });
  });

const roundMoney = (value) => Math.round(value * 100) / 100;

// Best effort: a missing Redis connection must not fail the request.
const notifyOrderUpdated = (order) =>
  publishEvent('laundry-events', { type: 'order.updated', orderId: order.id, status: order.status }).catch(() => undefined);

// customer: request a pickup. Only the services are chosen here; the shop weighs/counts
// the clothes on arrival and prices each item via PATCH /:id/measure.
router.post('/request', requireAuth, requireRole(ROLES.CUSTOMER), async (req, res) => {
  try {
    const { service_ids, pickup_address, pickup_lat, pickup_lng, pickup_time, notes, house_details, delivery_instructions } = req.body;

    const serviceIds = Array.isArray(service_ids) ? [...new Set(service_ids.filter((id) => typeof id === 'string'))] : [];
    if (serviceIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one service' });
    }

    const address = typeof pickup_address === 'string' ? pickup_address.trim() : '';
    if (!address || address.length > 191) {
      return res.status(400).json({ error: 'A pickup address of up to 191 characters is required' });
    }

    // Optional: present when the customer picked an address suggestion from the map search.
    const hasCoords = pickup_lat != null || pickup_lng != null;
    const lat = Number(pickup_lat);
    const lng = Number(pickup_lng);
    if (hasCoords && !(Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lng) && Math.abs(lng) <= 180)) {
      return res.status(400).json({ error: 'Invalid pickup coordinates' });
    }

    const pickupTime = new Date(pickup_time);
    if (Number.isNaN(pickupTime.getTime()) || pickupTime < new Date()) {
      return res.status(400).json({ error: 'Choose a pickup time in the future' });
    }

    const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';
    if (trimmedNotes.length > 1000) {
      return res.status(400).json({ error: 'Notes must be 1000 characters or fewer' });
    }

    const houseDetails = typeof house_details === 'string' ? house_details.trim() : '';
    if (houseDetails.length > MAX_HOUSE_DETAILS_LENGTH) {
      return res.status(400).json({ error: `House/gate details must be ${MAX_HOUSE_DETAILS_LENGTH} characters or fewer` });
    }

    const deliveryInstructions = typeof delivery_instructions === 'string' ? delivery_instructions.trim() : '';
    if (deliveryInstructions.length > MAX_DELIVERY_INSTRUCTIONS_LENGTH) {
      return res.status(400).json({ error: `Rider directions must be ${MAX_DELIVERY_INSTRUCTIONS_LENGTH} characters or fewer` });
    }

    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
    if (services.length !== serviceIds.length) {
      return res.status(400).json({ error: 'One or more selected services do not exist' });
    }

    const order = await prisma.order.create({
      data: {
        user_id: req.user.userId,
        pickup_address: address,
        pickup_lat: hasCoords ? lat : null,
        pickup_lng: hasCoords ? lng : null,
        pickup_time: pickupTime,
        notes: trimmedNotes || null,
        house_details: houseDetails || null,
        delivery_instructions: deliveryInstructions || null,
        status: 'pending_pickup',
        payment_status: 'pending',
        orderItems: { create: services.map((service) => ({ service_id: service.id, quantity: 0 })) },
        statusHistory: { create: { status: 'pending_pickup', changed_by: req.user.role || 'customer' } },
      },
      include: trackedOrderInclude,
    });

    notifyOrderUpdated(order);
    res.status(201).json(await presentOrder(order));
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// customer: their own orders, newest first
router.get('/mine', requireAuth, requireRole(ROLES.CUSTOMER), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { user_id: req.user.userId },
      include: trackedOrderInclude,
      orderBy: { created_at: 'desc' },
    });
    res.json(await presentOrders(orders));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

// shop staff: every order that is still in progress
router.get('/queue', requireAuth, requireRole(...SHOP_ROLES), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { notIn: ['delivered', 'cancelled'] } },
      include: queueInclude,
      orderBy: { created_at: 'asc' },
    });
    res.json(await presentOrders(orders));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order queue', details: error.message });
  }
});

// shop staff: riders and how many jobs each is holding, for dispatch
router.get('/riders', requireAuth, requireRole(...SHOP_ROLES), async (req, res) => {
  try {
    const riders = await prisma.user.findMany({
      where: { role: ROLES.RIDER },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone: true,
        _count: { select: { assignedOrders: { where: { status: { in: RIDER_ACTIVE_STATUSES } } } } },
      },
      orderBy: { first_name: 'asc' },
    });
    res.json(riders.map(({ _count, ...rider }) => ({ ...rider, active_jobs: _count.assignedOrders })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch riders', details: error.message });
  }
});

// shop staff: assign a rider to a pickup/delivery, reassign it, or send it back to the open pool
router.patch('/:id/assign', requireAuth, requireRole(...SHOP_ROLES), async (req, res) => {
  try {
    const riderId = req.body.rider_id ?? null;
    if (riderId !== null && typeof riderId !== 'string') {
      return res.status(400).json({ error: 'rider_id must be a rider id or null' });
    }

    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!RIDER_ACTIVE_STATUSES.includes(existing.status)) {
      return res.status(400).json({ error: 'Riders can only be assigned while an order is awaiting pickup, ready or out for delivery' });
    }
    if (existing.status === 'out_for_delivery' && riderId === null) {
      return res.status(400).json({ error: 'An order out for delivery must stay with a rider; reassign it instead' });
    }

    if (riderId !== null) {
      const rider = await prisma.user.findUnique({ where: { id: riderId } });
      if (!rider || rider.role !== ROLES.RIDER) {
        return res.status(400).json({ error: 'That user is not a rider' });
      }
    }

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: { assigned_rider_id: riderId },
      include: queueInclude,
    });

    notifyOrderUpdated(order);
    res.json(await presentOrder(order));
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign rider', details: error.message });
  }
});

// shop staff: log pre-existing damage (stains, tears) with an optional photo, before washing.
// multipart/form-data: note (required), order_item_id (optional), photo (optional image).
router.post('/:id/damages', requireAuth, requireRole(...SHOP_ROLES), parsePhotoUpload, async (req, res) => {
  let photoPath = null;
  try {
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
    if (!note || note.length > MAX_DAMAGE_NOTE_LENGTH) {
      return res.status(400).json({ error: `Describe the damage in up to ${MAX_DAMAGE_NOTE_LENGTH} characters` });
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { orderItems: true } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!DAMAGE_LOG_STATUSES.includes(order.status)) {
      return res.status(400).json({ error: 'Damage can only be logged while the clothes are at the shop' });
    }

    const itemId = req.body.order_item_id || null;
    if (itemId && !order.orderItems.some((item) => item.id === itemId)) {
      return res.status(400).json({ error: 'That item does not belong to this order' });
    }

    if (req.file) {
      if (!isStorageConfigured()) {
        return res.status(503).json({ error: 'Photo storage (Firebase) is not set up yet. Save the note without a photo for now.' });
      }
      photoPath = await uploadImage(`orders/${order.id}/damage`, req.file.buffer, req.file.mimetype);
    }

    await prisma.damageReport.create({
      data: { order_id: order.id, order_item_id: itemId, note, photo_path: photoPath, created_by: req.user.userId },
    });

    const updated = await prisma.order.findUnique({ where: { id: order.id }, include: queueInclude });
    notifyOrderUpdated(updated);
    res.status(201).json(await presentOrder(updated));
  } catch (error) {
    // Do not leave an orphaned photo in the bucket if saving the record failed.
    if (photoPath) await deleteImage(photoPath).catch(() => undefined);
    res.status(500).json({ error: 'Failed to log damage', details: error.message });
  }
});

// shop staff: remove a damage entry logged by mistake (and its photo)
router.delete('/:id/damages/:damageId', requireAuth, requireRole(...SHOP_ROLES), async (req, res) => {
  try {
    const damage = await prisma.damageReport.findUnique({ where: { id: req.params.damageId } });
    if (!damage || damage.order_id !== req.params.id) {
      return res.status(404).json({ error: 'Damage entry not found' });
    }

    await prisma.damageReport.delete({ where: { id: damage.id } });
    if (damage.photo_path && isStorageConfigured()) {
      await deleteImage(damage.photo_path).catch((error) => console.warn('Photo delete failed:', error.message));
    }

    const updated = await prisma.order.findUnique({ where: { id: req.params.id }, include: queueInclude });
    notifyOrderUpdated(updated);
    res.json(await presentOrder(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove damage entry', details: error.message });
  }
});

// shop staff: record the measured weight (per-kg services) or item count (per-item services)
// and recompute each item's price and the order total.
router.patch('/:id/measure', requireAuth, requireRole(...SHOP_ROLES), async (req, res) => {
  try {
    const updates = Array.isArray(req.body.items) ? req.body.items : [];
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Provide at least one item measurement' });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { orderItems: { include: { service: true } } },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemData = new Map();
    for (const update of updates) {
      const item = order.orderItems.find((orderItem) => orderItem.id === update.id);
      if (!item) {
        return res.status(400).json({ error: `Item ${update.id} does not belong to this order` });
      }

      const rate = Number(item.service.base_price ?? 0);
      if (item.service.price_type === 'per_kg') {
        const weight = Number(update.weight_kg);
        if (!Number.isFinite(weight) || weight < 0 || weight > MAX_WEIGHT_KG) {
          return res.status(400).json({ error: `Enter a weight between 0 and ${MAX_WEIGHT_KG} kg for ${item.service.name}` });
        }
        itemData.set(item.id, { weight_kg: weight, quantity: 0, price: roundMoney(rate * weight) });
      } else if (item.service.price_type === 'fixed') {
        itemData.set(item.id, { quantity: 1, price: roundMoney(rate) });
      } else {
        const quantity = Number(update.quantity);
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_ITEM_COUNT) {
          return res.status(400).json({ error: `Enter a whole number of items for ${item.service.name}` });
        }
        itemData.set(item.id, { quantity, price: roundMoney(rate * quantity) });
      }
    }

    const prices = order.orderItems.map((item) => (itemData.has(item.id) ? itemData.get(item.id).price : item.price));
    const allMeasured = prices.every((price) => price !== null);
    const total = roundMoney(prices.reduce((sum, price) => sum + Number(price ?? 0), 0));
    const deposit = Number(order.deposit_amount ?? 0);
    // Once everything is weighed the clothes go into the wash.
    const nextStatus = allMeasured && ['pending_pickup', 'picked_up'].includes(order.status) ? 'processing' : order.status;

    const updated = await prisma.$transaction(async (tx) => {
      for (const [id, data] of itemData) {
        await tx.orderItem.update({ where: { id }, data });
      }

      if (nextStatus !== order.status) {
        await tx.orderStatusHistory.create({
          data: { order_id: order.id, status: nextStatus, changed_by: req.user.role },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          total_amount: total,
          remaining_amount: roundMoney(Math.max(total - deposit, 0)),
          status: nextStatus,
        },
        include: trackedOrderInclude,
      });
    });

    notifyOrderUpdated(updated);
    res.json(await presentOrder(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to record measurements', details: error.message });
  }
});

// shop staff: move an order along its lifecycle
router.patch('/:id/status', requireAuth, requireRole(...SHOP_ROLES), async (req, res) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${ORDER_STATUSES.join(', ')}` });
    }

    const existing = await prisma.order.findUnique({ where: { id: req.params.id }, include: { orderItems: true } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (existing.status === status) {
      return res.status(400).json({ error: `Order is already ${status}` });
    }
    // The customer must see a final price before the clothes leave the shop.
    const needsPrice = ['ready', 'out_for_delivery', 'delivered'].includes(status);
    if (needsPrice && existing.orderItems.some((item) => item.price === null)) {
      return res.status(400).json({ error: 'Weigh or count every item before marking the order as ' + status });
    }

    const [, order] = await prisma.$transaction([
      prisma.orderStatusHistory.create({ data: { order_id: existing.id, status, changed_by: req.user.role } }),
      // Once the clothes are at the shop the pickup rider is done with the job.
      prisma.order.update({
        where: { id: existing.id },
        data: { status, ...(status === 'picked_up' ? { assigned_rider_id: null } : {}) },
        include: trackedOrderInclude,
      }),
    ]);

    notifyOrderUpdated(order);
    res.json(await presentOrder(order));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status', details: error.message });
  }
});

// rider: their own pickup/delivery jobs plus unassigned jobs they can accept
router.get('/rider/jobs', requireAuth, requireRole(ROLES.RIDER), async (req, res) => {
  try {
    const [mine, available] = await Promise.all([
      prisma.order.findMany({
        where: { assigned_rider_id: req.user.userId, status: { in: RIDER_ACTIVE_STATUSES } },
        include: riderJobInclude,
        orderBy: { pickup_time: 'asc' },
      }),
      prisma.order.findMany({
        where: { assigned_rider_id: null, status: { in: RIDER_CLAIMABLE_STATUSES } },
        include: openJobInclude,
        orderBy: { pickup_time: 'asc' },
      }),
    ]);
    res.json({ mine, available });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rider jobs', details: error.message });
  }
});

// rider: accept an unassigned pickup or delivery
router.post('/:id/claim', requireAuth, requireRole(ROLES.RIDER), async (req, res) => {
  try {
    // Conditional update so two riders can't claim the same job.
    const { count } = await prisma.order.updateMany({
      where: { id: req.params.id, assigned_rider_id: null, status: { in: RIDER_CLAIMABLE_STATUSES } },
      data: { assigned_rider_id: req.user.userId },
    });
    if (count === 0) {
      return res.status(409).json({ error: 'This job is no longer available' });
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: riderJobInclude });
    notifyOrderUpdated(order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept job', details: error.message });
  }
});

// rider: advance a job they own (picked up -> out for delivery -> delivered)
router.patch('/:id/rider-status', requireAuth, requireRole(ROLES.RIDER), async (req, res) => {
  try {
    const { status } = req.body;
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (existing.assigned_rider_id !== req.user.userId) {
      return res.status(403).json({ error: 'This job is not assigned to you' });
    }
    if (RIDER_TRANSITIONS[existing.status] !== status) {
      return res.status(400).json({ error: `Cannot move an order from ${existing.status} to ${status}` });
    }

    const [, order] = await prisma.$transaction([
      prisma.orderStatusHistory.create({ data: { order_id: existing.id, status, changed_by: req.user.role } }),
      prisma.order.update({
        where: { id: existing.id },
        // Once the clothes reach the shop the pickup job is done; the delivery is claimed separately.
        data: { status, ...(status === 'picked_up' ? { assigned_rider_id: null } : {}) },
        include: riderJobInclude,
      }),
    ]);

    notifyOrderUpdated(order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job', details: error.message });
  }
});

// admin: raw order CRUD

// get all orders
router.get('/', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        assignedRider: true,
        orderItems: true,
        payments: true,
        statusHistory: true,
        reviews: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

// get a specific order by ID
router.get('/:id', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        assignedRider: true,
        orderItems: true,
        payments: true,
        statusHistory: true,
        reviews: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
});

// create a new order
router.post('/', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const {
      user_id,
      pickup_address,
      pickup_lat,
      pickup_lng,
      pickup_time,
      delivery_time,
      status,
      deposit_amount,
      total_amount,
      remaining_amount,
      payment_status,
      assigned_rider_id,
    } = req.body;

    const order = await prisma.order.create({
      data: {
        user_id,
        pickup_address,
        pickup_lat,
        pickup_lng,
        pickup_time,
        delivery_time,
        status,
        deposit_amount,
        total_amount,
        remaining_amount,
        payment_status,
        assigned_rider_id,
      },
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// update an existing order
router.put('/:id', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order', details: error.message });
  }
});

// delete an order
router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order', details: error.message });
  }
});

module.exports = router;
