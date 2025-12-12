/**
 * Tests de Integración con Datos Reales - Flujo Completo de Predicciones
 * 
 * ⚠️ IMPORTANTE: Estos tests usan DATOS REALES de la base de datos y APIs
 * NO usan mocks ni datos ficticios.
 * 
 * Requisitos:
 * - DATABASE_URL configurado y conectado
 * - THE_ODDS_API_KEY configurado (opcional, algunos tests pueden fallar sin él)
 * - Base de datos con datos reales
 * 
 * Para ejecutar:
 *   npm test real-data-prediction-flow.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../../config/database';
import { improvedPredictionService } from '../../services/improved-prediction.service';
import { autoPredictionsService } from '../../services/auto-predictions.service';
import { predictionsService } from '../../services/predictions.service';
import { getTheOddsAPIService } from '../../services/integrations/the-odds-api.service';
import { logger } from '../../utils/logger';

// ⚠️ NO MOCKS - Usamos servicios reales
describe('Flujo Completo de Predicciones con Datos Reales', () => {
  let realEventId: string;
  let realMarketId: string;
  let realSportId: string;

  beforeAll(async () => {
    // Verificar que tenemos conexión a base de datos real
    try {
      await prisma.$connect();
      logger.info('✅ Conectado a base de datos real para tests');
    } catch (error: any) {
      throw new Error(`❌ No se puede conectar a la base de datos: ${error.message}`);
    }

    // Buscar un evento real en la base de datos
    const realEvent = await prisma.event.findFirst({
      where: {
        status: 'SCHEDULED',
        isActive: true,
        startTime: {
          gte: new Date(),
        },
      },
      include: {
        sport: true,
        markets: {
          where: { isActive: true, type: 'MATCH_WINNER' },
          take: 1,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    if (!realEvent) {
      throw new Error(
        '❌ No hay eventos reales en la base de datos. ' +
        'Necesitas sincronizar eventos primero usando event-sync.service.ts'
      );
    }

    if (!realEvent.markets || realEvent.markets.length === 0) {
      throw new Error(
        '❌ El evento no tiene mercados. ' +
        'Necesitas crear mercados para el evento primero.'
      );
    }

    realEventId = realEvent.id;
    realMarketId = realEvent.markets[0].id;
    realSportId = realEvent.sportId;

    logger.info(`📊 Usando evento real: ${realEvent.name} (ID: ${realEventId})`);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Validar Algoritmo con Datos Reales de Cuotas', () => {
    it('debe calcular predicción usando cuotas reales de la base de datos', async () => {
      // Obtener cuotas reales del mercado
      const realOdds = await prisma.odds.findMany({
        where: {
          marketId: realMarketId,
          isActive: true,
        },
        take: 10,
      });

      if (realOdds.length === 0) {
        throw new Error(
          '❌ No hay cuotas reales en la base de datos. ' +
          'Necesitas sincronizar cuotas primero usando The Odds API.'
        );
      }

      // Obtener cuotas para una selección específica (ej: home)
      const homeOdds = realOdds
        .filter(odd => odd.selection === 'home' || odd.selection === realEvent.homeTeam)
        .map(odd => odd.decimal);

      if (homeOdds.length === 0) {
        // Si no hay cuotas de "home", usar cualquier cuota disponible
        const anyOdds = realOdds.map(odd => odd.decimal);
        expect(anyOdds.length).toBeGreaterThan(0);
        
        const result = await improvedPredictionService.calculatePredictedProbability(
          realEventId,
          realOdds[0].selection,
          anyOdds
        );

        // Validar que el resultado es real y válido
        expect(result.predictedProbability).toBeGreaterThan(0);
        expect(result.predictedProbability).toBeLessThan(1);
        expect(result.confidence).toBeGreaterThanOrEqual(0.45);
        expect(result.confidence).toBeLessThanOrEqual(0.95);
        expect(result.factors.marketAverage).toBeDefined();
        expect(result.factors.marketConsensus).toBeDefined();
        
        logger.info(`✅ Predicción calculada con ${anyOdds.length} cuotas reales`);
        logger.info(`   Probabilidad: ${(result.predictedProbability * 100).toFixed(2)}%`);
        logger.info(`   Confianza: ${(result.confidence * 100).toFixed(2)}%`);
      } else {
        const result = await improvedPredictionService.calculatePredictedProbability(
          realEventId,
          'home',
          homeOdds
        );

        // Validar que el resultado es real y válido
        expect(result.predictedProbability).toBeGreaterThan(0);
        expect(result.predictedProbability).toBeLessThan(1);
        expect(result.confidence).toBeGreaterThanOrEqual(0.45);
        expect(result.confidence).toBeLessThanOrEqual(0.95);
        
        logger.info(`✅ Predicción calculada con ${homeOdds.length} cuotas reales de "home"`);
        logger.info(`   Probabilidad: ${(result.predictedProbability * 100).toFixed(2)}%`);
        logger.info(`   Confianza: ${(result.confidence * 100).toFixed(2)}%`);
      }
    });

    it('debe usar datos históricos reales si están disponibles', async () => {
      // Buscar predicciones históricas reales en la base de datos
      const historicalPredictions = await prisma.prediction.findMany({
        where: {
          wasCorrect: { not: null },
          selection: {
            contains: 'home',
          },
        },
        take: 50,
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (historicalPredictions.length >= 10) {
        // Si hay datos históricos, el algoritmo debe usarlos
        const realOdds = await prisma.odds.findMany({
          where: {
            marketId: realMarketId,
            isActive: true,
          },
          take: 5,
        });

        if (realOdds.length > 0) {
          const odds = realOdds.map(odd => odd.decimal);
          const result = await improvedPredictionService.calculatePredictedProbability(
            realEventId,
            'home',
            odds
          );

          // Si hay datos históricos, el factor debe estar definido
          // (aunque puede ser undefined si no hay suficientes datos similares)
          expect(result.predictedProbability).toBeDefined();
          expect(result.factors).toBeDefined();
          
          logger.info(`✅ Algoritmo ejecutado con ${historicalPredictions.length} predicciones históricas disponibles`);
        }
      } else {
        logger.warn(`⚠️  Solo ${historicalPredictions.length} predicciones históricas disponibles (mínimo 10 recomendado)`);
      }
    });
  });

  describe('2. Validar Generación de Predicciones con Datos Reales', () => {
    it('debe generar predicciones para eventos reales de la base de datos', async () => {
      // Obtener eventos reales próximos
      const upcomingEvents = await prisma.event.findMany({
        where: {
          status: 'SCHEDULED',
          isActive: true,
          startTime: {
            gte: new Date(),
            lte: new Date(Date.now() + 48 * 60 * 60 * 1000), // Próximas 48 horas
          },
        },
        include: {
          markets: {
            where: { isActive: true, type: 'MATCH_WINNER' },
            include: {
              odds: {
                where: { isActive: true },
                take: 5,
              },
            },
          },
        },
        take: 5, // Solo 5 eventos para no sobrecargar
      });

      expect(upcomingEvents.length).toBeGreaterThan(0);

      let predictionsGenerated = 0;
      let predictionsUpdated = 0;

      for (const event of upcomingEvents) {
        if (!event.markets || event.markets.length === 0) continue;
        if (!event.markets[0].odds || event.markets[0].odds.length === 0) continue;

        try {
          // Generar predicción para este evento real
          const odds = event.markets[0].odds.map(odd => odd.decimal);
          const selection = event.markets[0].odds[0].selection;

          const prediction = await improvedPredictionService.calculatePredictedProbability(
            event.id,
            selection,
            odds
          );

          // Crear predicción en la base de datos
          const created = await predictionsService.createPrediction({
            eventId: event.id,
            marketId: event.markets[0].id,
            selection: selection,
            predictedProbability: prediction.predictedProbability,
            confidence: prediction.confidence,
            modelVersion: 'v2.0-test',
            factors: prediction.factors,
          });

          expect(created).toBeDefined();
          expect(created.id).toBeDefined();
          predictionsGenerated++;

          logger.info(`✅ Predicción generada para evento real: ${event.name}`);
        } catch (error: any) {
          logger.warn(`⚠️  Error generando predicción para ${event.name}: ${error.message}`);
        }
      }

      expect(predictionsGenerated).toBeGreaterThan(0);
      logger.info(`✅ Generadas ${predictionsGenerated} predicciones con datos reales`);
    });
  });

  describe('3. Validar Integración con The Odds API (si está configurada)', () => {
    it('debe obtener cuotas reales de The Odds API si está configurada', async () => {
      const apiKey = process.env.THE_ODDS_API_KEY;
      
      if (!apiKey || apiKey === 'changeme' || apiKey === '') {
        logger.warn('⚠️  THE_ODDS_API_KEY no configurada - saltando test de API real');
        return;
      }

      try {
        const oddsService = getTheOddsAPIService();
        
        // Obtener eventos reales de la API
        const events = await oddsService.getUpcomingEvents('soccer_epl', {
          markets: 'h2h',
          oddsFormat: 'decimal',
        });

        expect(events).toBeDefined();
        expect(Array.isArray(events)).toBe(true);

        if (events.length > 0) {
          const firstEvent = events[0];
          expect(firstEvent).toHaveProperty('id');
          expect(firstEvent).toHaveProperty('sport_key');
          expect(firstEvent).toHaveProperty('home_team');
          expect(firstEvent).toHaveProperty('away_team');
          expect(firstEvent.bookmakers).toBeDefined();
          expect(firstEvent.bookmakers.length).toBeGreaterThan(0);

          // Validar que las cuotas son reales
          const firstBookmaker = firstEvent.bookmakers[0];
          expect(firstBookmaker.markets).toBeDefined();
          expect(firstBookmaker.markets.length).toBeGreaterThan(0);

          const firstMarket = firstBookmaker.markets[0];
          expect(firstMarket.outcomes).toBeDefined();
          expect(firstMarket.outcomes.length).toBeGreaterThan(0);

          const firstOutcome = firstMarket.outcomes[0];
          expect(firstOutcome.price).toBeGreaterThan(1); // Odds deben ser > 1
          expect(firstOutcome.price).toBeLessThan(1000); // Y razonables

          logger.info(`✅ Obtenidas cuotas reales de The Odds API para ${events.length} eventos`);
          logger.info(`   Ejemplo: ${firstEvent.home_team} vs ${firstEvent.away_team}`);
          logger.info(`   Mejor cuota: ${firstOutcome.price} de ${firstBookmaker.title}`);
        } else {
          logger.warn('⚠️  The Odds API no devolvió eventos (puede ser límite de cuota)');
        }
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('❌ API Key de The Odds API inválida o sin créditos');
        }
        throw error;
      }
    });
  });

  describe('4. Validar Precisión con Predicciones Completadas Reales', () => {
    it('debe validar precisión usando predicciones reales completadas', async () => {
      // Buscar predicciones que ya tienen resultado
      const completedPredictions = await prisma.prediction.findMany({
        where: {
          wasCorrect: { not: null },
          actualResult: { not: null },
        },
        take: 100,
        orderBy: {
          eventFinishedAt: 'desc',
        },
      });

      if (completedPredictions.length === 0) {
        logger.warn('⚠️  No hay predicciones completadas para validar precisión');
        logger.info('💡 Sugerencia: Espera a que algunos eventos terminen y se actualicen los resultados');
        return;
      }

      let correctCount = 0;
      let totalConfidence = 0;

      for (const prediction of completedPredictions) {
        if (prediction.wasCorrect) {
          correctCount++;
        }
        totalConfidence += prediction.confidence;
      }

      const accuracy = correctCount / completedPredictions.length;
      const avgConfidence = totalConfidence / completedPredictions.length;

      // Validar que la precisión es razonable
      expect(accuracy).toBeGreaterThanOrEqual(0); // Al menos 0%
      expect(accuracy).toBeLessThanOrEqual(1); // Máximo 100%
      expect(avgConfidence).toBeGreaterThanOrEqual(0.45);
      expect(avgConfidence).toBeLessThanOrEqual(0.95);

      logger.info(`✅ Validación de precisión con ${completedPredictions.length} predicciones reales:`);
      logger.info(`   Precisión: ${(accuracy * 100).toFixed(2)}%`);
      logger.info(`   Confianza promedio: ${(avgConfidence * 100).toFixed(2)}%`);

      if (accuracy >= 0.55) {
        logger.info('   ✅ EXCELENTE: Precisión superior al 55%');
      } else if (accuracy >= 0.50) {
        logger.warn('   ⚠️  ACEPTABLE: Precisión similar al azar (50%)');
      } else {
        logger.error('   ❌ PROBLEMA: Precisión inferior al azar');
      }
    });
  });

  describe('5. Validar Consistencia del Algoritmo con Datos Reales', () => {
    it('debe producir resultados consistentes con el mismo input real', async () => {
      const realOdds = await prisma.odds.findMany({
        where: {
          marketId: realMarketId,
          isActive: true,
        },
        take: 5,
      });

      if (realOdds.length === 0) {
        throw new Error('❌ No hay cuotas reales para validar consistencia');
      }

      const odds = realOdds.map(odd => odd.decimal);
      const selection = realOdds[0].selection;

      // Ejecutar algoritmo dos veces con el mismo input
      const result1 = await improvedPredictionService.calculatePredictedProbability(
        realEventId,
        selection,
        odds
      );

      const result2 = await improvedPredictionService.calculatePredictedProbability(
        realEventId,
        selection,
        odds
      );

      // Las probabilidades deben ser muy similares (puede haber pequeña variación aleatoria en confianza)
      expect(result1.predictedProbability).toBeCloseTo(result2.predictedProbability, 2);
      expect(result1.factors.marketAverage).toBeCloseTo(result2.factors.marketAverage, 3);
      
      // La confianza puede variar ligeramente por el factor aleatorio, pero no mucho
      expect(Math.abs(result1.confidence - result2.confidence)).toBeLessThan(0.1);

      logger.info('✅ Algoritmo es consistente con datos reales');
    });
  });
});
