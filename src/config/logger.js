import winston from 'winston';
import config from './index.js';

const SENSITIVE_FIELDS = ['otp', 'refreshToken', 'authorization', 'password', 'token'];

function maskSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const masked = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(masked)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitive(masked[key]);
    }
  }
  return masked;
}

const maskFormat = winston.format((info) => {
  if (info.meta) {
    info.meta = maskSensitive(info.meta);
  }
  return info;
});

const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(
    maskFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.isDev
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
            const rid = requestId ? `[${requestId}]` : '';
            const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level} ${rid} ${message}${metaStr}`;
          })
        )
      : winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
