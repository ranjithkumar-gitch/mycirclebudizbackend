import { asyncHandler } from '../../../common/utils/async-handler.util.js';
import { sendSuccess } from '../../../common/utils/response.util.js';
import { HTTP_STATUS } from '../../../common/constants/http-status.js';

export const createEvent = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});

export const updateEvent = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});

export const uploadEventPhoto = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});
