import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  phone: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'BranchManager', 'Staff', 'Customer'],
    default: 'Customer',
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Pakistan',
    },
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Alias for compatibility with src controllers
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add fields from src/models/User.js
userSchema.add({
  isAdmin: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  }],
  defaultAddressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  // Stripe payment integration
  stripeCustomerId: {
    type: String,
    default: null,
  },
  defaultPaymentMethod: {
    type: String,
    default: null,
  },
});

export default mongoose.model('User', userSchema);

