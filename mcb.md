# CLAUDE.md - MCB Server Project Instructions

## Project Overview

MyCircleBudiz (MCB) backend API. Node.js + Express 5 + MongoDB (Mongoose 9) + Zod 4. ES Modules throughout (`"type": "module"`).

## Critical Rules

### Identity Architecture
- **User** = authentication identity only (phone, name, email, PII)
- **Account** = social unit (all follow, QR, public profile attach to Account)
- Account types: `personal`, `business`, `professional`, `community`
- One phone number = one User, unlimited accounts per user
- `displayName` is case-insensitively unique per user (stored lowercase+trimmed, compound unique index on `userId + displayName`)

### Personal Account Rules
- Auto-created at signup with `displayName = firstName`
- Cannot be manually created (`ACCOUNT_PERSONAL_EXISTS` error)
- Cannot be deleted (`ACCOUNT_PERSONAL_UNDELETABLE` error)
- NOT feature-gated (always enabled by design)
- Only one personal account per user (enforced in service layer)
- `CREATABLE_ACCOUNT_TYPES` = `['business', 'professional', 'community']` (excludes personal)

### Response Contract (No Exceptions)
Every response must follow:
```json
{ "success": bool, "data": any|null, "message": string|null, "errorCode": string|null, "requestId": "uuid" }
```
Use `sendSuccess()` and `sendError()` from `src/common/utils/response.util.js`. Never return raw objects.

### Module Pattern (Mandatory)
```
routes.js → controller.js → service.js → repository.js
```
- **Controller**: HTTP only — extract req data, call service, call sendSuccess/sendError
- **Service**: Business logic — never touch req/res
- **Repository**: Mongoose queries only — never throw AppError (return null, let service decide)

### Data Normalization
- **Phone**: E.164 format (`+919876543210`), validated at Zod level with `/^\+[1-9]\d{6,14}$/`
- **Email**: lowercase + trimmed before persistence
- **displayName**: lowercase + trimmed before persistence

### Error Handling
- Use `AppError` class with static factories: `.badRequest()`, `.unauthorized()`, `.forbidden()`, `.notFound()`, `.conflict()`, `.tooManyRequests()`, `.internal()`, `.notImplemented()`
- Mongo E11000 errors are caught in global error handler and mapped to: phone/email → `USER_ALREADY_EXISTS`, displayName → `ACCOUNT_DUPLICATE_NAME`
- All error codes are defined in `src/common/constants/error-codes.js`

### Pagination Normalization (Two-Layer Defense)
- **Layer 1 — Route (Zod):** `z.coerce.number().int().min(1).max(100).default(N)` on query schemas handles HTTP query strings.
- **Layer 2 — Service:** Call `normalizePagination(page, limit)` from `src/common/utils/pagination.util.js` as the second line of every list method (after `assertObjectIds`). Returns `{ page, limit }` as clean integers — defaults `page=1`, `limit=20`, caps `limit` at 100. Prevents `NaN` from ever reaching Mongoose `.skip()` or `Math.ceil()`.
- Both `p` and `l` from the destructure are passed to the repository and used in the response pagination object.

### ObjectId Validation (Two-Layer Defense)
- **Layer 1 — Route (Zod):** Use `objectIdSchema(label)` from `src/common/utils/validators.util.js` in every Zod schema that accepts an ObjectId field. Rejects malformed IDs at the HTTP boundary with `400 VALIDATION_ERROR`.
- **Layer 2 — Service:** Call `assertObjectIds(...ids)` (same util) as the first line of every service method that receives an external ObjectId. Uses `Types.ObjectId.isValid()` — no CastError can ever reach Mongoose even if middleware is bypassed.
- Both exports live in `src/common/utils/validators.util.js`

### Express Route Ordering (Mandatory)
- All `router.use()` sub-module mounts **must** come before any `router.get('/:id', ...)` or other dynamic-param routes in the same router.
- Violation causes Express to match paths like `/followers` or `/public` as `/:id` with the wrong value.
- Pattern in `accounts.routes.js`: sub-modules first → static routes with `/:id` last.

### Auth Middleware Variants
- `authenticate` — verifies Bearer token, populates `req.user`, throws `401 AUTH_UNAUTHORIZED` if missing/invalid.
- `optionalAuthenticate` — populates `req.user` if a valid Bearer is present; silently skips if token is absent or invalid (never throws). Use on public endpoints that return extra info for authenticated viewers (e.g., `isFollowing`).
- Both exported from `src/common/middleware/auth.middleware.js`.

### Follower Domain Rules
- Only `personal` accounts may initiate a follow (`POST /follow`). Other account types receive `403 FOLLOWER_ACCOUNT_NOT_ALLOWED`.
- Follow status on creation: `business` targets → `accepted`; all others → `pending`.
- `activeAccountId` from the JWT is always used as the follower identity — never supplied by the client.

### Token Design
- Access token (15min): `{ userId, activeAccountId, type: "access" }` — `activeAccountId` defaults to personal account
- Refresh token (30d): stored hashed (SHA-256), family-based rotation with theft detection, `activeAccountId` persisted in RefreshToken record
- Signup token (10min): `{ phone, verified: true, type: "signup" }`
- On refresh: `activeAccountId` is read from stored RefreshToken (no DB lookup for personal account)

### OTP Rules
- 4-digit, 5min expiry, bcrypt hashed in memory
- Max 3 attempts (then 10min lockout), max 3 resends
- Resend invalidates previous OTP immediately
- Only one active OTP per `{purpose}:{phone}` key
- `OTP_LIVE=false` → console log; `true` → SMS provider

### Feature Flags
- Defined in `src/features/feature-flags.js`
- Account creation checks `isAccountTypeEnabled(type)` — returns `ACCOUNT_TYPE_DISABLED` if false
- Default: BUSINESS=true, PROFESSIONAL=true, COMMUNITY=false

## Key File Locations

| Purpose | Path |
|---------|------|
| App entry | `src/server.js` |
| Express app | `src/app.js` |
| Config (env) | `src/config/index.js` |
| DB connection | `src/config/db.js` |
| Logger | `src/config/logger.js` |
| Swagger | `src/config/swagger.js` |
| Error class | `src/common/errors/app-error.js` |
| Response utils | `src/common/utils/response.util.js` |
| JWT utils | `src/common/utils/token.util.js` |
| Auth middleware | `src/common/middleware/auth.middleware.js` |
| Validation middleware | `src/common/middleware/validate.middleware.js` |
| Global error handler | `src/common/middleware/error-handler.middleware.js` |
| Shared validators (objectIdSchema, assertObjectIds) | `src/common/utils/validators.util.js` |
| Pagination normalizer (normalizePagination) | `src/common/utils/pagination.util.js` |
| Feature flags | `src/features/feature-flags.js` |
| OTP store | `src/features/auth/otp/memory-otp.store.js` |
| OTP service | `src/features/auth/otp/otp.service.js` |
| User model | `src/features/users/user.model.js` |
| Account model | `src/features/accounts/account.model.js` |
| RefreshToken model | `src/models/refresh-token.model.js` |
| Follower model | `src/features/accounts/followers/follower.model.js` |
| Followers service | `src/features/accounts/followers/followers.service.js` |
| Followers repository | `src/features/accounts/followers/followers.repository.js` |
| Public profile service | `src/features/accounts/public-profile/public-profile.service.js` |
| Public profile repository | `src/features/accounts/public-profile/public-profile.repository.js` |

## Adding a New Module

1. Create folder under `src/features/` (or `src/features/accounts/` for account sub-modules)
2. Create: `module.schemas.js`, `module.routes.js`, `module.controller.js`, `module.service.js`, `module.repository.js`
3. Register routes in `accounts.routes.js` or `app.js`
4. Add Swagger paths in `src/config/swagger.js`
5. Add feature flag in `feature-flags.js` if gated

## Implementing a Stub Module

Stub modules exist at `src/features/accounts/{module}/` with routes, controller, and schemas returning 501. To implement:

1. Add `service.js` and `repository.js`
2. Replace 501 controller handlers with real logic
3. Add/update Mongoose model if needed
4. Update Swagger definitions
5. Update feature flags if the module is gated

## Commands

```bash
npm run dev    # Development with nodemon
npm start      # Production
```

## Phase Status

### Phase 1 (Complete)
Fully implemented: Auth (9 routes), Users (2 routes), Accounts (5 routes)

### Phase 2 (Complete)
- Part A: Personal account type — auto-created at signup, enforced in service layer
- Part B: Follower system — 6 routes (follow, handle request, cancel, list followers/following/requests)
- Part C: QR code — `GET /accounts/:id/qr-code`, generates `data:image/png;base64,...` encoding `mcb://profile/<accountId>`
- Part D: Public profile — `GET /accounts/public/accounts/:accountId` (optional auth, returns follower counts + isFollowing) + `PATCH /accounts/public/public-profile` (multipart, updates active account)

Stubbed (501): Circles, Circle Chat, Events, Coupons, Posts, Membership, Account Delete, Webhooks

## Important Notes

- Express 5 (not v4) — some API differences
- **Express 5 + ESM strict mode — `req.query` is getter-only:** Express 5 defines `req.query` via `Object.defineProperty` with only a getter (no setter). ESM modules run in strict mode, so `req.query = value` throws `TypeError`. The `validate` middleware handles this: when `source === 'query'` it uses `Object.defineProperty(req, 'query', { configurable: true, enumerable: true, writable: true, value: result.data })` instead of direct assignment. Never use `req.query = ...` elsewhere in the codebase.
- Zod v4 — requires `extendZodWithOpenApi(z)` before registering OpenAPI schemas
- Swagger UI disabled in production (`config.isProd` check)
- Sensitive fields masked in logs: otp, refreshToken, authorization, password, token
