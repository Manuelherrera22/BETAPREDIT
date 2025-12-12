import { Request, Response, NextFunction } from 'express';
import { getTheOddsAPIService } from '../../services/integrations/the-odds-api.service';
import { AppError } from '../../middleware/errorHandler';

class TheOddsAPIController {
  async getSports(_req: Request, res: Response, next: NextFunction) {
    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        throw new AppError('The Odds API service not configured', 503);
      }

      const sports = await theOddsAPI.getSports();
      res.json({ success: true, data: sports });
    } catch (error) {
      next(error);
    }
  }

  async getOdds(req: Request, res: Response, next: NextFunction) {
    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        throw new AppError('The Odds API service not configured', 503);
      }

      const { sport } = req.params;
      const { regions, markets, oddsFormat, sync } = req.query;

      const odds = await theOddsAPI.getOdds(sport, {
        regions: regions ? (regions as string).split(',') : undefined,
        markets: markets ? (markets as string).split(',') : undefined,
        oddsFormat: oddsFormat as 'decimal' | 'american' | undefined,
      });

      // Sincronizar eventos a Supabase si se solicita
      if (sync === 'true' && Array.isArray(odds)) {
        try {
          const { eventSyncService } = await import('../../services/event-sync.service');
          await eventSyncService.syncEventsFromOddsData(odds);
        } catch (syncError: any) {
          // No fallar si la sincronización falla, solo loguear
          logger.warn('Failed to sync events:', { error: syncError.message });
        }
      }

      res.json({ success: true, data: odds });
    } catch (error) {
      next(error);
    }
  }

  async compareOdds(req: Request, res: Response, next: NextFunction) {
    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        throw new AppError('The Odds API service not configured', 503);
      }

      const { sport, eventId } = req.params;
      const { market, save } = req.query;

      const comparison = await theOddsAPI.compareOdds(
        sport,
        eventId,
        (market as string) || 'h2h'
      );

      if (!comparison) {
        throw new AppError('Event not found', 404);
      }

      // Guardar comparación en Supabase si se solicita
      if (save === 'true') {
        try {
          const { oddsComparisonService } = await import('../../services/odds-comparison.service');
          await oddsComparisonService.fetchAndUpdateComparison(
            sport,
            eventId,
            (market as string) || 'h2h'
          );
        } catch (saveError: any) {
          // No fallar si el guardado falla, solo loguear
          logger.warn('Failed to save comparison:', { error: saveError.message });
        }
      }

      res.json({ success: true, data: comparison });
    } catch (error) {
      next(error);
    }
  }

  async detectValueBets(req: Request, res: Response, next: NextFunction) {
    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        throw new AppError('The Odds API service not configured', 503);
      }

      const { sport, eventId } = req.params;
      const { predictedProbabilities, minValue } = req.body;

      if (!predictedProbabilities || typeof predictedProbabilities !== 'object') {
        throw new AppError('predictedProbabilities is required and must be an object', 400);
      }

      const valueBets = await theOddsAPI.detectValueBets(
        sport,
        eventId,
        predictedProbabilities,
        minValue || 0.05
      );

      res.json({ success: true, data: valueBets });
    } catch (error) {
      next(error);
    }
  }

  async searchEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        throw new AppError('The Odds API service not configured', 503);
      }

      const { sport } = req.params;
      const { team } = req.query;

      if (!team) {
        throw new AppError('team query parameter is required', 400);
      }

      const events = await theOddsAPI.searchEvents(sport, team as string);
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }
}

export const theOddsAPIController = new TheOddsAPIController();

