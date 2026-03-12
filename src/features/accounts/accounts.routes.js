import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createAccountSchema, updateAccountSchema, accountIdParamSchema } from './accounts.schemas.js';
import * as controller from './accounts.controller.js';

// Sub-module routes (stubs)
import circlesRoutes from './circles/circles.routes.js';
import circlesChatRoutes from './circles/chat/chat.routes.js';
import eventsRoutes from './events/events.routes.js';
import couponsRoutes from './coupons/coupons.routes.js';
import followersRoutes from './followers/followers.routes.js';
import postsRoutes from './posts/posts.routes.js';
import membershipRoutes from './membership/membership.routes.js';
import publicProfileRoutes from './public-profile/public-profile.routes.js';
import deleteRoutes from './delete/delete.routes.js';

const router = Router();

// Sub-modules first — must come before /:id to prevent dynamic param shadowing
router.use('/circles', circlesRoutes);
router.use('/circles', circlesChatRoutes);
router.use('/events', eventsRoutes);
router.use('/coupons', couponsRoutes);
router.use('/posts', postsRoutes);
router.use('/membership', membershipRoutes);
router.use('/public', publicProfileRoutes);
router.use('/', followersRoutes);
router.use('/', deleteRoutes);

// Account CRUD — dynamic /:id routes last
router.post('/', authenticate, validate('body', createAccountSchema), controller.createAccount);
router.get('/', authenticate, controller.listAccounts);
router.get('/:id/qr-code', authenticate, validate('params', accountIdParamSchema), controller.getQrCode);
router.get('/:id', authenticate, validate('params', accountIdParamSchema), controller.getAccount);
router.patch('/:id', authenticate, validate('params', accountIdParamSchema), validate('body', updateAccountSchema), controller.updateAccount);
router.delete('/:id', authenticate, validate('params', accountIdParamSchema), controller.deleteAccount);

export default router;
