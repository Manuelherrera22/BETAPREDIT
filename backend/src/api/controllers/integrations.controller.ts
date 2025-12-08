import { Response, NextFunction } from 'express';
import { sportradarService } from '../../services/integrations/sportradar.service';
import { playerDataService } from '../../services/integrations/player-data.service';
import { predictiveAlgorithmsService } from '../../services/integrations/predictive-algorithms.service';
import { AuthRequest } from '../../middleware/auth';

class IntegrationsController {
  // Sportradar endpoints
  async getSportradarOdds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      if (!sportradarService) {
        return res.status(503).json({
          success: false,
          error: { message: 'Sportradar service not configured' },
        });
      }
      const odds = await sportradarService.getRealTimeOdds(eventId);
      res.json({ success: true, data: odds });
    } catch (error) {
      next(error);
    }
  }

  async getSportradarLiveEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!sportradarService) {
        return res.status(503).json({
          success: false,
          error: { message: 'Sportradar service not configured' },
        });
      }
      const { sportId } = req.query;
      const events = await sportradarService.getLiveEvents(sportId as string);
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async checkIntegrity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId, betPatterns } = req.body;
      if (!sportradarService) {
        return res.status(503).json({
          success: false,
          error: { message: 'Sportradar service not configured' },
        });
      }
      const alerts = await sportradarService.checkIntegrity(eventId, betPatterns);
      res.json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }

  // Player data endpoints
  async getPlayerTrackingData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const data = await playerDataService.getPlayerTrackingData(eventId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getMatchMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const metrics = await playerDataService.getMatchMetrics(eventId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  async getPlayerMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId, playerId } = req.params;
      const metrics = await playerDataService.getPlayerMetrics(eventId, playerId);
      if (!metrics) {
        return res.status(404).json({
          success: false,
          error: { message: 'Player metrics not found' },
        });
      }
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  // Predictive algorithms
  async getPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      const { eventId, includePlayerData, includeHistoricalData } = req.body;
      const predictions = await predictiveAlgorithmsService.getPredictions(provider, eventId, {
        includePlayerData,
        includeHistoricalData,
      });
      res.json({ success: true, data: predictions });
    } catch (error) {
      next(error);
    }
  }

  async getBetSizing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      const { eventId, bankroll } = req.body;
      const recommendation = await predictiveAlgorithmsService.getBetSizing(provider, eventId, bankroll);
      res.json({ success: true, data: recommendation });
    } catch (error) {
      next(error);
    }
  }

  async getValueBets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      const { eventId } = req.body;
      const valueBets = await predictiveAlgorithmsService.getValueBets(provider, eventId);
      res.json({ success: true, data: valueBets });
    } catch (error) {
      next(error);
    }
  }
}

export const integrationsController = new IntegrationsController();

