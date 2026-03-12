# Common Infrastructure

## Location
`src/common/`

## Structure
```
common/
├── constants/
│   ├── http-status.js          # HTTP_STATUS enum
│   ├── error-codes.js          # ERROR_CODES enum (all app error codes)
│   └── account-types.js        # ACCOUNT_TYPES + ACCOUNT_TYPE_VALUES
├── errors/
│   └── app-error.js            # AppError class with static factories
├── utils/
│   ├── response.util.js        # sendSuccess(), sendError()
│   ├── async-handler.util.js   # asyncHandler() wrapper
│   └── token.util.js           # JWT sign/verify helpers + hash utilities
├── middleware/
│   ├── request-id.middleware.js
│   ├── request-logger.middleware.js
│   ├── auth.middleware.js
│   ├── validate.middleware.js
│   ├── upload.middleware.js
│   ├── rate-limit.middleware.js
│   └── error-handler.middleware.js
└── providers/
    ├── sms/
    │   ├── sms.provider.js      # Factory (returns console or twilio)
    │   ├── console.provider.js  # Logs OTP to console
    │   └── twilio.provider.js   # Twilio SMS (placeholder)
    └── storage/
        ├── storage.provider.js  # Factory
        └── local.provider.js    # Local file storage
```

## AppError Class (`errors/app-error.js`)
Custom error class extending `Error` with:
- `statusCode` (HTTP status)
- `code` (application error code string)
- `details` (optional extra data)
- `isOperational` (true for known errors)

Static factories:
- `AppError.badRequest(message, code, details)` → 400
- `AppError.unauthorized(message, code)` → 401
- `AppError.forbidden(message, code)` → 403
- `AppError.notFound(message, code)` → 404
- `AppError.conflict(message, code)` → 409
- `AppError.tooManyRequests(message, code)` → 429
- `AppError.internal(message, code)` → 500
- `AppError.notImplemented(message)` → 501

## Response Utilities (`utils/response.util.js`)
- `sendSuccess(res, { statusCode = 200, data = null, message = null })` → `{ success: true, data, message, errorCode: null, requestId }`
- `sendError(res, { statusCode = 500, message, errorCode })` → `{ success: false, data: null, message, errorCode, requestId }`

## Token Utilities (`utils/token.util.js`)
- `signAccessToken({ userId, activeAccountId })` → JWT with `type: "access"`
- `signRefreshToken({ userId, deviceId, family })` → JWT with `type: "refresh"`
- `signSignupToken({ phone })` → JWT with `type: "signup"`, `verified: true`
- `verifyAccessToken(token)` / `verifyRefreshToken(token)` / `verifySignupToken(token)`
- `generateTokenFamily()` → `crypto.randomUUID()`
- `hashToken(token)` → SHA-256 hex digest

## Middleware Chain (order in app.js)
1. **request-id** → Attach UUID v4 as `req.requestId` + `x-request-id` response header
2. **express.json()** → Parse JSON body
3. **express.urlencoded()** → Parse URL-encoded body
4. **helmet()** → Security headers
5. **cors()** → CORS configuration
6. **rate-limit** → Global rate limiter (100 req/min default)
7. **request-logger** → Log method, url, status, duration (masks sensitive fields)
8. [ROUTES] → Per-route: validate → auth → controller
9. 404 handler → Catch-all for unmatched routes
10. **error-handler** → Global error handler (formats AppError, Zod errors, JWT errors, Mongo E11000)

## Global Error Handler (`middleware/error-handler.middleware.js`)
Catches and formats all errors:
- **AppError** → uses statusCode and code from error
- **Zod validation error** → 400 with `VALIDATION_ERROR`
- **JWT errors** (TokenExpiredError, JsonWebTokenError) → 401 with `AUTH_INVALID_TOKEN`
- **Multer errors** → 400 with `VALIDATION_ERROR`
- **Mongo E11000** → mapped via `mapMongoError()`:
  - phone/email duplicate → `USER_ALREADY_EXISTS` (409)
  - displayName duplicate → `ACCOUNT_DUPLICATE_NAME` (409)
- **Unknown errors** → 500 with `INTERNAL_ERROR`

## Rate Limiters (`middleware/rate-limit.middleware.js`)
- `globalRateLimiter` → 100 requests per minute (configurable via env)
- `otpRateLimiter` → 5 requests per minute (applied to OTP endpoints)

Both return errors in the standard response format with `RATE_LIMIT` error code.

## Auth Middleware (`middleware/auth.middleware.js`)
- Extracts Bearer token from Authorization header
- Verifies JWT as access token
- Populates `req.user = { userId, activeAccountId }`
- Throws `AUTH_UNAUTHORIZED` if missing/invalid

## Validation Middleware (`middleware/validate.middleware.js`)
- Factory: `validate(source, zodSchema)` returns middleware
- Source: `'body'`, `'params'`, or `'query'`
- Replaces `req[source]` with Zod-parsed output (sanitized + transformed)

## Providers
Abstraction layer for external services with provider pattern (factory returns implementation based on config):

**SMS**: `sms.provider.js` → returns `console.provider.js` (logs to console) or `twilio.provider.js` based on `SMS_PROVIDER` env var

**Storage**: `storage.provider.js` → returns `local.provider.js` for local file storage
