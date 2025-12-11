import { Request, Response, NextFunction } from 'express';
import { externalBetsService } from '../../services/external-bets.service';

class ExternalBetsController {
  async registerBet(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const bet = await externalBetsService.registerBet(userId, req.body);
      res.status(201).json({ success: true, data: bet });
    } catch (error) {
      next(error);
    }
  }

  async getMyBets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { status, platform, limit, offset, startDate, endDate } = req.query;
      const bets = await externalBetsService.getUserBets(userId, {
        status: status as string,
        platform: platform as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({ success: true, data: bets });
    } catch (error) {
      next(error);
    }
  }

  async updateBetResult(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { betId } = req.params;
      const { result, actualWin } = req.body;

      const bet = await externalBetsService.updateBetResult(
        betId,
        userId,
        result,
        actualWin
      );
      res.json({ success: true, data: bet });
    } catch (error) {
      next(error);
    }
  }

  async getBetStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { period } = req.query;
      const stats = await externalBetsService.getUserBetStats(
        userId,
        (period as 'week' | 'month' | 'year' | 'all') || 'all'
      );
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async deleteBet(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { betId } = req.params;
      await externalBetsService.deleteBet(betId, userId);
      res.json({ success: true, message: 'Bet deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const externalBetsController = new ExternalBetsController();



