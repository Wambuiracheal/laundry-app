const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const prisma = require("../utils/prisma");

const RESET_TOKEN_EXPIRES_MINUTES = 60;
const GENERIC_RESET_MESSAGE = "If an account exists for that email, password reset instructions have been sent.";

function isBlank(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
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

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always respond the same way whether or not the account exists, so callers
    // can't use this endpoint to enumerate registered emails.
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

      await prisma.passwordResetRequest.create({
        data: {
          email: normalizedEmail,
          user_id: user.id,
          token_hash: hashToken(rawToken),
          expires_at: expiresAt,
          status: "pending",
        },
      });

      const resetLink = `${process.env.CLIENT_URL ?? "http://localhost:3000"}/reset-password?token=${rawToken}`;
      // No email provider is wired up yet — log the link so it can be used manually
      // during development. Replace this line with a real send when one is added.
      console.log("[password-reset] link for", normalizedEmail, "->", resetLink);
    }

    return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    return res.status(500).json({ error: "Failed to request password reset", details: error.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.validatedResetPassword;

    const resetRequest = await prisma.passwordResetRequest.findUnique({
      where: { token_hash: hashToken(token) },
    });

    if (!resetRequest || resetRequest.used || !resetRequest.expires_at || resetRequest.expires_at < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRequest.user_id },
        data: { password_hash: hashedPassword },
      }),
      prisma.passwordResetRequest.update({
        where: { id: resetRequest.id },
        data: { used: true, status: "used" },
      }),
      prisma.refreshToken.updateMany({
        where: { user_id: resetRequest.user_id, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return res.status(200).json({ message: "Password updated. You can now log in with your new password." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to reset password", details: error.message });
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
  resetPassword,
  reschedulePickup,
  cancelPickup,
  cancelOrder,
};
