/**
 * Script to check if a prediction has all advanced features
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

async function checkPredictionFeatures() {
  try {
    const pred = await prisma.prediction.findFirst({
      where: { wasCorrect: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, factors: true },
    });

    if (!pred) {
      logger.warn('No se encontraron predicciones sin resolver');
      return;
    }

    const factors = typeof pred.factors === 'string' ? JSON.parse(pred.factors) : pred.factors;

    logger.info(`Predicción ID: ${pred.id}`);
    logger.info(`Keys en factors: ${Object.keys(factors).join(', ')}`);
    logger.info(`Total keys: ${Object.keys(factors).length}`);
    logger.info('');

    // Check if features are in advancedFeatures or directly in factors
    const advancedFeatures = factors.advancedFeatures || factors;
    
    logger.info('Estructura de features:');
    logger.info(`  - homeForm: ${!!advancedFeatures.homeForm} ${advancedFeatures.homeForm ? `(${Object.keys(advancedFeatures.homeForm).length} keys)` : ''}`);
    logger.info(`  - awayForm: ${!!advancedFeatures.awayForm} ${advancedFeatures.awayForm ? `(${Object.keys(advancedFeatures.awayForm).length} keys)` : ''}`);
    logger.info(`  - h2h: ${!!advancedFeatures.h2h} ${advancedFeatures.h2h ? `(${Object.keys(advancedFeatures.h2h).length} keys)` : ''}`);
    logger.info(`  - market: ${!!advancedFeatures.market} ${advancedFeatures.market ? `(${Object.keys(advancedFeatures.market).length} keys)` : ''}`);
    logger.info(`  - marketOdds: ${!!advancedFeatures.marketOdds} ${advancedFeatures.marketOdds ? `(${Object.keys(advancedFeatures.marketOdds).length} keys)` : ''}`);
    logger.info(`  - historicalPerformance: ${!!advancedFeatures.historicalPerformance} ${advancedFeatures.historicalPerformance ? `(${Object.keys(advancedFeatures.historicalPerformance).length} keys)` : ''}`);
    logger.info(`  - injuries: ${!!advancedFeatures.injuries} ${advancedFeatures.injuries ? `(${Object.keys(advancedFeatures.injuries).length} keys)` : ''}`);
    logger.info(`  - weather: ${!!advancedFeatures.weather} ${advancedFeatures.weather ? `(${Object.keys(advancedFeatures.weather).length} keys)` : ''}`);

    // Count total features for ML
    const countFeatures = (obj: any): number => {
      if (!obj || typeof obj !== 'object') return 0;
      let count = 0;
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          count += countFeatures(obj[key]);
        } else if (typeof obj[key] === 'number' || typeof obj[key] === 'string') {
          count++;
        }
      }
      return count;
    };
    
    const totalFeatures = countFeatures(advancedFeatures);
    logger.info('');
    logger.info(`✅ Total features extraíbles para ML: ${totalFeatures}`);
    logger.info('');

    if (advancedFeatures.homeForm) {
      logger.info('homeForm keys:', Object.keys(advancedFeatures.homeForm).join(', '));
    }
    if (advancedFeatures.awayForm) {
      logger.info('awayForm keys:', Object.keys(advancedFeatures.awayForm).join(', '));
    }
    if (advancedFeatures.h2h) {
      logger.info('h2h keys:', Object.keys(advancedFeatures.h2h).join(', '));
    }
    if (advancedFeatures.market) {
      logger.info('market keys:', Object.keys(advancedFeatures.market).join(', '));
    }
    if (advancedFeatures.marketOdds) {
      logger.info('marketOdds keys:', Object.keys(advancedFeatures.marketOdds).join(', '));
    }
  } catch (error: any) {
    logger.error('Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkPredictionFeatures()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script falló:', error);
      process.exit(1);
    });
}

export { checkPredictionFeatures };


