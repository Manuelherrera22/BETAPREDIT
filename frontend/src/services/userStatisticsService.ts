/**
 * User Statistics Service
 * Frontend service for managing user statistics
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

// Helper to make API calls (Edge Function or backend)
const makeApiCall = async (endpoint: string, params?: Record<string, string>) => {
  const supabaseFunctionsUrl = getSupabaseFunctionsUrl();
  const useSupabase = isSupabaseConfigured() && supabaseFunctionsUrl && import.meta.env.PROD;
  
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

    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = `${supabaseFunctionsUrl}/user-statistics${endpoint}${queryString ? `?${queryString}` : ''}`;
    
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
    return result;
  } else {
    // Use backend API
    const { data } = await api.get(endpoint, { params });
    return data;
  }
};

export interface UserStatistics {
  id: string;
  userId: string;
  period: string;
  periodStart: string;
  periodEnd?: string;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalVoids: number;
  totalStaked: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  roi: number;
  winRate: number;
  statsBySport: any;
  statsByPlatform: any;
  statsByMarket: any;
  valueBetsFound: number;
  valueBetsTaken: number;
  valueBetsWon: number;
  valueBetsROI: number;
  lastUpdated: string;
  createdAt: string;
}

export const userStatisticsService = {
  /**
   * Get current user statistics
   */
  getMyStatistics: async (period?: 'week' | 'month' | 'year' | 'monthly'): Promise<UserStatistics | null> => {
    try {
      // Map frontend period to backend period
      const periodMap: Record<string, string> = {
        week: 'weekly',
        month: 'monthly',
        year: 'all_time',
        monthly: 'monthly',
      };
      const backendPeriod = period ? periodMap[period] || 'all_time' : 'all_time';
      
      const result = await makeApiCall('', { period: backendPeriod });
      return result.data as UserStatistics;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return null;
    }
  },

  /**
   * Get statistics for a specific period
   */
  getStatisticsByPeriod: async (
    period: 'week' | 'month' | 'year',
    startDate?: string,
    endDate?: string
  ): Promise<UserStatistics[]> => {
    try {
      const params: Record<string, string> = { period };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const result = await makeApiCall('/by-period', params);
      // Asegurar que siempre retornamos un array
      return Array.isArray(result?.data) ? result.data : [];
    } catch (error) {
      console.error('Error fetching statistics by period:', error);
      return [];
    }
  },

  /**
   * Get statistics breakdown by sport
   */
  getStatisticsBySport: async (period?: 'week' | 'month' | 'year' | 'monthly'): Promise<any> => {
    try {
      // Map frontend period to backend period
      const periodMap: Record<string, string> = {
        week: 'weekly',
        month: 'monthly',
        year: 'all_time',
        monthly: 'monthly',
      };
      const backendPeriod = period ? periodMap[period] || 'all_time' : 'all_time';
      
      const result = await makeApiCall('', { period: backendPeriod });
      // Return statsBySport from the full statistics
      return result?.data?.statsBySport && typeof result.data.statsBySport === 'object' 
        ? result.data.statsBySport 
        : {};
    } catch (error) {
      console.error('Error fetching statistics by sport:', error);
      return {};
    }
  },

  /**
   * Get statistics breakdown by platform
   */
  getStatisticsByPlatform: async (period?: 'week' | 'month' | 'year' | 'monthly'): Promise<any> => {
    try {
      // Map frontend period to backend period
      const periodMap: Record<string, string> = {
        week: 'weekly',
        month: 'monthly',
        year: 'all_time',
        monthly: 'monthly',
      };
      const backendPeriod = period ? periodMap[period] || 'all_time' : 'all_time';
      
      const result = await makeApiCall('', { period: backendPeriod });
      // Return statsByPlatform from the full statistics
      return result?.data?.statsByPlatform && typeof result.data.statsByPlatform === 'object' 
        ? result.data.statsByPlatform 
        : {};
    } catch (error) {
      console.error('Error fetching statistics by platform:', error);
      return {};
    }
  },
};

