import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
    },
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxLength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulVoters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    adminResponse: {
      type: String,
      trim: true,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: {
      type: Date,
    },
    tags: [{
      type: String,
      enum: ['food-quality', 'delivery', 'service', 'packaging', 'value', 'cleanliness'],
    }],
    images: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index for unique review per order per user
reviewSchema.index({ orderId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ menuId: 1, rating: -1 });
reviewSchema.index({ branchId: 1, rating: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
