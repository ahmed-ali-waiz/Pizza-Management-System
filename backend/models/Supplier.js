import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      unique: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'Pakistan' },
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paymentTerms: {
      type: String,
      enum: ['cod', 'net-15', 'net-30', 'net-60', 'prepaid'],
      default: 'net-30',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
supplierSchema.index({ name: 'text' });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
