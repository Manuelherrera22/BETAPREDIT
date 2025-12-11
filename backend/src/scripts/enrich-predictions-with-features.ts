/**
 * Script to enrich existing predictions with advanced features
 * This will update predictions that don't have all 50+ features
 * to include them, improving the ML training dataset
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { advancedFeaturesService } from '../services/advanced-features.service';

async function enrichPredictions() {
  try {
    logger.info('🚀 Starting prediction enrichment with advanced features...');

    // Get all predictions that might need enrichment
    // Focus on predictions that have basic factors but might be missing advanced features
    const predictions = await prisma.prediction.findMany({
      where: {
        factors: {
          not: null,
        },
        // Only enrich predictions for events that haven't finished yet
        event: {
          status: {
            not: 'FINISHED',
          },
        },
      },
      include: {
        event: {
          include: {
            sport: true,
          },
        },
      },
      take: 100, // Process in batches
    });

    logger.info(`Found ${predictions.length} predictions to potentially enrich`);

    let enriched = 0;
    let skipped = 0;
    let errors = 0;

    for (const prediction of predictions) {
      try {
        // Check if prediction already has advanced features
        const factors = typeof prediction.factors === 'string' 
          ? JSON.parse(prediction.factors) 
          : prediction.factors;

        // Check if it has advanced features (homeForm, awayForm, h2h, market)
        const hasAdvancedFeatures = 
          factors?.homeForm || 
          factors?.awayForm || 
          factors?.h2h || 
          factors?.market ||
          factors?.formAdvantage !== undefined;

        if (hasAdvancedFeatures) {
          skipped++;
          continue;
        }

        // Get advanced features for this event
        const allFeatures = await advancedFeaturesService.getAllAdvancedFeatures(
          prediction.eventId,
          prediction.event.homeTeam,
          prediction.event.awayTeam,
          prediction.event.sportId
        );

        // Structure advanced features (same as in auto-predictions.service.ts)
        const advancedFeatures = {
          // Team form (detailed)
          homeForm: allFeatures.homeForm || {},
          awayForm: allFeatures.awayForm || {},
          form: {
            winRate: ((allFeatures.homeForm?.winRate5 || 0) + (allFeatures.awayForm?.winRate5 || 0)) / 2,
            goalsScored: (allFeatures.homeForm?.goalsForAvg5 || 0) + (allFeatures.awayForm?.goalsForAvg5 || 0),
            goalsConceded: (allFeatures.homeForm?.goalsAgainstAvg5 || 0) + (allFeatures.awayForm?.goalsAgainstAvg5 || 0),
            matchesCount: 5,
            momentum: (allFeatures.homeForm?.currentStreak || 0) + (allFeatures.awayForm?.currentStreak || 0),
            recentWins: (allFeatures.homeForm?.wins5 || 0) + (allFeatures.awayForm?.wins5 || 0),
            recentLosses: (allFeatures.homeForm?.losses5 || 0) + (allFeatures.awayForm?.losses5 || 0),
            recentDraws: (allFeatures.homeForm?.draws5 || 0) + (allFeatures.awayForm?.draws5 || 0),
          },
          // H2H (detailed)
          h2h: allFeatures.h2h || {},
          headToHead: {
            winRate: allFeatures.h2h?.team1WinRate || 0,
            goalsAvg: allFeatures.h2h?.totalGoalsAvg || 0,
            matchesCount: allFeatures.h2h?.totalMatches || 0,
            recentTrend: allFeatures.h2h?.recentTrend || 0,
            avgTotalGoals: allFeatures.h2h?.totalGoalsAvg || 0,
            bothTeamsScoredRate: allFeatures.h2h?.bothTeamsScoredRate || 0,
          },
          // Market intelligence (detailed)
          market: allFeatures.market || {},
          marketOdds: {
            impliedProbability: 0,
            consensus: allFeatures.market?.consensus || 0,
            volatility: allFeatures.market?.efficiency || 0,
            bookmakerCount: 0,
            stdDev: 0,
            median: 0,
            minOdds: 0,
            maxOdds: 0,
          },
          marketIntelligence: {
            sentiment: allFeatures.market?.sharpMoneyIndicator || 0,
            volume: allFeatures.market?.valueOpportunity || 0,
            movement: 0,
            trend: allFeatures.market?.oddsSpread || 0,
            confidence: allFeatures.market?.consensus || 0,
          },
          // Historical performance
          historicalPerformance: {
            winRate: ((allFeatures.homeForm?.winRate5 || 0) + (allFeatures.awayForm?.winRate5 || 0)) / 2,
            goalsAvg: (allFeatures.homeForm?.goalsForAvg5 || 0) + (allFeatures.awayForm?.goalsForAvg5 || 0),
            goalsAgainstAvg: (allFeatures.homeForm?.goalsAgainstAvg5 || 0) + (allFeatures.awayForm?.goalsAgainstAvg5 || 0),
            matchesCount: 5,
            cleanSheets: 0,
            avgPossession: 0,
            shotsOnTarget: 0,
          },
          // Team strength
          teamStrength: {
            home: allFeatures.formAdvantage > 0 ? 1 : 0,
            away: allFeatures.formAdvantage < 0 ? 1 : 0,
          },
          // Relative features (for ML)
          formAdvantage: allFeatures.formAdvantage || 0,
          goalsAdvantage: allFeatures.goalsAdvantage || 0,
          defenseAdvantage: allFeatures.defenseAdvantage || 0,
          // Market intelligence direct properties (for ML extraction)
          market_consensus: allFeatures.market?.consensus || 0,
          market_volatility: allFeatures.market?.efficiency || 0,
          market_sentiment: allFeatures.market?.sharpMoneyIndicator || 0,
          // Trend and momentum
          trend: allFeatures.formAdvantage || 0,
          momentum: (allFeatures.homeForm?.currentStreak || 0) + (allFeatures.awayForm?.currentStreak || 0),
        };

        // Merge with existing factors
        const enrichedFactors = {
          ...factors,
          ...advancedFeatures,
        };

        // Update prediction
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            factors: enrichedFactors,
          },
        });

        enriched++;
        if (enriched % 10 === 0) {
          logger.info(`Enriched ${enriched} predictions so far...`);
        }
      } catch (error: any) {
        logger.error(`Error enriching prediction ${prediction.id}:`, error.message);
        errors++;
      }
    }

    logger.info('');
    logger.info('✅ Prediction enrichment completed!');
    logger.info(`📊 Results:`);
    logger.info(`  - Enriched: ${enriched}`);
    logger.info(`  - Skipped (already had features): ${skipped}`);
    logger.info(`  - Errors: ${errors}`);
    logger.info('');
    logger.info('💡 Next step: Re-train the ML model with enriched predictions');

    return { enriched, skipped, errors };
  } catch (error: any) {
    logger.error('❌ Prediction enrichment failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  enrichPredictions()
    .then(() => {
      logger.info('Enrichment script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Enrichment script failed:', error);
      process.exit(1);
    });
}

export { enrichPredictions };

