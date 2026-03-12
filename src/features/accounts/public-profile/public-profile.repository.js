import Account from '../account.model.js';

class PublicProfileRepository {
  async findPublicById(accountId) {
    return Account.findOne({ _id: accountId, isDeleted: false, isPublic: true });
  }

  async updateById(id, updates) {
    return Account.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }
}

export default new PublicProfileRepository();
