/**
 * Auto Predictions Service
 * Automatically generates predictions for all upcoming events
 * This is the CRITICAL missing piece for real-time operation
 */

import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { improvedPredictionService } from './improved-prediction.service';
import { universalPredictionService } from './universal-prediction.service';
import { predictionsService } from './predictions.service';
import { getTheOddsAPIService } from './integrations/the-odds-api.service';
import { eventSyncService } from './event-sync.service';
import { valueBetDetectionService } from './value-bet-detection.service';
import { webSocketService } from './websocket.service';
import { advancedFeaturesService } from './advanced-features.service';
import { normalizedPredictionService } from './normalized-prediction.service';
import { multiMarketPredictionsService } from './multi-market-predictions.service';
import { multiSportFeaturesService } from './multi-sport-features.service';
import { advancedPredictionAnalysisService } from './advanced-prediction-analysis.service';

class AutoPredictionsService {
  private readonly MODEL_VERSION = 'v2.0-auto';
  private readonly HOURS_AHEAD = 48; // Generate predictions for events in next 48 hours

  /**
   * Generate predictions for all upcoming events
   * ⚠️ OPTIMIZADO: Usa eventos de la BD en lugar de The Odds API directamente
   * This is the main method that should run every 10 minutes
   */
  async generatePredictionsForUpcomingEvents() {
    try {
      logger.info('Starting automatic prediction generation from database...');

      // ⚠️ NUEVO: Obtener eventos desde la BD en lugar de The Odds API
      const now = new Date();
      const maxTime = new Date(now.getTime() + this.HOURS_AHEAD * 60 * 60 * 1000);

      // Get all active sports from database
      const sports = await prisma.sport.findMany({
        where: { isActive: true },
        take: 10, // Limit to 10 sports
      });

      if (sports.length === 0) {
        logger.warn('No active sports found in database. Cannot generate predictions.');
        return {
          generated: 0,
          updated: 0,
          errors: 0,
        };
      }

      let totalGenerated = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      // Process each sport
      for (const sport of sports) {
        try {
          // Use sport ID directly if slug is not available
          const result = sport.slug 
            ? await this.generatePredictionsForSportFromDB(sport.slug)
            : await this.generatePredictionsForSportById(sport.id);
          totalGenerated += result.generated;
          totalUpdated += result.updated;
          totalErrors += result.errors;
        } catch (error: any) {
          logger.error(`Error generating predictions for sport ${sport.slug || sport.id}:`, error.message);
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
   * ⚠️ NUEVO: Generate predictions for events that were just synced
   * Called automatically after event synchronization
   */
  async generatePredictionsForSyncedEvents(eventIds: string[]) {
    try {
      logger.info(`Generating predictions for ${eventIds.length} synced events...`);

      const events = await prisma.event.findMany({
        where: {
          id: { in: eventIds },
          status: 'SCHEDULED',
          isActive: true,
        },
        include: {
          sport: true,
          markets: {
            where: { 
              isActive: true,
              // Include multiple market types for richer predictions
              type: { in: ['MATCH_WINNER', 'OVER_UNDER', 'BOTH_TEAMS_SCORE', 'DOUBLE_CHANCE', 'CORRECT_SCORE'] }
            },
            include: { odds: { where: { isActive: true } } },
          },
        },
      });

      let generated = 0;
      let updated = 0;
      let errors = 0;

      for (const event of events) {
        try {
          const result = await this.generatePredictionsForEventFromDB(event);
          generated += result.generated;
          updated += result.updated;
        } catch (error: any) {
          logger.warn(`Error generating predictions for event ${event.id}:`, error.message);
          errors++;
        }
      }

      logger.info(`Generated predictions for synced events: ${generated} generated, ${updated} updated, ${errors} errors`);
      
      // ⚠️ NUEVO: Detectar value bets automáticamente después de generar predicciones
      if (generated > 0 || updated > 0) {
        try {
          logger.info('Detecting value bets for events with new predictions...');
          const valueBets = await valueBetDetectionService.detectValueBetsForEventsFromDB({
            minValue: 0.05,
            maxEvents: events.length,
            autoCreateAlerts: true,
          });
          logger.info(`Detected ${valueBets.length} value bets after generating predictions`);
        } catch (error: any) {
          logger.warn('Error detecting value bets after generating predictions:', error.message);
          // Don't fail if value bet detection fails
        }
      }
      
      return { generated, updated, errors };
    } catch (error: any) {
      logger.error('Error in generatePredictionsForSyncedEvents:', error);
      return { generated: 0, updated: 0, errors: 1 };
    }
  }

  /**
   * ⚠️ NUEVO: Generate predictions for a specific sport using events from database (by slug)
   */
  private async generatePredictionsForSportFromDB(sportSlug: string) {
    try {
      logger.info(`Generating predictions for sport from DB (by slug): ${sportSlug}`);

      // Find sport by slug
      const sport = await prisma.sport.findFirst({
        where: { slug: sportSlug, isActive: true },
      });

      if (!sport) {
        logger.info(`Sport with slug ${sportSlug} not found in database`);
        return { generated: 0, updated: 0, errors: 0 };
      }

      return this.generatePredictionsForSportById(sport.id);
    } catch (error: any) {
      logger.error(`Error generating predictions for sport ${sportSlug}:`, error);
      return { generated: 0, updated: 0, errors: 1 };
    }
  }

  /**
   * ⚠️ NUEVO: Generate predictions for a specific sport using events from database (by ID)
   */
  private async generatePredictionsForSportById(sportId: string) {
    try {
      logger.info(`Generating predictions for sport from DB (by ID): ${sportId}`);

      // Find sport by ID
      const sport = await prisma.sport.findFirst({
        where: { id: sportId, isActive: true },
      });

      if (!sport) {
        logger.info(`Sport with ID ${sportId} not found in database`);
        return { generated: 0, updated: 0, errors: 0 };
      }

      // Get upcoming events from database
      const now = new Date();
      const maxTime = new Date(now.getTime() + this.HOURS_AHEAD * 60 * 60 * 1000);

      const events = await prisma.event.findMany({
        where: {
          sportId: sport.id,
          status: 'SCHEDULED',
          isActive: true,
          startTime: {
            gte: now,
            lte: maxTime,
          },
        },
        include: {
          sport: true,
          markets: {
            where: { 
              isActive: true,
              // Include multiple market types for richer predictions
              type: { in: ['MATCH_WINNER', 'OVER_UNDER', 'BOTH_TEAMS_SCORE', 'DOUBLE_CHANCE', 'CORRECT_SCORE'] }
            },
            include: { odds: { where: { isActive: true } } },
          },
        },
        take: 30, // Limit to 30 events
        orderBy: { startTime: 'asc' },
      });

      if (events.length === 0) {
        logger.info(`No upcoming events found in DB for sport ${sport.slug || sport.id}`);
        return { generated: 0, updated: 0, errors: 0 };
      }

      logger.info(`Found ${events.length} upcoming events in DB for sport ${sport.slug || sport.id}`);

      let generated = 0;
      let updated = 0;
      let errors = 0;

      // Process events in batches for better performance (optimized)
      const batchSize = 20; // Process 20 events at a time
      const batches = [];
      
      for (let i = 0; i < events.length; i += batchSize) {
        batches.push(events.slice(i, i + batchSize));
      }
      
      // Process batches with controlled concurrency (avoid overwhelming DB)
      const concurrency = 3; // Process 3 batches at a time
      for (let i = 0; i < batches.length; i += concurrency) {
        const concurrentBatches = batches.slice(i, i + concurrency);
        
        const batchResults = await Promise.all(
          concurrentBatches.map(batch =>
            Promise.all(
              batch.map(async (event) => {
                try {
                  return await this.generatePredictionsForEventFromDB(event);
                } catch (error: any) {
                  logger.warn(`Error processing event ${event.id}:`, error.message);
                  errors++;
                  return { generated: 0, updated: 0 };
                }
              })
            )
          )
        );
        
        // Aggregate results
        for (const batchResult of batchResults) {
          for (const result of batchResult) {
            generated += result.generated;
            updated += result.updated;
          }
        }
        
        // Small delay between concurrent batches to avoid overwhelming DB
        if (i + concurrency < batches.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return { generated, updated, errors };
    } catch (error: any) {
      logger.error(`Error generating predictions for sport ${sportId}:`, error);
      return { generated: 0, updated: 0, errors: 1 };
    }
  }

  /**
   * ⚠️ DEPRECATED: Keep for backward compatibility, but prefer generatePredictionsForSportFromDB
   * Generate predictions for a specific sport (uses The Odds API - less efficient)
   */
  private async generatePredictionsForSport(sportKey: string) {
    // Redirect to DB-based method
    return this.generatePredictionsForSportFromDB(sportKey);
  }

  /**
   * ⚠️ NUEVO: Generate predictions for an event from database
   * Uses existing odds from database, or fetches from The Odds API if needed
   */
  private async generatePredictionsForEventFromDB(event: any) {
    try {
      let totalGenerated = 0;
      let totalUpdated = 0;

      // Generate predictions for ALL available markets, not just MATCH_WINNER
      const marketsToProcess = event.markets && event.markets.length > 0 
        ? event.markets 
        : [await this.ensureMarketExists(event, 'MATCH_WINNER', 'Match Winner')];

      // Process each market type
      for (const market of marketsToProcess) {
        try {
          const result = await this.generatePredictionsForMarket(event, market);
          totalGenerated += result.generated;
          totalUpdated += result.updated;
        } catch (error: any) {
          logger.warn(`Error generating predictions for market ${market.type} in event ${event.id}:`, error.message);
        }
      }

      return { generated: totalGenerated, updated: totalUpdated };
    } catch (error: any) {
      logger.error(`Error in generatePredictionsForEventFromDB for event ${event.id}:`, error);
      return { generated: 0, updated: 0 };
    }
  }

  /**
   * Ensure a market exists, create if it doesn't
   */
  private async ensureMarketExists(event: any, marketType: string, marketName: string) {
    let market = event.markets?.find((m: any) => m.type === marketType);
    
    if (!market) {
      market = await prisma.market.create({
        data: {
          eventId: event.id,
          sportId: event.sportId,
          type: marketType,
          name: marketName,
          isActive: true,
        },
        include: { odds: { where: { isActive: true } } },
      });
    }
    
    return market;
  }

  /**
   * Generate predictions for a specific market
   */
  private async generatePredictionsForMarket(event: any, market: any) {
    try {
      // Find or create market if needed
      if (!market.id) {
        market = await this.ensureMarketExists(event, market.type, market.name || market.type);
      }

      // Extract odds from database
      const selections: Record<string, number[]> = {};
      
      if (market.odds && market.odds.length > 0) {
        // Use odds from database
        for (const odd of market.odds) {
          if (!selections[odd.selection]) {
            selections[odd.selection] = [];
          }
          selections[odd.selection].push(odd.decimal);
        }
      } else {
        // No odds in database, fetch from The Odds API as fallback
        logger.info(`No odds in DB for event ${event.id}, fetching from The Odds API...`);
        const theOddsAPI = getTheOddsAPIService();
        if (theOddsAPI && event.externalId) {
          try {
            const sportKey = event.sport?.slug || 'soccer_epl';
            const oddsEvents = await theOddsAPI.getOdds(sportKey, {
              regions: ['us', 'uk', 'eu'],
              markets: ['h2h'],
              oddsFormat: 'decimal',
            });
            
            const oddsEvent = oddsEvents.find((oe: any) => 
              oe.id === event.externalId ||
              (oe.home_team === event.homeTeam && oe.away_team === event.awayTeam)
            );
            
            if (oddsEvent?.bookmakers) {
              for (const bookmaker of oddsEvent.bookmakers) {
                if (!bookmaker.markets || bookmaker.markets.length === 0) continue;
                const h2hMarket = bookmaker.markets.find((m: any) => m.key === 'h2h');
                if (!h2hMarket || !h2hMarket.outcomes) continue;
                
                for (const outcome of h2hMarket.outcomes) {
                  const selection = this.normalizeSelection(outcome.name, {
                    home_team: event.homeTeam,
                    away_team: event.awayTeam,
                  });
                  if (!selections[selection]) {
                    selections[selection] = [];
                  }
                  if (outcome.price) {
                    selections[selection].push(outcome.price);
                  }
                }
              }
            }
          } catch (error: any) {
            logger.warn(`Error fetching odds from API for event ${event.id}:`, error.message);
            return { generated: 0, updated: 0 };
          }
        } else {
          logger.warn(`Cannot fetch odds: event ${event.id} has no externalId`);
          return { generated: 0, updated: 0 };
        }
      }

      if (Object.keys(selections).length === 0) {
        logger.info(`No odds available for event ${event.id}`);
        return { generated: 0, updated: 0 };
      }

      let generated = 0;
      let updated = 0;

      // CRITICAL FIX: Calculate normalized probabilities for all selections at once
      // This ensures Home + Away + Draw probabilities sum to ~100%
      const marketSelections: {
        home: number[];
        away: number[];
        draw?: number[];
      } = {
        home: selections[event.homeTeam] || selections['Home'] || selections['1'] || [],
        away: selections[event.awayTeam] || selections['Away'] || selections['2'] || [],
        draw: selections['Draw'] || selections['X'] || selections['3'] || undefined,
      };

      // Check if we have at least home and away odds
      if (marketSelections.home.length === 0 || marketSelections.away.length === 0) {
        logger.warn(`Insufficient odds for event ${event.id}: missing home or away odds`);
        return { generated: 0, updated: 0 };
      }

      // Calculate normalized probabilities for all selections
      let normalizedPredictions;
      try {
        normalizedPredictions = await normalizedPredictionService.calculateNormalizedProbabilities(
          event.id,
          `${event.homeTeam} vs ${event.awayTeam}`,
          event.homeTeam,
          event.awayTeam,
          event.sportId,
          marketSelections
        );
      } catch (error: any) {
        logger.error(`Error calculating normalized probabilities for event ${event.id}:`, error);
        // Fallback to old method if normalized service fails
        normalizedPredictions = null;
      }

      // Generate predictions for each selection using normalized probabilities
      for (const [selection, oddsArray] of Object.entries(selections)) {
        if (oddsArray.length === 0) continue;

        try {
          let prediction;
          let advancedFeatures: any = {};

          // Use normalized predictions if available
          if (normalizedPredictions) {
            // Map selection to normalized prediction
            let normalizedPred;
            if (selection === event.homeTeam || selection === 'Home' || selection === '1') {
              normalizedPred = normalizedPredictions.home;
            } else if (selection === event.awayTeam || selection === 'Away' || selection === '2') {
              normalizedPred = normalizedPredictions.away;
            } else if (selection === 'Draw' || selection === 'X' || selection === '3') {
              normalizedPred = normalizedPredictions.draw;
            }

            if (normalizedPred) {
              // Ensure advancedFeatures is properly structured (not a string)
              let normalizedAdvancedFeatures = normalizedPred.factors?.advancedFeatures || {};
              
              // If advancedFeatures is a string, parse it
              if (typeof normalizedAdvancedFeatures === 'string') {
                try {
                  normalizedAdvancedFeatures = JSON.parse(normalizedAdvancedFeatures);
                } catch (e) {
                  logger.warn(`Could not parse advancedFeatures string: ${e}`);
                  normalizedAdvancedFeatures = {};
                }
              }
              
              // If advancedFeatures doesn't have the expected structure, restructure it
              if (!normalizedAdvancedFeatures.homeForm || !normalizedAdvancedFeatures.awayForm) {
                // Get advanced features and restructure them
                try {
                  const allFeatures = await advancedFeaturesService.getAllAdvancedFeatures(
                    event.id,
                    event.homeTeam,
                    event.awayTeam,
                    event.sportId
                  );
                  const homeForm = allFeatures.homeForm || {};
                  const awayForm = allFeatures.awayForm || {};
                  const h2h = allFeatures.h2h || {};
                  const market = allFeatures.market || {};
                  
                  normalizedAdvancedFeatures = {
                    homeForm: {
                      winRate5: homeForm.winRate5 || 0.5,
                      winRate10: homeForm.winRate10 || 0.5,
                      goalsForAvg5: homeForm.goalsForAvg5 || 1.5,
                      goalsAgainstAvg5: homeForm.goalsAgainstAvg5 || 1.5,
                      currentStreak: homeForm.currentStreak || 0,
                      formTrend: homeForm.formTrend || 0,
                      wins5: Math.round((homeForm.winRate5 || 0.5) * 5),
                      losses5: Math.round((1 - (homeForm.winRate5 || 0.5)) * 5),
                      draws5: 0,
                    },
                    awayForm: {
                      winRate5: awayForm.winRate5 || 0.5,
                      winRate10: awayForm.winRate10 || 0.5,
                      goalsForAvg5: awayForm.goalsForAvg5 || 1.5,
                      goalsAgainstAvg5: awayForm.goalsAgainstAvg5 || 1.5,
                      currentStreak: awayForm.currentStreak || 0,
                      formTrend: awayForm.formTrend || 0,
                      wins5: Math.round((awayForm.winRate5 || 0.5) * 5),
                      losses5: Math.round((1 - (awayForm.winRate5 || 0.5)) * 5),
                      draws5: 0,
                    },
                    h2h: {
                      team1WinRate: h2h.team1WinRate || 0.5,
                      drawRate: h2h.drawRate || 0.25,
                      totalGoalsAvg: h2h.totalGoalsAvg || 3.0,
                      recentTrend: h2h.recentTrend || 0,
                      totalMatches: 5,
                      bothTeamsScoredRate: 0.5,
                    },
                    market: {
                      consensus: market.consensus || 0.7,
                      efficiency: market.efficiency || 0.9,
                      sharpMoneyIndicator: market.sharpMoneyIndicator || 0.5,
                      valueOpportunity: market.valueOpportunity || 0.02,
                      oddsSpread: market.oddsSpread || 0.1,
                    },
                    marketOdds: (() => {
                      const oddsNums = oddsArray.map(Number).filter(o => o > 0);
                      if (oddsNums.length === 0) {
                        return {
                          impliedProbability: 0,
                          consensus: market.consensus || 0.7,
                          volatility: 1 - (market.efficiency || 0.9),
                          bookmakerCount: 0,
                          stdDev: 0,
                          median: 0,
                          minOdds: 0,
                          maxOdds: 0,
                        };
                      }
                      const probs = oddsNums.map(odd => 1 / odd);
                      const meanProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;
                      const variance = probs.reduce((sum, p) => sum + Math.pow(p - meanProb, 2), 0) / probs.length;
                      const stdDev = Math.sqrt(variance);
                      const sortedOdds = [...oddsNums].sort((a, b) => a - b);
                      const median = sortedOdds.length % 2 === 0
                        ? (sortedOdds[sortedOdds.length / 2 - 1] + sortedOdds[sortedOdds.length / 2]) / 2
                        : sortedOdds[Math.floor(sortedOdds.length / 2)];
                      
                      return {
                        impliedProbability: meanProb,
                        consensus: market.consensus || 0.7,
                        volatility: 1 - (market.efficiency || 0.9),
                        bookmakerCount: oddsNums.length,
                        stdDev,
                        median,
                        minOdds: Math.min(...oddsNums),
                        maxOdds: Math.max(...oddsNums),
                      };
                    })(),
                    historicalPerformance: {
                      winRate: ((homeForm.winRate5 || 0.5) + (awayForm.winRate5 || 0.5)) / 2,
                      goalsAvg: (homeForm.goalsForAvg5 || 1.5) + (awayForm.goalsForAvg5 || 1.5),
                      goalsAgainstAvg: (homeForm.goalsAgainstAvg5 || 1.5) + (awayForm.goalsAgainstAvg5 || 1.5),
                      matchesCount: 5,
                      impact: 0.3,
                      cleanSheets: 0.2,
                      avgPossession: 0.5,
                      shotsOnTarget: 5.0,
                    },
                    injuries: {
                      count: 0,
                      keyPlayersCount: 0,
                      riskLevel: 'low',
                      suspensionsCount: 0,
                      goalkeeperInjured: 0,
                      defenderInjured: 0,
                      midfielderInjured: 0,
                      forwardInjured: 0,
                    },
                    weather: {
                      risk: 'low',
                      temperature: 20,
                      windSpeed: 0,
                    },
                    formAdvantage: allFeatures.formAdvantage || 0,
                    goalsAdvantage: allFeatures.goalsAdvantage || 0,
                    defenseAdvantage: allFeatures.defenseAdvantage || 0,
                    market_consensus: market.consensus || 0.7,
                    market_volatility: 1 - (market.efficiency || 0.9),
                    market_sentiment: market.sharpMoneyIndicator || 0.5,
                    trend: allFeatures.formAdvantage || 0,
                    momentum: (homeForm.currentStreak || 0) + (awayForm.currentStreak || 0),
                  };
                } catch (error: any) {
                  logger.warn(`Could not restructure advanced features: ${error.message}`);
                }
              }
              
              prediction = {
                predictedProbability: normalizedPred.predictedProbability,
                confidence: normalizedPred.confidence,
                factors: {
                  ...normalizedPred.factors,
                  advancedFeatures: normalizedAdvancedFeatures, // Ensure proper structure
                },
              };
              advancedFeatures = normalizedAdvancedFeatures;
            }
          }

          // CRITICAL FIX: Always use normalized predictions or calculate them
          // Never use independent probability calculations
          if (!prediction) {
            // If normalized service failed, calculate simple normalization here
            logger.warn(`Normalized prediction service failed for ${selection}, using simple normalization`);
            
            // Calculate simple normalized probability from market odds
            const impliedProbs = oddsArray.map(odd => 1 / odd);
            const avgImpliedProb = impliedProbs.reduce((sum, p) => sum + p, 0) / impliedProbs.length;
            
            // Get all selections for this market to calculate total
            const allSelections = Object.keys(selections);
            let totalImplied = 0;
            for (const sel of allSelections) {
              if (selections[sel] && selections[sel].length > 0) {
                const selProbs = selections[sel].map(odd => 1 / odd);
                totalImplied += selProbs.reduce((sum, p) => sum + p, 0) / selProbs.length;
              }
            }
            
            // Normalize to ensure sum = 1.0
            const normalizedProb = totalImplied > 0 ? avgImpliedProb / totalImplied : avgImpliedProb;
            
            // Get advanced features (team form, H2H, market intelligence)
            // PLUS sport-specific metrics for ALL sports
            let allFeatures: any;
            let sportSpecificAnalysis: any = { homeMetrics: null, awayMetrics: null, comparison: null, recommendations: [] };
            
            try {
              [allFeatures, sportSpecificAnalysis] = await Promise.all([
                advancedFeaturesService.getAllAdvancedFeatures(
                  event.id,
                  event.homeTeam,
                  event.awayTeam,
                  event.sportId
                ),
                multiSportFeaturesService.getComprehensiveAnalysis(
                  event.id,
                  event.homeTeam,
                  event.awayTeam,
                  event.sportId
                ).catch((error) => {
                  logger.debug(`Could not get sport-specific metrics: ${error.message}`);
                  return { homeMetrics: null, awayMetrics: null, comparison: null, recommendations: [] };
                }),
              ]);
              // Structure advanced features for storage (COMPLETE - all 50+ features for ML)
              // PLUS sport-specific metrics
              const homeForm = allFeatures.homeForm || {};
              const awayForm = allFeatures.awayForm || {};
              const h2h = allFeatures.h2h || {};
              const market = allFeatures.market || {};
              
              advancedFeatures = {
                // Sport-specific metrics (NEW - for all sports)
                sportSpecificMetrics: {
                  home: sportSpecificAnalysis.homeMetrics,
                  away: sportSpecificAnalysis.awayMetrics,
                  comparison: sportSpecificAnalysis.comparison,
                  recommendations: sportSpecificAnalysis.recommendations,
                },
              // Team form (detailed) - ALWAYS include even if default values
              homeForm: {
                winRate5: homeForm.winRate5 || 0.5,
                winRate10: homeForm.winRate10 || 0.5,
                goalsForAvg5: homeForm.goalsForAvg5 || 1.5,
                goalsAgainstAvg5: homeForm.goalsAgainstAvg5 || 1.5,
                currentStreak: homeForm.currentStreak || 0,
                formTrend: homeForm.formTrend || 0,
                wins5: Math.round((homeForm.winRate5 || 0.5) * 5),
                losses5: Math.round((1 - (homeForm.winRate5 || 0.5)) * 5),
                draws5: 0,
              },
              awayForm: {
                winRate5: awayForm.winRate5 || 0.5,
                winRate10: awayForm.winRate10 || 0.5,
                goalsForAvg5: awayForm.goalsForAvg5 || 1.5,
                goalsAgainstAvg5: awayForm.goalsAgainstAvg5 || 1.5,
                currentStreak: awayForm.currentStreak || 0,
                formTrend: awayForm.formTrend || 0,
                wins5: Math.round((awayForm.winRate5 || 0.5) * 5),
                losses5: Math.round((1 - (awayForm.winRate5 || 0.5)) * 5),
                draws5: 0,
              },
              form: {
                winRate: ((homeForm.winRate5 || 0.5) + (awayForm.winRate5 || 0.5)) / 2,
                goalsScored: (homeForm.goalsForAvg5 || 1.5) + (awayForm.goalsForAvg5 || 1.5),
                goalsConceded: (homeForm.goalsAgainstAvg5 || 1.5) + (awayForm.goalsAgainstAvg5 || 1.5),
                matchesCount: 5,
                momentum: (homeForm.currentStreak || 0) + (awayForm.currentStreak || 0),
                recentWins: Math.round(((homeForm.winRate5 || 0.5) + (awayForm.winRate5 || 0.5)) * 2.5),
                recentLosses: Math.round(((1 - (homeForm.winRate5 || 0.5)) + (1 - (awayForm.winRate5 || 0.5))) * 2.5),
                recentDraws: 0,
                impact: 0.3,
              },
              // H2H (detailed) - ALWAYS include even if default values
              h2h: {
                team1WinRate: h2h.team1WinRate || 0.5,
                drawRate: h2h.drawRate || 0.25,
                totalGoalsAvg: h2h.totalGoalsAvg || 3.0,
                recentTrend: h2h.recentTrend || 0,
                totalMatches: 5, // Default
                bothTeamsScoredRate: 0.5, // Default
              },
              headToHead: {
                winRate: h2h.team1WinRate || 0.5,
                goalsAvg: h2h.totalGoalsAvg || 3.0,
                matchesCount: 5,
                recentTrend: h2h.recentTrend || 0,
                avgTotalGoals: h2h.totalGoalsAvg || 3.0,
                bothTeamsScoredRate: 0.5,
                impact: 0.2,
                homeAdvantage: 0.1,
              },
              // Market intelligence (detailed) - ALWAYS include even if default values
              market: {
                consensus: market.consensus || 0.7,
                efficiency: market.efficiency || 0.9,
                sharpMoneyIndicator: market.sharpMoneyIndicator || 0.5,
                valueOpportunity: market.valueOpportunity || 0.02,
                oddsSpread: market.oddsSpread || 0.1,
              },
              marketOdds: (() => {
                const oddsNums = oddsArray.map(Number).filter(o => o > 0);
                if (oddsNums.length === 0) {
                  return {
                    impliedProbability: 0,
                    consensus: market.consensus || 0.7,
                    volatility: 1 - (market.efficiency || 0.9),
                    bookmakerCount: 0,
                    stdDev: 0,
                    median: 0,
                    minOdds: 0,
                    maxOdds: 0,
                  };
                }
                const probs = oddsNums.map(odd => 1 / odd);
                const meanProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;
                const variance = probs.reduce((sum, p) => sum + Math.pow(p - meanProb, 2), 0) / probs.length;
                const stdDev = Math.sqrt(variance);
                const sortedOdds = [...oddsNums].sort((a, b) => a - b);
                const median = sortedOdds.length % 2 === 0
                  ? (sortedOdds[sortedOdds.length / 2 - 1] + sortedOdds[sortedOdds.length / 2]) / 2
                  : sortedOdds[Math.floor(sortedOdds.length / 2)];
                
                return {
                  impliedProbability: meanProb,
                  consensus: market.consensus || 0.7,
                  volatility: 1 - (market.efficiency || 0.9),
                  bookmakerCount: oddsNums.length,
                  stdDev,
                  median,
                  minOdds: Math.min(...oddsNums),
                  maxOdds: Math.max(...oddsNums),
                };
              })(),
              marketIntelligence: {
                sentiment: market.sharpMoneyIndicator || 0.5,
                volume: market.valueOpportunity || 0.02,
                movement: 0,
                trend: market.oddsSpread || 0.1,
                confidence: market.consensus || 0.7,
              },
              // Historical performance - ALWAYS include
              historicalPerformance: {
                winRate: ((homeForm.winRate5 || 0.5) + (awayForm.winRate5 || 0.5)) / 2,
                goalsAvg: (homeForm.goalsForAvg5 || 1.5) + (awayForm.goalsForAvg5 || 1.5),
                goalsAgainstAvg: (homeForm.goalsAgainstAvg5 || 1.5) + (awayForm.goalsAgainstAvg5 || 1.5),
                matchesCount: 5,
                impact: 0.3,
                cleanSheets: 0.2, // Default
                avgPossession: 0.5, // Default
                shotsOnTarget: 5.0, // Default
              },
              // Team strength - ALWAYS include
              teamStrength: {
                home: (allFeatures.formAdvantage || 0) > 0 ? 1 : 0,
                away: (allFeatures.formAdvantage || 0) < 0 ? 1 : 0,
              },
              // Relative features (for ML) - ALWAYS include
              formAdvantage: allFeatures.formAdvantage || 0,
              goalsAdvantage: allFeatures.goalsAdvantage || 0,
              defenseAdvantage: allFeatures.defenseAdvantage || 0,
              // Market intelligence direct properties (for ML extraction) - ALWAYS include
              market_consensus: market.consensus || 0.7,
              market_volatility: 1 - (market.efficiency || 0.9),
              market_sentiment: market.sharpMoneyIndicator || 0.5,
              // Trend and momentum - ALWAYS include
              trend: allFeatures.formAdvantage || 0,
              momentum: (homeForm.currentStreak || 0) + (awayForm.currentStreak || 0),
              // Additional features for ML (injuries, weather, etc.) - defaults
              injuries: {
                count: 0,
                keyPlayersCount: 0,
                riskLevel: 'low',
                suspensionsCount: 0,
                goalkeeperInjured: 0,
                defenderInjured: 0,
                midfielderInjured: 0,
                forwardInjured: 0,
              },
              weather: {
                risk: 'low',
                temperature: 20,
                windSpeed: 0,
              },
            };
            logger.debug(`Advanced features calculated for event ${event.id}:`, {
              hasHomeForm: !!allFeatures.homeForm,
              hasAwayForm: !!allFeatures.awayForm,
              hasH2H: !!allFeatures.h2h,
              hasMarket: !!allFeatures.market,
            });
          } catch (error: any) {
            logger.warn(`Could not fetch advanced features for event ${event.id}: ${error.message}`);
            // Set defaults to ensure structure is consistent (all 50+ features) - COMPLETE STRUCTURE
            advancedFeatures = {
              homeForm: {
                winRate5: 0.5,
                winRate10: 0.5,
                goalsForAvg5: 1.5,
                goalsAgainstAvg5: 1.5,
                currentStreak: 0,
                formTrend: 0,
                wins5: 2,
                losses5: 2,
                draws5: 1,
              },
              awayForm: {
                winRate5: 0.5,
                winRate10: 0.5,
                goalsForAvg5: 1.5,
                goalsAgainstAvg5: 1.5,
                currentStreak: 0,
                formTrend: 0,
                wins5: 2,
                losses5: 2,
                draws5: 1,
              },
              form: {
                winRate: 0.5,
                goalsScored: 3.0,
                goalsConceded: 3.0,
                matchesCount: 5,
                momentum: 0,
                recentWins: 2,
                recentLosses: 2,
                recentDraws: 1,
                impact: 0.3,
              },
              h2h: {
                team1WinRate: 0.5,
                drawRate: 0.25,
                totalGoalsAvg: 3.0,
                recentTrend: 0,
                totalMatches: 5,
                bothTeamsScoredRate: 0.5,
              },
              headToHead: {
                winRate: 0.5,
                goalsAvg: 3.0,
                matchesCount: 5,
                recentTrend: 0,
                avgTotalGoals: 3.0,
                bothTeamsScoredRate: 0.5,
                impact: 0.2,
                homeAdvantage: 0.1,
              },
              market: {
                consensus: 0.7,
                efficiency: 0.9,
                sharpMoneyIndicator: 0.5,
                valueOpportunity: 0.02,
                oddsSpread: 0.1,
              },
              marketOdds: (() => {
                const oddsNums = oddsArray.map(Number).filter(o => o > 0);
                if (oddsNums.length === 0) {
                  return {
                    impliedProbability: 0,
                    consensus: 0.7,
                    volatility: 0.1,
                    bookmakerCount: 0,
                    stdDev: 0,
                    median: 0,
                    minOdds: 0,
                    maxOdds: 0,
                  };
                }
                const probs = oddsNums.map(odd => 1 / odd);
                const meanProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;
                const variance = probs.reduce((sum, p) => sum + Math.pow(p - meanProb, 2), 0) / probs.length;
                const stdDev = Math.sqrt(variance);
                const sortedOdds = [...oddsNums].sort((a, b) => a - b);
                const median = sortedOdds.length % 2 === 0
                  ? (sortedOdds[sortedOdds.length / 2 - 1] + sortedOdds[sortedOdds.length / 2]) / 2
                  : sortedOdds[Math.floor(sortedOdds.length / 2)];
                
                return {
                  impliedProbability: meanProb,
                  consensus: 0.7,
                  volatility: 0.1,
                  bookmakerCount: oddsNums.length,
                  stdDev,
                  median,
                  minOdds: Math.min(...oddsNums),
                  maxOdds: Math.max(...oddsNums),
                };
              })(),
              marketIntelligence: {
                sentiment: 0.5,
                volume: 0.02,
                movement: 0,
                trend: 0.1,
                confidence: 0.7,
              },
              historicalPerformance: {
                winRate: 0.5,
                goalsAvg: 3.0,
                goalsAgainstAvg: 3.0,
                matchesCount: 5,
                impact: 0.3,
                cleanSheets: 0.2,
                avgPossession: 0.5,
                shotsOnTarget: 5.0,
              },
              teamStrength: {
                home: 0,
                away: 0,
              },
              formAdvantage: 0,
              goalsAdvantage: 0,
              defenseAdvantage: 0,
              market_consensus: 0.7,
              market_volatility: 0.1,
              market_sentiment: 0.5,
              trend: 0,
              momentum: 0,
              injuries: {
                count: 0,
                keyPlayersCount: 0,
                riskLevel: 'low',
                suspensionsCount: 0,
                goalkeeperInjured: 0,
                defenderInjured: 0,
                midfielderInjured: 0,
                forwardInjured: 0,
              },
              weather: {
                risk: 'low',
                temperature: 20,
                windSpeed: 0,
              },
            };
          }

          // CRITICAL FIX: Always normalize probabilities, never use independent calculations
          // Variables already declared above (lines 446-460), just use them
          
          // CRITICAL: Use advanced prediction analysis service for individual confidence calculation
          // This ensures each selection gets its own confidence based on real data analysis
          let confidence = 0.65; // Default fallback
          
          try {
            // Use advanced prediction analysis to get individual confidence for this selection
            const advancedAnalysis = await advancedPredictionAnalysisService.analyzeAndPredict(
              event.id,
              selection,
              {
                home: selections.home || [],
                away: selections.away || [],
                draw: selections.draw || [],
              },
              advancedFeatures
            );
            
            // Use the confidence from the advanced analysis (already calculated per selection)
            confidence = advancedAnalysis.confidence || 0.65;
          } catch (error: any) {
            logger.warn(`Could not get advanced analysis for ${selection}, using fallback confidence: ${error.message}`);
            // Fallback: Calculate confidence based on market consensus and data quality
            const variance = impliedProbs.reduce((sum, p) => sum + Math.pow(p - avgImpliedProb, 2), 0) / impliedProbs.length;
            const stdDev = Math.sqrt(variance);
            const marketConsensus = 1 - Math.min(stdDev * 2, 0.5);
            
            // Adjust confidence based on available data
            let dataQuality = 0.5; // Base quality
            if (advancedFeatures.homeForm?.isRealData) dataQuality += 0.15;
            if (advancedFeatures.awayForm?.isRealData) dataQuality += 0.15;
            if (advancedFeatures.h2h?.isRealData || advancedFeatures.headToHead?.isRealData) dataQuality += 0.1;
            if (advancedFeatures.marketOdds?.bookmakerCount > 5) dataQuality += 0.1;
            
            confidence = Math.max(0.45, Math.min(0.95, marketConsensus * 0.7 + dataQuality * 0.3));
          }
          
          // Use normalized probability instead of independent calculation
          prediction = {
            predictedProbability: Math.max(0.01, Math.min(0.99, normalizedProb)),
            confidence,
            factors: {
              marketAverage: avgImpliedProb,
              normalized: normalizedProb,
              totalImplied: totalImplied,
              bookmakerMargin: totalImplied > 1 ? ((totalImplied - 1) * 100).toFixed(2) : 0,
              marketConsensus,
              ...advancedFeatures, // Include all advanced features
            },
          };
          }
          // Calculate simple normalized probability from market odds
          // Check if prediction already exists
          const existing = await prisma.prediction.findFirst({
            where: {
              eventId: event.id,
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
              const updatedPrediction = await predictionsService.createPrediction({
                eventId: event.id,
                marketId: market.id,
                selection: selection,
                predictedProbability: prediction.predictedProbability,
                confidence: prediction.confidence,
                modelVersion: this.MODEL_VERSION,
                factors: prediction.factors,
              });

              // Emit WebSocket notification for real-time update
              webSocketService.emitPredictionUpdate(event.id, {
                id: updatedPrediction.id,
                selection: selection,
                predictedProbability: prediction.predictedProbability,
                confidence: prediction.confidence,
                previousProbability: existing.predictedProbability,
                change: prediction.predictedProbability - existing.predictedProbability,
                eventName: `${event.homeTeam} vs ${event.awayTeam}`,
              });

              updated++;
            }
          } else {
            // Create new prediction
            await predictionsService.createPrediction({
              eventId: event.id,
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

      // ⚠️ NUEVO: Detectar value bets automáticamente después de generar predicciones
      if (generated > 0 || updated > 0) {
        try {
          // Reload event with predictions to detect value bets
          const eventWithPredictions = await prisma.event.findUnique({
            where: { id: event.id },
            include: {
              sport: true,
              markets: {
                where: { 
              isActive: true,
              // Include multiple market types for richer predictions
              type: { in: ['MATCH_WINNER', 'OVER_UNDER', 'BOTH_TEAMS_SCORE', 'DOUBLE_CHANCE', 'CORRECT_SCORE'] }
            },
                include: { odds: { where: { isActive: true } } },
              },
              Prediction: {
                where: { wasCorrect: null },
              },
            },
          });

          if (eventWithPredictions && eventWithPredictions.Prediction.length > 0) {
            await valueBetDetectionService.detectValueBetsForEvent(eventWithPredictions, {
              minValue: 0.05, // 5% minimum value
              autoCreateAlerts: true, // Automatically create alerts
            });
            logger.info(`Detected value bets for event ${event.id} after generating predictions`);
          }
        } catch (error: any) {
          logger.warn(`Error detecting value bets for event ${event.id}:`, error.message);
          // Don't fail prediction generation if value bet detection fails
        }
      }

      return { generated, updated };
    } catch (error: any) {
      logger.error(`Error generating predictions for event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Generate predictions for a single event (DEPRECATED - uses The Odds API)
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

            // PROFESSIONAL: Lower threshold (3% instead of 5%) for more frequent real-time updates
            if (previousAvgOdds && Math.abs(currentAvgOdds - previousAvgOdds) / previousAvgOdds > 0.03) {
              // Odds changed more than 3%, recalculate prediction
              const newPrediction = await improvedPredictionService.calculatePredictedProbability(
                event.id,
                prediction.selection,
                currentOdds
              );

              const updatedPrediction = await predictionsService.createPrediction({
                eventId: event.id,
                marketId: prediction.marketId,
                selection: prediction.selection,
                predictedProbability: newPrediction.predictedProbability,
                confidence: newPrediction.confidence,
                modelVersion: this.MODEL_VERSION,
                factors: newPrediction.factors,
              });

              // Emit WebSocket notification for real-time update
              webSocketService.emitPredictionUpdate(event.id, {
                id: updatedPrediction.id,
                selection: prediction.selection,
                predictedProbability: newPrediction.predictedProbability,
                confidence: newPrediction.confidence,
                previousProbability: prediction.predictedProbability,
                change: newPrediction.predictedProbability - prediction.predictedProbability,
                eventName: `${event.homeTeam} vs ${event.awayTeam}`,
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

