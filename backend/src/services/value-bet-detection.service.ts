/**
 * Value Bet Detection Service
 * Detecta automáticamente value bets usando The Odds API
 */

import { getTheOddsAPIService } from './integrations/the-odds-api.service';
import { valueBetAlertsService } from './value-bet-alerts.service';
import { eventSyncService } from './event-sync.service';
import { improvedPredictionService } from './improved-prediction.service';
import { userPreferencesService } from './user-preferences.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

interface ValueBetDetectionOptions {
  userId?: string; // User ID to apply preferences
  sport?: string;
  minValue?: number; // Minimum value percentage (e.g., 0.05 = 5%)
  maxEvents?: number; // Maximum number of events to check
  autoCreateAlerts?: boolean; // Automatically create alerts for detected value bets
}

class ValueBetDetectionService {
  /**
   * ⚠️ NUEVO: Detect value bets using events and predictions from database
   * Much more efficient - uses existing predictions instead of calling The Odds API
   */
  async detectValueBetsForEventsFromDB(options: ValueBetDetectionOptions = {}) {
    let {
      userId,
      sport = 'soccer_epl',
      minValue = 0.05, // 5% minimum value
      maxEvents = 20,
      autoCreateAlerts = false,
    } = options;

    // Load user preferences if userId is provided
    if (userId) {
      try {
        const preferences = await userPreferencesService.getValueBetPreferences(userId);
        
        if (preferences.minValue !== undefined) {
          minValue = preferences.minValue;
        }
        if (preferences.maxEvents !== undefined) {
          maxEvents = preferences.maxEvents;
        }
        if (preferences.sports && preferences.sports.length > 0 && !options.sport) {
          sport = preferences.sports[0];
        }
        if (preferences.autoCreateAlerts !== undefined) {
          autoCreateAlerts = preferences.autoCreateAlerts;
        }
      } catch (error) {
        logger.warn('Error loading user preferences, using defaults:', error);
      }
    }

    try {
      // Find sport in database
      const sportRecord = await prisma.sport.findFirst({
        where: { slug: sport, isActive: true },
      });

      if (!sportRecord) {
        logger.info(`Sport ${sport} not found in database`);
        return [];
      }

      // Get events with predictions from database
      const now = new Date();
      const maxTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Next 48 hours

      const events = await prisma.event.findMany({
        where: {
          sportId: sportRecord.id,
          status: 'SCHEDULED',
          isActive: true,
          startTime: {
            gte: now,
            lte: maxTime,
          },
          Prediction: {
            some: {}, // Only events with predictions
          },
        },
        include: {
          sport: true,
          markets: {
            where: { isActive: true, type: 'MATCH_WINNER' },
            include: {
              odds: {
                where: { isActive: true },
              },
            },
          },
          Prediction: {
            where: {
              wasCorrect: null, // Only unresolved predictions
            },
          },
        },
        take: maxEvents,
        orderBy: { startTime: 'asc' },
      });

      if (events.length === 0) {
        logger.info(`No events with predictions found in DB for sport ${sport}`);
        return [];
      }

      logger.info(`Found ${events.length} events with predictions in DB for ${sport}`);

      const detectedValueBets: Array<{
        eventId: string;
        eventName: string;
        selection: string;
        bookmaker: string;
        odds: number;
        impliedProbability: number;
        predictedProbability: number;
        valuePercentage: number;
        expectedValue: number;
        confidence?: number;
        factors?: any;
      }> = [];

      // Process each event
      for (const event of events) {
        try {
          const result = await this.detectValueBetsForEvent(event, {
            userId,
            minValue,
            autoCreateAlerts,
          });
          detectedValueBets.push(...result);
        } catch (error: any) {
          logger.warn(`Error processing event ${event.id}:`, error.message);
          continue;
        }
      }

      // Sort by value percentage (highest first)
      detectedValueBets.sort((a, b) => b.valuePercentage - a.valuePercentage);

      logger.info(`Detected ${detectedValueBets.length} value bets from DB for sport ${sport}`);
      return detectedValueBets;
    } catch (error: any) {
      logger.error('Error detecting value bets from DB:', error);
      return [];
    }
  }

  /**
   * ⚠️ NUEVO: Detect value bets for a single event using predictions from database
   */
  async detectValueBetsForEvent(
    event: any,
    options: {
      userId?: string;
      minValue?: number;
      autoCreateAlerts?: boolean;
    } = {}
  ) {
    const { userId, minValue = 0.05, autoCreateAlerts = false } = options;

    const detectedValueBets: Array<{
      eventId: string;
      eventName: string;
      selection: string;
      bookmaker: string;
      odds: number;
      impliedProbability: number;
      predictedProbability: number;
      valuePercentage: number;
      expectedValue: number;
      confidence?: number;
      factors?: any;
    }> = [];

    try {
      // Get market
      const market = event.markets?.find((m: any) => m.type === 'MATCH_WINNER');
      if (!market) {
        return [];
      }

      // Process each prediction
      for (const prediction of event.Prediction || []) {
        try {
          // Get odds for this selection from database
          const oddsForSelection = market.odds?.filter(
            (o: any) => o.selection === prediction.selection
          ) || [];

          if (oddsForSelection.length === 0) {
            // No odds in DB, skip or fetch from API as fallback
            continue;
          }

          // Find best odds
          const bestOdd = oddsForSelection.reduce((best: any, current: any) => {
            return current.decimal > best.decimal ? current : best;
          }, oddsForSelection[0]);

          const bestOdds = bestOdd.decimal;
          const bookmaker = bestOdd.source || 'SYSTEM';

          // Use prediction from database
          const predictedProbability = prediction.predictedProbability;
          const confidence = prediction.confidence || 0.7;
          const factors = (prediction.factors || {}) as any;

          // Calculate implied probability from odds
          const impliedProbability = 1 / bestOdds;

          // Calculate value using improved calculation
          const rawValue = predictedProbability * bestOdds - 1;
          const estimatedMargin = factors.estimatedMargin ? factors.estimatedMargin / 100 : 0.05;
          const confidenceAdjustedValue = rawValue * confidence;
          const marginAdjustedValue = confidenceAdjustedValue - (estimatedMargin * (1 - confidence));
          const valuePercentage = marginAdjustedValue * 100;
          const adjustedExpectedValue = marginAdjustedValue * 100;

          // Apply user preferences filters if userId provided
          if (userId) {
            try {
              const preferences = await userPreferencesService.getValueBetPreferences(userId);
              
              if (preferences.minConfidence !== undefined && confidence < preferences.minConfidence) {
                continue;
              }
              if (preferences.minOdds !== undefined && bestOdds < preferences.minOdds) {
                continue;
              }
              if (preferences.maxOdds !== undefined && bestOdds > preferences.maxOdds) {
                continue;
              }
              if (preferences.platforms && preferences.platforms.length > 0) {
                if (!preferences.platforms.some(p => bookmaker.toLowerCase().includes(p.toLowerCase()))) {
                  continue;
                }
              }
            } catch (error) {
              logger.warn('Error applying user preferences filters:', error);
            }
          }

          // Check if it's a value bet
          if (marginAdjustedValue >= minValue) {
            detectedValueBets.push({
              eventId: event.id,
              eventName: `${event.homeTeam} vs ${event.awayTeam}`,
              selection: prediction.selection,
              bookmaker: bookmaker,
              odds: bestOdds,
              impliedProbability,
              predictedProbability,
              valuePercentage,
              expectedValue: adjustedExpectedValue,
              confidence,
              factors: {
                ...factors,
                rawValue: rawValue * 100,
                marginAdjustedValue: marginAdjustedValue * 100,
                adjustedExpectedValue,
              },
            });

            // Auto-create alert if enabled
            if (autoCreateAlerts) {
              try {
                await valueBetAlertsService.createAlert({
                  eventId: event.id,
                  marketId: market.id,
                  selection: prediction.selection,
                  bookmakerOdds: bestOdds,
                  bookmakerPlatform: bookmaker,
                  predictedProbability,
                  expectedValue: adjustedExpectedValue,
                  valuePercentage,
                  confidence,
                  factors: {
                    ...factors,
                    rawValue: rawValue * 100,
                    marginAdjustedValue: marginAdjustedValue * 100,
                    adjustedExpectedValue,
                  },
                  expiresAt: event.startTime,
                  userId,
                });

                logger.info(`Created value bet alert for ${event.homeTeam} vs ${event.awayTeam} - ${prediction.selection}`);
              } catch (alertError: any) {
                logger.error(`Error creating alert for event ${event.id}:`, alertError.message);
              }
            }
          }
        } catch (error: any) {
          logger.warn(`Error processing prediction ${prediction.id}:`, error.message);
          continue;
        }
      }
    } catch (error: any) {
      logger.error(`Error detecting value bets for event ${event.id}:`, error);
    }

    return detectedValueBets;
  }

  /**
   * Detect value bets for upcoming events (DEPRECATED - uses The Odds API)
   * ⚠️ Use detectValueBetsForEventsFromDB() instead for better performance
   */
  async detectValueBetsForSport(options: ValueBetDetectionOptions = {}) {
    let {
      userId,
      sport = 'soccer_epl',
      minValue = 0.05, // 5% minimum value
      maxEvents = 20,
      autoCreateAlerts = false,
    } = options;

    // Load user preferences if userId is provided
    if (userId) {
      try {
        const preferences = await userPreferencesService.getValueBetPreferences(userId);
        
        // Override defaults with user preferences
        if (preferences.minValue !== undefined) {
          minValue = preferences.minValue;
        }
        if (preferences.maxEvents !== undefined) {
          maxEvents = preferences.maxEvents;
        }
        if (preferences.sports && preferences.sports.length > 0 && !options.sport) {
          // If user has preferred sports and no sport specified, use first preferred
          sport = preferences.sports[0];
        }
        if (preferences.autoCreateAlerts !== undefined) {
          autoCreateAlerts = preferences.autoCreateAlerts;
        }
      } catch (error) {
        logger.warn('Error loading user preferences, using defaults:', error);
      }
    }

    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        logger.warn('The Odds API service not configured');
        return [];
      }

      // Get upcoming events from The Odds API
      const oddsEvents = await theOddsAPI.getOdds(sport, {
        regions: ['us', 'uk', 'eu'],
        markets: ['h2h'],
        oddsFormat: 'decimal',
      });

      if (!oddsEvents || oddsEvents.length === 0) {
        logger.info(`No events found for sport ${sport}`);
        return [];
      }

      const detectedValueBets: Array<{
        eventId: string;
        eventName: string;
        selection: string;
        bookmaker: string;
        odds: number;
        impliedProbability: number;
        predictedProbability: number;
        valuePercentage: number;
        expectedValue: number;
        confidence?: number;
        factors?: any;
      }> = [];

      // Process events (limit to maxEvents)
      const eventsToProcess = oddsEvents.slice(0, maxEvents);

      for (const oddsEvent of eventsToProcess) {
        try {
          // Get odds comparison for this event
          const comparison = await theOddsAPI.compareOdds(sport, oddsEvent.id, 'h2h');

          if (!comparison || !comparison.comparisons) {
            continue;
          }

          // Calculate value bets for each selection
          for (const [selection, bestOdds] of Object.entries(comparison.comparisons)) {
            if (!bestOdds || typeof bestOdds.bestOdds !== 'number') {
              continue;
            }

            // Get all odds for this selection from all bookmakers
            const allOddsForSelection: number[] = [];
            
            if (comparison.event?.bookmakers) {
              for (const bookmaker of comparison.event.bookmakers) {
                if (bookmaker.markets && bookmaker.markets.length > 0) {
                  const h2hMarket = bookmaker.markets.find((m: any) => m.key === 'h2h');
                  if (h2hMarket && h2hMarket.outcomes) {
                    const outcome = h2hMarket.outcomes.find((o: any) => 
                      o.name === selection || 
                      (selection === 'Home' && o.name === oddsEvent.home_team) ||
                      (selection === 'Away' && o.name === oddsEvent.away_team) ||
                      (selection === 'Draw' && o.name === 'Draw')
                    );
                    if (outcome && outcome.price) {
                      allOddsForSelection.push(outcome.price);
                    }
                  }
                }
              }
            }

            // Use improved prediction service if we have multiple odds
            let predictedProbability: number;
            let confidence: number = 0.7;
            let factors: any = {};

            if (allOddsForSelection.length > 1) {
              // Use improved prediction with multiple factors
              try {
                const prediction = await improvedPredictionService.calculatePredictedProbability(
                  oddsEvent.id,
                  selection,
                  allOddsForSelection
                );
                predictedProbability = prediction.predictedProbability;
                confidence = prediction.confidence;
                factors = prediction.factors;
              } catch (error: any) {
                logger.warn(`Error using improved prediction, falling back to simple:`, error.message);
                // Fallback to simple calculation
                const avgImpliedProb = allOddsForSelection.reduce((sum, odd) => sum + (1 / odd), 0) / allOddsForSelection.length;
                predictedProbability = avgImpliedProb * 1.05;
              }
            } else {
              // Fallback to simple calculation if not enough odds
              const impliedProbability = 1 / bestOdds.bestOdds;
              predictedProbability = impliedProbability * 1.05; // 5% adjustment
            }

            // Calculate implied probability from odds
            const impliedProbability = 1 / bestOdds.bestOdds;
            
            // Calculate bookmaker margin (overround)
            // Sum of all implied probabilities should be > 1 if there's margin
            // For simplicity, we'll estimate margin as: margin = (1/odds_home + 1/odds_draw + 1/odds_away) - 1
            // Since we only have one selection, we'll use a conservative estimate
            const estimatedMargin = 0.05; // 5% typical margin
            
            // Calculate raw value: (predicted_prob * odds) - 1
            const rawValue = predictedProbability * bestOdds.bestOdds - 1;
            
            // Adjust value by confidence level (higher confidence = more reliable value)
            const confidenceAdjustedValue = rawValue * confidence;
            
            // Adjust for bookmaker margin (reduce value if margin is high)
            const marginAdjustedValue = confidenceAdjustedValue - (estimatedMargin * (1 - confidence));
            
            // Calculate Kelly Criterion for optimal stake (optional, for reference)
            // Kelly% = (prob * odds - 1) / (odds - 1)
            const kellyPercentage = rawValue > 0 
              ? (predictedProbability * bestOdds.bestOdds - 1) / (bestOdds.bestOdds - 1)
              : 0;
            
            // Final value percentage (use margin-adjusted value)
            const valuePercentage = marginAdjustedValue * 100;
            
            // Expected Value in percentage (raw value * 100 for display)
            const expectedValue = rawValue * 100;
            
            // Adjusted Expected Value (considering confidence and margin)
            const adjustedExpectedValue = marginAdjustedValue * 100;

            // Apply user preferences filters if userId provided
            if (userId) {
              try {
                const preferences = await userPreferencesService.getValueBetPreferences(userId);
                
                // Filter by confidence
                if (preferences.minConfidence !== undefined && confidence < preferences.minConfidence) {
                  continue; // Skip if confidence too low
                }
                
                // Filter by odds range
                if (preferences.minOdds !== undefined && bestOdds.bestOdds < preferences.minOdds) {
                  continue; // Skip if odds too low
                }
                if (preferences.maxOdds !== undefined && bestOdds.bestOdds > preferences.maxOdds) {
                  continue; // Skip if odds too high
                }
                
                // Filter by platform
                if (preferences.platforms && preferences.platforms.length > 0) {
                  const bookmakerName = bestOdds.bestBookmaker || '';
                  if (!preferences.platforms.some(p => bookmakerName.toLowerCase().includes(p.toLowerCase()))) {
                    continue; // Skip if platform not in preferences
                  }
                }
                
                // Filter by sport (already handled at top level, but double-check)
                if (preferences.sports && preferences.sports.length > 0) {
                  if (!preferences.sports.includes(sport)) {
                    continue; // Skip if sport not in preferences
                  }
                }
              } catch (error) {
                logger.warn('Error applying user preferences filters:', error);
                // Continue with detection if preferences check fails
              }
            }

            // Check if it's a value bet (use adjusted value for filtering)
            if (marginAdjustedValue >= minValue) {

              detectedValueBets.push({
                eventId: oddsEvent.id,
                eventName: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
                selection: selection,
                bookmaker: bestOdds.bestBookmaker || 'Unknown',
                odds: bestOdds.bestOdds,
                impliedProbability,
                predictedProbability,
                valuePercentage, // Margin and confidence adjusted
                expectedValue: adjustedExpectedValue, // Use adjusted EV as main expectedValue
                confidence,
                factors: {
                  ...factors,
                  rawValue: rawValue * 100,
                  rawExpectedValue: expectedValue, // Store raw EV in factors
                  marginAdjustedValue: marginAdjustedValue * 100,
                  estimatedMargin: estimatedMargin * 100,
                  kellyPercentage, // Store Kelly in factors
                },
              });

              // Auto-create alert if enabled
              if (autoCreateAlerts) {
                try {
                  // Sync event to database first
                  const syncedEvent = await eventSyncService.syncEventFromTheOddsAPI(
                    oddsEvent.id,
                    oddsEvent.sport_key || sport,
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

                  // Create value bet alert
                  await valueBetAlertsService.createAlert({
                    eventId: syncedEvent.id,
                    marketId: market.id,
                    selection: selection,
                    bookmakerOdds: bestOdds.bestOdds,
                    bookmakerPlatform: bestOdds.bestBookmaker || 'Unknown',
                    predictedProbability,
                    expectedValue: adjustedExpectedValue, // Use adjusted EV
                    valuePercentage, // Use margin and confidence adjusted value
                    confidence: confidence || 0.7,
                    factors: {
                      ...factors,
                      rawValue: rawValue * 100,
                      marginAdjustedValue: marginAdjustedValue * 100,
                      adjustedExpectedValue,
                      kellyPercentage: kellyPercentage * 100,
                      estimatedMargin: estimatedMargin * 100,
                    },
                    expiresAt: new Date(oddsEvent.commence_time),
                  });

                  logger.info(`Created value bet alert for ${oddsEvent.home_team} vs ${oddsEvent.away_team} - ${selection}`);
                } catch (alertError: any) {
                  logger.error(`Error creating alert for event ${oddsEvent.id}:`, alertError.message);
                  // Continue processing other events
                }
              }
            }
          }
        } catch (error: any) {
          logger.warn(`Error processing event ${oddsEvent.id}:`, error.message);
          continue;
        }
      }

      // Sort by value percentage (highest first)
      detectedValueBets.sort((a, b) => b.valuePercentage - a.valuePercentage);

      logger.info(`Detected ${detectedValueBets.length} value bets for sport ${sport}`);
      return detectedValueBets;
    } catch (error: any) {
      logger.error('Error detecting value bets:', error);
      return [];
    }
  }

  /**
   * Scan multiple sports for value bets
   * ⚠️ OPTIMIZADO: Usa eventos de BD en lugar de The Odds API
   */
  async scanAllSports(options: ValueBetDetectionOptions = {}) {
    const sports = ['soccer_epl', 'soccer_usa_mls', 'basketball_nba', 'americanfootball_nfl'];
    const allValueBets: any[] = [];

    for (const sport of sports) {
      try {
        // ⚠️ NUEVO: Usar método optimizado que usa BD
        const valueBets = await this.detectValueBetsForEventsFromDB({
          ...options,
          sport,
        });
        allValueBets.push(...valueBets);
      } catch (error: any) {
        logger.warn(`Error scanning sport ${sport}:`, error.message);
        continue;
      }
    }

    // Sort all by value percentage
    allValueBets.sort((a, b) => b.valuePercentage - a.valuePercentage);

    return allValueBets;
  }
}

export const valueBetDetectionService = new ValueBetDetectionService();

