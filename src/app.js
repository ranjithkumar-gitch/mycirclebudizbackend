import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { globalRateLimiter } from './common/middleware/rate-limit.middleware.js';
import { errorHandler } from './common/middleware/error-handler.middleware.js';
import { ERROR_CODES } from './common/constants/error-codes.js';
import config from './config/index.js';
import { setupSwagger } from './config/swagger.js';

// Route imports
import authRoutes from './features/auth/auth.routes.js';
import userRoutes from './features/users/users.routes.js';
import accountRoutes from './features/accounts/accounts.routes.js';
import webhookRoutes from './features/webhooks/webhooks.routes.js';

const app = express();
const bodyLimit = `${config.upload.maxSizeMb}mb`;

// Global middleware chain
app.use(requestIdMiddleware);
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use(helmet());
app.use(cors());
app.use(globalRateLimiter);
app.use(requestLoggerMiddleware);

// Serve uploaded files (dev only)
app.use('/uploads', express.static('uploads'));

// Swagger (dev/staging only)
setupSwagger(app);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
    message: null,
    errorCode: null,
    requestId: req.requestId,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/webhooks', webhookRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    errorCode: ERROR_CODES.NOT_FOUND,
    requestId: req.requestId,
  });
});

// Global error handler
app.use(errorHandler);

export default app;
