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
   * Detect value bets for upcoming events
   * Uses a simple probability model based on implied probabilities from odds
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
   */
  async scanAllSports(options: ValueBetDetectionOptions = {}) {
    const sports = ['soccer_epl', 'soccer_usa_mls', 'basketball_nba', 'americanfootball_nfl'];
    const allValueBets: any[] = [];

    for (const sport of sports) {
      try {
        const valueBets = await this.detectValueBetsForSport({
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

