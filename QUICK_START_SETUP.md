# 🚀 Smart Travel Website - Quick Start Guide

## ✅ What's Been Done

### Backend Fixes ✓
- ✅ Fixed missing authentication middleware (`server/middleware/auth.js`)
- ✅ MongoDB integration fully functional
- ✅ Backend server running successfully on port 5000
- ✅ All API endpoints operational

### Frontend Enhancements ✓
- ✅ Google Maps component installed & configured
- ✅ Interactive travel map with 8 destinations
- ✅ Map integrated into homepage
- ✅ Frontend running on port 5174

### Documentation Created ✓
- ✅ `GOOGLE_MAPS_SETUP.md` - Complete maps setup guide
- ✅ `BACKEND_FIXES_SUMMARY.md` - Backend changes summary
- ✅ `QUICK_START.md` - This guide

---

## 🎯 Starting the Application

### Terminal 1: Backend Server
```bash
cd "c:\Users\moham\Downloads\Smart Travel Website Design\server"
npm start
```
✓ Runs on `http://localhost:5000`
✓ MongoDB connections displayed

### Terminal 2: Frontend Development
```bash
cd "c:\Users\moham\Downloads\Smart Travel Website Design"
npm run dev
```
✓ Runs on `http://localhost:5174` (or 5173 if available)
✓ Real-time hot reload enabled

---

## 📍 Google Maps Setup (Required)

### Step 1: Get API Key
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable "Maps JavaScript API"
4. Enable "Places API"
5. Create API key in Credentials section

### Step 2: Add to .env
```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### Step 3: Restart Frontend
```bash
npm run dev
```

**Note**: Without the API key, the map will show a configuration message (won't break the app)

---

## 🗄️ MongoDB Setup

### Option 1: Local MongoDB (Recommended for Development)
```bash
# Make sure MongoDB service is running
# Default connection: mongodb://localhost:27017/smart_travel
```

### Option 2: MongoDB Atlas (Cloud)
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/smart_travel
```

Both options are configured in `server/config/database.js`

---

## 🧪 Testing the Application

### Backend Health Check
```bash
curl http://localhost:5000/health
```
Response: `{"success": true, "message": "Server is running"}`

### API Authentication Test
```bash
# Register new user
POST http://localhost:5000/api/auth/register
Body: {
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": ""
}

# Login
POST http://localhost:5000/api/auth/login
Body: {
  "email": "test@example.com",
  "password": "password123"
}
```

### Frontend Routes
```
Home: http://localhost:5174/
Planning: http://localhost:5174/planning
Dashboard: http://localhost:5174/dashboard
Admin: http://localhost:5174/admin
```

---

## 📊 Project Structure

```
Smart Travel Website Design/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── TravelMap.tsx          ← NEW! Google Maps
│   │   │   ├── Hero.tsx
│   │   │   ├── BudgetPlanner.tsx
│   │   │   └── ... (other components)
│   │   └── App.tsx                     ← UPDATED
│   └── services/
│       └── api.ts
├── server/
│   ├── middleware/
│   │   └── auth.js                     ← NEW! Auth middleware
│   ├── config/
│   │   └── database.js
│   ├── models.js
│   ├── index.js
│   └── routes/
├── data/
│   ├── users.json
│   ├── travel_plans.json
│   └── saved_plans.json
├── .env                                 ← UPDATED
├── package.json
└── GOOGLE_MAPS_SETUP.md                ← NEW!
```

---

## 🔐 Default Admin Account

**Email**: `admin@smarttravel.com`  
**Password**: `SecurePassword123`  
**Access**: http://localhost:5174/admin

⚠️ **Change this password in production!**

---

## 📚 Available Destinations on Map

1. **Paris, France** - The City of Light
2. **Tokyo, Japan** - Modern metropolis  
3. **Bali, Indonesia** - Tropical paradise
4. **New York, USA** - Urban exploration
5. **Barcelona, Spain** - Artistic hub
6. **Dubai, UAE** - Luxury destination
7. **Switzerland** - Mountain adventure
8. **Cancun, Mexico** - Beach resort

Click any marker to see details and explore!

---

## 🚨 Common Issues & Solutions

### Issue: Backend won't start
```
Error: Cannot find module
Solution: cd server && npm install
```

### Issue: MongoDB connection failed
```
Error: connect ECONNREFUSED
Solution: Start MongoDB service or update MONGODB_URI in .env
```

### Issue: Map not showing / API key error
```
Error: Google Maps API Key is not configured  
Solution: Add VITE_GOOGLE_MAPS_API_KEY to .env
```

### Issue: CORS errors
```
Error: No 'Access-Control-Allow-Origin'
Solution: Check CORS_ORIGIN in .env (should be http://localhost:5174)
```

### Issue: Port already in use
```
Error: Port 5000/5173 is already in use
Solution: Kill process or change PORT in .env
```

---

## 🔧 Environment Variables Reference

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### Backend (server/.env or root .env)
```env
MONGODB_URI=mongodb://localhost:27017/smart_travel
JWT_SECRET=your-secret-key-change-this
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5174
```

---

## 📖 Additional Documentation

See these files for detailed information:
- **`GOOGLE_MAPS_SETUP.md`** - Complete Google Maps integration guide
- **`BACKEND_FIXES_SUMMARY.md`** - Detailed backend changes and MongoDB setup
- **`MONGODB_SETUP.md`** - Database configuration details
- **`server/API_DOCUMENTATION.md`** - Complete API endpoint reference

---

## ✨ Features Overview

### User Features
- 🗺️ Interactive map to explore destinations
- 💰 AI-powered budget planner
- 📅 Itinerary generator
- 💾 Save travel plans
- 📊 Dashboard for saved trips
- ⭐ Rate and review destinations

### Admin Features
- 📈 Dashboard with analytics
- 🎯 Destination management
- 👥 User management
- 📋 Booking management
- 🔍 Activity logs
- ⭐ Review moderation

---

## 🎓 Next Steps

1. **Get Google Maps API Key** (required for full map functionality)
2. **Add API Key to .env** file
3. **Start both servers** (backend and frontend)
4. **Test the application**:
   - Register new user account
   - Explore destinations on map
   - Create a travel plan
   - Save to dashboard
5. **Deploy to production** (when ready)

---

## 📞 Support

For detailed setup instructions:
- Google Maps: See `GOOGLE_MAPS_SETUP.md`
- Backend/MongoDB: See `BACKEND_FIXES_SUMMARY.md`
- API Endpoints: See `server/API_DOCUMENTATION.md`

---

## 🎉 You're All Set!

Your Smart Travel Website is now ready with:
- ✅ MongoDB backend
- ✅ Google Maps integration
- ✅ Full API endpoints
- ✅ Admin dashboard
- ✅ User features

Happy travels! 🌍✈️
