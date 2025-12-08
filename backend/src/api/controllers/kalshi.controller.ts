import { Request, Response, NextFunction } from 'express';
import { getKalshiService } from '../../services/integrations/kalshi.service';
import { AppError } from '../../middleware/errorHandler';

class KalshiController {
  async getExchangeStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      const kalshi = getKalshiService();
      if (!kalshi) {
        throw new AppError('Kalshi service not configured', 503);
      }

      const status = await kalshi.getExchangeStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  async getSeries(_req: Request, res: Response, next: NextFunction) {
    try {
      const kalshi = getKalshiService();
      if (!kalshi) {
        throw new AppError('Kalshi service not configured', 503);
      }

      const series = await kalshi.getSeries();
      res.json({ success: true, data: series });
    } catch (error) {
      next(error);
    }
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const kalshi = getKalshiService();
      if (!kalshi) {
        throw new AppError('Kalshi service not configured', 503);
      }

      const { series_ticker, category, limit, search } = req.query;
      
      let events;
      if (search) {
        events = await kalshi.searchEvents(search as string, limit ? parseInt(limit as string) : 20);
      } else if (category) {
        events = await kalshi.getEventsByCategory(category as string, limit ? parseInt(limit as string) : 50);
      } else {
        events = await kalshi.getEvents(series_ticker as string, limit ? parseInt(limit as string) : 50);
      }

      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async getEventMarkets(req: Request, res: Response, next: NextFunction) {
    try {
      const kalshi = getKalshiService();
      if (!kalshi) {
        throw new AppError('Kalshi service not configured', 503);
      }

      const { eventTicker } = req.params;
      const markets = await kalshi.getEventMarkets(eventTicker);

      res.json({ success: true, data: markets });
    } catch (error) {
      next(error);
    }
  }

  async getMarketDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const kalshi = getKalshiService();
      if (!kalshi) {
        throw new AppError('Kalshi service not configured', 503);
      }

      const { marketTicker } = req.params;
      const market = await kalshi.getMarketDetails(marketTicker);

      if (!market) {
        throw new AppError('Market not found', 404);
      }

      // Include probability conversion
      const probability = kalshi.getMarketProbability(market);

      res.json({
        success: true,
        data: {
          ...market,
          probability,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrendingMarkets(req: Request, res: Response, next: NextFunction) {
    try {
      const kalshi = getKalshiService();
      if (!kalshi) {
        throw new AppError('Kalshi service not configured', 503);
      }

      const { limit } = req.query;
      const markets = await kalshi.getTrendingMarkets(limit ? parseInt(limit as string) : 20);

      res.json({ success: true, data: markets });
    } catch (error) {
      next(error);
    }
  }

  async compareWithML(req: Request, res: Response, next: NextFunction) {
    try {
      const kalshi = getKalshiService();
      if (!kalshi) {
        throw new AppError('Kalshi service not configured', 503);
      }

      const { eventTicker, marketTicker } = req.params;
      const { mlProbability } = req.body;

      if (!mlProbability || mlProbability < 0 || mlProbability > 1) {
        throw new AppError('mlProbability must be between 0 and 1', 400);
      }

      const comparison = await kalshi.compareWithMLPrediction(
        eventTicker,
        marketTicker,
        mlProbability
      );

      res.json({ success: true, data: comparison });
    } catch (error) {
      next(error);
    }
  }
}

export const kalshiController = new KalshiController();

