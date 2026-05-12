const express = require('express');
const { Destination, readJsonFile } = require('../models');
const { authMiddleware } = require('../middleware');

const router = express.Router();

// Get all travel plans
router.get('/', async (req, res) => {
  try {
    let plans = await Destination.find().lean();

    // Fallback to bundled demo plans when DB is empty.
    if (!plans.length) {
      const fallbackPlans = await readJsonFile('travel_plans.json');
      plans = (fallbackPlans || []).map((plan, index) => ({
        _id: plan._id || `fallback-${index}`,
        name: plan.name || `Plan ${index + 1}`,
        description: plan.description || '',
        category: plan.category || 'cultural',
        average_rating: plan.rating || plan.average_rating || 4.7,
        image: plan.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200',
        price: plan.price || plan.budget || plan.average_cost || 1200,
        duration: plan.duration || 5,
        destinations: Array.isArray(plan.destinations) ? plan.destinations : [plan.destination || 'Egypt'],
        highlights: Array.isArray(plan.highlights) ? plan.highlights : [],
      }));
    }

    res.json({
      success: true,
      message: 'Travel plans retrieved',
      data: {
        plans
      }
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans',
      error: error.message
    });
  }
});

// Get single travel plan by ID
router.get('/:id', async (req, res) => {
  try {
    const plan = await Destination.findById(req.params.id).lean();

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan retrieved',
      data: {
        plan
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

module.exports = router;
