import rateLimit from 'express-rate-limit';
import config from '../../config/index.js';
import { ERROR_CODES } from '../constants/error-codes.js';

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      data: null,
      message: 'Too many requests, please try again later',
      errorCode: ERROR_CODES.RATE_LIMIT,
      requestId: req.requestId,
    });
  },
});

export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      data: null,
      message: 'Too many OTP requests, please try again later',
      errorCode: ERROR_CODES.OTP_TOO_MANY_REQUESTS,
      requestId: req.requestId,
    });
  },
});
