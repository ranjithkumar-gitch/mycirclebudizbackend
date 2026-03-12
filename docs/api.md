# MCB API Reference

> Base URL: `http://localhost:4000/api/v1`

## Global Response Contract

Every response follows this shape:

```json
{
  "success": true | false,
  "data": <any> | null,
  "message": <string> | null,
  "errorCode": <string> | null,
  "requestId": "<uuid>"
}
```

## Authentication

Endpoints marked with **Auth: Bearer** require the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

The JWT access token contains: `{ userId, activeAccountId, type: "access" }`

---

## 1. Auth — Signup (4 routes)

### POST `/auth/signup/request-otp`

| | |
|---|---|
| **Auth** | None |
| **Rate Limit** | OTP rate limiter |

**Request Body:**
```json
{ "phone": "+919876543210" }
```

**Success Response (200):**
```json
{ "data": { "phone": "+919876543210" }, "message": "OTP sent successfully" }
```

**Errors:** `409 USER_ALREADY_EXISTS`, `400 VALIDATION_ERROR`, `429 OTP_TOO_MANY_REQUESTS`

---

### POST `/auth/signup/verify-otp`

| | |
|---|---|
| **Auth** | None |

**Request Body:**
```json
{ "phone": "+919876543210", "otp": "1234" }
```

**Success Response (200):**
```json
{ "data": { "signupToken": "<jwt>" }, "message": "OTP verified successfully..." }
```

**Errors:** `400 OTP_INVALID`, `400 OTP_EXPIRED`, `400 OTP_ATTEMPTS_EXCEEDED`

---

### POST `/auth/signup/resend-otp`

| | |
|---|---|
| **Auth** | None |
| **Rate Limit** | OTP rate limiter |

**Request Body:**
```json
{ "phone": "+919876543210" }
```

**Success Response (200):**
```json
{ "data": { "phone": "+919876543210", "resendsRemaining": 2 }, "message": "OTP resent successfully" }
```

**Errors:** `429 OTP_RESEND_LIMIT`

---

### POST `/auth/signup/complete-profile`

| | |
|---|---|
| **Auth** | Bearer `<signupToken>` |

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "deviceId": "device-uuid-123",
  "deviceName": "iPhone 15"       // optional
}
```

**Success Response (201):**
```json
{
  "data": {
    "user": {
      "id": "<objectId>",
      "phone": "+919876543210",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "isProfileComplete": true
    },
    "personalAccount": {
      "id": "<objectId>",
      "type": "personal",
      "displayName": "john"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  },
  "message": "Profile completed and account created successfully"
}
```

**Errors:** `401 AUTH_SIGNUP_TOKEN_INVALID`, `409 USER_ALREADY_EXISTS`, `409 ACCOUNT_PERSONAL_EXISTS`

---

## 2. Auth — Login (3 routes)

### POST `/auth/login/request-otp`

| | |
|---|---|
| **Auth** | None |
| **Rate Limit** | OTP rate limiter |

**Request Body:**
```json
{ "phone": "+919876543210" }
```

**Success Response (200):**
```json
{ "data": { "phone": "+919876543210" }, "message": "OTP sent successfully" }
```

**Errors:** `404 USER_NOT_FOUND`

---

### POST `/auth/login/verify-otp`

| | |
|---|---|
| **Auth** | None |

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "1234",
  "deviceId": "device-uuid-123",
  "deviceName": "iPhone 15"       // optional
}
```

**Success Response (200):**
```json
{
  "data": {
    "user": {
      "id": "<objectId>",
      "phone": "+919876543210",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "isProfileComplete": true
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  },
  "message": "Login successful"
}
```

**Errors:** `400 OTP_INVALID`, `400 OTP_EXPIRED`, `404 USER_NOT_FOUND`, `500 INTERNAL_ERROR` (personal account missing)

---

### POST `/auth/login/resend-otp`

| | |
|---|---|
| **Auth** | None |
| **Rate Limit** | OTP rate limiter |

**Request Body:**
```json
{ "phone": "+919876543210" }
```

**Success Response (200):**
```json
{ "data": { "phone": "+919876543210", "resendsRemaining": 2 }, "message": "OTP resent successfully" }
```

---

## 3. Auth — Token Management (2 routes)

### POST `/auth/refresh`

| | |
|---|---|
| **Auth** | None (token in body) |

**Request Body:**
```json
{ "refreshToken": "<jwt>", "deviceId": "device-uuid-123" }
```

**Success Response (200):**
```json
{
  "data": { "accessToken": "<jwt>", "refreshToken": "<jwt>" },
  "message": "Tokens refreshed successfully"
}
```

**Errors:** `401 AUTH_INVALID_TOKEN`, `401 AUTH_SESSION_REVOKED`

---

### POST `/auth/logout`

| | |
|---|---|
| **Auth** | Bearer |

**Request Body:**
```json
{ "deviceId": "device-uuid-123" }
```

**Success Response (200):**
```json
{ "data": null, "message": "Logged out successfully" }
```

---

## 4. Users (2 routes)

### GET `/users/me`

| | |
|---|---|
| **Auth** | Bearer |

**Success Response (200):**
```json
{
  "data": {
    "user": {
      "id": "<objectId>",
      "phone": "+919876543210",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "dateOfBirth": null,
      "gender": null,
      "profilePhoto": null,
"address":"",
      "isProfileComplete": true,
      "createdAt": "2026-02-24T..."
    },
    "accounts": [
      {
        "id": "<objectId>",
        "type": "personal",
        "displayName": "john",
        "profilePhoto": null,
        "bio": null,
        "isPublic": true,
        "createdAt": "2026-02-24T..."
      }
    ]
  }
}
```

---

### PATCH `/users/profile`

| | |
|---|---|
| **Auth** | Bearer |

**Request Body (all optional):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "dateOfBirth": "1990-01-15T00:00:00.000Z",
  "gender": "male",
  "address": "Mumbai, India"
}
```

`gender` enum: `male`, `female`, `other`, `prefer_not_to_say`

**Success Response (200):**
```json
{
  "data": {
    "id": "<objectId>",
    "phone": "+919876543210",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "dateOfBirth": "1990-01-15T...",
    "gender": "male",
    "profilePhoto": null,
    "address": "Mumbai, India",
    "isProfileComplete": true
  },
  "message": "Profile updated successfully"
}
```

---

## 5. Accounts (5 routes)

### POST `/accounts`

| | |
|---|---|
| **Auth** | Bearer |

**Request Body:**
```json
{
  "type": "business",
  "displayName": "My Shop",
  "bio": "Best shop in town",     // optional, max 500
  "isPublic": true                 // optional, default true
}
```

`type` enum: `business`, `professional`, `community` (NOT `personal`)

**Success Response (201):**
```json
{
  "data": {
    "id": "<objectId>",
    "type": "business",
    "displayName": "my shop",
    "profilePhoto": null,
    "bio": "Best shop in town",
    "isPublic": true,
    "createdAt": "2026-02-24T...",
    "updatedAt": "2026-02-24T..."
  },
  "message": "Account created successfully"
}
```

**Errors:** `400 ACCOUNT_PERSONAL_EXISTS` (if type=personal), `400 ACCOUNT_TYPE_DISABLED`, `409 ACCOUNT_DUPLICATE_NAME`

---

### GET `/accounts`

| | |
|---|---|
| **Auth** | Bearer |

**Success Response (200):**
```json
{
  "data": [
    { "id": "...", "type": "personal", "displayName": "john", ... },
    { "id": "...", "type": "business", "displayName": "my shop", ... }
  ]
}
```

---

### GET `/accounts/:id`

| | |
|---|---|
| **Auth** | Bearer |
| **Params** | `id` — Account ObjectId |

**Success Response (200):**
```json
{ "data": { "id": "...", "type": "business", "displayName": "my shop", ... } }
```

**Errors:** `404 ACCOUNT_NOT_FOUND`, `403 ACCOUNT_FORBIDDEN`

---

### PATCH `/accounts/:id`

| | |
|---|---|
| **Auth** | Bearer |
| **Params** | `id` — Account ObjectId |

**Request Body (all optional):**
```json
{
  "displayName": "New Name",
  "bio": "Updated bio",
  "isPublic": false
}
```

**Success Response (200):** Updated account object.

**Errors:** `404 ACCOUNT_NOT_FOUND`, `403 ACCOUNT_FORBIDDEN`, `409 ACCOUNT_DUPLICATE_NAME`

---

### DELETE `/accounts/:id`

| | |
|---|---|
| **Auth** | Bearer |
| **Params** | `id` — Account ObjectId |

**Success Response (200):**
```json
{ "data": null, "message": "Account deleted successfully" }
```

**Errors:** `404 ACCOUNT_NOT_FOUND`, `403 ACCOUNT_FORBIDDEN`, `400 ACCOUNT_PERSONAL_UNDELETABLE`

---

## 6. Followers (6 routes)

All follower endpoints derive `followerAccountId` from JWT `activeAccountId` — never from the request body.

> **Domain rule:** Only `personal` accounts may initiate follow actions (`POST /follow`). Business, professional, and community accounts cannot follow anyone.

### POST `/accounts/follow`

| | |
|---|---|
| **Auth** | Bearer |

**Request Body:**
```json
{ "targetAccountId": "<objectId>" }
```

**Success Response (201):**
```json
{
  "data": {
    "id": "<followRecordId>",
    "accountId": "<targetAccountId>",
    "followerAccountId": "<activeAccountId from JWT>",
    "status": "accepted",
    "createdAt": "2026-02-24T..."
  },
  "message": "Followed successfully"
}
```

`status` is `"accepted"` for business targets, `"pending"` for personal/professional/community.

**Errors:** `400 FOLLOWER_SELF_FOLLOW`, `403 FOLLOWER_ACCOUNT_NOT_ALLOWED` (active account is not personal), `403 ACCOUNT_FORBIDDEN`, `404 ACCOUNT_NOT_FOUND`, `409 FOLLOWER_ALREADY_EXISTS`

---

### PATCH `/accounts/follow-requests/:requestId`

| | |
|---|---|
| **Auth** | Bearer |
| **Params** | `requestId` — Follower record ObjectId |

**Request Body:**
```json
{ "action": "accept" }
```

`action` enum: `accept`, `reject`

**Success Response (200):**
```json
{
  "data": {
    "id": "<followRecordId>",
    "accountId": "<targetAccountId>",
    "followerAccountId": "<followerAccountId>",
    "status": "accepted",
    "updatedAt": "2026-02-24T..."
  },
  "message": "Follow request accepted"
}
```

**Errors:** `404 FOLLOWER_NOT_FOUND`, `403 ACCOUNT_FORBIDDEN`, `400 FOLLOWER_NOT_FOUND` (not pending)

---

### GET `/accounts/followers`

| | |
|---|---|
| **Auth** | Bearer |

**Query Params:**
| Param | Type | Required | Default |
|-------|------|----------|---------|
| `accountId` | string | yes | — |
| `page` | number | no | 1 |
| `limit` | number | no | 20 (max 100) |

**Success Response (200):**
```json
{
  "data": {
    "followers": [
      {
        "id": "<followRecordId>",
        "account": { "_id": "...", "displayName": "...", "type": "...", "profilePhoto": "..." },
        "followedAt": "2026-02-24T..."
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

**Errors:** `403 ACCOUNT_FORBIDDEN`

---

### GET `/accounts/following`

| | |
|---|---|
| **Auth** | Bearer |

**Query Params:** Same as `/followers`

**Success Response (200):**
```json
{
  "data": {
    "following": [
      {
        "id": "<followRecordId>",
        "account": { "_id": "...", "displayName": "...", "type": "...", "profilePhoto": "..." },
        "followedAt": "2026-02-24T..."
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
  }
}
```

---

### GET `/accounts/follow-requests`

| | |
|---|---|
| **Auth** | Bearer |

**Query Params:** Same as `/followers`

**Success Response (200):**
```json
{
  "data": {
    "requests": [
      {
        "id": "<followRecordId>",
        "fromAccount": { "_id": "...", "displayName": "...", "type": "...", "profilePhoto": "..." },
        "requestedAt": "2026-02-24T..."
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
  }
}
```

---

### DELETE `/accounts/follow-requests`

| | |
|---|---|
| **Auth** | Bearer |

**Request Body:**
```json
{ "targetAccountId": "<objectId>" }
```

**Success Response (200):**
```json
{ "data": null, "message": "Follow request cancelled" }
```

**Errors:** `404 FOLLOWER_NOT_FOUND`, `400 FOLLOWER_NOT_FOUND` (not pending), `403 ACCOUNT_FORBIDDEN`

---

## 7. QR Code (1 route)

### GET `/accounts/:id/qr-code`

| | |
|---|---|
| **Auth** | Bearer |
| **Params** | `id` — Account ObjectId (must belong to requesting user) |

**Success Response (200):**
```json
{
  "data": {
    "qrCode": "data:image/png;base64,..."
  },
  "message": "QR code generated successfully"
}
```

QR encodes deep link: `mcb://profile/<accountId>`

**Errors:** `404 ACCOUNT_NOT_FOUND`, `403 ACCOUNT_FORBIDDEN`

---

## 8. Public Profile (2 routes)

### GET `/accounts/public/accounts/:accountId`

| | |
|---|---|
| **Auth** | None (optional Bearer for `isFollowing`) |
| **Params** | `accountId` — Account ObjectId |

**Success Response (200):**
```json
{
  "data": {
    "id": "<objectId>",
    "type": "personal",
    "displayName": "john",
    "profilePhoto": null,
    "bio": null,
    "isPublic": true,
    "followerCount": 42,
    "followingCount": 10,
    "isFollowing": true,
    "createdAt": "2026-02-24T..."
  }
}
```

`isFollowing` is `null` when no Bearer token is provided, `true`/`false` when authenticated.

Private or deleted accounts return `404 ACCOUNT_NOT_FOUND`.

---

### PATCH `/accounts/public/public-profile`

| | |
|---|---|
| **Auth** | Bearer |
| **Content-Type** | `multipart/form-data` |

Updates the account identified by `activeAccountId` in the JWT.

**Request Body (all optional, at least one required):**
| Field | Type | Notes |
|-------|------|-------|
| `displayName` | string | 1–100 chars, normalized to lowercase |
| `bio` | string | max 500 chars |
| `isPublic` | string | `"true"` or `"false"` (coerced from form data) |
| `profilePhoto` | file | JPEG, PNG, or WebP |

**Success Response (200):** Updated account object.

**Errors:** `400 VALIDATION_ERROR`, `403 ACCOUNT_FORBIDDEN`, `404 ACCOUNT_NOT_FOUND`

---

## Stubbed Endpoints (501 Not Implemented)

- Circles: `POST /accounts/circles`, `GET /accounts/circles`, `PATCH /accounts/circles/:circleId`, etc.
- Circle Chat: `POST /accounts/circles/:circleId/messages`, etc.
- Events: `POST /accounts/events`, `PATCH /accounts/events/:eventId`, etc.
- Coupons: `POST /accounts/coupons`
- Posts: `POST /accounts/posts`
- Membership: `POST /accounts/membership/upgrade`, `POST /accounts/membership/verify`
- Account Delete: `DELETE /accounts/`, `POST /accounts/delete/request-otp`
- Webhooks: `POST /webhooks/payment`

---

## Error Codes Reference

| Code | HTTP | Description |
|------|------|-------------|
| `OTP_INVALID` | 400 | Wrong OTP code |
| `OTP_EXPIRED` | 400 | OTP has expired |
| `OTP_ATTEMPTS_EXCEEDED` | 400 | Max verification attempts reached |
| `OTP_RESEND_LIMIT` | 429 | Max resends reached |
| `OTP_TOO_MANY_REQUESTS` | 429 | Rate limited |
| `AUTH_INVALID_TOKEN` | 401 | Bad or expired JWT |
| `AUTH_UNAUTHORIZED` | 401 | Missing auth header |
| `AUTH_SESSION_REVOKED` | 401 | Token theft detected |
| `AUTH_SIGNUP_TOKEN_INVALID` | 401 | Bad signup token |
| `ACCOUNT_DUPLICATE_NAME` | 409 | displayName already taken for this user |
| `ACCOUNT_NOT_FOUND` | 404 | Account doesn't exist or is deleted |
| `ACCOUNT_TYPE_DISABLED` | 400 | Feature flag disabled for this type |
| `ACCOUNT_FORBIDDEN` | 403 | Not your account |
| `ACCOUNT_PERSONAL_EXISTS` | 400/409 | Personal account already exists / can't create manually |
| `ACCOUNT_PERSONAL_UNDELETABLE` | 400 | Personal account can't be deleted |
| `USER_ALREADY_EXISTS` | 409 | Phone already registered |
| `USER_NOT_FOUND` | 404 | No user with this phone |
| `FOLLOWER_ALREADY_EXISTS` | 409 | Already following or request pending |
| `FOLLOWER_NOT_FOUND` | 404 | Follow record doesn't exist |
| `FOLLOWER_SELF_FOLLOW` | 400 | Can't follow yourself |
| `FOLLOWER_ACCOUNT_NOT_PUBLIC` | 403 | Account is private |
| `FOLLOWER_ACCOUNT_NOT_ALLOWED` | 403 | Non-personal account attempted to follow |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `NOT_FOUND` | 404 | Route not found |
| `RATE_LIMIT` | 429 | Global rate limit |
| `INTERNAL_ERROR` | 500 | Server error |
| `NOT_IMPLEMENTED` | 501 | Stub endpoint |
