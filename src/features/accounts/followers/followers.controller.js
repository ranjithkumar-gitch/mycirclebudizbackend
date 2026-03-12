import { asyncHandler } from '../../../common/utils/async-handler.util.js';
import { sendSuccess } from '../../../common/utils/response.util.js';
import { HTTP_STATUS } from '../../../common/constants/http-status.js';
import followersService from './followers.service.js';

export const follow = asyncHandler(async (req, res) => {
  const { userId, activeAccountId } = req.user;
  const { targetAccountId } = req.body;

  const data = await followersService.follow(userId, activeAccountId, targetAccountId);

  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    data,
    message: data.status === 'accepted' ? 'Followed successfully' : 'Follow request sent',
  });
});

export const handleFollowRequest = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { requestId } = req.params;
  const { action } = req.body;

  const data = await followersService.handleFollowRequest(userId, requestId, action);

  sendSuccess(res, {
    data,
    message: action === 'accept' ? 'Follow request accepted' : 'Follow request rejected',
  });
});

export const listFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { accountId, page, limit } = req.query;

  const data = await followersService.listFollowers(userId, accountId, page, limit);

  sendSuccess(res, { data });
});

export const listFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { accountId, page, limit } = req.query;

  const data = await followersService.listFollowing(userId, accountId, page, limit);

  sendSuccess(res, { data });
});

export const listFollowRequests = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { accountId, page, limit } = req.query;

  const data = await followersService.listFollowRequests(userId, accountId, page, limit);

  sendSuccess(res, { data });
});

export const cancelFollowRequest = asyncHandler(async (req, res) => {
  const { userId, activeAccountId } = req.user;
  const { targetAccountId } = req.body;

  await followersService.cancelFollowRequest(userId, activeAccountId, targetAccountId);

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Follow request cancelled',
  });
});
