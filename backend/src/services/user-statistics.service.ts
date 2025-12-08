import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { externalBetsService } from './external-bets.service';

class UserStatisticsService {
  /**
   * Calculate and store user statistics for a period
   */
  async calculateUserStatistics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  ) {
    try {
      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date | null = null;

      if (period === 'daily') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
      } else if (period === 'weekly') {
        const dayOfWeek = now.getDay();
        periodStart = new Date(
          now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000
        );
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'monthly') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else {
        // all_time
        periodStart = new Date(0); // Beginning of time
        periodEnd = null;
      }

      // Get bets for the period
      const where: any = {
        userId,
        betPlacedAt: { gte: periodStart },
      };

      if (periodEnd) {
        where.betPlacedAt.lte = periodEnd;
      }

      const bets = await prisma.externalBet.findMany({
        where,
        include: {
          event: {
            include: {
              sport: true,
            },
          },
        },
      });

      // Calculate statistics
      const totalBets = bets.length;
      const totalWins = bets.filter((b) => b.status === 'WON').length;
      const totalLosses = bets.filter((b) => b.status === 'LOST').length;
      const totalVoids = bets.filter((b) => b.status === 'VOID').length;
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

      // By sport
      const statsBySport: Record<string, any> = {};
      bets.forEach((bet) => {
        const sport = bet.event?.sport?.name || 'Unknown';
        if (!statsBySport[sport]) {
          statsBySport[sport] = {
            bets: 0,
            wins: 0,
            losses: 0,
            staked: 0,
            won: 0,
            lost: 0,
          };
        }
        statsBySport[sport].bets++;
        if (bet.status === 'WON') {
          statsBySport[sport].wins++;
          statsBySport[sport].won += bet.actualWin || 0;
        } else if (bet.status === 'LOST') {
          statsBySport[sport].losses++;
          statsBySport[sport].lost += bet.stake;
        }
        statsBySport[sport].staked += bet.stake;
      });

      // Calculate ROI for each sport
      Object.keys(statsBySport).forEach((sport) => {
        const stats = statsBySport[sport];
        stats.roi =
          stats.staked > 0
            ? ((stats.won - stats.staked) / stats.staked) * 100
            : 0;
        stats.winRate = stats.bets > 0 ? (stats.wins / stats.bets) * 100 : 0;
      });

      // By platform
      const statsByPlatform: Record<string, any> = {};
      bets.forEach((bet) => {
        const platform = bet.platform;
        if (!statsByPlatform[platform]) {
          statsByPlatform[platform] = {
            bets: 0,
            wins: 0,
            losses: 0,
            staked: 0,
            won: 0,
            lost: 0,
          };
        }
        statsByPlatform[platform].bets++;
        if (bet.status === 'WON') {
          statsByPlatform[platform].wins++;
          statsByPlatform[platform].won += bet.actualWin || 0;
        } else if (bet.status === 'LOST') {
          statsByPlatform[platform].losses++;
          statsByPlatform[platform].lost += bet.stake;
        }
        statsByPlatform[platform].staked += bet.stake;
      });

      // Calculate ROI for each platform
      Object.keys(statsByPlatform).forEach((platform) => {
        const stats = statsByPlatform[platform];
        stats.roi =
          stats.staked > 0
            ? ((stats.won - stats.staked) / stats.staked) * 100
            : 0;
        stats.winRate = stats.bets > 0 ? (stats.wins / stats.bets) * 100 : 0;
      });

      // By market type
      const statsByMarket: Record<string, any> = {};
      bets.forEach((bet) => {
        const market = bet.marketType;
        if (!statsByMarket[market]) {
          statsByMarket[market] = {
            bets: 0,
            wins: 0,
            losses: 0,
            staked: 0,
            won: 0,
            lost: 0,
          };
        }
        statsByMarket[market].bets++;
        if (bet.status === 'WON') {
          statsByMarket[market].wins++;
          statsByMarket[market].won += bet.actualWin || 0;
        } else if (bet.status === 'LOST') {
          statsByMarket[market].losses++;
          statsByMarket[market].lost += bet.stake;
        }
        statsByMarket[market].staked += bet.stake;
      });

      // Calculate ROI for each market
      Object.keys(statsByMarket).forEach((market) => {
        const stats = statsByMarket[market];
        stats.roi =
          stats.staked > 0
            ? ((stats.won - stats.staked) / stats.staked) * 100
            : 0;
        stats.winRate = stats.bets > 0 ? (stats.wins / stats.bets) * 100 : 0;
      });

      // Value bets stats (from alerts)
      const valueBetAlerts = await prisma.valueBetAlert.findMany({
        where: {
          userId,
          betPlaced: true,
        },
        include: {
          externalBet: true,
        },
      });

      const valueBetsFound = valueBetAlerts.length;
      const valueBetsTaken = valueBetAlerts.filter((a) => a.betPlaced).length;
      const valueBetsWon = valueBetAlerts.filter(
        (a) => a.externalBet?.status === 'WON'
      ).length;

      const valueBetsStaked = valueBetAlerts
        .filter((a) => a.externalBet)
        .reduce((sum, a) => sum + (a.externalBet?.stake || 0), 0);
      const valueBetsWonAmount = valueBetAlerts
        .filter((a) => a.externalBet?.status === 'WON')
        .reduce((sum, a) => sum + (a.externalBet?.actualWin || 0), 0);
      const valueBetsROI =
        valueBetsStaked > 0
          ? ((valueBetsWonAmount - valueBetsStaked) / valueBetsStaked) * 100
          : 0;

      // Store or update statistics
      const statistics = await prisma.userStatistics.upsert({
        where: {
          userId_period_periodStart: {
            userId,
            period,
            periodStart,
          },
        },
        update: {
          totalBets,
          totalWins,
          totalLosses,
          totalVoids,
          totalStaked,
          totalWon,
          totalLost,
          netProfit,
          roi,
          winRate,
          statsBySport: statsBySport as any,
          statsByPlatform: statsByPlatform as any,
          statsByMarket: statsByMarket as any,
          valueBetsFound,
          valueBetsTaken,
          valueBetsWon,
          valueBetsROI,
          periodEnd,
          lastUpdated: new Date(),
        },
        create: {
          userId,
          period,
          periodStart,
          periodEnd,
          totalBets,
          totalWins,
          totalLosses,
          totalVoids,
          totalStaked,
          totalWon,
          totalLost,
          netProfit,
          roi,
          winRate,
          statsBySport: statsBySport as any,
          statsByPlatform: statsByPlatform as any,
          statsByMarket: statsByMarket as any,
          valueBetsFound,
          valueBetsTaken,
          valueBetsWon,
          valueBetsROI,
        },
      });

      return statistics;
    } catch (error: any) {
      logger.error('Error calculating user statistics:', error);
      throw new AppError('Failed to calculate user statistics', 500);
    }
  }

  /**
   * Get user statistics for a period
   */
  async getUserStatistics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  ) {
    const now = new Date();
    let periodStart: Date;

    if (period === 'daily') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      const dayOfWeek = now.getDay();
      periodStart = new Date(
        now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000
      );
      periodStart.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      periodStart = new Date(0);
    }

    let statistics = await prisma.userStatistics.findUnique({
      where: {
        userId_period_periodStart: {
          userId,
          period,
          periodStart,
        },
      },
    });

    // If not found or outdated, recalculate
    if (
      !statistics ||
      !statistics.lastUpdated ||
      now.getTime() - statistics.lastUpdated.getTime() > 5 * 60 * 1000 // 5 minutes
    ) {
      statistics = await this.calculateUserStatistics(userId, period);
    }

    return statistics;
  }
}

export const userStatisticsService = new UserStatisticsService();

