const Joi = require('joi');

// User registration schema
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'string.empty': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.empty': 'Password is required'
    })
});

// User login schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'string.empty': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

// Save plan schema
const savePlanSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Plan name is required',
      'string.min': 'Plan name must be at least 3 characters'
    }),
  destination: Joi.string()
    .required()
    .messages({
      'string.empty': 'Destination is required'
    }),
  duration: Joi.number()
    .min(1)
    .max(365)
    .required()
    .messages({
      'number.min': 'Duration must be at least 1 day',
      'number.max': 'Duration cannot exceed 365 days'
    }),
  budget: Joi.number()
    .min(100)
    .required()
    .messages({
      'number.min': 'Budget must be at least 100'
    }),
  status: Joi.string()
    .valid('draft', 'upcoming', 'completed', 'cancelled')
    .default('draft'),
  image: Joi.string().uri().optional(),
  description: Joi.string().optional(),
  itinerary: Joi.array().items(Joi.object()).optional(),
  departureDate: Joi.string().isoDate().optional(),
  travelers: Joi.number().integer().min(1).max(20).optional(),
  notes: Joi.string().max(600).allow('').optional(),
  bookingReference: Joi.string().max(50).optional()
});

// Update plan schema
const updatePlanSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .optional(),
  destination: Joi.string().optional(),
  duration: Joi.number()
    .min(1)
    .max(365)
    .optional(),
  budget: Joi.number()
    .min(100)
    .optional(),
  status: Joi.string()
    .valid('draft', 'upcoming', 'completed', 'cancelled')
    .optional(),
  image: Joi.string().uri().optional(),
  description: Joi.string().optional(),
  itinerary: Joi.array().items(Joi.object()).optional(),
  departureDate: Joi.string().isoDate().optional(),
  travelers: Joi.number().integer().min(1).max(20).optional(),
  notes: Joi.string().max(600).allow('').optional(),
  bookingReference: Joi.string().max(50).optional()
}).min(1);

// Budget plan schema
const budgetPlanSchema = Joi.object({
  duration: Joi.number()
    .min(1)
    .max(365)
    .required()
    .messages({
      'number.min': 'Duration must be at least 1 day',
      'number.max': 'Duration cannot exceed 365 days'
    }),
  budget: Joi.number()
    .min(100)
    .required()
    .messages({
      'number.min': 'Budget must be at least 100'
    }),
  interests: Joi.array()
    .items(Joi.string())
    .optional()
});

// AI itinerary generation schema
const aiItinerarySchema = Joi.object({
  duration: Joi.number()
    .min(1)
    .max(365)
    .required()
    .messages({
      'number.min': 'Duration must be at least 1 day',
      'number.max': 'Duration cannot exceed 365 days'
    }),
  budget: Joi.number()
    .min(100)
    .required()
    .messages({
      'number.min': 'Budget must be at least 100'
    }),
  travelers: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .required()
    .messages({
      'number.min': 'Travelers must be at least 1',
      'number.max': 'Travelers cannot exceed 20'
    }),
  interests: Joi.array()
    .items(Joi.string())
    .default([]),
  activities: Joi.array()
    .items(Joi.string())
    .default([])
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      stripUnknown: true,
      abortEarly: false
    });

    if (error) {
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  savePlanSchema,
  updatePlanSchema,
  budgetPlanSchema,
  aiItinerarySchema,
  validate
};
