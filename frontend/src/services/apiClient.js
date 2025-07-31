import axios from 'axios';

// Token storage utilities
const TOKEN_KEY = "blood_warriors_access_token";
const REFRESH_TOKEN_KEY = "blood_warriors_refresh_token";

const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const setStoredRefreshToken = (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token);
const removeStoredTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getStoredRefreshToken();
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        removeStoredTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${apiClient.defaults.baseURL}/auth/token/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data.data;
        
        setStoredToken(access_token);
        setStoredRefreshToken(newRefreshToken);
        
        // Update the authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Process the queue
        processQueue(null, access_token);
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError, null);
        removeStoredTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refresh_token: refreshToken }),
  refreshToken: (refreshToken) => apiClient.post('/auth/token/refresh', { refresh_token: refreshToken }),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (profileData) => apiClient.put('/auth/profile', profileData),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  verifyEmail: (token) => apiClient.get(`/auth/verify/${token}`),
  resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),
  checkEmailAvailability: (email) => apiClient.get(`/auth/check-email?email=${email}`),
  getSessions: () => apiClient.get('/auth/sessions'),
  revokeTokens: (data) => apiClient.post('/auth/token/revoke', data),
};

export const donorsAPI = {
  getAll: (params) => apiClient.get('/donors', { params }),
  getById: (id) => apiClient.get(`/donors/${id}`),
  updateLocation: (location) => apiClient.put('/donors/me/location', location),
  getProfile: () => apiClient.get('/donors/me'),
  updateProfile: (profileData) => apiClient.put('/donors/me', profileData),
};

export const requestsAPI = {
  getAll: (params) => apiClient.get('/requests', { params }),
  getById: (id) => apiClient.get(`/requests/${id}`),
  create: (requestData) => apiClient.post('/requests', requestData),
  update: (id, requestData) => apiClient.put(`/requests/${id}`, requestData),
  delete: (id) => apiClient.delete(`/requests/${id}`),
  respond: (id, response) => apiClient.post(`/requests/${id}/respond`, response),
  getNearby: (params) => apiClient.get('/requests/nearby', { params }),
};

export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getRecentActivity: () => apiClient.get('/dashboard/activity'),
  getNotifications: () => apiClient.get('/dashboard/notifications'),
};

export const publicDataAPI = {
  getBloodBanks: (params) => apiClient.get('/public-data/blood-banks', { params }),
  getBloodGroups: () => apiClient.get('/public-data/blood-groups'),
  getBloodComponents: () => apiClient.get('/public-data/blood-components'),
  getCoupons: (params) => apiClient.get('/public-data/coupons', { params }),
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    setStoredToken(token);
  } else {
    removeStoredTokens();
  }
};

export const clearAuthTokens = () => {
  removeStoredTokens();
};

export const isAuthenticated = () => {
  const token = getStoredToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Error handling utilities
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: data.message || 'Invalid request data',
          errors: data.errors || [],
        };
      case 401:
        return {
          type: 'authentication',
          message: 'Authentication required',
        };
      case 403:
        return {
          type: 'authorization',
          message: 'Access denied',
        };
      case 404:
        return {
          type: 'not_found',
          message: 'Resource not found',
        };
      case 429:
        return {
          type: 'rate_limit',
          message: 'Too many requests. Please try again later.',
        };
      case 500:
        return {
          type: 'server_error',
          message: 'Internal server error. Please try again later.',
        };
      default:
        return {
          type: 'unknown',
          message: data.message || 'An unexpected error occurred',
        };
    }
  } else if (error.request) {
    // Network error
    return {
      type: 'network',
      message: 'Network error. Please check your connection.',
    };
  } else {
    // Other error
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred',
    };
  }
};

export default apiClient;
