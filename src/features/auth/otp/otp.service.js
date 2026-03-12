import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import config from '../../../config/index.js';
import { AppError } from '../../../common/errors/app-error.js';
import { ERROR_CODES } from '../../../common/constants/error-codes.js';
import { getSmsProvider } from '../../../common/providers/sms/sms.provider.js';
import otpStore from './memory-otp.store.js';

class OtpService {
  #makeKey(purpose, phone) {
    return `${purpose}:${phone}`;
  }

  #generateOtp() {
    const max = Math.pow(10, config.otp.length) - 1;
    const min = Math.pow(10, config.otp.length - 1);
    return crypto.randomInt(min, max + 1).toString();
  }

  async requestOtp(phone, purpose) {
    const key = this.#makeKey(purpose, phone);
    const existing = otpStore.get(key);

    // Check if locked (cooldown after max attempts)
    if (existing && existing.lockedUntil && Date.now() < existing.lockedUntil) {
      throw AppError.tooManyRequests(
        'Too many failed attempts. Please try again later.',
        ERROR_CODES.OTP_ATTEMPTS_EXCEEDED
      );
    }

    const otp = this.#generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const ttlMs = config.otp.ttlMinutes * 60 * 1000;

    const entry = {
      phone,
      hashedOtp,
      purpose,
      attempts: 0,
      resendCount: existing ? existing.resendCount : 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      lockedUntil: null,
    };

    otpStore.set(key, entry, ttlMs);

    // Send OTP
    if (config.otp.live) {
      const smsProvider = getSmsProvider();

      await smsProvider.sendOtp(phone, otp);
    } else {
      const smsProvider = getSmsProvider();
      await smsProvider.sendOtp(phone, otp);
    }

    return { phone, purpose, otp };
  }

  async verifyOtp(phone, purpose, otpInput) {
    const key = this.#makeKey(purpose, phone);
    const entry = otpStore.get(key);

    if (!entry) {
      throw AppError.badRequest('OTP expired or not found', ERROR_CODES.OTP_EXPIRED);
    }

    // Check cooldown lock
    if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
      throw AppError.tooManyRequests(
        'Too many failed attempts. Please try again later.',
        ERROR_CODES.OTP_ATTEMPTS_EXCEEDED
      );
    }

    // Check max attempts
    if (entry.attempts >= config.otp.maxAttempts) {
      const cooldownMs = config.otp.cooldownMinutes * 60 * 1000;
      otpStore.update(key, { lockedUntil: Date.now() + cooldownMs });
      throw AppError.tooManyRequests(
        'Maximum verification attempts exceeded. Please request a new OTP.',
        ERROR_CODES.OTP_ATTEMPTS_EXCEEDED
      );
    }

    const isValid = await bcrypt.compare(otpInput, entry.hashedOtp);

    if (!isValid) {
      const newAttempts = entry.attempts + 1;
      if (newAttempts >= config.otp.maxAttempts) {
        const cooldownMs = config.otp.cooldownMinutes * 60 * 1000;
        otpStore.update(key, { attempts: newAttempts, lockedUntil: Date.now() + cooldownMs });
      } else {
        otpStore.update(key, { attempts: newAttempts });
      }
      throw AppError.badRequest('Invalid OTP', ERROR_CODES.OTP_INVALID);
    }

    // OTP valid — delete immediately (single-use)
    otpStore.delete(key);
    return true;
  }

  async resendOtp(phone, purpose) {
    const key = this.#makeKey(purpose, phone);
    const existing = otpStore.get(key);

    if (!existing) {
      throw AppError.badRequest('No OTP request found. Please request a new OTP.', ERROR_CODES.OTP_EXPIRED);
    }

    if (existing.resendCount >= config.otp.maxResends) {
      throw AppError.tooManyRequests(
        'Maximum resend limit reached. Please request a new OTP.',
        ERROR_CODES.OTP_RESEND_LIMIT
      );
    }

    // Invalidate previous OTP, generate new one
    const otp = this.#generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const ttlMs = config.otp.ttlMinutes * 60 * 1000;

    const entry = {
      phone,
      hashedOtp,
      purpose,
      attempts: 0,
      resendCount: existing.resendCount + 1,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      lockedUntil: null,
    };

    otpStore.set(key, entry, ttlMs);

    // Send OTP
    const smsProvider = getSmsProvider();
    await smsProvider.sendOtp(phone, otp);

    return { phone, purpose,otp, resendsRemaining: config.otp.maxResends - entry.resendCount };
  }
}

export default new OtpService();
