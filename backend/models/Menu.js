import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema({
  size: String,
  price: Number,
});

const addonSchema = new mongoose.Schema({
  name: String,
  price: Number,
});

const menuSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Pizza', 'Drinks', 'Deals', 'Sides'],
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  ingredients: [String],
  sizes: [sizeSchema],
  addons: [addonSchema],
  image: {
    type: String,
    default: '',
  },
  tags: [String],
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Menu', menuSchema);

