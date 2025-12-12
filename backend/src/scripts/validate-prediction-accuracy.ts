/**
 * Script de Validación de Precisión del Algoritmo Predictivo
 * 
 * Este script valida que el algoritmo predictivo funciona correctamente
 * comparando predicciones con resultados reales de la base de datos.
 * 
 * Uso:
 *   npm run validate-predictions
 *   o
 *   ts-node src/scripts/validate-prediction-accuracy.ts
 */

import { prisma } from '../config/database';
import { improvedPredictionService } from '../services/improved-prediction.service';
import { logger } from '../utils/logger';

interface AccuracyMetrics {
  totalPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  accuracy: number;
  averageConfidence: number;
  brierScore: number;
  calibration: {
    highConfidence: { count: number; accuracy: number };
    mediumConfidence: { count: number; accuracy: number };
    lowConfidence: { count: number; accuracy: number };
  };
}

/**
 * Validar precisión del algoritmo usando predicciones completadas
 */
async function validatePredictionAccuracy(): Promise<AccuracyMetrics> {
  logger.info('🔍 Iniciando validación de precisión del algoritmo predictivo...');

  // Obtener todas las predicciones que tienen resultado
  const predictions = await prisma.prediction.findMany({
    where: {
      wasCorrect: { not: null },
      actualResult: { not: null },
    },
    include: {
      event: {
        include: {
          sport: true,
        },
      },
      market: true,
    },
    take: 1000, // Analizar últimas 1000 predicciones
    orderBy: {
      eventFinishedAt: 'desc',
    },
  });

  if (predictions.length === 0) {
    logger.warn('⚠️  No hay predicciones completadas en la base de datos.');
    logger.info('💡 Sugerencia: Espera a que algunos eventos terminen y se actualicen los resultados.');
    return {
      totalPredictions: 0,
      correctPredictions: 0,
      incorrectPredictions: 0,
      accuracy: 0,
      averageConfidence: 0,
      brierScore: 0,
      calibration: {
        highConfidence: { count: 0, accuracy: 0 },
        mediumConfidence: { count: 0, accuracy: 0 },
        lowConfidence: { count: 0, accuracy: 0 },
      },
    };
  }

  logger.info(`📊 Analizando ${predictions.length} predicciones...`);

  let correctCount = 0;
  let incorrectCount = 0;
  let totalConfidence = 0;
  let totalBrierScore = 0;

  const highConfidence: { correct: number; total: number } = { correct: 0, total: 0 };
  const mediumConfidence: { correct: number; total: number } = { correct: 0, total: 0 };
  const lowConfidence: { correct: number; total: number } = { correct: 0, total: 0 };

  for (const prediction of predictions) {
    if (prediction.wasCorrect === null) continue;

    // Contar aciertos/errores
    if (prediction.wasCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    // Acumular confianza
    totalConfidence += prediction.confidence;

    // Calcular Brier Score: (predicted_prob - actual_prob)²
    const actualProbability = prediction.wasCorrect ? 1 : 0;
    const brierScore = Math.pow(prediction.predictedProbability - actualProbability, 2);
    totalBrierScore += brierScore;

    // Categorizar por confianza
    if (prediction.confidence >= 0.75) {
      highConfidence.total++;
      if (prediction.wasCorrect) highConfidence.correct++;
    } else if (prediction.confidence >= 0.6) {
      mediumConfidence.total++;
      if (prediction.wasCorrect) mediumConfidence.correct++;
    } else {
      lowConfidence.total++;
      if (prediction.wasCorrect) lowConfidence.correct++;
    }
  }

  const accuracy = correctCount / predictions.length;
  const averageConfidence = totalConfidence / predictions.length;
  const averageBrierScore = totalBrierScore / predictions.length;

  const metrics: AccuracyMetrics = {
    totalPredictions: predictions.length,
    correctPredictions: correctCount,
    incorrectPredictions: incorrectCount,
    accuracy,
    averageConfidence,
    brierScore: averageBrierScore,
    calibration: {
      highConfidence: {
        count: highConfidence.total,
        accuracy: highConfidence.total > 0 ? highConfidence.correct / highConfidence.total : 0,
      },
      mediumConfidence: {
        count: mediumConfidence.total,
        accuracy: mediumConfidence.total > 0 ? mediumConfidence.correct / mediumConfidence.total : 0,
      },
      lowConfidence: {
        count: lowConfidence.total,
        accuracy: lowConfidence.total > 0 ? lowConfidence.correct / lowConfidence.total : 0,
      },
    },
  };

  return metrics;
}

/**
 * Mostrar resultados de la validación
 */
function displayResults(metrics: AccuracyMetrics): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADOS DE VALIDACIÓN DEL ALGORITMO PREDICTIVO');
  console.log('='.repeat(60) + '\n');

  console.log(`📈 Total de Predicciones Analizadas: ${metrics.totalPredictions}`);
  console.log(`✅ Predicciones Correctas: ${metrics.correctPredictions}`);
  console.log(`❌ Predicciones Incorrectas: ${metrics.incorrectPredictions}`);
  console.log(`\n🎯 Precisión General: ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`📊 Confianza Promedio: ${(metrics.averageConfidence * 100).toFixed(2)}%`);
  console.log(`📉 Brier Score: ${metrics.brierScore.toFixed(4)} (menor es mejor, ideal < 0.25)`);

  console.log('\n' + '-'.repeat(60));
  console.log('📊 CALIBRACIÓN POR NIVEL DE CONFIANZA');
  console.log('-'.repeat(60));

  console.log(`\n🔴 Alta Confianza (≥75%):`);
  console.log(`   Predicciones: ${metrics.calibration.highConfidence.count}`);
  console.log(`   Precisión: ${(metrics.calibration.highConfidence.accuracy * 100).toFixed(2)}%`);
  console.log(`   Estado: ${metrics.calibration.highConfidence.accuracy >= 0.7 ? '✅ BUENO' : '⚠️  MEJORABLE'}`);

  console.log(`\n🟡 Confianza Media (60-75%):`);
  console.log(`   Predicciones: ${metrics.calibration.mediumConfidence.count}`);
  console.log(`   Precisión: ${(metrics.calibration.mediumConfidence.accuracy * 100).toFixed(2)}%`);
  console.log(`   Estado: ${metrics.calibration.mediumConfidence.accuracy >= 0.55 ? '✅ BUENO' : '⚠️  MEJORABLE'}`);

  console.log(`\n🟢 Baja Confianza (<60%):`);
  console.log(`   Predicciones: ${metrics.calibration.lowConfidence.count}`);
  console.log(`   Precisión: ${(metrics.calibration.lowConfidence.accuracy * 100).toFixed(2)}%`);
  console.log(`   Estado: ${metrics.calibration.lowConfidence.accuracy >= 0.4 ? '✅ BUENO' : '⚠️  MEJORABLE'}`);

  console.log('\n' + '='.repeat(60));
  console.log('📋 INTERPRETACIÓN DE RESULTADOS');
  console.log('='.repeat(60));

  if (metrics.accuracy >= 0.55) {
    console.log('✅ EXCELENTE: El algoritmo tiene precisión superior al 55%');
    console.log('   Esto es mejor que el azar (50%) y muestra que el algoritmo funciona.');
  } else if (metrics.accuracy >= 0.50) {
    console.log('⚠️  ACEPTABLE: El algoritmo tiene precisión similar al azar');
    console.log('   Considera mejorar el algoritmo o agregar más datos históricos.');
  } else {
    console.log('❌ PROBLEMA: El algoritmo tiene precisión inferior al azar');
    console.log('   Revisa el algoritmo y los datos de entrada.');
  }

  if (metrics.brierScore < 0.25) {
    console.log('✅ EXCELENTE: Brier Score bajo indica buenas predicciones probabilísticas');
  } else if (metrics.brierScore < 0.35) {
    console.log('⚠️  ACEPTABLE: Brier Score moderado, hay margen de mejora');
  } else {
    console.log('❌ PROBLEMA: Brier Score alto indica predicciones poco precisas');
  }

  // Validar calibración
  const highCalibration = metrics.calibration.highConfidence.accuracy >= 0.7;
  const mediumCalibration = metrics.calibration.mediumConfidence.accuracy >= 0.55;
  const lowCalibration = metrics.calibration.lowConfidence.accuracy >= 0.4;

  if (highCalibration && mediumCalibration && lowCalibration) {
    console.log('✅ EXCELENTE: El algoritmo está bien calibrado en todos los niveles');
  } else {
    console.log('⚠️  MEJORABLE: El algoritmo necesita mejor calibración');
    if (!highCalibration) {
      console.log('   - Las predicciones de alta confianza no son tan precisas como deberían');
    }
    if (!mediumCalibration) {
      console.log('   - Las predicciones de confianza media necesitan ajuste');
    }
    if (!lowCalibration) {
      console.log('   - Las predicciones de baja confianza necesitan revisión');
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Función principal
 */
async function main() {
  try {
    const metrics = await validatePredictionAccuracy();
    displayResults(metrics);

    // Guardar resultados en archivo (opcional)
    // await fs.writeFile('prediction-accuracy-report.json', JSON.stringify(metrics, null, 2));

    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error al validar precisión:', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

export { validatePredictionAccuracy, displayResults };
