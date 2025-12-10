/**
 * Ensemble Prediction Service
 * Integrates with ML service ensemble predictor
 * Combines multiple prediction sources for better accuracy
 */

import { logger } from '../utils/logger';
import axios from 'axios';

interface EnsemblePredictionRequest {
  eventId: string;
  sportId: string;
  homeTeam: string;
  awayTeam: string;
  marketOdds: number[];
  sportsFactors?: {
    homeForm?: number;
    awayForm?: number;
    headToHead?: number;
    homeInjuries?: number;
    awayInjuries?: number;
  };
}

interface EnsemblePredictionResponse {
  eventId: string;
  predictedProbability: number;
  confidence: number;
  sources: {
    market?: number;
    api_professional?: number;
    ml_model?: number;
    sports_factors?: number;
  };
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';
  timestamp: string;
}

class EnsemblePredictionService {
  private mlServiceUrl: string;

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Get ensemble prediction
   * Combines market odds, professional APIs, ML models, and sports factors
   */
  async getEnsemblePrediction(
    request: EnsemblePredictionRequest
  ): Promise<EnsemblePredictionResponse> {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/ensemble/predict`,
        request,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error getting ensemble prediction:', error);
      
      // Fallback to improved prediction service
      logger.warn('Falling back to improved prediction service');
      throw error;
    }
  }

  /**
   * Get prediction with all factors combined
   * This is the main method to use for predictions
   */
  async predictWithEnsemble(
    eventId: string,
    selection: string,
    allBookmakerOdds: number[],
    options?: {
      homeTeam?: string;
      awayTeam?: string;
      sportId?: string;
      sportsFactors?: {
        homeForm?: number;
        awayForm?: number;
        headToHead?: number;
        homeInjuries?: number;
        awayInjuries?: number;
      };
    }
  ): Promise<{
    predictedProbability: number;
    confidence: number;
    recommendation: string;
    sources: any;
  }> {
    try {
      // Prepare request
      const request: EnsemblePredictionRequest = {
        eventId,
        sportId: options?.sportId || 'soccer',
        homeTeam: options?.homeTeam || 'Home',
        awayTeam: options?.awayTeam || 'Away',
        marketOdds: allBookmakerOdds,
        sportsFactors: options?.sportsFactors,
      };

      // Get ensemble prediction
      const ensemble = await this.getEnsemblePrediction(request);

      return {
        predictedProbability: ensemble.predictedProbability,
        confidence: ensemble.confidence,
        recommendation: ensemble.recommendation,
        sources: ensemble.sources,
      };
    } catch (error: any) {
      logger.error('Error in ensemble prediction:', error);
      
      // Fallback: use market average
      const avgImpliedProb = allBookmakerOdds.reduce((sum, odd) => sum + (1 / odd), 0) / allBookmakerOdds.length;
      
      return {
        predictedProbability: avgImpliedProb,
        confidence: 0.6,
        recommendation: 'HOLD',
        sources: {
          market: avgImpliedProb,
        },
      };
    }
  }
}

export const ensemblePredictionService = new EnsemblePredictionService();

