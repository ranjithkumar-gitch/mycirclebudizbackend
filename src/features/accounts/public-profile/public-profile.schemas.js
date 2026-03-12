import { z } from 'zod';
import { objectIdSchema } from '../../../common/utils/validators.util.js';

export const publicProfileParamSchema = z.object({
  accountId: objectIdSchema('Account ID'),
});

export const updatePublicProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    bio: z.string().trim().max(500).optional().nullable(),
    // Coerce string "true"/"false" from multipart form-data to boolean
    isPublic: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });
