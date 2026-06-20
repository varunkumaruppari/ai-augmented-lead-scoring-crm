const auditRepo = require('../repositories/audit.repository');

/**
 * Audit Middleware Factory
 *
 * Usage: auditLog('LEAD_CREATED', 'lead')
 *
 * This creates an Express middleware that, after the response is sent,
 * writes an audit log entry. It is designed to be used inline in routes
 * or called imperatively from controllers.
 *
 * For imperative use in controllers:
 *   await logAuditEvent(req, { action, entityType, entityId, oldData, newData })
 */

const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
};

/**
 * Factory: Returns an Express middleware that logs the action after response.
 * @param {string} action - e.g. 'LEAD_CREATED'
 * @param {string} entityType - e.g. 'lead'
 * @param {Function} [entityIdFn] - optional (req) => entityId extractor
 */
const auditLog = (action, entityType, entityIdFn = null) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Write audit log asynchronously after response
      const entityId = entityIdFn ? entityIdFn(req, body) : (req.params?.id || null);
      auditRepo.create({
        user_id: req.user?.id || null,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_data: req._auditOldData || null,
        new_data: null, // new_data is set imperatively when needed
        ip_address: getClientIp(req),
      });
      return originalJson(body);
    };
    next();
  };
};

/**
 * Imperative audit log writer — call directly from controllers.
 * @param {Object} req - Express request
 * @param {Object} opts - { action, entityType, entityId, oldData, newData }
 */
const logAuditEvent = async (req, { action, entityType, entityId, oldData, newData } = {}) => {
  await auditRepo.create({
    user_id: req.user?.id || null,
    action,
    entity_type: entityType || null,
    entity_id: entityId || null,
    old_data: oldData || null,
    new_data: newData || null,
    ip_address: getClientIp(req),
  });
};

module.exports = { auditLog, logAuditEvent };
