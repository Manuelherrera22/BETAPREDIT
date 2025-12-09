import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Use environment variable for API URL, fallback to relative path
// In development, always use localhost:3000 if VITE_API_URL is not set
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Import error handler
    import('../utils/errorHandler').then(({ ErrorHandler }) => {
      // Log error for tracking
      ErrorHandler.logError(error, `API: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    });

    // Handle network errors (backend not available)
    if (!error.response) {
      // Network error - backend might not be available
      console.warn('API request failed - backend may not be available:', error.message);
      
      // Don't redirect on network errors, just reject
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        isNetworkError: true,
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Unauthorized - logout user
      const authStore = useAuthStore.getState();
      if (authStore.user) {
        authStore.logout();
        // Only redirect if we're not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // For 404 errors, log but don't show critical error
    if (error.response?.status === 404) {
      console.warn('API endpoint not found:', error.config?.url);
    }

    // For 500 errors, provide better error message
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data);
    }

    return Promise.reject(error);
  }
)

export default api

