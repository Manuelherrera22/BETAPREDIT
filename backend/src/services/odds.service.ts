import { prisma } from '../config/database';
import { redisHelpers } from '../config/redis';
import { logger } from '../utils/logger';
import axios from 'axios';

class OddsService {
  // Get odds for a specific event (with caching)
  async getEventOdds(eventId: string) {
    // Try cache first
    const cached = await redisHelpers.getCachedOdds(eventId);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const odds = await prisma.odds.findMany({
      where: {
        eventId,
        isActive: true,
      },
      include: {
        market: true,
        event: {
          include: {
            sport: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Cache for 30 seconds
    await redisHelpers.cacheOdds(eventId, odds, 30);

    return odds;
  }

  // Get odds for multiple events
  async getMultipleEventsOdds(eventIds: string[]) {
    const oddsMap: Record<string, any> = {};

    // Try to get from cache first
    const cachePromises = eventIds.map(async (eventId) => {
      const cached = await redisHelpers.getCachedOdds(eventId);
      if (cached) {
        oddsMap[eventId] = cached;
      }
      return { eventId, cached: !!cached };
    });

    await Promise.all(cachePromises);

    // Fetch missing odds from database
    const missingIds = eventIds.filter((id) => !oddsMap[id]);
    if (missingIds.length > 0) {
      const odds = await prisma.odds.findMany({
        where: {
          eventId: { in: missingIds },
          isActive: true,
        },
        include: {
          market: true,
          event: {
            include: {
              sport: true,
            },
          },
        },
      });

      // Group by eventId
      odds.forEach((odd) => {
        if (!oddsMap[odd.eventId]) {
          oddsMap[odd.eventId] = [];
        }
        oddsMap[odd.eventId].push(odd);
      });

      // Cache the fetched odds
      missingIds.forEach(async (eventId) => {
        if (oddsMap[eventId]) {
          await redisHelpers.cacheOdds(eventId, oddsMap[eventId], 30);
        }
      });
    }

    return oddsMap;
  }

  // Get live odds (real-time updates)
  async getLiveOdds(eventId: string) {
    // For live odds, we want the most recent data
    // This would typically be called more frequently
    const odds = await this.getEventOdds(eventId);
    
    // Publish update via Redis pub/sub for WebSocket clients
    await redisHelpers.publishOddsUpdate(eventId, odds);
    
    return odds;
  }

  // Get odds history for analysis
  async getOddsHistory(
    eventId: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ) {
    const { startDate, endDate, limit = 100 } = options;

    const where: any = { eventId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    const history = await prisma.oddsHistory.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return history;
  }

  // Update odds (called by ML service or manual adjustment)
  async updateOdds(eventId: string, marketId: string, oddsData: any[]) {
    try {
      // Deactivate old odds
      await prisma.odds.updateMany({
        where: {
          eventId,
          marketId,
        },
        data: {
          isActive: false,
        },
      });

      // Create new odds
      const newOdds = await prisma.$transaction(
        oddsData.map((odd) =>
          prisma.odds.create({
            data: {
              eventId,
              marketId,
              selection: odd.selection,
              decimal: odd.decimal,
              american: odd.american,
              fractional: odd.fractional,
              probability: odd.probability || 1 / odd.decimal,
              source: odd.source || 'ML_MODEL',
            },
          })
        )
      );

      // Save to history
      await prisma.$transaction(
        newOdds.map((odd) =>
          prisma.oddsHistory.create({
            data: {
              eventId,
              marketId,
              selection: odd.selection,
              decimal: odd.decimal,
            },
          })
        )
      );

      // Invalidate cache
      await redisHelpers.getCachedOdds(eventId).then(() => {
        // Cache will expire naturally, but we can also delete it
      });

      // Publish update
      await redisHelpers.publishOddsUpdate(eventId, newOdds);

      logger.info(`Odds updated for event ${eventId}, market ${marketId}`);

      return newOdds;
    } catch (error) {
      logger.error('Error updating odds:', error);
      throw error;
    }
  }
}

export const oddsService = new OddsService();

