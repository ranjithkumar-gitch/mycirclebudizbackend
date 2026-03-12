import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware.js';
import { validate } from '../../../common/middleware/validate.middleware.js';
import {
  followSchema,
  handleFollowRequestParamsSchema,
  handleFollowRequestBodySchema,
  listQuerySchema,
  cancelFollowRequestSchema,
} from './followers.schemas.js';
import * as controller from './followers.controller.js';

const router = Router();

router.post('/follow', authenticate, validate('body', followSchema), controller.follow);
router.patch('/follow-requests/:requestId', authenticate, validate('params', handleFollowRequestParamsSchema), validate('body', handleFollowRequestBodySchema), controller.handleFollowRequest);
router.get('/followers', authenticate, validate('query', listQuerySchema), controller.listFollowers);
router.get('/following', authenticate, validate('query', listQuerySchema), controller.listFollowing);
router.get('/follow-requests', authenticate, validate('query', listQuerySchema), controller.listFollowRequests);
router.delete('/follow-requests', authenticate, validate('body', cancelFollowRequestSchema), controller.cancelFollowRequest);

export default router;
