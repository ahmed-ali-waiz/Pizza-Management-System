import express from 'express';
import { protect, admin, staff } from '../middleware/authMiddleware.js';
import {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
  getStockMovements,
  createStockMovement,
} from '../controllers/inventoryController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Inventory routes
router.route('/')
  .get(getInventory)
  .post(admin, createInventoryItem);

router.get('/stats', getInventoryStats);

router.route('/:id')
  .get(getInventoryItem)
  .put(staff, updateInventoryItem)
  .delete(admin, deleteInventoryItem);

export default router;
