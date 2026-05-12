const express = require('express');
const { validate, budgetPlanSchema } = require('../validations');

const router = express.Router();

// Calculate budget breakdown
router.post('/calculate', validate(budgetPlanSchema), async (req, res) => {
  try {
    const { duration, budget, interests } = req.body;

    // Calculate budget breakdown
    const dailyBudget = Math.round(budget / duration);

    // Suggested allocation percentages
    const allocation = {
      accommodation: Math.round(dailyBudget * 0.35),
      food: Math.round(dailyBudget * 0.25),
      activities: Math.round(dailyBudget * 0.25),
      transportation: Math.round(dailyBudget * 0.10),
      other: Math.round(dailyBudget * 0.05)
    };

    // Generate budget breakdown by day
    const breakdown = Array.from({ length: duration }, (_, i) => ({
      day: i + 1,
      budget: dailyBudget,
      expenses: {
        accommodation: allocation.accommodation,
        food: allocation.food,
        activities: allocation.activities,
        transportation: allocation.transportation,
        other: allocation.other
      }
    }));

    // Get recommendations based on interests
    const recommendations = generateRecommendations(interests || []);

    res.json({
      success: true,
      message: 'Budget calculated successfully',
      data: {
        totalBudget: budget,
        duration,
        dailyBudget,
        allocation,
        breakdown,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error calculating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate budget',
      error: error.message
    });
  }
});

// Get budget tips
router.get('/tips', (req, res) => {
  const tips = [
    {
      id: 1,
      title: 'Book accommodations in advance',
      description: 'Booking hotels 2-3 months in advance can save you 20-30% on accommodation costs.'
    },
    {
      id: 2,
      title: 'Use public transportation',
      description: 'Using buses and trains instead of taxis can significantly reduce your transportation budget.'
    },
    {
      id: 3,
      title: 'Eat at local restaurants',
      description: 'Dining at local eateries is not only cheaper but also more authentic.'
    },
    {
      id: 4,
      title: 'Look for free attractions',
      description: 'Many cities offer free museums, parks, and walking tours on specific days.'
    },
    {
      id: 5,
      title: 'Travel during off-season',
      description: 'Traveling during off-season months can reduce costs for flights and hotels by 30-50%.'
    },
    {
      id: 6,
      title: 'Get a travel insurance',
      description: 'Travel insurance can save you from unexpected expenses.'
    }
  ];

  res.json({
    success: true,
    data: {
      tips
    }
  });
});

function generateRecommendations(interests) {
  const allRecommendations = {
    history: [
      'Visit Egypt Museum in Cairo',
      'Explore Luxor Temple complex',
      'Tour Valley of the Kings'
    ],
    culture: [
      'Attend local cultural festivals',
      'Visit Khan El-Khalili bazaar',
      'Explore local neighborhoods'
    ],
    adventure: [
      'Try desert safari',
      'Explore White Desert',
      'Go camel trekking'
    ],
    food: [
      'Take cooking classes',
      'Visit food markets',
      'Try street food tours'
    ],
    relaxation: [
      'River cruise on the Nile',
      'Spa treatments',
      'Beach resorts'
    ]
  };

  let recommendations = [];

  if (interests.length === 0) {
    recommendations = Object.values(allRecommendations).flat();
  } else {
    interests.forEach(interest => {
      if (allRecommendations[interest.toLowerCase()]) {
        recommendations.push(...allRecommendations[interest.toLowerCase()]);
      }
    });
  }

  return recommendations.slice(0, 10);
}

module.exports = router;
