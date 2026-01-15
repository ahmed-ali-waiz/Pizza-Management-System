import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/userController.js';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from '../../controllers/userController.js';
import { protect, admin } from '../../middleware/authMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// User profile routes - must come before /:id routes to avoid conflicts
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);

// Address routes - must come before /:id routes
router.post('/addresses', authMiddleware, addAddress);
router.get('/addresses', authMiddleware, getAddresses);
router.put('/addresses/:addressId', authMiddleware, updateAddress);
router.delete('/addresses/:addressId', authMiddleware, deleteAddress);
router.put('/addresses/:addressId/default', authMiddleware, setDefaultAddress);

// Admin routes - must come after specific routes to avoid conflicts
router.get('/', protect, admin, getUsers);
router.post('/', protect, admin, createUser);
router.get('/:id', protect, admin, getUser);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

export default router;
