/**
 * Predictive Algorithms Integration Service
 * Integrates with platforms like ZCode System, Trademate Sports, OddsJam, BetBurger
 * These provide advanced statistical analysis and ML models for betting
 */
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

interface PredictiveAlgorithmConfig {
  provider: 'zcode' | 'trademate' | 'oddsjam' | 'betburger';
  apiKey: string;
  apiUrl: string;
}

interface Prediction {
  eventId: string;
  selection: string;
  probability: number;
  confidence: number;
  value: number; // Expected value
  recommendation: 'STRONG' | 'MODERATE' | 'WEAK' | 'AVOID';
  betSize?: number; // Recommended bet size (bet sizing)
}

interface BetSizingRecommendation {
  eventId: string;
  selections: Array<{
    selection: string;
    recommendedStake: number;
    expectedValue: number;
    probability: number;
  }>;
  totalBankroll: number;
  bankrollPercentage: number;
}

class PredictiveAlgorithmsService {
  private providers: Map<string, AxiosInstance> = new Map();

  /**
   * Register a predictive algorithm provider
   */
  registerProvider(config: PredictiveAlgorithmConfig) {
    const client = axios.create({
      baseURL: config.apiUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.providers.set(config.provider, client);
    logger.info(`Predictive algorithm provider registered: ${config.provider}`);
  }

  /**
   * Get predictions from a provider
   * These models provide superior accuracy compared to basic models
   */
  async getPredictions(
    provider: string,
    eventId: string,
    options?: {
      includePlayerData?: boolean;
      includeHistoricalData?: boolean;
    }
  ): Promise<Prediction[]> {
    const client = this.providers.get(provider);
    if (!client) {
      throw new Error(`Provider ${provider} not registered`);
    }

    try {
      const response = await client.post('/predictions', {
        event_id: eventId,
        include_player_data: options?.includePlayerData || false,
        include_historical: options?.includeHistoricalData || true,
      });

      return response.data.predictions || [];
    } catch (error) {
      logger.error(`Error getting predictions from ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get bet sizing recommendations
   * Bet sizing: allocate more capital where the model predicts higher win probability
   */
  async getBetSizing(
    provider: string,
    eventId: string,
    bankroll: number
  ): Promise<BetSizingRecommendation> {
    const client = this.providers.get(provider);
    if (!client) {
      throw new Error(`Provider ${provider} not registered`);
    }

    try {
      const response = await client.post('/bet-sizing', {
        event_id: eventId,
        bankroll: bankroll,
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting bet sizing from ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Compare predictions across multiple providers
   * Useful for finding consensus or identifying value
   */
  async comparePredictions(
    eventId: string,
    providers: string[]
  ): Promise<Map<string, Prediction[]>> {
    const results = new Map<string, Prediction[]>();

    await Promise.all(
      providers.map(async (provider) => {
        try {
          const predictions = await this.getPredictions(provider, eventId);
          results.set(provider, predictions);
        } catch (error) {
          logger.error(`Error getting predictions from ${provider}:`, error);
          results.set(provider, []);
        }
      })
    );

    return results;
  }

  /**
   * Get value bets (where model probability > market probability)
   */
  async getValueBets(provider: string, eventId: string): Promise<Prediction[]> {
    const predictions = await this.getPredictions(provider, eventId);
    
    // Filter for value bets (positive expected value)
    return predictions.filter((p) => p.value > 0 && p.recommendation !== 'AVOID');
  }

  /**
   * Get strategy recommendations
   * Suggests single bets vs parlays based on model accuracy
   */
  async getStrategyRecommendations(
    provider: string,
    eventIds: string[]
  ): Promise<{
    recommendedStrategy: 'SINGLES' | 'PARLAYS' | 'MIXED';
    reasoning: string;
    events: Array<{
      eventId: string;
      recommendedType: 'SINGLE' | 'PARLAY';
      confidence: number;
    }>;
  }> {
    const client = this.providers.get(provider);
    if (!client) {
      throw new Error(`Provider ${provider} not registered`);
    }

    try {
      const response = await client.post('/strategy', {
        event_ids: eventIds,
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting strategy recommendations:`, error);
      throw error;
    }
  }
}

export const predictiveAlgorithmsService = new PredictiveAlgorithmsService();

