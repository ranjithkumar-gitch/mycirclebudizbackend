import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware.js';
import * as controller from './coupons.controller.js';

const router = Router();

router.post('/', authenticate, controller.createCoupon);

export default router;
