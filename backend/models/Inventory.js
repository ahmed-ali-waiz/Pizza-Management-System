import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: [true, 'Menu item is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    maxStockLevel: {
      type: Number,
      default: 100,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['piece', 'kg', 'liter', 'gram', 'ml', 'box', 'pack'],
      default: 'piece',
    },
    costPerUnit: {
      type: Number,
      min: 0,
      default: 0,
    },
    supplier: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    lastRestocked: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique item per branch
inventorySchema.index({ itemId: 1, branchId: 1 }, { unique: true });

// Index for low stock queries
inventorySchema.index({ quantity: 1 });

// Virtual for checking if low stock
inventorySchema.virtual('isLowStock').get(function () {
  return this.quantity < this.minStockLevel;
});

// Ensure virtuals are included in JSON
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
