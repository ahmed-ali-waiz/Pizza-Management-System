import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getDashboardStats, getKDSOrders } from '../controllers/dashboardController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Dashboard stats
router.get('/', getDashboardStats);

// KDS orders
router.get('/kds/orders', getKDSOrders);

export default router;
