import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['food-quality', 'delivery', 'service', 'payment', 'app-issue', 'hygiene', 'wrong-order', 'missing-items', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed', 'escalated'],
      default: 'open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      type: String,
      trim: true,
    },
    resolutionType: {
      type: String,
      enum: ['refund', 'replacement', 'credit', 'apology', 'explanation', 'other'],
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [{
      type: String,
    }],
    internalNotes: {
      type: String,
      trim: true,
    },
    customerSatisfaction: {
      type: Number,
      min: 1,
      max: 5,
    },
    responseTime: {
      type: Number, // in minutes
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ orderId: 1 });
complaintSchema.index({ branchId: 1, status: 1 });
complaintSchema.index({ status: 1, priority: -1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
