import { z } from 'zod';
import { Types } from 'mongoose';
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../constants/error-codes.js';

/**
 * Validates a MongoDB ObjectId: non-empty string of exactly 24 hex characters.
 * Prevents Mongoose CastError (which causes 500) by rejecting invalid IDs at the
 * validation layer with a structured 400 VALIDATION_ERROR instead.
 *
 * @param {string} [label='ID'] - Field label used in the error message.
 * @returns {import('zod').ZodString}
 */
export const objectIdSchema = (label = 'ID') =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, `${label} must be a valid ID`);

/**
 * Service-layer ObjectId guard (defense in depth).
 * Throws a structured 400 VALIDATION_ERROR before any value reaches Mongoose,
 * preventing CastError even if route-level Zod validation is bypassed.
 *
 * @param {...string} ids - One or more ID values to validate.
 */
export const assertObjectIds = (...ids) => {
  for (const id of ids) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid ID format', ERROR_CODES.VALIDATION_ERROR);
    }
  }
};
