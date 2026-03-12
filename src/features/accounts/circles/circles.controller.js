import { asyncHandler } from '../../../common/utils/async-handler.util.js';
import { sendSuccess } from '../../../common/utils/response.util.js';
import { HTTP_STATUS } from '../../../common/constants/http-status.js';

export const createCircle = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});

export const updateCircle = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});

export const updateCircleMembers = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});

export const uploadCirclePhoto = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});

export const listCircles = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});
