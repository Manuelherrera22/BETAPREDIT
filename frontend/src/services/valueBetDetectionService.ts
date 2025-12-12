/**
 * Value Bet Detection Service
 * Frontend service for automatic value bet detection
 * Uses Supabase Edge Functions in production, backend API in development
 */

import api from './api';
import { isSupabaseConfigured } from '../config/supabase';

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

export interface DetectedValueBet {
  eventId: string;
  eventName: string;
  selection: string;
  bookmaker: string;
  odds: number;
  impliedProbability: number;
  predictedProbability: number;
  valuePercentage: number;
  expectedValue: number;
}

export const valueBetDetectionService = {
  /**
   * Detect value bets for a specific sport
   */
  detectForSport: async (
    sport: string,
    options?: {
      minValue?: number;
      maxEvents?: number;
      autoCreateAlerts?: boolean;
    }
  ): Promise<DetectedValueBet[]> => {
    try {
      // Use Supabase Edge Function in production
      if (isSupabaseConfigured() && import.meta.env.PROD) {
        const supabaseUrl = getSupabaseFunctionsUrl();
        if (!supabaseUrl) {
          throw new Error('Supabase not configured');
        }

        const token = await getSupabaseAuthToken();
        if (!token) {
          throw new Error('No authentication token available. Please log in.');
        }

        const params = new URLSearchParams();
        if (options?.minValue) params.set('minValue', options.minValue.toString());
        if (options?.maxEvents) params.set('maxEvents', options.maxEvents.toString());
        if (options?.autoCreateAlerts) params.set('autoCreateAlerts', 'true');

        const response = await fetch(`${supabaseUrl}/value-bet-detection/sport/${sport}?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to detect value bets');
        }

        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
      }

      // Fallback to backend API in development
      const { data } = await api.get(`/value-bet-detection/sport/${sport}`, {
        params: options,
      });
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error('Error detecting value bets:', error);
      return [];
    }
  },

  /**
   * Scan all sports for value bets
   */
  scanAll: async (options?: {
    minValue?: number;
    maxEvents?: number;
    autoCreateAlerts?: boolean;
  }): Promise<DetectedValueBet[]> => {
    try {
      // Use Supabase Edge Function in production
      if (isSupabaseConfigured() && import.meta.env.PROD) {
        const supabaseUrl = getSupabaseFunctionsUrl();
        if (!supabaseUrl) {
          throw new Error('Supabase not configured');
        }

        const token = await getSupabaseAuthToken();
        if (!token) {
          throw new Error('No authentication token available. Please log in.');
        }

        const params = new URLSearchParams();
        if (options?.minValue) params.set('minValue', options.minValue.toString());
        if (options?.maxEvents) params.set('maxEvents', options.maxEvents.toString());
        if (options?.autoCreateAlerts) params.set('autoCreateAlerts', 'true');

        const response = await fetch(`${supabaseUrl}/value-bet-detection/scan-all?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to scan for value bets');
        }

        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
      }

      // Fallback to backend API in development
      const { data } = await api.get('/value-bet-detection/scan-all', {
        params: options,
      });
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error('Error scanning for value bets:', error);
      return [];
    }
  },
};





