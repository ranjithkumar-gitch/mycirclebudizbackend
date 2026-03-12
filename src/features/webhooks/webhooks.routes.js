import { Router } from 'express';
import * as controller from './webhooks.controller.js';

const router = Router();

router.post('/payment', controller.handlePaymentWebhook);

export default router;
