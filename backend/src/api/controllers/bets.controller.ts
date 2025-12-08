import { Response, NextFunction } from 'express';
import { betsService } from '../../services/bets.service';
import { AuthRequest } from '../../middleware/auth';

class BetsController {
  async placeBet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const betData = req.body;
      const bet = await betsService.placeBet(userId, betData);
      res.status(201).json({ success: true, data: bet });
    } catch (error) {
      next(error);
    }
  }

  async getMyBets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { status, limit, offset } = req.query;
      const bets = await betsService.getUserBets(userId, {
        status: status as string,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      });
      res.json({ success: true, data: bets });
    } catch (error) {
      next(error);
    }
  }

  async getBetDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { betId } = req.params;
      const bet = await betsService.getBetDetails(betId, userId);
      res.json({ success: true, data: bet });
    } catch (error) {
      next(error);
    }
  }

  async cancelBet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { betId } = req.params;
      const result = await betsService.cancelBet(betId, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getBetHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const filters = req.query;
      const history = await betsService.getBetHistory(userId, filters);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
}

export const betsController = new BetsController();

