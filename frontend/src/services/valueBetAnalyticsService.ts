/**
 * Value Bet Analytics Service
 * Handles value bet analytics API calls
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

interface AnalyticsOptions {
  startDate?: string;
  endDate?: string;
  sport?: string;
}

interface ValueBetAnalytics {
  totalDetected: number;
  totalTaken: number;
  totalExpired: number;
  totalInvalid: number;
  averageValue: number;
  highestValue: number;
  successRate: number;
  totalExpectedValue: number;
  bySport: Record<string, {
    detected: number;
    taken: number;
    averageValue: number;
  }>;
  byTimePeriod: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

class ValueBetAnalyticsService {
  /**
   * Get analytics
   */
  async getAnalytics(options: AnalyticsOptions = {}): Promise<ValueBetAnalytics> {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.sport) params.append('sport', options.sport);

      const response = await fetch(`${supabaseUrl}/value-bet-analytics?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get analytics');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.sport) params.append('sport', options.sport);

      const response = await api.get(`/value-bet-analytics?${params}`);
      return response.data.data;
    }
  }

  /**
   * Get top value bets
   */
  async getTopValueBets(limit: number = 10): Promise<any[]> {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/value-bet-analytics/top?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get top value bets');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const response = await api.get(`/value-bet-analytics/top?limit=${limit}`);
      return response.data.data;
    }
  }

  /**
   * Get trends
   */
  async getTrends(days: number = 30): Promise<any[]> {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/value-bet-analytics/trends?days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get trends');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const response = await api.get(`/value-bet-analytics/trends?days=${days}`);
      return response.data.data;
    }
  }

  /**
   * Track outcome
   */
  async trackOutcome(alertId: string, outcome: 'WON' | 'LOST' | 'VOID'): Promise<void> {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/value-bet-analytics/track/${alertId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outcome }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to track outcome');
      }
    } else {
      // Use local backend
      await api.post(`/value-bet-analytics/track/${alertId}`, { outcome });
    }
  }
}

export const valueBetAnalyticsService = new ValueBetAnalyticsService();
