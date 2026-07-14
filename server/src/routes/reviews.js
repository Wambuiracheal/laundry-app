const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        order: true,
        user: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: { order: true, user: true },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review', details: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { order_id, user_id, rating, comment } = req.body;

    const review = await prisma.review.create({
      data: {
        order_id,
        user_id,
        rating,
        comment,
      },
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review', details: error.message });
  }
});

module.exports = router;
