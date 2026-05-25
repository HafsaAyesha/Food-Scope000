/**
 * Authorization middleware for role-based and resource-based access control
 * Centralizes authorization checks to avoid inline auth checks in controllers
 */

const { createApiError } = require('../utils/api-error');

/**
 * Require specific role(s)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(createApiError(401, 'AUTH_UNAUTHORIZED', 'AUTH_ERROR', 'Unauthorized.').payload);
  }

  // Account state checks
  if (req.user.isDeleted) return res.status(403).json(createApiError(403, 'AUTH_ACCOUNT_DELETED', 'AUTH_ERROR', 'Account deleted.').payload);
  if (req.user.isSuspended) return res.status(403).json(createApiError(403, 'AUTH_ACCOUNT_SUSPENDED', 'AUTH_ERROR', 'Account suspended.').payload);

  if (!roles.includes(req.user.role)) {
    return res.status(403).json(createApiError(403, 'AUTH_FORBIDDEN', 'AUTH_ERROR', 'Forbidden for this role.').payload);
  }

  return next();
};

/**
 * Require authentication (basic user check)
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(createApiError(401, 'AUTH_UNAUTHORIZED', 'AUTH_ERROR', 'Unauthorized.').payload);
  }

  // Account state checks
  if (req.user.isDeleted) return res.status(403).json(createApiError(403, 'AUTH_ACCOUNT_DELETED', 'AUTH_ERROR', 'Account deleted.').payload);
  if (req.user.isSuspended) return res.status(403).json(createApiError(403, 'AUTH_ACCOUNT_SUSPENDED', 'AUTH_ERROR', 'Account suspended.').payload);

  return next();
};

/**
 * Require reviewer or admin role (for creating content)
 */
const requireReviewerOrAdmin = (req, res, next) => {
  return requireRole('reviewer', 'admin')(req, res, next);
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  return requireRole('admin')(req, res, next);
};

/**
 * Require resource ownership
 * Attaches the resource to req if user owns it
 */
const requireOwnership = (resourceField = 'user_id') => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(createApiError(401, 'AUTH_UNAUTHORIZED', 'AUTH_ERROR', 'Unauthorized.').payload);
  }

  if (!req[resourceField]) {
    return res.status(400).json(createApiError(400, 'AUTH_RESOURCE_NOT_FOUND', 'VALIDATION_ERROR', 'Resource not found.').payload);
  }

  const ownerId = req[resourceField][resourceField] || req[resourceField].user_id || req[resourceField];
  const isOwner = String(ownerId) === String(req.user.id) || req.user.role === 'admin';

  if (!isOwner) {
    return res.status(403).json(createApiError(403, 'AUTH_FORBIDDEN', 'AUTH_ERROR', 'Forbidden: not resource owner.').payload);
  }

  return next();
};

/**
 * Optional authentication (user enrichment without requiring it)
 */
const optionalAuth = (req, res, next) => {
  // If user is present, still check account state
  if (req.user) {
    if (req.user.isDeleted || req.user.isSuspended) {
      req.user = null; // Clear user if account is invalid
    }
  }
  return next();
};

/**
 * Prevent suspended users from modifying content
 */
const preventSuspendedAction = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(createApiError(401, 'AUTH_UNAUTHORIZED', 'AUTH_ERROR', 'Unauthorized.').payload);
  }

  if (req.user.isSuspended) {
    return res.status(403).json(createApiError(403, 'AUTH_ACCOUNT_SUSPENDED', 'AUTH_ERROR', 'Account suspended: cannot perform this action.').payload);
  }

  return next();
};

module.exports = {
  requireRole,
  requireAuth,
  requireReviewerOrAdmin,
  requireAdmin,
  requireOwnership,
  optionalAuth,
  preventSuspendedAction
};
