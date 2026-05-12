/**
 * Activity Log Middleware
 * Logs admin actions automatically
 */

const ActivityLog = require('../models/activityLog');

const logActivity = async (req, res, next) => {
  // Capture original send function
  const originalSend = res.send;

  res.send = function (data) {
    res.send = originalSend; // Restore original send

    // Only log for admin routes and successful operations
    if (req.path.includes('/api/admin') && res.statusCode < 400) {
      const admin = req.admin;
      if (admin) {
        // Determine action and resource
        let action = 'UPDATE';
        let resource = 'ADMIN';

        if (req.method === 'POST') action = 'CREATE';
        if (req.method === 'DELETE') action = 'DELETE';
        if (req.path.includes('/approve')) action = 'APPROVE';
        if (req.path.includes('/reject')) action = 'REJECT';

        if (req.path.includes('/destinations')) resource = 'DESTINATION';
        if (req.path.includes('/bookings')) resource = 'BOOKING';
        if (req.path.includes('/users')) resource = 'USER';
        if (req.path.includes('/reviews')) resource = 'REVIEW';

        // Log asynchronously - don't wait for completion
        ActivityLog.create({
          adminId: admin.id,
          adminEmail: admin.email,
          action,
          resource,
          resourceId: req.params.id || req.body?.id || 'N/A',
          resourceName: req.body?.name || req.body?.title || '',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'SUCCESS',
        }).catch(err => console.error('Failed to log activity:', err));
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

module.exports = logActivity;
