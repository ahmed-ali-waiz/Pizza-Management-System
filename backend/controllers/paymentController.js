import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import {
  createPaymentIntent,
  confirmPaymentIntent,
  retrievePaymentIntent,
  cancelPaymentIntent,
  createRefund as stripeCreateRefund,
  constructWebhookEvent,
  createCustomer,
  listPaymentMethods,
  attachPaymentMethod,
  detachPaymentMethod,
} from '../config/stripe.js';

// ==================== BASIC CRUD ====================

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin
export const getPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const filter = {};
  
  // Apply filters
  if (req.query.status) filter.paymentStatus = req.query.status;
  if (req.query.method) filter.paymentMethod = req.query.method;
  if (req.query.branch) filter.branch = req.query.branch;
  if (req.query.startDate && req.query.endDate) {
    filter.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  const payments = await Payment.find(filter)
    .populate('order', 'orderId totalAmount orderStatus')
    .populate('user', 'name email phone')
    .populate('branch', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Payment.countDocuments(filter);
  
  res.json({
    success: true,
    data: payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('order')
    .populate('user', 'name email phone')
    .populate('branch', 'name address');

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  res.json({ success: true, data: payment });
});

// @desc    Create payment record
// @route   POST /api/payments
// @access  Private
export const createPayment = asyncHandler(async (req, res) => {
  const { order: orderId, amount, paymentMethod, breakdown } = req.body;
  
  // Validate order exists
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  const paymentData = {
    order: orderId,
    user: req.user?._id || order.userId,
    branch: order.branch,
    amount,
    paymentMethod,
    breakdown,
    initiatedAt: new Date(),
    clientInfo: {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }
  };
  
  const payment = await Payment.create(paymentData);
  
  // Update order payment status
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'pending',
  });

  const populatedPayment = await Payment.findById(payment._id)
    .populate('order')
    .populate('user', 'name email');
    
  res.status(201).json({ success: true, data: populatedPayment });
});

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private/Admin
export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('order');

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  // Update order payment status
  if (payment.order) {
    await Order.findByIdAndUpdate(payment.order._id, {
      paymentStatus: payment.paymentStatus,
    });
  }

  res.json({ success: true, data: payment });
});

// ==================== STRIPE INTEGRATION ====================

// @desc    Create Stripe Payment Intent
// @route   POST /api/payments/create-intent
// @access  Private
export const createStripeIntent = asyncHandler(async (req, res) => {
  const { orderId, amount, currency = 'usd' } = req.body;
  
  // Validate order
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  const paymentAmount = amount || order.totalAmount || order.total;
  
  if (!paymentAmount || paymentAmount <= 0) {
    res.status(400);
    throw new Error('Invalid payment amount');
  }
  
  // Create Stripe Payment Intent
  const result = await createPaymentIntent(paymentAmount, currency, {
    orderId: order._id.toString(),
    orderNumber: order.orderId,
    userId: req.user?._id?.toString(),
  });
  
  if (!result.success) {
    res.status(400);
    throw new Error(result.error || 'Failed to create payment intent');
  }
  
  // Create payment record
  const payment = await Payment.create({
    order: orderId,
    user: req.user?._id || order.userId,
    branch: order.branch,
    amount: paymentAmount,
    currency: currency.toUpperCase(),
    paymentMethod: 'Stripe',
    paymentStatus: 'pending',
    stripePaymentIntentId: result.paymentIntent.id,
    stripeClientSecret: result.clientSecret,
    breakdown: {
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.deliveryCharges || order.deliveryFee,
      discount: order.discountAmount,
    },
    initiatedAt: new Date(),
    clientInfo: {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }
  });
  
  res.status(201).json({
    success: true,
    data: {
      paymentId: payment._id,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntent.id,
      amount: paymentAmount,
      currency,
    }
  });
});

// @desc    Confirm Stripe Payment
// @route   POST /api/payments/confirm
// @access  Private
export const confirmStripePayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, paymentMethodId } = req.body;
  
  // Find payment record
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }
  
  // Confirm with Stripe
  const result = await confirmPaymentIntent(paymentIntentId, paymentMethodId);
  
  if (!result.success) {
    payment.paymentStatus = 'failed';
    payment.failureDetails = {
      message: result.error,
      failedAt: new Date(),
    };
    await payment.save();
    
    res.status(400);
    throw new Error(result.error || 'Payment confirmation failed');
  }
  
  const { paymentIntent } = result;
  
  // Update payment based on status
  if (paymentIntent.status === 'succeeded') {
    payment.paymentStatus = 'completed';
    payment.transactionId = paymentIntent.id;
    payment.stripePaymentMethodId = paymentMethodId;
    payment.completedAt = new Date();
    payment.processedAt = new Date();
    
    // Extract card details if available
    if (paymentIntent.payment_method_details?.card) {
      const card = paymentIntent.payment_method_details.card;
      payment.cardDetails = {
        brand: card.brand,
        last4: card.last4,
        expMonth: card.exp_month,
        expYear: card.exp_year,
      };
    }
    
    // Update order
    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: 'completed',
      transactionId: paymentIntent.id,
    });
  } else if (paymentIntent.status === 'requires_action') {
    payment.paymentStatus = 'processing';
  }
  
  await payment.save();
  
  res.json({
    success: true,
    data: {
      payment: await Payment.findById(payment._id).populate('order'),
      status: paymentIntent.status,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
    }
  });
});

// @desc    Verify Stripe Payment (after client confirmation)
// @route   POST /api/payments/verify
// @access  Private
export const verifyStripePayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  
  // Retrieve from Stripe
  const result = await retrievePaymentIntent(paymentIntentId);
  
  if (!result.success) {
    res.status(400);
    throw new Error(result.error || 'Failed to verify payment');
  }
  
  const { paymentIntent } = result;
  
  // Find and update payment record
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }
  
  // Update based on Stripe status
  const statusMap = {
    'succeeded': 'completed',
    'processing': 'processing',
    'requires_payment_method': 'pending',
    'requires_confirmation': 'pending',
    'requires_action': 'processing',
    'canceled': 'cancelled',
  };
  
  payment.paymentStatus = statusMap[paymentIntent.status] || 'pending';
  
  if (paymentIntent.status === 'succeeded') {
    payment.completedAt = new Date();
    payment.isVerified = true;
    payment.verifiedAt = new Date();
    
    // Update order
    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: 'completed',
    });
  }
  
  await payment.save();
  
  res.json({
    success: true,
    data: {
      verified: paymentIntent.status === 'succeeded',
      status: payment.paymentStatus,
      stripeStatus: paymentIntent.status,
    }
  });
});

// @desc    Cancel Stripe Payment Intent
// @route   POST /api/payments/cancel-intent
// @access  Private
export const cancelStripeIntent = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  
  const result = await cancelPaymentIntent(paymentIntentId);
  
  if (!result.success) {
    res.status(400);
    throw new Error(result.error || 'Failed to cancel payment');
  }
  
  // Update payment record
  const payment = await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    { paymentStatus: 'cancelled' },
    { new: true }
  );
  
  if (payment) {
    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: 'cancelled',
    });
  }
  
  res.json({
    success: true,
    message: 'Payment cancelled successfully',
  });
});

// @desc    Stripe Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe only)
export const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.log('Stripe webhook secret not configured');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }
  
  const result = constructWebhookEvent(req.body, sig, webhookSecret);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  const event = result.event;
  
  // Handle specific events
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
      
      if (payment) {
        payment.paymentStatus = 'completed';
        payment.completedAt = new Date();
        payment.stripeChargeId = paymentIntent.latest_charge;
        await payment.save();
        
        await Order.findByIdAndUpdate(payment.order, {
          paymentStatus: 'completed',
        });
      }
      break;
    }
    
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
      
      if (payment) {
        payment.paymentStatus = 'failed';
        payment.failureDetails = {
          code: paymentIntent.last_payment_error?.code,
          message: paymentIntent.last_payment_error?.message,
          declineCode: paymentIntent.last_payment_error?.decline_code,
          failedAt: new Date(),
        };
        await payment.save();
        
        await Order.findByIdAndUpdate(payment.order, {
          paymentStatus: 'failed',
        });
      }
      break;
    }
    
    case 'charge.refunded': {
      const charge = event.data.object;
      const payment = await Payment.findOne({ stripeChargeId: charge.id });
      
      if (payment) {
        const isFullRefund = charge.refunded;
        payment.paymentStatus = isFullRefund ? 'refunded' : 'partially_refunded';
        payment.refundDetails = {
          refundedAmount: charge.amount_refunded / 100,
          refundedAt: new Date(),
          isPartialRefund: !isFullRefund,
        };
        await payment.save();
      }
      break;
    }
    
    case 'charge.dispute.created': {
      const dispute = event.data.object;
      const payment = await Payment.findOne({ stripeChargeId: dispute.charge });
      
      if (payment) {
        payment.dispute = {
          isDisputed: true,
          disputeId: dispute.id,
          reason: dispute.reason,
          status: dispute.status,
          disputedAt: new Date(),
        };
        await payment.save();
      }
      break;
    }
  }
  
  res.json({ received: true });
});

// ==================== CASH PAYMENT ====================

// @desc    Process Cash Payment
// @route   POST /api/payments/cash
// @access  Private/Staff
export const processCashPayment = asyncHandler(async (req, res) => {
  const { orderId, amountReceived } = req.body;
  
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  const totalAmount = order.totalAmount || order.total;
  
  if (amountReceived < totalAmount) {
    res.status(400);
    throw new Error(`Insufficient amount. Required: ${totalAmount}, Received: ${amountReceived}`);
  }
  
  const changeGiven = amountReceived - totalAmount;
  
  const payment = await Payment.create({
    order: orderId,
    user: order.userId,
    branch: order.branch,
    amount: totalAmount,
    paymentMethod: 'Cash',
    paymentStatus: 'completed',
    cashDetails: {
      amountReceived,
      changeGiven,
      receivedBy: req.user._id,
    },
    processedAt: new Date(),
    completedAt: new Date(),
    isVerified: true,
    verifiedBy: req.user._id,
    verifiedAt: new Date(),
  });
  
  // Update order
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'completed',
    paymentMethod: 'Cash',
  });
  
  res.status(201).json({
    success: true,
    data: {
      payment: await Payment.findById(payment._id).populate('order'),
      changeGiven,
    }
  });
});

// @desc    Mark COD as Collected
// @route   POST /api/payments/cod-collected
// @access  Private/Rider
export const markCODCollected = asyncHandler(async (req, res) => {
  const { orderId, amountCollected } = req.body;
  
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  // Find or create payment
  let payment = await Payment.findOne({ order: orderId });
  
  if (!payment) {
    payment = await Payment.create({
      order: orderId,
      user: order.userId,
      branch: order.branch,
      amount: order.totalAmount || order.total,
      paymentMethod: 'COD',
      paymentStatus: 'completed',
    });
  } else {
    payment.paymentStatus = 'completed';
  }
  
  payment.cashDetails = {
    amountReceived: amountCollected,
    changeGiven: amountCollected - payment.amount,
    receivedBy: req.user._id,
  };
  payment.completedAt = new Date();
  await payment.save();
  
  // Update order
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'completed',
  });
  
  res.json({
    success: true,
    data: await Payment.findById(payment._id).populate('order'),
  });
});

// ==================== REFUNDS ====================

// @desc    Process Refund
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
export const processRefund = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  
  const payment = await Payment.findById(req.params.id).populate('order');
  
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  
  if (payment.paymentStatus !== 'completed') {
    res.status(400);
    throw new Error('Can only refund completed payments');
  }
  
  const refundAmount = amount || payment.amount;
  
  if (refundAmount > payment.amount) {
    res.status(400);
    throw new Error('Refund amount cannot exceed original payment amount');
  }
  
  const isFullRefund = refundAmount === payment.amount;
  
  // If Stripe payment, process through Stripe
  if (payment.paymentMethod === 'Stripe' && payment.stripePaymentIntentId) {
    const result = await stripeCreateRefund(
      payment.stripePaymentIntentId,
      refundAmount,
      'requested_by_customer'
    );
    
    if (!result.success) {
      res.status(400);
      throw new Error(result.error || 'Stripe refund failed');
    }
    
    payment.refundDetails = {
      refundId: result.refund.id,
      stripeRefundId: result.refund.id,
      refundedAmount: refundAmount,
      refundReason: reason || 'Customer request',
      refundedBy: req.user._id,
      refundedAt: new Date(),
      isPartialRefund: !isFullRefund,
    };
  } else {
    // For non-Stripe payments
    payment.refundDetails = {
      refundId: `REF-${Date.now()}`,
      refundedAmount: refundAmount,
      refundReason: reason || 'Customer request',
      refundedBy: req.user._id,
      refundedAt: new Date(),
      isPartialRefund: !isFullRefund,
    };
  }
  
  payment.paymentStatus = isFullRefund ? 'refunded' : 'partially_refunded';
  await payment.save();
  
  // Update order if full refund
  if (isFullRefund && payment.order) {
    await Order.findByIdAndUpdate(payment.order._id, {
      paymentStatus: 'refunded',
      orderStatus: 'cancelled',
    });
  }
  
  res.json({
    success: true,
    data: {
      payment: await Payment.findById(payment._id).populate('order'),
      refund: payment.refundDetails,
    }
  });
});

// ==================== STATISTICS & REPORTS ====================

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private/Admin
export const getPaymentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, branch } = req.query;
  
  const matchQuery = {};
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (branch) {
    matchQuery.branch = branch;
  }
  
  // Payment method breakdown
  const paymentMethodStats = await Payment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
  
  // Payment status breakdown
  const paymentStatusStats = await Payment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  // Daily revenue trend
  const dailyRevenue = await Payment.aggregate([
    { 
      $match: { 
        ...matchQuery, 
        paymentStatus: 'completed' 
      } 
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 30 }
  ]);
  
  // Hourly distribution
  const hourlyDistribution = await Payment.aggregate([
    { $match: { ...matchQuery, paymentStatus: 'completed' } },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 },
        revenue: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Refund stats
  const refundStats = await Payment.aggregate([
    { $match: { ...matchQuery, paymentStatus: { $in: ['refunded', 'partially_refunded'] } } },
    {
      $group: {
        _id: null,
        totalRefunds: { $sum: 1 },
        totalRefundedAmount: { $sum: '$refundDetails.refundedAmount' }
      }
    }
  ]);
  
  // Overall totals
  const totals = await Payment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$amount', 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0]
          }
        },
        failedAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'failed'] }, '$amount', 0]
          }
        },
        avgTransactionValue: { $avg: '$amount' }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      byMethod: paymentMethodStats,
      byStatus: paymentStatusStats,
      dailyRevenue,
      hourlyDistribution,
      refundStats: refundStats[0] || { totalRefunds: 0, totalRefundedAmount: 0 },
      totals: totals[0] || {
        totalPayments: 0,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        failedAmount: 0,
        avgTransactionValue: 0
      }
    }
  });
});

// ==================== STATUS MANAGEMENT ====================

// @desc    Update payment status
// @route   PUT /api/payments/:id/status
// @access  Private/Admin
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status, transactionId, notes } = req.body;
  
  const payment = await Payment.findById(req.params.id);
  
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  
  // Validate status transition
  const validTransitions = {
    pending: ['processing', 'completed', 'failed', 'cancelled'],
    processing: ['completed', 'failed', 'cancelled'],
    completed: ['refunded', 'partially_refunded'],
    failed: ['pending'],
    cancelled: [],
    refunded: [],
    partially_refunded: ['refunded']
  };
  
  if (!validTransitions[payment.paymentStatus]?.includes(status)) {
    res.status(400);
    throw new Error(`Cannot transition from ${payment.paymentStatus} to ${status}`);
  }
  
  payment.paymentStatus = status;
  if (transactionId) payment.transactionId = transactionId;
  if (notes) payment.notes = notes;
  
  if (status === 'completed') {
    payment.completedAt = new Date();
  }
  
  await payment.save();
  
  // Update order payment status
  if (payment.order) {
    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: status === 'completed' ? 'completed' : status
    });
  }
  
  res.json({
    success: true,
    data: await Payment.findById(payment._id).populate('order')
  });
});

// ==================== USER PAYMENT HISTORY ====================

// @desc    Get payments by order
// @route   GET /api/payments/order/:orderId
// @access  Private
export const getPaymentsByOrder = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ order: req.params.orderId })
    .populate('order')
    .sort({ createdAt: -1 });
  
  res.json({ success: true, data: payments });
});

// @desc    Get user's payment history
// @route   GET /api/payments/my-payments
// @access  Private
export const getMyPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const payments = await Payment.find({ user: req.user._id })
    .populate('order', 'orderId totalAmount orderStatus items')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Payment.countDocuments({ user: req.user._id });
  
  res.json({
    success: true,
    data: payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// ==================== CUSTOMER PAYMENT METHODS ====================

// @desc    Get saved payment methods
// @route   GET /api/payments/methods
// @access  Private
export const getSavedPaymentMethods = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user?.stripeCustomerId) {
    return res.json({ success: true, data: [] });
  }
  
  const result = await listPaymentMethods(user.stripeCustomerId);
  
  if (!result.success) {
    res.status(400);
    throw new Error(result.error);
  }
  
  // Format for frontend
  const methods = result.paymentMethods.map(pm => ({
    id: pm.id,
    brand: pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year,
    isDefault: pm.id === user.defaultPaymentMethod,
  }));
  
  res.json({ success: true, data: methods });
});

// @desc    Add payment method
// @route   POST /api/payments/methods
// @access  Private
export const addPaymentMethod = asyncHandler(async (req, res) => {
  const { paymentMethodId, setAsDefault } = req.body;
  
  let user = await User.findById(req.user._id);
  
  // Create Stripe customer if doesn't exist
  if (!user.stripeCustomerId) {
    const result = await createCustomer({
      email: user.email,
      name: user.name,
      phone: user.phone,
      userId: user._id.toString(),
    });
    
    if (!result.success) {
      res.status(400);
      throw new Error(result.error);
    }
    
    user.stripeCustomerId = result.customer.id;
    await user.save();
  }
  
  // Attach payment method
  const result = await attachPaymentMethod(paymentMethodId, user.stripeCustomerId);
  
  if (!result.success) {
    res.status(400);
    throw new Error(result.error);
  }
  
  // Set as default if requested
  if (setAsDefault) {
    user.defaultPaymentMethod = paymentMethodId;
    await user.save();
  }
  
  res.json({
    success: true,
    data: {
      id: result.paymentMethod.id,
      brand: result.paymentMethod.card.brand,
      last4: result.paymentMethod.card.last4,
    }
  });
});

// @desc    Remove payment method
// @route   DELETE /api/payments/methods/:methodId
// @access  Private
export const removePaymentMethod = asyncHandler(async (req, res) => {
  const result = await detachPaymentMethod(req.params.methodId);
  
  if (!result.success) {
    res.status(400);
    throw new Error(result.error);
  }
  
  // Remove as default if it was
  const user = await User.findById(req.user._id);
  if (user.defaultPaymentMethod === req.params.methodId) {
    user.defaultPaymentMethod = null;
    await user.save();
  }
  
  res.json({ success: true, message: 'Payment method removed' });
});

// @desc    Set default payment method
// @route   PUT /api/payments/methods/:methodId/default
// @access  Private
export const setDefaultPaymentMethod = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.defaultPaymentMethod = req.params.methodId;
  await user.save();
  
  res.json({ success: true, message: 'Default payment method updated' });
});

// ==================== RECEIPT ====================

// @desc    Get payment receipt
// @route   GET /api/payments/:id/receipt
// @access  Private
export const getPaymentReceipt = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('order')
    .populate('user', 'name email phone')
    .populate('branch', 'name address phone');
  
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  
  // Check ownership for non-admin
  if (!req.user.isAdmin && payment.user?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this receipt');
  }
  
  const receipt = {
    receiptNumber: payment.receiptNumber || `RCP-${payment._id}`,
    date: payment.completedAt || payment.createdAt,
    business: {
      name: 'Pizza Management System',
      address: payment.branch?.address || 'Main Branch',
      phone: payment.branch?.phone || 'N/A',
    },
    customer: {
      name: payment.user?.name || 'Guest',
      email: payment.user?.email,
      phone: payment.user?.phone,
    },
    order: {
      orderNumber: payment.order?.orderId,
      items: payment.order?.items,
    },
    payment: {
      method: payment.paymentMethod,
      status: payment.paymentStatus,
      amount: payment.amount,
      currency: payment.currency,
      breakdown: payment.breakdown,
      transactionId: payment.transactionId,
    },
    cardDetails: payment.cardDetails ? {
      brand: payment.cardDetails.brand,
      last4: payment.cardDetails.last4,
    } : null,
  };
  
  res.json({ success: true, data: receipt });
});















