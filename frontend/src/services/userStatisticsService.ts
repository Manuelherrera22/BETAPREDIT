/**
 * User Statistics Service
 * Frontend service for managing user statistics
 */

import api from './api';

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
  getMyStatistics: async (period?: 'week' | 'month' | 'year'): Promise<UserStatistics | null> => {
    try {
      const { data } = await api.get('/statistics/my-statistics', {
        params: { period },
      });
      return data.data as UserStatistics;
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
      const { data } = await api.get('/statistics/by-period', {
        params: { period, startDate, endDate },
      });
      return data.data as UserStatistics[];
    } catch (error) {
      console.error('Error fetching statistics by period:', error);
      return [];
    }
  },

  /**
   * Get statistics breakdown by sport
   */
  getStatisticsBySport: async (period?: 'week' | 'month' | 'year'): Promise<any> => {
    try {
      const { data } = await api.get('/statistics/by-sport', {
        params: { period },
      });
      return data.data;
    } catch (error) {
      console.error('Error fetching statistics by sport:', error);
      return {};
    }
  },

  /**
   * Get statistics breakdown by platform
   */
  getStatisticsByPlatform: async (period?: 'week' | 'month' | 'year'): Promise<any> => {
    try {
      const { data } = await api.get('/statistics/by-platform', {
        params: { period },
      });
      return data.data;
    } catch (error) {
      console.error('Error fetching statistics by platform:', error);
      return {};
    }
  },
};

