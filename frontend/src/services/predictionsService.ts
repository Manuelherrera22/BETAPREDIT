/**
 * Predictions Service
 * Frontend service for prediction accuracy tracking
 * Uses Supabase Edge Functions in production, backend API in development
 */

import api from './api';
import { isSupabaseConfigured } from '../config/supabase';
import { useAuthStore } from '../store/authStore';

// Get Supabase Functions URL
const getSupabaseFunctionsUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/functions/v1`;
};

// Helper to get Supabase auth token
const getSupabaseAuthToken = async (): Promise<string | null> => {
  try {
    const { supabase } = await import('../config/supabase');
    if (!supabase) return null;
    
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      console.warn('No Supabase session found:', error?.message);
      return null;
    }
    return session.access_token;
  } catch (error) {
    console.error('Error getting Supabase auth token:', error);
    return null;
  }
};

export interface PredictionAccuracyStats {
  total: number;
  correct: number;
  accuracy: number;
  avgAccuracy: number;
  brierScore: number;
  calibrationScore: number;
  calibrationBins: Array<{
    bin: number;
    avgPredicted: number;
    avgActual: number;
    count: number;
    difference: number;
  }>;
  bySport: Array<{
    sport: string;
    total: number;
    correct: number;
    accuracy: number;
    avgAccuracy: number;
  }>;
  byMarket: Array<{
    market: string;
    total: number;
    correct: number;
    accuracy: number;
    avgAccuracy: number;
  }>;
  byConfidence: Array<{
    confidence: number;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  recentPredictions: Array<{
    id: string;
    eventName: string;
    selection: string;
    predictedProbability: number;
    confidence: number;
    wasCorrect: boolean | null;
    accuracy: number | null;
    createdAt: string;
    eventFinishedAt: string | null;
  }>;
}

export interface PredictionStats {
  total: number;
  correct: number;
  accuracy: number;
  avgAccuracy: number;
  bySport: Array<{
    sport: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  byMarket: Array<{
    market: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

export const predictionsService = {
  /**
   * Get prediction accuracy tracking with detailed metrics
   * Uses Supabase Edge Function in production, backend API in development
   */
  getAccuracyTracking: async (filters?: {
    modelVersion?: string;
    sportId?: string;
    marketType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PredictionAccuracyStats> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams();
      if (filters?.modelVersion) params.append('modelVersion', filters.modelVersion);
      if (filters?.sportId) params.append('sportId', filters.sportId);
      if (filters?.marketType) params.append('marketType', filters.marketType);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`${supabaseUrl}/predictions/accuracy?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get accuracy tracking');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const { data } = await api.get('/predictions/accuracy', { params: filters });
      return data.data as PredictionAccuracyStats;
    }
  },

  /**
   * Get predictions for an event
   * Uses Supabase Edge Function in production, backend API in development
   */
  getEventPredictions: async (eventId: string): Promise<any[]> => {
    const supabaseFunctionsUrl = getSupabaseFunctionsUrl();
    const isProduction = import.meta.env.PROD || window.location.hostname === 'betapredit.com';
    const useSupabase = isSupabaseConfigured() && supabaseFunctionsUrl && isProduction;
    
    if (useSupabase) {
      // Try to get Supabase auth token first
      let token = await getSupabaseAuthToken();
      
      // Fallback to backend token if Supabase token not available
      if (!token) {
        token = useAuthStore.getState().token;
      }
      
      if (!token) {
        throw new Error('No authentication token');
      }

      const url = `${supabaseFunctionsUrl}/get-predictions?eventId=${eventId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || result.message || 'Failed to fetch predictions');
      }
      return result.data || [];
    } else {
      // Use backend API
      const { data } = await api.get(`/predictions/event/${eventId}`);
      return data.data || [];
    }
  },

  /**
   * Get basic prediction statistics
   * Uses Supabase Edge Function in production, backend API in development
   */
  getPredictionStats: async (modelVersion?: string): Promise<PredictionStats> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams();
      if (modelVersion) params.append('modelVersion', modelVersion);

      const response = await fetch(`${supabaseUrl}/predictions/stats?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get prediction stats');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const { data } = await api.get('/predictions/stats', {
        params: modelVersion ? { modelVersion } : {},
      });
      return data.data as PredictionStats;
    }
  },

  /**
   * Get prediction history (resolved predictions)
   * Uses Supabase Edge Function in production, backend API in development
   */
  getPredictionHistory: async (options?: {
    limit?: number;
    offset?: number;
    sportId?: string;
    marketType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.sportId) params.append('sportId', options.sportId);
      if (options?.marketType) params.append('marketType', options.marketType);
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);

      const response = await fetch(`${supabaseUrl}/predictions/history?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get prediction history');
      }

      const result = await response.json();
      return Array.isArray(result.data) ? result.data : [];
    } else {
      // Use local backend
      const { data } = await api.get('/predictions/history', {
        params: options || {},
      });
      return Array.isArray(data?.data) ? data.data : [];
    }
  },

  /**
   * Submit user feedback on a prediction
   * Uses Supabase Edge Function in production, backend API in development
   */
  submitFeedback: async (
    predictionId: string,
    feedback: {
      wasCorrect: boolean;
      userConfidence?: number;
      notes?: string;
    }
  ): Promise<any> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/predictions/${predictionId}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to submit feedback');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const { data } = await api.post(`/predictions/${predictionId}/feedback`, feedback);
      return data.data;
    }
  },

  /**
   * Get prediction with detailed factors explanation
   * Uses Supabase Edge Function in production, backend API in development
   */
  getPredictionFactors: async (predictionId: string): Promise<any> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/predictions/${predictionId}/factors`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get prediction factors');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const { data } = await api.get(`/predictions/${predictionId}/factors`);
      return data.data;
    }
  },

  /**
   * Generate predictions for upcoming events
   * Uses Supabase Edge Function in production, backend API in development
   */
  generatePredictions: async (): Promise<{ generated: number; updated: number; errors: number }> => {
    const supabaseFunctionsUrl = getSupabaseFunctionsUrl();
    // Use Edge Function if Supabase is configured and we have the URL
    // Check if we're in production OR if the backend URL is the production URL
    const isProduction = import.meta.env.PROD || window.location.hostname === 'betapredit.com';
    const useSupabase = isSupabaseConfigured() && supabaseFunctionsUrl && isProduction;
    
    console.log('generatePredictions config:', {
      supabaseConfigured: isSupabaseConfigured(),
      supabaseFunctionsUrl,
      isProduction,
      useSupabase,
      hostname: window.location.hostname,
    });
    
    if (useSupabase) {
      // Try to get Supabase auth token first
      let token = await getSupabaseAuthToken();
      
      // Fallback to backend token if Supabase token not available
      if (!token) {
        token = useAuthStore.getState().token;
      }
      
      if (!token) {
        throw new Error('No authentication token');
      }

      const url = `${supabaseFunctionsUrl}/generate-predictions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || result.message || 'Failed to generate predictions');
      }
      return result.data || { generated: 0, updated: 0, errors: 0 };
    } else {
      // Use backend API
      const { data } = await api.post('/predictions/generate', {});
      return data.data;
    }
  },
};

