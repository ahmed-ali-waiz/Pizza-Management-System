import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      // Auto-generated in pre-save hook below
    },
    // Alias for backend compatibility
    orderNumber: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Not required because backend might create orders for guests or walk-ins
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      // required: true, // Temporarily optional to avoid breaking src controller
    },
    items: [
      {
        menuId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Menu',
        },
        // Alias for backend compatibility
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Menu',
        },
        name: String,
        price: Number,
        quantity: Number,
        size: String,
        customizations: [
          {
            name: String,
            value: String,
            additionalPrice: Number,
          },
        ],
        // Backend compatibility
        addons: [{
          name: String,
          price: Number,
        }],
        totalPrice: Number,
      },
    ],
    // Backend compatibility
    cartItems: [],

    deliveryAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      zipCode: String,
      latitude: Number,
      longitude: Number,
    },
    // Backend compatibility
    customerInfo: {
      name: String,
      phone: String,
      email: String,
      address: String,
    },

    orderType: {
      type: String,
      enum: ['Delivery', 'Takeaway', 'DineIn'],
      default: 'Delivery',
    },

    orderStatus: {
      type: String,
      enum: [
        'pending', 'preparing', 'baking', 'out_for_delivery', 'delivered', 'cancelled',
        'Placed', 'Preparing', 'Baking', 'OutForDelivery', 'Delivered', 'Cancelled'
      ],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'online', 'Cash', 'Card', 'Stripe'],
      // required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      default: null,
    },
    subtotal: Number,
    tax: Number,
    deliveryCharges: Number,
    // Backend compatibility
    deliveryFee: Number,

    discountAmount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    totalAmount: Number,
    // Backend compatibility
    total: Number,

    specialInstructions: String,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    riderAssigned: { // Changed from riderAssigned to assignedRider in backend? No, backend has assignedRider.
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryRider',
      default: null,
    },
    // Backend compatibility
    assignedRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryRider',
      default: null,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    review: String,
    cancelReason: String,
    cancelledAt: Date,
  },
  { timestamps: true }
);

// Generate order ID
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD-${Date.now()}-${count + 1}`;
  }
  // Sync aliases
  if (!this.orderNumber) this.orderNumber = this.orderId;
  if (!this.total) this.total = this.totalAmount;
  if (!this.totalAmount) this.totalAmount = this.total;
  if (!this.deliveryFee) this.deliveryFee = this.deliveryCharges;
  if (!this.assignedRider) this.assignedRider = this.riderAssigned;
  if (!this.riderAssigned) this.riderAssigned = this.assignedRider;

  next();
});

export default mongoose.model('Order', orderSchema);

