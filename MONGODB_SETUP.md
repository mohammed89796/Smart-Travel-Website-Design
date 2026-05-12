# MongoDB & Frontend-Backend Integration Guide

## Overview
This document explains how to set up MongoDB and connect your React frontend with the Express backend.

## Prerequisites
- Node.js (v14+) installed
- MongoDB installed locally OR MongoDB Atlas account for cloud database

## Database Setup

### Option 1: Local MongoDB

1. **Install MongoDB Community Edition**
   - Windows: Download from https://www.mongodb.com/try/download/community
   - macOS: `brew install mongodb-community`
   - Linux: Follow instruction at https://docs.mongodb.com/manual/installation/

2. **Start MongoDB service**
   ```bash
   # Windows (from MongoDB folder)
   mongod

   # macOS/Linux
   brew services start mongodb-community
   ```

3. **Verify MongoDB is running**
   ```bash
   mongosh  # or mongo for older versions
   > db.version()  # Should return version number
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create account at https://www.mongodb.com/cloud/atlas**

2. **Create a cluster and database**

3. **Get connection string** (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/smart_travel
   ```

4. **Update `.env` in `server/` folder**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart_travel
   ```

## Backend Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart_travel
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

### 3. Start Backend Server
```bash
cd server
npm start
# Should see: ✓ MongoDB connected successfully
```

## Frontend Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables Already Configured
Check `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Using the API Client
The `src/api/apiClient.ts` provides all API functions:

```typescript
import { apiClient } from '@/api/apiClient';

// Authentication
await apiClient.register(email, password, name);
await apiClient.login(email, password);
const user = await apiClient.getCurrentUser();

// Travel Plans
const plans = await apiClient.getPlans();
const plan = await apiClient.getPlanById(id);
const results = await apiClient.searchPlans('keyword');

// Saved Plans (protected)
const saved = await apiClient.getSavedPlans();
await apiClient.createSavedPlan({ title, destinations, duration });
await apiClient.updateSavedPlan(id, updatedData);
await apiClient.deleteSavedPlan(id);

// Budget
const budget = await apiClient.calculateBudget(budgetData);
const tips = await apiClient.getBudgetTips('Cairo', 7);
```

### 4. Example Component Usage
```typescript
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/apiClient';

export function MyComponent() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await apiClient.getPlans();
        setPlans(data.plans);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchPlans();
  }, []);

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {plans.map(plan => (
        <div key={plan._id}>{plan.name}</div>
      ))}
    </div>
  );
}
```

## Running Both Services

### Terminal 1 - Backend
```bash
cd server
npm start
# Output: ✓ Server running on port 5000
# Output: ✓ MongoDB connected successfully
```

### Terminal 2 - Frontend
```bash
npm run dev
# Output: Local: http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user (requires token)

### Travel Plans
- `GET /api/plans` - Get all available plans
- `GET /api/plans/:id` - Get specific plan
- `GET /api/plans/search?q=keyword` - Search plans

### Saved Plans (Protected)
- `GET /api/saved-plans` - Get user's saved plans
- `GET /api/saved-plans/:id` - Get specific saved plan
- `POST /api/saved-plans` - Create new saved plan
- `PUT /api/saved-plans/:id` - Update saved plan
- `DELETE /api/saved-plans/:id` - Delete saved plan

### Budget
- `POST /api/budget/calculate` - Calculate trip budget
- `GET /api/budget/tips?destination=X&duration=Y` - Get budget tips

## Troubleshooting

### MongoDB Connection Error
```
✗ MongoDB connection failed: connect ECONNREFUSED
```
**Solution**: Make sure MongoDB service is running:
```bash
# Windows: Run mongod in Command Prompt
# macOS/Linux: brew services start mongodb-community
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Verify `CORS_ORIGIN` in `server/.env` matches your frontend URL:
```env
CORS_ORIGIN=http://localhost:5173
```

### Token Not Found
**Solution**: After login, token should be stored in localStorage. Check:
```javascript
console.log(localStorage.getItem('token'));
```

### API Endpoint Not Found (404)
**Solution**: Ensure backend server is running on port 5000 and check endpoint spelling.

## Database Schema

### User
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### SavedPlan
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  description: String,
  destinations: [String],
  duration: Number,
  budget: Number,
  startDate: Date,
  endDate: Date,
  activities: [{
    day: Number,
    title: String,
    description: String,
    location: String,
    time: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### TravelPlan
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  destinations: [String],
  duration: Number,
  price: Number,
  image: String,
  highlights: [String],
  itinerary: [...]
}
```

## Next Steps

1. ✅ Backend running with MongoDB
2. ✅ Frontend API client configured
3. Update your components to use `apiClient` instead of local data
4. Test authentication flow (register → login → save plans)
5. Deploy to production (update `.env.production`)
