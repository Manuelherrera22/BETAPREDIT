/**
 * Script to manually generate predictions for all upcoming events
 * Usage: node backend/scripts/generate-predictions-now.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting manual prediction generation...\n');

  try {
    // Import the service
    const { autoPredictionsService } = require('../dist/services/auto-predictions.service');

    // Generate predictions
    const result = await autoPredictionsService.generatePredictionsForUpcomingEvents();

    console.log('\n✅ Prediction generation completed!');
    console.log(`   Generated: ${result.generated}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Errors: ${result.errors}`);

    // Check how many predictions exist now
    const predictionCount = await prisma.prediction.count({
      where: {
        wasCorrect: null, // Only unresolved predictions
      },
    });

    console.log(`\n📊 Total unresolved predictions in DB: ${predictionCount}`);

    // Check events with predictions
    const eventsWithPredictions = await prisma.event.findMany({
      where: {
        status: 'SCHEDULED',
        isActive: true,
        startTime: {
          gte: new Date(),
        },
        Prediction: {
          some: {},
        },
      },
      include: {
        _count: {
          select: { Prediction: true },
        },
      },
      take: 5,
    });

    console.log(`\n📅 Sample events with predictions (${eventsWithPredictions.length} shown):`);
    eventsWithPredictions.forEach((event) => {
      console.log(`   - ${event.homeTeam} vs ${event.awayTeam}: ${event._count.Prediction} predictions`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

