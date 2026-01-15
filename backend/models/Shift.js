import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    shiftDate: {
      type: Date,
      required: [true, 'Shift date is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    shiftType: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'full-day'],
      default: 'full-day',
    },
    breakDuration: {
      type: Number,
      default: 30,
      min: 0,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['kitchen', 'counter', 'delivery', 'manager', 'cleaning'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
shiftSchema.index({ userId: 1, shiftDate: 1 });
shiftSchema.index({ branchId: 1, shiftDate: 1 });
shiftSchema.index({ status: 1 });

// Virtual for scheduled hours
shiftSchema.virtual('scheduledHours').get(function () {
  if (this.startTime && this.endTime) {
    const diff = this.endTime - this.startTime;
    return Math.round((diff / (1000 * 60 * 60) - this.breakDuration / 60) * 100) / 100;
  }
  return 0;
});

// Virtual for actual hours worked
shiftSchema.virtual('actualHours').get(function () {
  if (this.actualStartTime && this.actualEndTime) {
    const diff = this.actualEndTime - this.actualStartTime;
    return Math.round((diff / (1000 * 60 * 60) - this.breakDuration / 60) * 100) / 100;
  }
  return 0;
});

shiftSchema.set('toJSON', { virtuals: true });
shiftSchema.set('toObject', { virtuals: true });

const Shift = mongoose.model('Shift', shiftSchema);

export default Shift;
