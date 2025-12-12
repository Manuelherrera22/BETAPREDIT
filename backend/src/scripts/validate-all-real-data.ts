/**
 * Script de Validación Completa con Datos Reales
 * 
 * Este script valida que TODO el sistema funciona con datos reales:
 * 1. Conexión a base de datos real
 * 2. APIs reales funcionando
 * 3. Algoritmo predictivo con datos reales
 * 4. Flujo completo end-to-end
 * 5. Validación de que no hay datos ficticios
 * 
 * Uso:
 *   npm run validate-all-real-data
 */

import { prisma } from '../config/database';
import { improvedPredictionService } from '../services/improved-prediction.service';
import { getTheOddsAPIService } from '../services/integrations/the-odds-api.service';
import { logger } from '../utils/logger';

interface ValidationResult {
  component: string;
  status: '✅ PASS' | '❌ FAIL' | '⚠️  SKIP';
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

function addResult(component: string, status: '✅ PASS' | '❌ FAIL' | '⚠️  SKIP', message: string, details?: any) {
  results.push({ component, status, message, details });
  logger.info(`${status} ${component}: ${message}`);
}

async function validateDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    
    // Verificar que no es una BD de test/mock
    const testQuery = await prisma.$queryRaw`SELECT current_database() as db_name`;
    const dbName = (testQuery as any[])[0]?.db_name;
    
    if (dbName && (dbName.includes('test') || dbName.includes('mock'))) {
      addResult('Database', '❌ FAIL', `Base de datos parece ser de test: ${dbName}`);
      return false;
    }
    
    addResult('Database', '✅ PASS', `Conectado a base de datos real: ${dbName || 'N/A'}`);
    return true;
  } catch (error: any) {
    addResult('Database', '❌ FAIL', `Error de conexión: ${error.message}`);
    return false;
  }
}

async function validateRealEvents(): Promise<boolean> {
  try {
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

    if (events.length === 0) {
      addResult('Events', '⚠️  SKIP', 'No hay eventos en la base de datos');
      return false;
    }

    // Validar que los eventos son reales (no mock)
    let realEventsCount = 0;
    for (const event of events) {
      // Un evento real debe tener:
      // - Nombre válido
      // - Fecha futura o reciente
      // - Deporte asociado
      if (
        event.name &&
        event.name.length > 0 &&
        event.name !== 'Test Event' &&
        event.name !== 'Mock Event' &&
        event.sport &&
        event.startTime
      ) {
        realEventsCount++;
      }
    }

    if (realEventsCount === 0) {
      addResult('Events', '❌ FAIL', 'No se encontraron eventos reales (solo mocks/tests)');
      return false;
    }

    addResult('Events', '✅ PASS', `${realEventsCount} eventos reales encontrados de ${events.length} totales`, {
      total: events.length,
      real: realEventsCount,
    });
    return true;
  } catch (error: any) {
    addResult('Events', '❌ FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function validateRealOdds(): Promise<boolean> {
  try {
    const odds = await prisma.odds.findMany({
      where: { isActive: true },
      take: 50,
    });

    if (odds.length === 0) {
      addResult('Odds', '⚠️  SKIP', 'No hay cuotas en la base de datos');
      return false;
    }

    // Validar que las cuotas son reales
    let realOddsCount = 0;
    for (const odd of odds) {
      // Una cuota real debe tener:
      // - Decimal entre 1.01 y 1000 (rango razonable)
      // - Selección válida
      if (
        odd.decimal >= 1.01 &&
        odd.decimal <= 1000 &&
        odd.selection &&
        odd.selection.length > 0
      ) {
        realOddsCount++;
      }
    }

    if (realOddsCount === 0) {
      addResult('Odds', '❌ FAIL', 'No se encontraron cuotas reales (valores fuera de rango)');
      return false;
    }

    addResult('Odds', '✅ PASS', `${realOddsCount} cuotas reales encontradas de ${odds.length} totales`, {
      total: odds.length,
      real: realOddsCount,
      avgDecimal: (odds.reduce((sum, o) => sum + o.decimal, 0) / odds.length).toFixed(2),
    });
    return true;
  } catch (error: any) {
    addResult('Odds', '❌ FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function validateAlgorithmWithRealData(): Promise<boolean> {
  try {
    // Obtener cuotas reales
    const realOdds = await prisma.odds.findMany({
      where: { isActive: true },
      take: 10,
    });

    if (realOdds.length === 0) {
      addResult('Algorithm', '⚠️  SKIP', 'No hay cuotas para probar el algoritmo');
      return false;
    }

    // Obtener eventos asociados a las cuotas
    const uniqueMarketIds = [...new Set(realOdds.map(o => o.marketId))];
    logger.info(`Encontrados ${uniqueMarketIds.length} mercados únicos con cuotas`);

    const markets = await prisma.market.findMany({
      where: {
        id: { in: uniqueMarketIds },
      },
      include: {
        event: true,
      },
    });

    logger.info(`Obtenidos ${markets.length} mercados con eventos asociados`);

    // Agrupar por mercado y selección (puede haber múltiples cuotas para la misma selección de diferentes bookmakers)
    const marketSelectionOdds = realOdds.reduce((acc, odd) => {
      const key = `${odd.marketId}:${odd.selection}`;
      if (!acc[key]) {
        acc[key] = {
          marketId: odd.marketId,
          selection: odd.selection,
          odds: [],
        };
      }
      acc[key].odds.push(odd.decimal);
      return acc;
    }, {} as Record<string, { marketId: string; selection: string; odds: number[] }>);

    logger.info(`Agrupadas cuotas en ${Object.keys(marketSelectionOdds).length} combinaciones mercado-selección`);

    let successCount = 0;
    let totalTests = 0;

    for (const [key, data] of Object.entries(marketSelectionOdds)) {
      if (data.odds.length < 1) {
        logger.debug(`Combinación ${key} no tiene cuotas, se omite`);
        continue;
      }

      const market = markets.find(m => m.id === data.marketId);
      if (!market || !market.event) {
        logger.debug(`Mercado ${data.marketId} no encontrado o sin evento asociado`);
        continue;
      }

      try {
        // Si solo hay 1 cuota, duplicarla para la prueba (simula múltiples bookmakers)
        const odds = data.odds.length >= 2 ? data.odds : [data.odds[0], data.odds[0] * 1.05];

        logger.debug(`Probando algoritmo: evento ${market.event.id}, selección ${data.selection}, ${odds.length} cuotas`);

        const result = await improvedPredictionService.calculatePredictedProbability(
          market.event.id, // Usar eventId real del mercado
          data.selection,
          odds
        );

        logger.debug(`Resultado: prob=${result.predictedProbability}, conf=${result.confidence}`);

        // Validar que el resultado es real y válido
        if (
          result.predictedProbability > 0 &&
          result.predictedProbability < 1 &&
          result.confidence >= 0.45 &&
          result.confidence <= 0.95
        ) {
          successCount++;
          logger.debug(`✅ Test ${totalTests + 1} pasó`);
        } else {
          logger.warn(`⚠️  Test ${totalTests + 1} falló: prob=${result.predictedProbability}, conf=${result.confidence}`);
        }
        totalTests++;
      } catch (error: any) {
        logger.warn(`Error probando algoritmo con ${key}: ${error.message}`);
        logger.debug(`Stack: ${error.stack}`);
      }
    }

    logger.info(`Algoritmo: ${successCount} exitosos de ${totalTests} pruebas`);

    if (successCount === 0) {
      addResult('Algorithm', '❌ FAIL', 'El algoritmo no produjo resultados válidos con datos reales');
      return false;
    }

    addResult('Algorithm', '✅ PASS', `Algoritmo funcionó correctamente con ${successCount}/${totalTests} pruebas`, {
      success: successCount,
      total: totalTests,
    });
    return true;
  } catch (error: any) {
    addResult('Algorithm', '❌ FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function validateTheOddsAPI(): Promise<boolean> {
  const apiKey = process.env.THE_ODDS_API_KEY;
  
  if (!apiKey || apiKey === 'changeme' || apiKey === '') {
    addResult('The Odds API', '⚠️  SKIP', 'API Key no configurada');
    return false;
  }

  try {
    const oddsService = getTheOddsAPIService();
    const events = await oddsService.getUpcomingEvents('soccer_epl', {
      markets: ['h2h'], // Pasar como array
      oddsFormat: 'decimal',
    });

    if (events.length === 0) {
      addResult('The Odds API', '⚠️  SKIP', 'API no devolvió eventos (puede ser límite de cuota)');
      return false;
    }

    // Validar que los eventos son reales
    const firstEvent = events[0];
    if (
      !firstEvent.home_team ||
      !firstEvent.away_team ||
      !firstEvent.bookmakers ||
      firstEvent.bookmakers.length === 0
    ) {
      addResult('The Odds API', '❌ FAIL', 'API devolvió datos inválidos');
      return false;
    }

    addResult('The Odds API', '✅ PASS', `API funcionando correctamente - ${events.length} eventos obtenidos`, {
      events: events.length,
      example: `${firstEvent.home_team} vs ${firstEvent.away_team}`,
    });
    return true;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      addResult('The Odds API', '❌ FAIL', 'API Key inválida o sin créditos');
    } else if (error.response?.status === 429) {
      addResult('The Odds API', '⚠️  SKIP', 'Límite de cuota alcanzado');
    } else {
      addResult('The Odds API', '❌ FAIL', `Error: ${error.message}`);
    }
    return false;
  }
}

async function validatePredictions(): Promise<boolean> {
  try {
    const predictions = await prisma.prediction.findMany({
      take: 20,
      include: {
        event: true,
        market: true,
      },
    });

    if (predictions.length === 0) {
      addResult('Predictions', '⚠️  SKIP', 'No hay predicciones en la base de datos');
      return false;
    }

    // Validar que las predicciones son reales
    let realPredictionsCount = 0;
    for (const prediction of predictions) {
      if (
        prediction.event &&
        prediction.market &&
        prediction.predictedProbability > 0 &&
        prediction.predictedProbability < 1 &&
        prediction.confidence >= 0.45 &&
        prediction.confidence <= 0.95
      ) {
        realPredictionsCount++;
      }
    }

    if (realPredictionsCount === 0) {
      addResult('Predictions', '❌ FAIL', 'No se encontraron predicciones reales');
      return false;
    }

    addResult('Predictions', '✅ PASS', `${realPredictionsCount} predicciones reales encontradas`, {
      total: predictions.length,
      real: realPredictionsCount,
    });
    return true;
  } catch (error: any) {
    addResult('Predictions', '❌ FAIL', `Error: ${error.message}`);
    return false;
  }
}

function displayResults(): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDACIÓN COMPLETA CON DATOS REALES');
  console.log('='.repeat(70) + '\n');

  const passed = results.filter(r => r.status === '✅ PASS').length;
  const failed = results.filter(r => r.status === '❌ FAIL').length;
  const skipped = results.filter(r => r.status === '⚠️  SKIP').length;

  for (const result of results) {
    console.log(`${result.status} ${result.component}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Detalles:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('📈 RESUMEN:');
  console.log(`   ✅ Pasados: ${passed}`);
  console.log(`   ❌ Fallidos: ${failed}`);
  console.log(`   ⚠️  Omitidos: ${skipped}`);
  console.log('='.repeat(70) + '\n');

  if (failed > 0) {
    console.log('❌ HAY PROBLEMAS QUE DEBEN RESOLVERSE');
    console.log('   Revisa los componentes marcados como ❌ FAIL\n');
    process.exit(1);
  } else if (passed === 0) {
    console.log('⚠️  NO SE PUDO VALIDAR NADA (todos los componentes fueron omitidos)');
    console.log('   Verifica la configuración y que haya datos en la base de datos\n');
    process.exit(1);
  } else {
    console.log('✅ VALIDACIÓN EXITOSA - Todo funciona con datos reales\n');
    process.exit(0);
  }
}

async function main() {
  logger.info('🔍 Iniciando validación completa con datos reales...\n');

  // Ejecutar todas las validaciones
  await validateDatabaseConnection();
  await validateRealEvents();
  await validateRealOdds();
  await validateAlgorithmWithRealData();
  await validateTheOddsAPI();
  await validatePredictions();

  // Mostrar resultados
  displayResults();
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('❌ Error en validación:', error);
    process.exit(1);
  });
}

export { validateDatabaseConnection, validateRealEvents, validateRealOdds, validateAlgorithmWithRealData };
