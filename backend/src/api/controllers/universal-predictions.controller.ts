/**
 * Universal Predictions Controller
 * Handles requests for universal prediction model
 */

import { Request, Response, NextFunction } from 'express';
import { universalPredictionService } from '../../services/universal-prediction.service';
import { logger } from '../../utils/logger';

class UniversalPredictionsController {
  /**
   * Get universal prediction
   */
  async predict(req: Request, res: Response, next: NextFunction) {
    try {
      const { domain, eventId, features, historicalData, marketData } = req.body;

      if (!domain || !eventId || !features) {
        return res.status(400).json({
          success: false,
          error: 'domain, eventId, and features are required',
        });
      }

      const prediction = await universalPredictionService.getUniversalPrediction({
        domain,
        eventId,
        features,
        historicalData,
        marketData,
      });

      res.json({
        success: true,
        data: prediction,
      });
    } catch (error: any) {
      logger.error('Error in universal prediction:', error);
      next(error);
    }
  }

  /**
   * Adapt model to new domain
   */
  async adaptDomain(req: Request, res: Response, next: NextFunction) {
    try {
      const { domain } = req.params;
      const trainingData = req.body;

      if (!Array.isArray(trainingData) || trainingData.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'trainingData must be a non-empty array',
        });
      }

      const result = await universalPredictionService.adaptToDomain(domain, trainingData);

      res.json({
        success: result.success,
        message: result.message,
        domain,
      });
    } catch (error: any) {
      logger.error(`Error adapting to domain ${req.params.domain}:`, error);
      next(error);
    }
  }

  /**
   * Get supported domains
   */
  async getDomains(req: Request, res: Response, next: NextFunction) {
    try {
      const domains = await universalPredictionService.getSupportedDomains();

      res.json({
        success: true,
        data: domains,
      });
    } catch (error: any) {
      logger.error('Error getting supported domains:', error);
      next(error);
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const info = await universalPredictionService.getModelInfo();

      res.json({
        success: true,
        data: info,
      });
    } catch (error: any) {
      logger.error('Error getting model info:', error);
      next(error);
    }
  }
}

export const universalPredictionsController = new UniversalPredictionsController();

