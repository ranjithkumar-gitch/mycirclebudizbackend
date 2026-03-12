import { asyncHandler } from '../../../common/utils/async-handler.util.js';
import { sendSuccess } from '../../../common/utils/response.util.js';
import { HTTP_STATUS } from '../../../common/constants/http-status.js';

export const createPost = asyncHandler(async (req, res) => {
  sendSuccess(res, { statusCode: HTTP_STATUS.NOT_IMPLEMENTED, message: 'Not implemented yet' });
});
