/**
 * User Preferences Service
 * Frontend service for managing user preferences
 * Uses Supabase Edge Function in production, backend API in development
 */

import api from './api';

// Helper to get Supabase Functions URL
const getSupabaseFunctionsUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/functions/v1`;
};

// Helper to get auth token
const getSupabaseAuthToken = async (): Promise<string | null> => {
  try {
    const { supabase } = await import('../config/supabase');
    if (!supabase) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export interface ValueBetPreferences {
  minValue?: number; // Minimum value percentage (0-1, e.g., 0.05 = 5%)
  maxEvents?: number; // Maximum events to check per scan
  sports?: string[]; // Preferred sports
  leagues?: string[]; // Preferred leagues
  platforms?: string[]; // Preferred bookmaker platforms
  autoCreateAlerts?: boolean; // Auto-create alerts when value bets detected
  notificationThreshold?: number; // Only notify if value >= this (0-1)
  minConfidence?: number; // Minimum confidence level (0-1)
  maxOdds?: number; // Maximum odds to consider
  minOdds?: number; // Minimum odds to consider
  timeRange?: {
    start?: string; // HH:mm format
    end?: string; // HH:mm format
    timezone?: string;
  };
  marketTypes?: string[]; // Preferred market types
}

export interface UserPreferences {
  valueBetPreferences?: ValueBetPreferences;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  preferredSports?: string[];
  timezone?: string;
}

export const userPreferencesService = {
  /**
   * Get user preferences
   */
  getPreferences: async (): Promise<UserPreferences> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/user-preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get preferences');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const { data } = await api.get('/user/preferences');
      return data.data as UserPreferences;
    }
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/user-preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update preferences');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const { data } = await api.put('/user/preferences', preferences);
      return data.data as UserPreferences;
    }
  },

  /**
   * Get value bet preferences only
   */
  getValueBetPreferences: async (): Promise<ValueBetPreferences> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/user-preferences/value-bets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get value bet preferences');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const { data } = await api.get('/user/preferences/value-bets');
      return data.data as ValueBetPreferences;
    }
  },

  /**
   * Update value bet preferences only
   */
  updateValueBetPreferences: async (preferences: Partial<ValueBetPreferences>): Promise<ValueBetPreferences> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/user-preferences/value-bets`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update value bet preferences');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const { data } = await api.put('/user/preferences/value-bets', preferences);
      return data.data as ValueBetPreferences;
    }
  },
};
