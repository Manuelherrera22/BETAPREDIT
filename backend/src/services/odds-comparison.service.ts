import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { getTheOddsAPIService } from './integrations/the-odds-api.service';

interface OddsByPlatform {
  [platform: string]: number;
}

interface UpdateOddsComparisonData {
  eventId: string;
  marketId: string;
  selection: string;
  oddsByPlatform: OddsByPlatform;
}

class OddsComparisonService {
  /**
   * Fetch odds from The Odds API and update comparison
   */
  async fetchAndUpdateComparison(
    sport: string,
    eventId: string,
    market: string = 'h2h'
  ) {
    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        throw new AppError('The Odds API service not configured', 503);
      }

      // Get comparison from The Odds API
      const comparison = await theOddsAPI.compareOdds(sport, eventId, market);

      if (!comparison) {
        throw new AppError('Event not found in The Odds API', 404);
      }

      // Update database for each selection
      const updates = [];

      for (const [selection, bestOdds] of Object.entries(comparison.comparisons)) {
        // Convert to our format
        const oddsByPlatform: OddsByPlatform = {};
        bestOdds.allOdds.forEach((odd) => {
          oddsByPlatform[odd.bookmaker] = odd.odds;
        });

        // Find or create event in our database
        let dbEvent = await prisma.event.findFirst({
          where: {
            externalId: eventId,
          },
        });

        if (!dbEvent) {
          // Try to find by team names
          dbEvent = await prisma.event.findFirst({
            where: {
              OR: [
                {
                  homeTeam: { contains: comparison.event.home_team, mode: 'insensitive' },
                },
                {
                  awayTeam: { contains: comparison.event.away_team, mode: 'insensitive' },
                },
              ],
            },
          });
        }

        if (!dbEvent) {
          logger.warn(`Event ${eventId} not found in database, skipping comparison update`);
          continue;
        }

        // Find or create market
        let dbMarket = await prisma.market.findFirst({
          where: {
            eventId: dbEvent.id,
            type: this.mapMarketType(market),
          },
        });

        if (!dbMarket) {
          dbMarket = await prisma.market.create({
            data: {
              eventId: dbEvent.id,
              sportId: dbEvent.sportId,
              type: this.mapMarketType(market),
              name: this.getMarketName(market),
            },
          });
        }

        // Update comparison
        const update = await prisma.oddsComparison.upsert({
          where: {
            eventId_marketId_selection: {
              eventId: dbEvent.id,
              marketId: dbMarket.id,
              selection,
            },
          },
          update: {
            oddsByPlatform: oddsByPlatform as any,
            bestOdds: bestOdds.bestOdds,
            bestPlatform: bestOdds.bestBookmaker,
            averageOdds: bestOdds.averageOdds,
            maxDifference: bestOdds.maxDifference,
            lastUpdated: new Date(),
          },
          create: {
            eventId: dbEvent.id,
            marketId: dbMarket.id,
            selection,
            oddsByPlatform: oddsByPlatform as any,
            bestOdds: bestOdds.bestOdds,
            bestPlatform: bestOdds.bestBookmaker,
            averageOdds: bestOdds.averageOdds,
            maxDifference: bestOdds.maxDifference,
          },
        });

        updates.push(update);
      }

      logger.info(`Updated ${updates.length} odds comparisons from The Odds API`);
      return updates;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error fetching and updating odds comparison:', error);
      throw new AppError('Failed to fetch and update odds comparison', 500);
    }
  }

  /**
   * Map The Odds API market to our MarketType enum
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
   * Get market name from market key
   */
  private getMarketName(market: string): string {
    const mapping: Record<string, string> = {
      h2h: 'Match Winner',
      spreads: 'Handicap',
      totals: 'Over/Under',
    };
    return mapping[market] || market;
  }

  /**
   * Update or create odds comparison for an event/market/selection
   */
  async updateComparison(data: UpdateOddsComparisonData) {
    try {
      const platforms = Object.keys(data.oddsByPlatform);
      const odds = Object.values(data.oddsByPlatform);

      if (platforms.length === 0) {
        throw new AppError('At least one platform odds required', 400);
      }

      const bestOdds = Math.max(...odds);
      const bestPlatform = platforms[odds.indexOf(bestOdds)];
      const averageOdds = odds.reduce((sum, odd) => sum + odd, 0) / odds.length;
      const maxDifference = Math.max(...odds) - Math.min(...odds);

      const comparison = await prisma.oddsComparison.upsert({
        where: {
          eventId_marketId_selection: {
            eventId: data.eventId,
            marketId: data.marketId,
            selection: data.selection,
          },
        },
        update: {
          oddsByPlatform: data.oddsByPlatform as any,
          bestOdds,
          bestPlatform,
          averageOdds,
          maxDifference,
          lastUpdated: new Date(),
        },
        create: {
          eventId: data.eventId,
          marketId: data.marketId,
          selection: data.selection,
          oddsByPlatform: data.oddsByPlatform as any,
          bestOdds,
          bestPlatform,
          averageOdds,
          maxDifference,
        },
        include: {
          event: {
            include: {
              sport: true,
            },
          },
          market: true,
        },
      });

      logger.info(
        `Odds comparison updated: ${data.eventId}/${data.marketId}/${data.selection}`
      );
      return comparison;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating odds comparison:', error);
      throw new AppError('Failed to update odds comparison', 500);
    }
  }

  /**
   * Get odds comparison for an event/market/selection
   */
  async getComparison(eventId: string, marketId: string, selection: string) {
    const comparison = await prisma.oddsComparison.findUnique({
      where: {
        eventId_marketId_selection: {
          eventId,
          marketId,
          selection,
        },
      },
      include: {
        event: {
          include: {
            sport: true,
          },
        },
        market: true,
      },
    });

    if (!comparison) {
      throw new AppError('Odds comparison not found', 404);
    }

    return comparison;
  }

  /**
   * Get all comparisons for an event
   */
  async getEventComparisons(eventId: string) {
    const comparisons = await prisma.oddsComparison.findMany({
      where: { eventId },
      include: {
        market: true,
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    });

    return comparisons;
  }

  /**
   * Find best odds across all platforms for a selection
   */
  async findBestOdds(eventId: string, marketId: string, selection: string) {
    const comparison = await prisma.oddsComparison.findUnique({
      where: {
        eventId_marketId_selection: {
          eventId,
          marketId,
          selection,
        },
      },
    });

    if (!comparison) {
      return null;
    }

    return {
      bestOdds: comparison.bestOdds,
      bestPlatform: comparison.bestPlatform,
      allOdds: comparison.oddsByPlatform as OddsByPlatform,
      averageOdds: comparison.averageOdds,
      maxDifference: comparison.maxDifference,
    };
  }

  /**
   * Get comparisons with significant differences (arbitrage opportunities)
   */
  async findArbitrageOpportunities(minDifference: number = 0.1) {
    const comparisons = await prisma.oddsComparison.findMany({
      where: {
        maxDifference: { gte: minDifference },
      },
      include: {
        event: {
          include: {
            sport: true,
          },
        },
        market: true,
      },
      orderBy: {
        maxDifference: 'desc',
      },
      take: 50,
    });

    return comparisons;
  }
}

export const oddsComparisonService = new OddsComparisonService();

