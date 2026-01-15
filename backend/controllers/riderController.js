import DeliveryRider from '../models/DeliveryRider.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getRiders = asyncHandler(async (req, res) => {
  const riders = await DeliveryRider.find().populate('branch');
  res.json({ success: true, data: riders });
});

export const getRider = asyncHandler(async (req, res) => {
  const rider = await DeliveryRider.findById(req.params.id).populate('branch');

  if (!rider) {
    res.status(404);
    throw new Error('Rider not found');
  }

  res.json({ success: true, data: rider });
});

export const createRider = asyncHandler(async (req, res) => {
  const rider = await DeliveryRider.create(req.body);
  const populatedRider = await DeliveryRider.findById(rider._id).populate('branch');
  res.status(201).json({ success: true, data: populatedRider });
});

export const updateRider = asyncHandler(async (req, res) => {
  const rider = await DeliveryRider.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('branch');

  if (!rider) {
    res.status(404);
    throw new Error('Rider not found');
  }

  res.json({ success: true, data: rider });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  const rider = await DeliveryRider.findByIdAndUpdate(
    req.params.id,
    { availability },
    { new: true, runValidators: true }
  ).populate('branch');

  if (!rider) {
    res.status(404);
    throw new Error('Rider not found');
  }

  res.json({ success: true, data: rider });
});

export const deleteRider = asyncHandler(async (req, res) => {
  const rider = await DeliveryRider.findById(req.params.id);

  if (!rider) {
    res.status(404);
    throw new Error('Rider not found');
  }

  await rider.deleteOne();
  res.json({ success: true, data: {} });
});

// Get rider's assigned orders (active deliveries)
export const getRiderOrders = asyncHandler(async (req, res) => {
  const Order = (await import('../models/Order.js')).default;

  const orders = await Order.find({
    assignedRider: req.params.id,
    orderStatus: { $in: ['preparing', 'baking', 'out_for_delivery', 'Preparing', 'Baking', 'OutForDelivery'] }
  })
    .populate('branch')
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: orders });
});

// Get rider's delivery history
export const getRiderHistory = asyncHandler(async (req, res) => {
  const Order = (await import('../models/Order.js')).default;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {
    assignedRider: req.params.id,
    orderStatus: { $in: ['delivered', 'cancelled', 'Delivered', 'Cancelled'] }
  };

  // Date range filter if provided
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('branch')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get rider statistics
export const getRiderStats = asyncHandler(async (req, res) => {
  const Order = (await import('../models/Order.js')).default;

  const riderId = req.params.id;

  // Get all orders for this rider
  const allOrders = await Order.find({ assignedRider: riderId });

  const deliveredOrders = allOrders.filter(o =>
    o.orderStatus === 'delivered' || o.orderStatus === 'Delivered'
  );

  const cancelledOrders = allOrders.filter(o =>
    o.orderStatus === 'cancelled' || o.orderStatus === 'Cancelled'
  );

  const activeOrders = allOrders.filter(o =>
    ['preparing', 'baking', 'out_for_delivery', 'Preparing', 'Baking', 'OutForDelivery'].includes(o.orderStatus)
  );

  // Calculate average rating
  const ordersWithRating = deliveredOrders.filter(o => o.rating);
  const avgRating = ordersWithRating.length > 0
    ? ordersWithRating.reduce((sum, o) => sum + o.rating, 0) / ordersWithRating.length
    : 0;

  // Calculate average delivery time (for orders with actual delivery time)
  const ordersWithDeliveryTime = deliveredOrders.filter(o => o.actualDeliveryTime && o.createdAt);
  const avgDeliveryTimeMinutes = ordersWithDeliveryTime.length > 0
    ? ordersWithDeliveryTime.reduce((sum, o) => {
      const timeInMs = new Date(o.actualDeliveryTime) - new Date(o.createdAt);
      return sum + (timeInMs / 1000 / 60); // Convert to minutes
    }, 0) / ordersWithDeliveryTime.length
    : 0;

  // Calculate success rate
  const completedOrders = deliveredOrders.length + cancelledOrders.length;
  const successRate = completedOrders > 0
    ? (deliveredOrders.length / completedOrders) * 100
    : 0;

  // Calculate total revenue delivered
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

  const stats = {
    totalDeliveries: deliveredOrders.length,
    activeDeliveries: activeOrders.length,
    cancelledDeliveries: cancelledOrders.length,
    successRate: Math.round(successRate * 100) / 100,
    averageRating: Math.round(avgRating * 100) / 100,
    averageDeliveryTime: Math.round(avgDeliveryTimeMinutes),
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders: allOrders.length
  };

  res.json({ success: true, data: stats });
});

// Get available riders (for order assignment)
export const getAvailableRiders = asyncHandler(async (req, res) => {
  const query = {
    availability: 'available',
    isActive: true
  };

  // Filter by branch if provided
  if (req.query.branch) {
    query.branch = req.query.branch;
  }

  const riders = await DeliveryRider.find(query).populate('branch');

  res.json({ success: true, data: riders });
});















