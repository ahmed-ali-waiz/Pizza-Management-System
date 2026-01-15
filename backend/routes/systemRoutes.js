import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getSettings,
  getSetting,
  createSetting,
  updateSetting,
  deleteSetting,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/systemController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Settings routes
router.route('/settings')
  .get(getSettings)
  .post(admin, createSetting);

router.route('/settings/:key')
  .get(getSetting)
  .put(admin, updateSetting)
  .delete(admin, deleteSetting);

// Category routes
router.route('/categories')
  .get(getCategories)
  .post(admin, createCategory);

router.route('/categories/:id')
  .get(getCategory)
  .put(admin, updateCategory)
  .delete(admin, deleteCategory);

export default router;
