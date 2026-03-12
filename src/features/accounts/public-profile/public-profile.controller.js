import { asyncHandler } from '../../../common/utils/async-handler.util.js';
import { sendSuccess } from '../../../common/utils/response.util.js';
import { HTTP_STATUS } from '../../../common/constants/http-status.js';
import publicProfileService from './public-profile.service.js';

export const getPublicProfile = asyncHandler(async (req, res) => {
  const viewerAccountId = req.user?.activeAccountId ?? null;
  const result = await publicProfileService.getPublicProfile(req.params.accountId, viewerAccountId);
  sendSuccess(res, { statusCode: HTTP_STATUS.OK, data: result });
});

export const updatePublicProfile = asyncHandler(async (req, res) => {
  const { userId, activeAccountId } = req.user;
  const result = await publicProfileService.updatePublicProfile(userId, activeAccountId, req.body, req.file);
  sendSuccess(res, { statusCode: HTTP_STATUS.OK, data: result, message: 'Profile updated successfully' });
});
