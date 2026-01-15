import express from 'express';
import {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getBranches).post(createBranch);
router.route('/:id').get(getBranch).put(updateBranch).delete(deleteBranch);

export default router;















