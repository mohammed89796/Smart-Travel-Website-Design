# Server Integration Code Template

This document shows the exact code changes needed to integrate the Admin Dashboard into the main Express server.

---

## Updated server/index.js

### Before Integration
```javascript
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/saved-plans', savedPlansRoutes);
app.use('/api/budget', budgetRoutes);

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
```

---

### After Integration (Complete File)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { seedDatabase, TravelPlan } = require('./models');

// ========== EXISTING USER ROUTES ==========
const authRoutes = require('./routes/auth');
const plansRoutes = require('./routes/plans');
const savedPlansRoutes = require('./routes/saved-plans');
const budgetRoutes = require('./routes/budget');

// ========== NEW ADMIN ROUTES ==========
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');

const app = express();

const configuredOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const isDev = process.env.NODE_ENV !== 'production';

// ========== MIDDLEWARE SETUP ==========
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

// ========== HEALTH CHECK ENDPOINTS ==========
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running'
  });
});

// ========== API ROUTES - USER FACING ==========
app.use('/api/auth', authRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/saved-plans', savedPlansRoutes);
app.use('/api/budget', budgetRoutes);

// ========== API ROUTES - ADMIN PANEL ==========
// Note: Admin authentication routes do NOT require adminAuthMiddleware
// They handle the login/registration process and issue tokens
app.use('/api/admin/auth', adminAuthRoutes);

// Note: All other admin routes require adminAuthMiddleware
// This is applied within the admin router to all its routes
app.use('/api/admin', adminRoutes);

// ========== SEARCH ENDPOINT (Existing) ==========
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
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// ========== GLOBAL ERROR HANDLER ==========
// Should be last middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: isDev ? err.message : undefined
  });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ========== SERVER STARTUP ==========
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('✓ Database connected');
    
    return seedDatabase()
      .then(() => console.log('✓ Database seeded (if needed)'));
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`\n📊 Admin Dashboard Available at:`);
      console.log(`   POST   http://localhost:${PORT}/api/admin/auth/login`);
      console.log(`   GET    http://localhost:${PORT}/api/admin/dashboard/stats`);
      console.log(`\n👤 User API Available at:`);
      console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET    http://localhost:${PORT}/api/plans`);
    });
  })
  .catch((error) => {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  });

module.exports = app;
```

---

## Environment Variables (.env)

Add these required variables to your `.env` file:

```env
# Existing variables
MONGODB_URI=mongodb://localhost:27017/smart-travel
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production!
JWT_EXPIRE=24h
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
PORT=5000

# New admin configuration (optional, defaults provided)
ADMIN_JWT_EXPIRE=24h
ADMIN_PASSWORD_MIN_LENGTH=8
ADMIN_SESSION_TIMEOUT=24h
```

---

## Dependencies Check

Make sure all packages are installed. If missing, run:

```bash
npm install bcryptjs jsonwebtoken mongoose cors express dotenv
```

---

## File Organization After Integration

```
server/
├── routes/
│   ├── admin.js                    ✨ NEW
│   ├── adminAuth.js                ✨ NEW
│   ├── auth.js                     (existing)
│   ├── plans.js                    (existing)
│   ├── saved-plans.js              (existing)
│   └── budget.js                   (existing)
│
├── controllers/
│   ├── adminController.js          ✨ NEW
│   └── ...other controllers        (existing)
│
├── middleware.js                   ✏️ UPDATED (enhanced)
├── models.js                       ✏️ UPDATED (new schemas)
├── validations.js                  (existing)
├── index.js                        ✏️ UPDATED (route registration)
│
└── config/
    └── database.js                 (existing)
```

---

## Testing the Integration

### 1. Verify Server Starts
```bash
npm start
# Should see:
# ✓ Database connected
# ✓ Database seeded (if needed)
# ✓ Server running on port 5000
```

### 2. Test Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@smarttravel.com",
    "password": "SecurePassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "data": {
    "admin": {
      "id": "...",
      "name": "System Administrator",
      "email": "admin@smarttravel.com",
      "role": "super_admin",
      "permissions": [...]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Test Dashboard Stats
```bash
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "statistics": {
      "totalUsers": 50,
      "totalDestinations": 25,
      "totalPackages": 100,
      "totalBookings": 150,
      "completedBookings": 120,
      "pendingBookings": 20,
      "totalRevenue": 45000,
      "pendingReviews": 5,
      "systemUptime": "99.9%"
    }
  }
}
```

### 4. Test List Destinations
```bash
curl -X GET "http://localhost:5000/api/admin/destinations?page=1&limit=10" \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"
```

---

## Initial Admin Account Setup (Optional)

Add this to `server/config/database.js` after MongoDB connection:

```javascript
const bcrypt = require('bcryptjs');
const { Admin } = require('../models');

async function createInitialAdmin() {
  try {
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('SecurePassword123', salt);
      
      await Admin.create({
        name: 'System Administrator',
        email: 'admin@smarttravel.com',
        password: hashedPassword,
        role: 'super_admin',
        department: 'Administration',
        isActive: true,
        permissions: [
          'create_admin',
          'delete_admin',
          'manage_all_resources',
          'view_audit_logs'
        ]
      });
      
      console.log('✓ Initial Super Admin created');
      console.log('  Email: admin@smarttravel.com');
      console.log('  Password: SecurePassword123');
      console.log('  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!');
    }
  } catch (error) {
    console.error('Error creating initial admin:', error);
  }
}

// Export and call in connectDB function
module.exports = { connectDB, createInitialAdmin };
```

Then in `server/index.js`:
```javascript
const { connectDB, createInitialAdmin } = require('./config/database');

connectDB()
  .then(() => {
    console.log('✓ Database connected');
    return createInitialAdmin();  // Add this line
  })
  // ... rest of startup code
```

---

## Production Checklist

Before deploying to production:

```javascript
// ❌ REMOVE or comment out default password creation
// Should only create admins via secure registration process

// ✅ Change JWT_SECRET to strong random value
// ✅ Set NODE_ENV=production
// ✅ Enable HTTPS/TLS
// ✅ Set up proper CORS origins
// ✅ Enable database backups
// ✅ Set up monitoring/alerts
// ✅ Implement rate limiting
// ✅ Enable audit log archival
// ✅ Set up log rotation
// ✅ Test all error scenarios
// ✅ Verify password reset process
// ✅ Test 2FA (when implemented)
```

---

## Route Summary After Integration

### Public Routes (No Auth Required)
```
POST   /api/auth/login                    (User login)
POST   /api/auth/register                 (User registration)
POST   /api/admin/auth/login              (Admin login)
POST   /api/admin/auth/forgot-password    (Password reset request)
GET    /health                            (System health check)
```

### Admin Routes (Admin Auth Required)
```
// Authentication
POST   /api/admin/auth/register           (Create admin - super_admin only)
POST   /api/admin/auth/logout             (Logout)
GET    /api/admin/auth/profile            (Get profile)
PUT    /api/admin/auth/profile            (Update profile)
PUT    /api/admin/auth/change-password    (Change password)

// Destinations
POST   /api/admin/destinations            (Create - admin+)
GET    /api/admin/destinations            (List - admin+)
GET    /api/admin/destinations/:id        (Get - admin+)
PUT    /api/admin/destinations/:id        (Update - admin+)
DELETE /api/admin/destinations/:id        (Delete - super_admin)

// Travel Packages (same pattern)
POST   /api/admin/travel-packages
GET    /api/admin/travel-packages
GET    /api/admin/travel-packages/:id
PUT    /api/admin/travel-packages/:id
DELETE /api/admin/travel-packages/:id

// Bookings
GET    /api/admin/bookings
GET    /api/admin/bookings/:id
PUT    /api/admin/bookings/:id/status

// Users
GET    /api/admin/users
GET    /api/admin/users/:id

// Reviews
GET    /api/admin/reviews
GET    /api/admin/reviews/:id
PUT    /api/admin/reviews/:id
DELETE /api/admin/reviews/:id

// Analytics
GET    /api/admin/dashboard/stats
GET    /api/admin/analytics/revenue
GET    /api/admin/analytics/bookings
GET    /api/admin/analytics/users

// Audit Logs
GET    /api/admin/audit-logs            (super_admin only)

// Health & Verify
GET    /api/admin/health
GET    /api/admin/verify
```

---

## Common Issues & Solutions

### Issue: ERR_MODULE_NOT_FOUND for adminAuth.js
**Solution:** Ensure path is correct: `require('./routes/adminAuth')`

### Issue: Cannot find module 'adminController.js'
**Solution:** Create folder at `server/controllers/` and file

### Issue: 404 on /api/admin routes
**Solution:** Verify routes registered in index.js before listening

### Issue: JWT verification fails
**Solution:** Match JWT_SECRET in .env across all token validations

### Issue: 403 Permission Denied on valid token
**Solution:** Check admin role matches endpoint's requireRole() requirements

### Issue: MongoDB duplicate key error
**Solution:** Drop collection and reseed, or use unique email

---

## Next Steps

1. ✅ Copy all new files to your server directory
2. ✅ Update server/index.js with new route registrations
3. ✅ Create server/controllers directory if it doesn't exist
4. ✅ Update .env with admin configuration
5. ✅ Run `npm install` to ensure dependencies
6. ✅ Start server and test admin login
7. ✅ Create initial admins via registration endpoint
8. ✅ Test each resource endpoint (destinations, bookings, etc)
9. ✅ Verify audit logs are created
10. ✅ Test all role-based restrictions

---

**Integration Status:** Ready to Deploy  
**Estimated Integration Time:** 15-30 minutes  
**Testing Time:** 30-60 minutes
