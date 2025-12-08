import { Response, NextFunction } from 'express';
import { riskService } from '../../services/risk.service';
import { AuthRequest } from '../../middleware/auth';

class RiskController {
  async getRiskDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await riskService.getRiskDashboard();
      res.json({ success: true, data: dashboard });
    } catch (error) {
      next(error);
    }
  }

  async getEventExposure(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const exposure = await riskService.getEventExposure(eventId);
      res.json({ success: true, data: exposure });
    } catch (error) {
      next(error);
    }
  }

  async adjustOdds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adjustment = req.body;
      const result = await riskService.adjustOdds(adjustment);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async suspendMarket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { marketId, reason } = req.body;
      const result = await riskService.suspendMarket(marketId, reason);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getFraudAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { limit, severity } = req.query;
      const alerts = await riskService.getFraudAlerts({
        limit: limit ? parseInt(limit as string) : 50,
        severity: severity as string,
      });
      res.json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }
}

export const riskController = new RiskController();

