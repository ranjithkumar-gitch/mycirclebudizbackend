import { AppError } from '../../common/errors/app-error.js';
import { ERROR_CODES } from '../../common/constants/error-codes.js';
import {
  signAccessToken,
  signRefreshToken,
  signSignupToken,
  verifyRefreshToken,
  verifySignupToken,
  generateTokenFamily,
  hashToken,
} from '../../common/utils/token.util.js';
import config from '../../config/index.js';
import authRepository from './auth.repository.js';
import accountsRepository from '../accounts/accounts.repository.js';
import otpService from './otp/otp.service.js';
//import { profile } from 'winston';
import { date } from 'zod';

class AuthService {
  // ─── Signup Flow ───

  async signupRequestOtp(phone) {
    const existingUser = await authRepository.findUserByPhone(phone);
    if (existingUser) {
      throw AppError.conflict('User with this phone number already exists', ERROR_CODES.USER_ALREADY_EXISTS);
    }
    return otpService.requestOtp(phone, 'signup');
  }

  async signupVerifyOtp(phone, otp) {
    await otpService.verifyOtp(phone, 'signup', otp);//This OTP is temporary and will be removed in production. It is only for testing purposes. In production, the OTP will be sent to the user's phone number and the user will have to enter it to verify their phone number.
    const signupToken = signSignupToken({ phone });
    return { signupToken };
  }

  async signupResendOtp(phone) {
    const encryptedPhone = encrypt(phone);
    const decodedPhone = verifySignupToken(encryptedPhone).phone;
    return otpService.resendOtp(decodedPhone, 'signup');
  }

  async completeProfile({
    phone,
    firstName,
    lastName,
    email,

    profilePhoto,
    dateOfBirth,
    gender,
    deviceId,
    deviceName,
    mcbCode,
    QRCodeImage,
    address,
    city,
    state,
    district,
    pincode,
  }) {
    // const encryptedPhone = encrypt(phone);
    // const decodedPhone = verifySignupToken(encryptedPhone).phone;  }) {
    // Check if user already exists (race condition guard)
    const existingUser = await authRepository.findUserByPhone(phone);
    if (existingUser) {
      throw AppError.conflict('User already exists', ERROR_CODES.USER_ALREADY_EXISTS);
    }

    const user = await authRepository.createUser({
      phone,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      dateOfBirth,
      gender,
      profilePhoto,

      isProfileComplete: true,
      mcbCode,
      QRCodeImage,
      address,
      city,
      state,
      district,
      pincode,
    });

    // Check if personal account already exists (race condition guard)
    const existingPersonal = await accountsRepository.findPersonalByUserId(user._id);
    if (existingPersonal) {
      throw AppError.conflict(
        'Personal account already exists',
        ERROR_CODES.ACCOUNT_PERSONAL_EXISTS
      );
    }

    // Auto-create personal account
    const personalAccount = await accountsRepository.create({
      userId: user._id,
      type: 'personal',
      displayName: firstName.trim().toLowerCase(),
      isPublic: true,
    });

    const sessionDeviceId = deviceId?.trim() || 'signup-default-device';
    const tokens = await this.#issueTokens(user._id, sessionDeviceId, deviceName, null, personalAccount._id);

    return {
      user: {
        id: user._id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isProfileComplete: user.isProfileComplete,
        mcbCode: user.mcbCode,
        QRCodeImage: user.QRCodeImage,

      },
      personalAccount: {
        id: personalAccount._id,
        type: personalAccount.type,
        displayName: personalAccount.displayName,
      },
      ...tokens,
    };
  }

  // ─── Login Flow ───

  async loginRequestOtp(phone) {
    const existingUser = await authRepository.findUserByPhone(phone);
    if (!existingUser) {
      throw AppError.notFound('No account found with this phone number', ERROR_CODES.USER_NOT_FOUND);
    }
    return otpService.requestOtp(phone, 'login');
  }

  async loginVerifyOtp(phone, otp, deviceId, deviceName) {
    await otpService.verifyOtp(phone, 'login', otp);

    const user = await authRepository.findUserByPhone(phone);
    if (!user) {
      throw AppError.notFound('User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    await authRepository.updateLastLogin(user._id);

    // Fetch personal account for activeAccountId
    const personalAccount = await accountsRepository.findPersonalByUserId(user._id);
    if (!personalAccount) {
      throw AppError.internal('Personal account not found', ERROR_CODES.INTERNAL_ERROR);
    }

    // Revoke existing tokens for this device
    await authRepository.revokeTokenByDevice(user._id, deviceId);

    const tokens = await this.#issueTokens(user._id, deviceId, deviceName, null, personalAccount._id);

    return {
      user: {
        id: user._id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isProfileComplete: user.isProfileComplete,
      },
      ...tokens,
    };
  }

  async loginResendOtp(phone) {
    return otpService.resendOtp(phone, 'login');
  }

  // ─── Token Refresh ───

  async refreshTokens(refreshTokenStr, deviceId) {
    const tokenHash = hashToken(refreshTokenStr);

    // Check if this is a revoked token (potential theft)
    const revokedToken = await authRepository.findRevokedTokenByHash(tokenHash);
    if (revokedToken) {
      // Theft detected: revoke entire family
      await authRepository.revokeTokenFamily(revokedToken.family);
      throw AppError.unauthorized(
        'Session has been revoked. Please login again.',
        ERROR_CODES.AUTH_SESSION_REVOKED
      );
    }

    const storedToken = await authRepository.findRefreshToken(tokenHash);
    if (!storedToken) {
      throw AppError.unauthorized('Invalid refresh token', ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    // Verify JWT validity
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshTokenStr);
    } catch {
      await authRepository.revokeTokenFamily(storedToken.family);
      throw AppError.unauthorized('Invalid or expired refresh token', ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    if (decoded.type !== 'refresh') {
      throw AppError.unauthorized('Invalid token type', ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    // Verify device matches
    if (storedToken.deviceId !== deviceId) {
      throw AppError.unauthorized('Device mismatch', ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    // Revoke old token
    storedToken.isRevoked = true;
    await storedToken.save();

    // Issue new tokens with same family, preserving activeAccountId
    const tokens = await this.#issueTokens(
      storedToken.userId,
      deviceId,
      storedToken.deviceName,
      storedToken.family,
      storedToken.activeAccountId
    );

    return tokens;
  }

  // ─── Logout ───

  async logout(userId, deviceId) {
    await authRepository.revokeTokenByDevice(userId, deviceId);
  }

  // ─── Private Helpers ───

  async #issueTokens(userId, deviceId, deviceName = null, family = null, activeAccountId) {
    const tokenFamily = family || generateTokenFamily();

    const accessToken = signAccessToken({
      userId: userId.toString(),
      activeAccountId: activeAccountId?.toString() || null,
    });
    const refreshToken = signRefreshToken({
      userId: userId.toString(),
      deviceId,
      family: tokenFamily,
    });

    const refreshTokenHash = hashToken(refreshToken);

    // Calculate expiry from config
    const expiresIn = config.jwt.refreshExpiresIn;
    const expiresAt = this.#parseExpiresIn(expiresIn);

    await authRepository.saveRefreshToken({
      userId,
      token: refreshTokenHash,
      deviceId,
      deviceName,
      family: tokenFamily,
      activeAccountId,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  #parseExpiresIn(expiresIn) {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const ms = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * ms[unit]);
  }
}

export default new AuthService();
