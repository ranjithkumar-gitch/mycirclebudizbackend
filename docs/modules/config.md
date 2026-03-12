# Config Module

## Location
`src/config/`

## Files
| File | Purpose |
|------|---------|
| `index.js` | Central config — reads .env, validates, exports frozen object |
| `db.js` | Mongoose connection with event handlers |
| `logger.js` | Winston logger with sensitive field masking |
| `swagger.js` | zod-to-openapi registry + Swagger UI mount |

## Config Object (`index.js`)
Reads all environment variables using helper functions:
- `required(key)` — throws if missing
- `optional(key, defaultValue)` — returns default if missing
- `bool(key, defaultValue)` — parses boolean strings
- `int(key, defaultValue)` — parses integer strings

Exports a frozen object with sections:
```js
config.port           // PORT
config.nodeEnv        // NODE_ENV
config.isDev          // nodeEnv === 'development'
config.isProd         // nodeEnv === 'production'
config.isStaging      // nodeEnv === 'staging'
config.db.uri         // MONGODB_URI
config.jwt.accessSecret / refreshSecret / accessExpiresIn / refreshExpiresIn / signupExpiresIn
config.otp.length / ttlMinutes / maxAttempts / maxResends / cooldownMinutes / isLive
config.sms.provider / twilioSid / twilioToken / twilioPhone
config.rateLimit.windowMs / max
config.upload.maxSizeMb
config.features.accountBusiness / accountProfessional / accountCommunity
config.log.level
```

## Database (`db.js`)
- `connectDB()` — connects to MongoDB, logs success
- `disconnectDB()` — graceful disconnect
- Handles `error` and `disconnected` events with logging

## Logger (`logger.js`)
Winston logger with:
- **Development**: Colorized printf format (`timestamp level: message`)
- **Production**: JSON format
- **Sensitive field masking**: Recursively masks `otp`, `refreshToken`, `authorization`, `password`, `token` fields in logged objects with `[REDACTED]`

## Swagger (`swagger.js`)
- Uses `@asteasolutions/zod-to-openapi` with `extendZodWithOpenApi(z)` (required for Zod v4)
- Registers all implemented API paths (auth, users, accounts)
- `setupSwagger(app)` → mounts Swagger UI at `/api-docs` and JSON spec at `/api-docs.json`
- Disabled in production (`config.isProd` check)
- To add new paths: use `registry.registerPath({...})` in swagger.js
