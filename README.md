# MCB Server - MyCircleBudiz Backend API

Backend API server for the MyCircleBudiz (MCB) Flutter mobile application. Built as a **modular monolith** in Node.js/Express/MongoDB designed to scale to microservices.

## Prerequisites

- **Node.js** >= 18
- **MongoDB** >= 6.0 (local or Atlas)
- **npm** >= 9

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. edit environment file accordingly
# Edit .env with your MongoDB URI and JWT secrets

# 3. Start development server
npm run dev
```

The server starts at `http://localhost:4000` by default.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start with nodemon (auto-reload) |
| `start` | `npm start` | Start in production mode |

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment: development, staging, production |
| `PORT` | `4000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/mcb` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | - | Secret for access tokens (required) |
| `JWT_REFRESH_SECRET` | - | Secret for refresh tokens (required) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh token expiry |
| `JWT_SIGNUP_EXPIRES_IN` | `10m` | Signup token expiry |
| `OTP_LIVE` | `false` | `false` = log OTP to console, `true` = send via SMS |
| `SMS_PROVIDER` | `console` | SMS provider: `console` or `twilio` |
| `FEATURE_ACCOUNT_BUSINESS` | `true` | Enable business account creation |
| `FEATURE_ACCOUNT_PROFESSIONAL` | `true` | Enable professional account creation |
| `FEATURE_ACCOUNT_COMMUNITY` | `false` | Enable community account creation |

See `.env.example` for the full list.

## API Documentation

Swagger UI is available at `/api-docs` in development/staging (disabled in production).

JSON spec: `GET /api-docs.json`

## Architecture

### Identity Model

- **One phone number = one User.** The User IS the personal identity.
- **No "personal" account type.** Account types are: `business`, `professional`, `community`.
- A user can create **unlimited** accounts of any enabled type.
- `displayName` is case-insensitively unique per user.

### Project Structure

```
src/
├── server.js                    # Entry point: DB connect, listen, graceful shutdown
├── app.js                       # Express app: middleware chain, route mounting
├── config/                      # Configuration (env, DB, logger, swagger)
├── common/                      # Shared infrastructure
│   ├── constants/               # Error codes, HTTP status, account types
│   ├── errors/                  # AppError class
│   ├── utils/                   # Response helper, async handler, JWT utils
│   ├── middleware/               # Auth, validation, rate limit, error handler, etc.
│   └── providers/               # SMS and storage provider abstractions
├── features/                    # Feature modules
│   ├── feature-flags.js         # Feature toggle registry
│   ├── auth/                    # Auth module (9 endpoints) - FULLY IMPLEMENTED
│   ├── users/                   # User module (2 endpoints) - FULLY IMPLEMENTED
│   └── accounts/                # Account module (5 endpoints) - FULLY IMPLEMENTED
│       ├── circles/             # Stub (501)
│       ├── circles/chat/        # Stub (501)
│       ├── events/              # Stub (501)
│       ├── coupons/             # Stub (501)
│       ├── followers/           # Stub (501)
│       ├── posts/               # Stub (501)
│       ├── membership/          # Stub (501)
│       ├── public-profile/      # Stub (501)
│       └── delete/              # Stub (501)
└── models/                      # Shared models (RefreshToken)
```

### Module Pattern

Each module follows: `routes.js` → `controller.js` → `service.js` → `repository.js`

- **Routes**: Express router with validation and auth middleware
- **Controller**: HTTP layer — extracts request data, calls service, sends response
- **Service**: Business logic — validation rules, orchestration
- **Repository**: Data access — Mongoose queries only

### Global Response Contract

Every API response follows this exact format:

**Success:**
```json
{
  "success": true,
  "data": {},
  "message": null,
  "errorCode": null,
  "requestId": "uuid"
}
```

**Error:**
```json
{
  "success": false,
  "data": null,
  "message": "Human readable error",
  "errorCode": "ERROR_CODE",
  "requestId": "uuid"
}
```

## API Endpoints

### Auth (9 routes)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/signup/request-otp` | Request OTP for signup |
| POST | `/api/v1/auth/signup/verify-otp` | Verify signup OTP |
| POST | `/api/v1/auth/signup/resend-otp` | Resend signup OTP |
| POST | `/api/v1/auth/signup/complete-profile` | Complete profile (requires signup token) |
| POST | `/api/v1/auth/login/request-otp` | Request OTP for login |
| POST | `/api/v1/auth/login/verify-otp` | Verify login OTP |
| POST | `/api/v1/auth/login/resend-otp` | Resend login OTP |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout (revoke refresh token) |

### Users (2 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/users/me` | Get current user profile + accounts |
| PATCH | `/api/v1/users/profile` | Update profile fields |

### Accounts (5 routes)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/accounts` | Create account |
| GET | `/api/v1/accounts` | List own accounts |
| GET | `/api/v1/accounts/:id` | Get account by ID |
| PATCH | `/api/v1/accounts/:id` | Update account |
| DELETE | `/api/v1/accounts/:id` | Soft delete account |

### Stub Modules (return 501)

Circles, Circle Chat, Events, Coupons, Followers, Posts, Membership, Public Profile, Account Delete, Webhooks

## Feature Flags

Account type creation is controlled by feature flags in `.env`:

| Flag | Default | Controls |
|------|---------|----------|
| `FEATURE_ACCOUNT_BUSINESS` | `true` | Business account creation |
| `FEATURE_ACCOUNT_PROFESSIONAL` | `true` | Professional account creation |
| `FEATURE_ACCOUNT_COMMUNITY` | `false` | Community account creation |

When a flag is `false`, attempting to create that account type returns `ACCOUNT_TYPE_DISABLED`.

## Token Design

- **Access token** (15min): `{ userId, activeAccountId, type: "access" }`
- **Refresh token** (30d): `{ userId, deviceId, family, type: "refresh" }` — stored hashed, family-based theft detection
- **Signup token** (10min): `{ phone, verified, type: "signup" }`

## OTP Rules

- 4-digit code, 5-minute expiry
- Max 3 verification attempts (locks for 10min after)
- Max 3 resends per phone per purpose
- Resend invalidates previous OTP immediately
- Stored bcrypt-hashed in memory (not persisted)
- `OTP_LIVE=false` logs OTP to console for development

## Health Check

```
GET /health
```

Returns `{ success: true, data: { status: "ok", timestamp: "..." } }`
