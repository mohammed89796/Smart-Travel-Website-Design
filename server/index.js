require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { seedDatabase, TravelPlan } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const plansRoutes = require('./routes/plans');
const savedPlansRoutes = require('./routes/saved-plans');
const budgetRoutes = require('./routes/budget');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const activityLogsRoutes = require('./routes/activityLogs');
const aiRoutes = require('./routes/ai');

const app = express();

const configuredOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(cors({
  origin: isDev ? true : configuredOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Error handling middleware for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body'
    });
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running'
  });
});

// Plans search endpoint handled here to avoid router matching issues
app.get('/api/plans/search', async (req, res) => {
  try {
    const { destination, maxBudget, minDuration } = req.query;
    let plans = await TravelPlan.getAll();

    if (destination) {
      plans = plans.filter((plan) =>
        plan.destinations.some((value) =>
          value.toLowerCase().includes(destination.toLowerCase())
        )
      );
    }

    if (maxBudget) {
      plans = plans.filter((plan) => plan.price <= parseInt(maxBudget, 10));
    }

    if (minDuration) {
      plans = plans.filter((plan) => plan.duration >= parseInt(minDuration, 10));
    }

    res.json({
      success: true,
      message: 'Search results',
      data: {
        plans
      }
    });
  } catch (error) {
    console.error('Error searching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search plans',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/activity-logs', activityLogsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/saved-plans', savedPlansRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Connect MongoDB, seed data if needed, and start server
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Smart Travel Backend Server          ║
║   ✓ MongoDB connected                  ║
║   ✓ Server running on port ${PORT}       ║
║   ✓ Environment: ${process.env.NODE_ENV}       ║
╚════════════════════════════════════════╝
      `);
      console.log('Available endpoints:');
      console.log('  POST   /api/auth/register');
      console.log('  POST   /api/auth/login');
      console.log('  GET    /api/auth/me');
      console.log('  GET    /api/plans');
      console.log('  GET    /api/plans/:id');
      console.log('  GET    /api/plans/search');
      console.log('  GET    /api/saved-plans (protected)');
      console.log('  GET    /api/saved-plans/:id (protected)');
      console.log('  POST   /api/saved-plans (protected)');
      console.log('  PUT    /api/saved-plans/:id (protected)');
      console.log('  DELETE /api/saved-plans/:id (protected)');
      console.log('  POST   /api/budget/calculate');
      console.log('  GET    /api/budget/tips');
      console.log('  POST   /api/ai/itinerary');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

