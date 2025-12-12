/**
 * ROI Tracking Service
 * Frontend service for ROI tracking
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

export interface ROITrackingData {
  totalROI: number;
  valueBetsROI: number;
  normalBetsROI: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalStaked: number;
  totalWon: number;
  netProfit: number;
  comparison?: {
    before: number | null;
    after: number;
    improvement: number;
    betsBefore: number;
    betsAfter: number;
  };
  valueBetsMetrics: {
    taken: number;
    won: number;
    lost: number;
    winRate: number;
    roi: number;
    totalStaked: number;
    totalWon: number;
    netProfit: number;
  };
}

export interface ROIHistoryPoint {
  date: string;
  roi: number;
  netProfit: number;
  bets: number;
}

export interface TopValueBet {
  id: string;
  event: string;
  sport: string;
  selection: string;
  odds: number;
  stake: number;
  result: string;
  actualWin?: number;
  roi: number;
  valuePercentage: number;
  betPlacedAt: string;
}

export const roiTrackingService = {
  /**
   * Get ROI tracking for current user
   */
  getROITracking: async (period?: 'week' | 'month' | 'year' | 'all_time'): Promise<ROITrackingData> => {
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
        if (period) params.set('period', period);

        const response = await fetch(`${supabaseUrl}/roi-tracking?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to fetch ROI tracking');
        }

        const result = await response.json();
        return result.data as ROITrackingData;
      }

      // Fallback to backend API in development
      const { data } = await api.get('/roi-tracking', {
        params: { period: period || 'all_time' },
      });
      return data.data as ROITrackingData;
    } catch (error) {
      console.error('Error fetching ROI tracking:', error);
      throw error;
    }
  },

  /**
   * Get ROI history for charts
   */
  getROIHistory: async (period?: 'week' | 'month' | 'year'): Promise<ROIHistoryPoint[]> => {
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
        if (period) params.set('period', period);

        const response = await fetch(`${supabaseUrl}/roi-tracking/history?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to fetch ROI history');
        }

        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
      }

      // Fallback to backend API in development
      const { data } = await api.get('/roi-tracking/history', {
        params: { period: period || 'month' },
      });
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching ROI history:', error);
      return [];
    }
  },

  /**
   * Get top value bets by ROI
   */
  getTopValueBets: async (limit: number = 10): Promise<TopValueBet[]> => {
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
        params.set('limit', limit.toString());

        const response = await fetch(`${supabaseUrl}/roi-tracking/top-value-bets?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to fetch top value bets');
        }

        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
      }

      // Fallback to backend API in development
      const { data } = await api.get('/roi-tracking/top-value-bets', {
        params: { limit },
      });
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching top value bets:', error);
      return [];
    }
  },
};





