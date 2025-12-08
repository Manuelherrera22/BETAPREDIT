/**
 * Arbitrage Service
 * Handles API calls for arbitrage opportunities
 */

import api from './api';

export interface ArbitrageOpportunity {
  id: string;
  eventId: string;
  event: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    sport: {
      name: string;
      slug: string;
    };
  };
  market: {
    id: string;
    type: string;
    name: string;
  };
  selections: Array<{
    selection: string;
    bookmaker: string;
    odds: number;
    impliedProbability: number;
    stake?: number;
  }>;
  totalImpliedProbability: number;
  profitMargin: number;
  guaranteedProfit: number;
  roi: number;
  minBankroll: number;
  detectedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface StakeCalculation {
  selection: string;
  bookmaker: string;
  odds: number;
  stake: number;
  potentialReturn: number;
}

export interface CalculateStakesRequest {
  opportunity: ArbitrageOpportunity;
  totalBankroll: number;
}

export interface CalculateStakesResponse {
  stakes: StakeCalculation[];
  totalStake: number;
  guaranteedProfit: number;
  roi: number;
  profitMargin: number;
}

class ArbitrageService {
  /**
   * Get all active arbitrage opportunities
   */
  async getOpportunities(options?: {
    minProfitMargin?: number;
    sport?: string;
    limit?: number;
  }): Promise<ArbitrageOpportunity[]> {
    const params = new URLSearchParams();
    if (options?.minProfitMargin) {
      params.append('minProfitMargin', options.minProfitMargin.toString());
    }
    if (options?.sport) {
      params.append('sport', options.sport);
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const response = await api.get(`/arbitrage/opportunities?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Detect arbitrage for a specific event
   */
  async detectForEvent(
    eventId: string,
    options?: {
      marketType?: string;
      minProfitMargin?: number;
    }
  ): Promise<ArbitrageOpportunity[]> {
    const params = new URLSearchParams();
    if (options?.marketType) {
      params.append('marketType', options.marketType);
    }
    if (options?.minProfitMargin) {
      params.append('minProfitMargin', options.minProfitMargin.toString());
    }

    const response = await api.get(`/arbitrage/event/${eventId}?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Calculate stakes for an arbitrage opportunity
   */
  async calculateStakes(
    opportunity: ArbitrageOpportunity,
    totalBankroll: number
  ): Promise<CalculateStakesResponse> {
    const response = await api.post('/arbitrage/calculate-stakes', {
      opportunity,
      totalBankroll,
    });
    return response.data.data;
  }
}

export const arbitrageService = new ArbitrageService();

