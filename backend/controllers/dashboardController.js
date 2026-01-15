import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import Task from '../models/Task.js';
import Complaint from '../models/Complaint.js';
import Payment from '../models/Payment.js';
import Branch from '../models/Branch.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { branchId } = req.query;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const matchFilter = branchId ? { branchId } : {};

  // Today's stats
  const todayOrders = await Order.aggregate([
    { $match: { ...matchFilter, createdAt: { $gte: today, $lt: tomorrow } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
        delivered: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] },
        },
      },
    },
  ]);

  // This month's stats
  const thisMonthOrders = await Order.aggregate([
    { $match: { ...matchFilter, createdAt: { $gte: thisMonthStart } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
  ]);

  // Last month's stats for comparison
  const lastMonthOrders = await Order.aggregate([
    {
      $match: {
        ...matchFilter,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
  ]);

  // Recent orders
  const recentOrders = await Order.find(matchFilter)
    .populate('user', 'name email phone')
    .populate('branchId', 'branchName')
    .sort({ createdAt: -1 })
    .limit(10);

  // Low stock alerts
  const lowStockFilter = branchId
    ? { branchId, $expr: { $lt: ['$quantity', '$minStockLevel'] } }
    : { $expr: { $lt: ['$quantity', '$minStockLevel'] } };

  const lowStockAlerts = await Inventory.find(lowStockFilter)
    .populate('itemId', 'name category')
    .populate('branchId', 'branchName')
    .sort({ quantity: 1 })
    .limit(10);

  // Pending tasks
  const pendingTasks = await Task.find({
    ...(branchId ? { branchId } : {}),
    status: { $in: ['pending', 'in-progress'] },
  })
    .populate('assignedTo', 'name')
    .populate('branchId', 'branchName')
    .sort({ priority: -1, dueDate: 1 })
    .limit(10);

  // Open complaints
  const openComplaints = await Complaint.find({
    ...(branchId ? { branchId } : {}),
    status: { $in: ['open', 'in-progress'] },
  })
    .populate('userId', 'name')
    .populate('branchId', 'branchName')
    .sort({ priority: -1, createdAt: -1 })
    .limit(10);

  // Weekly revenue trend
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const revenueChart = await Order.aggregate([
    {
      $match: {
        ...matchFilter,
        createdAt: { $gte: weekAgo },
        orderStatus: { $ne: 'Cancelled' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Weekly orders trend
  const ordersChart = await Order.aggregate([
    {
      $match: {
        ...matchFilter,
        createdAt: { $gte: weekAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        delivered: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Customers count
  const todayNewCustomers = await User.countDocuments({
    role: 'customer',
    createdAt: { $gte: today, $lt: tomorrow },
  });

  const totalCustomers = await User.countDocuments({ role: 'customer' });

  // Pending orders
  const pendingOrdersCount = await Order.countDocuments({
    ...matchFilter,
    orderStatus: { $in: ['Placed', 'Preparing', 'Ready', 'Out for Delivery'] },
  });

  // Branch stats (if not filtering by branch)
  let branchStats = [];
  if (!branchId) {
    branchStats = await Order.aggregate([
      { $match: { createdAt: { $gte: thisMonthStart } } },
      {
        $group: {
          _id: '$branchId',
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch',
        },
      },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          branchName: '$branch.branchName',
          orders: 1,
          revenue: 1,
        },
      },
    ]);
  }

  const todayData = todayOrders[0] || { count: 0, revenue: 0, delivered: 0, cancelled: 0 };
  const thisMonthData = thisMonthOrders[0] || { count: 0, revenue: 0 };
  const lastMonthData = lastMonthOrders[0] || { count: 0, revenue: 0 };

  res.json({
    success: true,
    data: {
      todayStats: {
        orders: todayData.count,
        revenue: todayData.revenue,
        delivered: todayData.delivered,
        cancelled: todayData.cancelled,
        newCustomers: todayNewCustomers,
      },
      monthlyStats: {
        orders: thisMonthData.count,
        revenue: thisMonthData.revenue,
        ordersGrowth: lastMonthData.count > 0
          ? (((thisMonthData.count - lastMonthData.count) / lastMonthData.count) * 100).toFixed(1)
          : 0,
        revenueGrowth: lastMonthData.revenue > 0
          ? (((thisMonthData.revenue - lastMonthData.revenue) / lastMonthData.revenue) * 100).toFixed(1)
          : 0,
      },
      totalCustomers,
      pendingOrders: pendingOrdersCount,
      recentOrders,
      lowStockAlerts,
      pendingTasks,
      openComplaints,
      revenueChart,
      ordersChart,
      branchStats,
    },
  });
});

// @desc    Get KDS orders
// @route   GET /api/kds/orders
// @access  Private
export const getKDSOrders = asyncHandler(async (req, res) => {
  const { branchId, status } = req.query;

  // Build filter for active orders
  const filter = {
    orderStatus: {
      $in: status
        ? [status]
        : ['Placed', 'Confirmed', 'Preparing', 'Baking', 'Ready'],
    },
  };

  if (branchId) {
    filter.branchId = branchId;
  }

  const orders = await Order.find(filter)
    .populate('user', 'name phone')
    .populate('branchId', 'branchName')
    .populate('riderAssigned', 'name phone')
    .sort({ createdAt: 1 }) // Oldest first (FIFO)
    .lean();

  // Group by status for KDS display
  const groupedOrders = {
    placed: orders.filter((o) => o.orderStatus === 'Placed'),
    confirmed: orders.filter((o) => o.orderStatus === 'Confirmed'),
    preparing: orders.filter((o) => o.orderStatus === 'Preparing'),
    baking: orders.filter((o) => o.orderStatus === 'Baking'),
    ready: orders.filter((o) => o.orderStatus === 'Ready'),
  };

  // Calculate estimated times
  const processedOrders = orders.map((order) => {
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const elapsedMinutes = Math.round((now - createdAt) / (1000 * 60));

    // Default preparation time is 20 minutes
    const estimatedPrepTime = order.estimatedPrepTime || 20;
    const remainingTime = Math.max(0, estimatedPrepTime - elapsedMinutes);

    return {
      ...order,
      elapsedMinutes,
      remainingTime,
      isDelayed: elapsedMinutes > estimatedPrepTime,
    };
  });

  res.json({
    success: true,
    data: processedOrders,
    grouped: groupedOrders,
    summary: {
      total: orders.length,
      placed: groupedOrders.placed.length,
      confirmed: groupedOrders.confirmed.length,
      preparing: groupedOrders.preparing.length,
      baking: groupedOrders.baking.length,
      ready: groupedOrders.ready.length,
    },
  });
});
