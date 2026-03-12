import { asyncHandler } from '../../common/utils/async-handler.util.js';
import { sendSuccess } from '../../common/utils/response.util.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import usersService from './users.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const result = await usersService.getMe(req.user.userId);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: result,
  });
});

export const getProfileByMCBCode = asyncHandler(async (req, res) => {
  const { mcbCode, accountType } = req.body;
  const result = await usersService.getUserByQrCode(mcbCode, accountType);

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: result,
    message: 'Profile details fetched successfully',
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const result = await usersService.updateProfile(req.user.userId, req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: result,
    message: 'Profile updated successfully',
  });
});
