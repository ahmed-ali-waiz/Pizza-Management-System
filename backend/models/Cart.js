import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Alias for backend compatibility if needed
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [
      {
        menuId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Menu',
          required: true,
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        size: {
          type: String,
          enum: ['small', 'medium', 'large', 'xlarge'],
        },
        customizations: [
          {
            name: String,
            value: String,
            additionalPrice: {
              type: Number,
              default: 0,
            },
          },
        ],
        // Backend compatibility fields
        addons: [{
          name: String,
          price: Number,
        }],
        totalPrice: Number,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Method to calculate totals
cartSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.tax = this.subtotal * 0.05; // 5% tax
  this.total = this.subtotal + this.tax + this.deliveryCharges - this.discountAmount;
  return this.save();
};

export default mongoose.model('Cart', cartSchema);

