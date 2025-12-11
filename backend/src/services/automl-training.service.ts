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
      // Log error without circular structure issues
      const errorInfo: any = {
        message: error.message,
        code: error.code,
      };
      if (error.response) {
        errorInfo.status = error.response.status;
        errorInfo.statusText = error.response.statusText;
        errorInfo.data = error.response.data;
      }
      if (error.config) {
        errorInfo.url = error.config.url;
        errorInfo.method = error.config.method;
      }
      logger.error('Error training AutoML model:', errorInfo);
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
    // Use autogluon as default (best performance for tabular data)
    const framework = options?.framework || 'autogluon';
    // Increase time limit for better model quality with 50+ features
    const timeLimit = options?.timeLimit || 7200; // 2 hours for comprehensive training
    const useRealData = options?.useRealData !== false; // Default to true
    // Increase limit to get more training data for better accuracy
    const limit = options?.limit || 5000; // More data = better model

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
   * Public method for testing feature extraction
   */
  async getTrainingDataFromDatabase(limit: number = 10): Promise<Array<{
    features: Record<string, number>;
    outcome: number;
  }>> {
    return this._getTrainingDataFromDatabase(limit);
  }

  /**
   * Get training data from database with all advanced features extracted (internal)
   */
  private async _getTrainingDataFromDatabase(limit: number): Promise<Array<{
    features: Record<string, number>;
    outcome: number;
  }>> {
    try {
      // Use the SQL function to get predictions with all data
      // Cast parameters to correct types for PostgreSQL
      const predictions = await prisma.$queryRaw<any[]>`
        SELECT * FROM get_predictions_for_training(
          ${limit}::INTEGER, 
          0.0::FLOAT, 
          NULL::TIMESTAMP, 
          NULL::TIMESTAMP
        )
      `;

      const trainingData = predictions.map(pred => {
        const features = this._extractAllFeatures(pred);
        const outcome = pred.was_correct ? 1 : 0;
        
        // Log feature count for first prediction
        if (predictions.indexOf(pred) === 0) {
          const featureCount = Object.keys(features).length;
          logger.info(`Extracted ${featureCount} features from prediction. Feature names: ${Object.keys(features).slice(0, 20).join(', ')}...`);
        }
        
        return {
          features,
          outcome,
        };
      });

      // Log summary
      if (trainingData.length > 0) {
        const sampleFeatures = trainingData[0].features;
        const featureCount = Object.keys(sampleFeatures).length;
        logger.info(`Training data prepared: ${trainingData.length} samples with ${featureCount} features each`);
      }

      return trainingData;
    } catch (error: any) {
      logger.error('Error getting training data from database:', error);
      throw error;
    }
  }

  /**
   * Extract ALL features from prediction data including advanced features from factors JSON
   * This function extracts 50+ features to maximize model accuracy
   */
  private _extractAllFeatures(prediction: any): Record<string, number> {
    const features: Record<string, number> = {};

    // Basic features (always present)
    features.predicted_probability = Number(prediction.predicted_probability) || 0;
    features.confidence = Number(prediction.confidence) || 0;
    features.avg_odds = Number(prediction.avg_odds) || 0;
    features.days_until_event = Number(prediction.days_until_event) || 0;
    features.accuracy = Number(prediction.accuracy) || 0;

    // Parse factors JSON if it's a string
    let factors: any = null;
    if (prediction.factors) {
      if (typeof prediction.factors === 'string') {
        try {
          factors = JSON.parse(prediction.factors);
        } catch (e) {
          logger.warn('Failed to parse factors JSON string:', e);
          factors = null;
        }
      } else if (typeof prediction.factors === 'object') {
        factors = prediction.factors;
      }
    }

    // Extract advanced features from factors JSON
    // Also check alternative structures (homeForm, awayForm, h2h, market)
    if (factors && typeof factors === 'object') {

      // Market Intelligence Features (from marketOdds or market)
      if (factors.marketOdds) {
        const mo = factors.marketOdds;
        features.market_avg_implied_prob = Number(mo.impliedProbability) || 0;
        features.market_consensus = Number(mo.consensus) || 0;
        features.market_volatility = Number(mo.volatility) || 0;
        features.bookmaker_count = Number(mo.bookmakerCount) || 0;
        features.odds_range = (Number(mo.maxOdds) || 0) - (Number(mo.minOdds) || 0);
        features.odds_std = Number(mo.stdDev) || 0;
        features.odds_median = Number(mo.median) || 0;
      }

      // Historical Performance Features
      if (factors.historicalPerformance) {
        const hp = factors.historicalPerformance;
        features.historical_win_rate = Number(hp.winRate) || 0;
        features.historical_goals_avg = Number(hp.goalsAvg) || 0;
        features.historical_goals_against_avg = Number(hp.goalsAgainstAvg) || 0;
        features.historical_matches_count = Number(hp.matchesCount) || 0;
        features.historical_impact = Number(hp.impact) || 0;
        features.historical_clean_sheets = Number(hp.cleanSheets) || 0;
        features.historical_avg_possession = Number(hp.avgPossession) || 0;
        features.historical_shots_on_target = Number(hp.shotsOnTarget) || 0;
      }

      // Team Form Features (recent matches)
      // Check both 'form' and 'homeForm'/'awayForm' structures
      if (factors.form) {
        const form = factors.form;
        features.form_win_rate = Number(form.winRate) || 0;
        features.form_goals_scored = Number(form.goalsScored) || 0;
        features.form_goals_conceded = Number(form.goalsConceded) || 0;
        features.form_matches_count = Number(form.matchesCount) || 0;
        features.form_impact = Number(form.impact) || 0;
        features.form_momentum = Number(form.momentum) || 0;
        features.team_form_momentum = Number(form.momentum) || 0;
        features.team_form_recent_wins = Number(form.recentWins) || 0;
        features.team_form_recent_losses = Number(form.recentLosses) || 0;
        features.team_form_recent_draws = Number(form.recentDraws) || 0;
        features.team_form_goals_per_match = features.form_matches_count > 0 
          ? features.form_goals_scored / features.form_matches_count 
          : 0;
      }
      
      // Extract homeForm and awayForm features separately (if available)
      if (factors.homeForm) {
        const hf = factors.homeForm;
        features.home_form_win_rate_5 = Number(hf.winRate5) || 0;
        features.home_form_win_rate_10 = Number(hf.winRate10) || 0;
        features.home_form_goals_for_avg = Number(hf.goalsForAvg5) || 0;
        features.home_form_goals_against_avg = Number(hf.goalsAgainstAvg5) || 0;
        features.home_form_streak = Number(hf.currentStreak) || 0;
        features.home_form_trend = Number(hf.formTrend) || 0;
        features.home_form_wins_5 = Number(hf.wins5) || 0;
        features.home_form_losses_5 = Number(hf.losses5) || 0;
        features.home_form_draws_5 = Number(hf.draws5) || 0;
      }
      
      if (factors.awayForm) {
        const af = factors.awayForm;
        features.away_form_win_rate_5 = Number(af.winRate5) || 0;
        features.away_form_win_rate_10 = Number(af.winRate10) || 0;
        features.away_form_goals_for_avg = Number(af.goalsForAvg5) || 0;
        features.away_form_goals_against_avg = Number(af.goalsAgainstAvg5) || 0;
        features.away_form_streak = Number(af.currentStreak) || 0;
        features.away_form_trend = Number(af.formTrend) || 0;
        features.away_form_wins_5 = Number(af.wins5) || 0;
        features.away_form_losses_5 = Number(af.losses5) || 0;
        features.away_form_draws_5 = Number(af.draws5) || 0;
      }

      // Head-to-Head Features
      if (factors.headToHead) {
        const h2h = factors.headToHead;
        features.h2h_win_rate = Number(h2h.winRate) || 0;
        features.h2h_goals_avg = Number(h2h.goalsAvg) || 0;
        features.h2h_matches_count = Number(h2h.matchesCount) || 0;
        features.h2h_impact = Number(h2h.impact) || 0;
        features.h2h_recent_trend = Number(h2h.recentTrend) || 0;
        features.h2h_home_advantage = Number(h2h.homeAdvantage) || 0;
        features.h2h_avg_total_goals = Number(h2h.avgTotalGoals) || 0;
        features.h2h_btts_rate = Number(h2h.bothTeamsScoredRate) || 0;
      }
      
      // Extract h2h features separately (if available)
      if (factors.h2h) {
        const h2h = factors.h2h;
        features.h2h_team1_win_rate = Number(h2h.team1WinRate) || 0;
        features.h2h_draw_rate = Number(h2h.drawRate) || 0;
        features.h2h_total_matches = Number(h2h.totalMatches) || 0;
        features.h2h_both_teams_scored_rate = Number(h2h.bothTeamsScoredRate) || 0;
        // Also set the main h2h features if not already set
        if (!features.h2h_win_rate) {
          features.h2h_win_rate = features.h2h_team1_win_rate;
        }
        if (!features.h2h_goals_avg) {
          features.h2h_goals_avg = Number(h2h.totalGoalsAvg) || 0;
        }
        if (!features.h2h_recent_trend) {
          features.h2h_recent_trend = Number(h2h.recentTrend) || 0;
        }
        if (!features.h2h_avg_total_goals) {
          features.h2h_avg_total_goals = features.h2h_goals_avg;
        }
      }

      // Injuries/Suspensions Features
      if (factors.injuries) {
        const inj = factors.injuries;
        features.injuries_count = Number(inj.count) || 0;
        features.injuries_key_players = Number(inj.keyPlayersCount) || 0;
        features.injuries_risk_level = this._mapRiskLevelToNumber(inj.riskLevel);
        features.suspensions_count = Number(inj.suspensionsCount) || 0;
        features.injuries_goalkeeper = Number(inj.goalkeeperInjured) || 0;
        features.injuries_defender = Number(inj.defenderInjured) || 0;
        features.injuries_midfielder = Number(inj.midfielderInjured) || 0;
        features.injuries_forward = Number(inj.forwardInjured) || 0;
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

      // Market Intelligence Features (separate from marketOdds)
      if (factors.marketIntelligence) {
        const mi = factors.marketIntelligence;
        features.market_sentiment = Number(mi.sentiment) || 0;
        features.market_volume = Number(mi.volume) || 0;
        features.market_movement = Number(mi.movement) || 0;
        features.market_trend = Number(mi.trend) || 0;
        features.market_confidence = Number(mi.confidence) || 0;
      }
      
      // Extract market features separately (if available)
      if (factors.market) {
        const market = factors.market;
        features.market_consensus_direct = Number(market.consensus) || 0;
        features.market_efficiency = Number(market.efficiency) || 0;
        features.market_sharp_money = Number(market.sharpMoneyIndicator) || 0;
        features.market_value_opportunity = Number(market.valueOpportunity) || 0;
        features.market_odds_spread = Number(market.oddsSpread) || 0;
        // Also set main market features if not already set
        if (!features.market_consensus) {
          features.market_consensus = features.market_consensus_direct;
        }
        if (!features.market_volatility) {
          features.market_volatility = 1 - features.market_efficiency;
        }
        if (!features.market_sentiment) {
          features.market_sentiment = features.market_sharp_money;
        }
        if (!features.market_volume) {
          features.market_volume = features.market_value_opportunity;
        }
        if (!features.odds_range) {
          features.odds_range = features.market_odds_spread;
        }
      }
      
      // Market Intelligence (alternative structure - direct properties)
      if (factors.market_consensus !== undefined) {
        features.market_consensus_alt = Number(factors.market_consensus) || 0;
      }
      if (factors.market_volatility !== undefined) {
        features.market_volatility_alt = Number(factors.market_volatility) || 0;
      }
      if (factors.market_sentiment !== undefined) {
        features.market_sentiment_alt = Number(factors.market_sentiment) || 0;
      }
      
      // Form advantage features (from auto-predictions service)
      if (factors.formAdvantage !== undefined) {
        features.form_advantage = Number(factors.formAdvantage) || 0;
      }
      if (factors.goalsAdvantage !== undefined) {
        features.goals_advantage = Number(factors.goalsAdvantage) || 0;
      }
      if (factors.defenseAdvantage !== undefined) {
        features.defense_advantage = Number(factors.defenseAdvantage) || 0;
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
    const marketType = (prediction.market_type || '').toUpperCase();
    features.market_type_match_winner = marketType === 'MATCH_WINNER' || marketType.includes('H2H') ? 1 : 0;
    features.market_type_over_under = marketType.includes('OVER_UNDER') || marketType.includes('TOTAL') ? 1 : 0;
    features.market_type_both_teams_score = marketType === 'BOTH_TEAMS_SCORE' || marketType === 'BTTS' ? 1 : 0;
    features.market_type_draw_no_bet = marketType.includes('DRAW_NO_BET') ? 1 : 0;
    features.market_type_double_chance = marketType.includes('DOUBLE_CHANCE') ? 1 : 0;
    features.market_type_encoded = this._encodeMarketType(marketType);

    // Sport encoding
    const sportName = (prediction.sport_name || '').toLowerCase();
    features.sport_soccer = sportName.includes('soccer') || sportName.includes('football') ? 1 : 0;
    features.sport_basketball = sportName.includes('basketball') ? 1 : 0;
    features.sport_tennis = sportName.includes('tennis') ? 1 : 0;
    features.sport_encoded = this._encodeSport(sportName);

    // Calculated features
    features.odds_implied_prob = features.avg_odds > 0 ? 1 / features.avg_odds : 0;
    features.probability_difference = features.predicted_probability - features.odds_implied_prob;
    features.value_bet_score = features.probability_difference * features.confidence;
    
    // Time-based features
    if (prediction.days_until_event !== undefined) {
      features.is_imminent = features.days_until_event < 1 ? 1 : 0;
      features.is_near_term = features.days_until_event >= 1 && features.days_until_event < 7 ? 1 : 0;
      features.is_long_term = features.days_until_event >= 7 ? 1 : 0;
    }

    // Log feature count for debugging
    const featureCount = Object.keys(features).length;
    if (featureCount < 30) {
      logger.warn(`Only ${featureCount} features extracted from prediction ${prediction.id}. Expected 50+`);
    }

    return features;
  }

  /**
   * Encode market type as numeric value
   */
  private _encodeMarketType(marketType: string): number {
    const encodings: Record<string, number> = {
      'MATCH_WINNER': 1,
      'H2H': 1,
      'OVER_UNDER': 2,
      'TOTAL': 2,
      'BOTH_TEAMS_SCORE': 3,
      'BTTS': 3,
      'DRAW_NO_BET': 4,
      'DOUBLE_CHANCE': 5,
    };
    
    for (const [key, value] of Object.entries(encodings)) {
      if (marketType.includes(key)) return value;
    }
    return 0;
  }

  /**
   * Encode sport as numeric value
   */
  private _encodeSport(sportName: string): number {
    if (sportName.includes('soccer') || sportName.includes('football')) return 1;
    if (sportName.includes('basketball')) return 2;
    if (sportName.includes('tennis')) return 3;
    if (sportName.includes('baseball')) return 4;
    if (sportName.includes('hockey')) return 5;
    return 0;
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

