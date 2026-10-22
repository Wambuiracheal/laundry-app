const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

router.post('/support', async (req, res) => {
  try {
    const { fullName, email, orderId, message } = req.body;

    if (isBlank(fullName) || isBlank(email) || isBlank(message)) {
      return res.status(400).json({ error: 'fullName, email, and message are required.' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        order_ref: typeof orderId === 'string' ? orderId.trim() : '',
        message: message.trim(),
      },
    });

    return res.status(201).json({
      ticketId: ticket.id,
      status: ticket.status,
      message: 'Support ticket submitted successfully.',
      createdAt: ticket.created_at,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit support ticket', details: error.message });
  }
});

module.exports = router;
