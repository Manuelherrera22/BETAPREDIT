/**
 * Script to search for predictions about Real Madrid vs Manchester United
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

async function searchPrediction() {
  try {
    logger.info('🔍 Buscando predicciones sobre Real Madrid vs Manchester United...');
    
    // Search for events with Real Madrid and Manchester United
    const events = await prisma.event.findMany({
      where: {
        OR: [
          {
            AND: [
              { homeTeam: { contains: 'Real Madrid', mode: 'insensitive' } },
              { awayTeam: { contains: 'Manchester United', mode: 'insensitive' } },
            ],
          },
          {
            AND: [
              { homeTeam: { contains: 'Manchester United', mode: 'insensitive' } },
              { awayTeam: { contains: 'Real Madrid', mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        Prediction: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    if (events.length === 0) {
      logger.info('❌ No se encontraron eventos entre Real Madrid y Manchester United en la base de datos.');
      logger.info('');
      logger.info('💡 Esto podría significar que:');
      logger.info('   1. El evento aún no ha sido sincronizado desde las APIs externas');
      logger.info('   2. El evento ocurrió hace más tiempo y ya no está en la base de datos');
      logger.info('   3. Los nombres de los equipos pueden ser diferentes en la base de datos');
      return;
    }

    logger.info(`✅ Se encontraron ${events.length} evento(s):`);
    logger.info('');

    for (const event of events) {
      logger.info(`📅 Evento: ${event.homeTeam} vs ${event.awayTeam}`);
      logger.info(`   Fecha: ${event.startTime}`);
      logger.info(`   Estado: ${event.status}`);
      logger.info(`   Predicciones: ${event.Prediction.length}`);
      
      if (event.Prediction.length > 0) {
        logger.info('');
        logger.info('   Predicciones:');
        for (const pred of event.Prediction) {
          logger.info(`     - Selección: ${pred.selection}`);
          logger.info(`       Probabilidad: ${(pred.predictedProbability * 100).toFixed(2)}%`);
          logger.info(`       Confianza: ${(pred.confidence * 100).toFixed(2)}%`);
          logger.info(`       Resultado: ${pred.wasCorrect === null ? 'Pendiente' : pred.wasCorrect ? '✅ Correcta' : '❌ Incorrecta'}`);
          logger.info(`       Fecha: ${pred.createdAt}`);
          logger.info('');
        }
      } else {
        logger.info('   ⚠️  No hay predicciones para este evento');
        logger.info('');
      }
    }
  } catch (error: any) {
    logger.error('❌ Error buscando predicción:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  searchPrediction()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script falló:', error);
      process.exit(1);
    });
}

export { searchPrediction };

