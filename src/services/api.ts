/**
 * Smart Travel Backend API Service
 * Handles all API calls to the Node.js backend
 */

const API_URL = 'http://localhost:5000/api';

/**
 * Generic API call function with auto token handling
 */
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    // Enhanced error message handling
    const errorMessage = data.message || data.error || 'API request failed';
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data;
};

/**
 * Authentication API endpoints
 */
export const authAPI = {
  register: (name: string, email: string, password: string) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: (name ?? '').trim(),
        email: (email ?? '').trim(),
        password: (password ?? '').trim(),
      }),
    }),

  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => apiCall('/auth/me'),
};

/**
 * Travel Plans API endpoints
 */
export const plansAPI = {
  getAll: () => apiCall('/plans'),

  getById: (id: string) => apiCall(`/plans/${id}`),

  search: (destination?: string, maxBudget?: number, minDuration?: number) => {
    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);
    if (maxBudget) params.append('maxBudget', maxBudget.toString());
    if (minDuration) params.append('minDuration', minDuration.toString());

    return apiCall(`/plans/search?${params.toString()}`);
  },
};

/**
 * Saved Plans API endpoints (Protected - require authentication)
 */
export const savedPlansAPI = {
  getAll: () => apiCall('/saved-plans'),

  getById: (id: string) => apiCall(`/saved-plans/${id}`),

  create: (planData: {
    name: string;
    destination: string;
    duration: number;
    budget: number;
    status?: string;
    image?: string;
    description?: string;
    itinerary?: any[];
    departureDate?: string;
    travelers?: number;
    notes?: string;
    bookingReference?: string;
  }) =>
    apiCall('/saved-plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    }),

  update: (
    id: string,
    planData: {
      name?: string;
      destination?: string;
      duration?: number;
      budget?: number;
      status?: string;
      image?: string;
      description?: string;
      itinerary?: any[];
      departureDate?: string;
      travelers?: number;
      notes?: string;
      bookingReference?: string;
    }
  ) =>
    apiCall(`/saved-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    }),

  delete: (id: string) =>
    apiCall(`/saved-plans/${id}`, {
      method: 'DELETE',
    }),

  downloadItinerary: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/downloads/itinerary/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download itinerary');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'itinerary.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadBookingConfirmation: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/downloads/booking-confirmation/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download confirmation');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'booking-confirmation.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

/**
 * Budget API endpoints
 */
export const budgetAPI = {
  calculate: (duration: number, budget: number, interests: string[] = []) =>
    apiCall('/budget/calculate', {
      method: 'POST',
      body: JSON.stringify({ duration, budget, interests }),
    }),

  getTips: () => apiCall('/budget/tips'),
};

/**
 * AI Itinerary API endpoints
 */
export const aiAPI = {
  generateItinerary: (payload: {
    budget: number;
    travelers: number;
    duration: number;
    interests?: string[];
    activities?: string[];
  }) =>
    apiCall('/ai/itinerary', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

/**
 * Helper: Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

/**
 * Helper: Get stored token
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Helper: Store user data after login/register
 */
export const storeUserData = (token: string, user: any) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Helper: Clear user data on logout
 */
export const clearUserData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Helper: Get stored user data
 */
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default {
  authAPI,
  plansAPI,
  savedPlansAPI,
  budgetAPI,
  aiAPI,
  apiCall,
  isAuthenticated,
  getToken,
  storeUserData,
  clearUserData,
  getStoredUser,
};
