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

  /**
   * Update predictions for a finished event
   * Called when an event status changes to FINISHED
   */
  async updatePredictionsForFinishedEvent(eventId: string, actualResults: Record<string, 'WON' | 'LOST' | 'VOID'>) {
    try {
      const predictions = await prisma.prediction.findMany({
        where: {
          eventId,
          wasCorrect: null, // Only update unresolved predictions
        },
      });

      const updatePromises = predictions.map(async (prediction) => {
        const actualResult = actualResults[prediction.selection] || 'VOID';
        const wasCorrect =
          (actualResult === 'WON' && prediction.predictedProbability > 0.5) ||
          (actualResult === 'LOST' && prediction.predictedProbability < 0.5);

        // Calculate accuracy (1 - absolute difference)
        const actualProbability = actualResult === 'WON' ? 1 : actualResult === 'LOST' ? 0 : 0.5;
        const accuracy = 1 - Math.abs(prediction.predictedProbability - actualProbability);

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            actualResult,
            wasCorrect,
            accuracy,
            eventFinishedAt: new Date(),
          },
        });

        // Update model performance
        await this.updateModelPerformance(prediction.modelVersion, wasCorrect);
      });

      await Promise.all(updatePromises);
      logger.info(`Updated ${predictions.length} predictions for finished event ${eventId}`);
    } catch (error: any) {
      logger.error('Error updating predictions for finished event:', error);
      throw new AppError('Failed to update predictions for finished event', 500);
    }
  }

  /**
   * Get prediction accuracy tracking with detailed metrics
   */
  async getAccuracyTracking(options: {
    modelVersion?: string;
    sportId?: string;
    marketType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const where: any = {
      wasCorrect: { not: null },
    };

    if (options.modelVersion) {
      where.modelVersion = options.modelVersion;
    }
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const predictions = await prisma.prediction.findMany({
      where,
      include: {
        event: {
          include: {
            sport: true,
          },
        },
        market: true,
      },
    });

    // Filter by sport and market if specified
    let filtered = predictions;
    if (options.sportId) {
      filtered = filtered.filter((p) => p.event.sportId === options.sportId);
    }
    if (options.marketType) {
      filtered = filtered.filter((p) => p.market.type === options.marketType);
    }

    const total = filtered.length;
    if (total === 0) {
      return {
        total: 0,
        correct: 0,
        accuracy: 0,
        avgAccuracy: 0,
        brierScore: 0,
        calibrationScore: 0,
        bySport: [],
        byMarket: [],
        byConfidence: [],
        recentPredictions: [],
      };
    }

    const correct = filtered.filter((p) => p.wasCorrect).length;
    const accuracy = (correct / total) * 100;
    const avgAccuracy =
      filtered.reduce((sum, p) => sum + (p.accuracy || 0), 0) / total;

    // Calculate Brier Score (lower is better, 0 = perfect)
    const brierScore =
      filtered.reduce((sum, p) => {
        const actual = p.actualResult === 'WON' ? 1 : p.actualResult === 'LOST' ? 0 : 0.5;
        return sum + Math.pow(p.predictedProbability - actual, 2);
      }, 0) / total;

    // Calculate calibration score (how well-calibrated the probabilities are)
    const calibrationBins: Record<string, { predicted: number[]; actual: number[] }> = {};
    filtered.forEach((p) => {
      const bin = Math.floor(p.predictedProbability * 10) / 10; // Round to nearest 0.1
      const binKey = bin.toFixed(1);
      if (!calibrationBins[binKey]) {
        calibrationBins[binKey] = { predicted: [], actual: [] };
      }
      calibrationBins[binKey].predicted.push(p.predictedProbability);
      const actual = p.actualResult === 'WON' ? 1 : p.actualResult === 'LOST' ? 0 : 0.5;
      calibrationBins[binKey].actual.push(actual);
    });

    const calibrationScores = Object.entries(calibrationBins).map(([bin, data]) => {
      const avgPredicted = data.predicted.reduce((a, b) => a + b, 0) / data.predicted.length;
      const avgActual = data.actual.reduce((a, b) => a + b, 0) / data.actual.length;
      return {
        bin: parseFloat(bin),
        avgPredicted,
        avgActual,
        count: data.predicted.length,
        difference: Math.abs(avgPredicted - avgActual),
      };
    });

    const calibrationScore = calibrationScores.length > 0
      ? 1 - (calibrationScores.reduce((sum, s) => sum + s.difference, 0) / calibrationScores.length)
      : 0;

    // By sport
    const bySport: Record<string, any> = {};
    filtered.forEach((p) => {
      const sport = p.event.sport.name;
      if (!bySport[sport]) {
        bySport[sport] = { total: 0, correct: 0, accuracySum: 0 };
      }
      bySport[sport].total++;
      if (p.wasCorrect) {
        bySport[sport].correct++;
      }
      bySport[sport].accuracySum += p.accuracy || 0;
    });

    // By market type
    const byMarket: Record<string, any> = {};
    filtered.forEach((p) => {
      const market = p.market.type;
      if (!byMarket[market]) {
        byMarket[market] = { total: 0, correct: 0, accuracySum: 0 };
      }
      byMarket[market].total++;
      if (p.wasCorrect) {
        byMarket[market].correct++;
      }
      byMarket[market].accuracySum += p.accuracy || 0;
    });

    // By confidence level
    const byConfidence: Record<string, any> = {};
    filtered.forEach((p) => {
      const confidenceBin = Math.floor(p.confidence * 10) / 10;
      const binKey = confidenceBin.toFixed(1);
      if (!byConfidence[binKey]) {
        byConfidence[binKey] = { total: 0, correct: 0 };
      }
      byConfidence[binKey].total++;
      if (p.wasCorrect) {
        byConfidence[binKey].correct++;
      }
    });

    // Recent predictions (last 20)
    const recentPredictions = filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((p) => ({
        id: p.id,
        eventName: `${p.event.homeTeam} vs ${p.event.awayTeam}`,
        selection: p.selection,
        predictedProbability: p.predictedProbability,
        confidence: p.confidence,
        wasCorrect: p.wasCorrect,
        accuracy: p.accuracy,
        createdAt: p.createdAt,
        eventFinishedAt: p.eventFinishedAt,
      }));

    return {
      total,
      correct,
      accuracy,
      avgAccuracy,
      brierScore,
      calibrationScore,
      calibrationBins: calibrationScores,
      bySport: Object.entries(bySport).map(([sport, data]: [string, any]) => ({
        sport,
        total: data.total,
        correct: data.correct,
        accuracy: (data.correct / data.total) * 100,
        avgAccuracy: data.accuracySum / data.total,
      })),
      byMarket: Object.entries(byMarket).map(([market, data]: [string, any]) => ({
        market,
        total: data.total,
        correct: data.correct,
        accuracy: (data.correct / data.total) * 100,
        avgAccuracy: data.accuracySum / data.total,
      })),
      byConfidence: Object.entries(byConfidence).map(([confidence, data]: [string, any]) => ({
        confidence: parseFloat(confidence),
        total: data.total,
        correct: data.correct,
        accuracy: (data.correct / data.total) * 100,
      })),
      recentPredictions,
    };
  }
}

export const predictionsService = new PredictionsService();

