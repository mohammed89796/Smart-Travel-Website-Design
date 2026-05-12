/**
 * Activity Log Routes
 * GET endpoints for viewing admin activity logs
 */

const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/activityLog');
const { verifyAdminToken } = require('../middleware/auth');

// Get all activity logs (with pagination and filters)
router.get('/', verifyAdminToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.adminId) filters.adminId = req.query.adminId;
    if (req.query.action) filters.action = req.query.action;
    if (req.query.resource) filters.resource = req.query.resource;

    const logs = await ActivityLog.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments(filters);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message,
    });
  }
});

// Get logs by admin
router.get('/admin/:adminId', verifyAdminToken, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ adminId: req.params.adminId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin logs',
      error: error.message,
    });
  }
});

// Get activity summary (stats)
router.get('/summary/stats', verifyAdminToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalActions = await ActivityLog.countDocuments();
    const todayActions = await ActivityLog.countDocuments({ createdAt: { $gte: today } });
    
    const actionsByType = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
    ]);

    const actionsByResource = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$resource',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalActions,
        todayActions,
        actionsByType,
        actionsByResource,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity summary',
      error: error.message,
    });
  }
});

module.exports = router;
