import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { userStatisticsService } from '../../services/user-statistics.service';
import { logger } from '../../utils/logger';

class UserStatisticsController {
  async getMyStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
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

  async recalculateStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
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

  async getStatisticsBySport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
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
      logger.error('Error in getStatisticsBySport:', error);
      res.json({ 
        success: true, 
        data: {} 
      });
    }
  }

  async getStatisticsByPlatform(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
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
      logger.error('Error in getStatisticsByPlatform:', error);
      res.json({ 
        success: true, 
        data: {} 
      });
    }
  }
}

export const userStatisticsController = new UserStatisticsController();

