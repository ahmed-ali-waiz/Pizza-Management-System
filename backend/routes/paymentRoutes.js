import express from 'express';
import {
  // CRUD
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  
  // Stripe
  createStripeIntent,
  confirmStripePayment,
  verifyStripePayment,
  cancelStripeIntent,
  stripeWebhook,
  
  // Cash
  processCashPayment,
  markCODCollected,
  
  // Refunds
  processRefund,
  
  // Stats
  getPaymentStats,
  updatePaymentStatus,
  
  // User
  getPaymentsByOrder,
  getMyPayments,
  
  // Payment Methods
  getSavedPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  
  // Receipt
  getPaymentReceipt,
} from '../controllers/paymentController.js';
import { protect, admin, staff } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== WEBHOOK (No Auth - Stripe calls this) ====================
// Must be before other routes and use raw body
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// ==================== PROTECTED ROUTES ====================
router.use(protect);

// ==================== USER ROUTES ====================
// Payment history
router.get('/my-payments', getMyPayments);

// Saved payment methods
router.get('/methods', getSavedPaymentMethods);
router.post('/methods', addPaymentMethod);
router.delete('/methods/:methodId', removePaymentMethod);
router.put('/methods/:methodId/default', setDefaultPaymentMethod);

// Create payment intent (for Stripe checkout)
router.post('/create-intent', createStripeIntent);
router.post('/confirm', confirmStripePayment);
router.post('/verify', verifyStripePayment);
router.post('/cancel-intent', cancelStripeIntent);

// Get payment by order
router.get('/order/:orderId', getPaymentsByOrder);

// Get receipt
router.get('/:id/receipt', getPaymentReceipt);

// ==================== STAFF ROUTES ====================
// Process cash payment (in-store)
router.post('/cash', staff, processCashPayment);

// Mark COD as collected (for riders)
router.post('/cod-collected', staff, markCODCollected);

// ==================== ADMIN ROUTES ====================
// Statistics
router.get('/stats', admin, getPaymentStats);

// All payments (admin)
router.route('/')
  .get(admin, getPayments)
  .post(createPayment);

// Single payment
router.route('/:id')
  .get(getPayment)
  .put(admin, updatePayment);

// Status update
router.put('/:id/status', admin, updatePaymentStatus);

// Refund
router.post('/:id/refund', admin, processRefund);

export default router;
