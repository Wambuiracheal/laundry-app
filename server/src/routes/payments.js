const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        order: true,
        transaction: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
  }
});

// get a specific payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { order: true, transaction: true },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment', details: error.message });
  }
});

// create a new payment
router.post('/', async (req, res) => {
  try {
    const { order_id, amount, payment_method, transaction_id, status } = req.body;

    const payment = await prisma.payment.create({
      data: {
        order_id,
        amount,
        payment_method,
        transaction_id,
        status,
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
});

// update an existing payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment', details: error.message });
  }
});

// delete a payment
router.delete('/:id', async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete payment', details: error.message });
  }
});

module.exports = router;
