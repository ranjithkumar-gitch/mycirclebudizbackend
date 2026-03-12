import { Router } from 'express';
import { authenticate } from '../../../../common/middleware/auth.middleware.js';
import * as controller from './chat.controller.js';

const router = Router();

router.post('/:circleId/messages', authenticate, controller.sendMessage);
router.post('/:circleId/messages/media', authenticate, controller.sendMediaMessage);
router.post('/:circleId/messages/:messageId/reactions', authenticate, controller.addReaction);

export default router;
