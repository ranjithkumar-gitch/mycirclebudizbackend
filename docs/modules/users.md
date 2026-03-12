# Users Module

## Location
`src/features/users/`

## Files
| File | Purpose |
|------|---------|
| `user.model.js` | Mongoose User schema and model |
| `users.routes.js` | 2 route definitions |
| `users.controller.js` | HTTP handlers |
| `users.service.js` | Business logic — getMe, updateProfile |
| `users.repository.js` | Data access — User + Account queries |
| `users.schemas.js` | Zod validation for profile updates |

## Endpoints

| Method | Route | Auth | Middleware |
|--------|-------|------|-----------|
| GET | `/api/v1/users/me` | JWT | authenticate |
| PATCH | `/api/v1/users/profile` | JWT | authenticate, validate body |

## Logic

### GET /users/me
Returns the authenticated user's profile along with a list of their non-deleted accounts.

Response data:
```json
{
  "user": { "id", "phone", "firstName", "lastName", "email", "dateOfBirth", "gender", "profilePhoto", "address", "isProfileComplete" },
  "accounts": [{ "id", "type", "displayName", "bio", "isPublic", "profilePhoto", "createdAt" }]
}
```

### PATCH /users/profile
Updates optional profile fields. Normalizes email (lowercase + trim) and parses dateOfBirth to Date if provided.

## User Model Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| phone | String | Yes | Unique, E.164 format, indexed |
| firstName | String | Yes | Set at signup |
| lastName | String | Yes | Set at signup |
| email | String | Yes | Unique, sparse index, lowercase+trimmed |
| dateOfBirth | Date | No | Default null |
| gender | String | No | Enum: male, female, other, prefer_not_to_say |
| profilePhoto | String | No | Default null |
| address | String | No | Default null |
| isProfileComplete | Boolean | No | Default false, set true at signup |
| isActive | Boolean | No | Default true |
| lastLoginAt | Date | No | Updated on login |

## Update Profile Schema
All fields optional:
```json
{
  "firstName": "string (1-50 chars)",
  "lastName": "string (1-50 chars)",
  "email": "valid email",
  "dateOfBirth": "ISO datetime string",
  "gender": "male | female | other | prefer_not_to_say",
  "address": "string (max 200 chars)"
}
```

## Key Design Decision
The User IS the personal identity. There is no "personal" account type. The User model holds personal profile info directly.
