/**
 * Script to verify prediction factors structure in database
 * Checks if factors are being saved correctly and what data is available
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

async function verifyPredictionFactors() {
  try {
    logger.info('🔍 Verificando estructura de factores en predicciones...\n');

    // Get recent predictions
    const predictions = await prisma.prediction.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        event: {
          include: {
            sport: true,
          },
        },
        market: true,
      },
    });

    if (predictions.length === 0) {
      logger.warn('⚠️ No se encontraron predicciones en la base de datos');
      return;
    }

    logger.info(`📊 Analizando ${predictions.length} predicciones recientes\n`);

    // Analyze each prediction
    for (const pred of predictions) {
      logger.info(`\n${'='.repeat(80)}`);
      logger.info(`📌 Predicción ID: ${pred.id}`);
      logger.info(`   Evento: ${pred.event.homeTeam} vs ${pred.event.awayTeam}`);
      logger.info(`   Selección: ${pred.selection}`);
      logger.info(`   Probabilidad: ${(pred.predictedProbability * 100).toFixed(1)}%`);
      logger.info(`   Confianza: ${(pred.confidence * 100).toFixed(0)}%`);
      logger.info(`   Creada: ${pred.createdAt.toISOString()}`);

      const factors = pred.factors as any;

      if (!factors || typeof factors !== 'object') {
        logger.warn('   ⚠️ FACTORES: No hay factores o no es un objeto');
        continue;
      }

      logger.info(`\n   📦 ESTRUCTURA DE FACTORES:`);
      logger.info(`      Keys principales: ${Object.keys(factors).join(', ')}`);

      // Check marketAverage
      if (factors.marketAverage) {
        logger.info(`\n   ✅ marketAverage encontrado:`);
        logger.info(`      - home: ${factors.marketAverage.home?.toFixed(3) || 'N/A'}`);
        logger.info(`      - away: ${factors.marketAverage.away?.toFixed(3) || 'N/A'}`);
        logger.info(`      - draw: ${factors.marketAverage.draw?.toFixed(3) || 'N/A'}`);
        logger.info(`      - total: ${factors.marketAverage.total?.toFixed(3) || 'N/A'}`);
      } else {
        logger.warn(`   ❌ marketAverage: NO ENCONTRADO`);
      }

      // Check advancedFeatures
      if (factors.advancedFeatures) {
        logger.info(`\n   ✅ advancedFeatures encontrado:`);
        const af = factors.advancedFeatures;

        // Market Odds
        if (af.marketOdds) {
          logger.info(`      📊 marketOdds:`);
          logger.info(`         - bookmakerCount: ${af.marketOdds.bookmakerCount || 'N/A'}`);
          logger.info(`         - minOdds: ${af.marketOdds.minOdds?.toFixed(2) || 'N/A'}`);
          logger.info(`         - maxOdds: ${af.marketOdds.maxOdds?.toFixed(2) || 'N/A'}`);
          logger.info(`         - median: ${af.marketOdds.median?.toFixed(2) || 'N/A'}`);
          logger.info(`         - volatility: ${af.marketOdds.volatility?.toFixed(3) || 'N/A'}`);
        } else {
          logger.warn(`      ❌ marketOdds: NO ENCONTRADO`);
        }

        // Market Intelligence
        if (af.market || af.marketIntelligence) {
          const market = af.market || af.marketIntelligence || {};
          logger.info(`      📈 market/marketIntelligence:`);
          logger.info(`         - consensus: ${market.consensus?.toFixed(3) || 'N/A'}`);
          logger.info(`         - efficiency: ${market.efficiency?.toFixed(3) || 'N/A'}`);
        } else {
          logger.warn(`      ❌ market/marketIntelligence: NO ENCONTRADO`);
        }

        // Home Form
        if (af.homeForm) {
          logger.info(`      🏠 homeForm:`);
          logger.info(`         - winRate5: ${af.homeForm.winRate5?.toFixed(3) || 'N/A'}`);
          logger.info(`         - goalsForAvg5: ${af.homeForm.goalsForAvg5?.toFixed(2) || 'N/A'}`);
          logger.info(`         - isRealData: ${af.homeForm.isRealData !== false ? 'true' : 'false'}`);
        } else {
          logger.warn(`      ❌ homeForm: NO ENCONTRADO`);
        }

        // Away Form
        if (af.awayForm) {
          logger.info(`      🏠 awayForm:`);
          logger.info(`         - winRate5: ${af.awayForm.winRate5?.toFixed(3) || 'N/A'}`);
          logger.info(`         - goalsForAvg5: ${af.awayForm.goalsForAvg5?.toFixed(2) || 'N/A'}`);
          logger.info(`         - isRealData: ${af.awayForm.isRealData !== false ? 'true' : 'false'}`);
        } else {
          logger.warn(`      ❌ awayForm: NO ENCONTRADO`);
        }

        // H2H
        if (af.h2h || af.headToHead) {
          const h2h = af.h2h || af.headToHead || {};
          logger.info(`      ⚔️ h2h/headToHead:`);
          logger.info(`         - team1WinRate: ${h2h.team1WinRate?.toFixed(3) || 'N/A'}`);
          logger.info(`         - totalMatches: ${h2h.totalMatches || 'N/A'}`);
          logger.info(`         - isRealData: ${h2h.isRealData !== false ? 'true' : 'false'}`);
        } else {
          logger.warn(`      ❌ h2h/headToHead: NO ENCONTRADO`);
        }

        // Advanced Analysis
        if (factors.advancedAnalysis) {
          logger.info(`\n   ✅ advancedAnalysis encontrado:`);
          const analysis = factors.advancedAnalysis;
          const selection = pred.selection.toLowerCase();
          
          let analysisData = null;
          if (selection.includes('home') || selection === '1') {
            analysisData = analysis.home;
          } else if (selection.includes('away') || selection === '2') {
            analysisData = analysis.away;
          } else if (selection.includes('draw') || selection === 'x' || selection === '3') {
            analysisData = analysis.draw;
          }

          if (analysisData) {
            logger.info(`      📊 Análisis para "${pred.selection}":`);
            logger.info(`         - baseProbability: ${analysisData.baseProbability?.toFixed(3) || 'N/A'}`);
            logger.info(`         - adjustedProbability: ${analysisData.adjustedProbability?.toFixed(3) || 'N/A'}`);
            logger.info(`         - dataQuality: ${analysisData.dataQuality?.toFixed(3) || 'N/A'}`);
            logger.info(`         - keyFactors count: ${analysisData.keyFactors?.length || 0}`);
            logger.info(`         - riskFactors count: ${analysisData.riskFactors?.length || 0}`);
          } else {
            logger.warn(`      ⚠️ No hay análisis específico para "${pred.selection}"`);
          }
        } else {
          logger.warn(`   ❌ advancedAnalysis: NO ENCONTRADO`);
        }

        // Check other important keys
        const importantKeys = [
          'formAdvantage',
          'goalsAdvantage',
          'defenseAdvantage',
          'homeTeamStatistics',
          'awayTeamStatistics',
          'injuries',
          'weather',
        ];

        logger.info(`\n   🔍 Otras claves importantes:`);
        for (const key of importantKeys) {
          if (af[key]) {
            logger.info(`      ✅ ${key}: presente`);
          } else {
            logger.warn(`      ❌ ${key}: NO ENCONTRADO`);
          }
        }

      } else {
        logger.warn(`   ❌ advancedFeatures: NO ENCONTRADO`);
        logger.info(`   📋 Factores disponibles directamente:`);
        logger.info(`      ${Object.keys(factors).join(', ')}`);
      }

      // Check bookmakerMargin
      if (factors.bookmakerMargin !== undefined) {
        logger.info(`\n   ✅ bookmakerMargin: ${factors.bookmakerMargin}%`);
      } else {
        logger.warn(`   ❌ bookmakerMargin: NO ENCONTRADO`);
      }
    }

    // Summary
    logger.info(`\n${'='.repeat(80)}`);
    logger.info(`📊 RESUMEN:`);
    
    const withMarketAverage = predictions.filter(p => {
      const factors = p.factors as any;
      return factors?.marketAverage;
    }).length;

    const withAdvancedFeatures = predictions.filter(p => {
      const factors = p.factors as any;
      return factors?.advancedFeatures;
    }).length;

    const withMarketOdds = predictions.filter(p => {
      const factors = p.factors as any;
      return factors?.advancedFeatures?.marketOdds;
    }).length;

    const withForm = predictions.filter(p => {
      const factors = p.factors as any;
      return factors?.advancedFeatures?.homeForm || factors?.advancedFeatures?.awayForm;
    }).length;

    const withH2H = predictions.filter(p => {
      const factors = p.factors as any;
      return factors?.advancedFeatures?.h2h || factors?.advancedFeatures?.headToHead;
    }).length;

    const withAdvancedAnalysis = predictions.filter(p => {
      const factors = p.factors as any;
      return factors?.advancedAnalysis;
    }).length;

    logger.info(`   Total predicciones analizadas: ${predictions.length}`);
    logger.info(`   ✅ Con marketAverage: ${withMarketAverage}/${predictions.length} (${((withMarketAverage/predictions.length)*100).toFixed(0)}%)`);
    logger.info(`   ✅ Con advancedFeatures: ${withAdvancedFeatures}/${predictions.length} (${((withAdvancedFeatures/predictions.length)*100).toFixed(0)}%)`);
    logger.info(`   ✅ Con marketOdds: ${withMarketOdds}/${predictions.length} (${((withMarketOdds/predictions.length)*100).toFixed(0)}%)`);
    logger.info(`   ✅ Con forma (homeForm/awayForm): ${withForm}/${predictions.length} (${((withForm/predictions.length)*100).toFixed(0)}%)`);
    logger.info(`   ✅ Con H2H: ${withH2H}/${predictions.length} (${((withH2H/predictions.length)*100).toFixed(0)}%)`);
    logger.info(`   ✅ Con advancedAnalysis: ${withAdvancedAnalysis}/${predictions.length} (${((withAdvancedAnalysis/predictions.length)*100).toFixed(0)}%)`);

    logger.info(`\n✅ Verificación completada\n`);

  } catch (error: any) {
    logger.error('❌ Error verificando factores:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  verifyPredictionFactors()
    .then(() => {
      logger.info('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Error en script:', error);
      process.exit(1);
    });
}

export { verifyPredictionFactors };

