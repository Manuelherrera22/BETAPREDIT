/**
 * Predictions Controller
 * Handles prediction-related API requests
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { predictionsService } from '../../services/predictions.service';
import { logger } from '../../utils/logger';

class PredictionsController {
  /**
   * Get prediction accuracy statistics
   * GET /api/predictions/accuracy
   */
  async getAccuracyStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        modelVersion,
        sportId,
        marketType,
        startDate,
        endDate,
      } = req.query;

      const options: any = {};
      if (modelVersion) options.modelVersion = modelVersion as string;
      if (sportId) options.sportId = sportId as string;
      if (marketType) options.marketType = marketType as string;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const stats = await predictionsService.getAccuracyTracking(options);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get predictions for an event
   * GET /api/predictions/event/:eventId
   */
  async getEventPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const predictions = await predictionsService.getEventPredictions(eventId);
      res.json({ success: true, data: predictions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get basic prediction statistics
   * GET /api/predictions/stats
   */
  async getPredictionStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { modelVersion } = req.query;
      const stats = await predictionsService.getPredictionStats(
        modelVersion as string | undefined
      );
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const predictionsController = new PredictionsController();

