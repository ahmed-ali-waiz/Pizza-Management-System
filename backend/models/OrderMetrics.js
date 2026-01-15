import mongoose from 'mongoose';

const orderMetricsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      // null for all branches
    },
    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    averagePreparationTime: {
      type: Number, // minutes
      default: 0,
      min: 0,
    },
    averageDeliveryTime: {
      type: Number, // minutes
      default: 0,
      min: 0,
    },
    onTimeDeliveryRate: {
      type: Number, // percentage 0-100
      default: 100,
      min: 0,
      max: 100,
    },
    cancellationRate: {
      type: Number, // percentage 0-100
      default: 0,
      min: 0,
      max: 100,
    },
    cancellationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
    },
    peakHours: [{
      hour: {
        type: Number,
        min: 0,
        max: 23,
      },
      orderCount: Number,
      revenue: Number,
    }],
    orderTypeBreakdown: {
      delivery: { type: Number, default: 0 },
      pickup: { type: Number, default: 0 },
      dineIn: { type: Number, default: 0 },
    },
    riderPerformance: [{
      riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryRider',
      },
      deliveryCount: Number,
      averageTime: Number,
      onTimeRate: Number,
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index for unique metrics per date per branch
orderMetricsSchema.index({ date: 1, branchId: 1 }, { unique: true });
orderMetricsSchema.index({ date: -1 });

const OrderMetrics = mongoose.model('OrderMetrics', orderMetricsSchema);

export default OrderMetrics;
