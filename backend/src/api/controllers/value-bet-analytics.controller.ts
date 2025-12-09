/**
 * Value Bet Analytics Controller
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { valueBetAnalyticsService } from '../../services/value-bet-analytics.service';

class ValueBetAnalyticsController {
  /**
   * Get analytics
   * GET /api/value-bet-analytics
   */
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, sport } = req.query;

      const analytics = await valueBetAnalyticsService.getAnalytics(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sport: sport as string,
      });

      res.json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top value bets
   * GET /api/value-bet-analytics/top
   */
  async getTopValueBets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { limit } = req.query;

      const topBets = await valueBetAnalyticsService.getTopValueBets(
        limit ? parseInt(limit as string) : 10,
        userId
      );

      res.json({ success: true, data: topBets });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get trends
   * GET /api/value-bet-analytics/trends
   */
  async getTrends(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { days } = req.query;

      const trends = await valueBetAnalyticsService.getTrends(
        days ? parseInt(days as string) : 30
      );

      res.json({ success: true, data: trends });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track outcome
   * POST /api/value-bet-analytics/track/:alertId
   */
  async trackOutcome(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { alertId } = req.params;
      const { outcome } = req.body;

      if (!['WON', 'LOST', 'VOID'].includes(outcome)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid outcome. Must be WON, LOST, or VOID' },
        });
      }

      await valueBetAnalyticsService.trackOutcome(alertId, outcome);

      res.json({ success: true, message: 'Outcome tracked' });
    } catch (error) {
      next(error);
    }
  }
}

export const valueBetAnalyticsController = new ValueBetAnalyticsController();

