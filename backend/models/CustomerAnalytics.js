import mongoose from 'mongoose';

const customerAnalyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    favoriteItems: [{
      menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
      },
      orderCount: Number,
    }],
    favoriteBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    segment: {
      type: String,
      enum: ['new', 'regular', 'vip', 'churned', 'at-risk'],
      default: 'new',
    },
    churnRisk: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    lastOrderDate: {
      type: Date,
    },
    firstOrderDate: {
      type: Date,
    },
    customerLifetimeValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageOrderFrequency: {
      type: Number, // days between orders
      default: 0,
    },
    preferredOrderType: {
      type: String,
      enum: ['delivery', 'pickup', 'dine-in'],
    },
    preferredPaymentMethod: {
      type: String,
    },
    daysSinceLastOrder: {
      type: Number,
      default: 0,
    },
    ordersByMonth: [{
      month: String,
      count: Number,
      revenue: Number,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
customerAnalyticsSchema.index({ userId: 1 });
customerAnalyticsSchema.index({ segment: 1 });
customerAnalyticsSchema.index({ churnRisk: 1 });
customerAnalyticsSchema.index({ totalSpent: -1 });
customerAnalyticsSchema.index({ lastOrderDate: -1 });

// Method to update segment based on order history
customerAnalyticsSchema.methods.updateSegment = function () {
  const daysSinceLastOrder = this.lastOrderDate
    ? Math.floor((new Date() - this.lastOrderDate) / (1000 * 60 * 60 * 24))
    : 999;

  this.daysSinceLastOrder = daysSinceLastOrder;

  if (daysSinceLastOrder > 90) {
    this.segment = 'churned';
    this.churnRisk = 'high';
  } else if (daysSinceLastOrder > 60) {
    this.segment = 'at-risk';
    this.churnRisk = 'high';
  } else if (this.totalSpent >= 50000) {
    this.segment = 'vip';
    this.churnRisk = 'low';
  } else if (this.totalOrders >= 5) {
    this.segment = 'regular';
    this.churnRisk = daysSinceLastOrder > 30 ? 'medium' : 'low';
  } else {
    this.segment = 'new';
    this.churnRisk = 'medium';
  }

  return this;
};

const CustomerAnalytics = mongoose.model('CustomerAnalytics', customerAnalyticsSchema);

export default CustomerAnalytics;
