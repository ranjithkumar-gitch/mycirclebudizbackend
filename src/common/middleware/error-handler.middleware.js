import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../constants/error-codes.js';
import logger from '../../config/logger.js';

function mapMongoError(err) {
  if (err.code === 11000) {
    const keyPattern = err.keyPattern || {};

    if (keyPattern.phone || keyPattern.email) {
      return new AppError(
        'User with this phone or email already exists',
        409,
        ERROR_CODES.USER_ALREADY_EXISTS
      );
    }

    if (keyPattern.displayName || (keyPattern.userId && keyPattern.displayName)) {
      return new AppError(
        'Account with this name already exists',
        409,
        ERROR_CODES.ACCOUNT_DUPLICATE_NAME
      );
    }

    return new AppError('Duplicate entry', 409, 'DUPLICATE_ENTRY');
  }

  return null;
}

export function errorHandler(err, req, res, _next) {
  // Map Mongo duplicate key errors
  const mongoError = mapMongoError(err);
  if (mongoError) {
    err = mongoError;
  }

  if (err instanceof AppError) {
    logger.warn('Operational error', {
      requestId: req.requestId,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
    });

    const response = {
      success: false,
      data: null,
      message: err.message,
      errorCode: err.code,
      requestId: req.requestId,
    };

    if (err.details) {
      response.details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  // Zod validation errors (if thrown directly, not via middleware)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Validation failed',
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      requestId: req.requestId,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid or expired token',
      errorCode: ERROR_CODES.AUTH_INVALID_TOKEN,
      requestId: req.requestId,
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'File too large',
      errorCode: 'FILE_TOO_LARGE',
      requestId: req.requestId,
    });
  }

  // Unexpected errors
  logger.error('Unexpected error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    success: false,
    data: null,
    message: 'Internal server error',
    errorCode: ERROR_CODES.INTERNAL_ERROR,
    requestId: req.requestId,
  });
}
