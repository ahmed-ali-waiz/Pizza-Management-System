import asyncHandler from '../middleware/asyncHandler.js';
import Review from '../models/Review.js';
import Complaint from '../models/Complaint.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// =============================================
// REVIEW CONTROLLERS
// =============================================

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Private
export const getReviews = asyncHandler(async (req, res) => {
  const { orderId, menuId, branchId, status, rating, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (orderId) filter.orderId = orderId;
  if (menuId) filter.menuId = menuId;
  if (branchId) filter.branchId = branchId;
  if (status) filter.status = status;
  if (rating) filter.rating = parseInt(rating);

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await Review.find(filter)
    .populate('userId', 'name email')
    .populate('orderId', 'orderNumber totalAmount')
    .populate('menuId', 'name category')
    .populate('branchId', 'branchName')
    .populate('respondedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments(filter);

  // Calculate average rating
  const avgRating = await Review.aggregate([
    { $match: filter },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } },
  ]);

  res.json({
    success: true,
    data: reviews,
    averageRating: avgRating[0]?.avgRating?.toFixed(2) || 0,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Private
export const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('orderId', 'orderNumber totalAmount items createdAt')
    .populate('menuId', 'name category price')
    .populate('branchId', 'branchName address')
    .populate('respondedBy', 'name email');

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  res.json({ success: true, data: review });
});

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
export const createReview = asyncHandler(async (req, res) => {
  const { orderId, rating, comment, menuId, tags } = req.body;

  // Validate order exists
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only review your own orders');
  }

  // Check for existing review
  const existingReview = await Review.findOne({
    orderId,
    userId: req.user._id,
  });

  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this order');
  }

  // Auto-determine status based on rating
  const status = rating >= 4 ? 'approved' : rating <= 2 ? 'flagged' : 'pending';

  const review = await Review.create({
    userId: req.user._id,
    orderId,
    menuId,
    branchId: order.branchId,
    rating,
    comment,
    tags,
    status,
  });

  const populatedReview = await Review.findById(review._id)
    .populate('userId', 'name email')
    .populate('orderId', 'orderNumber');

  res.status(201).json({ success: true, data: populatedReview });
});

// @desc    Update review status
// @route   PUT /api/reviews/:id/status
// @access  Private/Admin
export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected', 'flagged'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  )
    .populate('userId', 'name email')
    .populate('orderId', 'orderNumber');

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  res.json({ success: true, data: review });
});

// @desc    Respond to review
// @route   POST /api/reviews/:id/respond
// @access  Private/Admin
export const respondToReview = asyncHandler(async (req, res) => {
  const { adminResponse } = req.body;

  if (!adminResponse) {
    res.status(400);
    throw new Error('Response is required');
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      adminResponse,
      respondedBy: req.user._id,
      respondedAt: new Date(),
    },
    { new: true }
  )
    .populate('userId', 'name email')
    .populate('respondedBy', 'name');

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  res.json({ success: true, data: review });
});

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const markReviewHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user already voted
  if (review.helpfulVoters.includes(req.user._id)) {
    res.status(400);
    throw new Error('You have already marked this review as helpful');
  }

  review.helpfulCount += 1;
  review.helpfulVoters.push(req.user._id);
  await review.save();

  res.json({ success: true, data: { helpfulCount: review.helpfulCount } });
});

// =============================================
// COMPLAINT CONTROLLERS
// =============================================

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
export const getComplaints = asyncHandler(async (req, res) => {
  const { userId, orderId, branchId, status, priority, category, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
  if (orderId) filter.orderId = orderId;
  if (branchId) filter.branchId = branchId;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const complaints = await Complaint.find(filter)
    .populate('userId', 'name email phone')
    .populate('orderId', 'orderNumber totalAmount')
    .populate('branchId', 'branchName')
    .populate('assignedTo', 'name email')
    .populate('resolvedBy', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(filter);

  res.json({
    success: true,
    data: complaints,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('orderId', 'orderNumber totalAmount items createdAt orderStatus')
    .populate('branchId', 'branchName address phone')
    .populate('assignedTo', 'name email phone')
    .populate('resolvedBy', 'name email');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  res.json({ success: true, data: complaint });
});

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private
export const createComplaint = asyncHandler(async (req, res) => {
  const { orderId, subject, description, category } = req.body;

  // Validate order if provided
  let order = null;
  let branchId = req.body.branchId;
  if (orderId) {
    order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    branchId = order.branchId;
  }

  // Determine priority based on category
  let priority = 'medium';
  if (['hygiene', 'wrong-order', 'missing-items'].includes(category)) {
    priority = 'high';
  } else if (['payment'].includes(category)) {
    priority = 'urgent';
  }

  const complaint = await Complaint.create({
    userId: req.user._id,
    orderId,
    branchId,
    subject,
    description,
    category,
    priority,
  });

  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate('userId', 'name email')
    .populate('orderId', 'orderNumber')
    .populate('branchId', 'branchName');

  res.status(201).json({ success: true, data: populatedComplaint });
});

// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private
export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('userId', 'name email')
    .populate('orderId', 'orderNumber')
    .populate('branchId', 'branchName')
    .populate('assignedTo', 'name email');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  res.json({ success: true, data: complaint });
});

// @desc    Assign complaint
// @route   PUT /api/complaints/:id/assign
// @access  Private/Admin
export const assignComplaint = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;

  // Validate assigned user
  const user = await User.findById(assignedTo);
  if (!user) {
    res.status(404);
    throw new Error('Assigned user not found');
  }

  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    {
      assignedTo,
      status: 'in-progress',
    },
    { new: true }
  )
    .populate('userId', 'name email')
    .populate('assignedTo', 'name email');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  res.json({ success: true, data: complaint });
});

// @desc    Resolve complaint
// @route   PUT /api/complaints/:id/resolve
// @access  Private
export const resolveComplaint = asyncHandler(async (req, res) => {
  const { resolution, resolutionType, customerSatisfaction } = req.body;

  if (!resolution) {
    res.status(400);
    throw new Error('Resolution is required');
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Calculate response time
  const responseTime = Math.round((new Date() - complaint.createdAt) / (1000 * 60));

  complaint.resolution = resolution;
  complaint.resolutionType = resolutionType;
  complaint.status = 'resolved';
  complaint.resolvedAt = new Date();
  complaint.resolvedBy = req.user._id;
  complaint.responseTime = responseTime;
  if (customerSatisfaction) complaint.customerSatisfaction = customerSatisfaction;

  await complaint.save();

  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate('userId', 'name email')
    .populate('resolvedBy', 'name email');

  res.json({ success: true, data: populatedComplaint });
});
