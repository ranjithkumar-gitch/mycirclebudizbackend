import { AppError } from '../../../common/errors/app-error.js';
import { ERROR_CODES } from '../../../common/constants/error-codes.js';
import { ACCOUNT_TYPES } from '../../../common/constants/account-types.js';
import { FOLLOWER_STATUS } from './follower.model.js';
import { assertObjectIds } from '../../../common/utils/validators.util.js';
import { normalizePagination } from '../../../common/utils/pagination.util.js';
import followersRepository from './followers.repository.js';
import accountsRepository from '../accounts.repository.js';

class FollowersService {
  async follow(userId, activeAccountId, targetAccountId) {
    assertObjectIds(activeAccountId, targetAccountId);
    // Verify activeAccountId belongs to user
    const fromAccount = await accountsRepository.findById(activeAccountId);
    if (!fromAccount || fromAccount.userId.toString() !== userId) {
      throw AppError.forbidden('You do not own this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    // Only personal accounts can initiate follow actions
    if (fromAccount.type !== ACCOUNT_TYPES.PERSONAL) {
      throw AppError.forbidden('Only personal accounts can initiate follow', ERROR_CODES.FOLLOWER_ACCOUNT_NOT_ALLOWED);
    }

    // Verify target account exists and is not deleted
    const targetAccount = await accountsRepository.findById(targetAccountId);
    if (!targetAccount) {
      throw AppError.notFound('Target account not found', ERROR_CODES.ACCOUNT_NOT_FOUND);
    }

    // Prevent self-follow
    if (activeAccountId === targetAccountId) {
      throw AppError.badRequest('You cannot follow yourself', ERROR_CODES.FOLLOWER_SELF_FOLLOW);
    }

    // Prevent duplicate follow
    const existing = await followersRepository.findByPair(targetAccountId, activeAccountId);
    if (existing) {
      throw AppError.conflict('Already following or request pending', ERROR_CODES.FOLLOWER_ALREADY_EXISTS);
    }

    // Determine status based on target account type
    const status = targetAccount.type === ACCOUNT_TYPES.BUSINESS
      ? FOLLOWER_STATUS.ACCEPTED
      : FOLLOWER_STATUS.PENDING;

    const record = await followersRepository.create({
      accountId: targetAccountId,
      followerAccountId: activeAccountId,
      status,
    });

    return {
      id: record._id,
      accountId: record.accountId,
      followerAccountId: record.followerAccountId,
      status: record.status,
      createdAt: record.createdAt,
    };
  }

  async handleFollowRequest(userId, requestId, action) {
    assertObjectIds(requestId);
    const record = await followersRepository.findById(requestId);
    if (!record) {
      throw AppError.notFound('Follow request not found', ERROR_CODES.FOLLOWER_NOT_FOUND);
    }

    // Verify the target account belongs to the authenticated user
    const targetAccount = await accountsRepository.findById(record.accountId);
    if (!targetAccount || targetAccount.userId.toString() !== userId) {
      throw AppError.forbidden('You do not own this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    // Only pending requests can be accepted/rejected
    if (record.status !== FOLLOWER_STATUS.PENDING) {
      throw AppError.badRequest('This request is no longer pending', ERROR_CODES.FOLLOWER_NOT_FOUND);
    }

    const newStatus = action === 'accept'
      ? FOLLOWER_STATUS.ACCEPTED
      : FOLLOWER_STATUS.REJECTED;

    const updated = await followersRepository.updateStatus(requestId, newStatus);

    return {
      id: updated._id,
      accountId: updated.accountId,
      followerAccountId: updated.followerAccountId,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  async listFollowers(userId, accountId, page, limit) {
    assertObjectIds(accountId);
    const { page: p, limit: l } = normalizePagination(page, limit);
    // Verify account belongs to user
    const account = await accountsRepository.findById(accountId);
    if (!account || account.userId.toString() !== userId) {
      throw AppError.forbidden('You do not own this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    const { records, total } = await followersRepository.findFollowers(accountId, p, l);

    return {
      followers: records.map((r) => ({
        id: r._id,
        account: r.followerAccountId,
        followedAt: r.createdAt,
      })),
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    };
  }

  async listFollowing(userId, accountId, page, limit) {
    assertObjectIds(accountId);
    const { page: p, limit: l } = normalizePagination(page, limit);
    // Verify account belongs to user
    const account = await accountsRepository.findById(accountId);
    if (!account || account.userId.toString() !== userId) {
      throw AppError.forbidden('You do not own this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    const { records, total } = await followersRepository.findFollowing(accountId, p, l);

    return {
      following: records.map((r) => ({
        id: r._id,
        account: r.accountId,
        followedAt: r.createdAt,
      })),
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    };
  }

  async listFollowRequests(userId, accountId, page, limit) {
    assertObjectIds(accountId);
    const { page: p, limit: l } = normalizePagination(page, limit);
    // Verify account belongs to user
    const account = await accountsRepository.findById(accountId);
    if (!account || account.userId.toString() !== userId) {
      throw AppError.forbidden('You do not own this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    const { records, total } = await followersRepository.findPendingRequests(accountId, p, l);

    return {
      requests: records.map((r) => ({
        id: r._id,
        fromAccount: r.followerAccountId,
        requestedAt: r.createdAt,
      })),
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    };
  }

  async cancelFollowRequest(userId, activeAccountId, targetAccountId) {
    assertObjectIds(activeAccountId, targetAccountId);
    // Verify activeAccountId belongs to user
    const fromAccount = await accountsRepository.findById(activeAccountId);
    if (!fromAccount || fromAccount.userId.toString() !== userId) {
      throw AppError.forbidden('You do not own this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    const record = await followersRepository.findByPair(targetAccountId, activeAccountId);
    if (!record) {
      throw AppError.notFound('Follow request not found', ERROR_CODES.FOLLOWER_NOT_FOUND);
    }

    if (record.status !== FOLLOWER_STATUS.PENDING) {
      throw AppError.badRequest('Only pending requests can be cancelled', ERROR_CODES.FOLLOWER_NOT_FOUND);
    }

    await followersRepository.deleteById(record._id);
  }
}

export default new FollowersService();
