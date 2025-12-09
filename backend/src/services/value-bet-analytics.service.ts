/**
 * Value Bet Analytics Service
 * Tracks and analyzes value bet performance
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

interface ValueBetAnalytics {
  totalDetected: number;
  totalTaken: number;
  totalExpired: number;
  totalInvalid: number;
  averageValue: number;
  highestValue: number;
  successRate: number; // Based on bets placed and won
  totalExpectedValue: number;
  bySport: Record<string, {
    detected: number;
    taken: number;
    averageValue: number;
  }>;
  byTimePeriod: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

class ValueBetAnalyticsService {
  /**
   * Get analytics for value bets
   */
  async getAnalytics(userId?: string, options: {
    startDate?: Date;
    endDate?: Date;
    sport?: string;
  } = {}): Promise<ValueBetAnalytics> {
    try {
      const { startDate, endDate, sport } = options;

      const where: any = {};
      if (userId) {
        where.userId = userId;
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }
      if (sport) {
        where.event = { sport: { slug: sport } };
      }

      // Get all value bet alerts
      const alerts = await prisma.valueBetAlert.findMany({
        where,
        include: {
          event: {
            include: {
              sport: true,
            },
          },
          externalBet: {
            include: {
              result: true,
            },
          },
        },
      });

      // Calculate analytics
      const totalDetected = alerts.length;
      const totalTaken = alerts.filter(a => a.status === 'TAKEN').length;
      const totalExpired = alerts.filter(a => a.status === 'EXPIRED').length;
      const totalInvalid = alerts.filter(a => a.status === 'INVALID').length;

      const valuePercentages = alerts.map(a => a.valuePercentage);
      const averageValue = valuePercentages.length > 0
        ? valuePercentages.reduce((sum, val) => sum + val, 0) / valuePercentages.length
        : 0;
      const highestValue = valuePercentages.length > 0
        ? Math.max(...valuePercentages)
        : 0;

      // Calculate success rate based on external bets with results
      const takenAlerts = alerts.filter(a => a.status === 'TAKEN' && a.externalBet);
      const wonBets = takenAlerts.filter(a => 
        a.externalBet?.result?.status === 'WON'
      ).length;
      const successRate = takenAlerts.length > 0
        ? (wonBets / takenAlerts.length) * 100
        : 0;

      const totalExpectedValue = alerts.reduce((sum, a) => sum + a.expectedValue, 0);

      // Group by sport
      const bySport: Record<string, any> = {};
      alerts.forEach(alert => {
        const sportName = alert.event?.sport?.name || 'Unknown';
        if (!bySport[sportName]) {
          bySport[sportName] = {
            detected: 0,
            taken: 0,
            totalValue: 0,
          };
        }
        bySport[sportName].detected++;
        if (alert.status === 'TAKEN') {
          bySport[sportName].taken++;
        }
        bySport[sportName].totalValue += alert.valuePercentage;
      });

      // Calculate averages for each sport
      Object.keys(bySport).forEach(sport => {
        bySport[sport].averageValue = bySport[sport].totalValue / bySport[sport].detected;
        delete bySport[sport].totalValue;
      });

      // Group by time period
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date(today);
      thisMonth.setMonth(thisMonth.getMonth() - 1);

      const byTimePeriod = {
        today: alerts.filter(a => new Date(a.createdAt) >= today).length,
        thisWeek: alerts.filter(a => new Date(a.createdAt) >= thisWeek).length,
        thisMonth: alerts.filter(a => new Date(a.createdAt) >= thisMonth).length,
      };

      return {
        totalDetected,
        totalTaken,
        totalExpired,
        totalInvalid,
        averageValue,
        highestValue,
        successRate,
        totalExpectedValue,
        bySport,
        byTimePeriod,
      };
    } catch (error: any) {
      logger.error('Error getting value bet analytics:', error);
      throw new AppError('Failed to get analytics', 500);
    }
  }

  /**
   * Track value bet outcome
   */
  async trackOutcome(alertId: string, outcome: 'WON' | 'LOST' | 'VOID') {
    try {
      const alert = await prisma.valueBetAlert.findUnique({
        where: { id: alertId },
        include: {
          externalBet: true,
        },
      });

      if (!alert) {
        throw new AppError('Alert not found', 404);
      }

      // Update alert with outcome
      await prisma.valueBetAlert.update({
        where: { id: alertId },
        data: {
          factors: {
            ...(alert.factors as any || {}),
            outcome,
            trackedAt: new Date().toISOString(),
          },
        },
      });

      logger.info(`Tracked outcome for alert ${alertId}: ${outcome}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error tracking outcome:', error);
      throw new AppError('Failed to track outcome', 500);
    }
  }

  /**
   * Get top value bets
   */
  async getTopValueBets(limit: number = 10, userId?: string) {
    try {
      const where: any = {
        status: { in: ['ACTIVE', 'TAKEN'] },
      };
      if (userId) {
        where.userId = userId;
      }

      const alerts = await prisma.valueBetAlert.findMany({
        where,
        include: {
          event: {
            include: {
              sport: true,
            },
          },
          market: true,
        },
        orderBy: {
          valuePercentage: 'desc',
        },
        take: limit,
      });

      return alerts;
    } catch (error: any) {
      logger.error('Error getting top value bets:', error);
      throw new AppError('Failed to get top value bets', 500);
    }
  }

  /**
   * Get value bet trends
   */
  async getTrends(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const alerts = await prisma.valueBetAlert.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
          valuePercentage: true,
          status: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group by day
      const trends: Record<string, {
        date: string;
        detected: number;
        averageValue: number;
        taken: number;
      }> = {};

      alerts.forEach(alert => {
        const date = new Date(alert.createdAt).toISOString().split('T')[0];
        if (!trends[date]) {
          trends[date] = {
            date,
            detected: 0,
            averageValue: 0,
            taken: 0,
            totalValue: 0,
          } as any;
        }
        trends[date].detected++;
        (trends[date] as any).totalValue += alert.valuePercentage;
        if (alert.status === 'TAKEN') {
          trends[date].taken++;
        }
      });

      // Calculate averages
      Object.keys(trends).forEach(date => {
        const trend = trends[date] as any;
        trend.averageValue = trend.totalValue / trend.detected;
        delete trend.totalValue;
      });

      return Object.values(trends);
    } catch (error: any) {
      logger.error('Error getting trends:', error);
      throw new AppError('Failed to get trends', 500);
    }
  }
}

export const valueBetAnalyticsService = new ValueBetAnalyticsService();

