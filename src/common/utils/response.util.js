export function sendSuccess(res, { statusCode = 200, data = null, message = null }) {
  return res.status(statusCode).json({
    success: true,
    statusResult: 'success',
    statusCode,
    data,
    message,
    errorCode: null,
    requestId: res.req.requestId,
  });
}

export function sendError(res, { statusCode = 500, message = 'Internal server error', errorCode = 'INTERNAL_ERROR' }) {
  return res.status(statusCode).json({
    success: false,
    statusResult: 'error',
    statusCode,
    data: null,
    message,
    errorCode,
    requestId: res.req.requestId,
  });
}
