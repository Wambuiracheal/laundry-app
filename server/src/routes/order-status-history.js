const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// get all order status history
router.get('/', async (req, res) => {
  try {
    const history = await prisma.orderStatusHistory.findMany({
      include: { order: true },
      orderBy: { timestamp: 'desc' },
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order status history', details: error.message });
  }
});

// get a specific order status history item by ID
router.get('/:id', async (req, res) => {
  try {
    const historyItem = await prisma.orderStatusHistory.findUnique({
      where: { id: req.params.id },
      include: { order: true },
    });

    if (!historyItem) {
      return res.status(404).json({ error: 'Order status history item not found' });
    }

    res.json(historyItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order status history item', details: error.message });
  }
});

// create a new order status history item
router.post('/', async (req, res) => {
  try {
    const { order_id, status, changed_by } = req.body;

    const historyItem = await prisma.orderStatusHistory.create({
      data: {
        order_id,
        status,
        changed_by,
      },
    });

    res.status(201).json(historyItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order status history item', details: error.message });
  }
});

// update an existing order status history item
router.put('/:id', async (req, res) => {
  try {
    const historyItem = await prisma.orderStatusHistory.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(historyItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status history item', details: error.message });
  }
});

// Delete an order status history item
router.delete('/:id', async (req, res) => {
  try {
    await prisma.orderStatusHistory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Order status history item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order status history item', details: error.message });
  }
});

module.exports = router;
