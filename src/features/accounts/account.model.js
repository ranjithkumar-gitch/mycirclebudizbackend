import mongoose from 'mongoose';
import { ACCOUNT_TYPE_VALUES } from '../../common/constants/account-types.js';

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ACCOUNT_TYPE_VALUES,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Case-insensitive uniqueness: displayName is stored lowercase
accountSchema.index({ userId: 1, displayName: 1 }, { unique: true });

const Account = mongoose.model('Account', accountSchema);

export default Account;
