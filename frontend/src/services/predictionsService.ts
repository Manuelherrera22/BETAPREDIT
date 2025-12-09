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
   */
  getAccuracyTracking: async (filters?: {
    modelVersion?: string;
    sportId?: string;
    marketType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PredictionAccuracyStats> => {
    const { data } = await api.get('/predictions/accuracy', { params: filters });
    return data.data as PredictionAccuracyStats;
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
      return result.data || [];
    } else {
      // Use backend API
      const { data } = await api.get(`/predictions/event/${eventId}`);
      return data.data || [];
    }
  },

  /**
   * Get basic prediction statistics
   */
  getPredictionStats: async (modelVersion?: string): Promise<PredictionStats> => {
    const { data } = await api.get('/predictions/stats', {
      params: modelVersion ? { modelVersion } : {},
    });
    return data.data as PredictionStats;
  },

  /**
   * Submit user feedback on a prediction
   */
  submitFeedback: async (
    predictionId: string,
    feedback: {
      wasCorrect: boolean;
      userConfidence?: number;
      notes?: string;
    }
  ): Promise<any> => {
    const { data } = await api.post(`/predictions/${predictionId}/feedback`, feedback);
    return data.data;
  },

  /**
   * Get prediction with detailed factors explanation
   */
  getPredictionFactors: async (predictionId: string): Promise<any> => {
    const { data } = await api.get(`/predictions/${predictionId}/factors`);
    return data.data;
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
      return result.data;
    } else {
      // Use backend API
      const { data } = await api.post('/predictions/generate', {});
      return data.data;
    }
  },
};

