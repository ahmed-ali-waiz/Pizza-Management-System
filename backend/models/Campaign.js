import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    campaignType: {
      type: String,
      enum: ['email', 'sms', 'push', 'banner', 'social', 'discount'],
      required: [true, 'Campaign type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'ended', 'scheduled'],
      default: 'draft',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'new', 'regular', 'vip', 'inactive'],
      default: 'all',
    },
    budget: {
      type: Number,
      min: 0,
      default: 0,
    },
    branches: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    }],
    featuredItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
    }],
    content: {
      subject: String,
      title: String,
      message: String,
      imageUrl: String,
      linkUrl: String,
    },
    discountDetails: {
      type: {
        type: String,
        enum: ['percentage', 'fixed', 'bogo', 'freeDelivery'],
      },
      value: Number,
      minOrderValue: Number,
      maxDiscount: Number,
      code: String,
    },
    metrics: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      converted: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ campaignType: 1 });

// Virtual for checking if campaign is currently active
campaignSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate >= now;
});

campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
