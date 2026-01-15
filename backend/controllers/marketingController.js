import asyncHandler from '../middleware/asyncHandler.js';
import Campaign from '../models/Campaign.js';
import LoyaltyProgram from '../models/LoyaltyProgram.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// =============================================
// CAMPAIGN CONTROLLERS
// =============================================

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
export const getCampaigns = asyncHandler(async (req, res) => {
  const { status, campaignType, startDate, endDate, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (campaignType) filter.campaignType = campaignType;
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.endDate = { $lte: new Date(endDate) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const campaigns = await Campaign.find(filter)
    .populate('branches', 'branchName')
    .populate('featuredItems', 'name price')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Campaign.countDocuments(filter);

  res.json({
    success: true,
    data: campaigns,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Private
export const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('branches', 'branchName address')
    .populate('featuredItems', 'name price category')
    .populate('createdBy', 'name email');

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  res.json({ success: true, data: campaign });
});

// @desc    Create campaign
// @route   POST /api/campaigns
// @access  Private/Admin
export const createCampaign = asyncHandler(async (req, res) => {
  const campaignData = {
    ...req.body,
    createdBy: req.user._id,
  };

  // Validate dates
  if (new Date(campaignData.startDate) >= new Date(campaignData.endDate)) {
    res.status(400);
    throw new Error('End date must be after start date');
  }

  const campaign = await Campaign.create(campaignData);

  const populatedCampaign = await Campaign.findById(campaign._id)
    .populate('branches', 'branchName')
    .populate('featuredItems', 'name price')
    .populate('createdBy', 'name email');

  res.status(201).json({ success: true, data: populatedCampaign });
});

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private/Admin
export const updateCampaign = asyncHandler(async (req, res) => {
  let campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  // Validate dates if provided
  const startDate = req.body.startDate || campaign.startDate;
  const endDate = req.body.endDate || campaign.endDate;
  if (new Date(startDate) >= new Date(endDate)) {
    res.status(400);
    throw new Error('End date must be after start date');
  }

  campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('branches', 'branchName')
    .populate('featuredItems', 'name price')
    .populate('createdBy', 'name email');

  res.json({ success: true, data: campaign });
});

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private/Admin
export const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  await campaign.deleteOne();

  res.json({ success: true, message: 'Campaign deleted' });
});

// @desc    Activate campaign
// @route   POST /api/campaigns/:id/activate
// @access  Private/Admin
export const activateCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  campaign.status = 'active';
  await campaign.save();

  res.json({ success: true, data: campaign });
});

// @desc    Pause campaign
// @route   POST /api/campaigns/:id/pause
// @access  Private/Admin
export const pauseCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  campaign.status = 'paused';
  await campaign.save();

  res.json({ success: true, data: campaign });
});

// =============================================
// LOYALTY PROGRAM CONTROLLERS
// =============================================

// @desc    Get all loyalty programs
// @route   GET /api/loyalty-programs
// @access  Private
export const getLoyaltyPrograms = asyncHandler(async (req, res) => {
  const { tier, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (tier) filter.tier = tier;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const programs = await LoyaltyProgram.find(filter)
    .populate('userId', 'name email phone')
    .sort({ points: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await LoyaltyProgram.countDocuments(filter);

  res.json({
    success: true,
    data: programs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get user's loyalty program
// @route   GET /api/loyalty-programs/:userId
// @access  Private
export const getLoyaltyProgram = asyncHandler(async (req, res) => {
  let program = await LoyaltyProgram.findOne({ userId: req.params.userId })
    .populate('userId', 'name email phone');

  // Create program if doesn't exist
  if (!program) {
    program = await LoyaltyProgram.create({ userId: req.params.userId });
    program = await LoyaltyProgram.findById(program._id)
      .populate('userId', 'name email phone');
  }

  res.json({ success: true, data: program });
});

// @desc    Update loyalty program
// @route   PUT /api/loyalty-programs/:userId
// @access  Private/Admin
export const updateLoyaltyProgram = asyncHandler(async (req, res) => {
  let program = await LoyaltyProgram.findOne({ userId: req.params.userId });

  if (!program) {
    program = await LoyaltyProgram.create({ userId: req.params.userId });
  }

  const updatedProgram = await LoyaltyProgram.findByIdAndUpdate(
    program._id,
    req.body,
    { new: true, runValidators: true }
  ).populate('userId', 'name email phone');

  res.json({ success: true, data: updatedProgram });
});

// @desc    Add loyalty points
// @route   POST /api/loyalty-programs/:userId/points
// @access  Private
export const addLoyaltyPoints = asyncHandler(async (req, res) => {
  const { points, reason, orderId } = req.body;

  if (!points || !reason) {
    res.status(400);
    throw new Error('Points and reason are required');
  }

  let program = await LoyaltyProgram.findOne({ userId: req.params.userId });

  if (!program) {
    program = await LoyaltyProgram.create({ userId: req.params.userId });
  }

  program.addPoints(points, reason, orderId);
  await program.save();

  const updatedProgram = await LoyaltyProgram.findById(program._id)
    .populate('userId', 'name email phone');

  res.json({ success: true, data: updatedProgram });
});

// =============================================
// NOTIFICATION CONTROLLERS
// =============================================

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const { userId, type, status, unread, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (unread === 'true') filter.status = { $ne: 'read' };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const notifications = await Notification.find(filter)
    .populate('userId', 'name email')
    .populate('orderId', 'orderNumber totalAmount')
    .populate('campaignId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({
    ...filter,
    status: { $ne: 'read' },
  });

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
export const createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type, channel, orderId, campaignId, broadcast } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error('Title and message are required');
  }

  // Broadcast to all users
  if (broadcast) {
    const users = await User.find({ role: 'customer' }).select('_id');
    const notifications = users.map((user) => ({
      userId: user._id,
      title,
      message,
      type: type || 'promotion',
      channel: channel || 'in-app',
      campaignId,
      status: 'sent',
      sentAt: new Date(),
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Broadcast sent to ${users.length} users`,
    });
  } else {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      channel,
      orderId,
      campaignId,
      status: 'sent',
      sentAt: new Date(),
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('userId', 'name email');

    res.status(201).json({ success: true, data: populatedNotification });
  }
});

// @desc    Update notification
// @route   PUT /api/notifications/:id
// @access  Private
export const updateNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('userId', 'name email');

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, data: notification });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { status: 'read', readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, data: notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const filter = userId ? { userId } : { userId: req.user._id };

  await Notification.updateMany(
    { ...filter, status: { $ne: 'read' } },
    { status: 'read', readAt: new Date() }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});
