import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware.js';
import * as controller from './posts.controller.js';

const router = Router();

router.post('/', authenticate, controller.createPost);

export default router;
