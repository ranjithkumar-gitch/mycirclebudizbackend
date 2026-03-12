import { asyncHandler } from '../../common/utils/async-handler.util.js';
import { sendSuccess } from '../../common/utils/response.util.js';
import { AppError } from '../../common/errors/app-error.js';
import { ERROR_CODES } from '../../common/constants/error-codes.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { verifySignupToken } from '../../common/utils/token.util.js';
import authService from './auth.service.js';
import Counter from '../../models/counter.model.js';
import { encrypt } from '../../common/utils/encryption.js';
import { string } from 'zod/mini';
import QRCode from 'qrcode';


// ─── Signup ───

export const signupRequestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  
  const result = await authService.signupRequestOtp(phone);
  
  // Log OTP in development
  if (result.otp) {
    console.log(`\n🔐 SIGNUP OTP for ${phone}: ${result.otp}\n`);
  }
  
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: { phone: result.phone,otp: result.otp },
    message: 'OTP sent successfully',
  });
});

export const signupVerifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  const result = await authService.signupVerifyOtp(phone, otp);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: { signupToken: result.signupToken },
    message: 'OTP verified successfully. Complete your profile to finish registration.',
  });
});

export const signupResendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const result = await authService.signupResendOtp(phone);
  
  // Log OTP in development
  if (result.otp) {
    console.log(`\n🔐 RESEND SIGNUP OTP for ${phone}: ${result.otp}\n`);
  }
  
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: { phone: result.phone, resendsRemaining: result.resendsRemaining },
    message: 'OTP resent successfully',
  });
});
async function generateQRCode(mcbCode, accountType = 'Individual') {
  const deepLink = `mcb://profile/${encodeURIComponent(mcbCode)}?accountType=${encodeURIComponent(accountType)}`;
  return QRCode.toDataURL(deepLink);
}
async function generateMCBCode() {
  const counter = await Counter.findByIdAndUpdate(
    'mcbCode',
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  return `MCB${counter.seq.toString().padStart(4, '0')}`;
}



export const signupCompleteProfile = asyncHandler(async (req, res) => {
  // Verify signup token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing signup token', ERROR_CODES.AUTH_SIGNUP_TOKEN_INVALID);
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = verifySignupToken(token);
  } catch {
    throw AppError.unauthorized('Invalid or expired signup token', ERROR_CODES.AUTH_SIGNUP_TOKEN_INVALID);
  }

  const code = await generateMCBCode();
const _QRCode = await generateQRCode(code, 'Individual');

  const {
    firstName,
    lastName,
    email,
    deviceId,
    deviceName,
    dateOfBirth,
    gender,
    profilePhoto,

    address,
    city,
    state,
    district,
    pinCode,
    pincode,
  } = req.body;
  const resolvedPinCode = pinCode ?? pincode;
  
  //const _QRCode =  getQrCode(code) //`https://api.qrserver.com/v1/create-qr-code/?data=${code}&size=200x200`;

  // const encryptedPhone = encrypt(decoded.phone);
  // const encrptedEmail = encrypt(email);
  // const encryptedQRCode = encrypt(_QRCode);
   const encyptedMCBCode = encrypt(code);
   const encryptProfilePhoto = profilePhoto ? encrypt(profilePhoto) : null;
  const result = await authService.completeProfile({
    phone: decoded.phone,
    firstName,
    lastName,
    email,
    dateOfBirth,
    gender,
    profilePhoto,

    deviceId,
    deviceName,
    mcbCode: code,
    QRCodeImage: _QRCode,
    address,
    city,
    state,
    district,
    pincode: resolvedPinCode,
  });

  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    data: result,
    message: 'Profile completed and account created successfully',
  });
});

// ─── Login ───

export const loginRequestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const result = await authService.loginRequestOtp(phone);
  
  // Log OTP in development
  if (result.otp) {
    console.log(`\n🔐 LOGIN OTP for ${phone}: ${result.otp}\n`);
  }
  
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: { phone: result.phone,otp: result.otp },
    message: 'OTP sent successfully',
  });
});

export const loginVerifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, deviceId, deviceName } = req.body;
  const result = await authService.loginVerifyOtp(phone, otp, deviceId, deviceName);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: result,
    message: 'Login successful',
  });
});

export const loginResendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const result = await authService.loginResendOtp(phone);
  
  // Log OTP in development
  if (result.otp) {
    console.log(`\n🔐 RESEND LOGIN OTP for ${phone}: ${result.otp}\n`);
  }
  
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: { phone: result.phone, resendsRemaining: result.resendsRemaining },
    message: 'OTP resent successfully',
  });
});

// ─── Token Refresh ───

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: refreshTokenStr, deviceId } = req.body;
  const result = await authService.refreshTokens(refreshTokenStr, deviceId);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: result,
    message: 'Tokens refreshed successfully',
  });
});

// ─── Logout ───

export const logout = asyncHandler(async (req, res) => {
  const { deviceId } = req.body;
  await authService.logout(req.user.userId, deviceId);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: null,
    message: 'Logged out successfully',
  });
});
