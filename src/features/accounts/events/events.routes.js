import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware.js';
import * as controller from './events.controller.js';

const router = Router();

router.post('/', authenticate, controller.createEvent);
router.patch('/:eventId', authenticate, controller.updateEvent);
router.post('/:eventId/photo', authenticate, controller.uploadEventPhoto);

export default router;
