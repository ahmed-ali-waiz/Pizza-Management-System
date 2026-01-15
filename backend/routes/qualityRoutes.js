import express from 'express';
import { protect, admin, staff } from '../middleware/authMiddleware.js';
import {
  getReviews,
  getReview,
  createReview,
  updateReviewStatus,
  respondToReview,
  markReviewHelpful,
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  assignComplaint,
  resolveComplaint,
} from '../controllers/qualityController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Review routes
router.route('/reviews')
  .get(getReviews)
  .post(createReview);

router.get('/reviews/:id', getReview);
router.put('/reviews/:id/status', admin, updateReviewStatus);
router.post('/reviews/:id/respond', admin, respondToReview);
router.post('/reviews/:id/helpful', markReviewHelpful);

// Complaint routes
router.route('/complaints')
  .get(getComplaints)
  .post(createComplaint);

router.route('/complaints/:id')
  .get(getComplaint)
  .put(staff, updateComplaint);

router.put('/complaints/:id/assign', admin, assignComplaint);
router.put('/complaints/:id/resolve', staff, resolveComplaint);

export default router;
