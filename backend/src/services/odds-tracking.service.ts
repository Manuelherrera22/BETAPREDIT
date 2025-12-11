/**
 * Odds Tracking Service
 * Automatically tracks odds changes from The Odds API
 * Detects significant changes and generates alerts
 */

import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { getTheOddsAPIService } from './integrations/the-odds-api.service';
import { oddsService } from './odds.service';
import { webSocketService } from './websocket.service';
import { valueBetDetectionService } from './value-bet-detection.service';

interface OddsChange {
  eventId: string;
  marketId: string;
  selection: string;
  oldOdds: number;
  newOdds: number;
  changePercent: number;
  bookmaker: string;
  isSignificant: boolean;
}

class OddsTrackingService {
  private trackingInterval: NodeJS.Timeout | null = null;
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 0.05; // 5% change
  private readonly TRACKING_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Start automatic odds tracking for upcoming events
   */
  async startTracking() {
    if (this.trackingInterval) {
      logger.warn('Odds tracking already started');
      return;
    }

    logger.info('🚀 Starting automatic odds tracking...');

    // Run immediately
    await this.trackOddsChanges();

    // Then run every 5 minutes
    this.trackingInterval = setInterval(async () => {
      try {
        await this.trackOddsChanges();
      } catch (error: any) {
        logger.error('Error in odds tracking interval:', error);
      }
    }, this.TRACKING_INTERVAL);

    logger.info(`✅ Odds tracking started (interval: ${this.TRACKING_INTERVAL / 1000}s)`);
  }

  /**
   * Stop automatic odds tracking
   */
  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      logger.info('⏹️ Odds tracking stopped');
    }
  }

  /**
   * Track odds changes for all upcoming events
   */
  async trackOddsChanges() {
    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        logger.debug('The Odds API not available, skipping odds tracking');
        return;
      }

      // Get upcoming events in next 24 hours
      const now = new Date();
      const maxTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingEvents = await prisma.event.findMany({
        where: {
          status: 'SCHEDULED',
          startTime: {
            gte: now,
            lte: maxTime,
          },
          externalId: { not: null },
        },
        include: {
          sport: true,
          markets: {
            where: { type: 'MATCH_WINNER', isActive: true },
            include: {
              odds: {
                where: { isActive: true },
              },
            },
          },
        },
        take: 50, // Limit to avoid rate limits
      });

      logger.debug(`Tracking odds for ${upcomingEvents.length} events`);

      let totalChanges = 0;
      let significantChanges = 0;

      for (const event of upcomingEvents) {
        try {
          const changes = await this.trackEventOdds(event);
          totalChanges += changes.length;
          significantChanges += changes.filter(c => c.isSignificant).length;
        } catch (error: any) {
          logger.warn(`Error tracking odds for event ${event.id}:`, error.message);
        }
      }

      if (totalChanges > 0) {
        logger.info(`📊 Tracked ${totalChanges} odds changes (${significantChanges} significant)`);
      }
    } catch (error: any) {
      logger.error('Error tracking odds changes:', error);
    }
  }

  /**
   * Track odds changes for a specific event
   */
  async trackEventOdds(event: any): Promise<OddsChange[]> {
    const changes: OddsChange[] = [];
    const theOddsAPI = getTheOddsAPIService();

    if (!theOddsAPI || !event.externalId) {
      return changes;
    }

    try {
      // Get current odds from The Odds API
      const sportKey = event.sport.slug || 'soccer_epl';
      const oddsEvents = await theOddsAPI.getOdds(sportKey, {
        regions: ['us', 'uk', 'eu'],
        markets: ['h2h'],
      });

      const currentOddsEvent = oddsEvents.find(
        (oe: any) => oe.id === event.externalId ||
        (oe.home_team === event.homeTeam && oe.away_team === event.awayTeam)
      );

      if (!currentOddsEvent || !currentOddsEvent.bookmakers) {
        return changes;
      }

      // Get market
      const market = event.markets?.find((m: any) => m.type === 'MATCH_WINNER');
      if (!market) {
        return changes;
      }

      // Get current odds from database
      const currentDbOdds = await prisma.odds.findMany({
        where: {
          eventId: event.id,
          marketId: market.id,
          isActive: true,
        },
      });

      // Process each bookmaker
      for (const bookmaker of currentOddsEvent.bookmakers) {
        const h2hMarket = bookmaker.markets?.find((m: any) => m.key === 'h2h');
        if (!h2hMarket || !h2hMarket.outcomes) continue;

        for (const outcome of h2hMarket.outcomes) {
          const selection = this.normalizeSelection(outcome.name, {
            home_team: event.homeTeam,
            away_team: event.awayTeam,
          });

          const newOdds = outcome.price;
          if (!newOdds || newOdds <= 0) continue;

          // Find matching odds in database
          const dbOdd = currentDbOdds.find(
            (o) => o.selection === selection && o.source === 'THE_ODDS_API'
          );

          if (dbOdd) {
            const changePercent = Math.abs((newOdds - dbOdd.decimal) / dbOdd.decimal);
            const isSignificant = changePercent >= this.SIGNIFICANT_CHANGE_THRESHOLD;

            if (changePercent > 0.01) { // Track any change > 1%
              changes.push({
                eventId: event.id,
                marketId: market.id,
                selection,
                oldOdds: dbOdd.decimal,
                newOdds,
                changePercent,
                bookmaker: bookmaker.title || bookmaker.key || 'Unknown',
                isSignificant,
              });

              // Update odds in database
              await this.updateOddsWithHistory(
                event.id,
                market.id,
                selection,
                newOdds,
                bookmaker.title || bookmaker.key || 'THE_ODDS_API'
              );

              // If significant change, generate alert
              if (isSignificant) {
                await this.handleSignificantChange(
                  event,
                  market,
                  selection,
                  dbOdd.decimal,
                  newOdds,
                  changePercent
                );
              }
            }
          } else {
            // New odds, create it
            await this.createNewOdds(
              event.id,
              market.id,
              selection,
              newOdds,
              bookmaker.title || bookmaker.key || 'THE_ODDS_API'
            );
          }
        }
      }

      return changes;
    } catch (error: any) {
      logger.error(`Error tracking odds for event ${event.id}:`, error);
      return changes;
    }
  }

  /**
   * Update odds and save to history
   */
  private async updateOddsWithHistory(
    eventId: string,
    marketId: string,
    selection: string,
    newOdds: number,
    source: string
  ) {
    try {
      // Deactivate old odds
      await prisma.odds.updateMany({
        where: {
          eventId,
          marketId,
          selection,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Get old odds for history
      const oldOdds = await prisma.odds.findFirst({
        where: {
          eventId,
          marketId,
          selection,
          isActive: false,
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Create new odds
      const newOdd = await prisma.odds.create({
        data: {
          eventId,
          marketId,
          selection,
          decimal: newOdds,
          probability: 1 / newOdds,
          source: 'THE_ODDS_API',
        },
      });

      // Save to history
      await prisma.oddsHistory.create({
        data: {
          eventId,
          marketId,
          selection,
          decimal: newOdds,
        },
      });

      // Emit WebSocket update
      webSocketService.emitOddsUpdate(eventId, {
        marketId,
        selection,
        oldOdds: oldOdds?.decimal || newOdds,
        newOdds,
        changePercent: oldOdds ? Math.abs((newOdds - oldOdds.decimal) / oldOdds.decimal) : 0,
        source,
      });

      logger.debug(`Odds updated: ${eventId}/${marketId}/${selection} = ${newOdds}`);
    } catch (error: any) {
      logger.error('Error updating odds with history:', error);
    }
  }

  /**
   * Create new odds
   */
  private async createNewOdds(
    eventId: string,
    marketId: string,
    selection: string,
    odds: number,
    source: string
  ) {
    try {
      await prisma.odds.create({
        data: {
          eventId,
          marketId,
          selection,
          decimal: odds,
          probability: 1 / odds,
          source: 'THE_ODDS_API',
        },
      });

      await prisma.oddsHistory.create({
        data: {
          eventId,
          marketId,
          selection,
          decimal: odds,
        },
      });
    } catch (error: any) {
      logger.error('Error creating new odds:', error);
    }
  }

  /**
   * Handle significant odds change
   */
  private async handleSignificantChange(
    event: any,
    market: any,
    selection: string,
    oldOdds: number,
    newOdds: number,
    changePercent: number
  ) {
    try {
      logger.info(
        `🚨 Significant odds change detected: ${event.homeTeam} vs ${event.awayTeam} - ${selection}: ${oldOdds} → ${newOdds} (${(changePercent * 100).toFixed(1)}%)`
      );

      // Emit WebSocket alert
      webSocketService.emitOddsAlert({
        eventId: event.id,
        eventName: `${event.homeTeam} vs ${event.awayTeam}`,
        marketId: market.id,
        selection,
        oldOdds,
        newOdds,
        changePercent,
        message: `Significant odds change: ${selection} changed from ${oldOdds.toFixed(2)} to ${newOdds.toFixed(2)} (${(changePercent * 100).toFixed(1)}%)`,
      });

      // Check for value bet opportunities
      const eventWithPredictions = await prisma.event.findUnique({
        where: { id: event.id },
        include: {
          Prediction: {
            where: {
              selection,
              wasCorrect: null,
            },
          },
        },
      });

      if (eventWithPredictions && eventWithPredictions.Prediction.length > 0) {
        const prediction = eventWithPredictions.Prediction[0];
        const predictedProb = prediction.predictedProbability;
        const impliedProb = 1 / newOdds;
        const value = predictedProb - impliedProb;

        if (value > 0.05) { // 5% value
          logger.info(`💰 Value bet opportunity detected: ${selection} (value: ${(value * 100).toFixed(1)}%)`);
          
          // Trigger value bet detection
          await valueBetDetectionService.detectValueBetsForEvent(eventWithPredictions, {
            minValue: 0.05,
            autoCreateAlerts: true,
          });
        }
      }
    } catch (error: any) {
      logger.error('Error handling significant change:', error);
    }
  }

  /**
   * Normalize selection name
   */
  private normalizeSelection(outcomeName: string, event: { home_team: string; away_team: string }): string {
    const nameLower = outcomeName.toLowerCase();
    const homeLower = event.home_team.toLowerCase();
    const awayLower = event.away_team.toLowerCase();

    if (nameLower.includes(homeLower) || nameLower === 'home' || nameLower === '1') {
      return event.home_team;
    }
    if (nameLower.includes(awayLower) || nameLower === 'away' || nameLower === '2') {
      return event.away_team;
    }
    if (nameLower.includes('draw') || nameLower === 'x' || nameLower === 'tie') {
      return 'Draw';
    }

    return outcomeName;
  }

  /**
   * Get odds history chart data for an event
   */
  async getOddsHistoryChart(eventId: string, marketId: string, selection: string) {
    const history = await prisma.oddsHistory.findMany({
      where: {
        eventId,
        marketId,
        selection,
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: 100, // Last 100 changes
    });

    return history.map((h) => ({
      timestamp: h.timestamp.toISOString(),
      odds: h.decimal,
      probability: 1 / h.decimal,
    }));
  }
}

export const oddsTrackingService = new OddsTrackingService();

