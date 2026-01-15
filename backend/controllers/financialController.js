import asyncHandler from '../middleware/asyncHandler.js';
import Expense from '../models/Expense.js';
import Refund from '../models/Refund.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Branch from '../models/Branch.js';

// =============================================
// EXPENSE CONTROLLERS
// =============================================

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = asyncHandler(async (req, res) => {
  const { branchId, category, status, startDate, endDate, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (branchId) filter.branchId = branchId;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.expenseDate = {};
    if (startDate) filter.expenseDate.$gte = new Date(startDate);
    if (endDate) filter.expenseDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const expenses = await Expense.find(filter)
    .populate('branchId', 'branchName')
    .populate('supplierId', 'name')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name')
    .populate('rejectedBy', 'name')
    .sort({ expenseDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Expense.countDocuments(filter);

  // Calculate totals
  const totals = await Expense.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: expenses,
    totals: totals.reduce((acc, item) => {
      acc[item._id] = { total: item.total, count: item.count };
      return acc;
    }, {}),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id)
    .populate('branchId', 'branchName address')
    .populate('supplierId', 'name contactPerson email phone')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email');

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  res.json({ success: true, data: expense });
});

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = asyncHandler(async (req, res) => {
  const { branchId, category, amount, description, expenseDate } = req.body;

  // Validate branch
  const branch = await Branch.findById(branchId);
  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  if (amount <= 0) {
    res.status(400);
    throw new Error('Amount must be greater than 0');
  }

  const expense = await Expense.create({
    ...req.body,
    createdBy: req.user._id,
    status: 'pending',
  });

  const populatedExpense = await Expense.findById(expense._id)
    .populate('branchId', 'branchName')
    .populate('createdBy', 'name email');

  res.status(201).json({ success: true, data: populatedExpense });
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  if (expense.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending expenses can be updated');
  }

  const updatedExpense = await Expense.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('branchId', 'branchName')
    .populate('createdBy', 'name email');

  res.json({ success: true, data: updatedExpense });
});

// @desc    Approve expense
// @route   PUT /api/expenses/:id/approve
// @access  Private/Admin
export const approveExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  if (expense.status !== 'pending') {
    res.status(400);
    throw new Error('Expense is not pending');
  }

  expense.status = 'approved';
  expense.approvedBy = req.user._id;
  expense.approvedAt = new Date();
  await expense.save();

  const populatedExpense = await Expense.findById(expense._id)
    .populate('branchId', 'branchName')
    .populate('approvedBy', 'name email');

  res.json({ success: true, data: populatedExpense });
});

// @desc    Reject expense
// @route   PUT /api/expenses/:id/reject
// @access  Private/Admin
export const rejectExpense = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    res.status(400);
    throw new Error('Rejection reason is required');
  }

  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  if (expense.status !== 'pending') {
    res.status(400);
    throw new Error('Expense is not pending');
  }

  expense.status = 'rejected';
  expense.rejectedBy = req.user._id;
  expense.rejectedAt = new Date();
  expense.rejectionReason = rejectionReason;
  await expense.save();

  const populatedExpense = await Expense.findById(expense._id)
    .populate('branchId', 'branchName')
    .populate('rejectedBy', 'name email');

  res.json({ success: true, data: populatedExpense });
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  if (expense.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending expenses can be deleted');
  }

  await expense.deleteOne();

  res.json({ success: true, message: 'Expense deleted' });
});

// =============================================
// REFUND CONTROLLERS
// =============================================

// @desc    Get all refunds
// @route   GET /api/refunds
// @access  Private
export const getRefunds = asyncHandler(async (req, res) => {
  const { orderId, userId, status, startDate, endDate, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (orderId) filter.orderId = orderId;
  if (userId) filter.userId = userId;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const refunds = await Refund.find(filter)
    .populate('orderId', 'orderNumber totalAmount')
    .populate('paymentId', 'transactionId paymentMethod amount')
    .populate('userId', 'name email phone')
    .populate('processedBy', 'name')
    .populate('rejectedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Refund.countDocuments(filter);

  res.json({
    success: true,
    data: refunds,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single refund
// @route   GET /api/refunds/:id
// @access  Private
export const getRefund = asyncHandler(async (req, res) => {
  const refund = await Refund.findById(req.params.id)
    .populate('orderId', 'orderNumber totalAmount items createdAt orderStatus')
    .populate('paymentId', 'transactionId paymentMethod amount paymentStatus')
    .populate('userId', 'name email phone')
    .populate('processedBy', 'name email')
    .populate('rejectedBy', 'name email');

  if (!refund) {
    res.status(404);
    throw new Error('Refund not found');
  }

  res.json({ success: true, data: refund });
});

// @desc    Create refund request
// @route   POST /api/refunds
// @access  Private
export const createRefund = asyncHandler(async (req, res) => {
  const { orderId, paymentId, amount, reason, reasonCategory } = req.body;

  // Validate order
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Validate payment
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  // Validate amount
  if (amount > payment.amount) {
    res.status(400);
    throw new Error('Refund amount cannot exceed payment amount');
  }

  // Check for existing pending refund
  const existingRefund = await Refund.findOne({
    orderId,
    status: { $in: ['pending', 'processing'] },
  });

  if (existingRefund) {
    res.status(400);
    throw new Error('A refund request is already pending for this order');
  }

  const refund = await Refund.create({
    orderId,
    paymentId,
    userId: req.user._id,
    amount,
    reason,
    reasonCategory,
    status: 'pending',
  });

  const populatedRefund = await Refund.findById(refund._id)
    .populate('orderId', 'orderNumber')
    .populate('paymentId', 'transactionId')
    .populate('userId', 'name email');

  res.status(201).json({ success: true, data: populatedRefund });
});

// @desc    Process refund
// @route   PUT /api/refunds/:id/process
// @access  Private/Admin
export const processRefund = asyncHandler(async (req, res) => {
  const { transactionId, refundMethod } = req.body;

  const refund = await Refund.findById(req.params.id);

  if (!refund) {
    res.status(404);
    throw new Error('Refund not found');
  }

  if (refund.status !== 'pending') {
    res.status(400);
    throw new Error('Refund is not pending');
  }

  refund.status = 'processing';
  refund.processedBy = req.user._id;
  refund.processedAt = new Date();
  if (transactionId) refund.transactionId = transactionId;
  if (refundMethod) refund.refundMethod = refundMethod;
  await refund.save();

  // Update payment status
  await Payment.findByIdAndUpdate(refund.paymentId, {
    paymentStatus: 'refund_processing',
  });

  const populatedRefund = await Refund.findById(refund._id)
    .populate('orderId', 'orderNumber')
    .populate('processedBy', 'name email');

  res.json({ success: true, data: populatedRefund });
});

// @desc    Complete refund
// @route   PUT /api/refunds/:id/complete
// @access  Private/Admin
export const completeRefund = asyncHandler(async (req, res) => {
  const refund = await Refund.findById(req.params.id);

  if (!refund) {
    res.status(404);
    throw new Error('Refund not found');
  }

  if (refund.status !== 'processing') {
    res.status(400);
    throw new Error('Refund is not being processed');
  }

  refund.status = 'completed';
  refund.completedAt = new Date();
  await refund.save();

  // Update payment status
  await Payment.findByIdAndUpdate(refund.paymentId, {
    paymentStatus: 'refunded',
  });

  // Update order status
  await Order.findByIdAndUpdate(refund.orderId, {
    paymentStatus: 'refunded',
  });

  const populatedRefund = await Refund.findById(refund._id)
    .populate('orderId', 'orderNumber')
    .populate('paymentId', 'transactionId');

  res.json({ success: true, data: populatedRefund });
});

// @desc    Reject refund
// @route   PUT /api/refunds/:id/reject
// @access  Private/Admin
export const rejectRefund = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    res.status(400);
    throw new Error('Rejection reason is required');
  }

  const refund = await Refund.findById(req.params.id);

  if (!refund) {
    res.status(404);
    throw new Error('Refund not found');
  }

  if (!['pending', 'processing'].includes(refund.status)) {
    res.status(400);
    throw new Error('Refund cannot be rejected');
  }

  refund.status = 'rejected';
  refund.rejectedBy = req.user._id;
  refund.rejectedAt = new Date();
  refund.rejectionReason = rejectionReason;
  await refund.save();

  const populatedRefund = await Refund.findById(refund._id)
    .populate('orderId', 'orderNumber')
    .populate('rejectedBy', 'name email');

  res.json({ success: true, data: populatedRefund });
});
