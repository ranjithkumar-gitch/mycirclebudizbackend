import { HTTP_STATUS } from '../constants/http-status.js';

export class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'AUTH_UNAUTHORIZED') {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new AppError(message, HTTP_STATUS.FORBIDDEN, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new AppError(message, HTTP_STATUS.NOT_FOUND, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(message, HTTP_STATUS.CONFLICT, code);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMIT') {
    return new AppError(message, HTTP_STATUS.TOO_MANY_REQUESTS, code);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, code);
  }

  static notImplemented(message = 'Not implemented yet', code = 'NOT_IMPLEMENTED') {
    return new AppError(message, HTTP_STATUS.NOT_IMPLEMENTED, code);
  }
}
