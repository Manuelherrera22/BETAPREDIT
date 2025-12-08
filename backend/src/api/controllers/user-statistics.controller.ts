import { Request, Response, NextFunction } from 'express';
import { userStatisticsService } from '../../services/user-statistics.service';

class UserStatisticsController {
  async getMyStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { period } = req.query;
      const stats = await userStatisticsService.getUserStatistics(
        userId,
        (period as 'daily' | 'weekly' | 'monthly' | 'all_time') || 'all_time'
      );

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async recalculateStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { period } = req.body;
      const stats = await userStatisticsService.calculateUserStatistics(
        userId,
        period || 'all_time'
      );

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getStatisticsBySport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { period } = req.query;
      const periodType = (period as 'daily' | 'weekly' | 'monthly' | 'all_time') || 'all_time';
      
      const stats = await userStatisticsService.getUserStatistics(userId, periodType);
      
      res.json({ 
        success: true, 
        data: stats?.statsBySport || {} 
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatisticsByPlatform(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { period } = req.query;
      const periodType = (period as 'daily' | 'weekly' | 'monthly' | 'all_time') || 'all_time';
      
      const stats = await userStatisticsService.getUserStatistics(userId, periodType);
      
      res.json({ 
        success: true, 
        data: stats?.statsByPlatform || {} 
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userStatisticsController = new UserStatisticsController();

