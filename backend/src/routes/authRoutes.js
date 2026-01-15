import express from 'express';
import { register, login, adminLogin, refreshAccessToken, logout, getCurrentUser } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
