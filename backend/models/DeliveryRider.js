import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  vehicleType: {
    type: String,
    enum: ['Bike', 'Car', 'Scooter'],
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
  },
  licenseNumber: {
    type: String,
    required: true,
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available',
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
}, {
  timestamps: true,
});

export default mongoose.model('DeliveryRider', riderSchema);

