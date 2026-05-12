# Quick Start Guide - Smart Travel Backend

## 1. Installation & Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file (already created with defaults)
# Review and update .env if needed
```

## 2. Start the Server

```bash
npm start
# or for development with automatic reload
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║   Smart Travel Backend Server          ║
║   ✓ Server running on port 5000       ║
║   ✓ Environment: development       ║
╚════════════════════════════════════════╝
```

## 3. Test API Endpoints

### 3.1 Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "1712345678000",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3.2 Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Save the token from response for next requests!**

### 3.3 Get All Travel Plans
```bash
curl http://localhost:5000/api/plans
```

### 3.4 Get Single Travel Plan
```bash
curl http://localhost:5000/api/plans/1
```

### 3.5 Search Travel Plans
```bash
curl "http://localhost:5000/api/plans/search?destination=Cairo&maxBudget=15000"
```

### 3.6 Get Budget Tips
```bash
curl http://localhost:5000/api/budget/tips
```

### 3.7 Calculate Budget
```bash
curl -X POST http://localhost:5000/api/budget/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 7,
    "budget": 12500,
    "interests": ["history", "culture"]
  }'
```

### 3.8 Get User's Saved Plans (Protected)
Replace `YOUR_TOKEN` with the token from registration/login:
```bash
curl http://localhost:5000/api/saved-plans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3.9 Create Saved Plan (Protected)
```bash
curl -X POST http://localhost:5000/api/saved-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Egypt Trip",
    "destination": "Cairo, Luxor, Aswan",
    "duration": 7,
    "budget": 12500,
    "status": "draft"
  }'
```

### 3.10 Update Saved Plan (Protected)
```bash
curl -X PUT http://localhost:5000/api/saved-plans/PLAN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "upcoming",
    "budget": 15000
  }'
```

### 3.11 Delete Saved Plan (Protected)
```bash
curl -X DELETE http://localhost:5000/api/saved-plans/PLAN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3.12 Get Current User (Protected)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 4. Integration with Frontend

### Update Frontend to Use Backend

In your React app, update API calls:

```javascript
// Before (mock data)
const response = await mockApiCall();

// After (real backend)
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
```

### Store & Use Token

```javascript
// After successful login
localStorage.setItem('token', data.data.token);

// For authenticated requests
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/saved-plans', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 5. Key Features

✅ **User Authentication**
- Registration with password hashing
- Login with JWT tokens
- Protected routes for user data

✅ **Travel Plans**
- Browse pre-defined travel plans
- Search and filter plans
- Save plans to user profile

✅ **User Dashboard**
- View all user's saved plans
- Create, update, delete plans
- Track plan status

✅ **Budget Management**
- Calculate budget breakdown
- Daily expense allocation
- Budget tips and recommendations

✅ **Data Validation**
- Joi validation on all inputs
- Detailed error messages
- Type checking

✅ **Security**
- JWT token authentication
- Password hashing with bcryptjs
- Route protection with middleware
- CORS configuration

## 6. Validation Examples

### Invalid Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "invalid-email",
    "password": "password123"
  }'
```

Response:
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

### Short Password
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@example.com",
    "password": "123"
  }'
```

Response:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

## 7. Data Storage

Data is stored in JSON files in the `data/` directory:
- `data/users.json` - User accounts and passwords
- `data/saved_plans.json` - User's saved travel plans
- `data/travel_plans.json` - Pre-defined travel plans

## 8. Troubleshooting

### Server won't start
```bash
# Check if port 5000 is already in use
# Change PORT in .env or kill the process
```

### CORS errors on frontend
```bash
# Make sure CORS_ORIGIN in .env matches your frontend URL
# Default: http://localhost:5173
```

### Token errors
```bash
# Token might be expired (7 days)
# Login again to get new token
# Check Authorization header format: "Bearer TOKEN"
```

### Validation errors
```bash
# Check the error details in response
# Fix the fields mentioned in errors array
```

## 9. Environment Variables

File: `.env`

```
PORT=5000                          # Server port
NODE_ENV=development              # Environment
JWT_SECRET=your_secret_key         # Change in production!
JWT_EXPIRE=7d                      # Token expiration
CORS_ORIGIN=http://localhost:5173  # Frontend URL
```

## 10. Next Steps

1. ✅ Start the server
2. ✅ Test API endpoints with curl
3. ✅ Integrate backend with React frontend
4. ✅ Update authentication in React (login/register)
5. ✅ Connect saved plans functionality
6. ✅ Add budget calculator calls
7. ✅ Test complete flow

## 11. API Documentation

For detailed API documentation, see: `server/API_DOCUMENTATION.md`

## Need Help?

- Check API_DOCUMENTATION.md for detailed endpoint info
- Review error messages for validation issues
- Check browser console and server logs for errors
- Ensure all required fields are provided
- Verify token is valid and not expired

Happy coding! 🚀
