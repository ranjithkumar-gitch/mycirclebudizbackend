import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import swaggerUi from 'swagger-ui-express';
import config from './index.js';

// Extend Zod with OpenAPI metadata support
extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// ─── Common Schemas ───

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.null(),
  message: z.string(),
  errorCode: z.string(),
  requestId: z.string().uuid(),
});

const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any().nullable(),
  message: z.string().nullable(),
  errorCode: z.null(),
  requestId: z.string().uuid(),
});

registry.register('ErrorResponse', ErrorResponseSchema);
registry.register('SuccessResponse', SuccessResponseSchema);

// ─── Security Scheme ───

registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// ─── Auth Endpoints ───

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/signup/request-otp',
  tags: ['Auth - Signup'],
  summary: 'Request OTP for signup',
  request: { body: { content: { 'application/json': { schema: z.object({ phone: z.string() }) } } } },
  responses: {
    200: { description: 'OTP sent successfully', content: { 'application/json': { schema: SuccessResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    409: { description: 'User already exists', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/signup/verify-otp',
  tags: ['Auth - Signup'],
  summary: 'Verify OTP for signup',
  request: { body: { content: { 'application/json': { schema: z.object({ phone: z.string(), otp: z.string() }) } } } },
  responses: {
    200: { description: 'OTP verified, signup token returned', content: { 'application/json': { schema: SuccessResponseSchema } } },
    400: { description: 'Invalid OTP', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/signup/resend-otp',
  tags: ['Auth - Signup'],
  summary: 'Resend OTP for signup',
  request: { body: { content: { 'application/json': { schema: z.object({ phone: z.string() }) } } } },
  responses: {
    200: { description: 'OTP resent', content: { 'application/json': { schema: SuccessResponseSchema } } },
    429: { description: 'Resend limit exceeded', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/signup/complete-profile',
  tags: ['Auth - Signup'],
  summary: 'Complete profile after signup OTP verification',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().email(),
            deviceId: z.string(),
            deviceName: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Profile completed, tokens issued', content: { 'application/json': { schema: SuccessResponseSchema } } },
    401: { description: 'Invalid signup token', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login/request-otp',
  tags: ['Auth - Login'],
  summary: 'Request OTP for login',
  request: { body: { content: { 'application/json': { schema: z.object({ phone: z.string() }) } } } },
  responses: {
    200: { description: 'OTP sent', content: { 'application/json': { schema: SuccessResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login/verify-otp',
  tags: ['Auth - Login'],
  summary: 'Verify OTP for login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ phone: z.string(), otp: z.string(), deviceId: z.string(), deviceName: z.string().optional() }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Login successful, tokens issued', content: { 'application/json': { schema: SuccessResponseSchema } } },
    400: { description: 'Invalid OTP', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login/resend-otp',
  tags: ['Auth - Login'],
  summary: 'Resend OTP for login',
  request: { body: { content: { 'application/json': { schema: z.object({ phone: z.string() }) } } } },
  responses: {
    200: { description: 'OTP resent', content: { 'application/json': { schema: SuccessResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  tags: ['Auth'],
  summary: 'Refresh access token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ refreshToken: z.string(), deviceId: z.string() }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Tokens refreshed', content: { 'application/json': { schema: SuccessResponseSchema } } },
    401: { description: 'Invalid refresh token', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Auth'],
  summary: 'Logout (revoke refresh token)',
  security: [{ BearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: z.object({ deviceId: z.string() }) } } } },
  responses: {
    200: { description: 'Logged out', content: { 'application/json': { schema: SuccessResponseSchema } } },
  },
});

// ─── User Endpoints ───

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/me',
  tags: ['Users'],
  summary: 'Get logged-in user context',
  security: [{ BearerAuth: [] }],
  responses: {
    200: { description: 'User profile with accounts', content: { 'application/json': { schema: SuccessResponseSchema } } },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/users/profile',
  tags: ['Users'],
  summary: 'Update user profile',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            email: z.string().email().optional(),
            dateOfBirth: z.string().optional(),
            gender: z.enum(['male', 'female', 'other']).optional(),

          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Profile updated', content: { 'application/json': { schema: SuccessResponseSchema } } },
  },
});

// ─── Account Endpoints ───

registry.registerPath({
  method: 'post',
  path: '/api/v1/accounts',
  tags: ['Accounts'],
  summary: 'Create a new account',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            type: z.enum(['business', 'professional', 'community']),
            displayName: z.string(),
            bio: z.string().optional(),
            isPublic: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Account created', content: { 'application/json': { schema: SuccessResponseSchema } } },
    400: { description: 'Account type disabled or validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    409: { description: 'Duplicate display name', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/accounts',
  tags: ['Accounts'],
  summary: 'List own accounts',
  security: [{ BearerAuth: [] }],
  responses: {
    200: { description: 'List of accounts', content: { 'application/json': { schema: SuccessResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/accounts/{id}',
  tags: ['Accounts'],
  summary: 'Get account by ID',
  security: [{ BearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Account details', content: { 'application/json': { schema: SuccessResponseSchema } } },
    404: { description: 'Account not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/accounts/{id}',
  tags: ['Accounts'],
  summary: 'Update account',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            displayName: z.string().optional(),
            bio: z.string().optional(),
            isPublic: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Account updated', content: { 'application/json': { schema: SuccessResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/accounts/{id}',
  tags: ['Accounts'],
  summary: 'Soft delete account',
  security: [{ BearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Account deleted', content: { 'application/json': { schema: SuccessResponseSchema } } },
  },
});

// ─── Follower Endpoints ───

registry.registerPath({
  method: 'post',
  path: '/api/v1/accounts/follow',
  tags: ['Followers'],
  summary: 'Follow an account',
  description: 'Only **personal** accounts may initiate a follow (derived from JWT `activeAccountId`). Business targets are auto-accepted; all others are pending.',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ targetAccountId: z.string() }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Followed or follow request sent', content: { 'application/json': { schema: SuccessResponseSchema } } },
    400: { description: 'Self-follow or validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    403: { description: 'Active account is not a personal account (FOLLOWER_ACCOUNT_NOT_ALLOWED)', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Target account not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
    409: { description: 'Already following or request pending', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/accounts/follow-requests/{requestId}',
  tags: ['Followers'],
  summary: 'Accept or reject a follow request',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ requestId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ action: z.enum(['accept', 'reject']) }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Follow request handled', content: { 'application/json': { schema: SuccessResponseSchema } } },
    400: { description: 'Request is no longer pending', content: { 'application/json': { schema: ErrorResponseSchema } } },
    403: { description: 'Not your account', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Follow request not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/accounts/followers',
  tags: ['Followers'],
  summary: 'List followers of an account',
  security: [{ BearerAuth: [] }],
  request: {
    query: z.object({
      accountId: z.string(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: { description: 'Paginated list of accepted followers', content: { 'application/json': { schema: SuccessResponseSchema } } },
    403: { description: 'Not your account', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/accounts/following',
  tags: ['Followers'],
  summary: 'List accounts this account follows',
  security: [{ BearerAuth: [] }],
  request: {
    query: z.object({
      accountId: z.string(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: { description: 'Paginated list of accepted following', content: { 'application/json': { schema: SuccessResponseSchema } } },
    403: { description: 'Not your account', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/accounts/follow-requests',
  tags: ['Followers'],
  summary: 'List pending follow requests for an account',
  security: [{ BearerAuth: [] }],
  request: {
    query: z.object({
      accountId: z.string(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: { description: 'Paginated list of pending follow requests', content: { 'application/json': { schema: SuccessResponseSchema } } },
    403: { description: 'Not your account', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/accounts/follow-requests',
  tags: ['Followers'],
  summary: 'Cancel a pending follow request',
  description: 'The cancelling account is derived from JWT activeAccountId.',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ targetAccountId: z.string() }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Follow request cancelled', content: { 'application/json': { schema: SuccessResponseSchema } } },
    400: { description: 'Request is not pending', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Follow request not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// ─── QR Code Endpoint ───

registry.registerPath({
  method: 'get',
  path: '/api/v1/accounts/{id}/qr-code',
  tags: ['Accounts'],
  summary: 'Get QR code for an account',
  description: 'Generates a base64 PNG QR code encoding a deep link (`mcb://profile/<accountId>`). Account must belong to the authenticated user.',
  security: [{ BearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'QR code generated — data.qrCode is a base64 data URL', content: { 'application/json': { schema: SuccessResponseSchema } } },
    403: { description: 'Not your account', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Account not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// ─── Public Profile Endpoints ───

registry.registerPath({
  method: 'get',
  path: '/api/v1/accounts/public/accounts/{accountId}',
  tags: ['Public Profile'],
  summary: 'Get public profile of an account',
  description: 'Returns public account data including follower/following counts. Optionally include a Bearer token to receive `isFollowing` status. Private or deleted accounts return 404.',
  request: { params: z.object({ accountId: z.string() }) },
  responses: {
    200: { description: 'Public profile with counts', content: { 'application/json': { schema: SuccessResponseSchema } } },
    404: { description: 'Account not found or is private', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/accounts/public/public-profile',
  tags: ['Public Profile'],
  summary: 'Update public profile',
  description: 'Updates the active account (from JWT `activeAccountId`). Send as `multipart/form-data`. `isPublic` must be the string `"true"` or `"false"`.',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            displayName: z.string().min(1).max(100).optional(),
            bio: z.string().max(500).optional(),
            isPublic: z.string().optional().openapi({ description: 'Boolean as string — "true" or "false"' }),
            profilePhoto: z.string().optional().openapi({ type: 'string', format: 'binary', description: 'Image file (JPEG, PNG, or WebP)' }),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Profile updated', content: { 'application/json': { schema: SuccessResponseSchema } } },
    400: { description: 'Validation error or no fields provided', content: { 'application/json': { schema: ErrorResponseSchema } } },
    403: { description: 'Not your account', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Account not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// ─── Generate Spec ───

function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'MyCircleBudiz API',
      version: '1.0.0',
      description: 'MCB Backend API - Phase 2',
    },
    servers: [{ url: '/' }],
  });
}

export function setupSwagger(app) {
  if (config.isProd) return;

  const spec = generateOpenAPISpec();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: 'MCB API Documentation',
  }));
  app.get('/api-docs.json', (req, res) => res.json(spec));
}
