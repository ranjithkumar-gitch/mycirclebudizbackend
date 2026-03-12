import { asyncHandler } from '../../common/utils/async-handler.util.js';
import { sendSuccess } from '../../common/utils/response.util.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import accountsService from './accounts.service.js';

export const createAccount = asyncHandler(async (req, res) => {
  const result = await accountsService.createAccount(req.user.userId, req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    data: result,
    message: 'Account created successfully',
  });
});

export const listAccounts = asyncHandler(async (req, res) => {
  const result = await accountsService.listAccounts(req.user.userId);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: result,
  });
});

export const getAccount = asyncHandler(async (req, res) => {
  const result = await accountsService.getAccount(req.user.userId, req.params.id);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: result,
  });
});

export const updateAccount = asyncHandler(async (req, res) => {
  const result = await accountsService.updateAccount(req.user.userId, req.params.id, req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: result,
    message: 'Account updated successfully',
  });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await accountsService.deleteAccount(req.user.userId, req.params.id);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: null,
    message: 'Account deleted successfully',
  });
});

export const getQrCode = asyncHandler(async (req, res) => {
  const result = await accountsService.getQrCode(req.user.userId, req.params.id);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data: result,
    message: 'QR code generated successfully',
  });
});
