import Account from './account.model.js';

class AccountsRepository {
  async create(data) {
    return Account.create(data);
  }

  async findByUserId(userId) {
    return Account.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async findById(id) {
    return Account.findOne({ _id: id, isDeleted: false });
  }

  async updateById(id, updates) {
    return Account.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }

  async findPersonalByUserId(userId) {
    return Account.findOne({ userId, type: 'personal', isDeleted: false });
  }

  async softDelete(id) {
    return Account.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }
}

export default new AccountsRepository();
