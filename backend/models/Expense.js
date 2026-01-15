import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    category: {
      type: String,
      enum: ['ingredients', 'utilities', 'rent', 'salaries', 'marketing', 'equipment', 'maintenance', 'packaging', 'transportation', 'taxes', 'insurance', 'other'],
      required: [true, 'Category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    receiptUrl: {
      type: String,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
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
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank-transfer', 'cheque', 'card'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
expenseSchema.index({ branchId: 1, expenseDate: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ expenseDate: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
