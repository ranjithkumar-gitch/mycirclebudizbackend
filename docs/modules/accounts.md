# Accounts Module

## Location
`src/features/accounts/`

## Files
| File | Purpose |
|------|---------|
| `account.model.js` | Mongoose Account schema and model |
| `accounts.routes.js` | 5 CRUD routes + sub-module mounts |
| `accounts.controller.js` | HTTP handlers |
| `accounts.service.js` | Business logic — CRUD with ownership validation |
| `accounts.repository.js` | Data access — Account queries |
| `accounts.schemas.js` | Zod validation schemas |

## Endpoints

| Method | Route | Auth | Middleware |
|--------|-------|------|-----------|
| POST | `/api/accounts` | JWT | authenticate, validate body |
| GET | `/api/accounts` | JWT | authenticate |
| GET | `/api/accounts/:id` | JWT | authenticate, validate params |
| GET | `/api/accounts/:id/qr-code` | JWT | authenticate, validate params |
| PATCH | `/api/accounts/:id` | JWT | authenticate, validate params+body |
| DELETE | `/api/accounts/:id` | JWT | authenticate, validate params |

## Logic

### POST /accounts (Create)
1. Check feature flag via `isAccountTypeEnabled(type)` → `ACCOUNT_TYPE_DISABLED` if false
2. Normalize displayName (trim + lowercase)
3. Create account with `userId` from JWT
4. Mongo compound unique index `(userId, displayName)` catches duplicates → `ACCOUNT_DUPLICATE_NAME`

### GET /accounts (List)
Returns all non-deleted accounts owned by the authenticated user.

### GET /accounts/:id (Get)
Returns account by ID. Validates ownership (must belong to authenticated user) and not soft-deleted.

### PATCH /accounts/:id (Update)
Updates optional fields: displayName, bio, isPublic. Validates ownership. Normalizes displayName if provided.

### DELETE /accounts/:id (Soft Delete)
Sets `isDeleted=true` and `deletedAt=now`. Validates ownership.

## Account Model Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | ObjectId | Yes | Ref to User, indexed |
| type | String | Yes | Enum: business, professional, community |
| displayName | String | Yes | Stored lowercase+trimmed |
| profilePhoto | String | No | Default null |
| bio | String | No | Default null, max 500 chars |
| isPublic | Boolean | No | Default true |
| isDeleted | Boolean | No | Default false |
| deletedAt | Date | No | Set on soft delete |

## Indexes
- Compound unique: `(userId, displayName)` — enforces case-insensitive uniqueness per user
- Index: `(userId)` — fast lookup of user's accounts

## Create Schema
```json
{
  "type": "business | professional | community",
  "displayName": "My Business (required, 1-100 chars)",
  "bio": "optional, max 500 chars",
  "isPublic": true
}
```

## Update Schema
```json
{
  "displayName": "optional, 1-100 chars",
  "bio": "optional, max 500 chars",
  "isPublic": true
}
```

## Feature Flags
| Flag | Default | Effect |
|------|---------|--------|
| `FEATURE_ACCOUNT_BUSINESS` | true | Allows business account creation |
| `FEATURE_ACCOUNT_PROFESSIONAL` | true | Allows professional account creation |
| `FEATURE_ACCOUNT_COMMUNITY` | false | Blocks community account creation |

## Sub-Modules (Stubs)
All mounted from `accounts.routes.js`, return 501:

| Module | Mount | Routes |
|--------|-------|--------|
| Circles | `/circles` | POST /, PATCH /:circleId, PATCH /:circleId/members, POST /:circleId/photo, GET / |
| Circle Chat | `/circles` | POST /:circleId/messages, POST /:circleId/messages/media, POST /:circleId/messages/:messageId/reactions |
| Events | `/events` | POST /, PATCH /:eventId, POST /:eventId/photo |
| Coupons | `/coupons` | POST / |
| Followers | `/` (root) | POST /follow, PATCH /follow-requests/:requestId, GET /followers, GET /following, GET /follow-requests, DELETE /follow-requests |
| Posts | `/posts` | POST / |
| Membership | `/membership` | POST /upgrade, POST /verify |
| Public Profile | `/public` | GET /:accountId, PATCH / |
| Delete | `/` (root) | DELETE /, POST /delete/request-otp |

## Error Codes Used
`ACCOUNT_DUPLICATE_NAME`, `ACCOUNT_NOT_FOUND`, `ACCOUNT_TYPE_DISABLED`, `ACCOUNT_FORBIDDEN`
