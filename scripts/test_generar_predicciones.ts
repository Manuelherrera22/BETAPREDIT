/**
 * Test script to generate predictions with complete features
 * Run with: npx tsx scripts/test_generar_predicciones.ts
 */

import { PrismaClient } from '@prisma/client';
import { autoPredictionsService } from '../backend/src/services/auto-predictions.service';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('GENERANDO PREDICCIONES CON FEATURES COMPLETAS');
  console.log('='.repeat(60));
  console.log();

  try {
    // Get all active sports
    const sports = await prisma.sport.findMany({
      where: { isActive: true },
      take: 3, // Limit to 3 sports for testing
    });

    console.log(`📊 Encontrados ${sports.length} deportes activos`);
    console.log();

    let totalGenerated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (const sport of sports) {
      console.log(`🏆 Procesando: ${sport.name} (${sport.slug})`);
      
      try {
        const result = await autoPredictionsService.generatePredictionsForSport(sport.id);
        
        totalGenerated += result.generated;
        totalUpdated += result.updated;
        totalErrors += result.errors;
        
        console.log(`   ✅ Generadas: ${result.generated}, Actualizadas: ${result.updated}, Errores: ${result.errors}`);
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        totalErrors++;
      }
      
      console.log();
    }

    console.log('='.repeat(60));
    console.log('RESUMEN');
    console.log('='.repeat(60));
    console.log(`Total Generadas: ${totalGenerated}`);
    console.log(`Total Actualizadas: ${totalUpdated}`);
    console.log(`Total Errores: ${totalErrors}`);
    console.log();

    // Verify features
    console.log('📊 Verificando features guardadas...');
    const recentPredictions = await prisma.prediction.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    if (recentPredictions.length > 0) {
      const pred = recentPredictions[0];
      const factors = pred.factors as any;
      
      console.log(`   ✅ Features encontradas: ${Object.keys(factors).length}`);
      console.log(`   Keys: ${Object.keys(factors).slice(0, 10).join(', ')}`);
      
      const hasAdvanced = ['homeForm', 'awayForm', 'h2h', 'market'].some(k => k in factors);
      if (hasAdvanced) {
        console.log(`   ✅ Features avanzadas presentes`);
      } else {
        console.log(`   ⚠️  Features avanzadas NO presentes`);
      }
    } else {
      console.log(`   ⚠️  No hay predicciones para verificar`);
    }

  } catch (error: any) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

