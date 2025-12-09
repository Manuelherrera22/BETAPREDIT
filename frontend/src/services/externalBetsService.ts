/**
 * External Bets Service
 * Frontend service for managing external bets
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

// Helper to make API calls (Edge Function or backend)
const makeApiCall = async (method: string, endpoint: string, data?: any) => {
  const supabaseFunctionsUrl = getSupabaseFunctionsUrl();
  const useSupabase = isSupabaseConfigured() && supabaseFunctionsUrl && import.meta.env.PROD;
  
  if (useSupabase) {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('No authentication token');
    }

    const url = `${supabaseFunctionsUrl}/external-bets${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
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
    if (method === 'GET') {
      const { data: responseData } = await api.get(endpoint, { params: data });
      return responseData;
    } else if (method === 'POST') {
      const { data: responseData } = await api.post(endpoint, data);
      return responseData;
    } else if (method === 'PUT' || method === 'PATCH') {
      const { data: responseData } = await api[method.toLowerCase() as 'put' | 'patch'](endpoint, data);
      return responseData;
    } else if (method === 'DELETE') {
      await api.delete(endpoint);
      return { success: true };
    }
    throw new Error(`Unsupported method: ${method}`);
  }
};

export interface ExternalBet {
  id: string;
  userId: string;
  eventId?: string;
  externalEventId?: string;
  platform: string;
  platformBetId?: string;
  platformUrl?: string;
  marketType: string;
  selection: string;
  odds: number;
  stake: number;
  currency: string;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'CANCELLED' | 'PARTIAL_WIN';
  result?: 'WON' | 'LOST' | 'VOID';
  actualWin?: number;
  settledAt?: string;
  notes?: string;
  tags: string[];
  metadata?: any;
  betPlacedAt: string;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    name: string;
    homeTeam: string;
    awayTeam: string;
    sport?: {
      name: string;
    };
  };
  valueBetAlert?: {
    id: string;
    valuePercentage: number;
  };
}

export interface RegisterExternalBetData {
  eventId?: string;
  externalEventId?: string;
  platform: string;
  platformBetId?: string;
  platformUrl?: string;
  marketType: string;
  selection: string;
  odds: number;
  stake: number;
  currency?: string;
  betPlacedAt: string;
  notes?: string;
  tags?: string[];
  metadata?: any;
  valueBetAlertId?: string; // Para vincular con value bet alert
}

export const externalBetsService = {
  /**
   * Register a new external bet
   */
  registerBet: async (betData: RegisterExternalBetData): Promise<ExternalBet> => {
    const result = await makeApiCall('POST', '', betData);
    return result.data as ExternalBet;
  },

  /**
   * Get user's external bets
   */
  getMyBets: async (filters?: {
    status?: string;
    platform?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ExternalBet[]> => {
    // Build query string for filters
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';
    
    const result = await makeApiCall('GET', endpoint);
    return Array.isArray(result?.data) ? result.data : [];
  },

  /**
   * Resolve a bet (mark as WON/LOST/VOID)
   */
  resolveBet: async (betId: string, result: 'WON' | 'LOST' | 'VOID', actualWin?: number): Promise<ExternalBet> => {
    const result_data = await makeApiCall('PUT', `/${betId}`, {
      result,
      actualWin,
    });
    return result_data.data as ExternalBet;
  },

  /**
   * Delete a bet
   */
  deleteBet: async (betId: string): Promise<void> => {
    await makeApiCall('DELETE', `/${betId}`);
  },

  /**
   * Get bet statistics
   */
  getBetStats: async (period?: 'week' | 'month' | 'year' | 'all'): Promise<any> => {
    const queryString = period ? `?period=${period}` : '';
    const result = await makeApiCall('GET', `/stats${queryString}`);
    return result.data;
  },
};

