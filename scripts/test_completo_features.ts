/**
 * Test completo: Generar predicciones con features avanzadas
 * Ejecutar con: npx tsx scripts/test_completo_features.ts
 */

import { PrismaClient } from '@prisma/client';
import { autoPredictionsService } from '../backend/src/services/auto-predictions.service';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('TEST COMPLETO: FEATURES AVANZADAS');
  console.log('='.repeat(60));
  console.log();

  try {
    // Paso 1: Generar predicciones
    console.log('📊 PASO 1: Generando predicciones...');
    console.log();
    
    const result = await autoPredictionsService.generatePredictionsForUpcomingEvents();
    
    console.log(`   ✅ Generadas: ${result.generated}`);
    console.log(`   ✅ Actualizadas: ${result.updated}`);
    console.log(`   ⚠️  Errores: ${result.errors}`);
    console.log();

    // Paso 2: Verificar features guardadas
    console.log('📊 PASO 2: Verificando features guardadas...');
    console.log();
    
    const recentPredictions = await prisma.prediction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (recentPredictions.length === 0) {
      console.log('   ⚠️  No hay predicciones para verificar');
      console.log();
    } else {
      console.log(`   ✅ Analizando ${recentPredictions.length} predicciones recientes`);
      console.log();

      let totalFeatures = 0;
      let predictionsWithAdvanced = 0;
      const allFeatures = new Set<string>();

      for (const pred of recentPredictions) {
        const factors = pred.factors as any;
        if (factors && typeof factors === 'object') {
          const featureCount = Object.keys(factors).length;
          totalFeatures += featureCount;
          
          // Agregar todas las features al set
          Object.keys(factors).forEach(k => allFeatures.add(k));
          
          // Verificar features avanzadas
          const hasAdvanced = ['homeForm', 'awayForm', 'h2h', 'market'].some(k => k in factors);
          if (hasAdvanced) {
            predictionsWithAdvanced++;
          }
        }
      }

      const avgFeatures = totalFeatures / recentPredictions.length;
      
      console.log(`   📊 Features promedio por predicción: ${avgFeatures.toFixed(1)}`);
      console.log(`   📊 Total features únicas: ${allFeatures.size}`);
      console.log(`   ✅ Predicciones con features avanzadas: ${predictionsWithAdvanced}/${recentPredictions.length}`);
      console.log();
      
      // Mostrar algunas features encontradas
      console.log('   Features encontradas:');
      const featuresList = Array.from(allFeatures).slice(0, 15);
      featuresList.forEach(f => console.log(`      • ${f}`));
      if (allFeatures.size > 15) {
        console.log(`      ... y ${allFeatures.size - 15} más`);
      }
      console.log();

      // Verificar estructura de features avanzadas
      if (recentPredictions.length > 0) {
        const samplePred = recentPredictions[0];
        const factors = samplePred.factors as any;
        
        console.log('   📋 Estructura de features avanzadas (muestra):');
        if (factors.homeForm) {
          console.log(`      ✅ homeForm: ${Object.keys(factors.homeForm).length} campos`);
        }
        if (factors.awayForm) {
          console.log(`      ✅ awayForm: ${Object.keys(factors.awayForm).length} campos`);
        }
        if (factors.h2h) {
          console.log(`      ✅ h2h: ${Object.keys(factors.h2h).length} campos`);
        }
        if (factors.market) {
          console.log(`      ✅ market: ${Object.keys(factors.market).length} campos`);
        }
        console.log();
      }

      // Evaluación
      console.log('='.repeat(60));
      console.log('EVALUACIÓN');
      console.log('='.repeat(60));
      console.log();
      
      if (avgFeatures >= 50) {
        console.log('   ✅ EXCELENTE: 50+ features por predicción');
      } else if (avgFeatures >= 20) {
        console.log('   ✅ BUENO: 20+ features por predicción');
      } else if (avgFeatures >= 10) {
        console.log('   ⚠️  REGULAR: 10+ features por predicción');
      } else {
        console.log('   ❌ MALO: Menos de 10 features por predicción');
      }
      
      if (predictionsWithAdvanced === recentPredictions.length) {
        console.log('   ✅ EXCELENTE: Todas las predicciones tienen features avanzadas');
      } else if (predictionsWithAdvanced > 0) {
        console.log(`   ⚠️  PARCIAL: Solo ${predictionsWithAdvanced}/${recentPredictions.length} tienen features avanzadas`);
      } else {
        console.log('   ❌ CRÍTICO: Ninguna predicción tiene features avanzadas');
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('✅ TEST COMPLETADO');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();

