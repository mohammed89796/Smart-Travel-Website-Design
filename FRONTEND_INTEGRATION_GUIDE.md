# Frontend Integration Guide - React to Node.js Backend

## Step 1: Create API Service Layer

Create `src/services/api.js`:

```javascript
const API_URL = 'http://localhost:5000/api';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// Auth APIs
export const authAPI = {
  register: (name, email, password, phone) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    }),

  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  getMe: () => apiCall('/auth/me')
};

// Travel Plans APIs
export const plansAPI = {
  getAll: () => apiCall('/plans'),
  getById: (id) => apiCall(`/plans/${id}`),
  search: (destination, maxBudget, minDuration) =>
    apiCall('/plans/search', {
      method: 'GET',
      // Note: build query string properly
    })
};

// Saved Plans APIs (Protected)
export const savedPlansAPI = {
  getAll: () => apiCall('/saved-plans'),
  getById: (id) => apiCall(`/saved-plans/${id}`),
  create: (planData) =>
    apiCall('/saved-plans', {
      method: 'POST',
      body: JSON.stringify(planData)
    }),
  update: (id, planData) =>
    apiCall(`/saved-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData)
    }),
  delete: (id) =>
    apiCall(`/saved-plans/${id}`, {
      method: 'DELETE'
    })
};

// Budget APIs
export const budgetAPI = {
  calculate: (duration, budget, interests) =>
    apiCall('/budget/calculate', {
      method: 'POST',
      body: JSON.stringify({ duration, budget, interests })
    }),
  getTips: () => apiCall('/budget/tips')
};
```

## Step 2: Update AuthModal Component

```javascript
import { authAPI } from '../services/api';

export function AuthModal({ isOpen, onClose, onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);

      let response;
      if (isLogin) {
        response = await authAPI.login(data.email, data.password);
      } else {
        response = await authAPI.register(
          data.name,
          data.email,
          data.password,
          data.phone
        );
      }

      // Store token
      localStorage.setItem('token', response.data.token);

      // Call onAuth callback
      onAuth(response.data.user.name, response.data.user.email);

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Your modal JSX */
  );
}
```

## Step 3: Update App.tsx

```typescript
import { useState, useEffect } from 'react';
import { authAPI, savedPlansAPI, plansAPI } from './services/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [savedPlans, setSavedPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load saved plans when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedPlans();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setIsAuthenticated(true);
        setUserName(response.data.user.name);
        setUserEmail(response.data.user.email);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const loadSavedPlans = async () => {
    try {
      const response = await savedPlansAPI.getAll();
      setSavedPlans(response.data.plans);
    } catch (error) {
      console.error('Failed to load saved plans:', error);
    }
  };

  const handleAuth = (name, email) => {
    setIsAuthenticated(true);
    setUserName(name);
    setUserEmail(email);
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      // Logout
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUserName('');
      setUserEmail('');
      setSavedPlans([]);
    } else {
      // Open login modal
      setIsAuthModalOpen(true);
    }
  };

  const handleGeneratePlan = async (planData) => {
    // ... existing generation logic

    if (isAuthenticated) {
      try {
        const newPlan = await savedPlansAPI.create({
          name: `Egypt Tour ${planData.duration} Days`,
          destination: 'Multiple Cities',
          duration: planData.duration,
          budget: planData.budget,
          status: 'draft',
          itinerary: generatedItinerary
        });

        await loadSavedPlans(); // Refresh list
      } catch (error) {
        console.error('Failed to save plan:', error);
      }
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await savedPlansAPI.delete(planId);
      await loadSavedPlans(); // Refresh list
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  const handleBookPlan = async (plan) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await savedPlansAPI.create({
        name: plan.name,
        destination: plan.destinations.join(', '),
        duration: plan.duration,
        budget: plan.price,
        status: 'upcoming',
        image: plan.image
      });

      await loadSavedPlans(); // Refresh list
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to book plan:', error);
    }
  };

  // ... rest of component
}
```

## Step 4: Update PlansGallery Component

```javascript
import { plansAPI } from '../services/api';

export function PlansGallery({ onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await plansAPI.getAll();
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading plans...</div>;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map(plan => (
        <div key={plan.id} onClick={() => onSelectPlan(plan)}>
          {/* Your card JSX */}
        </div>
      ))}
    </div>
  );
}
```

## Step 5: Update BudgetPlanner Component

```javascript
import { budgetAPI } from '../services/api';

export function BudgetPlanner({ onGeneratePlan }) {
  const [tips, setTips] = useState([]);

  useEffect(() => {
    loadBudgetTips();
  }, []);

  const loadBudgetTips = async () => {
    try {
      const response = await budgetAPI.getTips();
      setTips(response.data.tips);
    } catch (error) {
      console.error('Failed to load tips:', error);
    }
  };

  const handleGeneratePlan = async (planData) => {
    try {
      const response = await budgetAPI.calculate(
        planData.duration,
        planData.budget,
        planData.interests
      );

      onGeneratePlan({
        ...planData,
        budgetBreakdown: response.data.breakdown,
        allocation: response.data.allocation
      });
    } catch (error) {
      console.error('Failed to calculate budget:', error);
    }
  };

  // ... rest of component
}
```

## Step 6: Update UserDashboard Component

```javascript
import { savedPlansAPI } from '../services/api';

export function UserDashboard({ savedPlans, onViewPlan, onDeletePlan, onUpdatePlan }) {
  const handleStatusChange = async (planId, newStatus) => {
    try {
      await onUpdatePlan(planId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  // ... rest of component with plan display
}
```

## Step 7: Error Handling Hook

Create `src/hooks/useApi.js`:

```javascript
import { useState, useCallback } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = Array.isArray(data.errors)
          ? data.errors.map(e => e.message).join(', ')
          : data.message;
        throw new Error(errorMessage);
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

## Step 8: Environment Setup

Add to `.env` or `.env.local`:

```
VITE_API_URL=http://localhost:5000/api
```

## Testing Checklist

- [ ] Register new user
- [ ] Login with credentials
- [ ] View travel plans
- [ ] Search/filter plans
- [ ] Create saved plan
- [ ] Update saved plan
- [ ] Delete saved plan
- [ ] View saved plans in dashboard
- [ ] Book pre-defined plan
- [ ] Calculate budget
- [ ] View budget tips
- [ ] Logout and test protected routes

## Common Issues & Solutions

### Token expires after 7 days
- User needs to login again for new token
- Consider implementing refresh token

### CORS errors
- Check backend CORS_ORIGIN in .env matches frontend URL
- Ensure localhost:5173 is allowed

### 401 Unauthorized
- Token missing or expired
- Check localStorage has valid token
- Check header format: "Bearer <token>"

### Validation errors
- Check error messages from API
- Fields might require specific format or length
- Review API_DOCUMENTATION.md for field requirements

## Performance Tips

1. Cache travel plans in state to avoid repeated API calls
2. Use React Query or SWR for data fetching
3. Implement pagination for large lists
4. Cache budget tips (don't change often)

That's it! Your frontend is now integrated with the backend. 🚀
