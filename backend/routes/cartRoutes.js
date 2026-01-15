import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Cart routes can be added here if needed
router.use(protect);

export default router;















