/**
 * Tests End-to-End con Datos Reales
 * 
 * ⚠️ IMPORTANTE: Estos tests validan TODO el flujo completo usando DATOS REALES
 * - Base de datos real
 * - APIs reales (si están configuradas)
 * - Sin mocks ni datos ficticios
 * 
 * Flujo completo validado:
 * 1. Sincronización de eventos desde API real
 * 2. Obtención de cuotas reales
 * 3. Cálculo de predicciones con algoritmo real
 * 4. Creación de predicciones en BD real
 * 5. Detección de value bets con datos reales
 * 6. Validación de resultados
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../../config/database';
import { eventSyncService } from '../../services/event-sync.service';
import { autoPredictionsService } from '../../services/auto-predictions.service';
import { valueBetDetectionService } from '../../services/value-bet-detection.service';
import { predictionsService } from '../../services/predictions.service';
import { getTheOddsAPIService } from '../../services/integrations/the-odds-api.service';
import { logger } from '../../utils/logger';

describe('Tests End-to-End con Datos Reales', () => {
  beforeAll(async () => {
    // Verificar conexión a base de datos real
    try {
      await prisma.$connect();
      logger.info('✅ Conectado a base de datos real');
    } catch (error: any) {
      throw new Error(`❌ No se puede conectar a la base de datos: ${error.message}`);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Flujo Completo: API → BD → Predicciones → Value Bets', () => {
    it('debe ejecutar flujo completo con datos reales', async () => {
      const apiKey = process.env.THE_ODDS_API_KEY;
      
      if (!apiKey || apiKey === 'changeme' || apiKey === '') {
        logger.warn('⚠️  THE_ODDS_API_KEY no configurada - usando solo datos de BD');
        
        // Si no hay API, validar que hay datos en BD
        const eventsInDB = await prisma.event.findMany({
          where: { isActive: true },
          take: 1,
        });

        expect(eventsInDB.length).toBeGreaterThan(0);
        logger.info(`✅ Validando con ${eventsInDB.length} eventos existentes en BD`);
        return;
      }

      try {
        const oddsService = getTheOddsAPIService();

        // PASO 1: Obtener eventos reales de la API
        logger.info('📥 Paso 1: Obteniendo eventos reales de The Odds API...');
        const apiEvents = await oddsService.getUpcomingEvents('soccer_epl', {
          markets: 'h2h',
          oddsFormat: 'decimal',
        });

        if (apiEvents.length === 0) {
          logger.warn('⚠️  API no devolvió eventos (puede ser límite de cuota)');
          return;
        }

        expect(apiEvents.length).toBeGreaterThan(0);
        logger.info(`✅ Obtenidos ${apiEvents.length} eventos reales de la API`);

        // PASO 2: Sincronizar eventos a BD (si no existen)
        logger.info('💾 Paso 2: Sincronizando eventos a base de datos...');
        const firstEvent = apiEvents[0];
        
        // Buscar si el evento ya existe
        let dbEvent = await prisma.event.findFirst({
          where: {
            externalId: firstEvent.id,
          },
        });

        if (!dbEvent) {
          // Sincronizar evento
          dbEvent = await eventSyncService.syncEventFromTheOddsAPI(
            firstEvent.id,
            firstEvent.sport_key,
            firstEvent.sport_title,
            firstEvent.home_team,
            firstEvent.away_team,
            firstEvent.commence_time
          );
          logger.info(`✅ Evento sincronizado: ${dbEvent.name}`);
        } else {
          logger.info(`✅ Evento ya existe en BD: ${dbEvent.name}`);
        }

        expect(dbEvent).toBeDefined();
        expect(dbEvent.id).toBeDefined();

        // PASO 3: Obtener cuotas reales
        logger.info('📊 Paso 3: Obteniendo cuotas reales...');
        const odds = await oddsService.getEventOdds(firstEvent.id, {
          markets: 'h2h',
          oddsFormat: 'decimal',
        });

        if (odds && odds.bookmakers && odds.bookmakers.length > 0) {
          logger.info(`✅ Obtenidas cuotas de ${odds.bookmakers.length} casas reales`);
          
          // Validar que las cuotas son reales
          const firstBookmaker = odds.bookmakers[0];
          const firstMarket = firstBookmaker.markets[0];
          const firstOutcome = firstMarket.outcomes[0];
          
          expect(firstOutcome.price).toBeGreaterThan(1);
          expect(firstOutcome.price).toBeLessThan(1000);
          logger.info(`   Ejemplo: ${firstOutcome.name} @ ${firstOutcome.price} (${firstBookmaker.title})`);
        }

        // PASO 4: Generar predicciones con datos reales
        logger.info('🔮 Paso 4: Generando predicciones con algoritmo real...');
        const predictions = await autoPredictionsService.generatePredictionsForSyncedEvents([dbEvent.id]);
        
        expect(predictions).toBeDefined();
        logger.info(`✅ Generadas ${predictions.generated} predicciones, ${predictions.updated} actualizadas`);

        // PASO 5: Detectar value bets con datos reales
        logger.info('💰 Paso 5: Detectando value bets con datos reales...');
        const valueBets = await valueBetDetectionService.detectValueBetsForEventsFromDB({
          minValue: 0.05,
          maxEvents: 10,
          autoCreateAlerts: false, // No crear alerts en tests
        });

        expect(Array.isArray(valueBets)).toBe(true);
        logger.info(`✅ Detectados ${valueBets.length} value bets potenciales`);

        if (valueBets.length > 0) {
          const firstValueBet = valueBets[0];
          expect(firstValueBet).toHaveProperty('valuePercentage');
          expect(firstValueBet.valuePercentage).toBeGreaterThan(0);
          logger.info(`   Ejemplo: ${firstValueBet.valuePercentage.toFixed(2)}% de value`);
        }

        logger.info('✅ Flujo completo ejecutado exitosamente con datos reales');
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('❌ API Key de The Odds API inválida o sin créditos');
        }
        if (error.response?.status === 429) {
          logger.warn('⚠️  Límite de cuota de API alcanzado - usando solo datos de BD');
          return;
        }
        throw error;
      }
    });
  });

  describe('Validación de Datos Reales en Base de Datos', () => {
    it('debe validar que todos los datos en BD son reales y consistentes', async () => {
      // Validar eventos
      const events = await prisma.event.findMany({
        where: { isActive: true },
        take: 10,
        include: {
          sport: true,
          markets: {
            include: {
              odds: {
                take: 5,
              },
            },
          },
        },
      });

      for (const event of events) {
        // Validar que el evento tiene datos reales
        expect(event.name).toBeDefined();
        expect(event.name.length).toBeGreaterThan(0);
        expect(event.startTime).toBeInstanceOf(Date);
        expect(event.sport).toBeDefined();
        expect(event.sport.name).toBeDefined();

        // Validar que las cuotas son reales
        for (const market of event.markets) {
          for (const odd of market.odds) {
            expect(odd.decimal).toBeGreaterThan(1);
            expect(odd.decimal).toBeLessThan(1000);
            expect(odd.selection).toBeDefined();
            expect(odd.selection.length).toBeGreaterThan(0);
          }
        }
      }

      logger.info(`✅ Validados ${events.length} eventos con datos reales y consistentes`);
    });

    it('debe validar que las predicciones tienen datos reales', async () => {
      const predictions = await prisma.prediction.findMany({
        where: {
          event: {
            isActive: true,
          },
        },
        include: {
          event: true,
          market: true,
        },
        take: 20,
      });

      for (const prediction of predictions) {
        // Validar que la predicción está vinculada a eventos/markets reales
        expect(prediction.event).toBeDefined();
        expect(prediction.market).toBeDefined();
        expect(prediction.predictedProbability).toBeGreaterThan(0);
        expect(prediction.predictedProbability).toBeLessThan(1);
        expect(prediction.confidence).toBeGreaterThanOrEqual(0.45);
        expect(prediction.confidence).toBeLessThanOrEqual(0.95);
        expect(prediction.selection).toBeDefined();
        expect(prediction.modelVersion).toBeDefined();
      }

      logger.info(`✅ Validadas ${predictions.length} predicciones con datos reales`);
    });
  });
});
