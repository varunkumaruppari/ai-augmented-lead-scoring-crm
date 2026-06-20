const logger = require('../config/logger');

/**
 * Error Categories
 * Maps error codes/types to HTTP status codes and structured category labels.
 */
const ERROR_CATEGORIES = {
  VALIDATION_ERROR:    { status: 422, category: 'VALIDATION' },
  UNAUTHORIZED:        { status: 401, category: 'AUTH' },
  TOKEN_INVALID:       { status: 401, category: 'AUTH' },
  TOKEN_EXPIRED:       { status: 401, category: 'AUTH' },
  INVALID_CREDENTIALS: { status: 401, category: 'AUTH' },
  INVALID_REFRESH_TOKEN: { status: 401, category: 'AUTH' },
  ACCOUNT_LOCKED:      { status: 429, category: 'AUTH' },
  ACCOUNT_DEACTIVATED: { status: 403, category: 'AUTH' },
  FORBIDDEN:           { status: 403, category: 'AUTHORIZATION' },
  NOT_FOUND:           { status: 404, category: 'NOT_FOUND' },
  EMAIL_EXISTS:        { status: 409, category: 'CONFLICT' },
  SERVER_ERROR:        { status: 500, category: 'SERVER' },
};

const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';

  // Resolve status and category
  const mapped = err.code ? ERROR_CATEGORIES[err.code] : null;
  const status = err.status || mapped?.status || 500;
  const category = mapped?.category || (status >= 500 ? 'SERVER' : 'CLIENT');
  const code = err.code || 'SERVER_ERROR';

  // Log with request ID for correlation
  if (status >= 500) {
    logger.error({
      requestId,
      code,
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id || null,
    });
  } else {
    logger.warn({
      requestId,
      code,
      message: err.message,
      url: req.url,
      method: req.method,
      userId: req.user?.id || null,
    });
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      category,
      message: status >= 500 && process.env.NODE_ENV === 'production'
        ? 'An internal error occurred. Please try again.'
        : err.message,
      ...(err.details ? { details: err.details } : {}),
    },
    meta: { requestId, timestamp: new Date().toISOString() },
  });
};

module.exports = errorHandler;
