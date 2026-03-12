import mongoose from 'mongoose';

export const FOLLOWER_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

const followerSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    followerAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(FOLLOWER_STATUS),
      default: FOLLOWER_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// One follow relationship per pair
followerSchema.index({ accountId: 1, followerAccountId: 1 }, { unique: true });
// Fast lookup for "who follows this account"
followerSchema.index({ accountId: 1, status: 1 });
// Fast lookup for "who does this account follow"
followerSchema.index({ followerAccountId: 1, status: 1 });

const Follower = mongoose.model('Follower', followerSchema);

export default Follower;
