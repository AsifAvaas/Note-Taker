const AppError = require('../utils/appError.util');

exports.notFoundHandler = (req, res, next) => {
  next(new AppError(`Resource not found at ${req.originalUrl}`, 404));
};

exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errorType = err.name || 'Error';

  // 1. Mongoose Bad ObjectId (CastError) -> 400 Bad Request
  if (err.name === 'CastError') {
    statusCode = 400;
    errorType = 'CastError';
    message = `Invalid ${err.path}: "${err.value}" is not a valid MongoDB ObjectId`;
  }

  // 2. Mongoose Duplicate Key Error (11000) -> 409 Conflict
  if (err.code === 11000) {
    statusCode = 409;
    errorType = 'DuplicateKeyError';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for '${field}'. Please use another value.`;
  }

  // 3. Mongoose Validation Error -> 400 Bad Request
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'ValidationError';
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // 4. JWT Errors -> 401 Unauthorized
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorType = err.name;
    message = 'Invalid or expired authentication token';
  }

  console.error(`[Error Middleware] [${statusCode} ${errorType}]: ${message}`);

  res.status(statusCode).json({
    success: false,
    errorType,
    message
  });
};
