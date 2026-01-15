import mongoose from 'mongoose';

const salesReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: [true, 'Report type is required'],
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      // null for all branches combined
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    topSellingItems: [{
      menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
      },
      name: String,
      quantity: Number,
      revenue: Number,
    }],
    orderStatusDistribution: {
      delivered: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
    },
    paymentMethodDistribution: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      online: { type: Number, default: 0 },
    },
    orderTypeDistribution: {
      delivery: { type: Number, default: 0 },
      pickup: { type: Number, default: 0 },
      dineIn: { type: Number, default: 0 },
    },
    peakHours: [{
      hour: Number,
      orderCount: Number,
      revenue: Number,
    }],
    customerMetrics: {
      newCustomers: { type: Number, default: 0 },
      returningCustomers: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique report per period per branch
salesReportSchema.index({ reportType: 1, periodStart: 1, branchId: 1 }, { unique: true });
salesReportSchema.index({ periodStart: -1 });

const SalesReport = mongoose.model('SalesReport', salesReportSchema);

export default SalesReport;
