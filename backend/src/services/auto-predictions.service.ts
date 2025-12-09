/**
 * Auto Predictions Service
 * Automatically generates predictions for all upcoming events
 * This is the CRITICAL missing piece for real-time operation
 */

import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { improvedPredictionService } from './improved-prediction.service';
import { predictionsService } from './predictions.service';
import { getTheOddsAPIService } from './integrations/the-odds-api.service';
import { eventSyncService } from './event-sync.service';

class AutoPredictionsService {
  private readonly MODEL_VERSION = 'v2.0-auto';
  private readonly HOURS_AHEAD = 48; // Generate predictions for events in next 48 hours

  /**
   * Generate predictions for all upcoming events
   * This is the main method that should run every 10 minutes
   */
  async generatePredictionsForUpcomingEvents() {
    try {
      logger.info('Starting automatic prediction generation...');

      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        logger.warn('The Odds API service not configured, skipping prediction generation');
        return { generated: 0, updated: 0, errors: 0 };
      }

      // Get all active sports
      const sports = await theOddsAPI.getSports();
      const activeSports = sports.filter((s: any) => s.active);

      let totalGenerated = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      // Process each sport
      for (const sport of activeSports.slice(0, 10)) { // Limit to 10 sports to avoid rate limits
        try {
          const result = await this.generatePredictionsForSport(sport.key);
          totalGenerated += result.generated;
          totalUpdated += result.updated;
          totalErrors += result.errors;
        } catch (error: any) {
          logger.error(`Error generating predictions for sport ${sport.key}:`, error.message);
          totalErrors++;
        }
      }

      logger.info(
        `Prediction generation completed: ${totalGenerated} generated, ${totalUpdated} updated, ${totalErrors} errors`
      );

      return {
        generated: totalGenerated,
        updated: totalUpdated,
        errors: totalErrors,
      };
    } catch (error: any) {
      logger.error('Error in generatePredictionsForUpcomingEvents:', error);
      throw error;
    }
  }

  /**
   * Generate predictions for a specific sport
   */
  private async generatePredictionsForSport(sportKey: string) {
    try {
      logger.info(`Generating predictions for sport: ${sportKey}`);

      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        return { generated: 0, updated: 0, errors: 0 };
      }

      // Get upcoming events for this sport
      const oddsEvents = await theOddsAPI.getOdds(sportKey, {
        regions: ['us', 'uk', 'eu'],
        markets: ['h2h'],
        oddsFormat: 'decimal',
      });

      if (!oddsEvents || oddsEvents.length === 0) {
        logger.info(`No events found for sport ${sportKey}`);
        return { generated: 0, updated: 0, errors: 0 };
      }

      // Filter events in next 48 hours
      const now = new Date();
      const maxTime = new Date(now.getTime() + this.HOURS_AHEAD * 60 * 60 * 1000);
      const upcomingEvents = oddsEvents.filter((event: any) => {
        const eventTime = new Date(event.commence_time);
        return eventTime > now && eventTime <= maxTime;
      });

      logger.info(`Found ${upcomingEvents.length} upcoming events for ${sportKey}`);

      let generated = 0;
      let updated = 0;
      let errors = 0;

      // Process each event (limit to 30 to avoid rate limits)
      for (const oddsEvent of upcomingEvents.slice(0, 30)) {
        try {
          const result = await this.generatePredictionsForEvent(oddsEvent, sportKey);
          generated += result.generated;
          updated += result.updated;
        } catch (error: any) {
          logger.warn(`Error processing event ${oddsEvent.id}:`, error.message);
          errors++;
        }
      }

      return { generated, updated, errors };
    } catch (error: any) {
      logger.error(`Error generating predictions for sport ${sportKey}:`, error);
      return { generated: 0, updated: 0, errors: 1 };
    }
  }

  /**
   * Generate predictions for a single event
   */
  private async generatePredictionsForEvent(oddsEvent: any, sportKey: string) {
    try {
      // Sync event to database first
      const syncedEvent = await eventSyncService.syncEventFromTheOddsAPI(
        oddsEvent.id,
        sportKey,
        oddsEvent.sport_title || 'Soccer',
        oddsEvent.home_team,
        oddsEvent.away_team,
        oddsEvent.commence_time
      );

      // Find or create market
      let market = await prisma.market.findFirst({
        where: {
          eventId: syncedEvent.id,
          type: 'MATCH_WINNER',
        },
      });

      if (!market) {
        market = await prisma.market.create({
          data: {
            eventId: syncedEvent.id,
            sportId: syncedEvent.sportId,
            type: 'MATCH_WINNER',
            name: 'Match Winner',
            isActive: true,
          },
        });
      }

      // Get all bookmaker odds for this event
      if (!oddsEvent.bookmakers || oddsEvent.bookmakers.length === 0) {
        return { generated: 0, updated: 0 };
      }

      // Extract all selections and their odds
      const selections: Record<string, number[]> = {};

      for (const bookmaker of oddsEvent.bookmakers) {
        if (!bookmaker.markets || bookmaker.markets.length === 0) continue;

        const h2hMarket = bookmaker.markets.find((m: any) => m.key === 'h2h');
        if (!h2hMarket || !h2hMarket.outcomes) continue;

        for (const outcome of h2hMarket.outcomes) {
          const selection = this.normalizeSelection(outcome.name, oddsEvent);
          if (!selections[selection]) {
            selections[selection] = [];
          }
          if (outcome.price) {
            selections[selection].push(outcome.price);
          }
        }
      }

      let generated = 0;
      let updated = 0;

      // Generate predictions for each selection
      for (const [selection, oddsArray] of Object.entries(selections)) {
        if (oddsArray.length === 0) continue;

        try {
          // Calculate prediction using improved prediction service
          const prediction = await improvedPredictionService.calculatePredictedProbability(
            syncedEvent.id,
            selection,
            oddsArray
          );

          // Check if prediction already exists
          const existing = await prisma.prediction.findFirst({
            where: {
              eventId: syncedEvent.id,
              marketId: market.id,
              selection: selection,
            },
          });

          if (existing) {
            // Update existing prediction if odds changed significantly (>5%)
            const avgOdds = oddsArray.reduce((sum, odd) => sum + odd, 0) / oddsArray.length;
            const existingFactors = (existing.factors || {}) as any;
            const existingAvgOdds = existingFactors.marketAverage
              ? 1 / existingFactors.marketAverage
              : null;

            if (existingAvgOdds && Math.abs(avgOdds - existingAvgOdds) / existingAvgOdds > 0.05) {
              // Odds changed more than 5%, update prediction
              await predictionsService.createPrediction({
                eventId: syncedEvent.id,
                marketId: market.id,
                selection: selection,
                predictedProbability: prediction.predictedProbability,
                confidence: prediction.confidence,
                modelVersion: this.MODEL_VERSION,
                factors: prediction.factors,
              });
              updated++;
            }
          } else {
            // Create new prediction
            await predictionsService.createPrediction({
              eventId: syncedEvent.id,
              marketId: market.id,
              selection: selection,
              predictedProbability: prediction.predictedProbability,
              confidence: prediction.confidence,
              modelVersion: this.MODEL_VERSION,
              factors: prediction.factors,
            });
            generated++;
          }
        } catch (error: any) {
          logger.warn(`Error generating prediction for ${selection}:`, error.message);
        }
      }

      return { generated, updated };
    } catch (error: any) {
      logger.error(`Error generating predictions for event ${oddsEvent.id}:`, error);
      throw error;
    }
  }

  /**
   * Normalize selection name (Home, Away, Draw)
   */
  private normalizeSelection(outcomeName: string, oddsEvent: any): string {
    // Check if it's the home team
    if (
      outcomeName === oddsEvent.home_team ||
      outcomeName.toLowerCase() === 'home' ||
      outcomeName.toLowerCase() === '1'
    ) {
      return 'Home';
    }

    // Check if it's the away team
    if (
      outcomeName === oddsEvent.away_team ||
      outcomeName.toLowerCase() === 'away' ||
      outcomeName.toLowerCase() === '2'
    ) {
      return 'Away';
    }

    // Check if it's a draw
    if (
      outcomeName.toLowerCase() === 'draw' ||
      outcomeName.toLowerCase() === 'x' ||
      outcomeName.toLowerCase() === 'tie'
    ) {
      return 'Draw';
    }

    // Return as-is if no match
    return outcomeName;
  }

  /**
   * Update predictions for events with changed odds
   * Should run every 5 minutes
   */
  async updatePredictionsForChangedOdds() {
    try {
      logger.info('Starting prediction update for changed odds...');

      // Get events with predictions in next 6 hours
      const now = new Date();
      const maxTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);

      const eventsWithPredictions = await prisma.event.findMany({
        where: {
          status: 'SCHEDULED',
          startTime: {
            gte: now,
            lte: maxTime,
          },
          Prediction: {
            some: {},
          },
        },
        include: {
          Prediction: {
            where: {
              wasCorrect: null, // Only unresolved predictions
            },
          },
          sport: true,
        },
        take: 50, // Limit to 50 events to avoid rate limits
      });

      logger.info(`Found ${eventsWithPredictions.length} events with predictions to check`);

      let updated = 0;
      let errors = 0;

      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        logger.warn('The Odds API service not configured');
        return { updated: 0, errors: 0 };
      }

      for (const event of eventsWithPredictions) {
        try {
          // Get current odds from The Odds API
          const sportKey = event.sport.slug || 'soccer_epl';
          const oddsEvents = await theOddsAPI.getOdds(sportKey, {
            regions: ['us', 'uk'],
            markets: ['h2h'],
          });

          const currentOddsEvent = oddsEvents.find(
            (oe: any) =>
              (oe.home_team === event.homeTeam && oe.away_team === event.awayTeam) ||
              oe.id === event.externalId
          );

          if (!currentOddsEvent || !currentOddsEvent.bookmakers) {
            continue;
          }

          // Check each prediction and update if odds changed
          for (const prediction of event.Prediction) {
            const market = await prisma.market.findUnique({
              where: { id: prediction.marketId },
            });

            if (!market || market.type !== 'MATCH_WINNER') continue;

            // Get current odds for this selection
            const currentOdds: number[] = [];
            for (const bookmaker of currentOddsEvent.bookmakers) {
              const h2hMarket = bookmaker.markets?.find((m: any) => m.key === 'h2h');
              if (h2hMarket?.outcomes) {
                const outcome = h2hMarket.outcomes.find((o: any) => {
                  const normalized = this.normalizeSelection(o.name, currentOddsEvent);
                  return normalized === prediction.selection;
                });
                if (outcome?.price) {
                  currentOdds.push(outcome.price);
                }
              }
            }

            if (currentOdds.length === 0) continue;

            // Compare with previous odds
            const factors = (prediction.factors || {}) as any;
            const previousAvgOdds = factors.marketAverage ? 1 / factors.marketAverage : null;
            const currentAvgOdds = currentOdds.reduce((sum, odd) => sum + odd, 0) / currentOdds.length;

            if (previousAvgOdds && Math.abs(currentAvgOdds - previousAvgOdds) / previousAvgOdds > 0.05) {
              // Odds changed more than 5%, recalculate prediction
              const newPrediction = await improvedPredictionService.calculatePredictedProbability(
                event.id,
                prediction.selection,
                currentOdds
              );

              await predictionsService.createPrediction({
                eventId: event.id,
                marketId: prediction.marketId,
                selection: prediction.selection,
                predictedProbability: newPrediction.predictedProbability,
                confidence: newPrediction.confidence,
                modelVersion: this.MODEL_VERSION,
                factors: newPrediction.factors,
              });

              updated++;
              logger.info(
                `Updated prediction for ${event.homeTeam} vs ${event.awayTeam} - ${prediction.selection}`
              );
            }
          }
        } catch (error: any) {
          logger.warn(`Error updating predictions for event ${event.id}:`, error.message);
          errors++;
        }
      }

      logger.info(`Prediction update completed: ${updated} updated, ${errors} errors`);
      return { updated, errors };
    } catch (error: any) {
      logger.error('Error in updatePredictionsForChangedOdds:', error);
      return { updated: 0, errors: 1 };
    }
  }
}

export const autoPredictionsService = new AutoPredictionsService();

