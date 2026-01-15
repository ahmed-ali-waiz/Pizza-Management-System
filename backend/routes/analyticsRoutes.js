import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getSalesReports,
  getOrderMetrics,
  getCustomerStats,
  getDashboardAnalytics,
} from '../controllers/analyticsController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.get('/sales-reports', getSalesReports);
router.get('/order-metrics', getOrderMetrics);
router.get('/customer-stats', getCustomerStats);
router.get('/dashboard', getDashboardAnalytics);

export default router;
