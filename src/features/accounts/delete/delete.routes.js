import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware.js';
import * as controller from './delete.controller.js';

const router = Router();

router.post('/delete/request-otp', authenticate, controller.requestDeleteOtp);

export default router;
