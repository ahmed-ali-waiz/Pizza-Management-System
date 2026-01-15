import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
  rateOrder,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', authMiddleware, createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/:orderId', authMiddleware, getOrderDetail);
router.put('/:orderId/cancel', authMiddleware, cancelOrder);
router.put('/:orderId/rate', authMiddleware, rateOrder);

export default router;
