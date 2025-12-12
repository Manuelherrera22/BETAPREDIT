/**
 * Value Bet Alerts Service
 * Frontend service for managing value bet alerts
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

export interface ValueBetAlert {
  id: string;
  userId?: string;
  eventId: string;
  marketId: string;
  selection: string;
  bookmakerOdds: number;
  bookmakerPlatform: string;
  predictedProbability: number;
  expectedValue: number;
  valuePercentage: number;
  confidence: number;
  status: 'ACTIVE' | 'EXPIRED' | 'TAKEN' | 'INVALID';
  notifiedAt?: string;
  clickedAt?: string;
  betPlaced: boolean;
  factors?: any;
  createdAt: string;
  expiresAt: string;
  event?: {
    id: string;
    name: string;
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    sport?: {
      name: string;
    };
  };
  market?: {
    id: string;
    type: string;
    name: string;
  };
}

export const valueBetAlertsService = {
  /**
   * Get all value bet alerts for the current user
   */
  getMyAlerts: async (filters?: {
    status?: string;
    minValue?: number;
    sportId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ValueBetAlert[]> => {
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
        if (filters?.minValue) params.set('minValue', filters.minValue.toString());
        if (filters?.sportId) params.set('sportId', filters.sportId);
        if (filters?.limit) params.set('limit', filters.limit.toString());
        if (filters?.offset) params.set('offset', filters.offset.toString());

        const response = await fetch(`${supabaseUrl}/value-bet-alerts/my-alerts?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to fetch alerts');
        }

        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
      }

      // Fallback to backend API in development
      const { data } = await api.get('/value-bet-alerts/my-alerts', {
        params: filters,
      });
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching value bet alerts:', error);
      return [];
    }
  },

  /**
   * Get a specific alert by ID
   */
  getAlert: async (alertId: string): Promise<ValueBetAlert> => {
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

      const response = await fetch(`${supabaseUrl}/value-bet-alerts/${alertId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch alert');
      }

      const result = await response.json();
      return result.data as ValueBetAlert;
    }

    // Fallback to backend API in development
    const { data } = await api.get(`/value-bet-alerts/${alertId}`);
    return data.data as ValueBetAlert;
  },

  /**
   * Mark alert as clicked
   */
  markAsClicked: async (alertId: string): Promise<void> => {
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

      const response = await fetch(`${supabaseUrl}/value-bet-alerts/${alertId}/click`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to mark alert as clicked');
      }

      return;
    }

    // Fallback to backend API in development
    await api.patch(`/value-bet-alerts/${alertId}/click`);
  },

  /**
   * Mark alert as bet placed
   */
  markAsBetPlaced: async (alertId: string, externalBetId?: string): Promise<void> => {
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

      const response = await fetch(`${supabaseUrl}/value-bet-alerts/${alertId}/taken`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ externalBetId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to mark alert as bet placed');
      }

      return;
    }

    // Fallback to backend API in development
    await api.patch(`/value-bet-alerts/${alertId}/bet-placed`, {
      externalBetId,
    });
  },
};

