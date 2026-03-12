import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../constants/error-codes.js';

export function validate(source, zodSchema) {
  return (req, res, next) => {
    const result = zodSchema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      throw AppError.badRequest('Validation failed', ERROR_CODES.VALIDATION_ERROR, details);
    }

    // Express 5 defines req.query as a getter-only property (no setter).
    // Direct assignment throws TypeError in ESM strict mode, so we must
    // override it via defineProperty to write the Zod-coerced values back.
    if (source === 'query') {
      Object.defineProperty(req, 'query', { configurable: true, enumerable: true, writable: true, value: result.data });
    } else {
      req[source] = result.data;
    }
    next();
  };
}
