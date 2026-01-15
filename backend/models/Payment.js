import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // Reference to order
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  
  // Reference to user (for payment history)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Reference to branch
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  
  // Payment amount details
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  
  // Breakdown of payment
  breakdown: {
    subtotal: Number,
    tax: Number,
    deliveryFee: Number,
    discount: Number,
    tip: Number,
  },
  
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Stripe', 'COD', 'Online', 'Wallet'],
    required: true,
  },
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  
  // Transaction identifiers
  transactionId: {
    type: String,
    index: true,
  },
  
  // Stripe specific fields
  stripePaymentIntentId: {
    type: String,
    index: true,
  },
  stripeCustomerId: String,
  stripePaymentMethodId: String,
  stripeChargeId: String,
  stripeClientSecret: String,
  
  // Card details (last 4 digits only for security)
  cardDetails: {
    brand: String, // visa, mastercard, amex, etc.
    last4: String,
    expMonth: Number,
    expYear: Number,
    fingerprint: String, // For fraud detection
  },
  
  // Cash payment details
  cashDetails: {
    amountReceived: Number,
    changeGiven: Number,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  
  // Refund details
  refundDetails: {
    refundId: String,
    refundedAmount: Number,
    refundReason: String,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    stripeRefundId: String,
    isPartialRefund: Boolean,
  },
  
  // Payment failure details
  failureDetails: {
    code: String,
    message: String,
    declineCode: String,
    failedAt: Date,
  },
  
  // Metadata
  notes: String,
  receiptUrl: String,
  receiptNumber: String,
  invoiceNumber: String,
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Dispute tracking
  dispute: {
    isDisputed: { type: Boolean, default: false },
    disputeId: String,
    reason: String,
    status: String,
    disputedAt: Date,
    resolvedAt: Date,
  },
  
  // IP and device info for fraud prevention
  clientInfo: {
    ipAddress: String,
    userAgent: String,
    deviceId: String,
  },
  
  // Processing timestamps
  initiatedAt: Date,
  processedAt: Date,
  completedAt: Date,
}, {
  timestamps: true,
});

// Indexes for faster queries
paymentSchema.index({ order: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ branch: 1, createdAt: -1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Pre-save hook to generate receipt number
paymentSchema.pre('save', async function(next) {
  if (!this.receiptNumber && this.paymentStatus === 'completed') {
    const count = await mongoose.model('Payment').countDocuments();
    this.receiptNumber = `RCP-${Date.now()}-${count + 1}`;
  }
  next();
});

// Method to mark as completed
paymentSchema.methods.markAsCompleted = function(transactionId) {
  this.paymentStatus = 'completed';
  this.transactionId = transactionId;
  this.completedAt = new Date();
  return this.save();
};

// Method to mark as failed
paymentSchema.methods.markAsFailed = function(failureCode, failureMessage) {
  this.paymentStatus = 'failed';
  this.failureDetails = {
    code: failureCode,
    message: failureMessage,
    failedAt: new Date(),
  };
  return this.save();
};

// Static method to get payment by stripe intent
paymentSchema.statics.findByStripeIntent = function(paymentIntentId) {
  return this.findOne({ stripePaymentIntentId: paymentIntentId });
};

export default mongoose.model('Payment', paymentSchema);


