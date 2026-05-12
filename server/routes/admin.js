/**
 * Admin Routes
 * Defines all admin dashboard endpoints with role-based access control
 * All routes require admin authentication and appropriate role/permissions
 */

const express = require('express');
const router = express.Router();
const {
  adminAuthMiddleware,
  requireRole,
  trackAdminActivity,
} = require('../middleware');
const adminController = require('../controllers/adminController');

// ============================================================================
// MIDDLEWARE APPLICATION
// ============================================================================
// All admin routes require admin authentication and activity tracking
router.use(adminAuthMiddleware);
router.use(trackAdminActivity);

// ============================================================================
// DESTINATION MANAGEMENT ROUTES (AD-FR-04 to AD-FR-08)
// ============================================================================

/**
 * POST /api/admin/destinations
 * Create a new destination
 * Required role: admin, super_admin
 */
router.post(
  '/destinations',
  requireRole('admin', 'super_admin'),
  adminController.createDestination
);

/**
 * GET /api/admin/destinations
 * Get all destinations with pagination and filters
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/destinations',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getDestinations
);

/**
 * GET /api/admin/destinations/:id
 * Get single destination by ID
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/destinations/:id',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getDestinationById
);

/**
 * PUT /api/admin/destinations/:id
 * Update destination
 * Required role: admin, super_admin
 */
router.put(
  '/destinations/:id',
  requireRole('admin', 'super_admin'),
  adminController.updateDestination
);

/**
 * DELETE /api/admin/destinations/:id
 * Delete destination (soft delete)
 * Required role: admin, super_admin
 */
router.delete(
  '/destinations/:id',
  requireRole('admin', 'super_admin'),
  adminController.deleteDestination
);

// ============================================================================
// TRAVEL PACKAGE MANAGEMENT ROUTES (AD-FR-09 to AD-FR-13)
// ============================================================================

/**
 * POST /api/admin/travel-packages
 * Create a new travel package
 * Required role: admin, super_admin
 */
router.post(
  '/travel-packages',
  requireRole('admin', 'super_admin'),
  adminController.createTravelPackage
);

/**
 * GET /api/admin/travel-packages
 * Get all travel packages with pagination and filters
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/travel-packages',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getTravelPackages
);

/**
 * GET /api/admin/travel-packages/:id
 * Get single travel package by ID
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/travel-packages/:id',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getTravelPackageById
);

/**
 * PUT /api/admin/travel-packages/:id
 * Update travel package
 * Required role: admin, super_admin
 */
router.put(
  '/travel-packages/:id',
  requireRole('admin', 'super_admin'),
  adminController.updateTravelPackage
);

/**
 * DELETE /api/admin/travel-packages/:id
 * Delete travel package
 * Required role: admin, super_admin
 */
router.delete(
  '/travel-packages/:id',
  requireRole('admin', 'super_admin'),
  adminController.deleteTravelPackage
);

// ============================================================================
// BOOKING MANAGEMENT ROUTES (AD-FR-14 to AD-FR-17)
// ============================================================================

/**
 * GET /api/admin/bookings
 * Get all bookings with pagination and filters
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/bookings',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getBookings
);

/**
 * GET /api/admin/bookings/:id
 * Get single booking by ID
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/bookings/:id',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getBookingById
);

/**
 * PUT /api/admin/bookings/:id/status
 * Update booking status
 * Supports: pending, confirmed, cancelled, completed
 * Required role: admin, super_admin
 */
router.put(
  '/bookings/:id/status',
  requireRole('admin', 'super_admin'),
  adminController.updateBookingStatus
);

// ============================================================================
// USER MANAGEMENT ROUTES (AD-FR-18 to AD-FR-21)
// ============================================================================

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering
 * Required role: admin, super_admin
 */
router.get(
  '/users',
  requireRole('admin', 'super_admin'),
  adminController.getUsers
);

/**
 * GET /api/admin/users/:id
 * Get single user with detailed activity
 * Required role: admin, super_admin
 */
router.get(
  '/users/:id',
  requireRole('admin', 'super_admin'),
  adminController.getUserById
);

/**
 * DELETE /api/admin/users/:id
 * Delete user account and related records
 * Required role: admin, super_admin
 */
router.delete(
  '/users/:id',
  requireRole('admin', 'super_admin'),
  adminController.deleteUser
);

// ============================================================================
// REVIEW MANAGEMENT ROUTES (AD-FR-22 to AD-FR-25)
// ============================================================================

/**
 * GET /api/admin/reviews
 * Get all reviews with pagination and filters
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/reviews',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getReviews
);

/**
 * GET /api/admin/reviews/:id
 * Get single review by ID
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/reviews/:id',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getReviewById
);

/**
 * PUT /api/admin/reviews/:id
 * Update review status and add admin response
 * Status options: pending, approved, rejected
 * Required role: moderator, admin, super_admin
 */
router.put(
  '/reviews/:id',
  requireRole('moderator', 'admin', 'super_admin'),
  adminController.updateReview
);

/**
 * DELETE /api/admin/reviews/:id
 * Delete review
 * Required role: admin, super_admin
 */
router.delete(
  '/reviews/:id',
  requireRole('admin', 'super_admin'),
  adminController.deleteReview
);

// ============================================================================
// DASHBOARD & ANALYTICS ROUTES (AD-FR-26 to AD-FR-29)
// ============================================================================

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics (real-time summary)
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/dashboard/stats',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getDashboardStats
);

/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics
 * Query params: period (daily, monthly, yearly)
 * Required role: admin, super_admin
 */
router.get(
  '/analytics/revenue',
  requireRole('admin', 'super_admin'),
  adminController.getRevenueAnalytics
);

/**
 * GET /api/admin/analytics/bookings
 * Get booking analytics
 * Required role: admin, moderator, super_admin
 */
router.get(
  '/analytics/bookings',
  requireRole('admin', 'moderator', 'super_admin'),
  adminController.getBookingAnalytics
);

/**
 * GET /api/admin/analytics/users
 * Get user analytics
 * Required role: admin, super_admin
 */
router.get(
  '/analytics/users',
  requireRole('admin', 'super_admin'),
  adminController.getUserAnalytics
);

// ============================================================================
// AUDIT LOG ROUTES
// ============================================================================

/**
 * GET /api/admin/audit-logs
 * Get audit logs with pagination and filters
 * Query params: adminId, action, resourceType, dateFrom, dateTo
 * Required role: admin, super_admin
 */
router.get(
  '/audit-logs',
  requireRole('admin', 'super_admin'),
  adminController.getAuditLogs
);

// ============================================================================
// HEALTH CHECK & VERIFY ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/health
 * Verify admin portal is accessible
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin portal is operational',
    role: req.admin.role,
  });
});

/**
 * GET /api/admin/verify
 * Verify admin token and get admin info
 */
router.get('/verify', (req, res) => {
  res.json({
    success: true,
    message: 'Admin token is valid',
    data: {
      admin: {
        adminId: req.admin.adminId,
        email: req.admin.email,
        role: req.admin.role,
      },
    },
  });
});

module.exports = router;
