/**
 * Script to delete old predictions and regenerate them with ALL advanced features (50+)
 */

import { prisma } from '../config/database';
import { autoPredictionsService } from '../services/auto-predictions.service';
import { logger } from '../utils/logger';

async function regeneratePredictions() {
  try {
    logger.info('🗑️  Eliminando predicciones antiguas sin features completas...');
    
    // Delete unresolved predictions (they will be regenerated with all features)
    const deleted = await prisma.prediction.deleteMany({
      where: {
        wasCorrect: null, // Only unresolved predictions
      },
    });
    
    logger.info(`✅ ${deleted.count} predicciones eliminadas`);
    logger.info('');
    logger.info('🔄 Regenerando predicciones con TODAS las features avanzadas (50+)...');
    
    // Regenerate predictions with all advanced features
    const result = await autoPredictionsService.generatePredictionsForUpcomingEvents();
    
    logger.info('');
    logger.info('✅ Predicciones regeneradas:');
    logger.info(`   - Generadas: ${result.generated}`);
    logger.info(`   - Actualizadas: ${result.updated}`);
    logger.info(`   - Errores: ${result.errors}`);
    
    return result;
  } catch (error: any) {
    logger.error('❌ Error regenerando predicciones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  regeneratePredictions()
    .then(() => {
      logger.info('Script completado');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script falló:', error);
      process.exit(1);
    });
}

export { regeneratePredictions };


