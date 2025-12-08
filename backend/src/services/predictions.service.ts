import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreatePredictionData {
  eventId: string;
  marketId: string;
  selection: string;
  predictedProbability: number;
  confidence: number;
  modelVersion: string;
  factors?: any;
}

class PredictionsService {
  /**
   * Create a new prediction
   */
  async createPrediction(data: CreatePredictionData) {
    try {
      // Verify event and market exist
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      const market = await prisma.market.findUnique({
        where: { id: data.marketId },
      });

      if (!market) {
        throw new AppError('Market not found', 404);
      }

      // Check if prediction already exists
      const existing = await prisma.prediction.findFirst({
        where: {
          eventId: data.eventId,
          marketId: data.marketId,
          selection: data.selection,
        },
      });

      if (existing) {
        // Update existing prediction
        return await prisma.prediction.update({
          where: { id: existing.id },
          data: {
            predictedProbability: data.predictedProbability,
            confidence: data.confidence,
            modelVersion: data.modelVersion,
            factors: data.factors,
          },
        });
      }

      const prediction = await prisma.prediction.create({
        data: {
          eventId: data.eventId,
          marketId: data.marketId,
          selection: data.selection,
          predictedProbability: data.predictedProbability,
          confidence: data.confidence,
          modelVersion: data.modelVersion,
          factors: data.factors,
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

      logger.info(`Prediction created: ${prediction.id} for event ${data.eventId}`);
      return prediction;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating prediction:', error);
      throw new AppError('Failed to create prediction', 500);
    }
  }

  /**
   * Update prediction result when event finishes
   */
  async updatePredictionResult(
    predictionId: string,
    actualResult: 'WON' | 'LOST' | 'VOID',
    actualProbability?: number
  ) {
    try {
      const prediction = await prisma.prediction.findUnique({
        where: { id: predictionId },
      });

      if (!prediction) {
        throw new AppError('Prediction not found', 404);
      }

      const wasCorrect =
        (actualResult === 'WON' && prediction.predictedProbability > 0.5) ||
        (actualResult === 'LOST' && prediction.predictedProbability < 0.5);

      const accuracy = actualProbability
        ? 1 - Math.abs(prediction.predictedProbability - actualProbability)
        : wasCorrect
        ? 1
        : 0;

      const updated = await prisma.prediction.update({
        where: { id: predictionId },
        data: {
          actualResult,
          wasCorrect,
          accuracy,
          eventFinishedAt: new Date(),
        },
      });

      // Update model performance (async)
      this.updateModelPerformance(prediction.modelVersion, wasCorrect).catch(
        (err) => {
          logger.error('Error updating model performance:', err);
        }
      );

      logger.info(`Prediction result updated: ${predictionId} -> ${actualResult}`);
      return updated;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating prediction result:', error);
      throw new AppError('Failed to update prediction result', 500);
    }
  }

  /**
   * Get predictions for an event
   */
  async getEventPredictions(eventId: string) {
    const predictions = await prisma.prediction.findMany({
      where: { eventId },
      include: {
        market: true,
      },
      orderBy: {
        predictedProbability: 'desc',
      },
    });

    return predictions;
  }

  /**
   * Get prediction accuracy statistics
   */
  async getPredictionStats(modelVersion?: string) {
    const where: any = {
      wasCorrect: { not: null },
    };

    if (modelVersion) {
      where.modelVersion = modelVersion;
    }

    const predictions = await prisma.prediction.findMany({
      where,
      select: {
        wasCorrect: true,
        accuracy: true,
        modelVersion: true,
        event: {
          select: {
            sport: {
              select: {
                name: true,
              },
            },
          },
        },
        market: {
          select: {
            type: true,
          },
        },
      },
    });

    const total = predictions.length;
    const correct = predictions.filter((p) => p.wasCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgAccuracy =
      total > 0
        ? predictions.reduce((sum, p) => sum + (p.accuracy || 0), 0) / total
        : 0;

    // By sport
    const bySport: Record<string, any> = {};
    predictions.forEach((p) => {
      const sport = p.event.sport.name;
      if (!bySport[sport]) {
        bySport[sport] = { total: 0, correct: 0 };
      }
      bySport[sport].total++;
      if (p.wasCorrect) {
        bySport[sport].correct++;
      }
    });

    // By market type
    const byMarket: Record<string, any> = {};
    predictions.forEach((p) => {
      const market = p.market.type;
      if (!byMarket[market]) {
        byMarket[market] = { total: 0, correct: 0 };
      }
      byMarket[market].total++;
      if (p.wasCorrect) {
        byMarket[market].correct++;
      }
    });

    return {
      total,
      correct,
      accuracy,
      avgAccuracy,
      bySport: Object.entries(bySport).map(([sport, data]: [string, any]) => ({
        sport,
        total: data.total,
        correct: data.correct,
        accuracy: (data.correct / data.total) * 100,
      })),
      byMarket: Object.entries(byMarket).map(([market, data]: [string, any]) => ({
        market,
        total: data.total,
        correct: data.correct,
        accuracy: (data.correct / data.total) * 100,
      })),
    };
  }

  /**
   * Update model performance (async helper)
   */
  private async updateModelPerformance(modelVersion: string, wasCorrect: boolean) {
    try {
      const performance = await prisma.modelPerformance.upsert({
        where: { modelVersion },
        update: {
          totalPredictions: { increment: 1 },
          correctPredictions: wasCorrect ? { increment: 1 } : undefined,
        },
        create: {
          modelVersion,
          modelType: 'ML',
          totalPredictions: 1,
          correctPredictions: wasCorrect ? 1 : 0,
          accuracy: wasCorrect ? 100 : 0,
        },
      });

      // Recalculate accuracy
      const accuracy =
        (performance.correctPredictions / performance.totalPredictions) * 100;

      await prisma.modelPerformance.update({
        where: { modelVersion },
        data: { accuracy },
      });
    } catch (error) {
      logger.error('Error updating model performance:', error);
    }
  }
}

export const predictionsService = new PredictionsService();

