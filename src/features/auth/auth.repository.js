import User from '../users/user.model.js';
import RefreshToken from '../../models/refresh-token.model.js';

class AuthRepository {
  async findUserByPhone(phone) {
    return User.findOne({ phone, isActive: true });
  }

  async findUserById(userId) {
    return User.findOne({ _id: userId, isActive: true });
  }

  async createUser(userData) {
    return User.create(userData);
  }

  async updateLastLogin(userId) {
    return User.findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { returnDocument: 'after' });
  }

  async saveRefreshToken(tokenData) {
    return RefreshToken.create(tokenData);
  }

  async findRefreshToken(tokenHash) {
    return RefreshToken.findOne({ token: tokenHash, isRevoked: false });
  }

  async revokeTokenFamily(family) {
    return RefreshToken.updateMany({ family }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId) {
    return RefreshToken.updateMany({ userId }, { isRevoked: true });
  }

  async revokeTokenByDevice(userId, deviceId) {
    return RefreshToken.updateMany({ userId, deviceId }, { isRevoked: true });
  }

  async findRevokedTokenByHash(tokenHash) {
    return RefreshToken.findOne({ token: tokenHash, isRevoked: true });
  }
}

export default new AuthRepository();
