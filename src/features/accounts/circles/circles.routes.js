import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware.js';
import * as controller from './circles.controller.js';

const router = Router();

router.post('/', authenticate, controller.createCircle);
router.patch('/:circleId', authenticate, controller.updateCircle);
router.patch('/:circleId/members', authenticate, controller.updateCircleMembers);
router.post('/:circleId/photo', authenticate, controller.uploadCirclePhoto);
router.get('/', authenticate, controller.listCircles);

export default router;
