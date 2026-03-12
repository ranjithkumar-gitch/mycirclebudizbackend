import { z } from 'zod';

export const parseQrCodeSchema = z.object({
  qrData: z.string().trim().min(1, 'qrData is required'),
});

export const getProfileByMcbCodeSchema = z.object({
  mcbCode: z.string().trim().min(1, 'mcbCode is required'),
  accountType: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => ['individual', 'personal', 'business', 'professional', 'community'].includes(value),
      'accountType must be one of: individual, personal, business, professional, community'
    )
    .optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),

  profilePhoto: z.string().trim().optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  district: z.string().trim().max(100).optional().nullable(),
  pincode: z.string().trim().max(20).optional().nullable(),

});
