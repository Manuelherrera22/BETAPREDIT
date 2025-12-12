/**
 * Referral Service
 * Handles API calls for referral system
 */

import api from './api';

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
    const response = await api.get('/referrals/me');
    return response.data.data;
  }

  /**
   * Get referral leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const response = await api.get(`/referrals/leaderboard?limit=${limit}`);
    return response.data.data;
  }

  /**
   * Process referral code (for new users)
   */
  async processReferral(referralCode: string): Promise<void> {
    await api.post('/referrals/process', { referralCode });
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




