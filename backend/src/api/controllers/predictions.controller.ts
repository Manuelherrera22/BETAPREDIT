/**
 * Predictions Controller
 * Handles prediction-related API requests
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { predictionsService } from '../../services/predictions.service';
import { autoPredictionsService } from '../../services/auto-predictions.service';
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

  /**
   * Submit user feedback on a prediction
   * POST /api/predictions/:predictionId/feedback
   */
  async submitFeedback(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { predictionId } = req.params;
      const userId = req.user!.id;
      const { wasCorrect, userConfidence, notes } = req.body;

      if (wasCorrect === undefined) {
        return res.status(400).json({
          success: false,
          error: { message: 'wasCorrect is required' },
        });
      }

      const updated = await predictionsService.submitUserFeedback(predictionId, userId, {
        wasCorrect,
        userConfidence,
        notes,
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get prediction with detailed factors
   * GET /api/predictions/:predictionId/factors
   */
  async getPredictionFactors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { predictionId } = req.params;
      const prediction = await predictionsService.getPredictionWithFactors(predictionId);
      res.json({ success: true, data: prediction });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually trigger prediction generation
   * POST /api/predictions/generate
   */
  async generatePredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      logger.info('Manual prediction generation triggered by user');
      const result = await autoPredictionsService.generatePredictionsForUpcomingEvents();
      res.json({
        success: true,
        message: `Generated ${result.generated} predictions, updated ${result.updated}`,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error in manual prediction generation:', error);
      next(error);
    }
  }
}

export const predictionsController = new PredictionsController();

