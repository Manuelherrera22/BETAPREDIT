/**
 * Arbitrage Service
 * Handles API calls for arbitrage opportunities
 * Can work with backend API or calculate directly from The Odds API data
 */

import api from './api';
import { theOddsApiService } from './theOddsApiService';
import { isSupabaseConfigured } from '../config/supabase';

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
   * Calculate arbitrage opportunities from odds comparison data
   */
  private calculateArbitrageFromComparison(
    event: any,
    comparisons: Record<string, any>,
    minProfitMargin: number = 0.01
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const selections = Object.keys(comparisons);

    if (selections.length < 2) {
      return []; // Need at least 2 outcomes for arbitrage
    }

    // Generate all possible combinations of bookmakers
    const generateCombinations = (
      currentSelections: string[],
      currentBookmakers: string[],
      currentOdds: number[],
      index: number
    ) => {
      if (index === selections.length) {
        // Calculate total implied probability
        const totalImpliedProb = currentOdds.reduce((sum, odd) => sum + 1 / odd, 0);
        const profitMargin = 1 - totalImpliedProb;

        if (profitMargin >= minProfitMargin) {
          const opportunity: ArbitrageOpportunity = {
            id: `${event.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            eventId: event.id,
            event: {
              id: event.id,
              homeTeam: event.home_team || 'Unknown',
              awayTeam: event.away_team || 'Unknown',
              startTime: event.commence_time || new Date().toISOString(),
              sport: {
                name: event.sport_title || 'Unknown',
                slug: event.sport_key || 'unknown',
              },
            },
            market: {
              id: `${event.id}-h2h`,
              type: 'MATCH_WINNER',
              name: 'Match Winner',
            },
            selections: currentSelections.map((sel, i) => ({
              selection: sel,
              bookmaker: currentBookmakers[i],
              odds: currentOdds[i],
              impliedProbability: 1 / currentOdds[i],
            })),
            totalImpliedProbability: totalImpliedProb,
            profitMargin,
            guaranteedProfit: 0,
            roi: (profitMargin / totalImpliedProb) * 100,
            minBankroll: 10,
            detectedAt: new Date().toISOString(),
            expiresAt: event.commence_time || new Date().toISOString(),
            isActive: true,
          };
          opportunities.push(opportunity);
        }
        return;
      }

      const currentSelection = selections[index];
      const oddsForSelection = comparisons[currentSelection]?.allOdds || [];

      for (const oddData of oddsForSelection) {
        generateCombinations(
          [...currentSelections, currentSelection],
          [...currentBookmakers, oddData.bookmaker],
          [...currentOdds, oddData.odds],
          index + 1
        );
      }
    };

    generateCombinations([], [], [], 0);

    // Sort by profit margin (highest first)
    opportunities.sort((a, b) => b.profitMargin - a.profitMargin);

    return opportunities;
  }

  /**
   * Get all active arbitrage opportunities
   * Works with backend API or calculates directly from The Odds API
   */
  async getOpportunities(options?: {
    minProfitMargin?: number;
    sport?: string;
    limit?: number;
  }): Promise<ArbitrageOpportunity[]> {
    const { minProfitMargin = 0.01, sport = 'soccer_epl', limit = 50 } = options || {};

    // Try backend first, fallback to direct calculation
    try {
      const params = new URLSearchParams();
      if (minProfitMargin) {
        params.append('minProfitMargin', minProfitMargin.toString());
      }
      if (sport) {
        params.append('sport', sport);
      }
      if (limit) {
        params.append('limit', limit.toString());
      }

      const response = await api.get(`/arbitrage/opportunities?${params.toString()}`);
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (error: any) {
      // Backend not available, calculate directly from The Odds API
      console.log('Backend not available, calculating arbitrage directly from The Odds API');
    }

    // Fallback: Calculate directly from The Odds API
    try {
      const allOpportunities: ArbitrageOpportunity[] = [];

      // Get events from The Odds API
      const events = await theOddsApiService.getOdds(sport, {
        regions: ['us', 'uk', 'eu'],
        markets: ['h2h'],
        oddsFormat: 'decimal',
      });

      // Check each event for arbitrage
      for (const event of events.slice(0, limit * 2)) {
        try {
          const comparison = await theOddsApiService.compareOdds(sport, event.id, 'h2h');
          if (comparison && comparison.comparisons) {
            const opportunities = this.calculateArbitrageFromComparison(
              event,
              comparison.comparisons,
              minProfitMargin
            );
            allOpportunities.push(...opportunities);
          }
        } catch (error: any) {
          console.warn(`Error checking arbitrage for event ${event.id}:`, error.message);
          continue;
        }
      }

      // Sort by profit margin and return
      allOpportunities.sort((a, b) => b.profitMargin - a.profitMargin);
      return allOpportunities.slice(0, limit);
    } catch (error: any) {
      console.error('Error calculating arbitrage opportunities:', error);
      return [];
    }
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
   * Can work with backend API or calculate directly
   */
  async calculateStakes(
    opportunity: ArbitrageOpportunity,
    totalBankroll: number
  ): Promise<CalculateStakesResponse> {
    // Try backend first
    try {
      const response = await api.post('/arbitrage/calculate-stakes', {
        opportunity,
        totalBankroll,
      });
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (error: any) {
      // Backend not available, calculate directly
      console.log('Backend not available, calculating stakes directly');
    }

    // Fallback: Calculate directly
    const { selections, totalImpliedProbability } = opportunity;
    const stakes: StakeCalculation[] = selections.map((sel) => {
      const stake = (totalBankroll * sel.impliedProbability) / totalImpliedProbability;
      const potentialReturn = stake * sel.odds;

      return {
        selection: sel.selection,
        bookmaker: sel.bookmaker,
        odds: sel.odds,
        stake: Math.round(stake * 100) / 100,
        potentialReturn: Math.round(potentialReturn * 100) / 100,
      };
    });

    const totalStake = stakes.reduce((sum, s) => sum + s.stake, 0);
    const guaranteedProfit = totalStake * opportunity.profitMargin;

    return {
      stakes,
      totalStake: Math.round(totalStake * 100) / 100,
      guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
      roi: opportunity.roi,
      profitMargin: opportunity.profitMargin * 100,
    };
  }
}

export const arbitrageService = new ArbitrageService();

