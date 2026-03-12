import User from './user.model.js';
import Account from '../accounts/account.model.js';

class UsersRepository {
  async findById(userId) {
    return User.findOne({ _id: userId, isActive: true });
  }

  async findByMcbCode(mcbCode) {
    return User.findOne({ mcbCode, isActive: true });
  }

  async updateProfile(userId, updates) {
    return User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  }

  async findAccountsByUserId(userId) {
    return Account.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
  }
}

export default new UsersRepository();
