import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { getProfileByMcbCodeSchema, updateProfileSchema } from './users.schemas.js';
import * as controller from './users.controller.js';

const router = Router();

router.get('/user-detail-v1', authenticate, controller.getMe);
router.post('/profile-by-mcb-code-v1', authenticate, validate('body', getProfileByMcbCodeSchema), controller.getProfileByMCBCode);
router.patch('/profile-v1', authenticate, validate('body', updateProfileSchema), controller.updateProfile);

export default router;
