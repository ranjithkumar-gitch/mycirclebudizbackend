import { z } from 'zod';
import { objectIdSchema } from '../../../common/utils/validators.util.js';

export const followSchema = z.object({
  targetAccountId: objectIdSchema('Target account ID'),
});

export const handleFollowRequestParamsSchema = z.object({
  requestId: objectIdSchema('Request ID'),
});

export const handleFollowRequestBodySchema = z.object({
  action: z.enum(['accept', 'reject'], { message: 'Action must be accept or reject' }),
});

export const listQuerySchema = z.object({
  accountId: objectIdSchema('Account ID'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const cancelFollowRequestSchema = z.object({
  targetAccountId: objectIdSchema('Target account ID'),
});
