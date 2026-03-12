import { verifyAccessToken } from '../utils/token.util.js';
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../constants/error-codes.js';

export function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = verifyAccessToken(authHeader.split(' ')[1]);
      if (decoded.type === 'access') {
        req.user = {
          userId: decoded.userId,
          activeAccountId: decoded.activeAccountId || null,
        };
      }
    } catch {
      // Invalid or expired token — treat as unauthenticated, do not throw
    }
  }

  next();
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid authorization header', ERROR_CODES.AUTH_UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'access') {
      throw AppError.unauthorized('Invalid token type', ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    req.user = {
      userId: decoded.userId,
      activeAccountId: decoded.activeAccountId || null,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Access token expired', ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    throw AppError.unauthorized('Invalid access token', ERROR_CODES.AUTH_INVALID_TOKEN);
  }
}
