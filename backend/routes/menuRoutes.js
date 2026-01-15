import express from 'express';
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getMenuItems).post(createMenuItem);
router.route('/:id').get(getMenuItem).put(updateMenuItem).delete(deleteMenuItem);

export default router;















