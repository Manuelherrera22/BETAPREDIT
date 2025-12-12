/**
 * Value Bet Detection Controller
 * Endpoints for automatic value bet detection
 */

import { Request, Response, NextFunction } from 'express';
import { valueBetDetectionService } from '../../services/value-bet-detection.service';
import { AppError } from '../../middleware/errorHandler';

class ValueBetDetectionController {
  /**
   * Detect value bets for a specific sport
   * GET /api/value-bet-detection/sport/:sport
   */
  async detectForSport(req: Request, res: Response, next: NextFunction) {
    try {
      const { sport } = req.params;
      const { minValue, maxEvents, autoCreateAlerts } = req.query;

      const valueBets = await valueBetDetectionService.detectValueBetsForSport({
        sport: sport || 'soccer_epl',
        minValue: minValue ? parseFloat(minValue as string) : 0.05,
        maxEvents: maxEvents ? parseInt(maxEvents as string) : 20,
        autoCreateAlerts: autoCreateAlerts === 'true',
      });

      res.json({
        success: true,
        data: valueBets,
        count: valueBets.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Scan all sports for value bets
   * GET /api/value-bet-detection/scan-all
   */
  async scanAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { minValue, maxEvents, autoCreateAlerts } = req.query;

      const valueBets = await valueBetDetectionService.scanAllSports({
        minValue: minValue ? parseFloat(minValue as string) : 0.05,
        maxEvents: maxEvents ? parseInt(maxEvents as string) : 20,
        autoCreateAlerts: autoCreateAlerts === 'true',
      });

      res.json({
        success: true,
        data: valueBets,
        count: valueBets.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const valueBetDetectionController = new ValueBetDetectionController();





