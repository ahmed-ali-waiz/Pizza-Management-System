import express from 'express';
import { protect, staff } from '../middleware/authMiddleware.js';
import { getStockMovements, createStockMovement } from '../controllers/inventoryController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getStockMovements)
  .post(staff, createStockMovement);

export default router;
