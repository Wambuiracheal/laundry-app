const express = require('express');
const { validateResetPasswordRequest } = require('../middlewares/validator');
const {
  submitSupportTicket,
  requestPasswordReset,
  resetPassword,
  reschedulePickup,
  cancelPickup,
  cancelOrder,
} = require('../controllers/actionsController');

const router = express.Router();

router.post('/support', submitSupportTicket);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', validateResetPasswordRequest, resetPassword);
router.post('/reschedule', reschedulePickup);
router.post('/cancel-pickup', cancelPickup);
router.post('/cancel-order', cancelOrder);

module.exports = router;
