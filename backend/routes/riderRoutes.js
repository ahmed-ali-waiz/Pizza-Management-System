import express from 'express';
import {
  getRiders,
  getRider,
  createRider,
  updateRider,
  updateAvailability,
  deleteRider,
  getRiderOrders,
  getRiderHistory,
  getRiderStats,
  getAvailableRiders,
} from '../controllers/riderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Available riders must come before /:id routes
router.get('/available', getAvailableRiders);

router.route('/').get(getRiders).post(createRider);
router.route('/:id').get(getRider).put(updateRider).delete(deleteRider);
router.put('/:id/availability', updateAvailability);

// Rider order management routes
router.get('/:id/orders', getRiderOrders);
router.get('/:id/history', getRiderHistory);
router.get('/:id/stats', getRiderStats);

export default router;















