/**
 * ROI Tracking Service
 * Calcula ROI real de usuarios y comparaciones antes/después de usar BETAPREDIT
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface ROITrackingData {
  totalROI: number;
  valueBetsROI: number;
  normalBetsROI: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalStaked: number;
  totalWon: number;
  netProfit: number;
  comparison?: {
    before: number | null;
    after: number;
    improvement: number;
    betsBefore: number;
    betsAfter: number;
  };
  valueBetsMetrics: {
    taken: number;
    won: number;
    lost: number;
    winRate: number;
    roi: number;
    totalStaked: number;
    totalWon: number;
    netProfit: number;
  };
}

class ROITrackingService {
  /**
   * Get comprehensive ROI tracking for a user
   */
  async getROITracking(
    userId: string,
    period?: 'week' | 'month' | 'year' | 'all_time'
  ): Promise<ROITrackingData> {
    try {
      const now = new Date();
      let startDate: Date | undefined;

      if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === 'year') {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      const where: any = {
        userId,
        status: { in: ['WON', 'LOST', 'VOID'] }, // Solo apuestas resueltas
      };

      if (startDate) {
        where.betPlacedAt = { gte: startDate };
      }

      // Get all resolved bets
      const allBets = await prisma.externalBet.findMany({
        where,
        include: {
          valueBetAlert: true, // Para identificar value bets
        },
      });

      // Separate value bets from normal bets
      const valueBets = allBets.filter((bet) => bet.valueBetAlert !== null);
      const normalBets = allBets.filter((bet) => bet.valueBetAlert === null);

      // Calculate total ROI
      const totalStats = this.calculateStats(allBets);
      const valueBetsStats = this.calculateStats(valueBets);
      const normalBetsStats = this.calculateStats(normalBets);

      // Get user's first bet date (when they started using BETAPREDIT)
      const firstBet = await prisma.externalBet.findFirst({
        where: { userId },
        orderBy: { registeredAt: 'asc' },
        select: { registeredAt: true },
      });

      let comparison = undefined;
      if (firstBet && period === 'all_time') {
        // Calculate comparison: before vs after using BETAPREDIT
        const firstBetDate = firstBet.registeredAt;

        // This is a simplified comparison - in reality, we'd need historical data
        // For now, we'll use the first bet date as the "start" point
        comparison = {
          before: null, // Would need historical data
          after: totalStats.roi,
          improvement: totalStats.roi, // Since we don't have "before" data yet
          betsBefore: 0,
          betsAfter: allBets.length,
        };
      }

      return {
        totalROI: totalStats.roi,
        valueBetsROI: valueBetsStats.roi,
        normalBetsROI: normalBetsStats.roi,
        totalBets: totalStats.totalBets,
        totalWins: totalStats.totalWins,
        totalLosses: totalStats.totalLosses,
        totalStaked: totalStats.totalStaked,
        totalWon: totalStats.totalWon,
        netProfit: totalStats.netProfit,
        comparison,
        valueBetsMetrics: {
          taken: valueBets.length,
          won: valueBetsStats.totalWins,
          lost: valueBetsStats.totalLosses,
          winRate: valueBetsStats.winRate,
          roi: valueBetsStats.roi,
          totalStaked: valueBetsStats.totalStaked,
          totalWon: valueBetsStats.totalWon,
          netProfit: valueBetsStats.netProfit,
        },
      };
    } catch (error: any) {
      logger.error('Error calculating ROI tracking:', error);
      throw new AppError('Failed to calculate ROI tracking', 500);
    }
  }

  /**
   * Calculate statistics from a list of bets
   */
  private calculateStats(bets: any[]) {
    const totalBets = bets.length;
    const totalWins = bets.filter((b) => b.status === 'WON').length;
    const totalLosses = bets.filter((b) => b.status === 'LOST').length;
    const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
    const totalWon = bets
      .filter((b) => b.status === 'WON' && b.actualWin)
      .reduce((sum, b) => sum + (b.actualWin || 0), 0);
    const totalLost = bets
      .filter((b) => b.status === 'LOST')
      .reduce((sum, b) => sum + b.stake, 0);
    const netProfit = totalWon - totalStaked;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;

    return {
      totalBets,
      totalWins,
      totalLosses,
      totalStaked,
      totalWon,
      totalLost,
      netProfit,
      roi,
      winRate,
    };
  }

  /**
   * Get ROI history over time (for charts)
   */
  async getROIHistory(
    userId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ) {
    try {
      const now = new Date();
      let intervalDays: number;
      let startDate: Date;

      if (period === 'week') {
        intervalDays = 1; // Daily
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        intervalDays = 7; // Weekly
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        intervalDays = 30; // Monthly
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      const history: Array<{
        date: string;
        roi: number;
        netProfit: number;
        bets: number;
      }> = [];

      // Get all bets in the period
      const bets = await prisma.externalBet.findMany({
        where: {
          userId,
          betPlacedAt: { gte: startDate },
          status: { in: ['WON', 'LOST', 'VOID'] },
        },
        orderBy: { betPlacedAt: 'asc' },
      });

      // Group by interval
      let currentDate = new Date(startDate);
      while (currentDate <= now) {
        const intervalEnd = new Date(
          currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000
        );

        const intervalBets = bets.filter(
          (bet) =>
            bet.betPlacedAt >= currentDate && bet.betPlacedAt < intervalEnd
        );

        const stats = this.calculateStats(intervalBets);

        history.push({
          date: currentDate.toISOString().split('T')[0],
          roi: stats.roi,
          netProfit: stats.netProfit,
          bets: stats.totalBets,
        });

        currentDate = intervalEnd;
      }

      return history;
    } catch (error: any) {
      logger.error('Error getting ROI history:', error);
      throw new AppError('Failed to get ROI history', 500);
    }
  }

  /**
   * Get top value bets by ROI
   */
  async getTopValueBets(userId: string, limit: number = 10) {
    try {
      const valueBets = await prisma.externalBet.findMany({
        where: {
          userId,
          valueBetAlert: { isNot: null },
          status: { in: ['WON', 'LOST'] },
        },
        include: {
          valueBetAlert: true,
          event: {
            include: {
              sport: true,
            },
          },
        },
        orderBy: { betPlacedAt: 'desc' },
        take: limit,
      });

      return valueBets.map((bet) => ({
        id: bet.id,
        event: bet.event
          ? `${bet.event.homeTeam} vs ${bet.event.awayTeam}`
          : 'Unknown',
        sport: bet.event?.sport?.name || 'Unknown',
        selection: bet.selection,
        odds: bet.odds,
        stake: bet.stake,
        result: bet.status,
        actualWin: bet.actualWin,
        roi: bet.status === 'WON' && bet.actualWin
          ? ((bet.actualWin - bet.stake) / bet.stake) * 100
          : bet.status === 'LOST'
          ? -100
          : 0,
        valuePercentage: bet.valueBetAlert?.valuePercentage || 0,
        betPlacedAt: bet.betPlacedAt,
      }));
    } catch (error: any) {
      logger.error('Error getting top value bets:', error);
      throw new AppError('Failed to get top value bets', 500);
    }
  }
}

export const roiTrackingService = new ROITrackingService();



