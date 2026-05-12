/**
 * Admin Authentication Routes
 * Handles admin registration, login, and authentication
 * Super Admin can create other admin accounts
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const {
  adminAuthMiddleware,
  requireSuperAdmin,
  auditLog,
} = require('../middleware');

const router = express.Router();

/**
 * POST /api/admin/auth/login
 * Admin login endpoint
 * Returns JWT token for authenticated admin
 * Expected body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find admin with email
    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is inactive',
      });
    }

    // Verify password
    let isPasswordValid = await bcrypt.compare(password, admin.password);

    // Backward compatibility: migrate legacy plaintext passwords on successful login.
    if (!isPasswordValid && admin.password === password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await Admin.findByIdAndUpdate(admin._id, { password: hashedPassword }, { new: false });
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const adminIdentifier = admin._id || admin.id || admin.email;
    const adminDbId = admin._id || null;
    const token = jwt.sign(
      {
        adminId: adminIdentifier,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    if (adminDbId) {
      await Admin.findByIdAndUpdate(
        adminDbId,
        { lastLogin: new Date() },
        { new: true }
      );
    } else {
      await Admin.findOneAndUpdate(
        { email: admin.email.toLowerCase() },
        { lastLogin: new Date() },
        { new: true }
      );
    }

    // Log successful login
    await auditLog(
      adminDbId || adminIdentifier,
      admin.email,
      'login',
      'admin',
      adminDbId || adminIdentifier,
      { action: 'Admin login successful' },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Admin logged in successfully',
      data: {
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
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/auth/register
 * Create new admin account (Super Admin only)
 * Expected body: { name, email, password, role, department }
 */
router.post('/register', adminAuthMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'admin',
      department = 'Administration',
    } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Validate role
    const validRoles = ['super_admin', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Assign default permissions based on role
    let permissions = [];
    if (role === 'super_admin') {
      permissions = [
        'create_admin',
        'delete_admin',
        'manage_all_resources',
        'view_audit_logs',
      ];
    } else if (role === 'admin') {
      permissions = [
        'create_destinations',
        'update_destinations',
        'delete_destinations',
        'create_packages',
        'update_packages',
        'manage_bookings',
        'manage_users',
        'manage_reviews',
      ];
    } else if (role === 'moderator') {
      permissions = ['view_reviews', 'moderate_reviews', 'view_analytics'];
    }

    // Create new admin
    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      permissions,
      isActive: true,
    });

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'create',
      'admin',
      newAdmin._id,
      { adminName: name, role, email },
      'success',
      req
    );

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        admin: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          permissions: newAdmin.permissions,
          department: newAdmin.department,
        },
      },
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin registration failed',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/auth/logout
 * Admin logout (clears token on client side, optional server-side revocation)
 */
router.post('/logout', adminAuthMiddleware, async (req, res) => {
  try {
    // Log logout
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'logout',
      'admin',
      req.admin.adminId,
      { action: 'Admin logout' },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/auth/profile
 * Get current admin profile information
 */
router.get('/profile', adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.adminId, { password: 0 });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.json({
      success: true,
      message: 'Admin profile retrieved successfully',
      data: { admin },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/auth/profile
 * Update current admin's profile
 */
router.put('/profile', adminAuthMiddleware, async (req, res) => {
  try {
    const { name, department } = req.body;
    const adminId = req.admin.adminId;

    // Prevent updating sensitive fields
    const updates = {};
    if (name) updates.name = name;
    if (department) updates.department = department;

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updates, {
      new: true,
    });

    // Audit log
    await auditLog(
      adminId,
      req.admin.email,
      'update',
      'admin',
      adminId,
      { action: 'Updated profile', changes: updates },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { admin: updatedAdmin },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/auth/change-password
 * Change admin password
 */
router.put('/change-password', adminAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.admin.adminId;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Get admin with password
    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await Admin.findByIdAndUpdate(adminId, { password: hashedPassword });

    // Audit log
    await auditLog(
      adminId,
      req.admin.email,
      'update',
      'admin',
      adminId,
      { action: 'Changed password' },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/auth/forgot-password
 * Request password reset (future enhancement - integrate with email service)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Return success even if email not found (security best practice)
      return res.json({
        success: true,
        message: 'If email exists, password reset link has been sent',
      });
    }

    // TODO: Generate reset token and send email
    // For now, just return success
    await auditLog(
      admin._id,
      admin.email,
      'update',
      'admin',
      admin._id,
      { action: 'Requested password reset' },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'If email exists, password reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message,
    });
  }
});



module.exports = router;
