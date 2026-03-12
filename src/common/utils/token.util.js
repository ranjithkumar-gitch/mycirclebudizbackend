import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import config from '../../config/index.js';

export function signAccessToken({ userId, activeAccountId = null }) {
  return jwt.sign(
    { userId, activeAccountId, type: 'access' },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn }
  );
}

export function signRefreshToken({ userId, deviceId, family }) {
  return jwt.sign(
    { userId, deviceId, family, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

export function signSignupToken({ phone }) {
  return jwt.sign(
    { phone, verified: true, type: 'signup' },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.signupExpiresIn }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

export function verifySignupToken(token) {
  const decoded = jwt.verify(token, config.jwt.accessSecret);
  if (decoded.type !== 'signup' || !decoded.verified) {
    throw new Error('Invalid signup token');
  }
  return decoded;
}

export function generateTokenFamily() {
  return crypto.randomUUID();
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
