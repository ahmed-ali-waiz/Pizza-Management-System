import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Setting value is required'],
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'json', 'array'],
      default: 'string',
    },
    category: {
      type: String,
      enum: ['general', 'payment', 'delivery', 'notification', 'loyalty', 'tax', 'order', 'app', 'other'],
      default: 'general',
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      // null for global settings
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validationRules: {
      min: Number,
      max: Number,
      options: [mongoose.Schema.Types.Mixed],
      pattern: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique key per branch (null for global)
settingsSchema.index({ key: 1, branchId: 1 }, { unique: true });
settingsSchema.index({ category: 1 });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
