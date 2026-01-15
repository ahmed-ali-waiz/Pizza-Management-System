import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // null for broadcast notifications
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['order', 'promotion', 'system', 'loyalty', 'reminder', 'alert', 'info'],
      default: 'info',
    },
    channel: {
      type: String,
      enum: ['push', 'email', 'sms', 'in-app'],
      default: 'in-app',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'read', 'failed'],
      default: 'pending',
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    readAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
