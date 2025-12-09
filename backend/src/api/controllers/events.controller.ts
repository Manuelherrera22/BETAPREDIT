import { Response, NextFunction } from 'express';
import { eventsService } from '../../services/events.service';
import { AuthRequest } from '../../middleware/auth';

class EventsController {
  async getLiveEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sportId, limit } = req.query;
      const events = await eventsService.getLiveEvents({
        sportId: sportId as string,
        limit: limit ? parseInt(limit as string) : 50,
      });
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sportId, date, limit, useTheOddsAPI } = req.query;
      const events = await eventsService.getUpcomingEvents({
        sportId: sportId as string,
        date: date as string,
        limit: limit ? parseInt(limit as string) : 50,
        useTheOddsAPI: useTheOddsAPI !== 'false', // Default to true
      });
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async getEventDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const event = await eventsService.getEventDetails(eventId);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async getEventsBySport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sportId } = req.params;
      const { status, limit } = req.query;
      const events = await eventsService.getEventsBySport(sportId, {
        status: status as string,
        limit: limit ? parseInt(limit as string) : 50,
      });
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async searchEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query } = req.params;
      const { limit } = req.query;
      const events = await eventsService.searchEvents(query, {
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async syncEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sportKey } = req.body;
      const { eventSyncService } = await import('../../services/event-sync.service');
      
      if (sportKey) {
        // Sync specific sport
        const synced = await eventSyncService.syncSportEvents(sportKey);
        res.json({ 
          success: true, 
          message: `Synced ${synced.length} events for ${sportKey}`,
          data: { synced: synced.length, sportKey }
        });
      } else {
        // Sync main sports
        const mainSports = [
          'soccer_epl',
          'soccer_spain_la_liga',
          'soccer_italy_serie_a',
          'basketball_nba',
          'americanfootball_nfl',
          'icehockey_nhl',
        ];
        
        let totalSynced = 0;
        const results: any[] = [];
        
        for (const sport of mainSports) {
          try {
            const synced = await eventSyncService.syncSportEvents(sport);
            totalSynced += synced.length;
            results.push({ sport, count: synced.length });
          } catch (error: any) {
            results.push({ sport, error: error.message });
          }
        }
        
        res.json({ 
          success: true, 
          message: `Synced ${totalSynced} total events`,
          data: { totalSynced, results }
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

export const eventsController = new EventsController();

