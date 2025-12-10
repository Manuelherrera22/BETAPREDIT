/**
 * AutoML Training Service
 * Integrates with ML service AutoML trainer
 * Automatically trains and optimizes models
 */

import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import axios from 'axios';

interface AutoMLTrainingRequest {
  framework: 'autogluon' | 'autosklearn' | 'tpot';
  domain: string;
  trainingData: Array<{
    features: Record<string, number> | number[];
    outcome?: number;
    label?: number;
    probability?: number;
  }>;
  task?: 'classification' | 'regression';
  timeLimit?: number;
  metric?: string;
}

interface AutoMLTrainingResponse {
  success: boolean;
  framework: string;
  domain: string;
  modelPath: string;
  accuracy: number;
  trainingTime: number;
  bestModel: string;
  features: string[];
  timestamp: string;
}

class AutoMLTrainingService {
  private mlServiceUrl: string;

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Train model using AutoML
   */
  async trainModel(request: AutoMLTrainingRequest): Promise<AutoMLTrainingResponse> {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/automl/train`,
        request,
        {
          timeout: (request.timeLimit || 3600) * 1000 + 60000, // Add 1 minute buffer
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error training AutoML model:', error);
      throw error;
    }
  }

  /**
   * Get available AutoML frameworks
   */
  async getAvailableFrameworks(): Promise<{
    autosklearn: boolean;
    autogluon: boolean;
    tpot: boolean;
    recommended: string;
  }> {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/api/automl/available`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error getting available frameworks:', error);
      return {
        autosklearn: false,
        autogluon: false,
        tpot: false,
        recommended: 'autogluon',
      };
    }
  }

  /**
   * Get trained models
   */
  async getTrainedModels(): Promise<Array<{
    key: string;
    path: string;
    score: number;
    features: string[];
    trained_at: string;
  }>> {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/api/automl/models`, {
        timeout: 5000,
      });

      return response.data.models || [];
    } catch (error: any) {
      logger.error('Error getting trained models:', error);
      return [];
    }
  }

  /**
   * Train sports model with data from database
   */
  async trainSportsModel(options?: {
    framework?: 'autogluon' | 'autosklearn' | 'tpot';
    timeLimit?: number;
    useRealData?: boolean;
    limit?: number;
  }): Promise<AutoMLTrainingResponse> {
    const framework = options?.framework || 'autogluon';
    const timeLimit = options?.timeLimit || 3600;
    const useRealData = options?.useRealData !== false; // Default to true
    const limit = options?.limit || 1000;

    let trainingData: Array<{
      features: Record<string, number>;
      outcome: number;
    }>;

    if (useRealData) {
      try {
        trainingData = await this._getTrainingDataFromDatabase(limit);
        logger.info(`Loaded ${trainingData.length} predictions from database for training`);
      } catch (error: any) {
        logger.warn('Failed to load real data, using synthetic data:', error.message);
        trainingData = this._generateTrainingData(limit);
      }
    } else {
      trainingData = this._generateTrainingData(limit);
    }

    return this.trainModel({
      framework,
      domain: 'sports',
      trainingData,
      task: 'classification',
      timeLimit,
    });
  }

  /**
   * Get training data from database with all advanced features extracted
   */
  private async _getTrainingDataFromDatabase(limit: number): Promise<Array<{
    features: Record<string, number>;
    outcome: number;
  }>> {
    try {
      // Use the SQL function to get predictions with all data
      const predictions = await prisma.$queryRaw<any[]>`
        SELECT * FROM get_predictions_for_training(${limit}, 0.0, NULL, NULL)
      `;

      return predictions.map(pred => {
        const features = this._extractAllFeatures(pred);
        const outcome = pred.was_correct ? 1 : 0;
        
        return {
          features,
          outcome,
        };
      });
    } catch (error: any) {
      logger.error('Error getting training data from database:', error);
      throw error;
    }
  }

  /**
   * Extract ALL features from prediction data including advanced features from factors JSON
   */
  private _extractAllFeatures(prediction: any): Record<string, number> {
    const features: Record<string, number> = {};

    // Basic features
    features.predicted_probability = prediction.predicted_probability || 0;
    features.confidence = prediction.confidence || 0;
    features.avg_odds = prediction.avg_odds || 0;
    features.days_until_event = prediction.days_until_event || 0;
    features.accuracy = prediction.accuracy || 0;

    // Extract advanced features from factors JSON
    if (prediction.factors && typeof prediction.factors === 'object') {
      const factors = prediction.factors as any;

      // Market Intelligence Features
      if (factors.marketOdds) {
        features.market_avg_implied_prob = factors.marketOdds.impliedProbability || 0;
        features.market_consensus = factors.marketOdds.consensus || 0;
        features.market_volatility = factors.marketOdds.volatility || 0;
        features.bookmaker_count = factors.marketOdds.bookmakerCount || 0;
        features.odds_range = factors.marketOdds.maxOdds - factors.marketOdds.minOdds || 0;
      }

      // Historical Performance Features
      if (factors.historicalPerformance) {
        features.historical_win_rate = factors.historicalPerformance.winRate || 0;
        features.historical_goals_avg = factors.historicalPerformance.goalsAvg || 0;
        features.historical_goals_against_avg = factors.historicalPerformance.goalsAgainstAvg || 0;
        features.historical_matches_count = factors.historicalPerformance.matchesCount || 0;
        features.historical_impact = factors.historicalPerformance.impact || 0;
      }

      // Team Form Features
      if (factors.form) {
        features.form_win_rate = factors.form.winRate || 0;
        features.form_goals_scored = factors.form.goalsScored || 0;
        features.form_goals_conceded = factors.form.goalsConceded || 0;
        features.form_matches_count = factors.form.matchesCount || 0;
        features.form_impact = factors.form.impact || 0;
        features.form_momentum = factors.form.momentum || 0; // Recent trend
      }

      // Head-to-Head Features
      if (factors.headToHead) {
        features.h2h_win_rate = factors.headToHead.winRate || 0;
        features.h2h_goals_avg = factors.headToHead.goalsAvg || 0;
        features.h2h_matches_count = factors.headToHead.matchesCount || 0;
        features.h2h_impact = factors.headToHead.impact || 0;
        features.h2h_recent_trend = factors.headToHead.recentTrend || 0;
      }

      // Injuries/Suspensions Features
      if (factors.injuries) {
        features.injuries_count = factors.injuries.count || 0;
        features.injuries_key_players = factors.injuries.keyPlayersCount || 0;
        features.injuries_risk_level = this._mapRiskLevelToNumber(factors.injuries.riskLevel);
      }

      // Weather Features (for outdoor sports)
      if (factors.weather) {
        features.weather_risk = this._mapRiskLevelToNumber(factors.weather.risk);
        features.weather_temperature = factors.weather.temperature || 0;
        features.weather_wind_speed = factors.weather.windSpeed || 0;
      }

      // Value Bet Features
      if (factors.valuePercentage !== undefined) {
        features.value_percentage = factors.valuePercentage;
      }

      // Market Intelligence Features
      if (factors.marketIntelligence) {
        features.market_sentiment = factors.marketIntelligence.sentiment || 0;
        features.market_volume = factors.marketIntelligence.volume || 0;
        features.market_movement = factors.marketIntelligence.movement || 0;
      }

      // Team Strength Features
      if (factors.teamStrength) {
        features.team_strength_home = factors.teamStrength.home || 0;
        features.team_strength_away = factors.teamStrength.away || 0;
        features.team_strength_difference = (factors.teamStrength.home || 0) - (factors.teamStrength.away || 0);
      }

      // Additional calculated features
      if (factors.trend !== undefined) {
        features.trend = factors.trend;
      }
      if (factors.momentum !== undefined) {
        features.momentum = factors.momentum;
      }
    }

    // Market type encoding (one-hot like)
    const marketType = prediction.market_type || '';
    features.market_type_match_winner = marketType === 'MATCH_WINNER' ? 1 : 0;
    features.market_type_over_under = marketType.includes('OVER_UNDER') ? 1 : 0;
    features.market_type_both_teams_score = marketType === 'BOTH_TEAMS_SCORE' ? 1 : 0;

    // Sport encoding
    const sportName = prediction.sport_name || '';
    features.sport_soccer = sportName.toLowerCase().includes('soccer') || sportName.toLowerCase().includes('football') ? 1 : 0;
    features.sport_basketball = sportName.toLowerCase().includes('basketball') ? 1 : 0;
    features.sport_tennis = sportName.toLowerCase().includes('tennis') ? 1 : 0;

    return features;
  }

  /**
   * Map risk level string to number
   */
  private _mapRiskLevelToNumber(riskLevel?: string): number {
    if (!riskLevel) return 0;
    switch (riskLevel.toLowerCase()) {
      case 'low': return 0.33;
      case 'medium': return 0.66;
      case 'high': return 1.0;
      default: return 0;
    }
  }

  /**
   * Generate training data (placeholder - replace with real data)
   */
  private _generateTrainingData(count: number): Array<{
    features: Record<string, number>;
    outcome: number;
  }> {
    const data = [];

    for (let i = 0; i < count; i++) {
      const marketAvg = Math.random() * 0.4 + 0.3;
      const marketStd = Math.random() * 0.15 + 0.05;
      const trend = (Math.random() - 0.5) * 0.6;
      const volatility = Math.random() * 0.4 + 0.1;
      const momentum = (Math.random() - 0.5) * 0.4;
      const consensus = Math.random() * 0.4 + 0.5;
      const confidence = Math.random() * 0.35 + 0.6;

      const baseProb = marketAvg;
      const adjustedProb = Math.max(0, Math.min(1, baseProb + trend * 0.2 + momentum * 0.1));
      const outcome = Math.random() < adjustedProb ? 1 : 0;

      data.push({
        features: {
          market_avg: marketAvg,
          market_std: marketStd,
          trend: trend,
          volatility: volatility,
          momentum: momentum,
          consensus: consensus,
          confidence: confidence,
        },
        outcome: outcome,
      });
    }

    return data;
  }
}

export const automlTrainingService = new AutoMLTrainingService();

