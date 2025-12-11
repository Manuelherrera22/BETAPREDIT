/**
 * Platform Metrics Service
 * Calculates platform-wide statistics for social proof
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

interface PlatformMetrics {
  valueBetsFoundToday: number;
  activeUsers: number;
  averageROI: number;
  averageAccuracy: number;
  totalValueBetsFound: number;
  totalUsers: number;
  trends: {
    valueBetsChange: string;
    usersChange: string;
    roiChange: string;
    accuracyChange: string;
  };
}

class PlatformMetricsService {
  /**
   * Get platform-wide metrics
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(todayStart.getTime() - 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Value bets found today
      const valueBetsToday = await prisma.valueBetAlert.count({
        where: {
          createdAt: { gte: todayStart },
          status: 'ACTIVE',
        },
      });

      // Value bets found yesterday (for comparison)
      const valueBetsYesterday = await prisma.valueBetAlert.count({
        where: {
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          status: 'ACTIVE',
        },
      });

      // Total value bets found
      const totalValueBets = await prisma.valueBetAlert.count({
        where: {
          status: { in: ['ACTIVE', 'TAKEN', 'EXPIRED'] },
        },
      });

      // Active users (users who logged in in last 7 days or have bets in last 7 days)
      // Optimized: use count instead of findMany to avoid N+1
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const [usersWithRecentLogin, usersWithRecentBets] = await Promise.all([
        prisma.user.count({
          where: {
            lastLoginAt: { gte: sevenDaysAgo },
          },
        }),
        prisma.user.count({
          where: {
            externalBets: {
              some: {
                registeredAt: { gte: sevenDaysAgo },
              },
            },
          },
        }),
      ]);
      
      // Get unique count (users who either logged in OR placed bets)
      const uniqueActiveUsers = await prisma.user.count({
        where: {
          OR: [
            { lastLoginAt: { gte: sevenDaysAgo } },
            {
              externalBets: {
                some: {
                  registeredAt: { gte: sevenDaysAgo },
                },
              },
            },
          ],
        },
      });
      const activeUsers = uniqueActiveUsers;

      // Total users
      const totalUsers = await prisma.user.count();

      // Calculate average ROI from resolved bets
      const resolvedBets = await prisma.externalBet.findMany({
        where: {
          status: { in: ['WON', 'LOST'] },
          betPlacedAt: { gte: thisMonthStart },
        },
        select: {
          stake: true,
          actualWin: true,
          status: true,
        },
      });

      let totalStaked = 0;
      let totalWon = 0;
      resolvedBets.forEach((bet) => {
        totalStaked += bet.stake;
        if (bet.status === 'WON' && bet.actualWin) {
          totalWon += bet.actualWin;
        }
      });

      const averageROI = totalStaked > 0 ? ((totalWon - totalStaked) / totalStaked) * 100 : 0;

      // Calculate average accuracy from predictions (if we have predictions)
      // For now, we'll use win rate as a proxy
      const totalResolved = resolvedBets.length;
      const totalWins = resolvedBets.filter((b) => b.status === 'WON').length;
      const averageAccuracy = totalResolved > 0 ? (totalWins / totalResolved) * 100 : 0;

      // Calculate trends (compare this month vs last month)
      const lastMonthBets = await prisma.externalBet.findMany({
        where: {
          status: { in: ['WON', 'LOST'] },
          betPlacedAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
        select: {
          stake: true,
          actualWin: true,
          status: true,
        },
      });

      let lastMonthStaked = 0;
      let lastMonthWon = 0;
      lastMonthBets.forEach((bet) => {
        lastMonthStaked += bet.stake;
        if (bet.status === 'WON' && bet.actualWin) {
          lastMonthWon += bet.actualWin;
        }
      });

      const lastMonthROI = lastMonthStaked > 0 ? ((lastMonthWon - lastMonthStaked) / lastMonthStaked) * 100 : 0;
      const roiChange = averageROI - lastMonthROI;

      // Active users last month
      const lastMonthUsersWithActivity = await prisma.user.findMany({
        where: {
          OR: [
            { lastLoginAt: { gte: new Date(lastMonthStart.getTime() - 7 * 24 * 60 * 60 * 1000), lt: thisMonthStart } },
            {
              externalBets: {
                some: {
                  registeredAt: { gte: lastMonthStart, lt: thisMonthStart },
                },
              },
            },
          ],
        },
        select: { id: true },
      });
      const lastMonthActiveUsers = lastMonthUsersWithActivity.length;
      const usersChange = activeUsers - lastMonthActiveUsers;

      // Value bets last month
      const valueBetsLastMonth = await prisma.valueBetAlert.count({
        where: {
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
          status: 'ACTIVE',
        },
      });
      const valueBetsChange = valueBetsToday - valueBetsLastMonth;

      // Accuracy last month
      const lastMonthTotal = lastMonthBets.length;
      const lastMonthWins = lastMonthBets.filter((b) => b.status === 'WON').length;
      const lastMonthAccuracy = lastMonthTotal > 0 ? (lastMonthWins / lastMonthTotal) * 100 : 0;
      const accuracyChange = averageAccuracy - lastMonthAccuracy;

      return {
        valueBetsFoundToday: valueBetsToday,
        activeUsers,
        averageROI: Math.round(averageROI * 10) / 10, // Round to 1 decimal
        averageAccuracy: Math.round(averageAccuracy * 10) / 10,
        totalValueBetsFound: totalValueBets,
        totalUsers,
        trends: {
          valueBetsChange: valueBetsChange > 0 ? `+${valueBetsChange} vs mes anterior` : `${valueBetsChange} vs mes anterior`,
          usersChange: usersChange > 0 ? `+${usersChange} este mes` : `${usersChange} este mes`,
          roiChange: roiChange > 0 ? `+${Math.round(roiChange * 10) / 10}% vs mes anterior` : `${Math.round(roiChange * 10) / 10}% vs mes anterior`,
          accuracyChange: accuracyChange > 0 ? `+${Math.round(accuracyChange * 10) / 10}%` : `${Math.round(accuracyChange * 10) / 10}%`,
        },
      };
    } catch (error: any) {
      logger.error('Error calculating platform metrics:', error);
      throw new AppError('Failed to calculate platform metrics', 500);
    }
  }
}

export const platformMetricsService = new PlatformMetricsService();

