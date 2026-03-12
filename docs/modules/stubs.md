# Stub Modules

All stub modules return 501 "Not implemented yet" in the standard response format. They serve as route placeholders for Phase 2+ implementation.

## Location
Sub-modules under `src/features/accounts/` and `src/features/webhooks/`

## Each Stub Contains
- `routes.js` — Route definitions with Zod validation
- `controller.js` — Handlers that return 501 via `AppError.notImplemented()`
- `schemas.js` — Zod schemas for request validation

## Stub Modules

### Circles (`accounts/circles/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/accounts/circles` | Create circle |
| PATCH | `/api/v1/accounts/circles/:circleId` | Update circle |
| PATCH | `/api/v1/accounts/circles/:circleId/members` | Manage members |
| POST | `/api/v1/accounts/circles/:circleId/photo` | Upload circle photo |
| GET | `/api/v1/accounts/circles` | List circles |

### Circle Chat (`accounts/circles/chat/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/accounts/circles/:circleId/messages` | Send message |
| POST | `/api/v1/accounts/circles/:circleId/messages/media` | Send media message |
| POST | `/api/v1/accounts/circles/:circleId/messages/:messageId/reactions` | Add reaction |

### Events (`accounts/events/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/accounts/events` | Create event |
| PATCH | `/api/v1/accounts/events/:eventId` | Update event |
| POST | `/api/v1/accounts/events/:eventId/photo` | Upload event photo |

### Coupons (`accounts/coupons/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/accounts/coupons` | Create coupon |

### Followers (`accounts/followers/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/accounts/follow` | Follow account |
| PATCH | `/api/v1/accounts/follow-requests/:requestId` | Accept/reject follow request |
| GET | `/api/v1/accounts/followers` | List followers |
| GET | `/api/v1/accounts/following` | List following |
| GET | `/api/v1/accounts/follow-requests` | List pending follow requests |
| DELETE | `/api/v1/accounts/follow-requests` | Cancel follow request |

### Posts (`accounts/posts/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/accounts/posts` | Create post |

### Membership (`accounts/membership/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/accounts/membership/upgrade` | Upgrade membership |
| POST | `/api/v1/accounts/membership/verify` | Verify membership |

### Public Profile (`accounts/public-profile/`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/accounts/public/:accountId` | Get public profile |
| PATCH | `/api/v1/accounts/public` | Update public profile |

### Account Delete (`accounts/delete/`)
| Method | Route | Description |
|--------|-------|-------------|
| DELETE | `/api/v1/accounts/` | Delete account (OTP verified) |
| POST | `/api/v1/accounts/delete/request-otp` | Request OTP for account deletion |

### Webhooks (`webhooks/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/webhooks/payment` | Payment webhook |

## How to Implement a Stub

1. Add `service.js` and `repository.js` to the module folder
2. Add/update Mongoose model if needed (in `src/features/` or `src/models/`)
3. Replace 501 handlers in `controller.js` with real logic following the pattern: extract request data → call service → sendSuccess
4. Update Zod schemas if the request body needs changes
5. Add Swagger paths in `src/config/swagger.js`
6. Add feature flag in `src/features/feature-flags.js` if the module should be gated
7. Test all endpoints
