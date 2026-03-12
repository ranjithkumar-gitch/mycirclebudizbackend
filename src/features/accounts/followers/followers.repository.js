import Follower, { FOLLOWER_STATUS } from './follower.model.js';

class FollowersRepository {
  async create(data) {
    return Follower.create(data);
  }

  async findByPair(accountId, followerAccountId) {
    return Follower.findOne({ accountId, followerAccountId });
  }

  async findById(id) {
    return Follower.findById(id);
  }

  async updateStatus(id, status) {
    return Follower.findByIdAndUpdate(id, { status }, { new: true });
  }

  async deleteById(id) {
    return Follower.findByIdAndDelete(id);
  }

  async findFollowers(accountId, page, limit) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Follower.find({ accountId, status: FOLLOWER_STATUS.ACCEPTED })
        .populate('followerAccountId', 'displayName type profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Follower.countDocuments({ accountId, status: FOLLOWER_STATUS.ACCEPTED }),
    ]);
    return { records, total };
  }

  async findFollowing(followerAccountId, page, limit) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Follower.find({ followerAccountId, status: FOLLOWER_STATUS.ACCEPTED })
        .populate('accountId', 'displayName type profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Follower.countDocuments({ followerAccountId, status: FOLLOWER_STATUS.ACCEPTED }),
    ]);
    return { records, total };
  }

  async findPendingRequests(accountId, page, limit) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Follower.find({ accountId, status: FOLLOWER_STATUS.PENDING })
        .populate('followerAccountId', 'displayName type profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Follower.countDocuments({ accountId, status: FOLLOWER_STATUS.PENDING }),
    ]);
    return { records, total };
  }

  async countFollowers(accountId) {
    return Follower.countDocuments({ accountId, status: FOLLOWER_STATUS.ACCEPTED });
  }

  async countFollowing(followerAccountId) {
    return Follower.countDocuments({ followerAccountId, status: FOLLOWER_STATUS.ACCEPTED });
  }
}

export default new FollowersRepository();
