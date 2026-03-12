import QRCode from 'qrcode';
import { AppError } from '../../common/errors/app-error.js';
import { ERROR_CODES } from '../../common/constants/error-codes.js';
import { ACCOUNT_TYPES } from '../../common/constants/account-types.js';
import { isAccountTypeEnabled } from '../feature-flags.js';
import { assertObjectIds } from '../../common/utils/validators.util.js';
import accountsRepository from './accounts.repository.js';

class AccountsService {
  async createAccount(userId, { type, displayName, bio, isPublic }) {
    // Personal accounts are auto-created at signup only
    if (type === ACCOUNT_TYPES.PERSONAL) {
      throw AppError.badRequest(
        'Personal accounts are created automatically at signup',
        ERROR_CODES.ACCOUNT_PERSONAL_EXISTS
      );
    }

    // Check feature flag
    if (!isAccountTypeEnabled(type)) {
      throw AppError.badRequest(
        `Account type '${type}' is not currently available`,
        ERROR_CODES.ACCOUNT_TYPE_DISABLED
      );
    }

    // Normalize displayName
    const normalizedName = displayName.trim().toLowerCase();

    const account = await accountsRepository.create({
      userId,
      type,
      displayName: normalizedName,
      bio: bio || null,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    return this.#formatAccount(account);
  }

  async listAccounts(userId) {
    const accounts = await accountsRepository.findByUserId(userId);
    return accounts.map((acc) => this.#formatAccount(acc));
  }

  async getAccount(userId, accountId) {
    assertObjectIds(accountId);
    const account = await accountsRepository.findById(accountId);

    if (!account) {
      throw AppError.notFound('Account not found', ERROR_CODES.ACCOUNT_NOT_FOUND);
    }

    if (account.userId.toString() !== userId) {
      throw AppError.forbidden('You do not have access to this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    return this.#formatAccount(account);
  }

  async updateAccount(userId, accountId, updates) {
    assertObjectIds(accountId);
    const account = await accountsRepository.findById(accountId);

    if (!account) {
      throw AppError.notFound('Account not found', ERROR_CODES.ACCOUNT_NOT_FOUND);
    }

    if (account.userId.toString() !== userId) {
      throw AppError.forbidden('You do not have access to this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    // Normalize displayName if provided
    if (updates.displayName) {
      updates.displayName = updates.displayName.trim().toLowerCase();
    }

    const updated = await accountsRepository.updateById(accountId, updates);
    return this.#formatAccount(updated);
  }

  async deleteAccount(userId, accountId) {
    assertObjectIds(accountId);
    const account = await accountsRepository.findById(accountId);

    if (!account) {
      throw AppError.notFound('Account not found', ERROR_CODES.ACCOUNT_NOT_FOUND);
    }

    if (account.userId.toString() !== userId) {
      throw AppError.forbidden('You do not have access to this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    if (account.type === ACCOUNT_TYPES.PERSONAL) {
      throw AppError.badRequest(
        'Personal account cannot be deleted',
        ERROR_CODES.ACCOUNT_PERSONAL_UNDELETABLE
      );
    }

    await accountsRepository.softDelete(accountId);
  }

  async getQrCode(userId, accountId) {
    assertObjectIds(accountId);
    const account = await accountsRepository.findById(accountId);

    if (!account) {
      throw AppError.notFound('Account not found', ERROR_CODES.ACCOUNT_NOT_FOUND);
    }

    if (account.userId.toString() !== userId) {
      throw AppError.forbidden('You do not have access to this account', ERROR_CODES.ACCOUNT_FORBIDDEN);
    }

    const deepLink = `mcb://profile/${accountId}`;
    const qrCode = await QRCode.toDataURL(deepLink);
    return { qrCode };
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

export default new AccountsService();
