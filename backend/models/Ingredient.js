import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['vegetable', 'meat', 'cheese', 'sauce', 'dough', 'spice', 'topping', 'other'],
      default: 'other',
    },
    unit: {
      type: String,
      enum: ['kg', 'gram', 'liter', 'ml', 'piece', 'pack'],
      default: 'kg',
    },
    pricePerUnit: {
      type: Number,
      min: 0,
      default: 0,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    allergenInfo: [{
      type: String,
      enum: ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'fish', 'shellfish', 'sesame'],
    }],
    expiryDate: {
      type: Date,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
ingredientSchema.index({ name: 'text', category: 1 });

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

export default Ingredient;
