import { Request, Response, NextFunction } from 'express';
import { oddsService } from '../../services/odds.service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

class OddsController {
  async getEventOdds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const odds = await oddsService.getEventOdds(eventId);
      res.json({ success: true, data: odds });
    } catch (error) {
      next(error);
    }
  }

  async getMultipleEventsOdds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventIds } = req.body;
      if (!Array.isArray(eventIds)) {
        throw new AppError('eventIds must be an array', 400);
      }
      const odds = await oddsService.getMultipleEventsOdds(eventIds);
      res.json({ success: true, data: odds });
    } catch (error) {
      next(error);
    }
  }

  async getLiveOdds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const odds = await oddsService.getLiveOdds(eventId);
      res.json({ success: true, data: odds });
    } catch (error) {
      next(error);
    }
  }

  async getOddsHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const { startDate, endDate, limit } = req.query;
      const history = await oddsService.getOddsHistory(eventId, {
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : 100,
      });
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
}

export const oddsController = new OddsController();

