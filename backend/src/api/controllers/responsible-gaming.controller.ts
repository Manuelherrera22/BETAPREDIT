import { Response, NextFunction } from 'express';
import { rgService } from '../../services/responsible-gaming.service';
import { AuthRequest } from '../../middleware/auth';

class ResponsibleGamingController {
  async getRGStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const status = await rgService.getRGStatus(userId);
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  async setDepositLimit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { amount, period } = req.body;
      const result = await rgService.setDepositLimit(userId, amount, period);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async setLossLimit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { amount, period } = req.body;
      const result = await rgService.setLossLimit(userId, amount, period);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async setSessionLimit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { minutes } = req.body;
      const result = await rgService.setSessionLimit(userId, minutes);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async requestSelfExclusion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { period, reason } = req.body;
      const result = await rgService.requestSelfExclusion(userId, period, reason);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getRGAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const alerts = await rgService.getRGAlerts(userId);
      res.json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }
}

export const rgController = new ResponsibleGamingController();

