import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware.js';
import * as controller from './membership.controller.js';

const router = Router();

router.post('/upgrade', authenticate, controller.upgradeMembership);
router.post('/verify', authenticate, controller.verifyMembership);

export default router;
