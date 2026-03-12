import { AppError } from '../../../common/errors/app-error.js';
import { ERROR_CODES } from '../../../common/constants/error-codes.js';
import { getStorageProvider } from '../../../common/providers/storage/storage.provider.js';
import { assertObjectIds } from '../../../common/utils/validators.util.js';
import publicProfileRepository from './public-profile.repository.js';
import accountsRepository from '../accounts.repository.js';
import followersRepository from '../followers/followers.repository.js';

class PublicProfileService {
  async getPublicProfile(accountId, viewerAccountId) {
    assertObjectIds(accountId);
    if (viewerAccountId) assertObjectIds(viewerAccountId);
    const account = await publicProfileRepository.findPublicById(accountId);

    if (!account) {
      throw AppError.notFound('Account not found', ERROR_CODES.ACCOUNT_NOT_FOUND);
    }

    const [followerCount, followingCount] = await Promise.all([
      followersRepository.countFollowers(accountId),
      followersRepository.countFollowing(accountId),
    ]);

    let isFollowing = null;
    if (viewerAccountId) {
      const record = await followersRepository.findByPair(accountId, viewerAccountId);
      isFollowing = record?.status === 'accepted';
    }

    return {
      id: account._id,
      type: account.type,
      displayName: account.displayName,
      profilePhoto: account.profilePhoto,
      bio: account.bio,
      isPublic: account.isPublic,
      followerCount,
      followingCount,
      isFollowing,
      createdAt: account.createdAt,
    };
  }

  async updatePublicProfile(userId, accountId, updates, file) {
    assertObjectIds(accountId);
    const account = await accountsRepository.findById(accountId);

    if (!account) {
      throw AppError.notFound('Account not found', ERROR_CODES.ACCOUNT_NOT_FOUND);
    }

    if (account.userId.toString() !== userId) {
      throw AppError.forbidden('You do not have access to this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    if (updates.displayName) {
      updates.displayName = updates.displayName.trim().toLowerCase();
    }

    if (file) {
      const storage = getStorageProvider();
      if (account.profilePhoto) {
        await storage.delete(account.profilePhoto);
      }
      updates.profilePhoto = await storage.upload(file.buffer, file.originalname, file.mimetype);
    }

    const updated = await publicProfileRepository.updateById(accountId, updates);
    return this.#formatAccount(updated);
  }

  #formatAccount(account) {
    return {
      id: account._id,
      type: account.type,
      displayName: account.displayName,
      profilePhoto: account.profilePhoto,
      bio: account.bio,
      isPublic: account.isPublic,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}

export default new PublicProfileService();
