/**
 * Activity Log Model
 * Tracks all admin actions for audit trail
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
    index: true,
  },
  adminEmail: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT'],
  },
  resource: {
    type: String,
    required: true,
    enum: ['DESTINATION', 'BOOKING', 'USER', 'REVIEW', 'ADMIN'],
  },
  resourceId: {
    type: String,
    required: true,
  },
  resourceName: String,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS',
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Indexes for querying
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ adminId: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, action: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
