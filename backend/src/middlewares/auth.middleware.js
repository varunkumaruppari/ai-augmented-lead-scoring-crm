const jwt = require('jsonwebtoken');

/**
 * Permission Matrix
 * Defines what each role can do. Used by requirePermission().
 */
const PERMISSIONS = {
  super_admin: ['*'], // All permissions
  admin:   [
    'leads:read', 'leads:write', 'leads:delete', 'leads:assign',
    'users:read', 'users:write',
    'analytics:read', 'reports:read', 'reports:write',
    'pipeline:read', 'pipeline:write',
    'settings:read', 'settings:write',
    'audit:read',
  ],
  manager: [
    'leads:read', 'leads:write', 'leads:assign',
    'users:read',
    'analytics:read', 'reports:read', 'reports:write',
    'pipeline:read', 'pipeline:write',
    'settings:read',
  ],
  agent: [
    'leads:read', 'leads:write',
    'analytics:read',
    'pipeline:read', 'pipeline:write',
    'reports:read',
  ],
  viewer: [
    'leads:read',
    'analytics:read',
    'pipeline:read',
    'reports:read',
  ],
};

/**
 * authenticate
 * Verifies JWT Bearer token. Attaches decoded user to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' },
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        message: isExpired ? 'Token expired. Please refresh.' : 'Invalid token',
      },
    });
  }
};

/**
 * authorize(...roles)
 * Role-based access control — checks req.user.role against allowed roles.
 */
const authorize = (...roles) => (req, res, next) => {
  const userRole = req.user?.role;
  // super_admin bypasses all role checks
  if (userRole === 'super_admin' || roles.includes(userRole)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: `Access denied. Required roles: ${roles.join(', ')}`,
    },
  });
};

/**
 * requirePermission(permission)
 * Granular permission-based access control.
 * e.g. requirePermission('leads:delete')
 */
const requirePermission = (permission) => (req, res, next) => {
  const userRole = req.user?.role;
  const userPermissions = PERMISSIONS[userRole] || [];

  if (userPermissions.includes('*') || userPermissions.includes(permission)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: `Missing required permission: ${permission}`,
    },
  });
};

module.exports = { authenticate, authorize, requirePermission, PERMISSIONS };
