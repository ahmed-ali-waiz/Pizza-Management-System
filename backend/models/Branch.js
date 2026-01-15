import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  branchName: {
    type: String,
    required: [true, 'Please add a branch name'],
    unique: true,
    trim: true,
  },
  address: {
    street: String,
    city: {
      type: String,
      required: true,
    },
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Pakistan',
    },
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  deliveryRadius: {
    type: Number,
    default: 5,
    min: 1,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  phone: String,
  email: String,
}, {
  timestamps: true,
});

export default mongoose.model('Branch', branchSchema);

