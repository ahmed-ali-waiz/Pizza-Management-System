import express from 'express';
import { protect, admin, staff } from '../middleware/authMiddleware.js';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  activateCampaign,
  pauseCampaign,
  getLoyaltyPrograms,
  getLoyaltyProgram,
  updateLoyaltyProgram,
  addLoyaltyPoints,
  getNotifications,
  createNotification,
  updateNotification,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/marketingController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Campaign routes
router.route('/campaigns')
  .get(getCampaigns)
  .post(admin, createCampaign);

router.route('/campaigns/:id')
  .get(getCampaign)
  .put(admin, updateCampaign)
  .delete(admin, deleteCampaign);

router.post('/campaigns/:id/activate', admin, activateCampaign);
router.post('/campaigns/:id/pause', admin, pauseCampaign);

// Loyalty program routes
router.get('/loyalty-programs', getLoyaltyPrograms);
router.route('/loyalty-programs/:userId')
  .get(getLoyaltyProgram)
  .put(admin, updateLoyaltyProgram);
router.post('/loyalty-programs/:userId/points', addLoyaltyPoints);

// Notification routes
router.route('/notifications')
  .get(getNotifications)
  .post(createNotification);

router.route('/notifications/:id')
  .put(updateNotification);

router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

export default router;
