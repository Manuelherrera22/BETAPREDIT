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
      const { sportId, date, limit } = req.query;
      const events = await eventsService.getUpcomingEvents({
        sportId: sportId as string,
        date: date as string,
        limit: limit ? parseInt(limit as string) : 50,
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
}

export const eventsController = new EventsController();

