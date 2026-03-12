import { Router } from 'express';
import { validate } from '../../common/middleware/validate.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { otpRateLimiter } from '../../common/middleware/rate-limit.middleware.js';
import {
  requestOtpSchema,
  verifyOtpSchema,
  resendOtpSchema,
  completeProfileSchema,
  loginVerifyOtpSchema,
  refreshTokenSchema,
  logoutSchema,
} from './auth.schemas.js';
import * as controller from './auth.controller.js';

const router = Router();

// Signup
router.post('/signup/request-otp-v1', otpRateLimiter, validate('body', requestOtpSchema), controller.signupRequestOtp);
router.post('/signup/verify-otp-v1', validate('body', verifyOtpSchema), controller.signupVerifyOtp);
router.post('/signup/resend-otp-v1', otpRateLimiter, validate('body', resendOtpSchema), controller.signupResendOtp);
router.post('/signup/complete-profile-v1', validate('body', completeProfileSchema), controller.signupCompleteProfile);

// Login
router.post('/login/request-otp-v1', otpRateLimiter, validate('body', requestOtpSchema), controller.loginRequestOtp);
router.post('/login/verify-otp-v1', validate('body', loginVerifyOtpSchema), controller.loginVerifyOtp);
router.post('/login/resend-otp-v1', otpRateLimiter, validate('body', resendOtpSchema), controller.loginResendOtp);

// Token refresh
router.post('/refresh-v1', validate('body', refreshTokenSchema), controller.refreshToken);

// Logout
router.post('/logout-v1', authenticate, validate('body', logoutSchema), controller.logout);

export default router;
