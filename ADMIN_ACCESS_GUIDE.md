# How to Access the Admin Dashboard

Your complete Admin Dashboard system is now ready! Here's how to access and use it.

## Quick Start

### 1. **Access the Admin Dashboard**

The admin dashboard is integrated into the Smart Travel website. You have two ways to access it:

#### Option A: Via Browser Navigation
1. Go to the smart travel website home page
2. Click the **"Admin"** button in the top navigation bar (next to the Sign In button)
3. You'll be directed to the Admin Login page

#### Option B: Direct URL
```
http://localhost:5173/admin  (when running locally)
```

### 2. **Login with Admin Credentials**

The first admin account has been created with the following credentials:

**Email:** `admin@smarttravel.com`  
**Password:** `SecurePassword123`  
**Role:** `super_admin`

**⚠️ IMPORTANT:** Change these credentials immediately in production!

```bash
# To reset password in MongoDB:
db.admins.updateOne(
  { email: "admin@smarttravel.com" },
  { $set: { password: "NewStrongPassword123" } }
)
```

### 3. **Admin Dashboard Features**

Once logged in, you'll have access to:

#### **Dashboard Overview Tab**
- Real-time statistics (total users, bookings, revenue, etc.)
- Quick action buttons
- System health indicators

#### **Destinations Manager**
- View all travel destinations
- Add new destinations
- Edit existing destination details
- Search and filter destinations by category
- Delete destinations

#### **Bookings Manager**
- Track all user bookings
- Filter by status (pending, confirmed, completed, cancelled)
- View booking details and user information
- Search by booking ID or user name

#### **Users Manager**
- View all registered users
- See user profiles and booking history
- Account status management
- Delete user accounts if needed

#### **Reviews Manager**
- Moderate user reviews
- Approve or reject pending reviews
- View published reviews
- Filter by review status

#### **Analytics Dashboard**
- Revenue trends over time
- Bookings by status distribution
- Top destinations analysis
- User growth tracking
- Comprehensive KPI metrics
- Date range selectable (7 days, 30 days, 90 days, 1 year)

---

## Backend API Integration

The frontend is fully integrated with the backend admin API. All API calls are handled through the `adminClient.ts` module.

### API Endpoints Documentation

See the detailed API documentation in:
- [API_DOCUMENTATION.md](../server/API_DOCUMENTATION.md)
- [ADMIN_IMPLEMENTATION_GUIDE.md](./ADMIN_IMPLEMENTATION_GUIDE.md)

### Common API Operations

```typescript
// Login
await adminApi.login('admin@smarttravel.com', 'SecurePassword123');

// Get Dashboard Stats
await adminApi.getDashboardStats();

// Manage Destinations
await adminApi.getDestinations(page, limit, filters);
await adminApi.createDestination(destinationData);
await adminApi.updateDestination(id, destinationData);
await adminApi.deleteDestination(id);

// Manage Bookings
await adminApi.getBookings(page, limit, filters);
await adminApi.getBookingById(id);

// Manage Users
await adminApi.getUsers(page, limit, filters);
await adminApi.deleteUser(userId);

// Manage Reviews
await adminApi.getReviews(page, limit, filters);
await adminApi.updateReview(reviewId, { status: 'approved' });

// Analytics
await adminApi.getAnalytics(days);
```

---

## Setup Instructions

### 1. **Ensure Backend is Running**

```bash
# From the server directory
cd server
npm install
npm start
# Server will run on http://localhost:5000
```

### 2. **Ensure Frontend is Running**

```bash
# From the root directory
npm install
npm run dev
# Frontend will run on http://localhost:5173
```

### 3. **Database Setup**

Make sure MongoDB is running and initialized:

```bash
# The admin schema and indexes are automatically created on first access
# If you need to seed the database:

# 1. Connect to MongoDB
mongosh

# 2. Use the smart_travel database
use smart_travel

# 3. Create the first admin (if not already created)
db.admins.insertOne({
  name: "Super Admin",
  email: "admin@smarttravel.com",
  password: "bcrypt_hashed_password_here",  # Use bcrypt to hash
  role: "super_admin",
  permissions: ["all"],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## Admin User Roles & Permissions

### Role Hierarchy

1. **super_admin**
   - Full access to all features
   - Can manage other admins
   - Can view audit logs
   - Can access all reports

2. **admin**
   - Can manage destinations, bookings, users, reviews
   - Can view analytics
   - Cannot manage other admins
   - Limited audit log access

3. **moderator**
   - Can moderate reviews and flagged content
   - Can view user reports
   - Read-only access to analytics
   - Limited to content moderation tasks

---

## Features Breakdown

### ✅ Authentication & Security
- JWT-based authentication
- Secure password storage with bcrypt
- Token expiration and refresh
- Admin-only route protection

### ✅ Destination Management
- Create, read, update, delete destinations
- Category filtering (beach, mountain, cultural, adventure)
- Climate classifications
- Detailed descriptions and metadata

### ✅ Booking Management
- Real-time booking status tracking
- Filter by status and user
- Revenue calculation
- Booking history

### ✅ User Management
- User account overview
- Active/inactive status tracking
- Booking history per user
- User deletion with cascade cleanup

### ✅ Review Moderation
- Pending review queue
- Approve/reject functionality
- Star rating display
- Comment text preview

### ✅ Analytics & Reporting
- Revenue analytics with trends
- User growth metrics
- Booking status distribution
- Top destinations by bookings
- KPI dashboards
- Historical data comparison

### ✅ Audit Logging
- All admin actions logged
- Timestamp and admin tracking
- Change history
- Compliance ready

---

## Troubleshooting

### Issue: "Cannot connect to server"
**Solution:**
1. Verify the backend is running on port 5000
2. Check CORS configuration in server/middleware.js
3. Verify API endpoint URLs in src/api/adminClient.ts

### Issue: "Login fails - Invalid credentials"
**Solution:**
1. Verify you're using the correct email: `admin@smarttravel.com`
2. Check the password hasn't been changed
3. Reset the admin account in MongoDB if needed

### Issue: "Dashboard loads but shows no data"
**Solution:**
1. Check MongoDB is running and connected
2. Verify database has proper indexes (created automatically)
3. Check browser console for API errors
4. Verify admin token is stored in localStorage

### Issue: "403 Forbidden error on API calls"
**Solution:**
1. Your auth token may have expired - try logging out and logging back in
2. Check your admin role has proper permissions
3. Verify JWT_SECRET matches between server and authentication

### Issue: Components not rendering
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Ensure all node_modules are installed: `npm install`
3. Restart dev server: `npm run dev`

---

## File Structure

The admin dashboard implementation includes:

```
src/
├── api/
│   └── adminClient.ts          # Admin API client library
├── app/components/
│   ├── AdminLogin.tsx          # Login component
│   ├── AdminDashboard.tsx      # Main dashboard layout
│   ├── DestinationManager.tsx  # Destination CRUD
│   ├── BookingManager.tsx      # Booking management
│   ├── UserManager.tsx         # User management
│   ├── ReviewManager.tsx       # Review moderation
│   └── AnalyticsDashboard.tsx # Analytics & reports
└── App.tsx                     # Integration point

server/
├── routes/
│   ├── admin.js               # All admin endpoints
│   └── adminAuth.js           # Authentication endpoints
├── controllers/
│   └── adminController.js     # Business logic (20+ functions)
├── middleware.js              # Auth & RBAC middleware
├── models.js                  # Admin schemas
└── API_DOCUMENTATION.md       # Complete API reference
```

---

## Next Steps

1. **Customize Styling:** Modify Tailwind classes in components to match your brand
2. **Add More Admins:** Use the admin creation endpoint
3. **Configure Permissions:** Adjust role-based access control in middleware
4. **Set Up Email Notifications:** Add email alerts for key admin actions
5. **Implement 2FA:** Add two-factor authentication for extra security
6. **Create Backups:** Set up MongoDB backup procedures

---

## Support & Documentation

For detailed information, refer to:
- [ADMIN_DASHBOARD_REQUIREMENTS.md](./ADMIN_DASHBOARD_REQUIREMENTS.md)
- [ADMIN_IMPLEMENTATION_GUIDE.md](./ADMIN_IMPLEMENTATION_GUIDE.md)
- [ADMIN_QUICK_REFERENCE.md](./ADMIN_QUICK_REFERENCE.md)
- [server/API_DOCUMENTATION.md](../server/API_DOCUMENTATION.md)

---

**Last Updated:** 2024  
**Admin Dashboard Version:** 1.0  
**Status:** Production Ready ✅
