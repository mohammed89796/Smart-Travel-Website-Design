# Smart Travel Backend API Documentation

## Overview
Complete Node.js backend for Smart Travel website with JWT authentication, Joi validation, and protected routes.

## Getting Started

### Installation
```bash
cd server
npm install
```

### Environment Setup
Create a `.env` file in the server directory:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

### Running the Server
```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

---

## Authentication Endpoints

### 1. Register User
- **Endpoint:** `POST /api/auth/register`
- **Public:** ✅ Yes
- **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+1234567890"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login User
- **Endpoint:** `POST /api/auth/login`
- **Public:** ✅ Yes
- **Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Public:** ❌ No (Requires Bearer Token)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1234567890",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

## Travel Plans Endpoints

### 1. Get All Travel Plans
- **Endpoint:** `GET /api/plans`
- **Public:** ✅ Yes
- **Response:**
```json
{
  "success": true,
  "message": "Travel plans retrieved",
  "data": {
    "plans": [
      {
        "id": "1",
        "name": "Classic Egypt Discovery",
        "description": "Explore the ancient wonders of Egypt",
        "destinations": ["Cairo", "Luxor", "Aswan"],
        "duration": 7,
        "price": 12500,
        "image": "https://images.unsplash.com/...",
        "highlights": ["Great Pyramids", "Sphinx", "Nile River Cruise", "Luxor Temple"]
      }
    ]
  }
}
```

### 2. Get Single Travel Plan
- **Endpoint:** `GET /api/plans/:id`
- **Public:** ✅ Yes
- **Response:** Single plan object (same format as above)

### 3. Search Travel Plans
- **Endpoint:** `GET /api/plans/search?destination=Cairo&maxBudget=15000&minDuration=5`
- **Public:** ✅ Yes
- **Query Parameters:**
  - `destination` (optional): Filter by destination
  - `maxBudget` (optional): Filter by maximum budget
  - `minDuration` (optional): Filter by minimum duration
- **Response:** Filtered plans array

---

## Saved Plans Endpoints (Protected)

All these endpoints require authentication with Bearer token in header:
```
Authorization: Bearer <token>
```

### 1. Get All User's Saved Plans
- **Endpoint:** `GET /api/saved-plans`
- **Public:** ❌ No (Protected)
- **Response:**
```json
{
  "success": true,
  "message": "Saved plans retrieved",
  "data": {
    "plans": [
      {
        "id": "1712345678000",
        "userId": "1234567890",
        "name": "Classic Egypt Discovery",
        "destination": "Cairo, Luxor, Aswan",
        "duration": 7,
        "budget": 12500,
        "status": "upcoming",
        "image": "https://images.unsplash.com/...",
        "description": "My custom travel plan",
        "itinerary": [...],
        "createdAt": "2024-04-06T10:30:00Z",
        "updatedAt": "2024-04-06T10:30:00Z"
      }
    ]
  }
}
```

### 2. Get Single Saved Plan
- **Endpoint:** `GET /api/saved-plans/:id`
- **Public:** ❌ No (Protected)
- **Response:** Single saved plan object

### 3. Create Saved Plan
- **Endpoint:** `POST /api/saved-plans`
- **Public:** ❌ No (Protected)
- **Request Body:**
```json
{
  "name": "My Egypt Adventure",
  "destination": "Cairo, Luxor, Aswan",
  "duration": 7,
  "budget": 12500,
  "status": "draft",
  "image": "https://images.unsplash.com/...",
  "description": "My custom travel plan",
  "itinerary": [
    {
      "day": 1,
      "activities": "Arrive in Cairo, visit hotel"
    }
  ]
}
```
- **Response:** Created plan object with ID

### 4. Update Saved Plan
- **Endpoint:** `PUT /api/saved-plans/:id`
- **Public:** ❌ No (Protected)
- **Request Body:** (All fields optional)
```json
{
  "name": "Updated Plan Name",
  "budget": 15000,
  "status": "upcoming"
}
```
- **Response:** Updated plan object

### 5. Delete Saved Plan
- **Endpoint:** `DELETE /api/saved-plans/:id`
- **Public:** ❌ No (Protected)
- **Response:**
```json
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

---

## Budget Endpoints

### 1. Calculate Budget
- **Endpoint:** `POST /api/budget/calculate`
- **Public:** ✅ Yes
- **Request Body:**
```json
{
  "duration": 7,
  "budget": 12500,
  "interests": ["history", "culture"]
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Budget calculated successfully",
  "data": {
    "totalBudget": 12500,
    "duration": 7,
    "dailyBudget": 1786,
    "allocation": {
      "accommodation": 625,
      "food": 446,
      "activities": 446,
      "transportation": 178,
      "other": 89
    },
    "breakdown": [
      {
        "day": 1,
        "budget": 1786,
        "expenses": {
          "accommodation": 625,
          "food": 446,
          "activities": 446,
          "transportation": 178,
          "other": 89
        }
      }
    ],
    "recommendations": [
      "Visit Egypt Museum in Cairo",
      "Explore Luxor Temple complex",
      "Tour Valley of the Kings"
    ]
  }
}
```

### 2. Get Budget Tips
- **Endpoint:** `GET /api/budget/tips`
- **Public:** ✅ Yes
- **Response:**
```json
{
  "success": true,
  "data": {
    "tips": [
      {
        "id": 1,
        "title": "Book accommodations in advance",
        "description": "Booking hotels 2-3 months in advance can save you 20-30% on accommodation costs."
      }
    ]
  }
}
```

---

## Validation Rules

### Register Schema
- `name`: 2-50 characters, required
- `email`: Valid email format, required
- `password`: Minimum 6 characters, required
- `phone`: Optional

### Login Schema
- `email`: Valid email format, required
- `password`: Required

### Save Plan Schema
- `name`: 3-100 characters, required
- `destination`: Required
- `duration`: 1-365 days, required
- `budget`: Minimum 100, required
- `status`: 'draft', 'upcoming', 'completed', 'cancelled' (default: 'draft')
- `image`: Valid URI, optional
- `description`: Optional
- `itinerary`: Array of objects, optional

### Budget Schema
- `duration`: 1-365 days, required
- `budget`: Minimum 100, required
- `interests`: Array of strings, optional

---

## Authentication

### How to Use Tokens

1. **Get Token:** Register or login to receive a JWT token
2. **Store Token:** Save in localStorage or sessionStorage
3. **Use Token:** Add to Authorization header:
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/api/saved-plans', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Token Expiration
Tokens expire after 7 days (configurable via `JWT_EXPIRE` in .env)

---

## Error Responses

### Bad Request (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Unauthorized: You can only update your own plans"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Plan not found"
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "message": "Failed to create plan",
  "error": "Error details"
}
```

---

## Features

✅ **JWT Authentication** - Secure token-based authentication
✅ **Joi Validation** - Robust input validation with detailed error messages
✅ **Route Protection** - Private routes secured with middleware
✅ **CORS Support** - Configure allowed origins
✅ **Error Handling** - Comprehensive error responses
✅ **Data Persistence** - JSON file-based storage
✅ **Password Security** - bcryptjs password hashing
✅ **User Authorization** - Users can only access their own data

---

## Integration with Frontend

### Example React Hook for API Calls

```javascript
// src/hooks/useApi.js
import { useState, useCallback } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API error');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
};
```

### Using in React Components

```javascript
// Login example
const { request } = useApi();

const handleLogin = async (email, password) => {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  localStorage.setItem('token', response.data.token);
};
```

---

## Security Best Practices

1. **Change JWT_SECRET** in production
2. **Use HTTPS** in production
3. **Validate inputs** on both client and server
4. **Store tokens securely** (consider httpOnly cookies)
5. **Implement rate limiting** for production
6. **Add request logging** and monitoring
7. **Use environment variables** for sensitive data

---

## File Structure

```
server/
├── index.js              # Main server entry point
├── models.js             # Database models (User, SavedPlan, TravelPlan)
├── middleware.js         # Authentication middleware
├── validations.js        # Joi validation schemas
├── .env                  # Environment variables
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── plans.js         # Travel plans routes
│   ├── saved-plans.js   # User saved plans routes
│   └── budget.js        # Budget calculation routes
└── data/                 # JSON data storage
    ├── users.json
    ├── saved_plans.json
    └── travel_plans.json
```

---

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or kill process using port 5000
```

### CORS Errors
- Check CORS_ORIGIN in .env matches your frontend URL
- Default is http://localhost:5173

### Token Issues
- Remove and regenerate token by logging in again
- Check token hasn't expired (7 days)

### Data Not Persisting
- Ensure data/ directory exists and is writable
- Check file permissions

---

## Future Enhancements

- [ ] MongoDB integration
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Refresh token mechanism
- [ ] Rate limiting
- [ ] Request logging
- [ ] Two-factor authentication
- [ ] Social login (Google, Facebook)
- [ ] AI-powered itinerary generation
- [ ] Payment integration

---

## Support

For issues or questions, please refer to the documentation or check the console logs for error details.
