import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned user is required'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold'],
      default: 'pending',
    },
    category: {
      type: String,
      enum: ['cleaning', 'inventory', 'preparation', 'delivery', 'maintenance', 'customer-service', 'other'],
      default: 'other',
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    notes: {
      type: String,
      trim: true,
    },
    estimatedTime: {
      type: Number, // in minutes
      min: 0,
    },
    actualTime: {
      type: Number, // in minutes
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ branchId: 1, status: 1 });
taskSchema.index({ priority: 1, dueDate: 1 });
taskSchema.index({ status: 1 });

// Virtual for checking if overdue
taskSchema.virtual('isOverdue').get(function () {
  if (this.dueDate && this.status !== 'completed' && this.status !== 'cancelled') {
    return new Date() > this.dueDate;
  }
  return false;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;
