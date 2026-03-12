import { z } from 'zod';

const phoneSchema = z.string().trim().regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format (e.g., +919876543210)');
const emptyStringToUndefined = (value) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

const emptyStringToNull = (value) => {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  return value;
};

const normalizeCompleteProfilePayload = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const body = { ...value };

  body.firstName = body.firstName ?? body.firstname ?? body.first_name;
  body.lastName = body.lastName ?? body.lastname ?? body.last_name;
  body.email = body.email ?? body.Email;
  body.pinCode = body.pinCode ?? body.pincode;

  if (typeof body.gender === 'string') {
    const normalizedGender = body.gender.trim().toLowerCase().replace(/\s+/g, '_');
    body.gender = normalizedGender === 'prefer_not_to_say' || normalizedGender === 'prefer_not_to_share'
      ? 'prefer_not_to_say'
      : normalizedGender;
  }

  if (typeof body.dateOfBirth === 'string') {
    const normalizedDob = body.dateOfBirth.trim().toLowerCase();
    if (normalizedDob === 'null' || normalizedDob === 'undefined') {
      body.dateOfBirth = null;
    }
  }

  return body;
};

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().trim().length(4, 'OTP must be 4 digits'),
  deviceId: z.string().trim().min(1, 'deviceId is required').optional(),
  deviceName: z.string().trim().optional(),
});

export const resendOtpSchema = z.object({
  phone: phoneSchema,
});

export const completeProfileSchema = z.preprocess(
  normalizeCompleteProfilePayload,
  z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(50),
    lastName: z.string().trim().min(1, 'Last name is required').max(50),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    deviceId: z.preprocess(emptyStringToUndefined, z.string().trim().min(1, 'deviceId is required').optional()),
    deviceName: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
    dateOfBirth: z.preprocess(emptyStringToNull, z.coerce.date().optional().nullable()),
    gender: z.preprocess(
      emptyStringToNull,
      z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable()
    ),
    profilePhoto: z.preprocess(emptyStringToNull, z.string().trim().optional().nullable()),

    address: z.preprocess(emptyStringToNull, z.string().trim().max(200).optional().nullable()),
    city: z.preprocess(emptyStringToNull, z.string().trim().max(100).optional().nullable()),
    district: z.preprocess(emptyStringToNull, z.string().trim().max(100).optional().nullable()),
    state: z.preprocess(emptyStringToNull, z.string().trim().max(100).optional().nullable()),
    pinCode: z.preprocess(emptyStringToNull, z.string().trim().max(250).optional().nullable()),
    pincode: z.preprocess(emptyStringToNull, z.string().trim().max(250).optional().nullable()),
  })
);

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, 'Refresh token is required'),
  deviceId: z.string().trim().min(1, 'deviceId is required'),
});

export const logoutSchema = z.object({
  deviceId: z.string().trim().min(1, 'deviceId is required'),
});

export const loginVerifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().trim().length(4, 'OTP must be 4 digits'),
  deviceId: z.string().trim().min(1, 'deviceId is required'),
  deviceName: z.string().trim().optional(),
});
