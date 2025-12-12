import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { valueBetAlertsService } from '../../services/value-bet-alerts.service';

class ValueBetAlertsController {
  async getMyAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { minValue, sportId, limit, offset } = req.query;
      const alerts = await valueBetAlertsService.getUserAlerts(userId, {
        minValue: minValue ? parseFloat(minValue as string) : undefined,
        sportId: sportId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }

  async markAsClicked(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { alertId } = req.params;

      const alert = await valueBetAlertsService.markAsClicked(alertId, userId);
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  async markAsTaken(req: Request, res: Response, next: NextFunction) {
    try {
      const { alertId } = req.params;
      const { externalBetId } = req.body;

      const alert = await valueBetAlertsService.markAsTaken(alertId, externalBetId);
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  async getAlertStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const stats = await valueBetAlertsService.getUserAlertStats(userId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const valueBetAlertsController = new ValueBetAlertsController();




