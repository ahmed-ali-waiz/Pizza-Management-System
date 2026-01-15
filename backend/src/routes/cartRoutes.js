import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
} from '../controllers/cartController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getCart);
router.post('/add', authMiddleware, addToCart);
router.put('/update/:itemId', authMiddleware, updateCartItem);
router.delete('/remove/:itemId', authMiddleware, removeFromCart);
router.delete('/clear', authMiddleware, clearCart);
router.post('/apply-coupon', authMiddleware, applyCoupon);

export default router;
