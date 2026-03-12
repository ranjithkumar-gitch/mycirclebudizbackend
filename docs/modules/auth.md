# Auth Module

## Location
`src/features/auth/`

## Files
| File | Purpose |
|------|---------|
| `auth.routes.js` | 9 route definitions with validation + rate limiting |
| `auth.controller.js` | HTTP handlers — extracts request data, calls service |
| `auth.service.js` | Business logic — signup/login flows, token issuance |
| `auth.repository.js` | Data access — User + RefreshToken queries |
| `auth.schemas.js` | Zod validation schemas for all endpoints |
| `otp/memory-otp.store.js` | In-memory Map store with TTL auto-cleanup |
| `otp/otp.service.js` | OTP generation, verification, resend logic |

## Endpoints

### Signup Flow
| Method | Route | Auth | Middleware |
|--------|-------|------|-----------|
| POST | `/api/v1/auth/signup/request-otp` | None | otpRateLimiter, validate body |
| POST | `/api/v1/auth/signup/verify-otp` | None | validate body |
| POST | `/api/v1/auth/signup/resend-otp` | None | otpRateLimiter, validate body |
| POST | `/api/v1/auth/signup/complete-profile` | Signup token (Bearer) | validate body |

### Login Flow
| Method | Route | Auth | Middleware |
|--------|-------|------|-----------|
| POST | `/api/v1/auth/login/request-otp` | None | otpRateLimiter, validate body |
| POST | `/api/v1/auth/login/verify-otp` | None | validate body |
| POST | `/api/v1/auth/login/resend-otp` | None | otpRateLimiter, validate body |

### Token Management
| Method | Route | Auth | Middleware |
|--------|-------|------|-----------|
| POST | `/api/v1/auth/refresh` | None (token in body) | validate body |
| POST | `/api/v1/auth/logout` | JWT (access token) | authenticate, validate body |

## Signup Flow Logic
1. **request-otp**: Validates phone is NOT registered → generates 4-digit OTP → hashes with bcrypt → stores in memory with `purpose=signup` → logs or sends via SMS
2. **verify-otp**: Checks OTP against store (max 3 attempts, lockout after) → returns `signupToken` (10min JWT)
3. **resend-otp**: Checks resend limit (max 3) → invalidates previous OTP → generates new one
4. **complete-profile**: Verifies signupToken from Authorization header → creates User with `isProfileComplete=true` → issues access + refresh tokens → does NOT create any Account

## Login Flow Logic
1. **request-otp**: Validates phone IS registered → generates OTP with `purpose=login`
2. **verify-otp**: Verifies OTP → revokes existing tokens for this device → issues new access + refresh tokens → updates `lastLoginAt`
3. **resend-otp**: Same resend logic as signup

## Token Refresh Logic
1. Hash incoming refresh token (SHA-256)
2. Check if hash matches a revoked token → **theft detected** → revoke entire family → return `AUTH_SESSION_REVOKED`
3. Find active stored token by hash
4. Verify JWT validity and `type: "refresh"`
5. Verify device ID matches
6. Revoke old token → issue new tokens in same family

## Request Body Schemas

**requestOtpSchema / resendOtpSchema:**
```json
{ "phone": "+919876543210" }
```
Phone validated: `/^\+[1-9]\d{6,14}$/` (E.164)

**verifyOtpSchema:**
```json
{ "phone": "+919876543210", "otp": "1234" }
```

**loginVerifyOtpSchema:**
```json
{ "phone": "+919876543210", "otp": "1234", "deviceId": "abc123", "deviceName": "iPhone 15" }
```

**completeProfileSchema:**
```json
{ "firstName": "John", "lastName": "Doe", "email": "john@example.com", "deviceId": "abc123", "deviceName": "iPhone 15" }
```

**refreshTokenSchema:**
```json
{ "refreshToken": "jwt...", "deviceId": "abc123" }
```

**logoutSchema:**
```json
{ "deviceId": "abc123" }
```

## OTP Subsystem
- Store key format: `{purpose}:{phone}` (e.g., `signup:+919876543210`)
- `set()` overwrites existing entry — only one active OTP per key
- 4-digit random code, bcrypt hashed
- 5-minute TTL with `setTimeout` auto-cleanup
- Max 3 verification attempts → 10-minute lockout
- Max 3 resends per purpose+phone
- `OTP_LIVE=false` → logged to console; `true` → SMS provider

## Recent Temporary OTP Changes (Dev Only)
- `otp.service.js/requestOtp()` now returns `otp` in the service payload: `{ phone, purpose, otp }`.
- `otp.service.js/resendOtp()` now returns `otp` in the service payload: `{ phone, purpose, otp, resendsRemaining }`.
- `signup/request-otp` response now includes OTP in `data`: `{ phone, otp }`.
- `login/request-otp` response now includes OTP in `data`: `{ phone, otp }`.
- Fixed runtime bug in OTP service signature (`purposem` -> `purpose`) that caused `ReferenceError: purpose is not defined`.
- `signup/verify-otp` uses `verifyOtp(phone, 'signup', otp)`.
- Note: OTP in API response is temporary for testing and must be removed before production deployment.

## Error Codes Used
`USER_ALREADY_EXISTS`, `USER_NOT_FOUND`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED`, `OTP_RESEND_LIMIT`, `OTP_TOO_MANY_REQUESTS`, `AUTH_SIGNUP_TOKEN_INVALID`, `AUTH_INVALID_TOKEN`, `AUTH_SESSION_REVOKED`, `AUTH_UNAUTHORIZED`
