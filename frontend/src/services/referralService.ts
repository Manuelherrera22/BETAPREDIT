/**
 * Referral Service
 * Handles API calls for referral system
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

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  rewardedReferrals: number;
  referrals: Array<{
    id: string;
    referredUser: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      subscriptionTier: string;
      createdAt: string;
    };
    status: string;
    rewardGranted: boolean;
    rewardType: string | null;
    createdAt: string;
    convertedAt: string | null;
  }>;
  rewards: {
    freeMonths?: number;
    premiumAccess?: boolean;
    discount?: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  totalReferrals: number;
  activeReferrals: number;
}

class ReferralService {
  /**
   * Get user's referral stats
   */
  async getMyReferrals(): Promise<ReferralStats> {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/referrals/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get referral stats');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const response = await api.get('/referrals/me');
      return response.data.data;
    }
  }

  /**
   * Get referral leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/referrals/leaderboard?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get leaderboard');
      }

      const result = await response.json();
      return result.data;
    } else {
      // Use local backend
      const response = await api.get(`/referrals/leaderboard?limit=${limit}`);
      return response.data.data;
    }
  }

  /**
   * Process referral code (for new users)
   */
  async processReferral(referralCode: string): Promise<void> {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${supabaseUrl}/referrals/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to process referral');
      }
    } else {
      // Use local backend
      await api.post('/referrals/process', { referralCode });
    }
  }

  /**
   * Get referral URL
   */
  getReferralUrl(referralCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?ref=${referralCode}`;
  }
}

export const referralService = new ReferralService();





