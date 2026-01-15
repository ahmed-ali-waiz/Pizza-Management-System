import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: [true, 'Payment is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    reasonCategory: {
      type: String,
      enum: ['cancelled-order', 'wrong-order', 'quality-issue', 'delayed-delivery', 'duplicate-payment', 'customer-request', 'other'],
      default: 'customer-request',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled', 'failed'],
      default: 'pending',
    },
    refundMethod: {
      type: String,
      enum: ['original', 'cash', 'bank-transfer', 'wallet-credit'],
      default: 'original',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    stripeRefundId: {
      type: String,
      trim: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
refundSchema.index({ orderId: 1 });
refundSchema.index({ paymentId: 1 });
refundSchema.index({ userId: 1 });
refundSchema.index({ status: 1, createdAt: -1 });

const Refund = mongoose.model('Refund', refundSchema);

export default Refund;
