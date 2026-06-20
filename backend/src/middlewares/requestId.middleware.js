const { randomUUID } = require('crypto');

/**
 * Request ID Middleware
 * Attaches a unique X-Request-ID to every request for distributed tracing
 * and error correlation across logs.
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

module.exports = requestId;
