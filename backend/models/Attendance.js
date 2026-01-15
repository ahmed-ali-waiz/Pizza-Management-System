import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
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
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'],
      default: 'present',
    },
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    earlyLeaveMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    hoursWorked: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique attendance per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ branchId: 1, date: 1 });
attendanceSchema.index({ status: 1 });

// Method to calculate hours worked
attendanceSchema.methods.calculateHoursWorked = function () {
  if (this.checkInTime && this.checkOutTime) {
    const diff = this.checkOutTime - this.checkInTime;
    this.hoursWorked = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }
  return this.hoursWorked;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
