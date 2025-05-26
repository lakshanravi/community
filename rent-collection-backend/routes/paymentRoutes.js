const express = require('express');
const {
  processPaymentByShopId,
  processPaymentByInvoiceId,
} = require('../utils/processPayment');
const {
  authenticateUser,
  authorizeRole,
} = require('../middleware/authMiddleware');
const { Payment } = require('../models');

const router = express.Router();

// Get all payments (accessible by Admin and Super Admin)
router.get('/payments', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const payments = await Payment.findAll();
    return res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch payments", error: error.message });
  }
});

// Process payment by Shop ID (accessible by Admin and Super Admin)
router.post('/by-shop/:shopId', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { shopId } = req.params;
  const { amountPaid, paymentMethod, paymentDate } = req.body;
  const adminName = req.user.email || 'System';

  if (!amountPaid || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Amount paid and payment method are required' });
  }

  try {
    const result = await processPaymentByShopId(shopId, amountPaid, paymentMethod, paymentDate, adminName);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json({ success: false, message: 'Payment processing failed', ...result });
    }
  } catch (err) {
    console.error('Error processing payment for shop:', err);
    return res.status(500).json({ success: false, message: 'Error processing payment', error: err.message });
  }
});

// Process payment by Invoice ID (accessible by Admin and Super Admin)
router.post('/by-invoice/:invoiceId', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { invoiceId } = req.params;
  const { amountPaid, paymentMethod, paymentDate } = req.body;
  const adminName = req.user.email || 'System';

  if (!amountPaid || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Amount paid and payment method are required' });
  }

  try {
    const result = await processPaymentByInvoiceId(invoiceId, amountPaid, paymentMethod, paymentDate, adminName);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json({ success: false, message: 'Payment processing failed', ...result });
    }
  } catch (err) {
    console.error('Error processing payment for invoice:', err);
    return res.status(500).json({ success: false, message: 'Error processing payment', error: err.message });
  }
});

module.exports = router;
