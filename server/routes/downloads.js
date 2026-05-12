/**
 * Download Routes
 * Handle PDF and document downloads
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { generateItineraryPDF } = require('../services/pdfService');
const SavedPlan = require('../models/schemas').SavedPlan;

// Download itinerary PDF
router.get('/itinerary/:planId', verifyToken, async (req, res) => {
  try {
    const plan = await SavedPlan.findById(req.params.planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    // Check ownership
    if (plan.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="itinerary-${plan.name.replace(/\s+/g, '-')}.pdf"`);

    // Generate PDF
    generateItineraryPDF(plan, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
});

// Download booking confirmation
router.get('/booking-confirmation/:planId', verifyToken, async (req, res) => {
  try {
    const plan = await SavedPlan.findById(req.params.planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (plan.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // For now, return itinerary as confirmation
    // Can be extended to create a separate confirmation template
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="booking-confirmation-${plan.bookingReference || plan._id.slice(-8)}.pdf"`);

    generateItineraryPDF(plan, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate confirmation',
      error: error.message,
    });
  }
});

module.exports = router;
