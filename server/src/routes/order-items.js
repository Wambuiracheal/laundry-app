const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// get all order items
router.get('/', async (req, res) => {
  try {
    const items = await prisma.orderItem.findMany({
      include: { order: true, service: true },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order items', details: error.message });
  }
});

// get a specific order item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: req.params.id },
      include: { order: true, service: true },
    });

    if (!item) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order item', details: error.message });
  }
});

// create a new order item
router.post('/', async (req, res) => {
  try {
    const { order_id, service_id, quantity, price } = req.body;

    const item = await prisma.orderItem.create({
      data: {
        order_id,
        service_id,
        quantity,
        price,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order item', details: error.message });
  }
});

// update an existing order item
router.put('/:id', async (req, res) => {
  try {
    const item = await prisma.orderItem.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order item', details: error.message });
  }
});

// delete an order item
router.delete('/:id', async (req, res) => {
  try {
    await prisma.orderItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Order item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order item', details: error.message });
  }
});

module.exports = router;
