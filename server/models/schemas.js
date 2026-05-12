const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false, // Don't return password by default
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// SavedPlan Schema
const savedPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a plan title'],
  },
  description: String,
  destinations: [String],
  duration: Number,
  budget: Number,
  startDate: Date,
  endDate: Date,
  itinerary: mongoose.Schema.Types.Mixed, // Flexible structure for itinerary
  activities: [
    {
      day: Number,
      title: String,
      description: String,
      location: String,
      time: String,
    },
  ],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// TravelPlan Schema (Pre-defined plans)
const travelPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a plan name'],
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  destinations: [String],
  duration: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: String,
  highlights: [String],
  itinerary: [
    {
      day: Number,
      title: String,
      description: String,
      activities: [String],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Budget Schema
const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavedPlan',
  },
  totalBudget: {
    type: Number,
    required: true,
  },
  categories: [
    {
      name: String,
      planned: Number,
      spent: Number,
    },
  ],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Export Models
module.exports = {
  User: mongoose.model('User', userSchema),
  SavedPlan: mongoose.model('SavedPlan', savedPlanSchema),
  TravelPlan: mongoose.model('TravelPlan', travelPlanSchema),
  Budget: mongoose.model('Budget', budgetSchema),
};
