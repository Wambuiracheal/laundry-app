const prisma = require("../utils/prisma");

function isBlank(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

async function submitSupportTicket(req, res) {
  try {
    const { fullName, email, orderId, message } = req.body;

    if (isBlank(fullName) || isBlank(email) || isBlank(message)) {
      return res.status(400).json({ error: "fullName, email, and message are required." });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        order_ref: typeof orderId === "string" ? orderId.trim() : "",
        message: message.trim(),
      },
    });

    return res.status(201).json({
      ticketId: ticket.id,
      status: ticket.status,
      message: "Support ticket submitted successfully.",
      createdAt: ticket.created_at,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to submit support ticket", details: error.message });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    if (isBlank(email)) {
      return res.status(400).json({ error: "email is required." });
    }

    const resetRequest = await prisma.passwordResetRequest.create({
      data: {
        email: email.trim().toLowerCase(),
      },
    });

    return res.status(200).json({
      requestId: resetRequest.id,
      status: resetRequest.status,
      message: "If the account exists, reset instructions have been queued.",
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to request password reset", details: error.message });
  }
}

async function reschedulePickup(req, res) {
  try {
    const { pickupDate, timeWindow, note } = req.body;

    if (isBlank(pickupDate) || isBlank(timeWindow)) {
      return res.status(400).json({ error: "pickupDate and timeWindow are required." });
    }

    const rescheduleRequest = await prisma.pickupRescheduleRequest.create({
      data: {
        pickup_date: new Date(pickupDate),
        time_window: timeWindow.trim(),
        note: typeof note === "string" ? note.trim() : "",
      },
    });

    return res.status(200).json({
      requestId: rescheduleRequest.id,
      status: rescheduleRequest.status,
      message: "Pickup has been rescheduled.",
      data: {
        pickupDate: rescheduleRequest.pickup_date,
        timeWindow: rescheduleRequest.time_window,
        note: rescheduleRequest.note,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to reschedule pickup", details: error.message });
  }
}

async function cancelPickup(req, res) {
  try {
    const { reason, details, acknowledge } = req.body;

    if (isBlank(reason) || isBlank(details) || !acknowledge) {
      return res.status(400).json({ error: "reason, details, and acknowledge=true are required." });
    }

    const cancellation = await prisma.cancellationRequest.create({
      data: {
        request_type: "pickup",
        reason: reason.trim(),
        details: details.trim(),
        acknowledged: true,
      },
    });

    return res.status(200).json({
      requestId: cancellation.id,
      status: cancellation.status,
      message: "Pickup cancellation request received.",
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to cancel pickup", details: error.message });
  }
}

async function cancelOrder(req, res) {
  try {
    const { reason, details, acknowledge } = req.body;

    if (isBlank(reason) || isBlank(details) || !acknowledge) {
      return res.status(400).json({ error: "reason, details, and acknowledge=true are required." });
    }

    const cancellation = await prisma.cancellationRequest.create({
      data: {
        request_type: "order",
        reason: reason.trim(),
        details: details.trim(),
        acknowledged: true,
      },
    });

    return res.status(200).json({
      requestId: cancellation.id,
      status: cancellation.status,
      message: "Order cancellation request received.",
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to cancel order", details: error.message });
  }
}

module.exports = {
  submitSupportTicket,
  requestPasswordReset,
  reschedulePickup,
  cancelPickup,
  cancelOrder,
};
