# Admin Dashboard Implementation Guide

**Smart Travel Management System - Backend Implementation**

## Overview

This document explains the complete backend implementation of the Admin Dashboard module, including architecture, modules, API design, and integration instructions.

---

## 1. Project Structure

```
server/
├── routes/
│   ├── admin.js                 # Admin dashboard routes
│   ├── adminAuth.js             # Admin authentication routes
│   ├── auth.js                  # User authentication
│   └── ...other routes
├── controllers/
│   ├── adminController.js       # Admin business logic
│   └── ...other controllers
├── models.js                    # Mongoose schemas (includes new Admin models)
├── middleware.js                # Auth & RBAC middleware (enhanced)
├── index.js                     # Express app setup (needs admin route registration)
└── config/
    └── database.js              # DB connection
```

---

## 2. Database Models

### 2.1 Admin Schema
**File:** `server/models.js`

Stores admin user information with role-based access control:
```javascript
Admin {
  _id: String (unique ID),
  name: String (required),
  email: String (required, unique, indexed),
  password: String (required, hashed, selected=false),
  role: Enum ['super_admin', 'admin', 'moderator'],
  phone: String,
  isActive: Boolean,
  lastLogin: Date,
  permissions: Array<String>,
  department: String,
  timestamps: createdAt, updatedAt
}
```

**Key Features:**
- Custom string ID generation
- Email indexed for fast lookups
- Password selected=false by default (must explicitly select to retrieve)
- Role-based default permissions assignment
- Activity tracking via lastLogin

---

### 2.2 Destination Schema
**File:** `server/models.js`

Represents travel destinations:
```javascript
Destination {
  _id: String,
  name: String (required, unique, indexed),
  description: String (required),
  country: String (required, indexed),
  region: String,
  category: Enum ['beach', 'mountain', 'cultural', 'adventure', 'urban', 'nature', 'historical'],
  climate: Enum ['tropical', 'temperate', 'arid', 'cold'],
  bestSeason: String,
  image: String (URL),
  attractions: Array<String>,
  isActive: Boolean (default=true, indexed),
  rating: Number (0-5),
  reviewCount: Number,
  timestamps: createdAt, updatedAt
}
```

**Indexes:**
- Single: name, country, category, isActive
- Compound: (name, country)

---

### 2.3 Booking Schema
**File:** `server/models.js`

Tracks user bookings for travel packages:
```javascript
Booking {
  _id: String,
  userId: String (required, indexed),
  packageId: String (required, indexed),
  packageName: String,
  destination: String,
  departureDate: Date (required, indexed),
  numberOfTravelers: Number (1-20),
  totalPrice: Number,
  status: Enum ['pending', 'confirmed', 'cancelled', 'completed'],
  paymentStatus: Enum ['pending', 'paid', 'refunded', 'partial'],
  specialRequests: String,
  refundAmount: Number,
  cancellationReason: String,
  cancelledAt: Date,
  completedAt: Date,
  notes: String,
  timestamps: createdAt, updatedAt
}
```

**Indexes:**
- Single: userId, packageId, departureDate, status
- Compound: (userId, status), (packageId, status)

---

### 2.4 Review Schema
**File:** `server/models.js`

Manages user reviews and ratings:
```javascript
Review {
  _id: String,
  userId: String (required, indexed),
  userName: String,
  packageId: String (required, indexed),
  packageName: String,
  rating: Number (1-5),
  title: String,
  content: String,
  status: Enum ['pending', 'approved', 'rejected'],
  adminResponse: String,
  respondedBy: String,
  respondedAt: Date,
  isVerifiedPurchase: Boolean,
  helpfulCount: Number,
  timestamps: createdAt, updatedAt
}
```

**Indexes:**
- Compound: (packageId, status)

---

### 2.5 AuditLog Schema
**File:** `server/models.js`

Tracks all admin actions for compliance and security:
```javascript
AuditLog {
  _id: String,
  adminId: String (required, indexed),
  adminEmail: String,
  action: Enum ['create', 'read', 'update', 'delete', 'login', 'logout'],
  resourceType: Enum ['destination', 'booking', 'user', 'package', 'review', 'admin'],
  resourceId: String,
  changes: Mixed (object with before/after values),
  status: Enum ['success', 'failure'],
  ipAddress: String,
  userAgent: String,
  timestamps: createdAt (auto)
}
```

**Indexes:**
- Compound: (adminId, createdAt descending)
- Compound: (resourceType, action)
- Single: createdAt descending

---

## 3. Middleware Layer

**File:** `server/middleware.js`

### 3.1 adminAuthMiddleware
Verifies JWT token specifically for admin users.

**Usage:**
```javascript
router.use(adminAuthMiddleware);
```

**Validates:**
- Token exists in Authorization header
- Token is valid and not expired
- Token contains adminId flag

**Attaches:** `req.admin` object with decoded token data

---

### 3.2 requireRole(...allowedRoles)
Role-based access control middleware.

**Usage:**
```javascript
router.post('/destinations', 
  requireRole('admin', 'super_admin'), 
  controller.createDestination
);
```

**Supported Roles:**
- `super_admin` - Full system access
- `admin` - Manage most resources
- `moderator` - View and moderate reviews

---

### 3.3 requirePermission(requiredPermission)
Permission-based access control.

**Usage:**
```javascript
router.delete('/users/:id',
  requirePermission('delete_users'),
  controller.deleteUser
);
```

---

### 3.4 auditLog(adminId, adminEmail, action, resourceType, resourceId, changes, status, req)
Asynchronous audit logging function (called within controllers).

**Usage:**
```javascript
await auditLog(
  req.admin.adminId,
  req.admin.email,
  'create',
  'destination',
  destination._id,
  { action: 'Created new destination', name: destination.name },
  'success',
  req
);
```

**Logs:**
- Admin ID and email
- Action performed (create/read/update/delete/login/logout)
- Resource type and ID
- Change details for tracking
- Success/failure status
- IP address and user agent
- Timestamp

---

### 3.5 trackAdminActivity
Updates admin's lastLogin timestamp on each request.

**Usage:**
```javascript
router.use(trackAdminActivity);
```

---

## 4. Controller Layer

**File:** `server/controllers/adminController.js`

The controller implements all business logic for the admin dashboard. Each function is thoroughly documented with requirement IDs.

### 4.1 Destination Management

#### createDestination (AD-FR-04)
- Creates new destination with validation
- Prevents duplicate names
- Logs audit event
- Returns 201 Created

#### getDestinations (AD-FR-05)
- Lists destinations with pagination (default: 20 per page)
- Supports filters: country, category, climate, search
- Returns related packages count
- Returns pagination metadata

#### getDestinationById (AD-FR-05)
- Retrieves single destination with full details
- Includes related travel packages
- Returns 404 if not found

#### updateDestination (AD-FR-06)
- Partial updates supported
- Tracks all changes for audit trail
- Validates updated fields
- Returns updated resource

#### deleteDestination (AD-FR-07)
- Soft delete (sets isActive=false)
- Checks for active packages before deletion
- Requires super_admin role
- Returns 409 Conflict if packages exist

---

### 4.2 Travel Package Management

#### createTravelPackage (AD-FR-09)
- Creates package with itinerary support
- Validates price >= 100
- Supports multiple destinations per package
- Auto-generates timestamps

#### getTravelPackages (AD-FR-10)
- Advanced filtering: destination, category, price range, duration
- Pagination support
- Includes booking count per package
- Sorted by rating, price, name

#### updateTravelPackage (AD-FR-11)
- Updates package details and pricing
- Change tracking for audit
- Prevents editing _id field
- Validates all updates

#### deleteTravelPackage (AD-FR-12)
- Prevents deletion if active bookings exist
- Soft delete pattern
- Checks for pending and confirmed bookings
- Audit logged

---

### 4.3 Booking Management

#### getBookings (AD-FR-14)
- Lists all bookings with comprehensive filters
- Filter options: status, userId, packageId, date range, search
- Enriches with user details (email, name)
- Pagination support
- Sorted by creation date (newest first)

#### getBookingById (AD-FR-14)
- Retrieves booking with user and package details
- Includes complete booking history
- Enriches with related information

#### updateBookingStatus (AD-FR-15, AD-FR-17)
- Updates booking status with state validation
- Handles cancellations with refund calculation
- Updates payment status automatically
- Default 80% refund on cancellation
- Records cancellation reason and timestamp
- Marks completion date when completed

---

### 4.4 User Management

#### getUsers (AD-FR-18)
- Lists all users with activity metrics
- Filter by registration date range
- Search by name or email
- Returns booking count and total spent per user
- Excludes password field
- Paginated output

#### getUserById (AD-FR-19)
- Detailed user profile with activity history
- Shows all bookings and reviews
- Calculates total spending
- Returns user metrics (total bookings, reviews, spent)
- Requires admin role

---

### 4.5 Review Management

#### getReviews (AD-FR-22)
- Lists all reviews with moderation support
- Filter by: status (pending/approved/rejected), packageId, rating, search
- Pagination support
- Sorted by creation date

#### getReviewById (AD-FR-22)
- Retrieves single review with admin response

#### updateReview (AD-FR-23, AD-FR-24)
- Updates review status for moderation
- Adds admin response to review
- Tracks respondent admin and timestamp
- Supports approval, rejection, or pending status

#### deleteReview (AD-FR-22)
- Removes review from system
- Soft delete pattern
- Requires admin or super_admin role
- Audit logged

---

### 4.6 Analytics & Statistics

#### getDashboardStats (AD-FR-26)
Returns real-time dashboard metrics:
```javascript
{
  statistics: {
    totalUsers,
    totalDestinations,
    totalPackages,
    totalBookings,
    completedBookings,
    pendingBookings,
    totalRevenue,
    pendingReviews,
    systemUptime
  }
}
```

#### getRevenueAnalytics (AD-FR-27)
- Daily/monthly/yearly revenue breakdown
- Total refunds tracked
- Top 10 packages by revenue
- Support for custom periods

#### getBookingAnalytics (AD-FR-28)
- Bookings by status distribution
- Top 10 most popular packages
- Cancellation rate calculation
- Average booking value

#### getUserAnalytics (AD-FR-29)
- New users per month (last 6 months)
- Top 10 most active users with spending
- Total user count
- User engagement metrics

---

### 4.7 Audit Logs

#### getAuditLogs
- Retrieve all admin actions with filtering
- Filter by: adminId, action, resourceType, dateRange
- Supports pagination
- Sorted by creation date (newest first)
- Super Admin only access

---

## 5. Routes Documentation

**Base Path:** `/api/admin`

All routes require `adminAuthMiddleware` and appropriate role.

### 5.1 Authentication Routes
**File:** `server/routes/adminAuth.js`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Admin login |
| POST | `/auth/register` | super_admin | Create new admin account |
| POST | `/auth/logout` | admin+ | Admin logout |
| GET | `/auth/profile` | admin+ | Get current admin profile |
| PUT | `/auth/profile` | admin+ | Update profile (name, phone, department) |
| PUT | `/auth/change-password` | admin+ | Change password |
| POST | `/auth/forgot-password` | Public | Request password reset |

---

### 5.2 Destination Routes
**File:** `server/routes/admin.js`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/destinations` | admin+ | Create destination |
| GET | `/destinations` | admin+ | List destinations (paginated, filtered) |
| GET | `/destinations/:id` | admin+ | Get single destination |
| PUT | `/destinations/:id` | admin+ | Update destination |
| DELETE | `/destinations/:id` | super_admin | Delete destination |

---

### 5.3 Travel Package Routes
**File:** `server/routes/admin.js`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/travel-packages` | admin+ | Create package |
| GET | `/travel-packages` | admin+ | List packages (paginated, filtered) |
| GET | `/travel-packages/:id` | admin+ | Get single package |
| PUT | `/travel-packages/:id` | admin+ | Update package |
| DELETE | `/travel-packages/:id` | admin+ | Delete package |

---

### 5.4 Booking Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/bookings` | admin+ | List bookings (paginated, filtered) |
| GET | `/bookings/:id` | admin+ | Get single booking |
| PUT | `/bookings/:id/status` | admin+ | Update booking status (confirm/cancel/complete) |

---

### 5.5 User Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/users` | admin+ | List users (paginated, filtered, with metrics) |
| GET | `/users/:id` | admin+ | Get user with activity details |

---

### 5.6 Review Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/reviews` | admin+ | List reviews (paginated, filtered) |
| GET | `/reviews/:id` | admin+ | Get single review |
| PUT | `/reviews/:id` | moderator+ | Update review (approve/reject/respond) |
| DELETE | `/reviews/:id` | admin+ | Delete review |

---

### 5.7 Analytics Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/stats` | admin+ | Dashboard statistics |
| GET | `/analytics/revenue?period=monthly` | admin+ | Revenue analytics |
| GET | `/analytics/bookings` | admin+ | Booking analytics |
| GET | `/analytics/users` | admin+ | User analytics |

---

### 5.8 Audit Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/audit-logs` | super_admin | Retrieve audit logs |

---

### 5.9 Health Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/health` | admin+ | Verify portal status |
| GET | `/verify` | admin+ | Verify token validity |

---

## 6. Integration Steps

### Step 1: Register Models
The models have already been added to `server/models.js`. Verify exports:

```javascript
module.exports = {
  User,
  SavedPlan,
  TravelPlan,
  Budget,
  Destination,      // NEW
  Booking,           // NEW
  Review,            // NEW
  Admin,             // NEW
  AuditLog,          // NEW
  seedDatabase,
  ensureDataDir,
};
```

---

### Step 2: Register Admin Routes in Main Server
**File:** `server/index.js`

Add these imports at the top:
```javascript
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');
```

Add these route registrations (after existing routes):
```javascript
// Admin authentication (no middleware required)
app.use('/api/admin/auth', adminAuthRoutes);

// Admin dashboard (requires adminAuth middleware)
app.use('/api/admin', adminRoutes);
```

**Complete example (server/index.js):**
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
const adminAuthRoutes = require('./routes/adminAuth');      // NEW
const adminRoutes = require('./routes/admin');              // NEW

const app = express();

// ... middleware setup ...

// User routes
app.use('/api/auth', authRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/saved-plans', savedPlansRoutes);
app.use('/api/budget', budgetRoutes);

// Admin routes (NEW)
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);

// ... rest of setup ...
```

---

### Step 3: Initialize Database
No migration needed. Models are automatically created on first use. Optional: seed initial Super Admin:

```javascript
// In database.js after MongoDB connection
async function createSuperAdmin() {
  const { Admin } = require('../models');
  const bcrypt = require('bcryptjs');
  
  const count = await Admin.countDocuments();
  if (count === 0) {
    const salt = await bcrypt.genSalt(10);
    await Admin.create({
      name: 'System Administrator',
      email: 'admin@smarttravel.com',
      password: await bcrypt.hash('SecurePassword123', salt),
      role: 'super_admin',
      department: 'Administration',
      isActive: true,
      permissions: ['create_admin', 'delete_admin', 'manage_all_resources', 'view_audit_logs'],
    });
    console.log('Initial Super Admin created');
  }
}
```

---

## 7. API Response Format

All endpoints follow consistent response format:

### Success Response (2xx)
```json
{
  "success": true,
  "message": "Operation description",
  "data": {
    // Response payload varies by endpoint
  }
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional detailed error message"
}
```

---

## 8. Authentication Flow

### 1. Admin Login
```bash
POST /api/admin/auth/login
{
  "email": "admin@smarttravel.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "data": {
    "admin": {
      "id": "1712345678123",
      "name": "Admin Name",
      "email": "admin@smarttravel.com",
      "role": "admin",
      "permissions": [...]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Store Token (Client-side)
Client stores token in localStorage/sessionStorage

### 3. Use Token for Authenticated Requests
```bash
GET /api/admin/dashboard/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 9. Example API Calls

### Create Destination
```bash
POST /api/admin/destinations
Authorization: Bearer <token>

{
  "name": "Paris",
  "description": "City of Light",
  "country": "France",
  "region": "Île-de-France",
  "category": "cultural",
  "climate": "temperate",
  "bestSeason": "Spring, Fall",
  "image": "https://example.com/paris.jpg",
  "attractions": ["Eiffel Tower", "Louvre Museum", "Notre-Dame"]
}
```

### Get Bookings with Filters
```bash
GET /api/admin/bookings?status=confirmed&page=1&limit=20
Authorization: Bearer <token>
```

### Update Booking Status
```bash
PUT /api/admin/bookings/1712345678123/status
Authorization: Bearer <token>

{
  "status": "cancelled",
  "reason": "User requested cancellation",
  "refundAmount": 450.00
}
```

### Get Dashboard Stats
```bash
GET /api/admin/dashboard/stats
Authorization: Bearer <token>
```

---

## 10. Security Best Practices Implemented

✅ **JWT Authentication**
- 24-hour token expiration
- Token contains adminId flag
- Token refresh on password change

✅ **Password Security**
- Minimum 8 characters
- Hashed with bcryptjs (salt rounds: 10)
- Never returned in responses

✅ **Role-Based Access Control**
- Three-tier hierarchy: super_admin > admin > moderator
- Permission validation on each endpoint
- Role-specific endpoint restrictions

✅ **Audit Logging**
- All admin actions logged with timestamp
- IP address and user agent recorded
- Changes tracked for updates

✅ **Data Protection**
- Password field selected=false by default
- Sensitive data excluded from responses
- Soft deletes preserve data integrity

✅ **Input Validation**
- All inputs validated before processing
- Mongoose schema validation
- Type checking and bounds validation

---

## 11. Performance Considerations

**Database Indexes:**
- All frequently queried fields indexed
- Compound indexes for common filter combinations
- userId, packageId, status indexed for fast dashboard queries

**Pagination:**
- Default 20 records, max 100 per page
- Required on list endpoints to prevent memory issues

**Query Optimization:**
- Projection used to limit returned fields
- Aggregation for statistical calculations
- No N+1 queries (enrichment handled efficiently)

**Caching Opportunity:**
- Dashboard stats can be cached (update every 5 minutes)
- Most popular packages queryable from cache
- Redis recommended for production

---

## 12. Testing Checklist

- [ ] Admin login and token generation
- [ ] Token expiration and refresh
- [ ] Role-based access denial
- [ ] Create destination with duplicate prevention
- [ ] Destination soft delete with package check
- [ ] Booking status update with refund calculation
- [ ] User activity metrics calculation
- [ ] Review moderation workflow
- [ ] Audit log creation on all actions
- [ ] Pagination and filtering
- [ ] Error handling and validation
- [ ] Permission enforcement
- [ ] Password hashing verification

---

## 13. Future Enhancements

- [ ] Two-Factor Authentication (2FA)
- [ ] IP-based access restrictions
- [ ] Email notifications for bookings
- [ ] Real-time WebSocket updates
- [ ] Advanced search with Elasticsearch
- [ ] Data export to Excel/CSV
- [ ] Scheduled reports
- [ ] Multi-language support
- [ ] Dashboard customization
- [ ] Advanced analytics with charts

---

## 14. Troubleshooting

### Token Expired Error
**Symptom:** 401 Unauthorized on valid requests
**Solution:** User must login again to get fresh token

### Permission Denied
**Symptom:** 403 Forbidden on permitted endpoint
**Solution:** Check admin role and required permissions

### Duplicate Key Error
**Symptom:** E11000 duplicate key error
**Solution:** Email or destination name already exists, use unique value

### Database Connection Failed
**Symptom:** Cannot connect to MongoDB
**Solution:** Check MONGODB_URI in .env, ensure MongoDB is running

---

## 15. Support & Maintenance

For issues or enhancements:
1. Check audit logs for error details
2. Review error messages for specific problems
3. Verify JWT token validity
4. Check admin permissions/role
5. Examine request payload formatting

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Ready for Integration
