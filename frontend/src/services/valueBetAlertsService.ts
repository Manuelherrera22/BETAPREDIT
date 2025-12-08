/**
 * Value Bet Alerts Service
 * Frontend service for managing value bet alerts
 */

import api from './api';

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
  }): Promise<ValueBetAlert[]> => {
    try {
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
    const { data } = await api.get(`/value-bet-alerts/${alertId}`);
    return data.data as ValueBetAlert;
  },

  /**
   * Mark alert as clicked
   */
  markAsClicked: async (alertId: string): Promise<void> => {
    await api.patch(`/value-bet-alerts/${alertId}/click`);
  },

  /**
   * Mark alert as bet placed
   */
  markAsBetPlaced: async (alertId: string, externalBetId?: string): Promise<void> => {
    await api.patch(`/value-bet-alerts/${alertId}/bet-placed`, {
      externalBetId,
    });
  },
};

