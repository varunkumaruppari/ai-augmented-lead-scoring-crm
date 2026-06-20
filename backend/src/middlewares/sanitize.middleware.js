const xss = require('xss');

/**
 * Recursively sanitizes a value:
 * - Strings: strips XSS/HTML injection patterns
 * - Objects/Arrays: recurses into children
 * - Primitives (number, bool, null): returned as-is
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return xss(value, {
      whiteList: {}, // No HTML tags allowed in API payloads
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
    });
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const clean = {};
    for (const key of Object.keys(value)) {
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }
  return value;
};

/**
 * XSS + Input Sanitization Middleware
 * Applied globally after body parsing. Strips HTML/script tags from:
 * - req.body (JSON payloads)
 * - req.query (URL query parameters)
 * - req.params (URL path parameters)
 */
const sanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

module.exports = sanitize;
