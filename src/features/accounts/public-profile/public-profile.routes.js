import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../../common/middleware/auth.middleware.js';
import { validate } from '../../../common/middleware/validate.middleware.js';
import { upload } from '../../../common/middleware/upload.middleware.js';
import { publicProfileParamSchema, updatePublicProfileSchema } from './public-profile.schemas.js';
import * as controller from './public-profile.controller.js';

const router = Router();

router.get('/accounts/:accountId', optionalAuthenticate, validate('params', publicProfileParamSchema), controller.getPublicProfile);
router.patch('/public-profile', authenticate, upload.single('profilePhoto'), validate('body', updatePublicProfileSchema), controller.updatePublicProfile);

export default router;
