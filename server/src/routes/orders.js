const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// get all orders
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order', details: error.message });
  }
});

module.exports = router;
