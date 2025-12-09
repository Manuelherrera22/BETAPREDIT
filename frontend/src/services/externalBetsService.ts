/**
 * External Bets Service
 * Frontend service for managing external bets
 */

import api from './api';

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
    const { data } = await api.post('/external-bets', betData);
    return data.data as ExternalBet;
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
    const { data } = await api.get('/external-bets', {
      params: filters,
    });
    return Array.isArray(data?.data) ? data.data : [];
  },

  /**
   * Resolve a bet (mark as WON/LOST/VOID)
   */
  resolveBet: async (betId: string, result: 'WON' | 'LOST' | 'VOID', actualWin?: number): Promise<ExternalBet> => {
    const { data } = await api.patch(`/external-bets/${betId}/result`, {
      result,
      actualWin,
    });
    return data.data as ExternalBet;
  },

  /**
   * Delete a bet
   */
  deleteBet: async (betId: string): Promise<void> => {
    await api.delete(`/external-bets/${betId}`);
  },

  /**
   * Get bet statistics
   */
  getBetStats: async (period?: 'week' | 'month' | 'year' | 'all'): Promise<any> => {
    const { data } = await api.get('/external-bets/stats', {
      params: { period: period || 'all' },
    });
    return data.data;
  },
};

