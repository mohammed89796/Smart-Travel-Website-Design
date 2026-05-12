const express = require('express');
const mongoose = require('mongoose');
const { Itinerary, SavedPlan, User } = require('../models');
const { authMiddleware } = require('../middleware');
const { validate, savePlanSchema, updatePlanSchema } = require('../validations');

const router = express.Router();
const BOOKING_DEBUG = process.env.BOOKING_DEBUG === 'true' || process.env.NODE_ENV !== 'production';

const debugLog = (label, payload = {}) => {
  if (!BOOKING_DEBUG) return;
  console.log(`[BOOKING_DEBUG] ${label}`, payload);
};

const isInvalidTokenId = (value) => {
  if (value === null || value === undefined) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '' || normalized === 'null' || normalized === 'undefined';
};

const resolveAuthenticatedUserId = async (authUser = {}) => {
  const directId = authUser.id || authUser.userId || authUser._id || authUser.sub;
  debugLog('saved-plans:resolve-user-id:start', {
    directId,
    email: authUser.email,
  });
  if (!isInvalidTokenId(directId) && mongoose.Types.ObjectId.isValid(String(directId))) {
    debugLog('saved-plans:resolve-user-id:by-id', { resolved: String(directId) });
    return String(directId);
  }

  if (authUser.email) {
    const user = await User.findOne({ email: authUser.email.toLowerCase() }).select('_id');
    if (user?._id) {
      debugLog('saved-plans:resolve-user-id:by-email', {
        email: authUser.email,
        resolved: String(user._id),
      });
      return String(user._id);
    }
  }

  debugLog('saved-plans:resolve-user-id:failed');
  return null;
};

const ensureUserToken = (req, res) => {
  if (req.user?.adminId || ['admin', 'super_admin', 'moderator'].includes(req.user?.role)) {
    res.status(403).json({
      success: false,
      message: 'Please sign in with a user account to manage trips',
    });
    return false;
  }

  return true;
};

const normalizeItineraryItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const destinationId = item?.destination_id || item?.destinationId || item?.id || item?._id;
      const dayNumber = item?.day_number || item?.day || item?.dayNumber;

      if (!dayNumber) {
        return null;
      }

      return {
        destination_id: destinationId ? String(destinationId) : '',
        day_number: Number(dayNumber),
        activity: item?.activity || item?.title || '',
        notes: item?.notes || '',
      };
    })
    .filter(Boolean);
};

const toSavedPlanResponse = (plan) => {
  const startDate = plan.start_date || plan.createdAt || plan.created_at || new Date();
  const endDate = plan.end_date || startDate;
  const durationDays = Math.max(
    1,
    Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    id: String(plan._id),
    name: plan.title || 'Untitled',
    destination: plan.start_city || '',
    duration: durationDays,
    budget: plan.total_cost || 0,
    status: plan.status || 'draft',
    image:
      plan.image ||
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
    description: plan.description || '',
    itinerary: plan.itinerary_items || [],
    departureDate: plan.start_date,
    travelers: plan.travelers || 2,
    notes: plan.notes || '',
    bookingReference: plan.bookingReference || '',
    createdAt: plan.createdAt || plan.created_at,
    updatedAt: plan.updatedAt || plan.updated_at,
  };
};

// Protect all routes with authentication
router.use(authMiddleware);

// Get all user's saved plans
router.get('/', async (req, res) => {
  try {
    if (!ensureUserToken(req, res)) return;

    const userId = await resolveAuthenticatedUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid user token',
      });
    }
    // Convert string userId to ObjectId if needed for new schema
    const plans = await SavedPlan.find({ user_id: userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Saved plans retrieved',
      data: {
        plans: plans.map(toSavedPlanResponse)
      }
    });
  } catch (error) {
    console.error('Error fetching saved plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved plans',
      error: error.message
    });
  }
});

// Get single saved plan
router.get('/:id', async (req, res) => {
  try {
    if (!ensureUserToken(req, res)) return;

    const userId = await resolveAuthenticatedUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid user token',
      });
    }

    const plan = await SavedPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan belongs to user
    const planUserId = plan.user_id?.toString() || plan.userId;
    if (planUserId !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this plan'
      });
    }

    res.json({
      success: true,
      message: 'Plan retrieved',
      data: {
        plan: toSavedPlanResponse(plan)
      }
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plan',
      error: error.message
    });
  }
});

// Create new saved plan
router.post('/', validate(savePlanSchema), async (req, res) => {
  try {
    if (!ensureUserToken(req, res)) return;

    const userId = await resolveAuthenticatedUserId(req.user);
    debugLog('saved-plans:create:resolved-user', {
      userId,
      email: req.user?.email,
      hasBody: Boolean(req.body),
    });

    if (!userId) {
      debugLog('saved-plans:create:invalid-user-token', {
        reqUser: {
          id: req.user?.id,
          userId: req.user?.userId,
          email: req.user?.email,
          sub: req.user?.sub,
        },
      });
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid user token',
      });
    }

    const normalizedItinerary = normalizeItineraryItems(req.body.itinerary);
    debugLog('saved-plans:create:payload', {
      name: req.body.name,
      destination: req.body.destination,
      duration: req.body.duration,
      budget: req.body.budget,
      status: req.body.status,
      departureDate: req.body.departureDate,
      travelers: req.body.travelers,
      itineraryInputCount: Array.isArray(req.body.itinerary) ? req.body.itinerary.length : 0,
      itineraryNormalizedCount: normalizedItinerary.length,
    });

    const plan = await SavedPlan.create({
      user_id: userId,
      title: req.body.name || 'Untitled Trip',
      start_date: req.body.departureDate || new Date(),
      end_date: new Date(new Date(req.body.departureDate || new Date()).getTime() + (req.body.duration || 1) * 24 * 60 * 60 * 1000),
      total_cost: req.body.budget || 0,
      status: req.body.status || 'draft',
      image: req.body.image || '',
      description: req.body.description || '',
      travelers: req.body.travelers || 2,
      notes: req.body.notes || '',
      bookingReference: req.body.bookingReference || '',
      start_city: req.body.destination || '',
      itinerary_items: normalizedItinerary,
    });

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: {
        plan: toSavedPlanResponse(plan)
      }
    });
  } catch (error) {
    debugLog('saved-plans:create:exception', {
      message: error?.message,
      name: error?.name,
      stackTop: error?.stack?.split('\n')?.[0],
    });
    console.error('Error creating plan:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create plan',
      error: error.message
    });
  }
});

// Update saved plan
router.put('/:id', validate(updatePlanSchema), async (req, res) => {
  try {
    if (!ensureUserToken(req, res)) return;

    const { id } = req.params;
    const userId = await resolveAuthenticatedUserId(req.user);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid user token',
      });
    }

    // Check if plan exists and belongs to user
    const plan = await SavedPlan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const planUserId = plan.user_id?.toString() || plan.userId;
    if (planUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only update your own plans'
      });
    }

    // Map fields from old schema to new schema
    const updateData = {
      title: req.body.name || plan.title,
      start_date: req.body.departureDate || plan.start_date,
      end_date: req.body.departureDate ? new Date(new Date(req.body.departureDate).getTime() + (req.body.duration || 1) * 24 * 60 * 60 * 1000) : plan.end_date,
      total_cost: req.body.budget || plan.total_cost,
      status: req.body.status || plan.status,
      image: req.body.image || plan.image,
      description: req.body.description || plan.description,
      travelers: req.body.travelers || plan.travelers,
      notes: req.body.notes !== undefined ? req.body.notes : plan.notes,
      bookingReference: req.body.bookingReference || plan.bookingReference,
      start_city: req.body.destination || plan.start_city,
      itinerary_items: req.body.itinerary ? normalizeItineraryItems(req.body.itinerary) : plan.itinerary_items,
      updated_at: new Date(),
    };

    const updatedPlan = await SavedPlan.findByIdAndUpdate(id, updateData, { new: true });

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: {
        plan: toSavedPlanResponse(updatedPlan)
      }
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plan',
      error: error.message
    });
  }
});

// Delete saved plan
router.delete('/:id', async (req, res) => {
  try {
    if (!ensureUserToken(req, res)) return;

    const { id } = req.params;
    const userId = await resolveAuthenticatedUserId(req.user);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid user token',
      });
    }

    // Check if plan exists and belongs to user
    const plan = await SavedPlan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const planUserId = plan.user_id?.toString() || plan.userId;
    if (planUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own plans'
      });
    }

    await SavedPlan.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete plan',
      error: error.message
    });
  }
});

module.exports = router;
