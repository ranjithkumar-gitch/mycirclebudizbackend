import { asyncHandler } from '../../../../common/utils/async-handler.util.js';
import { sendSuccess } from '../../../../common/utils/response.util.js';
import { HTTP_STATUS } from '../../../../common/constants/http-status.js';

export const sendMessage = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});

export const sendMediaMessage = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});

export const addReaction = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});
