import { Response, NextFunction } from 'express';
import { oddsService } from '../../services/odds.service';
import { oddsComparisonService } from '../../services/odds-comparison.service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';

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
      const { startDate, endDate, limit, marketId, selection, hours } = req.query;
      
      // Si se proporciona 'hours', calcular startDate automáticamente
      let calculatedStartDate = startDate;
      if (hours && !startDate) {
        const hoursNum = parseInt(hours as string, 10);
        if (!isNaN(hoursNum) && hoursNum > 0) {
          const now = new Date();
          calculatedStartDate = new Date(now.getTime() - hoursNum * 60 * 60 * 1000).toISOString();
        }
      }
      
      let history;
      if (marketId && selection) {
        // Get history for specific market and selection
        history = await prisma.oddsHistory.findMany({
          where: {
            eventId,
            marketId: marketId as string,
            selection: selection as string,
            ...(calculatedStartDate || endDate ? {
              timestamp: {
                ...(calculatedStartDate ? { gte: new Date(calculatedStartDate) } : {}),
                ...(endDate ? { lte: new Date(endDate as string) } : {}),
              },
            } : {}),
          },
          orderBy: {
            timestamp: 'asc', // Cambiado a 'asc' para mostrar evolución cronológica
          },
          take: limit ? parseInt(limit as string) : 1000, // Aumentado límite para gráficos
        });
      } else {
        // Get all history for event
        history = await oddsService.getOddsHistory(eventId, {
          startDate: calculatedStartDate as string,
          endDate: endDate as string,
          limit: limit ? parseInt(limit as string) : 1000,
        });
      }
      
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  async compareOddsFromAPI(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sport, eventId } = req.params;
      const { market } = req.query;

      // Fetch from The Odds API and update database
      const comparisons = await oddsComparisonService.fetchAndUpdateComparison(
        sport,
        eventId,
        (market as string) || 'h2h'
      );

      res.json({ success: true, data: comparisons });
    } catch (error) {
      next(error);
    }
  }
}

export const oddsController = new OddsController();

