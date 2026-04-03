export const sendSuccess = (res, {
  statusCode = 200,
  message = "Success",
  data = null,
  meta,
} = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
};

export const sendError = (res, {
  statusCode = 500,
  message = "Internal Server Error",
  data = null,
} = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};
