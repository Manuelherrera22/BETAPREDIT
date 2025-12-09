/**
 * ROI Tracking Controller
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { roiTrackingService } from '../../services/roi-tracking.service';

class ROITrackingController {
  /**
   * Get ROI tracking for current user
   * GET /api/roi-tracking
   */
  async getROITracking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { period } = req.query;

      const tracking = await roiTrackingService.getROITracking(
        userId,
        (period as 'week' | 'month' | 'year' | 'all_time') || 'all_time'
      );

      res.json({ success: true, data: tracking });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ROI history for charts
   * GET /api/roi-tracking/history
   */
  async getROIHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { period } = req.query;

      const history = await roiTrackingService.getROIHistory(
        userId,
        (period as 'week' | 'month' | 'year') || 'month'
      );

      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top value bets by ROI
   * GET /api/roi-tracking/top-value-bets
   */
  async getTopValueBets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { limit } = req.query;

      const topBets = await roiTrackingService.getTopValueBets(
        userId,
        limit ? parseInt(limit as string) : 10
      );

      res.json({ success: true, data: topBets });
    } catch (error) {
      next(error);
    }
  }
}

export const roiTrackingController = new ROITrackingController();

