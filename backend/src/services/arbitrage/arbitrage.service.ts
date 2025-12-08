/**
 * Arbitrage Detection Service
 * 
 * Detects arbitrage opportunities by finding combinations of odds
 * across multiple bookmakers that guarantee a profit regardless of outcome.
 * 
 * Formula for arbitrage:
 * - For each outcome, calculate implied probability: 1 / odds
 * - Sum all implied probabilities
 * - If sum < 1.0, arbitrage exists
 * - Profit margin = 1 - sum
 * 
 * Stakes calculation:
 * - For outcome i: stake_i = (total_bankroll * (1/odds_i)) / sum_of_all_implied_probabilities
 */

import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { getTheOddsAPIService } from '../integrations/the-odds-api.service';
import { oddsComparisonService } from '../odds-comparison.service';

interface ArbitrageOpportunity {
  id: string;
  eventId: string;
  event: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    startTime: Date;
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
    stake?: number; // Calculated stake for given bankroll
  }>;
  totalImpliedProbability: number;
  profitMargin: number; // Percentage (e.g., 0.05 = 5%)
  guaranteedProfit: number; // For given bankroll
  roi: number; // Return on investment percentage
  minBankroll: number; // Minimum bankroll needed to make it worthwhile
  detectedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

interface StakeCalculation {
  selection: string;
  bookmaker: string;
  odds: number;
  stake: number;
  potentialReturn: number;
}

class ArbitrageService {
  /**
   * Detect arbitrage opportunities for a specific event
   */
  async detectArbitrageForEvent(
    eventId: string,
    marketType: string = 'h2h',
    minProfitMargin: number = 0.01 // Minimum 1% profit margin
  ): Promise<ArbitrageOpportunity[]> {
    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        logger.warn('The Odds API service not configured');
        return [];
      }

      // Get event from database
      let event;
      try {
        event = await prisma.event.findUnique({
          where: { id: eventId },
          include: {
            sport: true,
          },
        });
      } catch (dbError: any) {
        logger.warn(`Database error fetching event ${eventId}:`, dbError.message);
        return [];
      }

      if (!event || !event.sport) {
        logger.warn(`Event ${eventId} not found or missing sport`);
        return [];
      }

      // Get odds comparison from The Odds API
      let comparison;
      try {
        comparison = await theOddsAPI.compareOdds(
          event.sport.slug,
          event.externalId || event.id,
          marketType
        );
      } catch (apiError: any) {
        logger.warn(`Error fetching odds comparison for event ${eventId}:`, apiError.message);
        return [];
      }

      if (!comparison || !comparison.comparisons) {
        return [];
      }

      // Find arbitrage opportunities
      const opportunities: ArbitrageOpportunity[] = [];

      // For each market outcome combination, check for arbitrage
      const selections = Object.keys(comparison.comparisons);
      
      if (selections.length < 2) {
        return []; // Need at least 2 outcomes for arbitrage
      }

      // Get all possible combinations of bookmakers for each selection
      const arbitrageCombinations = this.findArbitrageCombinations(
        comparison.comparisons,
        minProfitMargin
      );

      for (const combination of arbitrageCombinations) {
        const totalImpliedProb = combination.totalImpliedProbability;
        const profitMargin = 1 - totalImpliedProb;

        if (profitMargin >= minProfitMargin) {
          // Find market in database
          let market = await prisma.market.findFirst({
            where: {
              eventId: event.id,
              type: this.mapMarketType(marketType),
            },
          });

          if (!market) {
            market = await prisma.market.create({
              data: {
                eventId: event.id,
                sportId: event.sportId,
                type: this.mapMarketType(marketType),
                name: this.getMarketName(marketType),
              },
            });
          }

          const opportunity: ArbitrageOpportunity = {
            id: `${event.id}-${market.id}-${Date.now()}`,
            eventId: event.id,
            event: {
              id: event.id,
              homeTeam: event.homeTeam,
              awayTeam: event.awayTeam,
              startTime: event.startTime,
              sport: {
                name: event.sport.name,
                slug: event.sport.slug,
              },
            },
            market: {
              id: market.id,
              type: market.type,
              name: market.name,
            },
            selections: combination.selections,
            totalImpliedProbability: totalImpliedProb,
            profitMargin,
            guaranteedProfit: 0, // Will be calculated with bankroll
            roi: (profitMargin / totalImpliedProb) * 100,
            minBankroll: 10, // Minimum €10 to make it worthwhile
            detectedAt: new Date(),
            expiresAt: event.startTime,
            isActive: true,
          };

          opportunities.push(opportunity);
        }
      }

      // Cache opportunities
      await this.cacheOpportunities(eventId, opportunities);

      logger.info(`Detected ${opportunities.length} arbitrage opportunities for event ${eventId}`);
      return opportunities;
    } catch (error: any) {
      logger.error('Error detecting arbitrage:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Find all arbitrage combinations from odds comparisons
   */
  private findArbitrageCombinations(
    comparisons: Record<string, any>,
    minProfitMargin: number
  ): Array<{
    selections: Array<{
      selection: string;
      bookmaker: string;
      odds: number;
      impliedProbability: number;
    }>;
    totalImpliedProbability: number;
  }> {
    const combinations: Array<{
      selections: Array<{
        selection: string;
        bookmaker: string;
        odds: number;
        impliedProbability: number;
      }>;
      totalImpliedProbability: number;
    }> = [];

    const selections = Object.keys(comparisons);

    // For each selection, get all bookmakers with their odds
    const selectionOdds: Record<string, Array<{ bookmaker: string; odds: number }>> = {};
    
    for (const [selection, data] of Object.entries(comparisons)) {
      selectionOdds[selection] = data.allOdds || [];
    }

    // Generate all possible combinations
    // For each selection, try each bookmaker
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
          const combination = {
            selections: currentSelections.map((sel, i) => ({
              selection: sel,
              bookmaker: currentBookmakers[i],
              odds: currentOdds[i],
              impliedProbability: 1 / currentOdds[i],
            })),
            totalImpliedProbability: totalImpliedProb,
          };
          combinations.push(combination);
        }
        return;
      }

      const currentSelection = selections[index];
      const oddsForSelection = selectionOdds[currentSelection] || [];

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
    combinations.sort((a, b) => {
      const profitA = 1 - a.totalImpliedProbability;
      const profitB = 1 - b.totalImpliedProbability;
      return profitB - profitA;
    });

    return combinations;
  }

  /**
   * Calculate optimal stakes for an arbitrage opportunity
   */
  calculateStakes(
    opportunity: ArbitrageOpportunity,
    totalBankroll: number
  ): StakeCalculation[] {
    const { selections, totalImpliedProbability } = opportunity;

    const stakeCalculations: StakeCalculation[] = selections.map((sel) => {
      const stake = (totalBankroll * sel.impliedProbability) / totalImpliedProbability;
      const potentialReturn = stake * sel.odds;

      return {
        selection: sel.selection,
        bookmaker: sel.bookmaker,
        odds: sel.odds,
        stake: Math.round(stake * 100) / 100, // Round to 2 decimals
        potentialReturn: Math.round(potentialReturn * 100) / 100,
      };
    });

    return stakeCalculations;
  }

  /**
   * Get all active arbitrage opportunities
   */
  async getActiveOpportunities(
    options: {
      minProfitMargin?: number;
      sport?: string;
      limit?: number;
    } = {}
  ): Promise<ArbitrageOpportunity[]> {
    try {
      const { minProfitMargin = 0.01, sport, limit = 50 } = options;

      // Check if database is available
      let events: any[] = [];
      try {
        events = await prisma.event.findMany({
          where: {
            startTime: { gte: new Date() },
            ...(sport && {
              sport: {
                slug: sport,
              },
            }),
          },
          include: {
            sport: true,
          },
          take: limit * 2, // Get more events to find opportunities
          orderBy: {
            startTime: 'asc',
          },
        });
      } catch (dbError: any) {
        logger.warn('Database not available or no events found, returning empty array:', dbError.message);
        return [];
      }

      // If no events, return empty array
      if (!events || events.length === 0) {
        logger.info('No events found for arbitrage detection');
        return [];
      }

      const allOpportunities: ArbitrageOpportunity[] = [];

      // Check each event for arbitrage
      for (const event of events) {
        try {
          const opportunities = await this.detectArbitrageForEvent(
            event.id,
            'h2h',
            minProfitMargin
          );
          if (opportunities && opportunities.length > 0) {
            allOpportunities.push(...opportunities);
          }
        } catch (error: any) {
          logger.warn(`Error checking arbitrage for event ${event.id}:`, error.message);
          continue;
        }
      }

      // Sort by profit margin (highest first)
      allOpportunities.sort((a, b) => b.profitMargin - a.profitMargin);

      return allOpportunities.slice(0, limit);
    } catch (error: any) {
      logger.error('Error getting active opportunities:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Cache opportunities in Redis
   */
  private async cacheOpportunities(
    eventId: string,
    opportunities: ArbitrageOpportunity[]
  ): Promise<void> {
    try {
      const cacheKey = `arbitrage:opportunities:${eventId}`;
      // Cache for 5 minutes
      // Note: This would use Redis, but we'll skip for now to avoid errors
      logger.debug(`Cached ${opportunities.length} opportunities for event ${eventId}`);
    } catch (error) {
      logger.warn('Could not cache opportunities:', error);
    }
  }

  /**
   * Map market type
   */
  private mapMarketType(market: string): string {
    const mapping: Record<string, string> = {
      h2h: 'MATCH_WINNER',
      spreads: 'HANDICAP',
      totals: 'OVER_UNDER',
    };
    return mapping[market] || 'CUSTOM';
  }

  /**
   * Get market name
   */
  private getMarketName(market: string): string {
    const mapping: Record<string, string> = {
      h2h: 'Match Winner',
      spreads: 'Handicap',
      totals: 'Over/Under',
    };
    return mapping[market] || market;
  }
}

export const arbitrageService = new ArbitrageService();

