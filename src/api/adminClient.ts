/**
 * Admin Dashboard API Client
 * Handles all API calls for admin dashboard operations
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/admin';

interface AdminLoginResponse {
  success: boolean;
  message: string;
  data: {
    admin: {
      id: string;
      name: string;
      email: string;
      role: string;
      permissions: string[];
    };
    token: string;
  };
}

class AdminApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (this.token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }

    this.client.interceptors.request.use((config) => {
      const latestToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (latestToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${latestToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          this.token = null;
          delete this.client.defaults.headers.common['Authorization'];
          localStorage.removeItem('adminToken');
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const response = await this.client.post<AdminLoginResponse>('/auth/login', {
      email,
      password,
    });
    
    if (response.data.success && response.data.data.token) {
      this.token = response.data.data.token;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      if (this.token) {
        localStorage.setItem('adminToken', this.token);
      }
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.token = null;
      delete this.client.defaults.headers.common['Authorization'];
      localStorage.removeItem('adminToken');
    }
  }

  // Dashboard Stats
  async getDashboardStats() {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  // Destinations
  async getDestinations(page = 1, limit = 20, filters?: any) {
    const response = await this.client.get('/destinations', {
      params: { page, limit, ...filters },
    });
    return response.data;
  }

  async getDestinationById(id: string) {
    const response = await this.client.get(`/destinations/${id}`);
    return response.data;
  }

  async createDestination(data: any) {
    const response = await this.client.post('/destinations', data);
    return response.data;
  }

  async updateDestination(id: string, data: any) {
    const response = await this.client.put(`/destinations/${id}`, data);
    return response.data;
  }

  async deleteDestination(id: string) {
    const response = await this.client.delete(`/destinations/${id}`);
    return response.data;
  }

  // Bookings
  async getBookings(page = 1, limit = 20, filters?: any) {
    const response = await this.client.get('/bookings', {
      params: { page, limit, ...filters },
    });
    return response.data;
  }

  async getBookingById(id: string) {
    const response = await this.client.get(`/bookings/${id}`);
    return response.data;
  }

  async updateBookingStatus(id: string, status: string, reason?: string, refundAmount?: number) {
    const response = await this.client.put(`/bookings/${id}/status`, {
      status,
      reason,
      refundAmount,
    });
    return response.data;
  }

  // Users
  async getUsers(page = 1, limit = 20, filters?: any) {
    const response = await this.client.get('/users', {
      params: { page, limit, ...filters },
    });
    return response.data;
  }

  async getUserById(id: string) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  // Reviews
  async getReviews(page = 1, limit = 20, filters?: any) {
    const response = await this.client.get('/reviews', {
      params: { page, limit, ...filters },
    });
    return response.data;
  }

  async updateReviewStatus(id: string, status: string, adminResponse?: string) {
    const response = await this.client.put(`/reviews/${id}`, {
      status,
      adminResponse,
    });
    return response.data;
  }

  async updateReview(id: string, data: any) {
    const response = await this.client.put(`/reviews/${id}`, data);
    return response.data;
  }

  async deleteReview(id: string) {
    const response = await this.client.delete(`/reviews/${id}`);
    return response.data;
  }

  // Analytics
  async getRevenueAnalytics(period = 'monthly') {
    const response = await this.client.get('/analytics/revenue', {
      params: { period },
    });
    return response.data;
  }

  async getBookingAnalytics() {
    const response = await this.client.get('/analytics/bookings');
    return response.data;
  }

  async getUserAnalytics() {
    const response = await this.client.get('/analytics/users');
    return response.data;
  }

  async getAnalytics(_days: number = 30) {
    try {
      const [revenue, bookings, users] = await Promise.all([
        this.getRevenueAnalytics('daily'),
        this.getBookingAnalytics(),
        this.getUserAnalytics(),
      ]);

      return {
        success: true,
        data: {
          analytics: {
            totalRevenue: revenue?.data?.totalRevenue || 0,
            revenueGrowth: revenue?.data?.growth || 0,
            revenueTrend: revenue?.data?.trend || [],
            newUsers: users?.data?.newUsers || 0,
            userGrowth: users?.data?.growth || 0,
            userGrowthTrend: users?.data?.trend || [],
            totalBookings: bookings?.data?.total || 0,
            completedBookings: bookings?.data?.completed || 0,
            bookingGrowth: bookings?.data?.growth || 0,
            bookingsByStatus: bookings?.data?.byStatus || [],
            topDestinations: bookings?.data?.topDestinations || [],
            averageRating: 4.5,
            ratingTrend: 0.1,
            averageOrderValue: revenue?.data?.averageOrderValue || 0,
            conversionRate: 2.5,
            repeatCustomers: 35,
          },
        },
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        success: false,
        message: 'Failed to fetch analytics',
        data: { analytics: {} },
      };
    }
  }

  // Verify token
  async verifyToken() {
    const response = await this.client.get('/verify');
    return response.data;
  }

  // Activity Logs
  async getActivityLogs(page: number = 1, limit: number = 20, filters?: any) {
    const params = { page, limit, ...filters };
    const response = await this.client.get('/activity-logs', { params });
    return response.data;
  }

  async getAdminActivityLogs(adminId: string) {
    const response = await this.client.get(`/activity-logs/admin/${adminId}`);
    return response.data;
  }

  async getActivityLogsSummary() {
    const response = await this.client.get('/activity-logs/summary/stats');
    return response.data;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const adminApi = new AdminApiClient();
