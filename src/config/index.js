import dotenv from 'dotenv';

dotenv.config();

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key, defaultValue) {
  return process.env[key] || defaultValue;
}

function bool(key, defaultValue = false) {
  const value = process.env[key];
  if (value === undefined || value === '') return defaultValue;
  return value === 'true' || value === '1';
}

function int(key, defaultValue) {
  const value = process.env[key];
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) throw new Error(`Environment variable ${key} must be an integer`);
  return parsed;
}

const config = Object.freeze({
  nodeEnv: optional('NODE_ENV', 'development'),
  port: int('PORT', 4000),

  db: Object.freeze({
    uri: required('MONGODB_URI'),
  }),

  jwt: Object.freeze({
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
    signupExpiresIn: optional('JWT_SIGNUP_EXPIRES_IN', '10m'),
  }),

  otp: Object.freeze({
    length: int('OTP_LENGTH', 4),
    ttlMinutes: int('OTP_TTL_MINUTES', 5),
    maxAttempts: int('OTP_MAX_ATTEMPTS', 3),
    maxResends: int('OTP_MAX_RESENDS', 3),
    cooldownMinutes: int('OTP_COOLDOWN_MINUTES', 10),
    live: bool('OTP_LIVE', false),
  }),

  sms: Object.freeze({
    provider: optional('SMS_PROVIDER', 'console'),
  }),

  rateLimit: Object.freeze({
    windowMs: int('RATE_LIMIT_WINDOW_MS', 60000),
    max: int('RATE_LIMIT_MAX', 100),
  }),

  upload: Object.freeze({
    maxSizeMb: int('UPLOAD_MAX_SIZE_MB', 5),
  }),

  features: Object.freeze({
    accountBusiness: bool('FEATURE_ACCOUNT_BUSINESS', true),
    accountProfessional: bool('FEATURE_ACCOUNT_PROFESSIONAL', true),
    accountCommunity: bool('FEATURE_ACCOUNT_COMMUNITY', false),
  }),

  log: Object.freeze({
    level: optional('LOG_LEVEL', 'debug'),
  }),

  get isDev() {
    return this.nodeEnv === 'development';
  },
  get isProd() {
    return this.nodeEnv === 'production';
  },
  get isStaging() {
    return this.nodeEnv === 'staging';
  },
});

export default config;
