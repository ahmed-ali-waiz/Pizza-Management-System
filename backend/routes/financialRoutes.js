import express from 'express';
import { protect, admin, staff } from '../middleware/authMiddleware.js';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  approveExpense,
  rejectExpense,
  deleteExpense,
  getRefunds,
  getRefund,
  createRefund,
  processRefund,
  completeRefund,
  rejectRefund,
} from '../controllers/financialController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Expense routes
router.route('/expenses')
  .get(getExpenses)
  .post(staff, createExpense);

router.route('/expenses/:id')
  .get(getExpense)
  .put(staff, updateExpense)
  .delete(admin, deleteExpense);

router.put('/expenses/:id/approve', admin, approveExpense);
router.put('/expenses/:id/reject', admin, rejectExpense);

// Refund routes
router.route('/refunds')
  .get(getRefunds)
  .post(createRefund);

router.get('/refunds/:id', getRefund);
router.put('/refunds/:id/process', admin, processRefund);
router.put('/refunds/:id/complete', admin, completeRefund);
router.put('/refunds/:id/reject', admin, rejectRefund);

export default router;
