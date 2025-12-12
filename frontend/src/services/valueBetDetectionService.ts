/**
 * Value Bet Detection Service
 * Frontend service for automatic value bet detection
 */

import api from './api';

export interface DetectedValueBet {
  eventId: string;
  eventName: string;
  selection: string;
  bookmaker: string;
  odds: number;
  impliedProbability: number;
  predictedProbability: number;
  valuePercentage: number;
  expectedValue: number;
}

export const valueBetDetectionService = {
  /**
   * Detect value bets for a specific sport
   */
  detectForSport: async (
    sport: string,
    options?: {
      minValue?: number;
      maxEvents?: number;
      autoCreateAlerts?: boolean;
    }
  ): Promise<DetectedValueBet[]> => {
    try {
      const { data } = await api.get(`/value-bet-detection/sport/${sport}`, {
        params: options,
      });
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error('Error detecting value bets:', error);
      return [];
    }
  },

  /**
   * Scan all sports for value bets
   */
  scanAll: async (options?: {
    minValue?: number;
    maxEvents?: number;
    autoCreateAlerts?: boolean;
  }): Promise<DetectedValueBet[]> => {
    try {
      const { data } = await api.get('/value-bet-detection/scan-all', {
        params: options,
      });
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error('Error scanning for value bets:', error);
      return [];
    }
  },
};





