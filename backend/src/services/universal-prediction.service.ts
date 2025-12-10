/**
 * Universal Prediction Service
 * Integrates with ML service universal predictor
 * Works across multiple domains: sports, finance, crypto, politics, etc.
 */

import { logger } from '../utils/logger';
import axios from 'axios';

interface UniversalPredictionRequest {
  domain: 'sports' | 'finance' | 'crypto' | 'politics' | 'generic';
  eventId: string;
  features: {
    marketOdds?: number[];
    sources?: Array<{ value?: number; probability?: number }>;
    volume?: number;
    activity?: number;
    timestamp?: string;
    [key: string]: any;
  };
  historicalData?: Array<{
    value?: number;
    probability?: number;
    timestamp?: string;
    [key: string]: any;
  }>;
  marketData?: Record<string, any>;
}

interface UniversalPredictionResponse {
  eventId: string;
  domain: string;
  predictedProbability: number;
  confidence: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  factors: Record<string, number>;
  timestamp: string;
}

class UniversalPredictionService {
  private mlServiceUrl: string;
  private defaultDomain: 'sports' | 'finance' | 'crypto' | 'politics' | 'generic' = 'sports';

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Get universal prediction
   * Works across multiple domains
   */
  async getUniversalPrediction(
    request: UniversalPredictionRequest
  ): Promise<UniversalPredictionResponse> {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/universal/predict`,
        request,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error getting universal prediction:', error);
      throw error;
    }
  }

  /**
   * Predict for sports event (main use case)
   */
  async predictSportsEvent(
    eventId: string,
    options: {
      marketOdds?: number[];
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
      historicalData?: Array<{
        value?: number;
        probability?: number;
        timestamp?: string;
      }>;
    }
  ): Promise<{
    predictedProbability: number;
    confidence: number;
    confidenceInterval: { lower: number; upper: number };
    factors: Record<string, number>;
    recommendation?: string;
  }> {
    try {
      const request: UniversalPredictionRequest = {
        domain: 'sports',
        eventId,
        features: {
          marketOdds: options.marketOdds || [],
          sources: options.marketOdds?.map(odd => ({
            value: 1 / odd,
            probability: 1 / odd,
          })) || [],
          volume: 1.0, // Default
          activity: 1.0, // Default
          timestamp: new Date().toISOString(),
          ...options.sportsFactors,
        },
        historicalData: options.historicalData,
      };

      const prediction = await this.getUniversalPrediction(request);

      return {
        predictedProbability: prediction.predictedProbability,
        confidence: prediction.confidence,
        confidenceInterval: prediction.confidenceInterval,
        factors: prediction.factors,
      };
    } catch (error: any) {
      logger.error('Error predicting sports event:', error);
      
      // Fallback to simple market average
      if (options.marketOdds && options.marketOdds.length > 0) {
        const avgImpliedProb = options.marketOdds.reduce(
          (sum, odd) => sum + (1 / odd),
          0
        ) / options.marketOdds.length;

        return {
          predictedProbability: avgImpliedProb,
          confidence: 0.6,
          confidenceInterval: {
            lower: Math.max(0, avgImpliedProb - 0.1),
            upper: Math.min(1, avgImpliedProb + 0.1),
          },
          factors: {
            market: avgImpliedProb,
          },
        };
      }

      throw error;
    }
  }

  /**
   * Adapt model to new domain
   */
  async adaptToDomain(
    domain: string,
    trainingData: Array<{
      features: Record<string, any>;
      historical?: Array<Record<string, any>>;
      outcome: number;
      probability?: number;
    }>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/universal/adapt/${domain}`,
        trainingData,
        {
          timeout: 30000, // Longer timeout for training
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        message: response.data.message || `Domain ${domain} adapted successfully`,
      };
    } catch (error: any) {
      logger.error(`Error adapting to domain ${domain}:`, error);
      return {
        success: false,
        message: error.message || 'Failed to adapt domain',
      };
    }
  }

  /**
   * Get supported domains
   */
  async getSupportedDomains(): Promise<{
    supportedDomains: string[];
    baseDomains: string[];
  }> {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/api/universal/domains`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error getting supported domains:', error);
      return {
        supportedDomains: ['sports'],
        baseDomains: ['sports', 'finance', 'crypto', 'politics', 'generic'],
      };
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<{
    version: string;
    type: string;
    architecture: string;
    domains: string[];
    features: string[];
  }> {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/api/universal/model-info`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error getting model info:', error);
      return {
        version: '1.0.0',
        type: 'Universal Meta-Learning',
        architecture: 'Ensemble + Domain Adapters',
        domains: ['sports'],
        features: [
          'trend',
          'volatility',
          'momentum',
          'consensus',
          'volume',
          'temporal_patterns',
          'statistical_features',
        ],
      };
    }
  }
}

export const universalPredictionService = new UniversalPredictionService();

