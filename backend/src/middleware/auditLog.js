const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Log an audit entry. Call from service layer after successful mutation.
 * entity: table name (e.g. 'users', 'production_plan')
 * action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT'
 */
const auditLog = async ({ userId, action, entity, entityId, oldValues, newValues, req }) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId: entityId ? String(entityId) : undefined,
        oldValues: oldValues || undefined,
        newValues: newValues || undefined,
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
        userId: userId || undefined,
      },
    });
  } catch (err) {
    logger.error('Audit log failed:', err.message);
  }
};

/**
 * Express middleware that auto-logs after successful mutating requests.
 * Attach to router or individual routes. Does not block on failure.
 * Requires req.user to be set (i.e. after authenticate middleware).
 */
const auditMiddleware = (entity) => (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const method = req.method;
    const actionMap = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
    const action = actionMap[method];

    if (action && res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const entityId = req.params?.id || body?.data?.id;
      auditLog({
        userId: req.user.id,
        action,
        entity,
        entityId,
        newValues: method !== 'DELETE' ? req.body : undefined,
        req,
      }).catch(() => {});
    }

    return originalJson(body);
  };

  next();
};

module.exports = { auditLog, auditMiddleware };
