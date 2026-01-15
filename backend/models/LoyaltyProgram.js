import mongoose from 'mongoose';

const pointHistorySchema = new mongoose.Schema({
  points: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'expired', 'bonus', 'adjustment'],
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const loyaltyProgramSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsHistory: [pointHistorySchema],
    expiryDate: {
      type: Date,
    },
    lifetimePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index
loyaltyProgramSchema.index({ userId: 1 });
loyaltyProgramSchema.index({ tier: 1 });
loyaltyProgramSchema.index({ points: -1 });

// Method to calculate tier based on total spent
loyaltyProgramSchema.methods.calculateTier = function () {
  if (this.totalSpent >= 100000) return 'platinum';
  if (this.totalSpent >= 50000) return 'gold';
  if (this.totalSpent >= 20000) return 'silver';
  return 'bronze';
};

// Method to add points
loyaltyProgramSchema.methods.addPoints = function (points, reason, orderId = null) {
  this.points += points;
  this.lifetimePoints += points;
  this.pointsHistory.push({
    points,
    type: 'earned',
    reason,
    orderId,
    date: new Date(),
  });
  this.tier = this.calculateTier();
  return this;
};

// Method to redeem points
loyaltyProgramSchema.methods.redeemPoints = function (points, reason) {
  if (this.points < points) {
    throw new Error('Insufficient points');
  }
  this.points -= points;
  this.pointsHistory.push({
    points: -points,
    type: 'redeemed',
    reason,
    date: new Date(),
  });
  return this;
};

const LoyaltyProgram = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);

export default LoyaltyProgram;
