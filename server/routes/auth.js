const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Admin } = require('../models');
const { validate, registerSchema, loginSchema } = require('../validations');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smart-travel-dev-secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const ADMIN_JWT_EXPIRE = process.env.ADMIN_JWT_EXPIRE || '24h';
const BOOKING_DEBUG = process.env.BOOKING_DEBUG === 'true' || process.env.NODE_ENV !== 'production';
const ADMIN_ROLES = ['admin', 'super_admin', 'moderator'];

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

const createLegacyUsername = (name, email) => {
  const normalizedName = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  const emailPrefix = String(email || '').split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
  const base = normalizedName || emailPrefix || 'user';
  return `${base}${Date.now().toString().slice(-6)}`;
};

const getRolePermissions = (role) => {
  if (role === 'super_admin') {
    return [
      'create_admin',
      'delete_admin',
      'manage_all_resources',
      'view_audit_logs',
    ];
  }

  if (role === 'moderator') {
    return ['view_reviews', 'moderate_reviews', 'view_analytics'];
  }

  return [
    'create_destinations',
    'update_destinations',
    'delete_destinations',
    'create_packages',
    'update_packages',
    'manage_bookings',
    'manage_users',
    'manage_reviews',
  ];
};

const resolveCanonicalUserId = async (userDoc) => {
  const directId = userDoc?._id ? String(userDoc._id) : '';
  if (directId && mongoose.Types.ObjectId.isValid(directId)) {
    return directId;
  }

  const email = String(userDoc?.email || '').trim().toLowerCase();
  if (!email) return null;

  const freshUser = await User.findOne({ email }).select('_id');
  if (freshUser?._id) {
    return String(freshUser._id);
  }

  return null;
};

// Register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists by email
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      username: createLegacyUsername(name, email),
      email,
      password: hashedPassword
    });

    // Generate token
    const userId = await resolveCanonicalUserId(user);
    if (!userId) {
      return res.status(500).json({
        success: false,
        message: 'User account record is invalid. Please sign up again.',
      });
    }

    // If the user record itself was elevated to an admin role, issue admin JWT claims.
    const normalizedRole = String(user.role || 'user').toLowerCase();
    if (ADMIN_ROLES.includes(normalizedRole)) {
      const permissions = getRolePermissions(normalizedRole);
      const adminToken = jwt.sign(
        {
          adminId: userId,
          email: user.email,
          name: user.name || user.username,
          role: normalizedRole,
          permissions,
        },
        JWT_SECRET,
        { expiresIn: ADMIN_JWT_EXPIRE }
      );

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          accountType: 'admin',
          admin: {
            id: userId,
            name: user.name || user.username,
            email: user.email,
            role: normalizedRole,
            permissions,
          },
          token: adminToken,
        },
      });
    }

    const token = jwt.sign(
      {
        id: userId,
        userId,
        sub: userId,
        email: user.email,
        name: user.name || user.username,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name || user.username,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Unified login: if the email belongs to an admin account, authenticate as admin.
    const admin = await Admin.findByEmail(normalizedEmail);
    if (admin) {
      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Admin account is inactive',
        });
      }

      let isAdminPasswordValid = await bcrypt.compare(password, admin.password);

      // Backward compatibility for legacy plaintext admin passwords.
      if (!isAdminPasswordValid && admin.password === password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await Admin.findByIdAndUpdate(admin._id, { password: hashedPassword }, { new: false });
        isAdminPasswordValid = true;
      }

      if (!isAdminPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const adminIdentifier = admin._id || admin.id || admin.email;
      const token = jwt.sign(
        {
          adminId: adminIdentifier,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: admin.permissions,
        },
        JWT_SECRET,
        { expiresIn: ADMIN_JWT_EXPIRE }
      );

      if (admin._id) {
        await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() }, { new: false });
      }

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          accountType: 'admin',
          admin: {
            id: adminIdentifier,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
          },
          token,
        },
      });
    }

    // Check if user exists
    const user = await User.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const userId = await resolveCanonicalUserId(user);
    if (!userId) {
      return res.status(500).json({
        success: false,
        message: 'User account record is invalid. Please sign up again.',
      });
    }
    const token = jwt.sign(
      {
        id: userId,
        userId,
        sub: userId,
        email: user.email,
        name: user.name || user.username,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accountType: 'user',
        user: {
          id: user.id,
          name: user.name || user.username,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    debugLog('auth/me:entry', {
      hasAuthorizationHeader: Boolean(req.headers.authorization),
      hasToken: Boolean(token),
    });

    if (!token) {
      debugLog('auth/me:no-token');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    debugLog('auth/me:decoded', {
      id: decoded?.id,
      userId: decoded?.userId,
      _id: decoded?._id,
      sub: decoded?.sub,
      email: decoded?.email,
      role: decoded?.role,
      adminId: decoded?.adminId,
    });

    // Reject admin JWTs from user auth endpoint.
    if (decoded.adminId || ['admin', 'super_admin', 'moderator'].includes(decoded.role)) {
      debugLog('auth/me:rejected-admin-token', {
        role: decoded.role,
        adminId: decoded.adminId,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid user token'
      });
    }

    let user = null;

    const tokenUserId = sanitizeTokenId(decoded.id || decoded.userId || decoded._id || decoded.sub);

    if (tokenUserId && mongoose.Types.ObjectId.isValid(tokenUserId)) {
      user = await User.findById(tokenUserId).select('_id name username email');
      debugLog('auth/me:lookup-by-id', {
        tokenUserId,
        found: Boolean(user?._id),
      });
    }

    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase() }).select('_id name username email');
      debugLog('auth/me:lookup-by-email', {
        email: decoded.email,
        found: Boolean(user?._id),
      });
    }

    if (!user) {
      debugLog('auth/me:user-not-found', {
        tokenUserId,
        email: decoded?.email,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid user token'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name || user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    debugLog('auth/me:exception', {
      name: error?.name,
      message: error?.message,
    });
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;
