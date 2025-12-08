import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Use environment variable for API URL, fallback to relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

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
    // Handle network errors (backend not available)
    if (!error.response) {
      // Network error - backend might not be available
      // Silently fail for demo mode, don't show error to user
      console.warn('API request failed - backend may not be available:', error.message)
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      // Unauthorized - logout user
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    // For 404 errors, log but don't show critical error
    if (error.response?.status === 404) {
      console.warn('API endpoint not found:', error.config?.url)
    }

    return Promise.reject(error)
  }
)

export default api

