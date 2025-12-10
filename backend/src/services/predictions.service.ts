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
   * Submit user feedback on a prediction
   */
  async submitUserFeedback(
    predictionId: string,
    userId: string,
    feedback: {
      wasCorrect: boolean;
      userConfidence?: number; // User's assessment of prediction quality (0-1)
      notes?: string;
    }
  ) {
    try {
      const prediction = await prisma.prediction.findUnique({
        where: { id: predictionId },
      });

      if (!prediction) {
        throw new AppError('Prediction not found', 404);
      }

      // Store feedback in factors JSON (or create a separate feedback table if needed)
      const currentFactors = (prediction.factors || {}) as any;
      const userFeedback = {
        userId,
        wasCorrect: feedback.wasCorrect,
        userConfidence: feedback.userConfidence,
        notes: feedback.notes,
        submittedAt: new Date().toISOString(),
      };

      // Store feedback in factors for now (could be moved to separate table)
      const updatedFactors = {
        ...currentFactors,
        userFeedback: userFeedback,
      };

      const updated = await prisma.prediction.update({
        where: { id: predictionId },
        data: {
          factors: updatedFactors,
        },
      });

      logger.info(`User feedback submitted for prediction ${predictionId} by user ${userId}`);
      return updated;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error submitting user feedback:', error);
      throw new AppError('Failed to submit user feedback', 500);
    }
  }

  /**
   * Get prediction with detailed factors explanation
   */
  async getPredictionWithFactors(predictionId: string) {
    try {
      const prediction = await prisma.prediction.findUnique({
        where: { id: predictionId },
        include: {
          event: {
            include: {
              sport: true,
            },
          },
          market: true,
        },
      });

      if (!prediction) {
        throw new AppError('Prediction not found', 404);
      }

      // Parse factors for better display
      const factors = (prediction.factors || {}) as any;
      const factorExplanation = this.explainFactors(factors, prediction);

      return {
        ...prediction,
        factorExplanation,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting prediction with factors:', error);
      throw new AppError('Failed to get prediction with factors', 500);
    }
  }

  /**
   * Explain factors that influenced the prediction
   */
  private explainFactors(factors: any, prediction: any): {
    keyFactors: Array<{ name: string; impact: number; description: string }>;
    confidenceFactors: Array<{ name: string; value: number; description: string }>;
    riskFactors: Array<{ name: string; level: 'low' | 'medium' | 'high'; description: string }>;
  } {
    const keyFactors: Array<{ name: string; impact: number; description: string }> = [];
    const confidenceFactors: Array<{ name: string; value: number; description: string }> = [];
    const riskFactors: Array<{ name: string; level: 'low' | 'medium' | 'high'; description: string }> = [];

    // Parse common factor types
    if (factors) {
      // Historical performance
      if (factors.historicalPerformance) {
        keyFactors.push({
          name: 'Rendimiento Histórico',
          impact: factors.historicalPerformance.impact || 0.3,
          description: `El equipo tiene un ${(factors.historicalPerformance.winRate * 100).toFixed(0)}% de victorias en los últimos encuentros`,
        });
      }

      // Form (recent results)
      if (factors.form) {
        keyFactors.push({
          name: 'Forma Reciente',
          impact: factors.form.impact || 0.25,
          description: factors.form.description || 'Basado en resultados recientes',
        });
      }

      // Head-to-head
      if (factors.headToHead) {
        keyFactors.push({
          name: 'Historial Directo',
          impact: factors.headToHead.impact || 0.2,
          description: factors.headToHead.description || 'Resultados en enfrentamientos previos',
        });
      }

      // Market odds
      if (factors.marketOdds) {
        confidenceFactors.push({
          name: 'Cuotas del Mercado',
          value: factors.marketOdds.impliedProbability || 0.5,
          description: `El mercado sugiere una probabilidad del ${((factors.marketOdds.impliedProbability || 0.5) * 100).toFixed(0)}%`,
        });
      }

      // Injuries/Suspensions
      if (factors.injuries) {
        const riskLevel = factors.injuries.count > 3 ? 'high' : factors.injuries.count > 1 ? 'medium' : 'low';
        riskFactors.push({
          name: 'Lesiones/Suspensiones',
          level: riskLevel,
          description: `${factors.injuries.count} jugador(es) clave afectado(s)`,
        });
      }

      // Weather conditions (for outdoor sports)
      if (factors.weather) {
        riskFactors.push({
          name: 'Condiciones Climáticas',
          level: factors.weather.risk || 'low',
          description: factors.weather.description || 'Condiciones normales',
        });
      }
    }

    // Sort by impact
    keyFactors.sort((a, b) => b.impact - a.impact);

    return {
      keyFactors,
      confidenceFactors,
      riskFactors,
    };
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
   * Get prediction history (resolved predictions)
   */
  async getPredictionHistory(options?: {
    limit?: number;
    offset?: number;
    sportId?: string;
    marketType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const {
        limit = 50,
        offset = 0,
        sportId,
        marketType,
        startDate,
        endDate,
      } = options || {};

      const where: any = {
        wasCorrect: { not: null }, // Only resolved predictions
      };

      if (sportId) {
        where.event = { sportId };
      }

      if (marketType) {
        where.market = { type: marketType };
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
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
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return predictions.map((p) => ({
        id: p.id,
        event: p.event.homeTeam && p.event.awayTeam
          ? `${p.event.homeTeam} vs ${p.event.awayTeam}`
          : p.event.name || 'Evento desconocido',
        sport: p.event.sport.name,
        predicted: p.selection,
        actual: p.actualResult === 'WON' ? p.selection : p.actualResult === 'LOST' ? 'Perdido' : 'Void',
        correct: p.wasCorrect || false,
        confidence: p.confidence * 100,
        date: p.createdAt.toISOString(),
        value: p.factors && typeof p.factors === 'object' && 'valuePercentage' in p.factors
          ? (p.factors as any).valuePercentage
          : null,
        odds: p.factors && typeof p.factors === 'object' && 'bookmakerOdds' in p.factors
          ? (p.factors as any).bookmakerOdds
          : null,
        accuracy: p.accuracy,
      }));
    } catch (error: any) {
      logger.error('Error getting prediction history:', error);
      throw new AppError('Failed to get prediction history', 500);
    }
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

