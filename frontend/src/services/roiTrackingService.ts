/**
 * ROI Tracking Service
 * Frontend service for ROI tracking
 */

import api from './api';

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
    const { data } = await api.get('/roi-tracking', {
      params: { period: period || 'all_time' },
    });
    return data.data as ROITrackingData;
  },

  /**
   * Get ROI history for charts
   */
  getROIHistory: async (period?: 'week' | 'month' | 'year'): Promise<ROIHistoryPoint[]> => {
    const { data } = await api.get('/roi-tracking/history', {
      params: { period: period || 'month' },
    });
    return Array.isArray(data?.data) ? data.data : [];
  },

  /**
   * Get top value bets by ROI
   */
  getTopValueBets: async (limit: number = 10): Promise<TopValueBet[]> => {
    const { data } = await api.get('/roi-tracking/top-value-bets', {
      params: { limit },
    });
    return Array.isArray(data?.data) ? data.data : [];
  },
};





