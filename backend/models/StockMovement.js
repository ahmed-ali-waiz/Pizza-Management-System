import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory reference is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    movementType: {
      type: String,
      enum: ['purchase', 'sale', 'transfer', 'adjustment', 'waste', 'return'],
      required: [true, 'Movement type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    previousQuantity: {
      type: Number,
      default: 0,
    },
    newQuantity: {
      type: Number,
      default: 0,
    },
    referenceOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
    unitCost: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for filtering
stockMovementSchema.index({ inventoryId: 1, createdAt: -1 });
stockMovementSchema.index({ branchId: 1, movementType: 1 });
stockMovementSchema.index({ createdAt: -1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

export default StockMovement;
