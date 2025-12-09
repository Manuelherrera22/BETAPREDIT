/**
 * Improved Prediction Service
 * Enhanced probability prediction using historical data and market analysis
 */

import { logger } from '../utils/logger';
import { getTheOddsAPIService } from './integrations/the-odds-api.service';
import { prisma } from '../config/database';

interface PredictionFactors {
  marketAverage: number; // Average implied probability from all bookmakers
  marketConsensus: number; // How much bookmakers agree (lower = more disagreement = opportunity)
  historicalAccuracy?: number; // Historical accuracy of this bookmaker for this sport
  valueAdjustment: number; // Adjustment factor based on market inefficiencies
}

class ImprovedPredictionService {
  /**
   * Calculate improved predicted probability
   * Uses multiple factors for better accuracy
   */
  async calculatePredictedProbability(
    eventId: string,
    selection: string,
    allBookmakerOdds: number[]
  ): Promise<{
    predictedProbability: number;
    confidence: number;
    factors: PredictionFactors;
  }> {
    try {
      if (!allBookmakerOdds || allBookmakerOdds.length === 0) {
        throw new Error('No odds provided');
      }

      // Calculate market average implied probability
      const impliedProbabilities = allBookmakerOdds.map(odd => 1 / odd);
      const marketAverage = impliedProbabilities.reduce((sum, prob) => sum + prob, 0) / impliedProbabilities.length;

      // Calculate market consensus (standard deviation of implied probabilities)
      const variance = impliedProbabilities.reduce((sum, prob) => {
        return sum + Math.pow(prob - marketAverage, 2);
      }, 0) / impliedProbabilities.length;
      const standardDeviation = Math.sqrt(variance);
      const marketConsensus = 1 - Math.min(standardDeviation * 2, 0.5); // Normalize to 0-1

      // Calculate value adjustment
      // If there's high disagreement (low consensus), there might be value
      const valueAdjustment = marketConsensus < 0.7 ? 1.05 : 1.02; // 5% or 2% adjustment

      // Get historical accuracy if available
      let historicalAccuracy: number | undefined;
      try {
        // Try to get historical performance for this selection type
        const historicalData = await this.getHistoricalAccuracy(selection);
        historicalAccuracy = historicalData;
      } catch (error) {
        // If no historical data, use default
        historicalAccuracy = undefined;
      }

      // Calculate predicted probability
      // Base: market average
      // Adjustment: value adjustment factor
      // Confidence: based on market consensus and historical data
      let predictedProbability = marketAverage * valueAdjustment;

      // Apply historical accuracy if available
      if (historicalAccuracy !== undefined) {
        // Weight: 70% market average, 30% historical
        predictedProbability = (marketAverage * 0.7) + (historicalAccuracy * 0.3);
      }

      // Ensure probability is between 0 and 1
      predictedProbability = Math.max(0.01, Math.min(0.99, predictedProbability));

      // Calculate confidence
      // Higher confidence if:
      // - High market consensus
      // - Historical data available
      // - More bookmakers (more data points)
      let confidence = marketConsensus;
      if (historicalAccuracy !== undefined) {
        confidence = (confidence * 0.7) + (0.8 * 0.3); // Boost confidence if historical data exists
      }
      confidence = confidence * (1 + Math.min(allBookmakerOdds.length / 10, 0.2)); // Boost for more bookmakers

      return {
        predictedProbability,
        confidence: Math.max(0.5, Math.min(0.95, confidence)), // Clamp between 0.5 and 0.95
        factors: {
          marketAverage,
          marketConsensus,
          historicalAccuracy,
          valueAdjustment,
        },
      };
    } catch (error: any) {
      logger.error('Error calculating predicted probability:', error);
      // Fallback to simple average
      const avgImpliedProb = allBookmakerOdds.reduce((sum, odd) => sum + (1 / odd), 0) / allBookmakerOdds.length;
      return {
        predictedProbability: avgImpliedProb * 1.05,
        confidence: 0.6,
        factors: {
          marketAverage: avgImpliedProb,
          marketConsensus: 0.7,
          valueAdjustment: 1.05,
        },
      };
    }
  }

  /**
   * Get historical accuracy for a selection type
   */
  private async getHistoricalAccuracy(selection: string): Promise<number | undefined> {
    try {
      // Get historical value bets for similar selections
      // This is a simplified version - in production, you'd use ML models
      const historicalAlerts = await prisma.valueBetAlert.findMany({
        where: {
          selection: {
            contains: selection.split(' ')[0], // Match first word (e.g., "Home", "Away", "Over")
          },
          status: 'TAKEN',
          externalBet: {
            isNot: null,
          },
        },
        include: {
          externalBet: {
            include: {
              result: true,
            },
          },
        },
        take: 100, // Last 100 similar bets
      });

      if (historicalAlerts.length < 10) {
        return undefined; // Not enough data
      }

      // Calculate win rate
      const wonBets = historicalAlerts.filter(a => 
        a.externalBet?.result?.status === 'WON'
      ).length;

      const winRate = wonBets / historicalAlerts.length;

      // Return as probability (0-1)
      return winRate;
    } catch (error: any) {
      logger.warn('Error getting historical accuracy:', error.message);
      return undefined;
    }
  }

  /**
   * Calculate value with improved prediction
   */
  async calculateValue(
    eventId: string,
    selection: string,
    bestOdds: number,
    allBookmakerOdds: number[]
  ): Promise<{
    value: number;
    valuePercentage: number;
    expectedValue: number;
    confidence: number;
    factors: PredictionFactors;
  }> {
    const prediction = await this.calculatePredictedProbability(
      eventId,
      selection,
      allBookmakerOdds
    );

    // Calculate value: (predicted_prob * odds) - 1
    const value = prediction.predictedProbability * bestOdds - 1;
    const valuePercentage = value * 100;
    const expectedValue = value * 100; // As percentage

    return {
      value,
      valuePercentage,
      expectedValue,
      confidence: prediction.confidence,
      factors: prediction.factors,
    };
  }
}

export const improvedPredictionService = new ImprovedPredictionService();

