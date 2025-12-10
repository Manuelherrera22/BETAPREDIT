/**
 * AutoML Training Service
 * Integrates with ML service AutoML trainer
 * Automatically trains and optimizes models
 */

import { logger } from '../utils/logger';
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
  }): Promise<AutoMLTrainingResponse> {
    const framework = options?.framework || 'autogluon';
    const timeLimit = options?.timeLimit || 3600;

    // For now, use synthetic data
    // In production, fetch from database
    const trainingData = this._generateTrainingData(1000);

    return this.trainModel({
      framework,
      domain: 'sports',
      trainingData,
      task: 'classification',
      timeLimit,
    });
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

