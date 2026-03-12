import { AppError } from '../../common/errors/app-error.js';
import { ERROR_CODES } from '../../common/constants/error-codes.js';
import usersRepository from './users.repository.js';

// Maps the accountType embedded in the QR code to the DB account type
const QR_ACCOUNT_TYPE_MAP = {
  individual: 'personal',
  personal: 'personal',
  business: 'business',
  professional: 'professional',
  community: 'community',
};

class UsersService {
  async getMe(userId) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    const accounts = await usersRepository.findAccountsByUserId(userId);

    return {
      user: {
        id: user._id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        profilePhoto: user.profilePhoto,

        address: user.address,
        city: user.city,
        state: user.state,
        district: user.district,
        pincode: user.pincode,
        isProfileComplete: user.isProfileComplete,
        mcbCode: user.mcbCode,
        QRCodeImage: user.QRCodeImage,
        createdAt: user.createdAt,
      },
      accounts: accounts.map((acc) => ({
        id: acc._id,
        type: acc.type,
        displayName: acc.displayName,
        profilePhoto: acc.profilePhoto,
        bio: acc.bio,
        isPublic: acc.isPublic,
        createdAt: acc.createdAt,
      })),
    };
  }

  async updateProfile(userId, updates) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    // Normalize email if provided
    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();
    }

    // Parse dateOfBirth if provided as string
    if (updates.dateOfBirth) {
      updates.dateOfBirth = new Date(updates.dateOfBirth);
    }

    const updated = await usersRepository.updateProfile(userId, updates);

    return {
      id: updated._id,
      phone: updated.phone,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      dateOfBirth: updated.dateOfBirth,
      gender: updated.gender,
      profilePhoto: updated.profilePhoto,

      isProfileComplete: updated.isProfileComplete,
      //createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async getUserByQrCode(mcbCode, accountType) {
    const user = await usersRepository.findByMcbCode(mcbCode);
    if (!user) {
      throw AppError.notFound('User not found for the scanned QR code', ERROR_CODES.USER_NOT_FOUND);
    }

    const dbAccountType = accountType ? QR_ACCOUNT_TYPE_MAP[accountType.toLowerCase()] : null;

    const accounts = await usersRepository.findAccountsByUserId(user._id);

    const matchedAccount = dbAccountType
      ? accounts.find((acc) => acc.type === dbAccountType) ?? null
      : accounts[0] ?? null;

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        mcbCode: user.mcbCode,
        profilePhoto: user.profilePhoto,
        QRCodeImage: user.QRCodeImage,
      },
      account: matchedAccount
        ? {
            id: matchedAccount._id,
            type: matchedAccount.type,
            displayName: matchedAccount.displayName,
            profilePhoto: matchedAccount.profilePhoto,
            bio: matchedAccount.bio,
            isPublic: matchedAccount.isPublic,
          }
        : null,
    };
  }
}

export default new UsersService();
