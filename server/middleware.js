const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { AuditLog, Admin, User } = require('./models');
const JWT_SECRET = process.env.JWT_SECRET || 'smart-travel-dev-secret';
const BOOKING_DEBUG = process.env.BOOKING_DEBUG === 'true' || process.env.NODE_ENV !== 'production';

const debugLog = (label, payload = {}) => {
  if (!BOOKING_DEBUG) return;
  console.log(`[BOOKING_DEBUG] ${label}`, payload);
};

const sanitizeTokenId = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const lowered = normalized.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return null;
  return normalized;
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    debugLog('authMiddleware:entry', {
      path: req.path,
      method: req.method,
      hasAuthorizationHeader: Boolean(req.headers.authorization),
      hasToken: Boolean(token),
    });

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    debugLog('authMiddleware:decoded', {
      id: decoded?.id,
      userId: decoded?.userId,
      _id: decoded?._id,
      sub: decoded?.sub,
      email: decoded?.email,
      role: decoded?.role,
      adminId: decoded?.adminId,
    });

    // Prevent admin JWTs from being used against user-protected endpoints.
    if (decoded.adminId || ['admin', 'super_admin', 'moderator'].includes(decoded.role)) {
      debugLog('authMiddleware:rejected-admin-token', {
        role: decoded.role,
        adminId: decoded.adminId,
      });
      return res.status(403).json({
        success: false,
        message: 'Please sign in with a user account',
      });
    }

    let userId = sanitizeTokenId(decoded.id || decoded.userId || decoded._id || decoded.sub);
    let userRecord = null;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userRecord = await User.findById(userId).select('_id name username email');
      debugLog('authMiddleware:user-lookup-by-id', {
        userId,
        found: Boolean(userRecord?._id),
      });
    }

    if (!userRecord && decoded.email) {
      userRecord = await User.findOne({ email: decoded.email.toLowerCase() }).select('_id name username email');
      debugLog('authMiddleware:user-lookup-by-email', {
        email: decoded.email,
        found: Boolean(userRecord?._id),
      });
    }

    if (!userRecord?._id) {
      debugLog('authMiddleware:invalid-user-token', {
        sanitizedUserId: userId,
        email: decoded?.email,
      });
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid user token',
      });
    }

    req.user = {
      ...decoded,
      id: String(userRecord._id),
      userId: String(userRecord._id),
      email: userRecord.email,
      name: userRecord.name || userRecord.username || decoded.name || '',
    };
    debugLog('authMiddleware:success', {
      resolvedUserId: req.user.id,
      email: req.user.email,
    });
    next();
  } catch (error) {
    debugLog('authMiddleware:exception', {
      message: error?.message,
      name: error?.name,
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Admin Auth Middleware
 * Verifies JWT token specifically for admin users
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    let adminId = decoded.adminId || decoded.id || decoded.email;
    let role = decoded.role;
    let permissions = decoded.permissions;

    // Legacy support: some existing admin tokens contain email but no adminId.
    if (!adminId && decoded.email) {
      const adminRecord = await Admin.findOne({ email: decoded.email.toLowerCase() }).select('_id role permissions');
      if (adminRecord) {
        adminId = adminRecord._id;
        role = role || adminRecord.role;
        permissions = permissions || adminRecord.permissions;
      }
    }

    // Accept current admin tokens and legacy token shapes.
    if (!adminId) {
      return res.status(403).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    req.admin = {
      ...decoded,
      adminId,
      role: role || 'admin',
      permissions: Array.isArray(permissions) ? permissions : []
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Validates admin role and permissions
 * @param {...string} allowedRoles - Roles permitted to access this endpoint
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    const role = typeof req.admin.role === 'string' ? req.admin.role.toLowerCase() : '';

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Permission-Based Access Control Middleware
 * @param {string} requiredPermission - Permission required to access
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    const { permissions } = req.admin;

    if (!permissions || !permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required: ${requiredPermission}`
      });
    }

    next();
  };
};

/**
 * Audit Logging Middleware
 * Logs all admin actions to audit trail
 * Should be applied after successful operation
 */
const auditLog = async (adminId, adminEmail, action, resourceType, resourceId, changes = null, status = 'success', req) => {
  try {
    if (!AuditLog || typeof AuditLog.create !== 'function') {
      return;
    }

    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('user-agent') || '';

    await AuditLog.create({
      adminId,
      adminEmail,
      action,
      resourceType,
      resourceId,
      changes,
      status,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit logging should not block operations
  }
};

/**
 * Super Admin Verification Middleware
 * Ensures only Super Admin role can access
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }

  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super Admin access required'
    });
  }

  next();
};

/**
 * Admin Activity Tracking Middleware
 * Updates last login timestamp for admin users
 */
const trackAdminActivity = async (req, res, next) => {
  if (req.admin) {
    try {
      const identifier = req.admin.adminId;
      const update = { lastLogin: new Date() };

      if (typeof identifier === 'string' && identifier.includes('@')) {
        await Admin.findOneAndUpdate({ email: identifier.toLowerCase() }, update, { new: true });
      } else {
        await Admin.findByIdAndUpdate(identifier, update, { new: true });
      }
    } catch (error) {
      console.error('Activity tracking error:', error);
      // Non-blocking error
    }
  }
  next();
};

module.exports = {
  authMiddleware,
  adminAuthMiddleware,
  requireRole,
  requirePermission,
  requireSuperAdmin,
  auditLog,
  trackAdminActivity,
};
