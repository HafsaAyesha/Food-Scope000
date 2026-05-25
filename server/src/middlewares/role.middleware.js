const { createApiError } = require('../utils/api-error');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(createApiError(401, 'AUTH_UNAUTHORIZED', 'AUTH_ERROR', 'Unauthorized.').payload);
  }

  // account state checks
  if (req.user.isDeleted) return res.status(403).json(createApiError(403, 'AUTH_ACCOUNT_DELETED', 'AUTH_ERROR', 'Account deleted.').payload);
  if (req.user.isSuspended) return res.status(403).json(createApiError(403, 'AUTH_ACCOUNT_SUSPENDED', 'AUTH_ERROR', 'Account suspended.').payload);

  if (!roles.includes(req.user.role)) {
    return res.status(403).json(createApiError(403, 'AUTH_FORBIDDEN', 'AUTH_ERROR', 'Forbidden for this role.').payload);
  }

  return next();
};

module.exports = {
  requireRole
};
