import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please provide full name'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
    },
    addressLine1: {
      type: String,
      required: [true, 'Please provide address line 1'],
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
    },
    state: {
      type: String,
      required: [true, 'Please provide state'],
    },
    zipCode: {
      type: String,
      required: [true, 'Please provide zip code'],
    },
    country: {
      type: String,
      default: 'India',
    },
    latitude: Number,
    longitude: Number,
    addressType: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Address', addressSchema);
