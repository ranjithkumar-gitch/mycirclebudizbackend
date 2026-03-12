import { z } from 'zod';
import { CREATABLE_ACCOUNT_TYPES } from '../../common/constants/account-types.js';
import { objectIdSchema } from '../../common/utils/validators.util.js';

export const createAccountSchema = z.object({
  type: z.enum(CREATABLE_ACCOUNT_TYPES, { message: `Account type must be one of: ${CREATABLE_ACCOUNT_TYPES.join(', ')}` }),
  displayName: z.string().trim().min(1, 'Display name is required').max(100),
  bio: z.string().trim().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const updateAccountSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  bio: z.string().trim().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const accountIdParamSchema = z.object({
  id: objectIdSchema('Account ID'),
});
