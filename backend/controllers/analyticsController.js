import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Menu from '../models/Menu.js';
import Branch from '../models/Branch.js';

// @desc    Get sales reports
// @route   GET /api/analytics/sales-reports
// @access  Private
export const getSalesReports = asyncHandler(async (req, res) => {
  const { startDate, endDate, branchId, reportType = 'daily' } = req.query;

  // Default to last 30 days if no dates provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  const matchFilter = {
    createdAt: { $gte: start, $lte: end },
  };
  if (branchId) matchFilter.branchId = branchId;

  // Get orders data
  const ordersData = await Order.aggregate([
    { $match: matchFilter },
    {
      $addFields: {
        finalTotal: { $ifNull: ['$totalAmount', { $ifNull: ['$total', 0] }] }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$finalTotal' },
        averageOrderValue: { $avg: '$finalTotal' },
        totalItemsSold: { $sum: { $size: { $ifNull: ['$items', { $ifNull: ['$cartItems', []] }] } } },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] },
        },
      },
    },
  ]);

  // Get order status distribution
  const orderStatusDistribution = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get payment method distribution
  const paymentDistribution = await Order.aggregate([
    { $match: matchFilter },
    {
      $addFields: {
        finalTotal: { $ifNull: ['$totalAmount', { $ifNull: ['$total', 0] }] }
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        total: { $sum: '$finalTotal' },
      },
    },
  ]);

  // Get top selling items - handle both items and cartItems arrays
  const topSellingItems = await Order.aggregate([
    { $match: matchFilter },
    {
      $project: {
        allItems: {
          $concatArrays: [
            { $ifNull: ['$items', []] },
            { $ifNull: ['$cartItems', []] }
          ]
        }
      }
    },
    { $unwind: '$allItems' },
    {
      $group: {
        _id: { $ifNull: ['$allItems.menuItem', '$allItems.menuId'] },
        name: { $first: '$allItems.name' },
        quantitySold: { $sum: { $ifNull: ['$allItems.quantity', 1] } },
        revenue: { 
          $sum: { 
            $multiply: [
              { $ifNull: ['$allItems.price', 0] }, 
              { $ifNull: ['$allItems.quantity', 1] }
            ] 
          } 
        },
      },
    },
    { $match: { name: { $ne: null } } },
    { $sort: { quantitySold: -1 } },
    { $limit: 20 },
  ]);

  // Get daily revenue trend
  const revenueTrend = await Order.aggregate([
    { $match: { ...matchFilter, orderStatus: { $nin: ['Cancelled', 'cancelled'] } } },
    {
      $addFields: {
        finalTotal: { $ifNull: ['$totalAmount', { $ifNull: ['$total', 0] }] }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$finalTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const summary = ordersData[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItemsSold: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  };

  res.json({
    success: true,
    data: {
      // Flattened for frontend compatibility
      totalOrders: summary.totalOrders,
      totalRevenue: summary.totalRevenue,
      averageOrderValue: summary.averageOrderValue,
      totalItemsSold: summary.totalItemsSold,
      deliveredOrders: summary.deliveredOrders,
      cancelledOrders: summary.cancelledOrders,
      summary,
      orderStatusDistribution: orderStatusDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      paymentMethodDistribution: paymentDistribution.reduce((acc, item) => {
        acc[item._id || 'unknown'] = { count: item.count, total: item.total };
        return acc;
      }, {}),
      topSellingItems,
      revenueTrend,
      period: { start, end },
    },
  });
});

// @desc    Get order metrics
// @route   GET /api/analytics/order-metrics
// @access  Private
export const getOrderMetrics = asyncHandler(async (req, res) => {
  const { startDate, endDate, branchId } = req.query;

  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  const matchFilter = {
    createdAt: { $gte: start, $lte: end },
  };
  if (branchId) matchFilter.branchId = branchId;

  // Order performance metrics
  const metrics = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] },
        },
        averagePreparationTime: { $avg: '$preparationTime' },
        averageDeliveryTime: { $avg: '$deliveryTime' },
      },
    },
  ]);

  // Peak hours analysis
  const peakHours = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        orderCount: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { orderCount: -1 } },
  ]);

  // Order type breakdown
  const orderTypeBreakdown = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$orderType',
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
  ]);

  // Daily order trend
  const dailyTrend = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orderCount: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const summary = metrics[0] || {
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averagePreparationTime: 0,
    averageDeliveryTime: 0,
  };

  res.json({
    success: true,
    data: {
      summary: {
        ...summary,
        cancellationRate: summary.totalOrders > 0
          ? ((summary.cancelledOrders / summary.totalOrders) * 100).toFixed(2)
          : 0,
        completionRate: summary.totalOrders > 0
          ? ((summary.completedOrders / summary.totalOrders) * 100).toFixed(2)
          : 0,
      },
      peakHours: peakHours.map((h) => ({
        hour: h._id,
        orderCount: h.orderCount,
        revenue: h.revenue,
      })),
      orderTypeBreakdown: orderTypeBreakdown.reduce((acc, item) => {
        acc[item._id || 'delivery'] = { count: item.count, revenue: item.revenue };
        return acc;
      }, {}),
      dailyTrend,
      period: { start, end },
    },
  });
});

// @desc    Get customer statistics
// @route   GET /api/analytics/customer-stats
// @access  Private
export const getCustomerStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total customers
  const totalCustomers = await User.countDocuments({ role: 'customer' });

  // New customers in period
  const newCustomers = await User.countDocuments({
    role: 'customer',
    createdAt: { $gte: start, $lte: end },
  });

  // Active customers (placed order in period)
  const activeCustomers = await Order.distinct('user', {
    createdAt: { $gte: start, $lte: end },
  });

  // Customer order stats
  const customerOrderStats = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
      },
    },
    {
      $group: {
        _id: null,
        averageOrdersPerCustomer: { $avg: '$orderCount' },
        averageSpentPerCustomer: { $avg: '$totalSpent' },
        maxOrders: { $max: '$orderCount' },
        maxSpent: { $max: '$totalSpent' },
      },
    },
  ]);

  // Customer segmentation
  const customerSegments = await Order.aggregate([
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        lastOrder: { $max: '$createdAt' },
      },
    },
    {
      $project: {
        segment: {
          $switch: {
            branches: [
              { case: { $gte: ['$totalSpent', 50000] }, then: 'vip' },
              { case: { $gte: ['$orderCount', 10] }, then: 'loyal' },
              { case: { $gte: ['$orderCount', 3] }, then: 'regular' },
            ],
            default: 'new',
          },
        },
      },
    },
    {
      $group: {
        _id: '$segment',
        count: { $sum: 1 },
      },
    },
  ]);

  // Top customers
  const topCustomers = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        name: '$userInfo.name',
        email: '$userInfo.email',
        orderCount: 1,
        totalSpent: 1,
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      summary: {
        totalCustomers,
        newCustomers,
        activeCustomers: activeCustomers.length,
        customerGrowthRate: totalCustomers > 0
          ? ((newCustomers / totalCustomers) * 100).toFixed(2)
          : 0,
      },
      averages: customerOrderStats[0] || {
        averageOrdersPerCustomer: 0,
        averageSpentPerCustomer: 0,
        maxOrders: 0,
        maxSpent: 0,
      },
      segments: customerSegments.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topCustomers,
      period: { start, end },
    },
  });
});

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
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
  const todayStats = await Order.aggregate([
    { $match: { ...matchFilter, createdAt: { $gte: today, $lt: tomorrow } } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
        delivered: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] },
        },
      },
    },
  ]);

  // This month's stats
  const thisMonthStats = await Order.aggregate([
    { $match: { ...matchFilter, createdAt: { $gte: thisMonthStart } } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
      },
    },
  ]);

  // Last month's stats for comparison
  const lastMonthStats = await Order.aggregate([
    {
      $match: {
        ...matchFilter,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      },
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
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

  // Weekly revenue trend
  const weeklyRevenue = await Order.aggregate([
    {
      $match: {
        ...matchFilter,
        createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
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

  // Today's new customers
  const todayNewCustomers = await User.countDocuments({
    role: 'customer',
    createdAt: { $gte: today, $lt: tomorrow },
  });

  // Pending orders count
  const pendingOrders = await Order.countDocuments({
    ...matchFilter,
    orderStatus: { $in: ['Placed', 'Preparing', 'Ready', 'Out for Delivery'] },
  });

  const thisMonth = thisMonthStats[0] || { orders: 0, revenue: 0, averageOrderValue: 0 };
  const lastMonth = lastMonthStats[0] || { orders: 0, revenue: 0 };

  res.json({
    success: true,
    data: {
      today: {
        orders: todayStats[0]?.orders || 0,
        revenue: todayStats[0]?.revenue || 0,
        delivered: todayStats[0]?.delivered || 0,
        newCustomers: todayNewCustomers,
      },
      thisMonth: {
        orders: thisMonth.orders,
        revenue: thisMonth.revenue,
        averageOrderValue: Math.round(thisMonth.averageOrderValue || 0),
        ordersGrowth: lastMonth.orders > 0
          ? (((thisMonth.orders - lastMonth.orders) / lastMonth.orders) * 100).toFixed(1)
          : 0,
        revenueGrowth: lastMonth.revenue > 0
          ? (((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100).toFixed(1)
          : 0,
      },
      pendingOrders,
      recentOrders,
      weeklyRevenue,
    },
  });
});
