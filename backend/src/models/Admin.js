import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          'manage_users',
          'manage_orders',
          'manage_menu',
          'manage_branches',
          'manage_admins',
          'manage_payments',
          'manage_coupons',
          'view_reports',
        ],
      },
    ],
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Admin', adminSchema);
